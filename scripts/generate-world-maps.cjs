// Exportação determinística da ARTE OFICIAL, não geração de terreno.
// Tiled image layers preservam a geografia enquanto aguardamos tilesets top-down.
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const sharp = require("sharp");
const { ESCALA_MUNDO, tileParaPixel } = require("@caelum/world-contracts");
async function main() {
  const root = path.resolve(__dirname, "..");
  const source = path.join(root, "public/images/map/map.webp");
  const bytes = await fs.readFile(source);
  const origem = await sharp(bytes).metadata();
  const escala = ESCALA_MUNDO;
  const { x: width, y: height } = tileParaPixel(escala.largura_tiles, escala.altura_tiles);
  const passo = escala.chunk_tiles * escala.tile_px;
  const target = path.join(root, "public/world/v1");
  await fs.mkdir(path.join(target, "chunks"), { recursive: true });
  await fs.mkdir(path.join(target, "maps"), { recursive: true });
  await fs.mkdir(path.join(target, "preview"), { recursive: true });
  // Mesma transformação percentual para a arte e os pontos; não deslocar pins
  // para fazê-los parecer corretos. O formato 400x180 é definido pela missão.
  await sharp(bytes).resize(240, 108, { fit: "fill" }).webp({ quality: 85 }).toFile(path.join(target, "minimap.webp"));
  const resized = await sharp(bytes).resize(width, height, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
  const layers = [];
  for (let cy = 0; cy < Math.ceil(height / passo); cy++) {
    for (let cx = 0; cx < Math.ceil(width / passo); cx++) {
      const nome = `oficial-${cx}-${cy}.webp`;
      const area = { left: cx * passo, top: cy * passo, width: Math.min(passo, width - cx * passo), height: Math.min(passo, height - cy * passo) };
      const trecho = sharp(resized.data, { raw: resized.info }).extract(area);
      await trecho.clone().webp({ quality: 88 }).toFile(path.join(target, "chunks", nome));
      // A fonte oficial já é pequena. Upscaling não acrescenta detalhe:
      // o preview preserva a amostragem com 1/16 da memória de textura.
      await trecho.clone().resize(area.width / 4, area.height / 4).webp({ quality: 88 }).toFile(path.join(target, "preview", nome));
      layers.push({ id: layers.length + 1, name: `oficial-${cx}-${cy}`, type: "imagelayer", image: `../chunks/${nome}`, offsetx: cx * passo, offsety: cy * passo, opacity: 1, visible: true,
        properties: [{ name: "preview_image", type: "string", value: `../preview/${nome}` }, { name: "preview_scale", type: "int", value: 4 }] });
    }
  }
  for (const slug of ["capital", "florestas", "montanhas", "planicies-arcanas", "terras-devastadas"]) {
    const mapa = { type: "map", version: "1.10", tiledversion: "1.11.2", orientation: "orthogonal", renderorder: "right-down", infinite: true, width: escala.largura_tiles, height: escala.altura_tiles, tilewidth: escala.tile_px, tileheight: escala.tile_px, nextlayerid: layers.length + 2, nextobjectid: 2, tilesets: [],
      properties: [{ name: "slug", type: "string", value: slug }, { name: "fase", type: "int", value: 0 }, { name: "geografia_validada", type: "bool", value: false }, { name: "navegacao_habilitada", type: "bool", value: false }],
      layers: [...layers, { id: layers.length + 1, name: "colisao-pendente-validacao", type: "objectgroup", visible: false, opacity: 1, objects: [{ id: 1, name: "mundo-bloqueado-fase-0", type: "colisao", x: 0, y: 0, width, height, rotation: 0, visible: true, properties: [{ name: "bloqueado", type: "bool", value: true }] }] }] };
    await fs.writeFile(path.join(target, "maps", `${slug}.json`), JSON.stringify(mapa) + "\n");
  }
  await fs.writeFile(path.join(target, "provenance.json"), JSON.stringify({ source: "/images/map/map.webp", sha256: crypto.createHash("sha256").update(bytes).digest("hex"), source_width: origem.width, source_height: origem.height, escala, chunks: layers.length, preview_scale: 4, metodo: "Recorte da arte oficial; sem terreno procedural; mapas de território são shells globais sem navegação." }, null, 2) + "\n");
  console.log(`Exportados 5 mapas Tiled e ${layers.length} chunks da arte oficial.`);
}
main().catch(erro => { console.error(erro); process.exitCode = 1; });
