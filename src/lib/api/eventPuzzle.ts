import axiosInstance from "@/utils/axiosIntance";

// Evento "O Coração da Máquina Celestial" — Fase 16 (experiência do
// jogador). Espelha 1:1 /api/events (eventPuzzleRoutes.js +
// eventPuzzleController.js no CaelumBack-new) — mesmo padrão de
// src/lib/api/temple.ts (axiosInstance + envelope {data:{...}} +
// mensagemDeErroXxx(error, fallback)). Separado de
// src/lib/api/admin/eventPuzzle.ts (aquele é só pro Puzzle Builder do
// Admin — nenhuma das funções abaixo chama uma rota /admin/*).

// --------------------------------------------------------- EventEdition
export interface EventPuzzleEdicaoAtivaApi {
  id: number;
  key: string;
  nome: string;
  starts_at: string | null;
  ends_at: string | null;
  definicao: { id: number; key: string; nome: string };
}

export async function listarEdicoesAtivasEventPuzzle(): Promise<EventPuzzleEdicaoAtivaApi[]> {
  const resposta = await axiosInstance.get<{ data: EventPuzzleEdicaoAtivaApi[] }>("/events/active");
  return resposta.data.data;
}

// ---------------------------------------------------------- Blueprints
export type DominioPuzzle = "MECANICO" | "OPTICO" | "HIDRAULICO" | "CONVERGENCIA";

// Apresentação progressiva dos objectives (correção de lifecycle/UX) —
// NUNCA assuma que `descricao` sempre existe: um objective futuro (nem
// concluído, nem o atual) chega do backend SEM essa chave — o backend
// já corta o dado na origem (dtoPublicoLayout/dtoRuntimeComObjetivos),
// então a UI só decide COMO exibir `???`/placeholder, nunca esconde
// algo que já veio revelado demais.
export interface PuzzleObjectivoProgressivoApi {
  id: string;
  descricao?: string | null;
  concluido: boolean;
  atual: boolean;
}

export interface PuzzleLayoutPublicoApi {
  dominio: DominioPuzzle | null;
  components: Array<{ id: string; type: string; props: Record<string, unknown>; position: { x: number; y: number } | null }>;
  connections: Array<{ id: string; from: { componentId: string; port: string }; to: { componentId: string; port: string } }>;
  objectives: PuzzleObjectivoProgressivoApi[];
}

// Estado autoritativo da sala pro personagem logado (correção de
// lifecycle — "listagem pública autoritativa"): o backend decide
// bloqueado/concluido/em_andamento/replayable, nunca o frontend infere
// isso tentando criar uma instância. Prioridade visual (nunca ambíguo):
// bloqueado → concluido → em_andamento → disponível.
export interface PuzzleBlueprintPublicoApi {
  id_blueprint: number;
  key: string;
  nome: string;
  titulo_publico: string;
  descricao_publica: string | null;
  dificuldade: string | null;
  ordem: number;
  bloqueado: boolean;
  concluido: boolean;
  completed_at: string | null;
  em_andamento: boolean;
  id_instancia_ativa: number | null;
  replayable: boolean;
  layout?: PuzzleLayoutPublicoApi;
}

export async function listarBlueprintsPublicosEventPuzzle(editionId: number): Promise<PuzzleBlueprintPublicoApi[]> {
  const resposta = await axiosInstance.get<{ data: PuzzleBlueprintPublicoApi[] }>(`/events/${editionId}/blueprints`);
  return resposta.data.data;
}

// ------------------------------------------------------ PuzzleInstance
export type PuzzleInstanceStatusApi = "CREATED" | "ACTIVE" | "COMPLETED" | "FAILED" | "ABANDONED" | "EXPIRED";

export interface PuzzleEstadoPublicoApi {
  components: Record<string, Record<string, unknown>>;
  objetivosConcluidos: string[];
}

export interface PuzzleInstanceRuntimeApi {
  id: number;
  status: PuzzleInstanceStatusApi;
  state_version: number;
  state: PuzzleEstadoPublicoApi;
  started_at: string | null;
  completed_at: string | null;
  // Apresentação progressiva (correção de lifecycle/UX) — sempre o
  // progresso REAL desta Instance; nunca revela `descricao` de um
  // objective futuro. Vem em toda resposta que carrega uma Instance
  // (criar/obter/ação/abandonar) — a UI nunca precisa combinar isto
  // com `blueprint.layout.objectives` (que só reflete o progresso no
  // instante em que a listagem foi buscada).
  objectivesProgressivos: PuzzleObjectivoProgressivoApi[];
}

export async function criarOuObterInstanciaEventPuzzle(
  editionId: number,
  idBlueprint: number,
): Promise<{ instancia: PuzzleInstanceRuntimeApi; criada: boolean }> {
  const resposta = await axiosInstance.post<{ data: PuzzleInstanceRuntimeApi }>(`/events/${editionId}/instances`, { idBlueprint });
  return { instancia: resposta.data.data, criada: resposta.status === 201 };
}

