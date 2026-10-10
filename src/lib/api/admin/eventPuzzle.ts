import axiosInstance from "@/utils/axiosIntance";

// Evento "O Coração da Máquina Celestial" — Fase 15 (Admin completo /
// "Puzzle Builder"). Espelha 1:1 /api/admin/event-puzzles
// (adminEventPuzzleRoutes.js + adminEventPuzzleController.js no
// CaelumBack-new) — mesmo padrão de src/lib/api/admin/powers.ts
// (domínio grande isolado em arquivo próprio, re-exportado por
// admin.ts). GET usa event_puzzle.view; toda mutação usa
// event_puzzle.manage — nenhuma chamada aqui concede acesso por si só,
// a permissão real é sempre checada de novo no backend.

// --------------------------------------------------------- EventDefinition
export type EventPuzzleDefinitionStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface EventPuzzleDefinitionApi {
  id: number;
  key: string;
  nome: string;
  descricao: string | null;
  status: EventPuzzleDefinitionStatus;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayloadEventPuzzleDefinicaoAdmin {
  key: string;
  nome: string;
  descricao?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function listarDefinicoesEventPuzzleAdmin(): Promise<EventPuzzleDefinitionApi[]> {
  const resposta = await axiosInstance.get<{ data: EventPuzzleDefinitionApi[] }>("/admin/event-puzzles/definitions");
  return resposta.data.data;
}
export async function criarDefinicaoEventPuzzleAdmin(payload: PayloadEventPuzzleDefinicaoAdmin): Promise<EventPuzzleDefinitionApi> {
  const resposta = await axiosInstance.post<{ data: EventPuzzleDefinitionApi }>("/admin/event-puzzles/definitions", payload);
  return resposta.data.data;
}
export async function transicionarDefinicaoEventPuzzleAdmin(id: number, status: EventPuzzleDefinitionStatus): Promise<EventPuzzleDefinitionApi> {
  const resposta = await axiosInstance.patch<{ data: EventPuzzleDefinitionApi }>(`/admin/event-puzzles/definitions/${id}`, { status });
  return resposta.data.data;
}

// ------------------------------------------------------------- EventEdition
export type EventPuzzleEditionStatus = "DRAFT" | "SCHEDULED" | "ACTIVE" | "ENDED" | "CANCELLED";

export interface EventPuzzleEditionApi {
  id: number;
  id_event_definition: number;
  key: string;
  nome: string;
  status: EventPuzzleEditionStatus;
  starts_at: string | null;
  ends_at: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayloadEventPuzzleEdicaoAdmin {
  key: string;
  nome: string;
  starts_at?: string | null;
  ends_at?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function listarEdicoesEventPuzzleAdmin(idDefinicao: number): Promise<EventPuzzleEditionApi[]> {
  const resposta = await axiosInstance.get<{ data: EventPuzzleEditionApi[] }>(`/admin/event-puzzles/definitions/${idDefinicao}/editions`);
  return resposta.data.data;
}
export async function criarEdicaoEventPuzzleAdmin(idDefinicao: number, payload: PayloadEventPuzzleEdicaoAdmin): Promise<EventPuzzleEditionApi> {
  const resposta = await axiosInstance.post<{ data: EventPuzzleEditionApi }>(`/admin/event-puzzles/definitions/${idDefinicao}/editions`, payload);
  return resposta.data.data;
}
export async function transicionarEdicaoEventPuzzleAdmin(id: number, status: EventPuzzleEditionStatus): Promise<EventPuzzleEditionApi> {
  const resposta = await axiosInstance.patch<{ data: EventPuzzleEditionApi }>(`/admin/event-puzzles/editions/${id}`, { status });
  return resposta.data.data;
}

// ---------------------------------------------------------- PuzzleBlueprint
export interface PuzzleBlueprintApi {
  id: number;
  id_event_definition: number;
  key: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  id_blueprint_prerequisito: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayloadPuzzleBlueprintCriarAdmin {
  key: string;
  nome: string;
  descricao?: string | null;
  ordem?: number;
  id_blueprint_prerequisito?: number | null;
}

export interface PayloadPuzzleBlueprintEditarAdmin {
  nome?: string;
  descricao?: string | null;
  ordem?: number;
  id_blueprint_prerequisito?: number | null;
}

export async function listarBlueprintsEventPuzzleAdmin(idDefinicao: number): Promise<PuzzleBlueprintApi[]> {
  const resposta = await axiosInstance.get<{ data: PuzzleBlueprintApi[] }>(`/admin/event-puzzles/definitions/${idDefinicao}/blueprints`);
  return resposta.data.data;
}
export async function criarBlueprintEventPuzzleAdmin(
  idDefinicao: number,
  payload: PayloadPuzzleBlueprintCriarAdmin,
): Promise<{ blueprint: PuzzleBlueprintApi; versao: PuzzleBlueprintVersionApi }> {
  const resposta = await axiosInstance.post<{ data: { blueprint: PuzzleBlueprintApi; versao: PuzzleBlueprintVersionApi } }>(
    `/admin/event-puzzles/definitions/${idDefinicao}/blueprints`,
    payload,
  );
  return resposta.data.data;
}
export async function atualizarBlueprintEventPuzzleAdmin(id: number, payload: PayloadPuzzleBlueprintEditarAdmin): Promise<PuzzleBlueprintApi> {
  const resposta = await axiosInstance.patch<{ data: PuzzleBlueprintApi }>(`/admin/event-puzzles/blueprints/${id}`, payload);
  return resposta.data.data;
}

// --------------------------------------------------- PuzzleBlueprintVersion
export type PuzzleBlueprintVersionStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface PuzzleBlueprintVersionApi {
  id: number;
  id_blueprint: number;
  version: number;
  status: PuzzleBlueprintVersionStatus;
  config: Record<string, unknown>;
  published_at: string | null;
  published_by_admin_id: number | null;
  solvability_signature: string | null;
  solvability_validated_at: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listarVersoesEventPuzzleAdmin(idBlueprint: number): Promise<PuzzleBlueprintVersionApi[]> {
  const resposta = await axiosInstance.get<{ data: PuzzleBlueprintVersionApi[] }>(`/admin/event-puzzles/blueprints/${idBlueprint}/versions`);
  return resposta.data.data;
}
export async function criarVersaoEventPuzzleAdmin(idBlueprint: number, config?: Record<string, unknown>): Promise<PuzzleBlueprintVersionApi> {
  const resposta = await axiosInstance.post<{ data: PuzzleBlueprintVersionApi }>(`/admin/event-puzzles/blueprints/${idBlueprint}/versions`, { config });
  return resposta.data.data;
}
export async function atualizarVersaoEventPuzzleAdmin(idVersion: number, config: Record<string, unknown>): Promise<PuzzleBlueprintVersionApi> {
  const resposta = await axiosInstance.patch<{ data: PuzzleBlueprintVersionApi }>(`/admin/event-puzzles/blueprint-versions/${idVersion}`, { config });
  return resposta.data.data;
}
export async function transicionarVersaoEventPuzzleAdmin(idVersion: number, status: PuzzleBlueprintVersionStatus): Promise<PuzzleBlueprintVersionApi> {
  const resposta = await axiosInstance.patch<{ data: PuzzleBlueprintVersionApi }>(`/admin/event-puzzles/blueprint-versions/${idVersion}/status`, { status });
  return resposta.data.data;
}

// Fase 15 — dry-run de solvabilidade. Nunca um solver automático: o
// Admin submete `acoes` (a golden solution candidata) e o backend
// simula exatamente o que o jogador faria, passo a passo.
export interface PuzzleSolvabilidadeAcaoApi {
  type: string;
  componentId?: string;
  payload?: Record<string, unknown>;
}

export type PuzzleSolvabilidadeEtapa = "DOMINIO" | "ESTRUTURA_OU_TOPOLOGIA" | "SIMULACAO" | "OBJETIVOS_INCOMPLETOS";

export interface PuzzleSolvabilidadeResultadoApi {
  valido: boolean;
  etapa?: PuzzleSolvabilidadeEtapa;
  erro?: string;
  indiceFalha?: number;
  acao?: PuzzleSolvabilidadeAcaoApi;
  trace?: Array<{ indice: number; acao: PuzzleSolvabilidadeAcaoApi; eventos: unknown[] }>;
  assinatura?: string;
  objetivosConcluidos?: string[];
}

export async function validarSolvabilidadeEventPuzzleAdmin(
  idVersion: number,
  acoes: PuzzleSolvabilidadeAcaoApi[],
): Promise<PuzzleSolvabilidadeResultadoApi> {
  const resposta = await axiosInstance.post<{ data: PuzzleSolvabilidadeResultadoApi }>(
    `/admin/event-puzzles/blueprint-versions/${idVersion}/validate-solvability`,
    { acoes },
  );
  return resposta.data.data;
}

// ------------------------------------------------- PuzzleClueDefinition (9)
export type PuzzleTriggerType = "OBJECTIVE_COMPLETED" | "INSTANCE_COMPLETED";

export interface PuzzleClueDefinitionApi {
  id: number;
  id_blueprint: number;
  key: string;
  titulo: string;
  texto: string;
  trigger_type: PuzzleTriggerType;
  objective_id: string | null;
  ordem: number;
  createdAt: string;
  updatedAt: string;
}

export interface PayloadPuzzleClueAdmin {
  key?: string;
  titulo?: string;
  texto?: string;
  triggerType?: PuzzleTriggerType;
  objectiveId?: string | null;
  ordem?: number;
}

export async function listarPistasEventPuzzleAdmin(idBlueprint: number): Promise<PuzzleClueDefinitionApi[]> {
  const resposta = await axiosInstance.get<{ data: PuzzleClueDefinitionApi[] }>(`/admin/event-puzzles/blueprints/${idBlueprint}/clues`);
  return resposta.data.data;
}
export async function criarPistaEventPuzzleAdmin(idBlueprint: number, payload: PayloadPuzzleClueAdmin): Promise<PuzzleClueDefinitionApi> {
  const resposta = await axiosInstance.post<{ data: PuzzleClueDefinitionApi }>(`/admin/event-puzzles/blueprints/${idBlueprint}/clues`, payload);
  return resposta.data.data;
}
export async function atualizarPistaEventPuzzleAdmin(id: number, payload: PayloadPuzzleClueAdmin): Promise<PuzzleClueDefinitionApi> {
  const resposta = await axiosInstance.patch<{ data: PuzzleClueDefinitionApi }>(`/admin/event-puzzles/clues/${id}`, payload);
  return resposta.data.data;
}
export async function excluirPistaEventPuzzleAdmin(id: number): Promise<void> {
  await axiosInstance.delete(`/admin/event-puzzles/clues/${id}`);
}

// ------------------------------------------- PuzzlePioneerMilestone (10)
export interface PuzzlePioneerMilestoneApi {
  id: number;
  id_blueprint: number;
  key: string;
  titulo: string;
  descricao: string;
  trigger_type: PuzzleTriggerType;
  objective_id: string | null;
  max_claims: number;
  ordem: number;
  createdAt: string;
  updatedAt: string;
}

export interface PayloadPuzzleMilestoneAdmin {
  key?: string;
  titulo?: string;
  descricao?: string;
  triggerType?: PuzzleTriggerType;
  objectiveId?: string | null;
  maxClaims?: number;
  ordem?: number;
}

export async function listarMarcosEventPuzzleAdmin(idBlueprint: number): Promise<PuzzlePioneerMilestoneApi[]> {
  const resposta = await axiosInstance.get<{ data: PuzzlePioneerMilestoneApi[] }>(`/admin/event-puzzles/blueprints/${idBlueprint}/milestones`);
  return resposta.data.data;
}
export async function criarMarcoEventPuzzleAdmin(idBlueprint: number, payload: PayloadPuzzleMilestoneAdmin): Promise<PuzzlePioneerMilestoneApi> {
  const resposta = await axiosInstance.post<{ data: PuzzlePioneerMilestoneApi }>(`/admin/event-puzzles/blueprints/${idBlueprint}/milestones`, payload);
  return resposta.data.data;
}
export async function atualizarMarcoEventPuzzleAdmin(id: number, payload: PayloadPuzzleMilestoneAdmin): Promise<PuzzlePioneerMilestoneApi> {
  const resposta = await axiosInstance.patch<{ data: PuzzlePioneerMilestoneApi }>(`/admin/event-puzzles/milestones/${id}`, payload);
  return resposta.data.data;
}
export async function excluirMarcoEventPuzzleAdmin(id: number): Promise<void> {
  await axiosInstance.delete(`/admin/event-puzzles/milestones/${id}`);
}

// ------------------------------------------- PuzzleRewardDefinition (14)
export interface PuzzleRewardDefinitionApi {
  id: number;
  id_blueprint: number;
  key: string;
  titulo_exibicao: string;
  descricao_exibicao: string;
  trigger_type: PuzzleTriggerType;
  objective_id: string | null;
  reward_ouro: number;
  reward_xp: number;
  id_item: number | null;
  item_quantidade: number;
  achievement_key: string | null;
  ordem: number;
  createdAt: string;
  updatedAt: string;
}

export interface PayloadPuzzleRewardAdmin {
  key?: string;
  tituloExibicao?: string;
  descricaoExibicao?: string;
  triggerType?: PuzzleTriggerType;
  objectiveId?: string | null;
  rewardOuro?: number;
  rewardXp?: number;
  idItem?: number | null;
  itemQuantidade?: number;
  achievementKey?: string | null;
  ordem?: number;
}

export async function listarRecompensasEventPuzzleAdmin(idBlueprint: number): Promise<PuzzleRewardDefinitionApi[]> {
  const resposta = await axiosInstance.get<{ data: PuzzleRewardDefinitionApi[] }>(`/admin/event-puzzles/blueprints/${idBlueprint}/rewards`);
  return resposta.data.data;
}
export async function criarRecompensaEventPuzzleAdmin(idBlueprint: number, payload: PayloadPuzzleRewardAdmin): Promise<PuzzleRewardDefinitionApi> {
  const resposta = await axiosInstance.post<{ data: PuzzleRewardDefinitionApi }>(`/admin/event-puzzles/blueprints/${idBlueprint}/rewards`, payload);
  return resposta.data.data;
}
export async function atualizarRecompensaEventPuzzleAdmin(id: number, payload: PayloadPuzzleRewardAdmin): Promise<PuzzleRewardDefinitionApi> {
  const resposta = await axiosInstance.patch<{ data: PuzzleRewardDefinitionApi }>(`/admin/event-puzzles/rewards/${id}`, payload);
  return resposta.data.data;
}
export async function excluirRecompensaEventPuzzleAdmin(id: number): Promise<void> {
  await axiosInstance.delete(`/admin/event-puzzles/rewards/${id}`);
}

// --------------------------------------------- EventPuzzleBossConfig (13)
// "Custódio do Meridiano" — clone estrutural do Guardião do Templo, mas
// recompensa é só ouro+xp fixo (nunca um catálogo de loot sorteável —
// isso é a Fase 14, por cima/separado) e "editável" é guardado pela
// EventDefinition (ARCHIVED bloqueia), nunca por um singleton próprio.
export interface EventPuzzleBossConfigApi {
  id: number;
  id_event_definition: number;
  id_monstro_base: number;
  id_blueprint_gatilho: number | null;
  nome_exibicao: string | null;
  lore: string | null;
  target_turns_to_kill: number;
  target_boss_actions_survivable: number;
  scaling_min_multiplier: number;
  scaling_max_multiplier: number;
  reward_ouro_primeira_vitoria: number;
  reward_xp_primeira_vitoria: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PayloadEventPuzzleBossConfigAdmin {
  id_monstro_base: number;
  id_blueprint_gatilho?: number | null;
  nome_exibicao?: string | null;
  lore?: string | null;
  target_turns_to_kill?: number;
  target_boss_actions_survivable?: number;
  scaling_min_multiplier?: number;
  scaling_max_multiplier?: number;
  reward_ouro_primeira_vitoria?: number;
  reward_xp_primeira_vitoria?: number;
  ativo?: boolean;
}

export interface EventPuzzleBossPhaseApi {
  id: number;
  id_boss_config: number;
  ordem: number;
  hp_threshold_pct: number;
  nome_exibicao: string | null;
  dano_multiplicador: number;
  defesa_multiplicador: number;
  enrage: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PayloadEventPuzzleBossFaseAdmin {
  ordem?: number;
  hp_threshold_pct?: number;
  nome_exibicao?: string | null;
  dano_multiplicador?: number;
  defesa_multiplicador?: number;
  enrage?: boolean;
}

export interface EventPuzzleBossResistanceApi {
  id: number;
  id_boss_config: number;
  status_key: string;
  imune: boolean;
  resistencia_pct: number;
  createdAt: string;
  updatedAt: string;
}

export interface PayloadEventPuzzleBossResistenciaAdmin {
  status_key?: string;
  imune?: boolean;
  resistencia_pct?: number;
}

export async function obterBossEventPuzzleAdmin(idDefinicao: number): Promise<{
  config: EventPuzzleBossConfigApi | null;
  fases: EventPuzzleBossPhaseApi[];
  resistencias: EventPuzzleBossResistanceApi[];
}> {
  const resposta = await axiosInstance.get<{
    data: { config: EventPuzzleBossConfigApi | null; fases: EventPuzzleBossPhaseApi[]; resistencias: EventPuzzleBossResistanceApi[] };
  }>(`/admin/event-puzzles/definitions/${idDefinicao}/boss`);
  return resposta.data.data;
}
export async function salvarBossConfigEventPuzzleAdmin(idDefinicao: number, payload: PayloadEventPuzzleBossConfigAdmin): Promise<EventPuzzleBossConfigApi> {
  const resposta = await axiosInstance.put<{ data: EventPuzzleBossConfigApi }>(`/admin/event-puzzles/definitions/${idDefinicao}/boss/config`, payload);
  return resposta.data.data;
}
export async function criarFaseBossEventPuzzleAdmin(idDefinicao: number, payload: PayloadEventPuzzleBossFaseAdmin): Promise<EventPuzzleBossPhaseApi> {
  const resposta = await axiosInstance.post<{ data: EventPuzzleBossPhaseApi }>(`/admin/event-puzzles/definitions/${idDefinicao}/boss/phases`, payload);
  return resposta.data.data;
}
export async function atualizarFaseBossEventPuzzleAdmin(
  idDefinicao: number,
  idFase: number,
  payload: PayloadEventPuzzleBossFaseAdmin,
): Promise<EventPuzzleBossPhaseApi> {
  const resposta = await axiosInstance.patch<{ data: EventPuzzleBossPhaseApi }>(
    `/admin/event-puzzles/definitions/${idDefinicao}/boss/phases/${idFase}`,
    payload,
  );
  return resposta.data.data;
}
export async function excluirFaseBossEventPuzzleAdmin(idDefinicao: number, idFase: number): Promise<void> {
  await axiosInstance.delete(`/admin/event-puzzles/definitions/${idDefinicao}/boss/phases/${idFase}`);
}
export async function criarResistenciaBossEventPuzzleAdmin(
  idDefinicao: number,
  payload: PayloadEventPuzzleBossResistenciaAdmin,
): Promise<EventPuzzleBossResistanceApi> {
  const resposta = await axiosInstance.post<{ data: EventPuzzleBossResistanceApi }>(
    `/admin/event-puzzles/definitions/${idDefinicao}/boss/resistances`,
    payload,
  );
  return resposta.data.data;
}
export async function atualizarResistenciaBossEventPuzzleAdmin(
  idDefinicao: number,
  idResistencia: number,
  payload: PayloadEventPuzzleBossResistenciaAdmin,
): Promise<EventPuzzleBossResistanceApi> {
  const resposta = await axiosInstance.patch<{ data: EventPuzzleBossResistanceApi }>(
    `/admin/event-puzzles/definitions/${idDefinicao}/boss/resistances/${idResistencia}`,
    payload,
  );
  return resposta.data.data;
}
export async function excluirResistenciaBossEventPuzzleAdmin(idDefinicao: number, idResistencia: number): Promise<void> {
  await axiosInstance.delete(`/admin/event-puzzles/definitions/${idDefinicao}/boss/resistances/${idResistencia}`);
}
