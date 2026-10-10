import type { StatusInstanceMinima, CombatBuffMinimo } from "@/components/combat/StatusEffectIcons";

// Evento "O Coração da Máquina Celestial" — Fase 13/16 — Custódio do
// Meridiano. Clone estrutural de src/types/contracts/templeboss.ts: a
// luta é 100% individual, cada ação do jogador resolve o TURNO INTEIRO
// (golpe + contra-ataque do Custódio) numa chamada só (ver
// eventPuzzleBossSocket.js no backend). Diferente do Templo: a
// recompensa da primeira vitória é só ouro+xp fixo (nunca um Relicário/
// sorteio de item — isso é outro sistema, Fase 14/separado).
export interface PoderCustodioDoMeridiano {
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

export interface EstadoCustodioDoMeridianoPayload {
  attemptId: number;
  eventEditionId: number;
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
  cooldownsJogador: Record<string, number>;
  poderes: PoderCustodioDoMeridiano[];
  turno: number;
}

export interface CastStartCustodioDoMeridianoPayload {
  nomePoder: string | null;
}

export interface TurnoResultadoCustodioDoMeridianoPayload {
  log: string[];
  estado: EstadoCustodioDoMeridianoPayload;
}

export interface FaseAlteradaCustodioDoMeridianoPayload {
  fase: string | null;
}

// Mesma composição retornada por eventPuzzleBossAttemptService.
// finalizarVitoria — só ouro/xp fixo, nunca um catálogo de item.
export interface RecompensaCustodioDoMeridianoPayload {
  ouroGanho: number;
  xpGanho: number;
  idempotente: boolean;
}

export interface FimCustodioDoMeridianoPayload {
  vitoria: boolean;
  recompensa: RecompensaCustodioDoMeridianoPayload | null;
}
