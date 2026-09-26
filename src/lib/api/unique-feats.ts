// Sistema de Proezas Únicas §17 — API pública (autenticada, sem
// permissão de admin nenhuma). Espelha o contrato de
// uniqueFeatPublicService.montarClaimPublico/montarEntradaHall no
// backend: nome/descricao_publica/legado podem vir `null` mesmo numa
// Proeza já conquistada (política reveal_after_claim REMAIN_SECRET/
// FLAVOR_ONLY) — a UI trata isso como "??? uma lenda ainda não foi
// escrita", nunca como erro.
import axiosInstance from "@/utils/axiosIntance";

export interface UniqueFeatLegado {
  nome: string;
}

export interface UniqueFeatItem {
  key: string;
  conquistada: boolean;
  // Só presentes quando conquistada = true.
  portador?: string;
  claimed_at?: string;
  // Presentes tanto numa Proeza conquistada (sujeitos a reveal_after_claim,
  // por isso `null` é valor válido) quanto num teaser (conquistada = false).
  nome?: string | null;
  descricao_publica?: string | null;
  legado?: UniqueFeatLegado | null;
}

export interface HallDasLendasResposta {
  itens: UniqueFeatItem[];
  pagina: number;
  totalPaginas: number;
  totalItens: number;
}

export async function obterHallDasLendas(page = 1): Promise<HallDasLendasResposta> {
  const resposta = await axiosInstance.get<{ data: HallDasLendasResposta }>("/unique-feats/hall", {
    params: { page },
  });
  return resposta.data.data;
}

// Proezas do PRÓPRIO personagem — sempre completas (nunca redigido, o
// dono do feito não tem segredo escondido do que ele mesmo conquistou).
export async function obterMinhasProezas(): Promise<UniqueFeatItem[]> {
  const resposta = await axiosInstance.get<{ data: { itens: UniqueFeatItem[] } }>("/unique-feats/me");
  return resposta.data.data.itens;
}

export async function obterProezaPublica(key: string): Promise<UniqueFeatItem | null> {
  try {
    const resposta = await axiosInstance.get<{ data: UniqueFeatItem }>(`/unique-feats/${key}/public`);
    return resposta.data.data;
  } catch {
    return null;
  }
}
