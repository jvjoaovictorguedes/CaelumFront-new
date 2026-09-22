/**
 * Chamadas HTTP do domínio PvP (casual, Arena Ranqueada v2 e Torneios).
 *
 * Antes cada componente montava a URL na mão — `/pvp/status/:id` era
 * buscado em DOIS lugares (a página da Arena e o card do perfil) com
 * lógica duplicada. Tudo que fala com o backend de PvP passa a morar
 * aqui, com os tipos das respostas em um lugar só.
 *
 * IMPORTANTE: os endpoints de Ranqueada v2 e Torneio são novos e estão
 * sendo escritos em paralelo no backend. Todo acesso a campo novo é
 * defensivo (opcional + `??`), e cada função trata 404/erro devolvendo
 * `null` em vez de estourar — a tela mostra estado vazio, nunca quebra.
 */
import axiosInstance from "@/utils/axiosIntance";

/* ------------------------------------------------------------------ */
/* Casual                                                              */
/* ------------------------------------------------------------------ */

export interface PvpStatusCasual {
  total_batalhas: number;
  vitorias: number;
  derrotas: number;
  sequencia_vitorias: number;
  maximo_sequencia_vitorias: number;
}

export interface OponenteCasual {
  id: number;
  nome: string;
  nivel: number;
  genero: string;
  Race?: { nome_masculino?: string; nome_feminino?: string };
  Class?: { nome?: string };
}

/**
 * Aviso obrigatório (spec §7) — precisa aparecer na aba Casual da Arena
 * e na visão casual da página de Ranking.
 */
export const AVISO_CASUAL_NAO_COMPETITIVO =
  "PvP Casual não contabiliza para o modo competitivo. Vitórias e derrotas Casuais não alteram seu Elo, Rating ou posição no Ranking Ranqueado.";

export async function buscarStatusCasual(characterId: number): Promise<PvpStatusCasual | null> {
  try {
    const resposta = await axiosInstance.get<{ data?: { pvpStatus?: PvpStatusCasual } }>(
      `/pvp/status/${characterId}`,
    );
    return resposta.data?.data?.pvpStatus ?? null;
  } catch {
    return null;
  }
}

