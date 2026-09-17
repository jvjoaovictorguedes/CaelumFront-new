export interface GuildResumo {
  id: number;
  nome: string;
  sigla: string;
  descricao: string | null;
  emblema_url: string | null;
  nivel: number;
  experiencia: number;
  prestigio: number;
  limite_membros: number;
  tipo_recrutamento: "Aberto" | "Aprovacao" | "Convite";
  status: string;
  id_lider: number;
  mural: string | null;
  meta_ativa: string | null;
  totalMembros?: number;
  // Só vem preenchido quando quem pediu já é membro da guilda (o back
  // omite pra jogador de fora, ver seção 13 do documento de design).
  tesouro?: number;
  // Mesma escada de rank do personagem (F...S++) — sobe derrotando o
  // Portal de Guilda coletivamente (ver GuildGatePortalTab.tsx).
  rank?: string;
}

export type Cargo = "Fundador" | "Oficial" | "Veterano" | "Membro" | "Recruta";

export interface MembroGuild {
  id_personagem: number;
  nome: string;
  nivel: number;
  genero: string;
  cargo: Cargo;
  data_entrada: string;
}

export interface ConviteRecebido {
  id: number;
  id_guild: number;
  status: string;
  data_expiracao: string;
  Guild: { id: number; nome: string; sigla: string; emblema_url: string | null; nivel: number };
}

export interface Candidatura {
  id: number;
  id_guild: number;
  id_personagem: number;
  mensagem: string | null;
  status: string;
  createdAt: string;
  Character?: { id: number; nome: string; nivel: number };
}

export interface LogGuild {
  id: number;
  tipo: string;
  id_personagem_responsavel: number | null;
  id_personagem_alvo: number | null;
  detalhes: string | null;
  createdAt: string;
}

export interface TransacaoTesouro {
  id: number;
  tipo: "Doacao" | "Gasto" | "Estorno";
  id_personagem: number | null;
  valor: number;
  saldo_resultante: number;
  motivo: string | null;
  createdAt: string;
  Character?: { id: number; nome: string };
}

export interface Contribuicao {
  id: number;
  id_personagem: number;
  ouro_doado_total: number;
  contribuicao_total: number;
  contribuicao_temporada: number;
  Character?: { id: number; nome: string; nivel: number };
}

export const PERMISSOES = [
  "convidar",
  "aceitar_candidatura",
  "expulsar",
  "promover_rebaixar",
  "editar_identidade",
  "editar_cargos",
  "autorizar_gastos",
  "iniciar_portal",
] as const;

export type Permissao = (typeof PERMISSOES)[number];

export const RECURSO_LABEL = "Prestígio";
