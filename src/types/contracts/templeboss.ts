import type { StatusInstanceMinima, CombatBuffMinimo } from "@/components/combat/StatusEffectIcons";

// Templo do Véu Celestial — Provação Final (Guardião solo). Diferente
// de guildboss.ts: a luta é 100% individual, então não existe
// "membros"/"ordem"/"turnoDe" por id de ator — cada ação do jogador já
// resolve o turno INTEIRO (seu golpe + contra-ataque do Guardião) numa
// chamada só (ver templeBossSocket.js no backend). "estado" é sempre o
// MESMO shape, tanto na entrada (templeboss:estado) quanto embutido em
// cada resultado de turno — nunca duas formas diferentes da luta.

// Mesma projeção pública de Powers do Duelo/Grupo/Guild Boss
// (poderesPublicos em pvpPayloads.js), com o cooldown MÁXIMO anexado.
export interface PoderGuardiao {
  id: number;
  combat_slot?: number | null;
  nome: string;
  imagem_url: string | null;
  custo_mana: number;
  dano_base: number;
  cura_base: number;
  nivel_habilidade: number;
  escala_atributo?: string;
  valor_escala?: number;
  cooldown: number;
}

export interface EstadoGuardiaoPayload {
  attemptId: number;
  eventId: number;
  nomeBoss: string;
  imagemBoss: string | null;
  vidaJogador: number;
  vidaMaxJogador: number;
  manaJogador: number;
  manaMaxJogador: number;
  vidaBoss: number;
  vidaMaxBoss: number;
  faseAtual: string | null;
  statusJogador: StatusInstanceMinima[];
  statusBoss: StatusInstanceMinima[];
  buffsJogador: CombatBuffMinimo[];
  buffsBoss: CombatBuffMinimo[];
  // "power:<id>" -> turnos restantes — mesmo formato de cooldownService.js
  // já usado por WorldBoss/GuildBoss/PvP.
  cooldownsJogador: Record<string, number>;
  poderes: PoderGuardiao[];
  turno: number;
}

export interface CastStartGuardiaoPayload {
  nomePoder: string | null;
}

export interface TurnoResultadoGuardiaoPayload {
  log: string[];
  estado: EstadoGuardiaoPayload;
}

export interface FaseAlteradaGuardiaoPayload {
  fase: string | null;
}

export interface ItemGanhoGuardiao {
  id_item: number;
  nome?: string;
  quantidade: number;
  reward_kind: "STACKABLE_ITEM" | "EQUIPMENT";
}

export interface RecompensaGuardiaoPayload {
  sigilosGanhos: number;
  idempotente: boolean;
  itensGanhos: ItemGanhoGuardiao[];
}

export interface FimGuardiaoPayload {
  vitoria: boolean;
  recompensa: RecompensaGuardiaoPayload | null;
}
