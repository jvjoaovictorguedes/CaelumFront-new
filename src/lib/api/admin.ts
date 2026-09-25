// Painel Administrativo — chamadas de API. Toda rota aqui já é
// protegida no backend por authMiddleware + adminMiddleware +
// requireAdminPermission("chave") (checagem real no banco a cada
// request); nada aqui concede acesso por si só, só fala com rotas que
// já são protegidas.
import axiosInstance from "@/utils/axiosIntance";

export function mensagemDeErroAdmin(erro: unknown, padrao: string): string {
  return (erro as { response?: { data?: { message?: string } } })?.response?.data?.message ?? padrao;
}

export interface WeaponPropertiesApi {
  dano_min: number;
  dano_max: number;
  tipo_dano: "Fisico" | "Magico";
  tipo_arma: "Espada" | "Machado" | "Cajado" | "Adaga" | "Lança" | "Orbe";
  bonus_atributo: "Forca" | "Vitalidade" | "Inteligencia" | "Agilidade" | "Velocidade";
  valor_bonus_atributo: number;
}

export interface ArmorPropertiesApi {
  slot_equipamento: "Cabeca" | "Torso" | "Maos" | "Pes" | "Acessorio1" | "Acessorio2";
  defesa: number;
  bonus_forca: number;
  bonus_vitalidade: number;
  bonus_inteligencia: number;
  bonus_agilidade: number;
  bonus_velocidade: number;
}

export interface ConsumablePropertiesApi {
  efeito_vida: number;
  efeito_mana: number;
  efeito_atributo?: string | null;
  valor_atributo: number;
  duracao_efeito?: number | null;
}

export interface AdminItemApi {
  id: number;
  nome: string;
  descricao: string;
  tipo_item: string;
  raridade: string;
  valor_compra: number;
  valor_venda: number;
  peso: number;
  imagem_url: string | null;
  disponivel_loja: boolean;
  negociavel_mercado: boolean;
  ativo: boolean;
  tier_equipamento: number | null;
  weaponProperties?: WeaponPropertiesApi | null;
  armorProperties?: ArmorPropertiesApi | null;
  consumableProperties?: ConsumablePropertiesApi | null;
}

interface PaginaApi<T> {
  total: number;
  pagina: number;
  porPagina: number;
  itens: T[];
}

export interface FiltrosItensAdmin {
  pagina?: number;
  porPagina?: number;
  tipo_item?: string;
  raridade?: string;
  nome?: string;
  apenasAtivos?: boolean;
}

export async function listarItensAdmin(filtros: FiltrosItensAdmin = {}): Promise<PaginaApi<AdminItemApi>> {
  const resposta = await axiosInstance.get<{ data: PaginaApi<AdminItemApi> }>("/admin/items", {
    params: filtros,
  });
  return resposta.data.data;
}

export interface PayloadItemAdmin {
  item: {
    nome: string;
    descricao: string;
    tipo_item: string;
    raridade: string;
    valor_compra?: number;
    valor_venda?: number;
    peso?: number;
    imagem_url?: string | null;
    disponivel_loja?: boolean;
    negociavel_mercado?: boolean;
    tier_equipamento?: number | null;
  };
  weapon?: Partial<WeaponPropertiesApi>;
  armor?: Partial<ArmorPropertiesApi>;
  consumable?: Partial<ConsumablePropertiesApi>;
}

export async function criarItemAdmin(payload: PayloadItemAdmin): Promise<AdminItemApi> {
  const resposta = await axiosInstance.post<{ data: { item: AdminItemApi } }>("/admin/items", payload);
  return resposta.data.data.item;
}

export async function atualizarItemAdmin(id: number, payload: PayloadItemAdmin): Promise<AdminItemApi> {
  const resposta = await axiosInstance.patch<{ data: { item: AdminItemApi } }>(
    `/admin/items/${id}`,
    payload as unknown as Record<string, unknown>,
  );
  return resposta.data.data.item;
}

export async function desativarItemAdmin(id: number, motivo: string): Promise<AdminItemApi> {
  const resposta = await axiosInstance.post<{ data: { item: AdminItemApi } }>(`/admin/items/${id}/deactivate`, {
    motivo,
  });
  return resposta.data.data.item;
}

export async function reativarItemAdmin(id: number): Promise<AdminItemApi> {
  const resposta = await axiosInstance.post<{ data: { item: AdminItemApi } }>(`/admin/items/${id}/reactivate`);
  return resposta.data.data.item;
}

