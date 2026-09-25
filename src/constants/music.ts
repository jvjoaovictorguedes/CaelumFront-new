// Catálogo LOCAL de músicas — desde o Painel Administrativo de Músicas,
// isto deixou de ser a fonte principal (que passou a ser
// GET /api/music/config, publicada pelo Admin — ver
// contexts/MusicConfigContext.tsx) e virou o FALLBACK DE SEGURANÇA
// (§12.3): se o backend de música falhar, o jogo continua tocando
// exatamente isso, sem bloquear navegação nenhuma. Também é a fonte das
// prioridades técnicas (MUSIC_PRIORITY, nunca editáveis pelo Admin —
// §2.1) e do slotRegistry (constants/musicSlots.ts).
export interface MusicTrack {
  key: string;
  src: string;
  title?: string;
  loop?: boolean;
  defaultVolume?: number;
}

// Pra cadastrar uma trilha nova localmente (fallback):
//   1. Colocar o arquivo em public/audio/music/.
//   2. Adicionar uma entrada aqui com key estável.
// A forma normal de trocar música de uma página/contexto agora é pelo
// Painel Administrativo (/dashboard/admin/music), sem deploy.
export const MUSIC_DEFAULTS = {
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

// Alias mantido por compatibilidade com quem ainda lê o catálogo local
// diretamente (raro — a maioria das páginas hoje resolve via slot_key
// no MusicConfigContext).
export const MUSIC = MUSIC_DEFAULTS;

// Faixas de combate/mapa do FALLBACK local (usadas só quando
// /api/music/config falha — a versão publicada normalmente vem do pool
// "combat"/"map" administrável, ver musicConfigService.js no backend).
export const FAIXAS_COMBATE = [
  MUSIC_DEFAULTS.COMBATE,
  MUSIC_DEFAULTS.COMBATE1,
  MUSIC_DEFAULTS.COMBATE2,
  MUSIC_DEFAULTS.COMBATE3,
];

export function sortearFaixaCombate(): MusicTrack {
  return FAIXAS_COMBATE[Math.floor(Math.random() * FAIXAS_COMBATE.length)];
}

const FAIXAS_MAPA = [MUSIC_DEFAULTS.MAPA, MUSIC_DEFAULTS.MAPA_MEDIEVAL];

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

// Fallback local por slot_key (§12.3) — usado pelo MusicConfigContext
// quando GET /api/music/config falha, OU antes dele terminar de
// carregar. Espelha o seed inicial do Painel (migration
// 20261203020000-music-seed-estado-atual.js no backend): uma faixa fixa
// ("track") ou um sorteio local ("pool"). Contextos que hoje não têm
// música própria (PvP/Boss) ficam de fora — comportamento atual é
// silêncio nesses casos.
export type SlotFallback = { type: "track"; track: MusicTrack } | { type: "pool"; pick: () => MusicTrack };

export const SLOT_FALLBACKS: Record<string, SlotFallback> = {
  PAGE_ADVENTURE: { type: "track", track: MUSIC_DEFAULTS.AMBIENTE },
  PAGE_GUIDE: { type: "track", track: MUSIC_DEFAULTS.AVENTUREIRO },
  PAGE_CHARACTER: { type: "track", track: MUSIC_DEFAULTS.AMBIENTE },
  PAGE_INVENTORY: { type: "track", track: MUSIC_DEFAULTS.AVENTUREIRO },
  PAGE_SHOP: { type: "track", track: MUSIC_DEFAULTS.TAVERNA_MERCADO },
  PAGE_MARKET: { type: "track", track: MUSIC_DEFAULTS.TAVERNA_MERCADO },
  PAGE_FORGE: { type: "track", track: MUSIC_DEFAULTS.AVENTUREIRO },
  PAGE_GUILDS: { type: "track", track: MUSIC_DEFAULTS.GUILDA },
  PAGE_QUESTS: { type: "track", track: MUSIC_DEFAULTS.GUILDA },
  PAGE_MESSAGES: { type: "track", track: MUSIC_DEFAULTS.AMBIENTE },
  PAGE_BESTIARY: { type: "track", track: MUSIC_DEFAULTS.BESTIARIO },
  PAGE_TAVERN: { type: "track", track: MUSIC_DEFAULTS.GUILDA },
  PAGE_PVP: { type: "track", track: MUSIC_DEFAULTS.ANIMADA },
  PAGE_FISHING: { type: "track", track: MUSIC_DEFAULTS.AMBIENTE },
  PAGE_MAP: { type: "pool", pick: sortearFaixaMapa },
  CONTEXT_COMBAT_PVE: { type: "pool", pick: sortearFaixaCombate },
};
