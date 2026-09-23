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
  "Grão-Mestre",
] as const;

export type Tier = (typeof TIERS)[number];

/** Mestre e Grão-Mestre não têm divisão; os demais vão de IV (entrada) a I (topo). */
export type Divisao = "IV" | "III" | "II" | "I";

/**
 * Cores por Tier — usadas como fallback (borda/glow) em volta do emblema
 * real (ver EloBadge.tsx) e enquanto a imagem carrega.
 */
export const CORES_POR_TIER: Record<string, { de: string; para: string; borda: string; texto: string }> = {
  Ferro: { de: "#6b6b6b", para: "#3a3a3a", borda: "#8a8a8a", texto: "#e8e8e8" },
  Bronze: { de: "#b1702f", para: "#6d4318", borda: "#d08a3f", texto: "#ffe9d0" },
  Prata: { de: "#c9d2db", para: "#7d8792", borda: "#e6edf3", texto: "#1d232a" },
  Ouro: { de: "#f3b43f", para: "#a5710f", borda: "#ffd980", texto: "#2a1e08" },
  Platina: { de: "#5fd6c4", para: "#1f7f73", borda: "#9af0e3", texto: "#06231f" },
  Diamante: { de: "#6fb3f5", para: "#2352a3", borda: "#a8d4ff", texto: "#04182f" },
  Mestre: { de: "#c07bf0", para: "#6a2aa8", borda: "#e0b6ff", texto: "#1d0530" },
  "Grão-Mestre": { de: "#ff6b6b", para: "#a31d1d", borda: "#ffb3b3", texto: "#2f0505" },
};

// Chave de asset por Tier — espelha rankedTierService.tierParaAsset do
// backend (mesma convenção: minúsculo, hífen). O backend é quem decide
// oficialmente o tier a partir do rating; isso aqui só resolve o nome
// do arquivo em public/images/ranked/ a partir do nome do tier que já
// veio pronto da API.
const ASSET_POR_TIER: Record<string, string> = {
  Ferro: "ferro",
  Bronze: "bronze",
  Prata: "prata",
  Ouro: "ouro",
  Platina: "platina",
  Diamante: "diamante",
  Mestre: "mestre",
  "Grão-Mestre": "grao-mestre",
};

export function assetKeyDoTier(tier?: string | null) {
  return ASSET_POR_TIER[tier ?? ""] ?? ASSET_POR_TIER.Ferro;
}

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

interface RespostaStatusRankedBackend {
  temporada?: { id?: number; nome?: string; starts_at?: string; ends_at?: string; status?: string; diasRestantes?: number };
  participacao?: {
    rating?: number;
    tier?: string;
    divisao?: string | null;
    tierLabel?: string;
    tierAsset?: string;
    jogos?: number;
    vitorias?: number;
    derrotas?: number;
    peak_rating?: number;
  };
  limiteDiario?: { usadas?: number; limite?: number; restantes?: number; rotulo?: string };
  emPartidaRanked?: boolean;
  duelId?: number | null;
}

/**
 * `GET /pvp/ranked/status` devolve `{ temporada, participacao, limiteDiario,
 * emPartidaRanked, duelId }` (nomes em português, `divisao` em vez de
 * `division`). Esta função traduz pra o formato que os componentes já
 * consomem (StatusRanked), sem precisar mexer em RankedPanel/EloBadge.
 */
