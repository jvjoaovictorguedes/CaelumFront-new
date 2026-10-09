// Cliente de API do Templo do Véu Celestial (Convergências, Provações,
// Sigilos, Relicário dos Ecos e Guardião individual). A luta contra o
// Guardião em si é só via socket (templeboss:* — ver
// src/hooks/realtime/templeboss.ts); este módulo cobre status/
// missões/relicário e o status PÚBLICO (sem fórmula) do Guardião.
import axiosInstance from "@/utils/axiosIntance";

export type TempleEventStatusApi = "Nenhum" | "SCHEDULED" | "ACTIVE" | "RELICARY_ONLY" | "ENDED";

export interface TempleStatusApi {
  status: TempleEventStatusApi;
  event_id?: number;
  key?: string;
  nome?: string;
  lore?: string | null;
  teaser?: string | null;
  imagem_url?: string | null;
  starts_at?: string | null;
  missions_end_at?: string | null;
  relicary_end_at?: string | null;
  ended_at?: string | null;
  meus_sigilos?: number;
  id_currency_item?: number;
}

export async function obterStatusTemplo(): Promise<TempleStatusApi> {
  const resposta = await axiosInstance.get<{ data: TempleStatusApi }>("/temple/status");
  return resposta.data.data;
}

export type TempleMissionCategoria = "RITO_DIARIO" | "PROVACAO_PRINCIPAL" | "PROVACAO_FINAL";

export interface TempleMissionApi {
  key: string;
  categoria: TempleMissionCategoria;
  nome_exibicao: string;
  descricao: string;
  meta: number;
  reward_sigils: number;
  objective_type: string;
  progresso_atual: number;
  completed_at: string | null;
  claimed_at: string | null;
}

export interface TempleMissoesApi {
  event_id: number | null;
  missions: TempleMissionApi[];
}

export async function listarMissoesTemplo(): Promise<TempleMissoesApi> {
  const resposta = await axiosInstance.get<{ data: TempleMissoesApi }>("/temple/missions");
  return resposta.data.data;
}

export async function entregarItemMissaoTemplo(missionKey: string): Promise<TempleMissoesApi> {
  const resposta = await axiosInstance.post<{ data: TempleMissoesApi }>(`/temple/missions/${missionKey}/deliver`);
  return resposta.data.data;
}

export async function reclamarRecompensaMissaoTemplo(missionKey: string): Promise<{ sigilos_ganhos: number }> {
  const resposta = await axiosInstance.post<{ data: { sigilos_ganhos: number } }>(`/temple/missions/${missionKey}/claim`);
  return resposta.data.data;
}

export interface TempleRelicarioEntryApi {
  key: string;
  nome_exibicao: string;
  reward_kind: "STACKABLE_ITEM" | "EQUIPMENT";
  raridade_instancia: string | null;
  eh_raro_mais: boolean;
  eh_featured: boolean;
  chance_normal: number;
}

export interface TempleRelicarioApi {
  event_id: number | null;
  relicario: {
    nome: string;
    custo_sigilos_draw: number;
    meus_sigilos: number;
    pity_raro_mais_garantia: number | null;
    pity_featured_garantia: number | null;
    draws_desde_raro_mais: number;
    draws_desde_featured: number;
    total_draws: number;
    entries: TempleRelicarioEntryApi[];
  } | null;
}

export async function obterRelicarioTemplo(): Promise<TempleRelicarioApi> {
  const resposta = await axiosInstance.get<{ data: TempleRelicarioApi }>("/temple/relicary");
  return resposta.data.data;
}

export interface TempleDrawApi {
  draw_seq: number;
  entry_key: string;
  reward_kind: "STACKABLE_ITEM" | "EQUIPMENT";
  id_item: number;
  nome: string;
  quantidade: number;
  raridade: string | null;
  eh_fallback: boolean;
  createdAt: string;
}

export interface TempleSortearResultadoApi {
  idempotente: boolean;
  draws: TempleDrawApi[];
}

export async function sortearRelicarioTemplo(count: 1 | 10, clientRequestId: string): Promise<TempleSortearResultadoApi> {
  const resposta = await axiosInstance.post<{ data: TempleSortearResultadoApi }>("/temple/relicary/draw", {
    count,
    client_request_id: clientRequestId,
  });
  return resposta.data.data;
}

export async function listarHistoricoRelicarioTemplo(): Promise<TempleDrawApi[]> {
  const resposta = await axiosInstance.get<{ data: { draws: TempleDrawApi[] } }>("/temple/relicary/history");
  return resposta.data.data.draws;
}

// §13.3 — nunca revela a fórmula de scaling, só lore + Poder atual +
// desbloqueio/clear.
export interface TempleBossStatusApi {
  status: "Nenhum" | "Disponivel";
  event_id?: number;
  nome_exibicao?: string;
  lore?: string | null;
  imagem_url?: string | null;
  desbloqueado?: boolean;
  ja_venceu?: boolean;
  tentativa_em_andamento?: boolean;
  meu_poder_de_combate?: number | null;
}

export async function obterStatusGuardiaoTemplo(): Promise<TempleBossStatusApi> {
  const resposta = await axiosInstance.get<{ data: TempleBossStatusApi }>("/temple/boss/status");
  return resposta.data.data;
}

export function mensagemDeErroTemplo(erro: unknown, padrao: string): string {
  return (erro as { response?: { data?: { message?: string } } })?.response?.data?.message ?? padrao;
}

export async function temploDisponivel(): Promise<boolean> {
  try {
    const response = await axiosInstance.get<{enabled:boolean}>("/temple/availability");
    return response.data.enabled === true;
  } catch { return false; }
}
