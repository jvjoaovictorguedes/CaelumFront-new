// Jornal da Guilda dos Aventureiros — feed público de conquistas
// notáveis, curado pelo Admin. Leitura só (o jogador nunca publica).
import axiosInstance from "@/utils/axiosIntance";

export type CategoriaGuildJournal = "ConquistaIndividual" | "ConquistaDeGuilda" | "Evento" | "Outro";

export interface GuildJournalEntryApi {
  id: number;
  ordem: number;
  categoria: CategoriaGuildJournal;
  titulo: string;
  descricao: string;
  resumo: string | null;
  imagem_url: string | null;
  personagem_nome: string | null;
  guilda_nome: string | null;
  destaque: boolean;
  publicado_em: string;
}

export interface GuildJournalResposta {
  notas: GuildJournalEntryApi[];
  ultimo_id_visto: number | null;
  quantidade_nao_lida: number;
}

// Notificação (pedido do jogador: notificar tanto na Guilda dos
// Aventureiros quanto no próprio Jornal) — mesmo padrão de
// /patch-notes: quantidade_nao_lida já vem calculada pelo backend,
// ultimo_id_visto serve pro front marcar cada nota individualmente
// como "Nova".
export async function obterGuildJournalCompleto(): Promise<GuildJournalResposta> {
  const resposta = await axiosInstance.get<{ data: GuildJournalResposta }>("/guild-journal");
  return resposta.data.data;
}

export async function obterGuildJournal(): Promise<GuildJournalEntryApi[]> {
  const { notas } = await obterGuildJournalCompleto();
  return notas;
}

export async function marcarGuildJournalComoVisto(): Promise<void> {
  await axiosInstance.post("/guild-journal/mark-seen");
}