export async function duplicarItemAdmin(id: number): Promise<AdminItemApi> {
  const resposta = await axiosInstance.post<{ data: { item: AdminItemApi } }>(`/admin/items/${id}/duplicate`);
  return resposta.data.data.item;
}

export interface LogAuditoriaApi {
  id: number;
  id_admin: number;
  acao: string;
  entidade: string;
  id_entidade: number | null;
  dados_antes: unknown;
  dados_depois: unknown;
  motivo: string | null;
  createdAt: string;
}

export async function listarAuditoriaAdmin(
  filtros: { pagina?: number; porPagina?: number; idAdmin?: number; entidade?: string; acao?: string } = {},
): Promise<PaginaApi<LogAuditoriaApi>> {
  const resposta = await axiosInstance.get<{ data: PaginaApi<LogAuditoriaApi> }>("/admin/audit", { params: filtros });
  return resposta.data.data;
}

export interface AdminRoleApi {
  id: number;
  nome: string;
  descricao: string | null;
  permissoes: { id: number; chave: string; descricao: string | null }[];
}

export interface AdminUserApi {
  id: number;
  username: string;
  email: string;
  adminRoles: { id: number; nome: string }[];
}

export async function listarRolesAdmin(): Promise<AdminRoleApi[]> {
  const resposta = await axiosInstance.get<{ data: { roles: AdminRoleApi[] } }>("/admin/admins/roles");
  return resposta.data.data.roles;
}

export async function listarAdminsAdmin(): Promise<AdminUserApi[]> {
  const resposta = await axiosInstance.get<{ data: { admins: AdminUserApi[] } }>("/admin/admins");
  return resposta.data.data.admins;
}

export async function concederRoleAdmin(idUser: number, idRole: number): Promise<void> {
  await axiosInstance.post("/admin/admins/grant", { idUser, idRole });
}

export async function revogarRoleAdmin(idUser: number, idRole: number): Promise<void> {
  await axiosInstance.post("/admin/admins/revoke", { idUser, idRole });
}

// Painel Administrativo Fase 13 (§24) — Patch Notes sem migration.
export interface PatchNoteApi {
  id: number;
  ordem: number;
  feature: string;
  versao: string;
  titulo: string;
  descricao: string;
  resumo: string | null;
  imagem_url: string | null;
  destaque: boolean;
  status: "Rascunho" | "Publicado" | "Agendado";
  publicado_em: string;
  created_by_admin_id: number | null;
}

export interface PayloadPatchNoteAdmin {
  feature: string;
  versao: string;
  titulo: string;
  descricao: string;
  resumo?: string | null;
  imagem_url?: string | null;
  destaque?: boolean;
  status?: "Rascunho" | "Publicado" | "Agendado";
  publicado_em?: string;
}

export async function listarPatchNotesAdmin(
  filtros: { pagina?: number; porPagina?: number; status?: string; feature?: string; nome?: string } = {},
): Promise<PaginaApi<PatchNoteApi>> {
  const resposta = await axiosInstance.get<{ data: PaginaApi<PatchNoteApi> }>("/admin/patch-notes", {
    params: filtros,
  });
  return resposta.data.data;
}

export async function criarPatchNoteAdmin(payload: PayloadPatchNoteAdmin): Promise<PatchNoteApi> {
  const resposta = await axiosInstance.post<{ data: { nota: PatchNoteApi } }>("/admin/patch-notes", payload);
  return resposta.data.data.nota;
}

export async function atualizarPatchNoteAdmin(id: number, payload: Partial<PayloadPatchNoteAdmin>): Promise<PatchNoteApi> {
  const resposta = await axiosInstance.patch<{ data: { nota: PatchNoteApi } }>(`/admin/patch-notes/${id}`, payload);
  return resposta.data.data.nota;
}

export async function duplicarPatchNoteAdmin(id: number): Promise<PatchNoteApi> {
  const resposta = await axiosInstance.post<{ data: { nota: PatchNoteApi } }>(`/admin/patch-notes/${id}/duplicate`);
  return resposta.data.data.nota;
}

// Painel Administrativo Fase 14 (§25) — Configurações do jogo (GameSetting).
export interface GameSettingApi {
  chave: string;
  valor: unknown;
  descricao: string | null;
  tipo: "number" | "boolean" | "string" | "json";
  editavel_admin: boolean;
  updated_by_admin_id: number | null;
}

export async function listarGameSettingsAdmin(): Promise<GameSettingApi[]> {
  const resposta = await axiosInstance.get<{ data: { settings: GameSettingApi[] } }>("/admin/settings");
  return resposta.data.data.settings;
}

