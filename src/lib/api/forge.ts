// Profissão de Ferreiro — cliente do jogador pra Ferraria/Receitas/
// Habilidades de Ferreiro. Endpoints novos sob /api/crafting (mesmo
// domínio da Forja); Fundição/Fabricação/Refinamento continuam com suas
// próprias chamadas inline em cada painel (ver SmeltingPanel/
// CraftingPanel/RefinementPanel) — este arquivo só cobre o que é NOVO.
import axiosInstance from "@/utils/axiosIntance";

export interface ChancePreviewFundicaoApi {
  area: "Fundicao";
  nivel_forja: number;
  chance_base_percentual: number;
  bonus_ferramenta_percentual: number;
  chance_final_percentual: number;
}

export interface ChancePreviewFabricacaoApi {
  area: "Fabricacao";
  nivel_forja: number;
  qualidade_base: string;
  bonus_guilda_percentual: number;
  bonus_ferramenta_percentual: number;
  distribuicao_final_percentual: Record<string, number>;
}

export async function getChancePreviewFundicao(): Promise<ChancePreviewFundicaoApi> {
  const resp = await axiosInstance.get<{ data: ChancePreviewFundicaoApi }>("/crafting/chance-preview", {
    params: { area: "Fundicao" },
  });
  return resp.data.data;
}

export async function getChancePreviewFabricacao(qualidade: string): Promise<ChancePreviewFabricacaoApi> {
  const resp = await axiosInstance.get<{ data: ChancePreviewFabricacaoApi }>("/crafting/chance-preview", {
    params: { area: "Fabricacao", qualidade },
  });
  return resp.data.data;
}

export type RaridadeReceita = "Comum" | "Raro" | "Lendario";

export interface ReceitaConhecidaApi {
  id_blueprint: number;
  nome_blueprint: string;
  categoria_equipamento: string;
  tier_equipamento: number | null;
  nivel_forja_necessario: number;
  raridade_receita: RaridadeReceita | null;
  origem: string;
  aprendida_em: string;
}

export interface ReceitaNoInventarioApi {
  id_item: number;
  nome_item: string;
  imagem_url: string | null;
  raridade_receita: RaridadeReceita;
  id_blueprint: number;
  nome_blueprint: string;
  nivel_forja_necessario: number;
  pode_aprender: boolean;
  quantidade_disponivel: number;
}

export interface LivroReceitasApi {
  nivel_forja: number;
  resumo: { total: number; Comum: number; Raro: number; Lendario: number };
  conhecidas: ReceitaConhecidaApi[];
  no_inventario: ReceitaNoInventarioApi[];
}

export async function getRecipeBook(): Promise<LivroReceitasApi> {
  const resp = await axiosInstance.get<{ data: LivroReceitasApi }>("/crafting/recipe-book");
  return resp.data.data;
}

export async function learnRecipe(idItem: number): Promise<{ id_blueprint: number; nome_blueprint: string; raridade_receita: RaridadeReceita }> {
  const resp = await axiosInstance.post<{ data: { id_blueprint: number; nome_blueprint: string; raridade_receita: RaridadeReceita } }>(
    `/crafting/recipe-book/${idItem}/learn`,
  );
  return resp.data.data;
}

export type SlotFerraria = "Fole" | "Martelo" | "Tenaz";

export interface FerramentaApi {
  id_instancia: number;
  id_item: number;
  nome: string;
  imagem_url: string | null;
  raridade: string;
  tier_equipamento: number | null;
  refinamento: number;
  slot: SlotFerraria;
  nivel_ferreiro_minimo: number;
  nivel_suficiente: boolean;
  efeitos: { effect_key: string; valor_ppm: number }[];
  equipada: boolean;
  pode_negociar: boolean;
}

export async function getTools(): Promise<FerramentaApi[]> {
  const resp = await axiosInstance.get<{ data: { ferramentas: FerramentaApi[] } }>("/crafting/tools");
  return resp.data.data.ferramentas;
}

export async function equipTool(idInstancia: number): Promise<{ slot: SlotFerraria; id_instancia: number }> {
  const resp = await axiosInstance.post<{ data: { slot: SlotFerraria; id_instancia: number } }>(`/crafting/tools/${idInstancia}/equip`);
  return resp.data.data;
}

export async function unequipTool(slot: SlotFerraria): Promise<void> {
  await axiosInstance.post(`/crafting/tools/${slot}/unequip`);
}

export interface BlacksmithStatsApi {
  progresso: { nivel: number; experiencia: number; xp_proximo_nivel: number | null };
  stats: {
    barras_fundidas: number;
    equipamentos_fabricados: number;
    refinamentos_sucesso: number;
    refinamentos_falha: number;
    maior_refinamento_alcancado: number;
    qualidades_fabricadas: Record<string, number>;
    receitas_aprendidas: { Comum: number; Raro: number; Lendario: number };
  };
}

export async function getBlacksmithStats(): Promise<BlacksmithStatsApi> {
  const resp = await axiosInstance.get<{ data: BlacksmithStatsApi }>("/crafting/blacksmith/stats");
  return resp.data.data;
}
