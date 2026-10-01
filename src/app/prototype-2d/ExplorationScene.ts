// src/app/prototype-2d/ExplorationScene.ts
//
// PROTÓTIPO EXPERIMENTAL — prova de conceito isolada de exploração 2D
// top-down (Phaser.js), pedida pra só validar a "sensação de andar
// pelo mapa" antes de decidir se vale integrar de verdade com a
// Aventura/zonas atuais. NUNCA importado por nenhuma tela real do
// jogo, sem link em nenhum menu — só acessível digitando a URL
// /prototype-2d direto.
//
// Personagem: reaproveita a spritesheet de verdade do Guerreiro
// (public/Knight_1/Walk.png e Idle.png — mesma pasta usada no combate
// da Aventura via PlayerSprite.tsx/spriteSheets.ts), em vez de um
// desenho placeholder. É arte de visão LATERAL (só vira pra
// esquerda/direita, espelhando a mesma folha — mesmo truque de `flip`
// já usado no combate), sem frames de "de costas"/"de frente" — então
// andar pra cima/baixo usa a mesma animação de caminhar sem trocar o
// espelhamento. É uma limitação conhecida e aceitável pra este teste:
// só valida a SENSAÇÃO de andar pelo mapa, a arte 4-direções de
// verdade (se o protótipo validar a ideia) é trabalho futuro separado.
//
// Tileset do chão continua placeholder (desenhado em runtime via
// Canvas Texture) — só o personagem usa asset real, por pedido.
import * as Phaser from "phaser";

const TILE = 32;
// Mapa BEM maior que a viewport do jogo (ver LARGURA/ALTURA em
// Explorer2DGame.tsx, 640x480) — de propósito, senão o mapa inteiro
// cabe numa tela só e não dá pra ver a câmera seguindo o personagem
// de verdade (critério #4 do escopo do protótipo).
const MAP_COLS = 50;
const MAP_ROWS = 40;

// 0 = grama (andável), 1 = parede/água (bloqueado) — único tipo
// bloqueado pedido no escopo do protótipo. Borda inteira bloqueada +
// alguns blocos sólidos espalhados, só pra ter algo visível de colidir
// com além da borda enquanto anda por um mapa grande.
function construirMapa(): number[][] {
  const linhas: number[][] = [];
  const blocos = [
    { x0: 9, x1: 11, y0: 6, y1: 8 },
    { x0: 20, x1: 24, y0: 15, y1: 16 },
    { x0: 30, x1: 31, y0: 25, y1: 30 },
    { x0: 38, x1: 42, y0: 10, y1: 12 },
  ];
  for (let y = 0; y < MAP_ROWS; y++) {
    const linha: number[] = [];
    for (let x = 0; x < MAP_COLS; x++) {
      const borda = x === 0 || y === 0 || x === MAP_COLS - 1 || y === MAP_ROWS - 1;
      const dentroDeAlgumBloco = blocos.some((b) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1);
      linha.push(borda || dentroDeAlgumBloco ? 1 : 0);
    }
    linhas.push(linha);
  }
  return linhas;
}

// Tamanho real de cada frame das folhas do Guerreiro (Knight_1) —
// Walk.png tem 1024x128 (8 frames de 128x128), Idle.png tem 512x128 (4
// frames). Mesmo valor que spriteSheets.ts já assume implicitamente
// pros outros personagens dessa mesma pasta.
const FRAME_SRC = 128;
// Escala pra caber num mapa de tiles de 32px sem ficar gigante —
// 128 * 0.4 = ~51px de altura, um pouco mais que 1 tile (efeito comum
// em RPG top-down: o personagem "pisa" no tile mas o corpo ultrapassa
// a célula visualmente).
const ESCALA_PERSONAGEM = 0.4;