export async function buscarOponentesCasuais(characterId: number): Promise<OponenteCasual[]> {
  try {
    const resposta = await axiosInstance.get<{ data?: { oponentes?: OponenteCasual[] } }>(
      `/pvp/opponents/${characterId}`,
    );
    return resposta.data?.data?.oponentes ?? [];
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Arena Ranqueada v2 — Tier + Divisão + Elo                           */
/* ------------------------------------------------------------------ */

export const TIERS = [
  "Ferro",
  "Bronze",
  "Prata",
  "Ouro",
  "Platina",
  "Diamante",
  "Mestre",
] as const;

export type Tier = (typeof TIERS)[number];

/** Mestre não tem divisão; os demais vão de IV (entrada) a I (topo). */
export type Divisao = "IV" | "III" | "II" | "I";

/**
 * Cores por Tier — enquanto não existir arte real de emblema, o emblema
 * é um badge circular com essas cores e a divisão em romano por cima
 * (a própria spec sugere "uma imagem por Tier + IV/III/II/I como texto").
 */
export const CORES_POR_TIER: Record<string, { de: string; para: string; borda: string; texto: string }> = {
  Ferro: { de: "#6b6b6b", para: "#3a3a3a", borda: "#8a8a8a", texto: "#e8e8e8" },
  Bronze: { de: "#b1702f", para: "#6d4318", borda: "#d08a3f", texto: "#ffe9d0" },
  Prata: { de: "#c9d2db", para: "#7d8792", borda: "#e6edf3", texto: "#1d232a" },
  Ouro: { de: "#f3b43f", para: "#a5710f", borda: "#ffd980", texto: "#2a1e08" },
  Platina: { de: "#5fd6c4", para: "#1f7f73", borda: "#9af0e3", texto: "#06231f" },
  Diamante: { de: "#6fb3f5", para: "#2352a3", borda: "#a8d4ff", texto: "#04182f" },
  Mestre: { de: "#c07bf0", para: "#6a2aa8", borda: "#e0b6ff", texto: "#1d0530" },
};

export function coresDoTier(tier?: string | null) {
  return CORES_POR_TIER[tier ?? ""] ?? CORES_POR_TIER.Ferro;
}

/** "Bronze IV" / "Mestre" (Mestre não tem divisão). */
export function rotuloDeElo(tier?: string | null, divisao?: string | null): string {
  if (!tier) return "Sem classificação";
  if (tier === "Mestre" || !divisao) return tier;
  return `${tier} ${divisao}`;
}

export interface StatusRanked {
  tier?: Tier | string | null;
  division?: Divisao | string | null;
  rating?: number | null;
  seasonWins?: number | null;
  seasonLosses?: number | null;
  peakRating?: number | null;
  matchesToday?: number | null;
  dailyLimit?: number | null;
  seasonEndsAt?: string | null;
  /** Chave da arte do emblema, quando o backend começar a expor uma. */
  tierAssetKey?: string | null;
  temporada?: { id?: number; nome?: string; starts_at?: string; ends_at?: string; status?: string } | null;
  /** Verdadeiro se o jogador já está dentro de uma partida ranqueada. */
  emPartidaRanked?: boolean | null;
}

export interface LinhaLeaderboard {
  posicao: number;
  id: number;
  nome: string;
  rating: number;
  tier?: string | null;
  division?: string | null;
  /** Campo da v1; mantido pra não quebrar caso o backend ainda mande. */
  liga?: string | null;
  jogos?: number;
  vitorias?: number;
  derrotas?: number;
  online?: boolean;
}

export interface MatchRankedIniciada {
  duelId?: number;
  matchId?: number;
  ranked?: boolean;
  [chave: string]: unknown;
}

export async function buscarStatusRanked(): Promise<StatusRanked | null> {
  try {
    const resposta = await axiosInstance.get<StatusRanked & { data?: StatusRanked }>(
      "/pvp/ranked/status",
    );
    // Aceita tanto `{ ...status }` (v1) quanto `{ data: { ...status } }`
    // (padrão do resto da API) — o backend v2 ainda pode mudar de ideia.
    return resposta.data?.data ?? resposta.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Matchmaking assíncrono v2: não existe fila. O servidor escolhe um
 * oponente controlado por IA e já cria a partida; o duelo em si chega
 * pelo socket (`ranked:match:start`), com o mesmo shape de
 * `pvp:duelo-iniciado`.
 */
export async function iniciarPartidaRanked(): Promise<MatchRankedIniciada | null> {
  const resposta = await axiosInstance.post<MatchRankedIniciada & { data?: MatchRankedIniciada }>(
    "/pvp/ranked/match/start",
  );
  return resposta.data?.data ?? resposta.data ?? null;
}

export async function buscarLeaderboardRanked(): Promise<LinhaLeaderboard[]> {
  try {
    const resposta = await axiosInstance.get<{
      itens?: LinhaLeaderboard[];
      data?: { itens?: LinhaLeaderboard[] };
    }>("/pvp/ranked/leaderboard");
    return resposta.data?.itens ?? resposta.data?.data?.itens ?? [];
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Torneios                                                            */
/* ------------------------------------------------------------------ */

export type StatusTorneio =
  | "inscricoes"
  | "aguardando"
  | "em_andamento"
  | "finalizado"
  | "cancelado"
  | string;

export interface ParticipanteTorneio {
  id: number;
  nome?: string;
  nivel?: number;
  classe?: string | null;
  pronto?: boolean;
  eliminado?: boolean;
}

export interface PartidaTorneio {
  id: number;
  /** "quartas" | "semifinal" | "final" | "terceiro" */
  fase: string;
  /** Posição da partida dentro da fase, pra desenhar a chave. */
  ordem?: number;
  formato?: "MD3" | "MD5" | string;
  status?: string;
  participanteA?: ParticipanteTorneio | null;
  participanteB?: ParticipanteTorneio | null;
  placarA?: number | null;
  placarB?: number | null;
  vencedorId?: number | null;
  /** Ready-check: quem já confirmou e quanto tempo falta. */
  prontoA?: boolean | null;
  prontoB?: boolean | null;
  readyCheckTerminaEm?: string | null;
}

export interface ResumoTorneio {
  id: number;
  nome: string;
  status: StatusTorneio;
  nivelMinimo?: number | null;
  nivelMaximo?: number | null;
  participantes?: number | null;
  maxParticipantes?: number | null;
  premio?: string | null;
  comecaEm?: string | null;
  inscrito?: boolean | null;
  campeao?: ParticipanteTorneio | null;
  vice?: ParticipanteTorneio | null;
  terceiro?: ParticipanteTorneio | null;
}

export interface DetalheTorneio extends ResumoTorneio {
  participantesLista?: ParticipanteTorneio[];
  partidas?: PartidaTorneio[];
}

function listaDeTorneios(payload: unknown): ResumoTorneio[] {
  const corpo = payload as
    | { itens?: ResumoTorneio[]; torneios?: ResumoTorneio[]; data?: { itens?: ResumoTorneio[]; torneios?: ResumoTorneio[] } }
    | ResumoTorneio[]
    | undefined;
  if (Array.isArray(corpo)) return corpo;
  return (
    corpo?.itens ??
    corpo?.torneios ??
    corpo?.data?.itens ??
    corpo?.data?.torneios ??
    []
  );
}

export async function listarTorneios(): Promise<ResumoTorneio[]> {
  try {
    const resposta = await axiosInstance.get("/pvp/tournaments");
    return listaDeTorneios(resposta.data);
  } catch {
    return [];
  }
}

export async function buscarTorneio(id: number): Promise<DetalheTorneio | null> {
  try {
    const resposta = await axiosInstance.get<DetalheTorneio & { data?: DetalheTorneio }>(
      `/pvp/tournaments/${id}`,
    );
    return resposta.data?.data ?? resposta.data ?? null;
  } catch {
    return null;
  }
}

export async function inscreverEmTorneio(id: number): Promise<void> {
  await axiosInstance.post(`/pvp/tournaments/${id}/join`);
}

export async function sairDoTorneio(id: number): Promise<void> {
  await axiosInstance.post(`/pvp/tournaments/${id}/leave`);
}

/**
 * Confirma o ready-check da série atual. Rota ASSUMIDA — a lista de
 * rotas do backend só cita join/leave; se o ready-check for resolvido
 * por socket, é só trocar esta chamada por um `emit`.
 */
export async function confirmarProntoTorneio(
  idTorneio: number,
  idPartida?: number,
): Promise<void> {
  await axiosInstance.post(`/pvp/tournaments/${idTorneio}/ready`, { idPartida });
}

export const FASES_TORNEIO: { chave: string; label: string }[] = [
  { chave: "quartas", label: "Quartas" },
  { chave: "semifinal", label: "Semifinal" },
  { chave: "final", label: "Final" },
];

export function partidasDaFase(torneio: DetalheTorneio | null, fase: string): PartidaTorneio[] {
  return (torneio?.partidas ?? [])
    .filter((partida) => (partida.fase ?? "").toLowerCase() === fase)
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
}

/* ------------------------------------------------------------------ */
/* Troféus / medalhas de torneio (perfil)                              */
/* ------------------------------------------------------------------ */

export interface TrofeusTorneio {
  ouro?: number | null;
  prata?: number | null;
  bronze?: number | null;
}

/**
 * Medalhas do personagem. Endpoint ainda não confirmado com o backend —
 * tenta a rota dedicada e, se ela não existir, devolve `null` pra tela
 * mostrar zeros em vez de quebrar.
 */
export async function buscarTrofeusTorneio(characterId: number): Promise<TrofeusTorneio | null> {
  try {
    const resposta = await axiosInstance.get<{
      data?: TrofeusTorneio & { trofeus?: TrofeusTorneio };
      trofeus?: TrofeusTorneio;
      ouro?: number;
    }>(`/pvp/tournaments/trophies/${characterId}`);
    const corpo = resposta.data;
    return corpo?.data?.trofeus ?? corpo?.data ?? corpo?.trofeus ?? (corpo as TrofeusTorneio) ?? null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

export function mensagemDeErro(erro: unknown, padrao: string): string {
  return (
    (erro as { response?: { data?: { message?: string } } })?.response?.data?.message ?? padrao
  );
}

/** "3d 4h" / "4h 12min" / "12min" — tempo restante até uma data ISO. */
export function tempoRestante(iso?: string | null): string | null {
  if (!iso) return null;
  const fim = new Date(iso).getTime();
  if (Number.isNaN(fim)) return null;
  const ms = fim - Date.now();
  if (ms <= 0) return "encerrada";
  const minutos = Math.floor(ms / 60000);
  const dias = Math.floor(minutos / 1440);
  const horas = Math.floor((minutos % 1440) / 60);
  if (dias > 0) return `${dias}d ${horas}h`;
  if (horas > 0) return `${horas}h ${minutos % 60}min`;
  return `${minutos}min`;
}

export function dataCurta(iso?: string | null): string | null {
  if (!iso) return null;
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return null;
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
