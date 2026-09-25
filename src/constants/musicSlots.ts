// Painel Administrativo de Músicas §4/§12.2 — registry FECHADO de
// slot_keys, espelhando EXATAMENTE
// CaelumBack-new/src/config/musicSlotRegistry.js. `<PageMusic slot="..." />`
// e `useContextMusic("...")` só aceitam uma key daqui — a prioridade
// técnica vem sempre DESTE código, nunca de um dado vindo do backend
// (§12.2 — "PageMusic obtém a prioridade a partir do REGISTRY do slot
// (código), não de dado arbitrário vindo do backend").
import { MUSIC_PRIORITY } from "./music";

export type MusicSlotKind = "PAGE" | "CONTEXT";

export interface MusicSlotDef {
  label: string;
  kind: MusicSlotKind;
  priority: keyof typeof MUSIC_PRIORITY;
}

export const MUSIC_SLOTS = {
  PAGE_ADVENTURE: { label: "Aventura", kind: "PAGE", priority: "PAGE" },
  PAGE_GUIDE: { label: "Guia do Aventureiro", kind: "PAGE", priority: "PAGE" },
  PAGE_CHARACTER: { label: "Personagem", kind: "PAGE", priority: "PAGE" },
  PAGE_INVENTORY: { label: "Inventário", kind: "PAGE", priority: "PAGE" },
  PAGE_SHOP: { label: "Loja", kind: "PAGE", priority: "PAGE" },
  PAGE_MARKET: { label: "Mercado", kind: "PAGE", priority: "PAGE" },
  PAGE_FORGE: { label: "Forja", kind: "PAGE", priority: "PAGE" },
  PAGE_GUILDS: { label: "Guildas", kind: "PAGE", priority: "PAGE" },
  PAGE_QUESTS: { label: "Missões", kind: "PAGE", priority: "PAGE" },
  PAGE_MESSAGES: { label: "Mensagens", kind: "PAGE", priority: "PAGE" },
  PAGE_BESTIARY: { label: "Bestiário", kind: "PAGE", priority: "PAGE" },
  PAGE_TAVERN: { label: "Taverna", kind: "PAGE", priority: "PAGE" },
  PAGE_PVP: { label: "PvP", kind: "PAGE", priority: "PAGE" },
  PAGE_FISHING: { label: "Pesca/Navegação", kind: "PAGE", priority: "PAGE" },
  PAGE_MAP: { label: "Mapa", kind: "PAGE", priority: "PAGE" },

  CONTEXT_COMBAT_PVE: { label: "Combate PvE/Grupo", kind: "CONTEXT", priority: "COMBAT" },
  CONTEXT_PVP: { label: "PvP", kind: "CONTEXT", priority: "PVP" },
  CONTEXT_GUILD_BOSS: { label: "Boss de Guilda", kind: "CONTEXT", priority: "BOSS" },
  CONTEXT_WORLD_BOSS: { label: "Boss Global", kind: "CONTEXT", priority: "BOSS" },
} satisfies Record<string, MusicSlotDef>;

export type MusicSlotKey = keyof typeof MUSIC_SLOTS;

export function prioridadeDoSlot(slot: MusicSlotKey): number {
  return MUSIC_PRIORITY[MUSIC_SLOTS[slot].priority];
}