export async function salvarGameSettingAdmin(
  chave: string,
  payload: { valor: unknown; tipo: GameSettingApi["tipo"]; descricao?: string | null },
): Promise<GameSettingApi> {
  const resposta = await axiosInstance.put<{ data: { setting: GameSettingApi } }>(`/admin/settings/${chave}`, payload);
  return resposta.data.data.setting;
}

// Painel Administrativo Fase 8 (§19) — Aventura: Zonas/Monstros/Aparições/Drops.
export interface AdventureZoneApi {
  id: number;
  nome: string;
  descricao: string | null;
  nivel_monstro_min: number;
  nivel_monstro_max: number;
  imagem_url: string | null;
  ordem: number;
  ativa: boolean;
}

export interface AdventureMonsterApi {
  id: number;
  nome: string;
  descricao: string | null;
  imagem_url: string | null;
  multiplicador_vida: number;
  multiplicador_dano: number;
  multiplicador_agilidade: number;
  multiplicador_velocidade: number;
  ativo: boolean;
}

export interface AdventureZoneMonsterApi {
  id: number;
  id_area: number;
  id_monstro: number;
  peso_aparicao: number;
  tipo_aparicao: "Comum" | "Raro";
  nivel_min_override: number | null;
  nivel_max_override: number | null;
  ativo: boolean;
  AdventureZone?: { id: number; nome: string };
  monstro?: { id: number; nome: string; imagem_url: string | null };
}

export interface AdventureMonsterLootApi {
  id: number;
  id_monstro: number;
  id_item: number;
  chance_ppm: number;
  quantidade_min: number;
  quantidade_max: number;
  categoria: "Principal" | "Secundario" | "Especial";
  ativo: boolean;
  AdventureMonster?: { id: number; nome: string };
  item?: { id: number; nome: string; raridade: string; imagem_url: string | null };
}

export async function listarZonasAdmin(): Promise<AdventureZoneApi[]> {
  const resposta = await axiosInstance.get<{ data: { zonas: AdventureZoneApi[] } }>("/admin/adventure/zones");
  return resposta.data.data.zonas;
}
export async function criarZonaAdmin(payload: Partial<AdventureZoneApi>): Promise<AdventureZoneApi> {
  const resposta = await axiosInstance.post<{ data: { zona: AdventureZoneApi } }>("/admin/adventure/zones", payload);
  return resposta.data.data.zona;
}
export async function atualizarZonaAdmin(id: number, payload: Partial<AdventureZoneApi>): Promise<AdventureZoneApi> {
  const resposta = await axiosInstance.patch<{ data: { zona: AdventureZoneApi } }>(`/admin/adventure/zones/${id}`, payload);
  return resposta.data.data.zona;
}

export async function listarMonstrosAdmin(): Promise<AdventureMonsterApi[]> {
  const resposta = await axiosInstance.get<{ data: { monstros: AdventureMonsterApi[] } }>("/admin/adventure/monsters");
  return resposta.data.data.monstros;
}
export async function criarMonstroAdmin(payload: Partial<AdventureMonsterApi>): Promise<AdventureMonsterApi> {
  const resposta = await axiosInstance.post<{ data: { monstro: AdventureMonsterApi } }>("/admin/adventure/monsters", payload);
  return resposta.data.data.monstro;
}
export async function atualizarMonstroAdmin(id: number, payload: Partial<AdventureMonsterApi>): Promise<AdventureMonsterApi> {
  const resposta = await axiosInstance.patch<{ data: { monstro: AdventureMonsterApi } }>(`/admin/adventure/monsters/${id}`, payload);
  return resposta.data.data.monstro;
}
export async function duplicarMonstroAdmin(id: number): Promise<AdventureMonsterApi> {
  const resposta = await axiosInstance.post<{ data: { monstro: AdventureMonsterApi } }>(`/admin/adventure/monsters/${id}/duplicate`);
  return resposta.data.data.monstro;
}

