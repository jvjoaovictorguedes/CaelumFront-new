import type { PoderGrupo } from "./party";

export interface AliadoBossGuilda {
  id: number;
  nome: string;
  genero: string;
  classe?: string;
  vidaMax: number;
  manaMax: number;
  vida: number;
  mana: number;
  poderes: PoderGrupo[];
}

// Mesmo formato tanto pra "batalha-iniciada" (acabou de abrir, só com
// quem entrou primeiro) quanto pra "estado" (reconexão/resync, ou
// entrando numa luta já em andamento) — nunca duas formas diferentes
// de descrever a mesma luta. `turnoDe` null = fase "chefe" (telegraph
// ou resolução do contra-ataque em andamento, ninguém pode agir).

export interface BatalhaBossGuildaIniciadaPayload {
  battleId: number;
  nomeChefe: string;
  vidaAtual: number;
  vidaTotal: number;
  membros: AliadoBossGuilda[];
  ordem: string[];
  turnoDe: string | null;
  fase?: "aliados" | "chefe";
  rodada: number;
  prazoSegundos: number;
}

export interface MembroEntrouBossGuildaPayload {
  battleId: number;
  membro: AliadoBossGuilda;
  ordem: string[];
}

// Telegraph do turno do chefe (ver executarTurnoChefe no backend) —
// SEMPRE emitido antes do contra-ataque resolver, mesmo sem nenhuma
// habilidade (nomePoder/imagemUrl null nesse caso): é o "ritmo de
// turno" pedido igual à Ameaça Mundial, nunca resolve instantâneo.

export interface CastStartBossGuildaPayload {
  battleId: number;
  nomePoder: string | null;
  imagemUrl: string | null;
  tempoConjuracaoMs: number;
  rodada: number;
}

export interface TurnoBossGuildaPayload {
  battleId: number;
  origem: "aliado" | "chefe";
  idAtor?: string;
  idAlvo?: number;
  nomeAcao: string;
  dano: number;
  cura?: number;
  manaCurada?: number;
  esquivou: boolean;
  // Precisão/Crítico (Velocidade) — ausente em respostas antigas
  // (compatibilidade), tratado como false nesse caso.
  critico?: boolean;
  vidaChefe?: number;
  vidaAliado?: number;
  manaAliado?: number;
  rodada: number;
  // Cooldowns ATUAIS do ator (só em origem "aliado") — formato
  // "power:<id>" -> turnos restantes, mesmo cooldownService.js do Boss
  // Mundial (ver WorldBossCooldownsApi em lib/api/worldBoss.ts).
  cooldowns?: Record<string, number>;
}

export interface ProximoTurnoBossGuildaPayload {
  battleId: number;
  turnoDe: string;
  prazoSegundos: number;
  rodada: number;
}

export interface RecompensasBossGuilda {
  xpGuilda: number;
  subiuNivel: boolean;
  niveisGanhos: number;
  participantes: { idPersonagem: number; dinheiro: number; xp: number; nivel?: number }[];
  premioMaiorDano: { idPersonagem: number; ouro: number } | null;
}

export interface BatalhaBossGuildaFimPayload {
  battleId: number;
  vitoria: boolean;
  motivo: string;
  vidaChefe: number;
  recompensas: RecompensasBossGuilda | null;
}
