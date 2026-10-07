import type { TorneioSerieAtualizadaPayload } from "../../types/contracts/tournament";
import type {
  BatalhaBossGuildaIniciadaPayload,
  MembroEntrouBossGuildaPayload,
} from "../../types/contracts/guildboss";

export function appendTurn<T>(history: T[], turn: T): T[] {
  return [...history, turn];
}

export function mergeTournamentSeries(
  current: TorneioSerieAtualizadaPayload | null,
  payload: TorneioSerieAtualizadaPayload,
) {
  return current && current.serieId === payload.serieId
    ? { ...current, ...payload }
    : payload;
}

export function addGuildBossMember(
  current: BatalhaBossGuildaIniciadaPayload | null,
  payload: MembroEntrouBossGuildaPayload,
) {
  if (!current || current.battleId !== payload.battleId) return current;
  if (current.membros.some((member) => member.id === payload.membro.id))
    return current;
  return {
    ...current,
    membros: [...current.membros, payload.membro],
    ordem: payload.ordem,
  };
}
