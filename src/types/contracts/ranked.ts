export interface RankedQueueUpdatePayload {
  emFila: boolean;
  tempoNaFilaMs?: number;
}

export interface RankedMatchFoundPayload {
  duelId: number;
  a: { id: number; nome: string; rating: number };
  b: { id: number; nome: string; rating: number };
}

export interface ResumoTierPayload {
  rating: number;
  tier: string;
  divisao: string | null;
  tierLabel: string;
  tierAsset: string;
}

/**
 * Sempre sobre o DESAFIANTE (eu) — o defensor é controlado por IA e nunca
 * tem rating alterado (PvP v2 §8), então o backend não manda um par
 * jogadorA/jogadorB como na v1: é sempre "antes → depois" do meu lado.
 */

export interface RankedRatingUpdatePayload {
  duelId: number;
  ratingAntes: number;
  ratingDepois: number;
  delta: number;
  tierAntes: ResumoTierPayload;
  tierDepois: ResumoTierPayload;
  defensorControladoPorIA: boolean;
  ratingDefensorInalterado: number;
}

export interface RankedOponenteDesconectadoPayload {
  characterId: number;
  prazoSegundos: number;
}

// Motor de Status (mesmo formato de src/config/statusEffectConfig.js no
// backend) — `stacks` só é > 1 pra BLEED/POISON (STACK_CAP), o resto
// fica sempre em 1.
