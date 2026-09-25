// Painel Administrativo de Músicas — chamadas de API, em arquivo
// PRÓPRIO (não em lib/api/admin.ts) pra não conflitar com outras
// frentes mexendo naquele arquivo compartilhado ao mesmo tempo. Toda
// rota aqui é protegida no backend por authMiddleware + adminMiddleware
// + requireAdminPermission("music.manage"/"music.publish").
import axiosInstance from "@/utils/axiosIntance";

export function mensagemDeErroAdminMusica(erro: unknown, padrao: string): string {
  return (erro as { response?: { data?: { message?: string } } })?.response?.data?.message ?? padrao;
}

export interface MusicSlotApi {
  slot_key: string;
  label: string;
  kind: "PAGE" | "CONTEXT";
  priority: "PAGE" | "AREA" | "COMBAT" | "PVP" | "BOSS";
}

export interface MusicTrackVersaoResumo {
  versao: number;
  duracao_ms: number | null;
  tamanho_bytes: number;
}

export interface MusicTrackApi {
  id: number;
  key: string;
  nome: string;
  descricao: string | null;
  loop: boolean;
  default_volume: number | null;
  ativo: boolean;
  versaoAtual: MusicTrackVersaoResumo | null;
}

export interface MusicTrackFileVersionApi {
  id: number;
  id_track: number;
  versao: number;
  nome_arquivo_original: string | null;
  mime: string;
  tamanho_bytes: number;
  duracao_ms: number | null;
  checksum_sha256: string;
  ativo: boolean;
  createdAt: string;
}

export interface MusicPoolApi {
  id: number;
  key: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

export interface MusicAssignmentApi {
  id: number;
  id_config_version: number;
  slot_key: string;
  assignment_type: "TRACK" | "POOL" | "SILENCE";
  id_track: number | null;
  id_pool: number | null;
  fade_ms: number | null;
  track?: MusicTrackApi | null;
  pool?: MusicPoolApi | null;
}

export interface MusicPoolMembershipApi {
  id: number;
  id_pool: number;
  id_track: number;
  peso: number;
  ordem: number;
  track?: MusicTrackApi | null;
}

export interface MusicDraftApi {
  draft: { id: number; version_number: number; status: string; notes: string | null };
  publicadaVersionNumber: number | null;
  assignments: MusicAssignmentApi[];
  memberships: MusicPoolMembershipApi[];
}

export interface MusicResumoApi {
  publicadaVersionNumber: number | null;
  draftVersionNumber: number;
  alteracoesPendentes: number;
}

export interface MusicHistoricoItemApi {
  id: number;
  version_number: number;
  status: "PUBLISHED" | "ARCHIVED";
  notes: string | null;
  published_at: string | null;
}

// --- Slots / resumo ---
export async function listarSlotsMusica() {
  const r = await axiosInstance.get<{ data: { slots: MusicSlotApi[] } }>("/admin/music/slots");
  return r.data.data.slots;
}
export async function obterResumoMusica() {
  const r = await axiosInstance.get<{ data: MusicResumoApi }>("/admin/music/summary");
  return r.data.data;
}

// --- Tracks ---
export async function listarTracksMusica(params?: { nome?: string; ativo?: boolean }) {
  const r = await axiosInstance.get<{ data: { tracks: MusicTrackApi[] } }>("/admin/music/tracks", { params });
  return r.data.data.tracks;
}
export async function criarTrackMusica(payload: {
  key: string;
  nome: string;
  descricao?: string;
  loop?: boolean;
  default_volume?: number | null;
}) {
  const r = await axiosInstance.post<{ data: { track: MusicTrackApi } }>("/admin/music/tracks", payload);
  return r.data.data.track;
}
export async function atualizarTrackMusica(id: number, payload: Partial<MusicTrackApi>) {
  const r = await axiosInstance.put<{ data: { track: MusicTrackApi } }>(`/admin/music/tracks/${id}`, payload);
  return r.data.data.track;
}
export async function desativarTrackMusica(id: number) {
  const r = await axiosInstance.post<{ data: { track: MusicTrackApi } }>(`/admin/music/tracks/${id}/deactivate`);
  return r.data.data.track;
}
export async function reativarTrackMusica(id: number) {
  const r = await axiosInstance.post<{ data: { track: MusicTrackApi } }>(`/admin/music/tracks/${id}/reactivate`);
  return r.data.data.track;
}
export async function listarVersoesMusica(idTrack: number) {
  const r = await axiosInstance.get<{ data: { versoes: MusicTrackFileVersionApi[] } }>(`/admin/music/tracks/${idTrack}/files`);
  return r.data.data.versoes;
}
export async function enviarVersaoMusica(idTrack: number, arquivo: File) {
  const form = new FormData();
  form.append("arquivo", arquivo);
  const r = await axiosInstance.post<{ data: { versao: MusicTrackFileVersionApi } }>(
    `/admin/music/tracks/${idTrack}/files`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return r.data.data.versao;
}
export async function ativarVersaoMusica(idTrack: number, versao: number) {
  const r = await axiosInstance.post<{ data: { versao: MusicTrackFileVersionApi } }>(
    `/admin/music/tracks/${idTrack}/files/${versao}/activate`,
  );
  return r.data.data.versao;
}

// --- Draft ---
export async function obterDraftMusica() {
  const r = await axiosInstance.get<{ data: MusicDraftApi }>("/admin/music/draft");
  return r.data.data;
}
export async function atualizarAssignmentMusica(
  slotKey: string,
  payload: { assignment_type: "TRACK" | "POOL" | "SILENCE"; id_track?: number | null; id_pool?: number | null; fade_ms?: number | null },
) {
  const r = await axiosInstance.put<{ data: { assignment: MusicAssignmentApi } }>(
    `/admin/music/draft/assignments/${slotKey}`,
    payload,
  );
  return r.data.data.assignment;
}
export async function descartarDraftMusica() {
  await axiosInstance.delete("/admin/music/draft");
}
export async function validarDraftMusica() {
  const r = await axiosInstance.post<{ data: { valido: boolean; erros: string[] } }>("/admin/music/draft/validate");
  return r.data.data;
}
export async function publicarDraftMusica(notes?: string) {
  const r = await axiosInstance.post<{ data: { version_number: number } }>("/admin/music/draft/publish", { notes });
  return r.data.data;
}

// --- Pools ---
export async function listarPoolsMusica() {
  const r = await axiosInstance.get<{ data: { pools: MusicPoolApi[] } }>("/admin/music/pools");
  return r.data.data.pools;
}
export async function criarPoolMusica(payload: { key: string; nome: string; descricao?: string }) {
  const r = await axiosInstance.post<{ data: { pool: MusicPoolApi } }>("/admin/music/pools", payload);
  return r.data.data.pool;
}
export async function atualizarTracksDoPoolMusica(idPool: number, itens: { id_track: number; peso: number; ordem?: number }[]) {
  const r = await axiosInstance.put<{ data: { membros: MusicPoolMembershipApi[] } }>(
    `/admin/music/draft/pools/${idPool}/tracks`,
    { itens },
  );
  return r.data.data.membros;
}

// --- Histórico ---
export async function listarHistoricoMusica() {
  const r = await axiosInstance.get<{ data: { historico: MusicHistoricoItemApi[] } }>("/admin/music/history");
  return r.data.data.historico;
}
export async function restaurarVersaoMusica(versionNumber: number) {
  const r = await axiosInstance.post<{ data: { draft: { version_number: number } } }>(
    `/admin/music/history/${versionNumber}/restore`,
  );
  return r.data.data.draft;
}
