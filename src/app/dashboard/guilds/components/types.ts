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
  // Escada própria da guilda F..S — sobe só por Missões de Rank
  // concluídas pelos membros (ver GuildMissionsTab.tsx), nunca mais
  // pelo Boss (ver GuildBossTab.tsx).
  rank?: string;
  missoes_rank_concluidas_no_rank_atual?: number;
  experiencia_total_ganha?: number;
  bosses_derrotados_total?: number;
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

export interface MensagemMural {
  id: number;
  idPersonagemAutor: number;
  nomeAutor: string;
  texto: string;
  createdAt: string;
}

export interface LogGuild {
  id: number;
  tipo: string;
  id_personagem_responsavel: number | null;
  // Nome já resolvido pelo backend (bug corrigido: o log só mostrava O
  // QUE foi feito, nunca QUEM fez) — null quando o personagem não tem
  // responsável/alvo registrado ou foi removido depois do log.
  nome_responsavel: string | null;
  id_personagem_alvo: number | null;
  nome_alvo: string | null;
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

// Tesouro V2 — Armazém de itens/equipamentos da guilda (spec "Tesouro
// da Guilda V2 + Contribuição V2" §12), separado do saldo de ouro
// acima (GuildResumo.tesouro/TransacaoTesouro, inalterados).
export interface TesouroItemEstoque {
  id_item: number;
  nome?: string;
  imagem_url?: string | null;
  tipo_item?: string;
  raridade?: string;
  quantidade: number;
}

export interface TesouroEquipamento {
  id: number;
  id_item: number;
  nome?: string;
  imagem_url?: string | null;
  raridade: string | null;
  refinamento: number;
  depositado_por: string | null;
  depositado_em: string;
}

export interface TesouroResumo {
  capacidade: number;
  slots_usados: number;
  pode_depositar: boolean;
  pode_retirar: boolean;
  estoque: TesouroItemEstoque[];
  equipamentos: TesouroEquipamento[];
}

export interface TesouroMovimentacao {
  id: number;
  operation: "DEPOSITO" | "RETIRADA";
  personagem: { id: number; nome: string } | null;
  id_item: number;
  nome_item: string;
  raridade: string | null;
  refinamento: number | null;
  quantidade: number | null;
  createdAt: string;
}

// Contribuição V2 — ranking por período + detalhe de membro, aditivos
// à rota legada de GuildContribution (Contribuicao acima, inalterada).
export type PeriodoContribuicao = "week" | "month" | "all";

export interface ContribuicaoRankingLinha {
  personagem: { id: number; nome: string; nivel: number } | null;
  pontos: number;
  composicao: Record<string, number>;
}

export interface ContribuicaoMembroDetalhe {
  pontos_semana: number;
  pontos_mes: number;
  pontos_historico: number;
  composicao: Record<string, number>;
  ultima_contribuicao: { source_type: string; pontos: number; createdAt: string } | null;
}

export const PERMISSOES = [
  "convidar",
  "aceitar_candidatura",
  "expulsar",
  "promover_rebaixar",
  "editar_identidade",
  "editar_cargos",
  "autorizar_gastos",
  "liberar_boss",
  "comprar_beneficios",
  "gerenciar_mural",
  "retirar_itens_tesouro",
] as const;

export type Permissao = (typeof PERMISSOES)[number];

export const RECURSO_LABEL = "Prestígio";
