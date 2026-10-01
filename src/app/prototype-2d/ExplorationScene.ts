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
// Canvas Texture) — mapa ainda não tem arte final.
//
// Locais interativos (pedido do jogador: "se eu entrar no ferreiro
// ele vai pra forja") — pontos fixos no mapa que, ao serem tocados
// pelo personagem OU clicados, navegam pra rota real do jogo
// correspondente. Os ÍCONES já são os mesmos ícones de verdade do
// menu lateral do jogo (public/icons/...), não é mais placeholder —
// só o "selo" colorido atrás de cada um é gerado em runtime, pra dar
// contraste contra a grama.
import * as Phaser from "phaser";

interface LocalInterativo {
  chave: string;
  nome: string;
  rota: string;
  tileX: number;
  tileY: number;
  cor: number;
  iconeKey: string;
  iconeUrl: string;
}

// Mesmos ícones que o NavMenu real usa pra essas telas (ver
// src/app/dashboard/components/NavMenu.tsx) — Taverna reaproveita
// loja.png porque é o que o PRÓPRIO menu do jogo já faz hoje.
const LOCAIS_INTERATIVOS: LocalInterativo[] = [
  { chave: "ferreiro", nome: "Ferreiro", rota: "/dashboard/forge", tileX: 6, tileY: 12, cor: 0xb0462a, iconeKey: "icon-forja", iconeUrl: "/icons/ui/forja.png" },
  { chave: "loja", nome: "Loja", rota: "/dashboard/shop", tileX: 15, tileY: 5, cor: 0xc9a227, iconeKey: "icon-loja", iconeUrl: "/icons/loja.png" },
  { chave: "taverna", nome: "Taverna", rota: "/dashboard/tavern", tileX: 6, tileY: 22, cor: 0x8a5a2b, iconeKey: "icon-loja", iconeUrl: "/icons/loja.png" },
  { chave: "guilda", nome: "Guilda", rota: "/dashboard/guilds", tileX: 18, tileY: 22, cor: 0x2a6fb0, iconeKey: "icon-guildas", iconeUrl: "/icons/guildas.png" },
];

const TILE = 32;
// Mapa BEM maior que a viewport do jogo (ver LARGURA/ALTURA em
// Explorer2DGame.tsx) — de propósito, senão o mapa inteiro cabe numa
// tela só e não dá pra ver a câmera seguindo o personagem de verdade
// (critério #4 do escopo original do protótipo).
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

// Minimapa fixo no canto superior direito — tamanho mantém a mesma
// proporção do mapa (MAP_COLS:MAP_ROWS) pra não distorcer.
const MINIMAPA_LARGURA = 160;
const MINIMAPA_ALTURA = Math.round(MINIMAPA_LARGURA * (MAP_ROWS / MAP_COLS));
const MINIMAPA_MARGEM = 10;

