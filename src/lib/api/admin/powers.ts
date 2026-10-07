import axiosInstance from "@/utils/axiosIntance";

// Painel Administrativo Fases 5/6/7 — Habilidades (Power), vínculos
// Classe/Raça, PowerStatusEffect/WeaponStatusEffect e previews.
export interface PowerStatusEffectApi {
  id: number;
  id_power: number;
  status_key: string;
  chance_ppm: number;
  duration_turns: number;
  potency_base: number;
  potency_scale_attribute: "Forca" | "Vitalidade" | "Agilidade" | "Inteligencia" | "Velocidade" | null;
  potency_scale_value: number;
  // Habilidades V2.0 §4/§21 — null = status continua no modo legado
  // (potency_base como dano absoluto). Quando configurado, o tick vira
  // essa % da Vida Máxima do alvo.
  percentual_vida_maxima?: number | null;
  target: "Self" | "Enemy";
  ativo: boolean;
}

// IA de Combate PvE & Habilidades de Monstros V1 (§4.1) — diz QUEM pode
// usar esta Power como ator de combate: CHARACTER (default, toda Power
// existente) nunca pode virar habilidade de monstro; só MONSTER/BOTH
// ficam disponíveis no picker de Habilidades do MonsterEditor.
export const USAGE_SCOPES = ["CHARACTER", "MONSTER", "BOTH"] as const;
export type UsageScope = (typeof USAGE_SCOPES)[number];
export const NOME_USAGE_SCOPE: Record<UsageScope, string> = {
  CHARACTER: "Personagem (padrão)",
  MONSTER: "Só monstro",
  BOTH: "Personagem e monstro",
};

export interface PowerApi {
  id: number;
  nome: string;
  descricao: string;
  tipo_poder: "Ativo" | "Passivo";
  custo_mana: number;
  dano_base: number | null;
  cura_base: number | null;
  cooldown: number | null;
  escala_atributo: "Forca" | "Vitalidade" | "Agilidade" | "Inteligencia" | "Velocidade";
  valor_escala: number;
  imagem_url: string | null;
  efeitosDeStatus?: PowerStatusEffectApi[];
  // Sistema de Proezas Únicas §9 — marca técnica de aquisição restrita
  // (sempre presente na resposta do backend, mesmo pra Powers normais).
  acquisition_scope?: "NORMAL" | "UNIQUE_FEAT";
  usage_scope: UsageScope;
}

export interface PayloadPowerAdmin {
  nome: string;
  descricao: string;
  tipo_poder: "Ativo" | "Passivo";
  custo_mana?: number;
  dano_base?: number | null;
  cura_base?: number | null;
  cooldown?: number | null;
  escala_atributo: "Forca" | "Vitalidade" | "Agilidade" | "Inteligencia" | "Velocidade";
  valor_escala?: number;
  imagem_url?: string | null;
  usage_scope?: UsageScope;
}

export async function listarPowersAdmin(
  filtros: { nome?: string; tipo_poder?: string; escala_atributo?: string; usage_scope?: UsageScope } = {},
): Promise<PowerApi[]> {
  const resposta = await axiosInstance.get<{ data: { powers: PowerApi[] } }>("/admin/powers", { params: filtros });
  return resposta.data.data.powers;
}
export async function criarPowerAdmin(payload: PayloadPowerAdmin): Promise<PowerApi> {
  const resposta = await axiosInstance.post<{ data: { power: PowerApi } }>("/admin/powers", payload);
  return resposta.data.data.power;
}
export async function atualizarPowerAdmin(id: number, payload: Partial<PayloadPowerAdmin>): Promise<PowerApi> {
  const resposta = await axiosInstance.patch<{ data: { power: PowerApi } }>(`/admin/powers/${id}`, payload);
  return resposta.data.data.power;
}
export async function duplicarPowerAdmin(id: number): Promise<PowerApi> {
  const resposta = await axiosInstance.post<{ data: { power: PowerApi } }>(`/admin/powers/${id}/duplicate`);
  return resposta.data.data.power;
}
export async function jogadoresAfetadosPowerAdmin(id: number): Promise<number> {
  const resposta = await axiosInstance.get<{ data: { total: number } }>(`/admin/powers/${id}/affected-players`);
  return resposta.data.data.total;
}

export interface ClassAbilityApi {
  id_classe: number;
  id_poder: number;
  nivel_aprendizagem: number;
  custo_ouro: number | null;
  Class?: { id: number; nome: string };
}
export interface RaceAbilityApi {
  id_raca: number;
  id_power: number;
  nivel_aprendizado: number;
  custo_ouro: number | null;
  Race?: { id: number; nome_masculino: string; nome_feminino: string };
}
export interface NatureAbilityApi {
  natureza_magica: "Fogo" | "Agua" | "Terra" | "Ar" | "Luz" | "Escuridao" | "Raio" | "Yin&Yang";
  id_poder: number;
  nivel_aprendizagem: number;
  custo_ouro: number | null;
}

