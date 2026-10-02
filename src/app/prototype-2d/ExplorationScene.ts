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
// Tileset do chão: arte real (public/tiles/terrain.png — 4 tiles de
// 32x32 recortados de um pack de terreno fornecido pelo jogador:
// grama/rocha/caminho/água), não mais desenhado em runtime via Canvas.
//
// Locais interativos (pedido do jogador: "se eu entrar no ferreiro
// ele vai pra forja") — pontos fixos no mapa que, ao serem tocados
// pelo personagem OU clicados, navegam pra rota real do jogo
// correspondente. Os ÍCONES já são os mesmos ícones de verdade do
// menu lateral do jogo (public/icons/...). Cada local agora tem um
// PRÉDIO de verdade (public/buildings/ — recortado de um pack de
// vilarejo fornecido pelo jogador) desenhado atrás do selo/ícone, em
// vez de só grama vazia.
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
  predioKey: string;
  predioUrl: string;
  placaKey?: string;
  placaUrl?: string;
}

// Mesmos ícones que o NavMenu real usa pra essas telas (ver
// src/app/dashboard/components/NavMenu.tsx). Prédios: Loja e Ferreiro
// reaproveitam a MESMA casa pequena do pack (ferreiro espelhada, pra
// não ficar idêntica), Taverna é a casa maior do pack (+ placa "INN"),
// Guilda é a casa com alpendre (a mais "oficial" das 3 do pack).
const LOCAIS_INTERATIVOS: LocalInterativo[] = [
  {
    chave: "ferreiro",
    nome: "Ferreiro",
    rota: "/dashboard/forge",
    tileX: 6,
    tileY: 12,
    cor: 0xb0462a,
    iconeKey: "icon-forja",
    iconeUrl: "/icons/ui/forja.png",
    predioKey: "predio-ferreiro",
    predioUrl: "/buildings/ferreiro.png",
    placaKey: "placa-ferreiro",
    placaUrl: "/buildings/sign-ferreiro.png",
  },
  {
    chave: "loja",
    nome: "Loja",
    rota: "/dashboard/shop",
    tileX: 15,
    tileY: 5,
    cor: 0xc9a227,
    iconeKey: "icon-loja",
    iconeUrl: "/icons/loja.png",
    predioKey: "predio-loja",
    predioUrl: "/buildings/loja.png",
  },
  {
    chave: "taverna",
    nome: "Taverna",
    rota: "/dashboard/tavern",
    tileX: 6,
    tileY: 22,
    cor: 0x8a5a2b,
    iconeKey: "icon-loja",
    iconeUrl: "/icons/loja.png",
    predioKey: "predio-taverna",
    predioUrl: "/buildings/taverna.png",
    placaKey: "placa-taverna",
    placaUrl: "/buildings/sign-inn.png",
  },
  {
    chave: "guilda",
    nome: "Guilda",
    rota: "/dashboard/guilds",
    tileX: 18,
    tileY: 22,
    cor: 0x2a6fb0,
    iconeKey: "icon-guildas",
    iconeUrl: "/icons/guildas.png",
    predioKey: "predio-guilda",
    predioUrl: "/buildings/guilda.png",
  },
];

const TILE = 32;
// Mapa BEM maior que a viewport do jogo (ver LARGURA/ALTURA em
// Explorer2DGame.tsx) — de propósito, senão o mapa inteiro cabe numa
// tela só e não dá pra ver a câmera seguindo o personagem de verdade
// (critério #4 do escopo original do protótipo).
const MAP_COLS = 50;
const MAP_ROWS = 40;

// Tile do spawn do personagem (ver this.player em create()).
const SPAWN_TILE_X = 3;
const SPAWN_TILE_Y = 4;

