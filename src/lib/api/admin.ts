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
