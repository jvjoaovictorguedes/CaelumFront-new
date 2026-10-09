import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { percentualParaTile, tileParaPercentual, chunksVisiveis, ESCALA_MUNDO } = require("@caelum/world-contracts");
const root = path.resolve(import.meta.dirname, "..");
test("Cliente consome a escala versionada e mantém o minimapa alinhado", () => {
  for (const [x, y] of [[50,50],[10,15],[16,22],[88,38],[75,75]]) {
    const tile = percentualParaTile(x,y); const percentual = tileParaPercentual(tile.x,tile.y);
    assert.ok(Math.abs(percentual.x-x)<0.00001 && Math.abs(percentual.y-y)<0.00001);
  }
  assert.deepEqual(ESCALA_MUNDO, { largura_tiles:400,altura_tiles:180,tile_px:32,chunk_tiles:32 });
});
test("Cinco mapas Tiled preservam a arte e bloqueiam a navegação não validada", () => {
  const base = path.join(root,"public/world/v1");
  assert.ok(fs.existsSync(path.join(base,"minimap.webp")));
  const source = fs.readFileSync(path.join(root,"public/images/map/map.webp"));
  const provenance = JSON.parse(fs.readFileSync(path.join(base,"provenance.json")));
  assert.equal(provenance.sha256,crypto.createHash("sha256").update(source).digest("hex"));
  for (const slug of ["capital","florestas","montanhas","planicies-arcanas","terras-devastadas"]) {
    const mapa=JSON.parse(fs.readFileSync(path.join(base,"maps",`${slug}.json`)));
    assert.equal(mapa.type,"map");assert.equal(mapa.infinite,true);assert.equal(mapa.width,400);assert.equal(mapa.height,180);assert.equal(mapa.tilewidth,32);
    assert.equal(mapa.properties.find(p=>p.name==="navegacao_habilitada").value,false);
    const layers=mapa.layers.filter(l=>l.type==="imagelayer"); assert.equal(layers.length,78);
    for(const layer of layers) {
      assert.ok(fs.existsSync(path.resolve(base,"maps",layer.image)));
      const preview=layer.properties.find(p=>p.name==="preview_image").value;
      assert.ok(fs.existsSync(path.resolve(base,"maps",preview)));
      assert.equal(layer.properties.find(p=>p.name==="preview_scale").value,4);
      assert.equal(layer.offsetx%1024,0);assert.equal(layer.offsety%1024,0);
    }
    assert.equal(mapa.layers.at(-1).objects[0].width,12800);
  }
});
test("Viewport não carrega todas as imagens e protocolo contém as chaves coordenadas", () => {
  assert.ok(chunksVisiveis({x:6000,y:2500,largura:1280,altura:720}).length<=20);
  const api=require("@caelum/world-contracts");
  assert.equal(api.EVENTOS_MUNDO.CONJURAR,"world:cast");assert.equal(api.VERSAO_PROTOCOLO,1);
});