export async function listarVinculosPowerAdmin(idPower: number): Promise<{ classes: ClassAbilityApi[]; racas: RaceAbilityApi[]; naturezas: NatureAbilityApi[] }> {
  const resposta = await axiosInstance.get<{ data: { classes: ClassAbilityApi[]; racas: RaceAbilityApi[]; naturezas: NatureAbilityApi[] } }>(`/admin/powers/${idPower}/links`);
  return resposta.data.data;
}
export async function vincularClassePowerAdmin(idPower: number, payload: { id_classe: number; nivel_aprendizagem: number; custo_ouro?: number | null }): Promise<ClassAbilityApi> {
  const resposta = await axiosInstance.put<{ data: { vinculo: ClassAbilityApi } }>(`/admin/powers/${idPower}/links/class`, payload);
  return resposta.data.data.vinculo;
}
export async function desvincularClassePowerAdmin(idPower: number, idClasse: number): Promise<void> {
  await axiosInstance.delete(`/admin/powers/${idPower}/links/class/${idClasse}`);
}
export async function vincularRacaPowerAdmin(idPower: number, payload: { id_raca: number; nivel_aprendizado: number; custo_ouro?: number | null }): Promise<RaceAbilityApi> {
  const resposta = await axiosInstance.put<{ data: { vinculo: RaceAbilityApi } }>(`/admin/powers/${idPower}/links/race`, payload);
  return resposta.data.data.vinculo;
}
export async function desvincularRacaPowerAdmin(idPower: number, idRaca: number): Promise<void> {
  await axiosInstance.delete(`/admin/powers/${idPower}/links/race/${idRaca}`);
}
export async function vincularNaturezaPowerAdmin(idPower: number, payload: { natureza_magica: NatureAbilityApi["natureza_magica"]; nivel_aprendizagem: number; custo_ouro?: number | null }): Promise<NatureAbilityApi> {
  const resposta = await axiosInstance.put<{ data: { vinculo: NatureAbilityApi } }>(`/admin/powers/${idPower}/links/nature`, payload);
  return resposta.data.data.vinculo;
}
export async function desvincularNaturezaPowerAdmin(idPower: number, naturezaMagica: NatureAbilityApi["natureza_magica"]): Promise<void> {
  await axiosInstance.delete(`/admin/powers/${idPower}/links/nature/${naturezaMagica}`);
}

export interface PayloadStatusEffectAdmin {
  status_key: string;
  chance_ppm?: number;
  duration_turns: number;
  potency_base?: number;
  potency_scale_attribute?: "Forca" | "Vitalidade" | "Agilidade" | "Inteligencia" | "Velocidade" | null;
  potency_scale_value?: number;
  percentual_vida_maxima?: number | null;
  target?: "Self" | "Enemy";
  ativo?: boolean;
}

export async function adicionarStatusEffectPowerAdmin(idPower: number, payload: PayloadStatusEffectAdmin): Promise<PowerStatusEffectApi> {
  const resposta = await axiosInstance.post<{ data: { efeito: PowerStatusEffectApi } }>(`/admin/powers/${idPower}/status-effects`, payload);
  return resposta.data.data.efeito;
}
export async function atualizarStatusEffectPowerAdmin(idEfeito: number, payload: Partial<PayloadStatusEffectAdmin>): Promise<PowerStatusEffectApi> {
  const resposta = await axiosInstance.patch<{ data: { efeito: PowerStatusEffectApi } }>(`/admin/powers/status-effects/${idEfeito}`, payload);
  return resposta.data.data.efeito;
}
export async function removerStatusEffectPowerAdmin(idEfeito: number): Promise<void> {
  await axiosInstance.delete(`/admin/powers/status-effects/${idEfeito}`);
}

export interface StatusCatalogEntryApi {
  status_key: string;
  nomeUi: string;
  ehDot: boolean;
  stack: string;
  mitigacao: string;
  stack_maximo: number | null;
  bloqueiaAcoes?: string[];
  quebraPorDanoDireto?: boolean;
  controleProbabilistico?: boolean;
  afetaAcerto?: boolean;
  modificaSaidaDeDano?: boolean;
}

export async function catalogoStatusAdmin(): Promise<StatusCatalogEntryApi[]> {
  const resposta = await axiosInstance.get<{ data: { catalogo: StatusCatalogEntryApi[] } }>("/admin/status-effects/catalog");
  return resposta.data.data.catalogo;
}

