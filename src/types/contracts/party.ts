import type { StatusInstanceDuelo, CombatBuffInstanceDuelo } from "./pvp";

export interface MembroGrupo {
  id: number;
  nome: string;
  classe: string | null;
  pronto: boolean;
}

export interface GrupoAtualizadoPayload {
  partyId: number;
  hostId: string;
  membros: MembroGrupo[];
}

export interface ConvitePartyRecebido {
  idConvidante: number;
  nomeConvidante: string;
  partyId: number;
  membros: MembroGrupo[];
  prazoSegundos: number;
  recebidoEm: number;
}

export interface PoderGrupo {
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

export interface ConsumivelGrupo {
  id_item: number;
  nome: string;
  imagem_url?: string | null;
  quantidade: number;
  efeito_vida?: number;
  efeito_mana?: number;
}

export interface AliadoBatalhaGrupo {
  id: number;
  nome: string;
  genero: string;
  classe?: string;
  vidaMax: number;
  manaMax: number;
  vida: number;
  mana: number;
  poderes: PoderGrupo[];
  consumiveis: ConsumivelGrupo[];
}

export interface BatalhaGrupoIniciadaPayload {
  battleId: number;
  zona: { id: number; nome: string };
  inimigo: {
    nome: string;
    nivel: number;
    vida_atual: number;
    vida_maxima: number;
    // Expansão Aventura Beta §29/§39 — Party resolve sprite igual ao
    // combate solo, por sprite_key (null = EnemySprite genérico).
    sprite_key?: string | null;
    // Foto estática do monstro — sprite de combate quando ainda não
    // existe sprite_key dedicado (mesmo critério do combate solo).
    imagem_url?: string | null;
  };
  membros: AliadoBatalhaGrupo[];
  ordem: string[];
  turnoDe: string;
  rodada: number;
  prazoSegundos: number;
  // Pedido do jogador — aviso de power-leveling: presente (não-null)
  // quando a diferença de nível DENTRO do grupo (maior - menor) é grande
  // demais, e por isso a recompensa de XP/ouro do grupo INTEIRO vai sair
  // reduzida nesta aventura.
  penalidadeDiferencaNivel?: { multiplicador: number; diferencaNivel: number } | null;
}

export interface TurnoGrupoPayload {
  battleId: number;
  origem: "aliado" | "monstro";
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
  // Motor de Status (mesmo formato do Duelo ao vivo/PvP assíncrono) —
  // agora também na Aventura em Grupo: monstro pode causar status
  // configurado no admin, DoT tica no fim do turno de quem tá com ele
  // (nunca na hora do golpe que aplicou), e hard control pode bloquear a
  // ação de quem estiver agindo (aliado OU monstro).
  bloqueado?: boolean;
  logStatus?: string[];
  statusInimigo?: StatusInstanceDuelo[];
  statusAliados?: Record<string, StatusInstanceDuelo[]>;
  combatBuffsInimigo?: CombatBuffInstanceDuelo[];
  combatBuffsAliados?: Record<string, CombatBuffInstanceDuelo[]>;
  vidaInimigo?: number;
  vidaAliado?: number;
  manaAliado?: number;
  rodada: number;
}

export interface ProximoTurnoGrupoPayload {
  battleId: number;
  turnoDe: string;
  prazoSegundos: number;
  rodada: number;
}

export interface BatalhaGrupoFimPayload {
  battleId: number;
  vitoria: boolean;
  motivo: string;
  recompensas: Record<string, { experiencia: number; dinheiro: number; nivel: number; pontos_distribuir: number }>;
  drops: Record<string, { tipo: "item" | "ouro"; item?: { id: number; nome: string; raridade: string }; dinheiro?: number }>;
  penalidadeDiferencaNivel?: { multiplicador: number; diferencaNivel: number } | null;
}

// Boss da Guilda V2.0 (batalha em tempo real) — mesmo modelo de payload
// da Aventura em grupo acima, só trocando "inimigo"/"zona" por "chefe"
// e sem consumíveis (o boss da guilda não aceita ação tipo "item").
// Sem sala de espera (pedido do jogador: "entrar tipo aventura") —
// SOCKET_EVENTS.GUILDBOSS.ENTRAR já entrega o personagem dentro da luta.
