import * as Phaser from "phaser";
import { ESCALA_MUNDO, chunksVisiveis, tileParaPixel } from "@caelum/world-contracts";
import type { ManifestoMundo, MapaTiled } from "@/types/contracts/world";

// Fase 0: câmera cartográfica, sem personagem controlável ou mutações locais.
// A mesma arte é recortada offline; nenhum bioma/caminho é sorteado aqui.
export class WorldScene extends Phaser.Scene {
  private manifesto: ManifestoMundo;
  private camadas = new Map<string, MapaTiled["layers"][number]>();
  private imagens = new Map<string, Phaser.GameObjects.Image>();
  private carregando = new Set<string>();
  private falharam = new Set<string>();
  private necessarios = new Set<string>();
  private teclas?: Record<string, Phaser.Input.Keyboard.Key>;
  private arrasto?: { x: number; y: number; scrollX: number; scrollY: number };
  private ultimaBusca = -Infinity;
  private pronto = false;
  private limites?: Phaser.GameObjects.Graphics;
  constructor(manifesto: ManifestoMundo) { super("MundoFundacao"); this.manifesto = manifesto; }
  preload() {
    const mapa = this.manifesto.mapas.find(m => m.slug === "capital");
    this.load.json("capital-tiled", mapa?.tiled_url ?? "/world/v1/maps/capital.json");
    this.load.once("loaderror", () => this.game.events.emit("mundo:erro", "Não foi possível carregar o mapa. Recarregue a página."));
  }
  create() {
    const mapa = this.cache.json.get("capital-tiled") as MapaTiled | undefined;
    if (!mapa || mapa.type !== "map" || mapa.tilewidth !== ESCALA_MUNDO.tile_px || mapa.tileheight !== ESCALA_MUNDO.tile_px || mapa.height !== ESCALA_MUNDO.altura_tiles || mapa.width !== ESCALA_MUNDO.largura_tiles || mapa.height !== ESCALA_MUNDO.altura_tiles) {
      this.game.events.emit("mundo:erro", "O mapa está incompatível com esta versão. Recarregue após atualizar o jogo."); return;
    }
    for (const camada of mapa.layers.filter(c => c.type === "imagelayer" && c.image)) this.camadas.set(camada.name, camada);
    const tamanho = tileParaPixel(ESCALA_MUNDO.largura_tiles, ESCALA_MUNDO.altura_tiles);
    const camera = this.cameras.main;
    camera.setBounds(0, 0, tamanho.x, tamanho.y).setZoom(0.3).centerOn(this.manifesto.posicao.pixel.x, this.manifesto.posicao.pixel.y);
    this.teclas = this.input.keyboard?.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT", false) as Record<string, Phaser.Input.Keyboard.Key> | undefined;
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => { if (p.leftButtonDown()) this.arrasto = { x: p.x, y: p.y, scrollX: camera.scrollX, scrollY: camera.scrollY }; });
    this.input.on("pointerup", () => { this.arrasto = undefined; });
    this.input.on("gameout", () => { this.arrasto = undefined; });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (this.arrasto && p.isDown) camera.setScroll(this.arrasto.scrollX - (p.x - this.arrasto.x) / camera.zoom, this.arrasto.scrollY - (p.y - this.arrasto.y) / camera.zoom);
    });
    this.input.on("wheel", (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => camera.setZoom(Phaser.Math.Clamp(camera.zoom - dy * 0.001, 0.3, 1.5)));
    this.load.on("filecomplete", this.arquivoPronto, this);
    this.load.on("loaderror", this.arquivoFalhou, this);
    this.limites = this.add.graphics().setDepth(4).setVisible(false);
    for (const territorio of this.manifesto.territorios) {
      if (territorio.polygon_tile.length < 3) continue;
      this.limites.lineStyle(3, 0xffc66d, 0.9);
      this.limites.strokePoints(territorio.polygon_tile.map(p => { const pixel = tileParaPixel(p.x, p.y); return new Phaser.Geom.Point(pixel.x, pixel.y); }), true);
    }
    for (const ponto of this.manifesto.pontos) {
      const pixel = tileParaPixel(ponto.tile.x, ponto.tile.y);
      const pin = this.add.circle(pixel.x, pixel.y, ponto.tipo === "City" ? 13 : 8, ponto.tipo === "City" ? 0xffda80 : 0x89d1e7).setStrokeStyle(2, 0x191715).setDepth(5).setInteractive();
      pin.on("pointerdown", () => this.game.events.emit("mundo:ponto", ponto.nome));
      pin.on("pointerover", () => this.game.events.emit("mundo:ponto", ponto.nome));
    }
    const pixel = this.manifesto.posicao.pixel;
    this.add.circle(pixel.x, pixel.y, 5, 0xffffff).setStrokeStyle(2, 0x124858).setDepth(6);
    this.game.events.on("mundo:limites", this.alternarLimites, this);
    this.events.once("shutdown", () => {
      this.load.off("filecomplete", this.arquivoPronto, this);
      this.load.off("loaderror", this.arquivoFalhou, this);
      this.game.events.off("mundo:limites", this.alternarLimites, this);
      for (const [key, img] of this.imagens) { img.destroy(); this.textures.remove(key); }
      this.imagens.clear(); this.carregando.clear();
    });
  }
  private alternarLimites(visivel: boolean) { this.limites?.setVisible(visivel); }
  private arquivoPronto(key: string, type: string) {
    if (type !== "image" || !this.carregando.has(key)) return;
    this.carregando.delete(key);
    const camada = this.camadas.get(key);
    if (!camada || !this.necessarios.has(key)) { this.textures.remove(key); return; }
    this.imagens.set(key, this.add.image(camada.offsetx ?? 0, camada.offsety ?? 0, key).setOrigin(0).setScale(camada.properties?.find(p => p.name === "preview_scale")?.value === 4 ? 4 : 1).setDepth(0));
  }
  private arquivoFalhou(file: Phaser.Loader.File) {
    this.carregando.delete(file.key); this.falharam.add(file.key);
    this.game.events.emit("mundo:erro", "Um trecho do mapa não carregou. Recarregue a página para tentar novamente.");
  }
  update(time: number, delta: number) {
    if (!this.camadas.size) return;
    const camera = this.cameras.main;
    const t = this.teclas;
    const elemento = document.activeElement;
    const digitando = elemento instanceof HTMLElement && (elemento.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(elemento.tagName));
    if (t && !this.arrasto && !digitando) {
      const x = Number(t.D.isDown || t.RIGHT.isDown) - Number(t.A.isDown || t.LEFT.isDown);
      const y = Number(t.S.isDown || t.DOWN.isDown) - Number(t.W.isDown || t.UP.isDown);
      const norma = Math.hypot(x, y) || 1;
      camera.setScroll(camera.scrollX + x / norma * Math.min(delta, 50) * 0.8 / camera.zoom, camera.scrollY + y / norma * Math.min(delta, 50) * 0.8 / camera.zoom);
    }
    if (time - this.ultimaBusca < 100) return;
    this.ultimaBusca = time;
    const view = camera.worldView;
    const viewport = { x: view.x, y: view.y, largura: view.width, altura: view.height };
    const visiveis = chunksVisiveis(viewport, 0);
    // Primeiro quadro tem prioridade sobre prefetch fora da câmera.
    const wanted = chunksVisiveis(viewport, this.pronto ? 1 : 0);
    this.necessarios = new Set(wanted.map(c => `oficial-${c.x}-${c.y}`));
    for (const [key, image] of this.imagens) {
      if (!this.necessarios.has(key)) { image.destroy(); this.imagens.delete(key); this.textures.remove(key); }
    }
    if (!this.load.isLoading()) {
      for (const key of this.necessarios) {
        const camada = this.camadas.get(key);
        if (!camada?.image || this.imagens.has(key) || this.carregando.has(key) || this.falharam.has(key)) continue;
        this.carregando.add(key);
        // Caminho allowlisted no exportador; nunca aceitar URL remota do banco.
        const preview = camada.properties?.find(p => p.name === "preview_image")?.value;
        const imagem = typeof preview === "string" ? preview : camada.image;
        if (!/^\.\.\/(?:chunks|preview)\/oficial-\d+-\d+\.webp$/.test(imagem)) { this.carregando.delete(key); this.falharam.add(key); continue; }
        this.load.image(key, `/world/v1/${imagem.slice(3)}`);
      }
      if (this.carregando.size) this.load.start();
    }
    this.game.events.emit("mundo:metricas", { chunks_residentes: this.imagens.size, chunks_carregando: this.carregando.size });
    if (!this.pronto && visiveis.length && visiveis.every(c => this.imagens.has(`oficial-${c.x}-${c.y}`))) {
      this.pronto = true; this.game.events.emit("mundo:pronto");
    }
  }
}
