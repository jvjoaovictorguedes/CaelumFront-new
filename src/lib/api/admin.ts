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