export class ExplorationScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerDot!: Phaser.GameObjects.Arc;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private teclasWASD!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private debugText!: Phaser.GameObjects.Text;
  private mensagemEntrada!: Phaser.GameObjects.Text;
  private entrando = false;

  constructor() {
    super("ExplorationScene");
  }

  preload() {
    this.gerarTilesetPlaceholder();
    for (const local of LOCAIS_INTERATIVOS) this.gerarSeloLocal(local);

    // Ícones DE VERDADE do jogo (os mesmos arquivos que o menu lateral
    // usa) — carrega cada URL só uma vez mesmo que mais de um Local
    // reaproveite o mesmo ícone (ex.: Loja/Taverna).
    const iconesUnicos = new Map(LOCAIS_INTERATIVOS.map((l) => [l.iconeKey, l.iconeUrl]));
    for (const [key, url] of iconesUnicos) this.load.image(key, url);

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

  // "Selo" colorido atrás do ícone de um Local Interativo — só um
  // círculo com borda, pra dar contraste contra a grama e servir de
  // corpo físico pro overlap/clique. O ícone de verdade (imagem real)
  // é desenhado POR CIMA dele em create(), como um segundo GameObject.
  private gerarSeloLocal(local: LocalInterativo) {
    const chaveTextura = `selo-${local.chave}`;
    const textura = this.textures.createCanvas(chaveTextura, TILE, TILE)!;
    const ctx = textura.getContext();
    const cssCor = `#${local.cor.toString(16).padStart(6, "0")}`;

    ctx.fillStyle = cssCor;
    ctx.beginPath();
    ctx.arc(TILE / 2, TILE / 2, TILE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1a1410";
    ctx.lineWidth = 2;
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

    // Ponto que representa o personagem no minimapa — o sprite real é
    // detalhado demais pra ficar legível reduzido a alguns pixels, um
    // pontinho sólido se vê muito melhor lá. Some do jogo principal
    // (ignorado pela câmera main/UI) e só aparece via minimapCamera.
    // Raio BEM maior que o personagem de verdade em unidades de mundo —
    // de propósito: a câmera do minimapa usa zoom ~0.1 (ver
    // minimapCamera.setZoom abaixo), então um raio do tamanho "normal"
    // (5px de mundo) vira menos de 1px na tela e some. 40px de mundo ~
    // 4px na tela do minimapa, visível sem ficar gigante.
    this.playerDot = this.add
      .circle(this.player.x, this.player.y, 40, 0xffe066)
      .setStrokeStyle(6, 0x1a1410)
      .setDepth(2000);

    // Locais interativos — anda por cima (overlap) OU clica no ícone
    // pra entrar direto, igual pedido ("clicando e entrando no
    // lugar"). Cada um navega pra UMA rota real do jogo quando o
    // personagem "entra" nele (ver entrarNoLocal).
    const iconesDeLocais: Phaser.GameObjects.GameObject[] = [];
    const rotulosDeLocais: Phaser.GameObjects.GameObject[] = [];
    for (const local of LOCAIS_INTERATIVOS) {
      const px = local.tileX * TILE + TILE / 2;
      const py = local.tileY * TILE + TILE / 2;

      const selo = this.physics.add.staticImage(px, py, `selo-${local.chave}`);
      selo.setInteractive({ useHandCursor: true });
      selo.on("pointerdown", () => this.entrarNoLocal(local));

      const icone = this.add.image(px, py, local.iconeKey).setDisplaySize(TILE - 10, TILE - 10).setDepth(1);

      const rotulo = this.add
        .text(px, py - TILE / 2 - 4, local.nome, {
          fontSize: "11px",
          color: "#fff8e7",
          backgroundColor: "#000000aa",
          padding: { x: 3, y: 1 },
        })
        .setOrigin(0.5, 1);

      this.physics.add.overlap(this.player, selo, () => this.entrarNoLocal(local));
      iconesDeLocais.push(selo, icone);
      rotulosDeLocais.push(rotulo);
    }

    this.cameras.main.setBounds(0, 0, larguraMundo, alturaMundo);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(1.6);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.teclasWASD = this.input.keyboard!.addKeys("W,A,S,D") as typeof this.teclasWASD;

    // Helper de debug pro console do navegador — teleporta o
    // personagem direto num Local Interativo (ex.: `__proto2d.irPara("ferreiro")`)
    // pra testar a entrada sem precisar andar manualmente até lá.
    // Só existe nesta rota isolada/experimental, nunca no jogo real.
    (window as unknown as { __proto2d?: unknown }).__proto2d = {
      locais: LOCAIS_INTERATIVOS.map((l) => l.chave),
      irPara: (chave: string) => {
        const local = LOCAIS_INTERATIVOS.find((l) => l.chave === chave);
        if (!local) return false;
        this.player.setPosition(local.tileX * TILE + TILE / 2, local.tileY * TILE + TILE / 2);
        return true;
      },
    };

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

    // Mensagem central mostrada por um instante ANTES de navegar (dá
    // pro jogador ver o que ele acabou de "entrar", em vez da página
    // trocar sem aviso nenhum) — ver entrarNoLocal.
    this.mensagemEntrada = this.add
      .text(this.scale.width / 2, this.scale.height / 2, "", {
        fontSize: "18px",
        fontStyle: "bold",
        color: "#F3B43F",
        backgroundColor: "#000000cc",
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1001)
      .setVisible(false);

    const uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    uiCamera.setScroll(0, 0);

    // Minimapa — pedido do jogador ("pra pessoa não se perder"), canto
    // superior direito, sempre mostrando o mapa INTEIRO (zoom calculado
    // pra caber tudo de uma vez, sem seguir o personagem — só o pontinho
    // dele que se move lá dentro). O próprio contorno de parede que já
    // cerca o mapa inteiro (ver construirMapa) acaba servindo de moldura
    // natural; o retângulo com borda dourada por trás (minimapFundo) só
    // dá uma margem/contraste contra o jogo por trás.
    const minimapX = this.scale.width - MINIMAPA_LARGURA - MINIMAPA_MARGEM;
    const minimapY = MINIMAPA_MARGEM;
    const minimapFundo = this.add
      .rectangle(
        minimapX + MINIMAPA_LARGURA / 2,
        minimapY + MINIMAPA_ALTURA / 2,
        MINIMAPA_LARGURA + 6,
        MINIMAPA_ALTURA + 6,
        0x000000,
        0.6,
      )
      .setStrokeStyle(2, 0xf3b43f)
      .setScrollFactor(0)
      .setDepth(999);

    const minimapCamera = this.cameras.add(minimapX, minimapY, MINIMAPA_LARGURA, MINIMAPA_ALTURA);
    minimapCamera.setZoom(MINIMAPA_LARGURA / larguraMundo);
    minimapCamera.setScroll(0, 0);
    minimapCamera.setBounds(0, 0, larguraMundo, alturaMundo);
    minimapCamera.setBackgroundColor(0x16210f);

    // Cada câmera só desenha o que NÃO está na lista de ignorados —
    // jogo principal (zoom 1.6, segue o personagem): mundo + personagem
    // de verdade + ícones dos locais, nunca o HUD/minimapa/pontinho.
    // Câmera de UI (zoom 1, fixa): só o HUD/mensagem central/moldura do
    // minimapa. Câmera do minimapa: mundo + ícones + pontinho do
    // personagem, nunca o personagem "de verdade" (grande demais) nem
    // os rótulos de texto (ilegíveis nesse tamanho) nem o HUD/UI.
    this.cameras.main.ignore([this.debugText, this.mensagemEntrada, minimapFundo, this.playerDot]);
    uiCamera.ignore([camada, this.player, this.playerDot, ...iconesDeLocais, ...rotulosDeLocais]);
    minimapCamera.ignore([this.debugText, this.mensagemEntrada, minimapFundo, this.player, ...rotulosDeLocais]);
  }

  // Dispara a navegação real pro resto do jogo (Explorer2DGame.tsx
  // escuta este evento e chama router.push). `entrando` evita
  // disparar de novo por overlap contínuo (o jogador fica alguns
  // frames "dentro" do ícone antes da página trocar) ou clique duplo.
  private entrarNoLocal(local: LocalInterativo) {
    if (this.entrando) return;
    this.entrando = true;

    const corpo = this.player.body as Phaser.Physics.Arcade.Body;
    corpo.setVelocity(0, 0);
    this.mensagemEntrada.setText(`Entrando em ${local.nome}...`).setVisible(true);

    this.time.delayedCall(350, () => {
      this.game.events.emit("proto2d-entrar", local.rota);
    });
  }

  update() {
    if (!this.player) return;
    // Trava o personagem enquanto a mensagem "Entrando em..." está na
    // tela (ver entrarNoLocal) — sem isso ele continuava andando (e
    // escapando do overlap) nos ~350ms antes da navegação acontecer.
    if (this.entrando) return;
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

    this.playerDot.setPosition(this.player.x, this.player.y);

    const tileX = Math.floor(this.player.x / TILE);
    const tileY = Math.floor(this.player.y / TILE);
    this.debugText.setText(
      `tile (${tileX}, ${tileY}) / mapa ${MAP_COLS}x${MAP_ROWS} / cam (${Math.round(this.cameras.main.scrollX)}, ${Math.round(this.cameras.main.scrollY)})`,
    );
  }
}