export class ExplorationScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private teclasWASD!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private debugText!: Phaser.GameObjects.Text;

  constructor() {
    super("ExplorationScene");
  }

  preload() {
    this.gerarTilesetPlaceholder();

    // Mesma pasta/arquivos que o combate da Aventura usa pro Guerreiro
    // (ver spriteUrl em spriteSheets.ts: `/${pasta}/${arquivo}`) — vem
    // de public/Knight_1, servido estático pelo Next.js.
    this.load.spritesheet("knight-walk", "/Knight_1/Walk.png", {
      frameWidth: FRAME_SRC,
      frameHeight: FRAME_SRC,
    });
    this.load.spritesheet("knight-idle", "/Knight_1/Idle.png", {
      frameWidth: FRAME_SRC,
      frameHeight: FRAME_SRC,
    });
  }

  // Tileset de 2 frames (grama/parede) desenhado em runtime — Phaser
  // fatia a imagem em tiles de 32x32 automaticamente a partir da
  // largura/altura passadas em addTilesetImage, então só precisamos
  // desenhar os 2 quadrados lado a lado numa única textura.
  private gerarTilesetPlaceholder() {
    const textura = this.textures.createCanvas("tiles-placeholder", TILE * 2, TILE)!;
    const ctx = textura.getContext();

    // Frame 0 — grama (andável).
    ctx.fillStyle = "#3f7a3f";
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.strokeStyle = "#2d5a2d";
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      const px = 4 + (i * 7) % (TILE - 8);
      const py = 4 + ((i * 11) % (TILE - 8));
      ctx.moveTo(px, py + 4);
      ctx.lineTo(px, py);
      ctx.stroke();
    }

    // Frame 1 — parede/bloco (bloqueado).
    ctx.fillStyle = "#6b6b6b";
    ctx.fillRect(TILE, 0, TILE, TILE);
    ctx.strokeStyle = "#454545";
    ctx.lineWidth = 2;
    ctx.strokeRect(TILE + 2, 2, TILE - 4, TILE - 4);
    ctx.beginPath();
    ctx.moveTo(TILE + 4, TILE / 2);
    ctx.lineTo(TILE + TILE - 4, TILE / 2);
    ctx.moveTo(TILE + TILE / 2, 4);
    ctx.lineTo(TILE + TILE / 2, TILE - 4);
    ctx.stroke();

    textura.refresh();
  }

  create() {
    const dados = construirMapa();
    const mapa = this.make.tilemap({ data: dados, tileWidth: TILE, tileHeight: TILE });
    const tileset = mapa.addTilesetImage("tiles-placeholder", "tiles-placeholder", TILE, TILE);
    if (!tileset) return;
    const camada = mapa.createLayer(0, tileset, 0, 0);
    if (!camada) return;
    // Índice 1 (parede/água) é o único tile bloqueado do protótipo.
    camada.setCollision(1);

    const larguraMundo = MAP_COLS * TILE;
    const alturaMundo = MAP_ROWS * TILE;
    this.physics.world.setBounds(0, 0, larguraMundo, alturaMundo);

    this.anims.create({
      key: "knight-walk",
      frames: this.anims.generateFrameNumbers("knight-walk", { start: 0, end: 7 }),
      frameRate: 12,
      repeat: -1,
    });
    this.anims.create({
      key: "knight-idle",
      frames: this.anims.generateFrameNumbers("knight-idle", { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1,
    });

    // Spawn no meio do mapa, numa célula andável garantida (fora dos
    // blocos de teste). Origin (0.5, 1) ancora o sprite PELOS PÉS — o
    // x/y do personagem fica exatamente na célula onde ele "está",
    // mesmo a arte sendo mais alta que um tile.
    this.player = this.physics.add.sprite(3 * TILE + TILE / 2, 3 * TILE + TILE, "knight-idle", 0);
    this.player.setOrigin(0.5, 1);
    this.player.setScale(ESCALA_PERSONAGEM);
    this.player.setCollideWorldBounds(true);
    // Caixa de colisão pequena, centrada nos pés (em coordenadas da
    // textura ORIGINAL de 128x128 — setSize/setOffset trabalham antes
    // da escala do GameObject, o physics body escala junto sozinho).
    this.player.setSize(46, 40);
    this.player.setOffset((FRAME_SRC - 46) / 2, FRAME_SRC - 44);

    this.physics.add.collider(this.player, camada);

    this.cameras.main.setBounds(0, 0, larguraMundo, alturaMundo);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(1.6);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.teclasWASD = this.input.keyboard!.addKeys("W,A,S,D") as typeof this.teclasWASD;

    // HUD de debug (tile atual/tamanho do mapa) — só pra facilitar
    // testar/validar o protótipo. `scrollFactor(0)` sozinho NÃO basta
    // pra "grudar na tela": ele cancela o SCROLL da câmera principal,
    // mas o ZOOM dela (setZoom(1.6) acima) continua se aplicando a
    // tudo que ela desenha, inclusive um texto scrollFactor(0) —
    // empurrando/distorcendo o HUD pra fora da área visível. Fix
    // padrão do Phaser: uma câmera de UI separada, com zoom 1, que
    // ignora o mundo (tilemap/jogador) — e a câmera principal ignora o
    // HUD, pra não desenhar os dois ao mesmo tempo.
    this.debugText = this.add
      .text(4, 4, "", { fontSize: "12px", color: "#ffffff", backgroundColor: "#000000aa", padding: { x: 4, y: 2 } })
      .setScrollFactor(0)
      .setDepth(1000);

    const uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    uiCamera.setScroll(0, 0);
    uiCamera.ignore([camada, this.player]);
    this.cameras.main.ignore(this.debugText);
  }

  update() {
    if (!this.player) return;
    const velocidade = 140;
    const corpo = this.player.body as Phaser.Physics.Arcade.Body;

    const esquerda = this.cursors.left.isDown || this.teclasWASD.A.isDown;
    const direita = this.cursors.right.isDown || this.teclasWASD.D.isDown;
    const cima = this.cursors.up.isDown || this.teclasWASD.W.isDown;
    const baixo = this.cursors.down.isDown || this.teclasWASD.S.isDown;

    let vx = 0;
    let vy = 0;
    if (esquerda) vx -= 1;
    if (direita) vx += 1;
    if (cima) vy -= 1;
    if (baixo) vy += 1;

    if (vx !== 0 && vy !== 0) {
      // Normaliza diagonal pra não andar mais rápido na diagonal que
      // em linha reta.
      const fator = Math.SQRT1_2;
      vx *= fator;
      vy *= fator;
    }

    corpo.setVelocity(vx * velocidade, vy * velocidade);

    const emMovimento = vx !== 0 || vy !== 0;

    // Espelha pra esquerda/direita (mesmo truque de `flip` do combate)
    // — cima/baixo não têm arte própria, então só trocam a animação
    // (anda/parado) sem mexer no espelhamento atual.
    if (vx !== 0) this.player.setFlipX(vx < 0);

    if (emMovimento) {
      this.player.anims.play("knight-walk", true);
    } else {
      this.player.anims.play("knight-idle", true);
    }

    const tileX = Math.floor(this.player.x / TILE);
    const tileY = Math.floor(this.player.y / TILE);
    this.debugText.setText(
      `tile (${tileX}, ${tileY}) / mapa ${MAP_COLS}x${MAP_ROWS} / cam (${Math.round(this.cameras.main.scrollX)}, ${Math.round(this.cameras.main.scrollY)})`,
    );
  }
}
