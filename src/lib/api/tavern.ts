// Cliente de API do Sistema de Taverna (Descanso/Cardápio/Jogos — ver
// especificação Caelum_Taverna_Claude.docx). Servidor é sempre
// autoritativo: nada aqui calcula custo/chance/payout, só envia
// intenção e mostra o que a API devolve.
import axiosInstance from "@/utils/axiosIntance";

export interface DescansoPreview {
  bloqueado: boolean;
  motivoBloqueio: string | null;
  vida_atual: number;
  vida_maxima: number;
  mana_atual: number;
  mana_maxima: number;
  percentual_vida_faltante: number;
  percentual_mana_faltante: number;
  custo: number;
  dinheiro_disponivel: number;
  saldo_suficiente: boolean;
}

export interface DescansoResultado {
  custo_pago: number;
  vida_atual: number;
  vida_maxima: number;
  mana_atual: number;
  mana_maxima: number;
  dinheiro: number;
}

export async function previewDescanso(): Promise<DescansoPreview> {
  const resposta = await axiosInstance.get<{ data: DescansoPreview }>("/tavern/rest/preview");
  return resposta.data.data;
}

export async function confirmarDescanso(): Promise<DescansoResultado> {
  const resposta = await axiosInstance.post<{ data: DescansoResultado }>("/tavern/rest");
  return resposta.data.data;
}

export type CategoriaCardapio = "Refeicao" | "Bebida";

export interface OfertaCardapio {
  id: number;
  nome: string;
  descricao: string;
  categoria: CategoriaCardapio;
  preco_gold: number;
  buff_key: string;
  magnitude: number;
  duracao_segundos: number;
  imagem_url: string | null;
  ordem: number;
  ativo: boolean;
}

export async function listarCardapio(): Promise<OfertaCardapio[]> {
  const resposta = await axiosInstance.get<{ data: { itens: OfertaCardapio[] } }>("/tavern/menu");
  return resposta.data.data.itens;
}

export interface ConsumirOfertaResultado {
  buff: BuffAtivo;
  oferta: OfertaCardapio;
  dinheiro: number;
}

export async function consumirOferta(id: number): Promise<ConsumirOfertaResultado> {
  const resposta = await axiosInstance.post<{ data: ConsumirOfertaResultado }>(`/tavern/menu/${id}/consume`);
  return resposta.data.data;
}

export interface BuffAtivo {
  id: number;
  categoria: CategoriaCardapio;
  buff_key: string;
  magnitude: number;
  source_menu_item_id: number | null;
  activated_at: string;
  expires_at: string;
}

export async function listarBuffsAtivos(): Promise<BuffAtivo[]> {
  const resposta = await axiosInstance.get<{ data: { buffs: BuffAtivo[] } }>("/tavern/buffs");
  return resposta.data.data.buffs;
}

export type PresentationKey = "COIN" | "RUNES" | "DICE_PARITY" | "CARD_SIDE";

export interface TavernGame {
  id: number;
  key: string;
  nome: string;
  descricao: string;
  presentation_key: PresentationKey;
  win_chance_ppm: number;
  payout_multiplier: number;
  min_bet: number;
  max_bet: number;
  ordem: number;
  ativo: boolean;
}

export async function listarJogos(): Promise<TavernGame[]> {
  const resposta = await axiosInstance.get<{ data: { jogos: TavernGame[] } }>("/tavern/games");
  return resposta.data.data.jogos;
}

export interface ApostaResultado {
  outcome: "Win" | "Lose";
  bet_amount: number;
  payout_amount: number;
  net_change: number;
  choice_key: string;
  dinheiro: number;
}

export async function apostar(
  gameId: number,
  payload: { request_id: string; bet_amount: number; choice_key: string },
): Promise<ApostaResultado> {
  const resposta = await axiosInstance.post<{ data: ApostaResultado }>(`/tavern/games/${gameId}/play`, payload);
  return resposta.data.data;
}

export interface ApostaHistorico {
  id: string;
  bet_amount: number;
  choice_key: string;
  outcome: "Win" | "Lose";
  payout_amount: number;
  net_change: number;
  createdAt: string;
  jogo?: { id: number; nome: string; key: string; presentation_key: PresentationKey };
}

export async function historicoDeApostas(limite = 20): Promise<ApostaHistorico[]> {
  const resposta = await axiosInstance.get<{ data: { apostas: ApostaHistorico[] } }>("/tavern/games/history", {
    params: { limite },
  });
  return resposta.data.data.apostas;
}

export function mensagemDeErroTaverna(erro: unknown, padrao: string): string {
  return (erro as { response?: { data?: { message?: string } } })?.response?.data?.message ?? padrao;
}