// 0 = grama (andável), 1 = rocha/montanha (bloqueado), 2 = caminho de
// terra (andável, só visual), 3 = água (bloqueado) — índices do
// tileset real (public/tiles/terrain.png, ver preload()). Borda
// inteira bloqueada + alguns blocos de rocha espalhados + duas lagoas,
// e um caminho carvado do spawn até cada Local Interativo pra dar a
// sensação de estradas ligando os pontos do mapa (pedido do jogador:
// textura mais parecida com o Mapa de Caelum de verdade, que tem
// estradas e lagoas visíveis ligando os territórios).
function construirMapa(): number[][] {
  const linhas: number[][] = [];
  const blocos = [
    { x0: 9, x1: 11, y0: 6, y1: 8 },
    { x0: 20, x1: 24, y0: 15, y1: 16 },
    { x0: 30, x1: 31, y0: 25, y1: 30 },
    { x0: 38, x1: 42, y0: 10, y1: 12 },
  ];
  // Longe o bastante dos Locais Interativos/blocos de rocha/spawn pra
  // nunca cercar um deles por completo (ver ocupado em create(), que já
  // evita árvore em cima — lagoa usa a mesma folga de posicionamento).
  // Posições escolhidas pra nunca encostar na área ocupada pelos
  // prédios de verdade dos Locais Interativos (ver PREDIO_PX_* abaixo
  // e create(), onde o prédio é ancorado pela porta/tile do local).
  const lagoas = [
    { cx: 13, cy: 15, raio: 3 },
    { cx: 34, cy: 20, raio: 3 },
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

  for (const lagoa of lagoas) marcarLagoa(linhas, lagoa.cx, lagoa.cy, lagoa.raio);

  for (const local of LOCAIS_INTERATIVOS) {
    marcarCaminho(linhas, SPAWN_TILE_X, SPAWN_TILE_Y, local.tileX, local.tileY);
  }

  return linhas;
}

// Lagoa circular com borda levemente irregular (jitter no raio de cada
// célula) pra não parecer um círculo perfeito demais — só sobrescreve
// grama (0), nunca um bloco de rocha (1) já colocado.
function marcarLagoa(grade: number[][], cx: number, cy: number, raio: number) {
  for (let y = cy - raio; y <= cy + raio; y++) {
    if (y < 1 || y >= MAP_ROWS - 1) continue;
    for (let x = cx - raio; x <= cx + raio; x++) {
      if (x < 1 || x >= MAP_COLS - 1) continue;
      const distancia = Math.hypot(x - cx, y - cy);
      if (distancia <= raio - Math.random() * 0.8 && grade[y][x] === 0) {
        grade[y][x] = 3;
      }
    }
  }
}

// Carva um "L" de 2 tiles de largura entre dois pontos, só sobrescrevendo
// células que hoje são grama (0) — nunca abre caminho através de um
// bloco de rocha (1), então o caminho pode "sumir" visualmente debaixo
// de uma formação rochosa; a colisão continua vindo só do valor da
// célula, então isso é só estética, não afeta andabilidade real.
function marcarCaminho(grade: number[][], x0: number, y0: number, x1: number, y1: number) {
  const marcar = (x: number, y: number) => {
    if (y < 0 || y >= MAP_ROWS || x < 0 || x >= MAP_COLS) return;
    if (grade[y][x] === 0) grade[y][x] = 2;
  };
  const xi = Math.min(x0, x1);
  const xf = Math.max(x0, x1);
  for (let x = xi; x <= xf; x++) {
    marcar(x, y0);
    marcar(x, y0 + 1);
  }
  const yi = Math.min(y0, y1);
  const yf = Math.max(y0, y1);
  for (let y = yi; y <= yf; y++) {
    marcar(x1, y);
    marcar(x1 + 1, y);
  }
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
// proporção do mapa (MAP_COLS:MAP_ROWS) pra não distorcer. Margem Y
// maior que a X: dá espaço pro botão "fechar" (✕) que fica por cima do
// canvas, fora do Phaser, no canto superior direito da página (ver
// page.tsx) — senão os dois ficariam sobrepostos agora que o jogo é
// tela cheia.
const MINIMAPA_LARGURA = 160;
const MINIMAPA_ALTURA = Math.round(MINIMAPA_LARGURA * (MAP_ROWS / MAP_COLS));
const MINIMAPA_MARGEM_X = 10;
const MINIMAPA_MARGEM_Y = 54;

export class ExplorationScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerDot!: Phaser.GameObjects.Arc;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private teclasWASD!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private debugText!: Phaser.GameObjects.Text;
  private mensagemEntrada!: Phaser.GameObjects.Text;
  private uiCamera!: Phaser.Cameras.Scene2D.Camera;
  private minimapCamera!: Phaser.Cameras.Scene2D.Camera;
  private minimapFundo!: Phaser.GameObjects.Rectangle;
  private entrando = false;

  constructor() {
    super("ExplorationScene");
  }

  preload() {
    // Tileset real de terreno (grama/rocha/caminho/água), 4 tiles de
    // 32x32 numa fileira só — Phaser fatia sozinho a partir da
    // largura/altura passadas em addTilesetImage (ver create()).
    this.load.image("tiles-terreno", "/tiles/terrain.png");
    this.gerarTexturaArvore();
    for (const local of LOCAIS_INTERATIVOS) this.gerarSeloLocal(local);

    // Ícones DE VERDADE do jogo (os mesmos arquivos que o menu lateral
    // usa) — carrega cada URL só uma vez mesmo que mais de um Local
    // reaproveite o mesmo ícone (ex.: Loja/Taverna).
    const iconesUnicos = new Map(LOCAIS_INTERATIVOS.map((l) => [l.iconeKey, l.iconeUrl]));
    for (const [key, url] of iconesUnicos) this.load.image(key, url);

    // Prédio + placa de cada Local Interativo (public/buildings/).
    for (const local of LOCAIS_INTERATIVOS) {
      this.load.image(local.predioKey, local.predioUrl);
      if (local.placaKey && local.placaUrl) this.load.image(local.placaKey, local.placaUrl);
    }

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

  // Árvore decorativa (estilo pinheiro, 3 camadas triangulares +
  // tronco) espalhada pela grama só por estética — sem física/colisão,
  // é puro enfeite visual pra dar a sensação de floresta que o mapa
  // real tem. Mais alta que 1 tile de propósito (origin fica nos "pés",
  // a copa ultrapassa pra cima, como árvores de verdade num top-down).
  private gerarTexturaArvore() {
    const largura = TILE - 4;
    const altura = TILE + 18;
    const textura = this.textures.createCanvas("prop-arvore", largura, altura)!;
    const ctx = textura.getContext();
    const cx = largura / 2;

    ctx.fillStyle = "#5a3d23";
    ctx.fillRect(cx - 3, altura - 14, 6, 14);

    const camadas: { y: number; r: number; cor: string }[] = [
      { y: altura - 14, r: largura / 2 - 1, cor: "#2f5e2a" },
      { y: altura - 24, r: largura / 2 - 4, cor: "#376b31" },
      { y: altura - 34, r: largura / 2 - 7, cor: "#3f7a38" },
    ];
    for (const c of camadas) {
      ctx.fillStyle = c.cor;
      ctx.beginPath();
      ctx.moveTo(cx, c.y - 16);
      ctx.lineTo(cx - c.r, c.y);
      ctx.lineTo(cx + c.r, c.y);
      ctx.closePath();
      ctx.fill();
    }

    textura.refresh();
  }

  // "Selo" atrás do ícone de um Local Interativo — corpo físico pro
  // overlap/clique na porta. Agora que cada local tem um PRÉDIO de
  // verdade desenhado atrás (ver create()), virou só um anel fino e
  // semitransparente marcando a porta/entrada, em vez do disco cheio
  // de antes (que brigava visualmente com a arte do prédio).
  private gerarSeloLocal(local: LocalInterativo) {
    const chaveTextura = `selo-${local.chave}`;
    const textura = this.textures.createCanvas(chaveTextura, TILE, TILE)!;
    const ctx = textura.getContext();
    const cssCor = `#${local.cor.toString(16).padStart(6, "0")}`;

    ctx.strokeStyle = cssCor;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(TILE / 2, TILE / 2, TILE / 2 - 3, 0, Math.PI * 2);
    ctx.stroke();

    textura.refresh();
  }

  create() {
    const dados = construirMapa();
    const mapa = this.make.tilemap({ data: dados, tileWidth: TILE, tileHeight: TILE });
    const tileset = mapa.addTilesetImage("tiles-terreno", "tiles-terreno", TILE, TILE);
    if (!tileset) return;
    const camada = mapa.createLayer(0, tileset, 0, 0);
    if (!camada) return;
    // Índices 1 (rocha) e 3 (água) são os únicos tiles bloqueados —
    // grama (0) e caminho (2) continuam livres.
    camada.setCollision([1, 3]);

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
    // Depth explícito acima das árvores decorativas (depth 0, ver
    // abaixo) — sem isso a ordem de desenho dependeria só da ordem de
    // criação dos objetos, e o personagem podia ficar "atrás" de uma
    // árvore ao passar por cima dela.
    this.player.setDepth(1);

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

    // Árvores decorativas espalhadas pela grama (pedido do jogador:
    // textura mais parecida com o mapa real, que tem floresta visível)
    // — nunca em cima de rocha/caminho/Local Interativo/spawn, puro
    // enfeite sem física. Depth 0 (abaixo do personagem, ver
    // player.setDepth(1) acima) e some das câmeras de UI/minimapa (ver
    // ignore-lists no fim do método) pra não virar um amontoado de
    // pontinhos ilegível no minimapa.
    const arvores: Phaser.GameObjects.Image[] = [];
    const ocupado = new Set<string>([`${SPAWN_TILE_X},${SPAWN_TILE_Y}`]);
    for (const local of LOCAIS_INTERATIVOS) ocupado.add(`${local.tileX},${local.tileY}`);
    let tentativas = 0;
    while (arvores.length < 70 && tentativas < 600) {
      tentativas++;
      const tx = 1 + Math.floor(Math.random() * (MAP_COLS - 2));
      const ty = 1 + Math.floor(Math.random() * (MAP_ROWS - 2));
      const chave = `${tx},${ty}`;
      if (ocupado.has(chave)) continue;
      if (dados[ty][tx] !== 0) continue;
      const pertoDeUmLocal = LOCAIS_INTERATIVOS.some(
        (local) => Math.abs(local.tileX - tx) <= 1 && Math.abs(local.tileY - ty) <= 1,
      );
      if (pertoDeUmLocal) continue;
      ocupado.add(chave);
      arvores.push(this.add.image(tx * TILE + TILE / 2, ty * TILE + TILE, "prop-arvore").setOrigin(0.5, 1).setDepth(0));
    }

    // Locais interativos — anda por cima (overlap) OU clica no ícone
    // pra entrar direto, igual pedido ("clicando e entrando no
    // lugar"). Cada um navega pra UMA rota real do jogo quando o
    // personagem "entra" nele (ver entrarNoLocal).
    const iconesDeLocais: Phaser.GameObjects.GameObject[] = [];
    const rotulosDeLocais: Phaser.GameObjects.GameObject[] = [];
    // Prédios/placas são grandes/detalhados demais pro minimapa (igual
    // às árvores) — ficam numa lista própria, nunca mostrada lá.
    const construcoesDeLocais: Phaser.GameObjects.GameObject[] = [];
    for (const local of LOCAIS_INTERATIVOS) {
      const px = local.tileX * TILE + TILE / 2;
      const py = local.tileY * TILE + TILE / 2;

      // Prédio ancorado PELA PORTA: origin (0.5, 1) encosta a base do
      // prédio no tile de entrada (px, py + TILE/2), igual o personagem
      // (ver player.setOrigin acima) — o resto da construção sobe/
      // alarga a partir dali. Depth 0, mesma camada das árvores: o
      // personagem (depth 1) sempre desenha por cima ao "entrar" nela.
      const predio = this.add.image(px, py + TILE / 2, local.predioKey).setOrigin(0.5, 1).setDepth(0);
      construcoesDeLocais.push(predio);

      if (local.placaKey) {
        // Placa pendurada do lado de fora, perto da porta.
        const placa = this.add
          .image(px + predio.displayWidth / 2 - 6, py - 4, local.placaKey)
          .setOrigin(0.5, 1)
          .setDepth(0);
        construcoesDeLocais.push(placa);
      }

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
      .text(4, this.scale.height - 24, "", {
        fontSize: "12px",
        color: "#ffffff",
        backgroundColor: "#000000aa",
        padding: { x: 4, y: 2 },
      })
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

    this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    this.uiCamera.setScroll(0, 0);

    // Minimapa — pedido do jogador ("pra pessoa não se perder"), canto
    // superior direito, sempre mostrando o mapa INTEIRO (zoom calculado
    // pra caber tudo de uma vez, sem seguir o personagem — só o pontinho
    // dele que se move lá dentro). O próprio contorno de parede que já
    // cerca o mapa inteiro (ver construirMapa) acaba servindo de moldura
    // natural; o retângulo com borda dourada por trás (minimapFundo) só
    // dá uma margem/contraste contra o jogo por trás.
    const minimapX = this.scale.width - MINIMAPA_LARGURA - MINIMAPA_MARGEM_X;
    const minimapY = MINIMAPA_MARGEM_Y;
    this.minimapFundo = this.add
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

    this.minimapCamera = this.cameras.add(minimapX, minimapY, MINIMAPA_LARGURA, MINIMAPA_ALTURA);
    this.minimapCamera.setZoom(MINIMAPA_LARGURA / larguraMundo);
    this.minimapCamera.setScroll(0, 0);
    this.minimapCamera.setBounds(0, 0, larguraMundo, alturaMundo);
    this.minimapCamera.setBackgroundColor(0x16210f);

    // Cada câmera só desenha o que NÃO está na lista de ignorados —
    // jogo principal (zoom 1.6, segue o personagem): mundo + personagem
    // de verdade + árvores + ícones dos locais, nunca o HUD/minimapa/
    // pontinho. Câmera de UI (zoom 1, fixa): só o HUD/mensagem central/
    // moldura do minimapa. Câmera do minimapa: só o terreno (tileset já
    // mostra grama/rocha/caminho) + ícones + pontinho do personagem —
    // nunca o personagem "de verdade", as árvores (viram poeira
    // ilegível reduzidas) nem os rótulos de texto nem o HUD/UI.
    this.cameras.main.ignore([this.debugText, this.mensagemEntrada, this.minimapFundo, this.playerDot]);
    this.uiCamera.ignore([
      camada,
      this.player,
      this.playerDot,
      ...arvores,
      ...iconesDeLocais,
      ...rotulosDeLocais,
      ...construcoesDeLocais,
    ]);
    this.minimapCamera.ignore([
      this.debugText,
      this.mensagemEntrada,
      this.minimapFundo,
      this.player,
      ...arvores,
      ...rotulosDeLocais,
      ...construcoesDeLocais,
    ]);

    // Jogo agora é tela cheia (Scale.RESIZE, ver Explorer2DGame.tsx) —
    // precisa reposicionar câmeras/HUD/minimapa quando a janela muda de
    // tamanho, já que tudo acima foi calculado com o tamanho inicial.
    this.scale.on("resize", this.aoRedimensionar, this);
  }

  private aoRedimensionar(gameSize: Phaser.Structs.Size) {
    const largura = gameSize.width;
    const altura = gameSize.height;
    this.cameras.main.setSize(largura, altura);
    this.uiCamera.setSize(largura, altura);
    this.mensagemEntrada.setPosition(largura / 2, altura / 2);
    this.debugText.setPosition(4, altura - 24);

    const minimapX = largura - MINIMAPA_LARGURA - MINIMAPA_MARGEM_X;
    const minimapY = MINIMAPA_MARGEM_Y;
    this.minimapCamera.setPosition(minimapX, minimapY);
    this.minimapFundo.setPosition(minimapX + MINIMAPA_LARGURA / 2, minimapY + MINIMAPA_ALTURA / 2);
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
