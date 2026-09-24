// Catálogo central de músicas (Especificação Sistema de Música por
// Página §3). O código das páginas usa objetos daqui em vez de espalhar
// caminhos literais — a identidade de uma trilha é `key`, não `src`:
// dá pra trocar o arquivo físico depois sem mudar a semântica de quem
// usa <PageMusic track={MUSIC.ALGO} />.
export interface MusicTrack {
  key: string;
  src: string;
  title?: string;
  loop?: boolean;
  defaultVolume?: number;
}

// Pra cadastrar uma trilha nova:
//   1. Colocar o arquivo em public/audio/music/.
//   2. Adicionar uma entrada aqui com key estável.
//   3. <PageMusic track={MUSIC.MINHA_TRILHA} /> na página escolhida.
// Nenhuma mudança no provider/NavMenu é necessária pra isso.
export const MUSIC = {
  GUILDA: { key: "guilda", src: "/audio/music/GUILDA.mp3", loop: true },
  AVENTUREIRO: {
    key: "aventureiro",
    src: "/audio/music/INVENTARIO-EQUIPAMENTO-GUIA DO AVENTUREIRO.mp3",
    loop: true,
  },
  AMBIENTE: { key: "ambiente", src: "/audio/music/AMBIENTE.mp3", loop: true },
  MAPA: { key: "mapa", src: "/audio/music/MAPA.mp3", loop: true },
  MAPA_MEDIEVAL: { key: "mapa-medieval", src: "/audio/music/MEDIEVAL - MAPA.mp3", loop: true },
  COMBATE: { key: "combate", src: "/audio/music/COMBATE.mp3", loop: true },
  COMBATE1: { key: "combate1", src: "/audio/music/COMBATE1.mp3", loop: true },
  COMBATE2: { key: "combate2", src: "/audio/music/COMBATE2.mp3", loop: true },
  COMBATE3: { key: "combate3", src: "/audio/music/COMBATE3.mp3", loop: true },
  ANIMADA: { key: "animada", src: "/audio/music/ANIMADA.mp3", loop: true },
  BESTIARIO: { key: "bestiario", src: "/audio/music/BESTIARIO.mp3", loop: true },
  TAVERNA_MERCADO: {
    key: "taverna-mercado",
    src: "/audio/music/MUSICA TAVERNA-MERCADO.mp3",
    loop: true,
  },
} satisfies Record<string, MusicTrack>;

// As 4 faixas de combate (§ escolha do usuário: sorteia uma a cada
// combate novo, pra não ficar repetitivo). Lido por CombatArena/
// PartyBattleArena ao entrar em cada encontro.
export const FAIXAS_COMBATE = [MUSIC.COMBATE, MUSIC.COMBATE1, MUSIC.COMBATE2, MUSIC.COMBATE3];

export function sortearFaixaCombate(): MusicTrack {
  return FAIXAS_COMBATE[Math.floor(Math.random() * FAIXAS_COMBATE.length)];
}

// As 2 faixas do Mapa (§ escolha do usuário: sorteia uma a cada vez que
// a tela abre).
const FAIXAS_MAPA = [MUSIC.MAPA, MUSIC.MAPA_MEDIEVAL];

export function sortearFaixaMapa(): MusicTrack {
  return FAIXAS_MAPA[Math.floor(Math.random() * FAIXAS_MAPA.length)];
}

// Prioridade da solicitação de música mais alta vence (§6). Empate =
// solicitação mais recente. Eventos temporários (combate/boss) sobrepõem
// a música da página sem destruir a solicitação original — quando o
// evento libera (releaseMusic), a trilha da página volta sozinha.
export const MUSIC_PRIORITY = {
  PAGE: 10,
  AREA: 20,
  COMBAT: 50,
  PVP: 60,
  BOSS: 100,
} as const;
