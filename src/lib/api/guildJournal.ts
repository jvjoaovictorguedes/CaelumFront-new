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

export async function obterGuildJournal(): Promise<GuildJournalEntryApi[]> {
  const resposta = await axiosInstance.get<{ data: { notas: GuildJournalEntryApi[] } }>("/guild-journal");
  return resposta.data.data.notas;
}