// Habilidades V2.0 (doc "Habilidades V2.0" §7/§17) — Fase 4.
// PowerCombatEffect: buffs/debuffs numéricos, escudo, regen, lifesteal,
// crítico, cura, Mana, cooldown, dispel, gatilho — tudo que
// PowerStatusEffect não representa.
export interface PowerCombatEffectApi {
  id: number;
  id_power: number;
  effect_key: string;
  target: string;
  trigger: string;
  magnitude_base: number;
  scale_attribute: "Forca" | "Vitalidade" | "Agilidade" | "Inteligencia" | "Velocidade" | null;
  scale_value: number;
  scale_with_ability_level: boolean;
  chance_ppm: number;
  duration_turns: number | null;
  stack_group: string | null;
  reapply_policy: string;
  max_stacks: number | null;
  condition_key: string | null;
  condition_config: Record<string, unknown>;
  dispellable: boolean;
  config: Record<string, unknown>;
  allow_pve: boolean;
  allow_party: boolean;
  allow_guild_boss: boolean;
  allow_world_boss: boolean;
  allow_pvp_casual: boolean;
  allow_ranked: boolean;
  allow_tournament: boolean;
  ativo: boolean;
}

export interface PayloadCombatEffectAdmin {
  effect_key: string;
  target?: string;
  trigger?: string;
  magnitude_base?: number;
  scale_attribute?: "Forca" | "Vitalidade" | "Agilidade" | "Inteligencia" | "Velocidade" | null;
  scale_value?: number;
  scale_with_ability_level?: boolean;
  chance_ppm?: number;
  duration_turns?: number | null;
  stack_group?: string | null;
  reapply_policy?: string;
  max_stacks?: number | null;
  condition_key?: string | null;
  condition_config?: Record<string, unknown>;
  dispellable?: boolean;
  config?: Record<string, unknown>;
  allow_pve?: boolean;
  allow_party?: boolean;
  allow_guild_boss?: boolean;
  allow_world_boss?: boolean;
  allow_pvp_casual?: boolean;
  allow_ranked?: boolean;
  allow_tournament?: boolean;
  ativo?: boolean;
}

export async function listarCombatEffectsPowerAdmin(idPower: number): Promise<PowerCombatEffectApi[]> {
  const resposta = await axiosInstance.get<{ data: { efeitos: PowerCombatEffectApi[] } }>(`/admin/powers/${idPower}/combat-effects`);
  return resposta.data.data.efeitos;
}
export async function adicionarCombatEffectPowerAdmin(idPower: number, payload: PayloadCombatEffectAdmin): Promise<PowerCombatEffectApi> {
  const resposta = await axiosInstance.post<{ data: { efeito: PowerCombatEffectApi } }>(`/admin/powers/${idPower}/combat-effects`, payload);
  return resposta.data.data.efeito;
}
export async function atualizarCombatEffectPowerAdmin(idEfeito: number, payload: Partial<PayloadCombatEffectAdmin>): Promise<PowerCombatEffectApi> {
  const resposta = await axiosInstance.patch<{ data: { efeito: PowerCombatEffectApi } }>(`/admin/powers/combat-effects/${idEfeito}`, payload);
  return resposta.data.data.efeito;
}
export async function removerCombatEffectPowerAdmin(idEfeito: number): Promise<void> {
  await axiosInstance.delete(`/admin/powers/combat-effects/${idEfeito}`);
}

export interface CombatEffectFieldApi {
  key: string;
  label: string;
  type: "number" | "select" | "text";
  required?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  optionsSource?: "statusKeys" | "stackGroups";
  options?: { value: string; label: string }[];
}

export interface CombatEffectSupportApi {
  status: "FUNCTIONAL" | "PARTIAL" | "UNSUPPORTED";
  label: string;
  description?: string;
}

export interface CombatEffectMetadataApi {
  key: string;
  label: string;
  unidade: "PERCENTUAL" | "FLAT" | "TURNOS" | "SEM_MAGNITUDE";
  previewTemplate: string;
  configFields: CombatEffectFieldApi[];
  supportByTrigger: Record<string, CombatEffectSupportApi>;
}

export interface CombatEffectCatalogApi {
  effectKeys: CombatEffectMetadataApi[];
  targets: string[];
  targetDescriptions: Record<string, string>;
  targetSubjects: Record<string, string>;
  triggers: { key: string; descricao: string; previewPrefix: string; support: CombatEffectSupportApi }[];
  reapplyPolicies: string[];
  reapplyPolicyDescriptions: Record<string, string>;
  conditions: { key: string; campos: string[]; descricao: string; fields: CombatEffectFieldApi[] }[];
  contexts: { key: string; rotulo: string; field: keyof PayloadCombatEffectAdmin }[];
  statusKeys: { value: string; label: string }[];
  scaleAttributes: NonNullable<PayloadCombatEffectAdmin["scale_attribute"]>[];
  stackGroups: string[];
  engineNotes: Record<string, string>;
}

export async function catalogoCombatEffectsAdmin(): Promise<CombatEffectCatalogApi> {
  const resposta = await axiosInstance.get<{ data: { catalogo: CombatEffectCatalogApi } }>("/admin/combat-effects/catalog");
  return resposta.data.data.catalogo;
}