export async function obterInstanciaEventPuzzle(idInstance: number): Promise<PuzzleInstanceRuntimeApi> {
  const resposta = await axiosInstance.get<{ data: PuzzleInstanceRuntimeApi }>(`/events/puzzle-instances/${idInstance}`);
  return resposta.data.data;
}

export interface PuzzleAcaoApi {
  type: string;
  componentId?: string;
  payload?: Record<string, unknown>;
}

export interface PistaDesbloqueadaApi {
  id: number;
  titulo: string;
  texto: string;
}

export interface ConquistaPioneiraApi {
  posicao: number;
  titulo: string;
  descricao: string;
}

export interface RecompensaConcedidaApi {
  titulo: string;
  descricao: string;
  ouro: number;
  xp: number;
  idItem: number | null;
  itemQuantidade: number;
  conquista: { nome: string; descricao: string } | null;
}

export interface PuzzleAcaoResultadoApi {
  instancia: PuzzleInstanceRuntimeApi;
  eventos: Array<Record<string, unknown>>;
  pistasDesbloqueadas: PistaDesbloqueadaApi[];
  conquistasPioneiras: ConquistaPioneiraApi[];
  recompensasConcedidas: RecompensaConcedidaApi[];
}

export async function executarAcaoEventPuzzle(
  idInstance: number,
  acao: PuzzleAcaoApi,
  stateVersion: number,
): Promise<PuzzleAcaoResultadoApi> {
  const resposta = await axiosInstance.post<{ data: PuzzleAcaoResultadoApi }>(`/events/puzzle-instances/${idInstance}/actions`, {
    ...acao,
    stateVersion,
  });
  return resposta.data.data;
}

export async function abandonarInstanciaEventPuzzle(idInstance: number, stateVersion: number): Promise<PuzzleInstanceRuntimeApi> {
  const resposta = await axiosInstance.post<{ data: PuzzleInstanceRuntimeApi }>(`/events/puzzle-instances/${idInstance}/abandon`, {
    stateVersion,
  });
  return resposta.data.data;
}

// -------------------------------------------- Custódio do Meridiano (Boss)
export interface EventPuzzleBossStatusApi {
  status: "Nenhum" | "Disponivel";
  eventEditionId?: number;
  nomeExibicao?: string | null;
  lore?: string | null;
  imagemUrl?: string | null;
  desbloqueado?: boolean;
  jaVenceu?: boolean;
  tentativaEmAndamento?: boolean;
  meuPoderDeCombate?: number | null;
}

export async function obterStatusBossEventPuzzle(editionId: number): Promise<EventPuzzleBossStatusApi> {
  const resposta = await axiosInstance.get<{ data: EventPuzzleBossStatusApi }>(`/events/${editionId}/boss`);
  return resposta.data.data;
}

// ------------------------------------------- Caderno de Investigação
export type PuzzleCadernoEntradaApi =
  | { id: number; bloqueada: true }
  | { id: number; bloqueada: false; titulo: string; texto: string; unlockedAt: string };

export async function obterCadernoEventPuzzle(editionId: number): Promise<PuzzleCadernoEntradaApi[]> {
  const resposta = await axiosInstance.get<{ data: PuzzleCadernoEntradaApi[] }>(`/events/${editionId}/clues`);
  return resposta.data.data;
}

// ------------------------------------------------------- Hall das Lendas
export interface PuzzleQuadroDeHonraMarcoApi {
  id: number;
  titulo: string;
  descricao: string;
  maxClaims: number;
  conquistas: Array<{ posicao: number; nome: string; claimedAt: string }>;
}

export interface PuzzleFeedDeDescobertaApi {
  nome: string;
  posicao: number;
  titulo: string;
  claimedAt: string;
}

export interface PuzzleHallDasLendasApi {
  quadro: PuzzleQuadroDeHonraMarcoApi[];
  feed: PuzzleFeedDeDescobertaApi[];
}

export async function obterHallDasLendasEventPuzzle(editionId: number): Promise<PuzzleHallDasLendasApi> {
  const resposta = await axiosInstance.get<{ data: PuzzleHallDasLendasApi }>(`/events/${editionId}/legends`);
  return resposta.data.data;
}

export function mensagemDeErroEventPuzzle(erro: unknown, padrao: string): string {
  return (erro as { response?: { data?: { message?: string } } })?.response?.data?.message ?? padrao;
}

// Correção de lifecycle — "não criar replay acidental": a UI já evita
// chamar criarOuObterInstanciaEventPuzzle numa sala com `concluido:
// true` (ver EventPuzzleSalasPanel/RoomClient), então este 409 deveria
// ser raro — mas um cliente desatualizado (aba antiga, cache stale)
// ainda pode disparar essa chamada; nunca pode quebrar a tela, só
// mostrar que a sala já foi concluída e nunca tentar de novo.
export function erroEhPuzzleJaConcluido(erro: unknown): boolean {
  return (erro as { response?: { data?: { code?: string } } })?.response?.data?.code === "PUZZLE_JA_CONCLUIDO";
}
