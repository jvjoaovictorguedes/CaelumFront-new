// Wiki do Jogo — leitura pública. conteudo é texto plano com parágrafos
// separados por linha em branco (mesma convenção do Pergaminho das
// Atualizações) — o frontend divide por "\n\n" e renderiza cada um
// como <p>, nunca markdown.
import axiosInstance from "@/utils/axiosIntance";

export interface WikiArtigoResumoApi {
  id: number;
  categoria: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  imagem_url: string | null;
  ordem: number;
}
export interface WikiCategoriaApi {
  categoria: string;
  artigos: WikiArtigoResumoApi[];
}
export interface WikiArtigoApi {
  id: number;
  categoria: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  conteudo: string;
  imagem_url: string | null;
  ordem: number;
}

export async function listarWikiCategorias(): Promise<WikiCategoriaApi[]> {
  const resposta = await axiosInstance.get<{ data: { categorias: WikiCategoriaApi[] } }>("/wiki");
  return resposta.data.data.categorias;
}

export async function obterWikiArtigo(slug: string): Promise<WikiArtigoApi> {
  const resposta = await axiosInstance.get<{ data: { artigo: WikiArtigoApi } }>(`/wiki/${slug}`);
  return resposta.data.data.artigo;
}