export async function buscarStatusRanked(): Promise<StatusRanked | null> {
  try {
    const resposta = await axiosInstance.get<RespostaStatusRankedBackend>("/pvp/ranked/status");
    const corpo = resposta.data;
    const p = corpo?.participacao;
    const t = corpo?.temporada;
    const limite = corpo?.limiteDiario;
    if (!p) return null;
    return {
      tier: p.tier ?? null,
      division: p.divisao ?? null,
      rating: p.rating ?? null,
      seasonWins: p.vitorias ?? null,
      seasonLosses: p.derrotas ?? null,
      peakRating: p.peak_rating ?? null,
      matchesToday: limite?.usadas ?? null,
      dailyLimit: limite?.limite ?? null,
      seasonEndsAt: t?.ends_at ?? null,
      tierAssetKey: p.tierAsset ?? null,
      temporada: t
        ? { id: t.id, nome: t.nome, starts_at: t.starts_at, ends_at: t.ends_at, status: t.status }
        : null,
      emPartidaRanked: corpo?.emPartidaRanked ?? null,
    };
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

interface LinhaLeaderboardBackend {
  posicao: number;
  id: number;
  nome: string;
  rating: number;
  tier?: string | null;
  divisao?: string | null;
  jogos?: number;
  vitorias?: number;
  derrotas?: number;
  peak_rating?: number;
  online?: boolean;
}

export async function buscarLeaderboardRanked(): Promise<LinhaLeaderboard[]> {
  try {
    const resposta = await axiosInstance.get<{ itens?: LinhaLeaderboardBackend[] }>(
      "/pvp/ranked/leaderboard",
    );
    return (resposta.data?.itens ?? []).map((linha) => ({
      posicao: linha.posicao,
      id: linha.id,
      nome: linha.nome,
      rating: linha.rating,
      tier: linha.tier ?? null,
      division: linha.divisao ?? null,
      jogos: linha.jogos,
      vitorias: linha.vitorias,
      derrotas: linha.derrotas,
      online: linha.online,
    }));
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
  /** characterId — comparável direto com `meuCharacterId`. */
  id: number;
  /** id da linha TournamentParticipant no backend; uso interno (resolver série→participante). */
  participantId?: number;
  nome?: string;
  nivel?: number;
  classe?: string | null;
  pronto?: boolean;
  eliminado?: boolean;
  /** 1º/2º/3º/4º lugar quando o torneio já terminou, senão null. */
  colocacao?: number | null;
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
  /** Só vem preenchido na visão de detalhe (a listagem não traz contagem). */
  participantes?: number | null;
  maxParticipantes?: number | null;
  premio?: string | null;
  comecaEm?: string | null;
  premioEntregue?: boolean | null;
}

export interface DetalheTorneio extends ResumoTorneio {
  participantesLista?: ParticipanteTorneio[];
  partidas?: PartidaTorneio[];
  /** Só existe quando o torneio já terminou (colocacao=1/2/3 nos participantes). */
  campeao?: ParticipanteTorneio | null;
  vice?: ParticipanteTorneio | null;
  terceiro?: ParticipanteTorneio | null;
}

/**
 * Mapa de status do backend (PascalCase em português, vindo do enum do
 * model `Tournament`) pro vocabulário que a UI já usa. "Rascunho" nunca
 * aparece pro jogador — é torneio ainda não publicado pelo DEV/ADM.
 */
const STATUS_TORNEIO_BACKEND: Record<string, StatusTorneio> = {
  Rascunho: "rascunho",
  InscricoesAbertas: "inscricoes",
  InscricoesFechadas: "aguardando",
  EmAndamento: "em_andamento",
  Finalizado: "finalizado",
  Cancelado: "cancelado",
};

/** "Oitavas" | "Quartas" | "Semifinal" | "TerceiroLugar" | "Final" (enum do backend) → chave de fase da UI. */
const FASE_TORNEIO_BACKEND: Record<string, string> = {
  Oitavas: "oitavas",
  Quartas: "quartas",
  Semifinal: "semifinal",
  TerceiroLugar: "terceiro",
  Final: "final",
};

interface ParticipanteTorneioBackend {
  id: number;
  characterId: number;
  nome?: string;
  nivel?: number | null;
  seed?: number;
  eliminado?: boolean;
  colocacao?: number | null;
}

interface SerieTorneioBackend {
  id: number;
  round: string;
  posicao?: number;
  participanteA?: number | null;
  participanteB?: number | null;
  formato?: string;
  placar?: { a?: number; b?: number };
  vencedor?: number | null;
  status?: string;
  readyCheckExpiraEm?: string | null;
}

interface TorneioBackend {
  id: number;
  name: string;
  description?: string | null;
  level_min?: number | null;
  level_max?: number | null;
  starts_at?: string | null;
  max_participants?: number | null;
  prize_description?: string | null;
  status: string;
  prize_delivered?: boolean;
  bracket?: unknown;
  participantes?: ParticipanteTorneioBackend[];
  series?: SerieTorneioBackend[];
}

function mapParticipante(raw: ParticipanteTorneioBackend): ParticipanteTorneio {
  return {
    id: raw.characterId,
    participantId: raw.id,
    nome: raw.nome,
    nivel: raw.nivel ?? undefined,
    eliminado: raw.eliminado,
    colocacao: raw.colocacao ?? null,
  };
}

function mapResumo(raw: TorneioBackend): ResumoTorneio {
  return {
    id: raw.id,
    nome: raw.name,
    status: STATUS_TORNEIO_BACKEND[raw.status] ?? raw.status,
    nivelMinimo: raw.level_min ?? null,
    nivelMaximo: raw.level_max ?? null,
    maxParticipantes: raw.max_participants ?? null,
    premio: raw.prize_description ?? null,
    comecaEm: raw.starts_at ?? null,
    premioEntregue: raw.prize_delivered ?? null,
  };
}

function mapDetalhe(raw: TorneioBackend): DetalheTorneio {
  const participantesLista = (raw.participantes ?? []).map(mapParticipante);
  const porParticipantId = new Map(
    (raw.participantes ?? []).map((p, indice) => [p.id, participantesLista[indice]]),
  );
  const partidas: PartidaTorneio[] = (raw.series ?? []).map((s) => ({
    id: s.id,
    fase: FASE_TORNEIO_BACKEND[s.round] ?? s.round.toLowerCase(),
    ordem: s.posicao,
    formato: s.formato,
    status: s.status,
    participanteA: s.participanteA != null ? (porParticipantId.get(s.participanteA) ?? null) : null,
    participanteB: s.participanteB != null ? (porParticipantId.get(s.participanteB) ?? null) : null,
    placarA: s.placar?.a ?? 0,
    placarB: s.placar?.b ?? 0,
    vencedorId: s.vencedor != null ? (porParticipantId.get(s.vencedor)?.id ?? null) : null,
    readyCheckTerminaEm: s.readyCheckExpiraEm ?? null,
    // prontoA/prontoB não vêm por REST — chegam ao vivo via socket
    // "torneio:serie:atualizada" depois de entrar na sala da série.
  }));

  return {
    ...mapResumo(raw),
    participantes: participantesLista.length,
    participantesLista,
    partidas,
    campeao: participantesLista.find((p) => p.colocacao === 1) ?? null,
    vice: participantesLista.find((p) => p.colocacao === 2) ?? null,
    terceiro: participantesLista.find((p) => p.colocacao === 3) ?? null,
  };
}

export async function listarTorneios(): Promise<ResumoTorneio[]> {
  try {
    const resposta = await axiosInstance.get<{ itens?: TorneioBackend[] }>("/pvp/tournaments");
    return (resposta.data?.itens ?? [])
      .filter((t) => t.status !== "Rascunho")
      .map(mapResumo);
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Torneios — administração (DEV/ADM)                                  */
/*                                                                      */
/* As rotas abaixo exigem authMiddleware + adminMiddleware no backend   */
/* (checagem real de User.isAdmin a cada chamada) — nada aqui           */
/* concede acesso por si só, só fala com as rotas que já são            */
/* protegidas.                                                          */
/* ------------------------------------------------------------------ */

/** Igual a listarTorneios(), mas sem esconder "Rascunho" — é o que o admin precisa ver. */
export async function listarTorneiosAdmin(): Promise<ResumoTorneio[]> {
  try {
    const resposta = await axiosInstance.get<{ itens?: TorneioBackend[] }>("/pvp/tournaments");
    return (resposta.data?.itens ?? []).map(mapResumo);
  } catch {
    return [];
  }
}

export interface NovoTorneio {
  name: string;
  description?: string;
  level_min?: number;
  level_max?: number;
  starts_at: string;
  max_participants: number;
  prize_description?: string;
}

export async function criarTorneio(dados: NovoTorneio): Promise<ResumoTorneio> {
  const resposta = await axiosInstance.post<{ torneio: TorneioBackend }>(
    "/admin/pvp/tournaments",
    dados,
  );
  return mapResumo(resposta.data.torneio);
}

export async function iniciarTorneioAdmin(id: number): Promise<ResumoTorneio> {
  const resposta = await axiosInstance.post<{ torneio: TorneioBackend }>(
    `/admin/pvp/tournaments/${id}/start`,
  );
  return mapResumo(resposta.data.torneio);
}

export async function cancelarTorneioAdmin(id: number, motivo?: string): Promise<ResumoTorneio> {
  const resposta = await axiosInstance.post<{ torneio: TorneioBackend }>(
    `/admin/pvp/tournaments/${id}/cancel`,
    { motivo },
  );
  return mapResumo(resposta.data.torneio);
}

export async function marcarPremioEntregueAdmin(
  id: number,
  entregue: boolean,
): Promise<ResumoTorneio> {
  const resposta = await axiosInstance.post<{ torneio: TorneioBackend }>(
    `/admin/pvp/tournaments/${id}/prize-delivered`,
    { entregue },
  );
  return mapResumo(resposta.data.torneio);
}

export async function buscarTorneio(id: number): Promise<DetalheTorneio | null> {
  try {
    const resposta = await axiosInstance.get<{ torneio: TorneioBackend }>(
      `/pvp/tournaments/${id}`,
    );
    return resposta.data?.torneio ? mapDetalhe(resposta.data.torneio) : null;
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

export const FASES_TORNEIO: { chave: string; label: string }[] = [
  { chave: "oitavas", label: "Oitavas" },
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
  trofeus?: number | null;
}

/**
 * Medalhas/troféus do personagem — `GET /pvp/tournaments/me/podium`
 * (sempre resolve `req.personagemAtual` no servidor; o `characterId`
 * recebido aqui só existe pra manter a assinatura estável caso a tela
 * um dia precise mostrar o pódio de outro personagem por uma rota própria
 * — hoje ele é ignorado porque a rota real não aceita um alvo escolhido
 * pelo cliente).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function buscarTrofeusTorneio(_characterId: number): Promise<TrofeusTorneio | null> {
  try {
    const resposta = await axiosInstance.get<{ podio?: TrofeusTorneio }>(
      "/pvp/tournaments/me/podium",
    );
    return resposta.data?.podio ?? null;
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
