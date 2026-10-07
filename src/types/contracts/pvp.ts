
export interface LutadorDuelo {
  id: number;
  nome: string;
  genero: string;
  classe?: string;
  chave: "A" | "B";
}

export interface PoderDuelo {
  id: number;
  nome: string;
  imagem_url?: string | null;
  custo_mana: number;
  combat_slot?: number | null;
  dano_base: number;
  cura_base: number;
  escala_atributo?: string;
  valor_escala?: number;
}

export interface ConsumivelDuelo {
  id_item: number;
  nome: string;
  imagem_url?: string | null;
  quantidade: number;
  efeito_vida?: number;
  efeito_mana?: number;
}

export interface DueloIniciadoPayload {
  duelId: number;
  arena: string;
  ranked?: boolean;
  // Partida de torneio: é um duelo ao vivo como qualquer outro (mesma
  // tela), só marcado pra a UI saber que faz parte de uma série. O
  // backend manda um objeto (nunca `true`) — {serieId, round, formato}.
  torneio?: { serieId: number; round: string; formato: string } | boolean;
  ratingA?: number;
  ratingB?: number;
  ligaA?: string;
  ligaB?: string;
  a: LutadorDuelo;
  b: LutadorDuelo;
  vidaMaxA: number;
  vidaMaxB: number;
  manaMaxA: number;
  manaMaxB: number;
  vidaA: number;
  vidaB: number;
  manaA: number;
  manaB: number;
  poderesA: PoderDuelo[];
  poderesB: PoderDuelo[];
  consumiveisA: ConsumivelDuelo[];
  consumiveisB: ConsumivelDuelo[];
  turnoDe: "A" | "B";
  prazoSegundos: number;
}

// Arena Ranqueada (PvP Competitivo v1) — eventos próprios do socket, além
// dos "pvp:*" já existentes (que continuam servindo o Duelo casual sem
// nenhuma mudança de comportamento).

export interface StatusInstanceDuelo {
  key: "BURN" | "BLEED" | "POISON" | "SILENCE" | "WEAKEN" | "FREEZE" | "STUN" | "PARALYZE" | "BLIND";
  remainingTurns: number;
  stacks: number;
}

// Habilidades V2.0 (item 10) — buff/debuff temporário (combatBuffService
// no backend), mesmo shape mínimo de StatusInstanceDuelo.

export interface CombatBuffInstanceDuelo {
  atributo: "DANO_SAIDA_PCT" | "DEFESA_FLAT" | "REGEN_HP_FLAT" | "REGEN_HP_PERCENT" | "REGEN_MANA_FLAT" | "REGEN_MANA_PERCENT" | "STATUS_RESISTANCE_PCT";
  valor: number;
  remainingTurns: number;
}

export interface TurnoResultadoPayload {
  duelId: number;
  atacante: "A" | "B";
  nomeAcao: string;
  dano: number;
  cura: number;
  manaCurada?: number;
  esquivou: boolean;
  // Precisão/Crítico (Velocidade) — ausente em respostas antigas
  // (compatibilidade), tratado como false nesse caso.
  critico?: boolean;
  bloqueado?: boolean;
  logStatus?: string[];
  statusA?: StatusInstanceDuelo[];
  statusB?: StatusInstanceDuelo[];
  // Habilidades V2.0 (item 10) — buffs/debuffs TEMPORÁRIOS de combate
  // (ConsumableEffect APPLY_COMBAT_BUFF), mesmo princípio de statusA/B.
  combatBuffsA?: CombatBuffInstanceDuelo[];
  combatBuffsB?: CombatBuffInstanceDuelo[];
  vidaA: number;
  vidaB: number;
  manaA: number;
  manaB: number;
  turnoDe: "A" | "B" | null;
  prazoSegundos?: number;
}

export interface DueloFimPayload {
  duelId: number;
  vencedorChave: "A" | "B" | null;
  vencedor: { id: number; nome: string } | null;
  perdedor: { id: number; nome: string } | null;
  // Ranked não concede recompensa de Duelo casual nem nível — só rating
  // (ver ranked:rating:update). "FalhaServidor"/"Abandono" só existem
  // pra partidas ranked; casual continua só com "combate"/"desistencia".
  recompensa?: { dinheiro: number; experiencia: number };
  nivelAposVitoria?: number;
  motivo: "combate" | "desistencia" | "Vitoria" | "Abandono" | "FalhaServidor";
  ranked?: boolean;
}

// Torneio — atualização ao vivo de uma série (ready-check e placar),
// recebida depois de SOCKET_EVENTS.TORNEIO.ENTRAR_SALA. O REST (GET /pvp/tournaments/:id)
// não traz quem já confirmou presença — só o socket sabe.

export interface DesafioRecebido {
  idDesafiante: number;
  nomeDesafiante: string;
  prazoSegundos: number;
  recebidoEm: number;
}

// Aventura em grupo (party) — convite reaproveita a MESMA conexão/
// presença online do Duelo ao vivo (ver comentário no topo de
// partySocket.js sobre não precisar de SOCKET_EVENTS.TRANSPORT.IDENTIFY próprio).