export async function listarAparicoesAdmin(idArea?: number): Promise<AdventureZoneMonsterApi[]> {
  const resposta = await axiosInstance.get<{ data: { aparicoes: AdventureZoneMonsterApi[] } }>("/admin/adventure/zone-monsters", {
    params: idArea ? { idArea } : undefined,
  });
  return resposta.data.data.aparicoes;
}
export async function criarAparicaoAdmin(payload: Partial<AdventureZoneMonsterApi>): Promise<AdventureZoneMonsterApi> {
  const resposta = await axiosInstance.post<{ data: { aparicao: AdventureZoneMonsterApi } }>("/admin/adventure/zone-monsters", payload);
  return resposta.data.data.aparicao;
}
export async function atualizarAparicaoAdmin(id: number, payload: Partial<AdventureZoneMonsterApi>): Promise<AdventureZoneMonsterApi> {
  const resposta = await axiosInstance.patch<{ data: { aparicao: AdventureZoneMonsterApi } }>(`/admin/adventure/zone-monsters/${id}`, payload);
  return resposta.data.data.aparicao;
}

export async function listarLootAdmin(idMonstro?: number): Promise<AdventureMonsterLootApi[]> {
  const resposta = await axiosInstance.get<{ data: { loot: AdventureMonsterLootApi[] } }>("/admin/adventure/loot", {
    params: idMonstro ? { idMonstro } : undefined,
  });
  return resposta.data.data.loot;
}
export async function criarLootAdmin(payload: Partial<AdventureMonsterLootApi>): Promise<AdventureMonsterLootApi> {
  const resposta = await axiosInstance.post<{ data: { loot: AdventureMonsterLootApi } }>("/admin/adventure/loot", payload);
  return resposta.data.data.loot;
}
export async function atualizarLootAdmin(id: number, payload: Partial<AdventureMonsterLootApi>): Promise<AdventureMonsterLootApi> {
  const resposta = await axiosInstance.patch<{ data: { loot: AdventureMonsterLootApi } }>(`/admin/adventure/loot/${id}`, payload);
  return resposta.data.data.loot;
}

// Painel Administrativo Fase 4 — Conjuntos de Equipamentos.
export interface EquipmentSetPieceApi {
  id: number;
  equipment_set_id: number;
  item_id: number;
  piece_key: string;
  ordem: number | null;
  item?: { id: number; nome: string; imagem_url: string | null; tipo_item: string };
}

export interface EquipmentSetBonusApi {
  id: number;
  equipment_set_id: number;
  pieces_required: number;
  stats: Record<string, number>;
  effect_key: string | null;
  effect_config: Record<string, unknown>;
  descricao: string | null;
}

export interface EquipmentSetApi {
  id: number;
  key: string;
  nome: string;
  descricao: string | null;
  imagem_url: string | null;
  ativo: boolean;
  pecas?: EquipmentSetPieceApi[];
  bonuses?: EquipmentSetBonusApi[];
}

export async function listarEquipmentSetsAdmin(): Promise<EquipmentSetApi[]> {
  const resposta = await axiosInstance.get<{ data: { sets: EquipmentSetApi[] } }>("/admin/equipment-sets");
  return resposta.data.data.sets;
}
export async function criarEquipmentSetAdmin(payload: Partial<EquipmentSetApi>): Promise<EquipmentSetApi> {
  const resposta = await axiosInstance.post<{ data: { set: EquipmentSetApi } }>("/admin/equipment-sets", payload);
  return resposta.data.data.set;
}
export async function atualizarEquipmentSetAdmin(id: number, payload: Partial<EquipmentSetApi>): Promise<EquipmentSetApi> {
  const resposta = await axiosInstance.patch<{ data: { set: EquipmentSetApi } }>(`/admin/equipment-sets/${id}`, payload);
  return resposta.data.data.set;
}
export async function duplicarEquipmentSetAdmin(id: number): Promise<EquipmentSetApi> {
  const resposta = await axiosInstance.post<{ data: { set: EquipmentSetApi } }>(`/admin/equipment-sets/${id}/duplicate`);
  return resposta.data.data.set;
}
export async function adicionarPecaEquipmentSetAdmin(idSet: number, payload: { item_id: number; piece_key: string; ordem?: number }): Promise<EquipmentSetPieceApi> {
  const resposta = await axiosInstance.post<{ data: { peca: EquipmentSetPieceApi } }>(`/admin/equipment-sets/${idSet}/pieces`, payload);
  return resposta.data.data.peca;
}
export async function removerPecaEquipmentSetAdmin(idPeca: number): Promise<void> {
  await axiosInstance.delete(`/admin/equipment-sets/pieces/${idPeca}`);
}
export async function adicionarBonusEquipmentSetAdmin(
  idSet: number,
  payload: { pieces_required: number; stats?: Record<string, number>; effect_key?: string | null; effect_config?: Record<string, unknown>; descricao?: string | null },
): Promise<EquipmentSetBonusApi> {
  const resposta = await axiosInstance.post<{ data: { bonus: EquipmentSetBonusApi } }>(`/admin/equipment-sets/${idSet}/bonuses`, payload);
  return resposta.data.data.bonus;
}
export async function removerBonusEquipmentSetAdmin(idBonus: number): Promise<void> {
  await axiosInstance.delete(`/admin/equipment-sets/bonuses/${idBonus}`);
}
export async function previewEquipmentSetAdmin(idSet: number, pecas: number): Promise<{ bonuses: { pieces_required: number; ativo: boolean; stats: Record<string, number>; effect_key: string | null; descricao: string | null }[] }> {
  const resposta = await axiosInstance.post<{ data: { bonuses: { pieces_required: number; ativo: boolean; stats: Record<string, number>; effect_key: string | null; descricao: string | null }[] } }>(
    `/admin/equipment-sets/${idSet}/preview?pecas=${pecas}`,
  );
  return resposta.data.data;
}
export async function listarEfeitosEquipmentSetAdmin(): Promise<string[]> {
  const resposta = await axiosInstance.get<{ data: { efeitos: string[] } }>("/admin/equipment-sets/effects");
  return resposta.data.data.efeitos;
}

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
  target: "Self" | "Enemy";
  ativo: boolean;
}

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
}

export async function listarPowersAdmin(
  filtros: { nome?: string; tipo_poder?: string; escala_atributo?: string } = {},
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

export async function listarVinculosPowerAdmin(idPower: number): Promise<{ classes: ClassAbilityApi[]; racas: RaceAbilityApi[] }> {
  const resposta = await axiosInstance.get<{ data: { classes: ClassAbilityApi[]; racas: RaceAbilityApi[] } }>(`/admin/powers/${idPower}/links`);
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

export interface PayloadStatusEffectAdmin {
  status_key: string;
  chance_ppm?: number;
  duration_turns: number;
  potency_base?: number;
  potency_scale_attribute?: "Forca" | "Vitalidade" | "Agilidade" | "Inteligencia" | "Velocidade" | null;
  potency_scale_value?: number;
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

export interface PreviewEvolucaoPowerApi {
  power_id: number;
  nome: string;
  niveis: {
    nivel: number;
    marco: string | null;
    dano: number | null;
    cura: number | null;
    custo_mana: number;
    custo_para_proximo_nivel: { ouro: number; fragmentos: number } | null;
  }[];
}
export async function previewEvolucaoPowerAdmin(id: number): Promise<PreviewEvolucaoPowerApi> {
  const resposta = await axiosInstance.get<{ data: PreviewEvolucaoPowerApi }>(`/admin/powers/${id}/preview-evolution`);
  return resposta.data.data;
}

export interface PreviewStatusPowerApi {
  power_id: number;
  nome: string;
  dano_base: number | null;
  valor_atributo_exemplo: number;
  efeitos: {
    status_key: string;
    nome_ui: string;
    chance_percentual: number;
    duration_turns: number;
    potencia_estimada: number;
    target: string;
  }[];
}
export async function previewStatusPowerAdmin(id: number, atributo: number): Promise<PreviewStatusPowerApi> {
  const resposta = await axiosInstance.get<{ data: PreviewStatusPowerApi }>(`/admin/powers/${id}/preview-status`, { params: { atributo } });
  return resposta.data.data;
}

// WeaponStatusEffect — montado sob /admin/items/:idItem/weapon-status-effects.
export interface WeaponStatusEffectApi {
  id: number;
  id_item: number;
  status_key: string;
  chance_ppm: number;
  duration_turns: number;
  potency_base: number;
  potency_scale_attribute: "Forca" | "Vitalidade" | "Agilidade" | "Inteligencia" | "Velocidade" | null;
  potency_scale_value: number;
  trigger: string;
  ativo: boolean;
}
export interface PayloadWeaponStatusEffectAdmin {
  status_key: string;
  chance_ppm?: number;
  duration_turns?: number;
  potency_base?: number;
  potency_scale_attribute?: "Forca" | "Vitalidade" | "Agilidade" | "Inteligencia" | "Velocidade" | null;
  potency_scale_value?: number;
  trigger?: string;
  ativo?: boolean;
}

export async function listarWeaponStatusEffectsAdmin(idItem: number): Promise<WeaponStatusEffectApi[]> {
  const resposta = await axiosInstance.get<{ data: { efeitos: WeaponStatusEffectApi[] } }>(`/admin/items/${idItem}/weapon-status-effects`);
  return resposta.data.data.efeitos;
}
export async function adicionarWeaponStatusEffectAdmin(idItem: number, payload: PayloadWeaponStatusEffectAdmin): Promise<WeaponStatusEffectApi> {
  const resposta = await axiosInstance.post<{ data: { efeito: WeaponStatusEffectApi } }>(`/admin/items/${idItem}/weapon-status-effects`, payload);
  return resposta.data.data.efeito;
}
export async function atualizarWeaponStatusEffectAdmin(idItem: number, idEfeito: number, payload: Partial<PayloadWeaponStatusEffectAdmin>): Promise<WeaponStatusEffectApi> {
  const resposta = await axiosInstance.patch<{ data: { efeito: WeaponStatusEffectApi } }>(`/admin/items/${idItem}/weapon-status-effects/${idEfeito}`, payload);
  return resposta.data.data.efeito;
}
export async function removerWeaponStatusEffectAdmin(idItem: number, idEfeito: number): Promise<void> {
  await axiosInstance.delete(`/admin/items/${idItem}/weapon-status-effects/${idEfeito}`);
}

// Classes/Raças — leitura pública, reaproveitada aqui só pra popular os
// selects de vínculo (nenhuma escrita nova).
export interface ClassPublicaApi {
  id: number;
  nome: string;
}
export interface RacePublicaApi {
  id: number;
  nome_masculino: string;
  nome_feminino: string;
}
export async function listarClassesPublicas(): Promise<ClassPublicaApi[]> {
  const resposta = await axiosInstance.get<{ data: { classes: ClassPublicaApi[] } }>("/classes");
  return resposta.data.data.classes;
}
export async function listarRacasPublicas(): Promise<RacePublicaApi[]> {
  const resposta = await axiosInstance.get<{ data: { races: RacePublicaApi[] } }>("/races");
  return resposta.data.data.races;
}

// Painel Administrativo Fase 3 — Biblioteca de Mídia. O upload em si
// (multipart) NÃO passa por aqui — vai por uma Server Action própria
// (ver uploadMediaAction.ts), porque o proxy genérico /api/backend
// corrompe bytes binários lendo o corpo como texto. Tudo aqui é JSON.
export interface MediaAssetApi {
  id: number;
  grupo: string;
  versao: number;
  categoria: "Item" | "Power" | "Monster" | "EquipmentSet" | "Outro";
  nome_arquivo_original: string | null;
  mime: string;
  tamanho_bytes: number;
  largura_px: number | null;
  altura_px: number | null;
  descricao: string | null;
  ativo: boolean;
  id_admin_criador: number | null;
  createdAt: string;
  updatedAt: string;
}

export async function listarMediaGruposAdmin(
  filtros: { categoria?: string; nome?: string; pagina?: number; porPagina?: number } = {},
): Promise<{ total: number; pagina: number; porPagina: number; itens: MediaAssetApi[] }> {
  const resposta = await axiosInstance.get<{ data: { total: number; pagina: number; porPagina: number; itens: MediaAssetApi[] } }>(
    "/admin/media",
    { params: filtros },
  );
  return resposta.data.data;
}

export async function listarMediaVersoesAdmin(grupo: string): Promise<MediaAssetApi[]> {
  const resposta = await axiosInstance.get<{ data: { versoes: MediaAssetApi[] } }>(`/admin/media/${grupo}/versions`);
  return resposta.data.data.versoes;
}

export async function reverterMediaVersaoAdmin(grupo: string, versao: number): Promise<MediaAssetApi> {
  const resposta = await axiosInstance.post<{ data: { asset: MediaAssetApi } }>(`/admin/media/${grupo}/revert/${versao}`);
  return resposta.data.data.asset;
}

export async function desativarMediaGrupoAdmin(grupo: string): Promise<void> {
  await axiosInstance.delete(`/admin/media/${grupo}`);
}

// Painel Administrativo Fase 9 — Missões (livres, Guilda dos
// Aventureiros, Guilda). Um hub só (permissão missions.manage), três
// catálogos independentes — nenhuma tabela de progresso de jogador é
// tocada por essas rotas.
export interface MissionCatalogosApi {
  tiposMissaoLivre: string[];
  categoriasMissaoLivre: string[];
  tiposObjetivoGuildaAventureiros: string[];
  ranksAventureiros: string[];
  tiposObjetivoMissaoGuilda: string[];
  categoriasMissaoGuilda: string[];
  ranksGuilda: string[];
}
export async function catalogosMissoesAdmin(): Promise<MissionCatalogosApi> {
  const resposta = await axiosInstance.get<{ data: MissionCatalogosApi }>("/admin/missions/catalogs");
  return resposta.data.data;
}

export interface MissionApi {
  id: number;
  nome: string;
  descricao: string;
  tipo: string;
  meta: number;
  categoria: string;
  nivel_minimo: number;
  recompensa_dinheiro: number;
  recompensa_xp: number;
  recompensa_item_id: number | null;
  recompensa_item_quantidade: number;
  ativa: boolean;
  itemRecompensa?: { id: number; nome: string; imagem_url: string | null } | null;
}
export type PayloadMissionAdmin = Partial<Omit<MissionApi, "id" | "itemRecompensa">>;

export async function listarMissoesLivresAdmin(filtros: { tipo?: string; categoria?: string; ativa?: string } = {}): Promise<MissionApi[]> {
  const resposta = await axiosInstance.get<{ data: { missoes: MissionApi[] } }>("/admin/missions/free", { params: filtros });
  return resposta.data.data.missoes;
}
export async function criarMissaoLivreAdmin(payload: PayloadMissionAdmin): Promise<MissionApi> {
  const resposta = await axiosInstance.post<{ data: { missao: MissionApi } }>("/admin/missions/free", payload);
  return resposta.data.data.missao;
}
export async function atualizarMissaoLivreAdmin(id: number, payload: PayloadMissionAdmin): Promise<MissionApi> {
  const resposta = await axiosInstance.patch<{ data: { missao: MissionApi } }>(`/admin/missions/free/${id}`, payload);
  return resposta.data.data.missao;
}
export async function duplicarMissaoLivreAdmin(id: number): Promise<MissionApi> {
  const resposta = await axiosInstance.post<{ data: { missao: MissionApi } }>(`/admin/missions/free/${id}/duplicate`);
  return resposta.data.data.missao;
}

export interface AdventureGuildMissionRewardApi {
  id: number;
  id_mission: number;
  tipo: "Ouro" | "XP" | "Item";
  id_item: number | null;
  quantidade: number;
  item?: { id: number; nome: string; imagem_url: string | null } | null;
}
export interface AdventureGuildMissionApi {
  id: number;
  rank: string;
  nome: string;
  descricao: string;
  tipo_objetivo: string;
  id_monstro_alvo: number | null;
  id_area_alvo: number | null;
  id_item_alvo: number | null;
  quantidade_objetivo: number;
  qualidade_minima: string | null;
  eh_provacao: boolean;
  ativa: boolean;
  recompensas?: AdventureGuildMissionRewardApi[];
}
export type PayloadAdventureGuildMissionAdmin = Partial<Omit<AdventureGuildMissionApi, "id" | "recompensas">>;

export async function listarMissoesGuildaAventureirosAdmin(
  filtros: { rank?: string; ativa?: string; eh_provacao?: string } = {},
): Promise<AdventureGuildMissionApi[]> {
  const resposta = await axiosInstance.get<{ data: { missoes: AdventureGuildMissionApi[] } }>("/admin/missions/adventurers-guild", { params: filtros });
  return resposta.data.data.missoes;
}
export async function criarMissaoGuildaAventureirosAdmin(payload: PayloadAdventureGuildMissionAdmin): Promise<AdventureGuildMissionApi> {
  const resposta = await axiosInstance.post<{ data: { missao: AdventureGuildMissionApi } }>("/admin/missions/adventurers-guild", payload);
  return resposta.data.data.missao;
}
export async function atualizarMissaoGuildaAventureirosAdmin(id: number, payload: PayloadAdventureGuildMissionAdmin): Promise<AdventureGuildMissionApi> {
  const resposta = await axiosInstance.patch<{ data: { missao: AdventureGuildMissionApi } }>(`/admin/missions/adventurers-guild/${id}`, payload);
  return resposta.data.data.missao;
}
export async function duplicarMissaoGuildaAventureirosAdmin(id: number): Promise<AdventureGuildMissionApi> {
  const resposta = await axiosInstance.post<{ data: { missao: AdventureGuildMissionApi } }>(`/admin/missions/adventurers-guild/${id}/duplicate`);
  return resposta.data.data.missao;
}
export async function adicionarRecompensaGuildaAventureirosAdmin(
  idMission: number,
  payload: { tipo: "Ouro" | "XP" | "Item"; id_item?: number | null; quantidade: number },
): Promise<AdventureGuildMissionRewardApi> {
  const resposta = await axiosInstance.post<{ data: { recompensa: AdventureGuildMissionRewardApi } }>(`/admin/missions/adventurers-guild/${idMission}/rewards`, payload);
  return resposta.data.data.recompensa;
}
export async function removerRecompensaGuildaAventureirosAdmin(idRecompensa: number): Promise<void> {
  await axiosInstance.delete(`/admin/missions/adventurers-guild/rewards/${idRecompensa}`);
}

export interface GuildMissionApi {
  id: number;
  categoria: string;
  rank: string | null;
  nome: string;
  descricao: string;
  tipo_objetivo: string;
  meta: number;
  xp_guilda: number;
  pontos_contribuicao: number;
  ativa: boolean;
}
export type PayloadGuildMissionAdmin = Partial<Omit<GuildMissionApi, "id">>;

export async function listarMissoesGuildaAdmin(filtros: { categoria?: string; rank?: string; ativa?: string } = {}): Promise<GuildMissionApi[]> {
  const resposta = await axiosInstance.get<{ data: { missoes: GuildMissionApi[] } }>("/admin/missions/guild", { params: filtros });
  return resposta.data.data.missoes;
}
export async function criarMissaoGuildaAdmin(payload: PayloadGuildMissionAdmin): Promise<GuildMissionApi> {
  const resposta = await axiosInstance.post<{ data: { missao: GuildMissionApi } }>("/admin/missions/guild", payload);
  return resposta.data.data.missao;
}
export async function atualizarMissaoGuildaAdmin(id: number, payload: PayloadGuildMissionAdmin): Promise<GuildMissionApi> {
  const resposta = await axiosInstance.patch<{ data: { missao: GuildMissionApi } }>(`/admin/missions/guild/${id}`, payload);
  return resposta.data.data.missao;
}
export async function duplicarMissaoGuildaAdmin(id: number): Promise<GuildMissionApi> {
  const resposta = await axiosInstance.post<{ data: { missao: GuildMissionApi } }>(`/admin/missions/guild/${id}/duplicate`);
  return resposta.data.data.missao;
}

// Painel Administrativo Fases 10/11 — Balcão de Espólios e Caçadas não
// têm tabela de catálogo (conteúdo gerado em cima de Item/
// AdventureMonster/AdventureZone já existentes). O que é administrável
// é a config de dificuldade/reputação, guardada em GameSetting sob
// rotas próprias (spoils.manage/hunts.manage).
export interface SpoilReputationLevelApi {
  nivel: number;
  roman: string;
  nome: string;
  minimo: number;
  multiplicador: number;
  bonusFaixa: [number, number];
}
export interface SpoilConfigApi {
  reputationLevels: SpoilReputationLevelApi[];
  orderQuantityRanges: Record<string, [number, number]>;
  orderReputationReward: number;
  setBonusReputationReward: number;
}
export async function obterSpoilConfigAdmin(): Promise<SpoilConfigApi> {
  const resposta = await axiosInstance.get<{ data: { config: SpoilConfigApi } }>("/admin/spoils/config");
  return resposta.data.data.config;
}
export async function salvarSpoilConfigAdmin(payload: Partial<SpoilConfigApi>): Promise<SpoilConfigApi> {
  const resposta = await axiosInstance.put<{ data: { config: SpoilConfigApi } }>("/admin/spoils/config", payload);
  return resposta.data.data.config;
}

export interface HuntDifficultyApi {
  nome: string;
  ordem: number;
  hpMultiplier: number;
  damageMultiplier: number;
  quantityRange: [number, number];
  rewardMultiplier: number;
  reputationReward: number;
}
export interface HuntReputationLevelApi {
  nivel: number;
  roman: string;
  titulo: string;
  minimo: number;
  pool: string[];
}
export interface HuntConfigApi {
  difficulties: Record<string, HuntDifficultyApi>;
  reputationLevels: HuntReputationLevelApi[];
  difficultyWeightsByReputation: Record<string, Record<string, number>>;
}
export async function obterHuntConfigAdmin(): Promise<HuntConfigApi> {
  const resposta = await axiosInstance.get<{ data: { config: HuntConfigApi } }>("/admin/hunts/config");
  return resposta.data.data.config;
}
export async function salvarHuntConfigAdmin(payload: Partial<HuntConfigApi>): Promise<HuntConfigApi> {
  const resposta = await axiosInstance.put<{ data: { config: HuntConfigApi } }>("/admin/hunts/config", payload);
  return resposta.data.data.config;
}
