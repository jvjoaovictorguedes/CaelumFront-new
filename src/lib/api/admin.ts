// Painel Administrativo — chamadas de API. Toda rota aqui já é
// protegida no backend por authMiddleware + adminMiddleware +
// requireAdminPermission("chave") (checagem real no banco a cada
// request); nada aqui concede acesso por si só, só fala com rotas que
// já são protegidas.
import axiosInstance from "@/utils/axiosIntance";

export function mensagemDeErroAdmin(erro: unknown, padrao: string): string {
  const dados = (erro as { response?: { data?: { message?: string; detalhe?: string } } })?.response?.data;
  if (!dados?.message) return padrao;
  return dados.detalhe ? `${dados.message} (${dados.detalhe})` : dados.message;
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

export interface FishingRodPropertiesApi {
  forca_linha: number;
  controle: number;
  recolhimento: number;
  precisao: number;
  estabilidade: number;
  nivel_pesca_minimo: number;
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
  fishingRodProperties?: FishingRodPropertiesApi | null;
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
  disponivelLoja?: boolean;
}

export async function listarItensAdmin(filtros: FiltrosItensAdmin = {}): Promise<PaginaApi<AdminItemApi>> {
  const resposta = await axiosInstance.get<{ data: PaginaApi<AdminItemApi> }>("/admin/items", {
    params: filtros,
  });
  return resposta.data.data;
}

// Item leve pra picker (ItemSelect) — nunca a linha completa da tabela
// paginada de Itens (sem propriedades de arma/armadura/consumível).
export interface AdminItemSelecionavelApi {
  id: number;
  nome: string;
  tipo_item: string;
  raridade: string;
  imagem_url: string | null;
  ativo: boolean;
}

// Endpoint dedicado (GET /admin/items/select) — devolve o catálogo
// INTEIRO (ver comentário do backend em adminItemService.
// listAllItemsForSelection), nunca capado em 100 como a tabela paginada
// de listarItensAdmin. Todo ItemSelect do painel deve usar esta função,
// nunca listarItensAdmin com um porPagina "grande" (bug real reportado:
// isso escondia os itens mais antigos do catálogo em qualquer picker).
export async function listarItensParaSelecaoAdmin(filtros: { apenasAtivos?: boolean; tipo_item?: string } = {}): Promise<AdminItemSelecionavelApi[]> {
  const resposta = await axiosInstance.get<{ data: { itens: AdminItemSelecionavelApi[] } }>("/admin/items/select", {
    params: filtros,
  });
  return resposta.data.data.itens;
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
  fishingRod?: Partial<FishingRodPropertiesApi>;
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

// Painel Administrativo — Excluir Contas de Usuário (destrutivo,
// permissão "users.delete" só SuperAdmin). Contas admin nunca aparecem
// como excluíveis: o backend as protege incondicionalmente mesmo que o
// id venha selecionado.
export interface UsuarioAdminApi {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  adminRoles: string[];
  dataCriacao: string;
  ultimoLogin: string | null;
  personagens: { id: number; nome: string; nivel: number }[];
}

export interface PaginaUsuariosAdminApi {
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
  usuarios: UsuarioAdminApi[];
}

export async function listarUsuariosAdmin(params: { busca?: string; pagina?: number; porPagina?: number }): Promise<PaginaUsuariosAdminApi> {
  const resposta = await axiosInstance.get<{ data: PaginaUsuariosAdminApi }>("/admin/users", { params });
  return resposta.data.data;
}

export async function listarIdsElegiveisUsuariosAdmin(busca?: string): Promise<number[]> {
  const resposta = await axiosInstance.get<{ data: { ids: number[] } }>("/admin/users/eligible-ids", {
    params: busca ? { busca } : undefined,
  });
  return resposta.data.data.ids;
}

export interface ResultadoExclusaoUsuarioApi {
  id: number;
  username?: string;
  excluido: boolean;
  motivo?: string;
}

export interface ResultadoExclusaoEmLoteApi {
  total: number;
  excluidos: number;
  resultados: ResultadoExclusaoUsuarioApi[];
}

export async function excluirUsuariosEmLoteAdmin(ids: number[]): Promise<ResultadoExclusaoEmLoteApi> {
  const resposta = await axiosInstance.post<{ data: ResultadoExclusaoEmLoteApi }>("/admin/users/bulk-delete", { ids });
  return resposta.data.data;
}

// Painel Administrativo — "Referral" (referrals.view, somente leitura).
// Cada linha é uma conta indicada; indicadoPor.totalIndicacoes é a
// contagem GLOBAL do indicador (repete o mesmo número em toda linha
// daquele indicador de propósito — é assim que a tela mostra "esse
// indicador trouxe N pessoas" sem precisar de uma tela separada).
export interface IndicadoAdminApi {
  id: number;
  username: string;
  email: string;
  dataCriacao: string;
  indicadoPor: {
    id: number;
    username: string;
    totalIndicacoes: number;
  };
}

export interface PaginaIndicadosAdminApi {
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
  indicados: IndicadoAdminApi[];
}

export interface ResumoReferralAdminApi {
  totalIndicados: number;
  totalIndicadores: number;
}

export async function listarReferralsAdmin(params: { busca?: string; pagina?: number; porPagina?: number } = {}): Promise<PaginaIndicadosAdminApi> {
  const resposta = await axiosInstance.get<{ data: PaginaIndicadosAdminApi }>("/admin/referrals", { params });
  return resposta.data.data;
}

export async function obterResumoReferralAdmin(): Promise<ResumoReferralAdminApi> {
  const resposta = await axiosInstance.get<{ data: ResumoReferralAdminApi }>("/admin/referrals/resumo");
  return resposta.data.data;
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

// Jornal da Guilda dos Aventureiros — feed de conquistas notáveis de
// jogadores/guildas, curado pelo Admin (nunca gerado automaticamente
// por gatilho de jogo). Mesmo workflow Rascunho/Publicado/Agendado dos
// Patch Notes, domínio separado.
export type CategoriaGuildJournal = "ConquistaIndividual" | "ConquistaDeGuilda" | "Evento" | "Outro";

export interface GuildJournalEntryApi {
  id: number;
  ordem: number;
  categoria: CategoriaGuildJournal;
  titulo: string;
  descricao: string;
  resumo: string | null;
  imagem_url: string | null;
  personagem_nome: string | null;
  guilda_nome: string | null;
  destaque: boolean;
  status: "Rascunho" | "Publicado" | "Agendado";
  publicado_em: string;
  created_by_admin_id: number | null;
}

export interface PayloadGuildJournalAdmin {
  categoria?: CategoriaGuildJournal;
  titulo: string;
  descricao: string;
  resumo?: string | null;
  imagem_url?: string | null;
  personagem_nome?: string | null;
  guilda_nome?: string | null;
  destaque?: boolean;
  status?: "Rascunho" | "Publicado" | "Agendado";
  publicado_em?: string;
}

export async function listarGuildJournalAdmin(
  filtros: { pagina?: number; porPagina?: number; status?: string; categoria?: string; nome?: string } = {},
): Promise<PaginaApi<GuildJournalEntryApi>> {
  const resposta = await axiosInstance.get<{ data: PaginaApi<GuildJournalEntryApi> }>("/admin/guild-journal", {
    params: filtros,
  });
  return resposta.data.data;
}

export async function criarGuildJournalAdmin(payload: PayloadGuildJournalAdmin): Promise<GuildJournalEntryApi> {
  const resposta = await axiosInstance.post<{ data: { nota: GuildJournalEntryApi } }>("/admin/guild-journal", payload);
  return resposta.data.data.nota;
}

export async function atualizarGuildJournalAdmin(
  id: number,
  payload: Partial<PayloadGuildJournalAdmin>,
): Promise<GuildJournalEntryApi> {
  const resposta = await axiosInstance.patch<{ data: { nota: GuildJournalEntryApi } }>(`/admin/guild-journal/${id}`, payload);
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

// Reformulação V2 dos Monstros — nível/vida/dano/agilidade/velocidade/
// recompensa são stats FIXOS e autorais (nunca mais multiplicador_* em
// cima de uma fórmula por nível).
export interface AdventureMonsterApi {
  id: number;
  nome: string;
  descricao: string | null;
  imagem_url: string | null;
  sprite_key: string | null;
  nivel: number | null;
  vida_maxima: number | null;
  dano_min: number | null;
  dano_max: number | null;
  agilidade: number | null;
  velocidade: number | null;
  xp_recompensa: number | null;
  ouro_recompensa: number | null;
  ativo: boolean;
}

export interface AdventureZoneMonsterApi {
  id: number;
  id_area: number;
  id_monstro: number;
  peso_aparicao: number;
  tipo_aparicao: "Comum" | "Raro";
  // Reformulação V2 (§4.3) — só decide ELEGIBILIDADE de aparição (jogador
  // abaixo disso não vê esse vínculo no pool); nunca mais uma faixa de
  // nível pro monstro em si (o nível dele é o fixo de AdventureMonster).
  nivel_jogador_minimo: number;
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
  // Sistema de Proezas Únicas §9 — marca técnica de aquisição restrita
  // (sempre presente na resposta do backend, mesmo pra Powers normais).
  acquisition_scope?: "NORMAL" | "UNIQUE_FEAT";
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
export type MediaAssetTipoApi = "imagem" | "audio";

export interface MediaAssetApi {
  id: number;
  grupo: string;
  versao: number;
  categoria: "Item" | "Power" | "Monster" | "EquipmentSet" | "Musica" | "Outro" | "Avatar";
  tipo: MediaAssetTipoApi;
  nome_arquivo_original: string | null;
  mime: string;
  tamanho_bytes: number;
  largura_px: number | null;
  altura_px: number | null;
  descricao: string | null;
  ativo: boolean;
  id_admin_criador: number | null;
  // Só relevante pra categoria "Avatar" — null = liberado pra qualquer
  // personagem; preenchido = só quem É daquela raça/classe pode
  // escolher esse avatar no AvatarPickerModal.
  restrito_raca_id: number | null;
  restrito_classe_id: number | null;
  createdAt: string;
  updatedAt: string;
}

export async function listarMediaGruposAdmin(
  filtros: { categoria?: string; tipo?: MediaAssetTipoApi; nome?: string; pagina?: number; porPagina?: number } = {},
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

// Painel Administrativo Fase 12 — Premiações (ouro/XP/itens a
// jogadores). A busca aqui é mínima (a tela "Busca" plena, própria da
// categoria Jogadores, não foi construída nesta rodada) — só o
// suficiente pra achar quem vai receber a premiação.
export interface GrantSearchResultApi {
  id: number;
  nome: string;
  nivel: number;
  dinheiro: number;
  username: string | null;
}
export async function buscarPersonagensAdmin(termo: string): Promise<GrantSearchResultApi[]> {
  const resposta = await axiosInstance.get<{ data: { personagens: GrantSearchResultApi[] } }>("/admin/grants/search", { params: { termo } });
  return resposta.data.data.personagens;
}

export interface PayloadGrantAdmin {
  ouro?: number;
  xp?: number;
  itens?: { id_item: number; quantidade: number; refinamento?: number }[];
  motivo: string;
}
export interface GrantResultApi {
  personagem: { id: number; nome: string; nivel: number; dinheiro: number };
  concedido: {
    ouro: number;
    xp: number;
    niveisGanhos: number;
    itens: { id_item: number; nome: string; quantidade: number }[];
    equipamentos: { id_item: number; nome: string; quantidade: number }[];
  };
}
export async function concederPremiacaoAdmin(idPersonagem: number, payload: PayloadGrantAdmin): Promise<GrantResultApi> {
  const resposta = await axiosInstance.post<{ data: GrantResultApi }>(`/admin/grants/${idPersonagem}`, payload);
  return resposta.data.data;
}

// Painel Administrativo — Códigos de Resgate. Recompensa reaproveita o
// mesmo formato de PayloadGrantAdmin (ouro/xp/itens), sem "motivo".
export interface RecompensaCodigoApi {
  ouro?: number;
  xp?: number;
  itens?: { id_item: number; quantidade: number; raridade?: string; refinamento?: number }[];
}
export interface RedemptionCodeApi {
  id: number;
  codigo: string;
  recompensa: RecompensaCodigoApi;
  expira_em: string;
  ativo: boolean;
  id_admin_criador: number | null;
  createdAt: string;
  updatedAt: string;
  total_resgates: number;
}
export interface PayloadCriarRedemptionCode {
  codigo: string;
  recompensa: RecompensaCodigoApi;
  expira_em: string;
}
export interface PayloadAtualizarRedemptionCode {
  ativo?: boolean;
  expira_em?: string;
  recompensa?: RecompensaCodigoApi;
}
export async function listarRedemptionCodesAdmin(): Promise<RedemptionCodeApi[]> {
  const resposta = await axiosInstance.get<{ data: { codigos: RedemptionCodeApi[] } }>("/admin/redemption-codes");
  return resposta.data.data.codigos;
}
export async function criarRedemptionCodeAdmin(payload: PayloadCriarRedemptionCode): Promise<RedemptionCodeApi> {
  const resposta = await axiosInstance.post<{ data: { codigo: RedemptionCodeApi } }>("/admin/redemption-codes", payload);
  return resposta.data.data.codigo;
}
export async function atualizarRedemptionCodeAdmin(
  id: number,
  payload: PayloadAtualizarRedemptionCode,
): Promise<RedemptionCodeApi> {
  const resposta = await axiosInstance.patch<{ data: { codigo: RedemptionCodeApi } }>(
    `/admin/redemption-codes/${id}`,
    payload,
  );
  return resposta.data.data.codigo;
}

// Proezas Únicas — ver bloco completo (catálogo/Legados/Triggers/
// Histórico-Reparos) mais abaixo, na Fase 6 do Painel Administrativo.
// Uma versão simplificada e conflitante (mesmos nomes de tipo, rotas
// diferentes) chegou de outro agente e foi descartada por decisão do
// usuário — nunca reintroduzir listarProezasUnicasAdmin/
// criarProezaUnicaAdmin/atualizarProezaUnicaAdmin/concederProezaUnicaAdmin
// aqui, o painel completo cobre o mesmo caso de uso.

// Painel Administrativo Fase 15 — Buff Global (evento temporal server-wide).
export type TipoGlobalBuff = "Xp" | "Ouro" | "DropAventura" | "XpExpedicao";

export interface GlobalBuffApi {
  id: number;
  nome: string;
  tipo: TipoGlobalBuff;
  multiplicador_percentual: number;
  inicio: string;
  fim: string;
  ativo: boolean;
  descricao: string | null;
  id_admin_criador: number | null;
}

export interface PayloadGlobalBuffAdmin {
  nome: string;
  tipo: TipoGlobalBuff;
  multiplicador_percentual: number;
  inicio: string;
  fim: string;
  ativo?: boolean;
  descricao?: string | null;
}

export async function listarGlobalBuffsAdmin(
  filtros: { pagina?: number; porPagina?: number; tipo?: string; ativo?: boolean; nome?: string } = {},
): Promise<PaginaApi<GlobalBuffApi>> {
  const resposta = await axiosInstance.get<{ data: PaginaApi<GlobalBuffApi> }>("/admin/global-buffs", {
    params: filtros,
  });
  return resposta.data.data;
}

export async function criarGlobalBuffAdmin(payload: PayloadGlobalBuffAdmin): Promise<GlobalBuffApi> {
  const resposta = await axiosInstance.post<{ data: { buff: GlobalBuffApi } }>("/admin/global-buffs", payload);
  return resposta.data.data.buff;
}

export async function atualizarGlobalBuffAdmin(id: number, payload: Partial<PayloadGlobalBuffAdmin>): Promise<GlobalBuffApi> {
  const resposta = await axiosInstance.patch<{ data: { buff: GlobalBuffApi } }>(`/admin/global-buffs/${id}`, payload);
  return resposta.data.data.buff;
}

export async function desativarGlobalBuffAdmin(id: number): Promise<GlobalBuffApi> {
  const resposta = await axiosInstance.post<{ data: { buff: GlobalBuffApi } }>(`/admin/global-buffs/${id}/deactivate`);
  return resposta.data.data.buff;
}

// Sistema de Taverna — Painel Administrativo (Cardápio/Jogos/Config/Métricas).
export type TavernBuffKey =
  | "MAX_HP_PCT"
  | "MAX_MANA_PCT"
  | "PVE_DAMAGE_PCT"
  | "PVE_DEFENSE_PCT"
  | "ADVENTURE_XP_PCT"
  | "EXPEDITION_XP_PCT"
  | "FORGE_XP_PCT"
  | "ALCHEMY_XP_PCT"
  | "FISHING_CONTROL_PCT";

export interface TavernMenuItemApi {
  id: number;
  nome: string;
  descricao: string;
  categoria: "Refeicao" | "Bebida";
  preco_gold: number;
  buff_key: TavernBuffKey;
  magnitude: number;
  duracao_segundos: number;
  imagem_url: string | null;
  ordem: number;
  ativo: boolean;
}

export interface PayloadTavernMenuItemAdmin {
  nome: string;
  descricao: string;
  categoria: "Refeicao" | "Bebida";
  preco_gold: number;
  buff_key: TavernBuffKey;
  magnitude: number;
  duracao_segundos: number;
  imagem_url?: string | null;
  ordem?: number;
  ativo?: boolean;
}

export async function listarTavernMenuAdmin(
  filtros: { pagina?: number; porPagina?: number; categoria?: string; ativo?: boolean; nome?: string } = {},
): Promise<PaginaApi<TavernMenuItemApi>> {
  const resposta = await axiosInstance.get<{ data: PaginaApi<TavernMenuItemApi> }>("/admin/tavern/menu", { params: filtros });
  return resposta.data.data;
}
export async function criarTavernMenuItemAdmin(payload: PayloadTavernMenuItemAdmin): Promise<TavernMenuItemApi> {
  const resposta = await axiosInstance.post<{ data: { item: TavernMenuItemApi } }>("/admin/tavern/menu", payload);
  return resposta.data.data.item;
}
export async function atualizarTavernMenuItemAdmin(id: number, payload: Partial<PayloadTavernMenuItemAdmin>): Promise<TavernMenuItemApi> {
  const resposta = await axiosInstance.patch<{ data: { item: TavernMenuItemApi } }>(`/admin/tavern/menu/${id}`, payload);
  return resposta.data.data.item;
}
export async function duplicarTavernMenuItemAdmin(id: number): Promise<TavernMenuItemApi> {
  const resposta = await axiosInstance.post<{ data: { item: TavernMenuItemApi } }>(`/admin/tavern/menu/${id}/duplicate`);
  return resposta.data.data.item;
}
export async function desativarTavernMenuItemAdmin(id: number): Promise<TavernMenuItemApi> {
  const resposta = await axiosInstance.post<{ data: { item: TavernMenuItemApi } }>(`/admin/tavern/menu/${id}/deactivate`);
  return resposta.data.data.item;
}
export async function reativarTavernMenuItemAdmin(id: number): Promise<TavernMenuItemApi> {
  const resposta = await axiosInstance.post<{ data: { item: TavernMenuItemApi } }>(`/admin/tavern/menu/${id}/reactivate`);
  return resposta.data.data.item;
}

export interface TavernGameApi {
  id: number;
  key: string;
  nome: string;
  descricao: string;
  presentation_key: "COIN" | "RUNES" | "DICE_PARITY" | "CARD_SIDE";
  win_chance_ppm: number;
  payout_multiplier: number;
  min_bet: number;
  max_bet: number;
  ordem: number;
  ativo: boolean;
  houseEdgeAlerta?: string | null;
}

export interface PayloadTavernGameAdmin {
  key: string;
  nome: string;
  descricao: string;
  presentation_key: "COIN" | "RUNES" | "DICE_PARITY" | "CARD_SIDE";
  payout_multiplier: number;
  min_bet: number;
  max_bet: number;
  ordem?: number;
  ativo?: boolean;
}

export async function listarTavernGamesAdmin(
  filtros: { pagina?: number; porPagina?: number; ativo?: boolean } = {},
): Promise<PaginaApi<TavernGameApi>> {
  const resposta = await axiosInstance.get<{ data: PaginaApi<TavernGameApi> }>("/admin/tavern/games", { params: filtros });
  return resposta.data.data;
}
export async function criarTavernGameAdmin(payload: PayloadTavernGameAdmin): Promise<TavernGameApi> {
  const resposta = await axiosInstance.post<{ data: { jogo: TavernGameApi } }>("/admin/tavern/games", payload);
  return resposta.data.data.jogo;
}
export async function atualizarTavernGameAdmin(id: number, payload: Partial<PayloadTavernGameAdmin>): Promise<TavernGameApi> {
  const resposta = await axiosInstance.patch<{ data: { jogo: TavernGameApi } }>(`/admin/tavern/games/${id}`, payload);
  return resposta.data.data.jogo;
}
export async function duplicarTavernGameAdmin(id: number): Promise<TavernGameApi> {
  const resposta = await axiosInstance.post<{ data: { jogo: TavernGameApi } }>(`/admin/tavern/games/${id}/duplicate`);
  return resposta.data.data.jogo;
}
export async function desativarTavernGameAdmin(id: number): Promise<TavernGameApi> {
  const resposta = await axiosInstance.post<{ data: { jogo: TavernGameApi } }>(`/admin/tavern/games/${id}/deactivate`);
  return resposta.data.data.jogo;
}
export async function reativarTavernGameAdmin(id: number): Promise<TavernGameApi> {
  const resposta = await axiosInstance.post<{ data: { jogo: TavernGameApi } }>(`/admin/tavern/games/${id}/reactivate`);
  return resposta.data.data.jogo;
}

export interface TavernSettingsApi {
  "tavern.rest.base_gold": number;
  "tavern.rest.level_factor": number;
  "tavern.rest.missing_resource_factor": number;
  "tavern.rest.minimum_gold": number;
  "tavern.games.max_bet_global": number;
  "tavern.games.daily_wager_limit": number;
  "tavern.enabled": boolean;
}

export async function obterTavernSettingsAdmin(): Promise<TavernSettingsApi> {
  const resposta = await axiosInstance.get<{ data: { configuracoes: TavernSettingsApi } }>("/admin/tavern/settings");
  return resposta.data.data.configuracoes;
}
export async function atualizarTavernSettingsAdmin(payload: Partial<TavernSettingsApi>): Promise<TavernSettingsApi> {
  const resposta = await axiosInstance.patch<{ data: { configuracoes: TavernSettingsApi } }>("/admin/tavern/settings", payload);
  return resposta.data.data.configuracoes;
}

export interface TavernMetricsApi {
  apostas24h: {
    apostas: number;
    gold_apostado: string;
    gold_pago: string;
    gold_liquido_removido: string;
    aposta_media: number;
    maior_aposta: number;
    taxa_vitoria: number;
  };
  apostas7d: {
    apostas: number;
    gold_apostado: string;
    gold_pago: string;
    gold_liquido_removido: string;
  };
  comprasPorOferta: { nome: string; total: number }[];
}

export async function obterTavernMetricasAdmin(): Promise<TavernMetricsApi> {
  const resposta = await axiosInstance.get<{ data: TavernMetricsApi }>("/admin/tavern/metrics");
  return resposta.data.data;
}

// Boss Global / Ameaça Mundial — Painel Administrativo (catálogo,
// worldboss.manage) + operação do ciclo atual (events.manage).
export interface WorldBossPhaseApi {
  id?: number;
  ordem: number;
  nome_fase: string;
  hp_percentual_max: number;
  modificador_dano_percentual?: number;
  texto_alerta?: string | null;
}

export interface WorldBossConfigApi {
  id: number;
  nome: string;
  descricao: string;
  lore: string | null;
  imagem_url: string | null;
  ativo: boolean;
  peso_selecao: number;
  vida_base: string;
  defesa: number;
  mensagem_descoberta: string;
  mensagem_convocacao: string;
  mensagem_fase_final: string | null;
  mensagem_derrota: string | null;
  id_item_golpe_final: number;
  gold_descoberta: number;
  gold_participacao: number;
  xp_participacao: number;
  min_dano_participacao: number | null;
  fases: WorldBossPhaseApi[];
  zonas: number[];
}

// A listagem (GET /configs) nunca carrega fases/zonas completas — só
// a contagem, pra evitar N+1 no backend. GET /configs/:id (usado ao
// abrir "Editar") é que devolve o WorldBossConfigApi completo.
export interface WorldBossConfigListItemApi extends Omit<WorldBossConfigApi, "fases" | "zonas"> {
  fases_count: number;
  zonas_count: number;
}

export interface PayloadWorldBossConfigAdmin {
  nome: string;
  descricao: string;
  lore?: string | null;
  imagem_url?: string | null;
  peso_selecao?: number;
  vida_base: number;
  defesa?: number;
  mensagem_descoberta: string;
  mensagem_convocacao: string;
  mensagem_fase_final?: string | null;
  mensagem_derrota?: string | null;
  id_item_golpe_final: number;
  gold_descoberta?: number;
  gold_participacao?: number;
  xp_participacao?: number;
  min_dano_participacao?: number | null;
  fases?: WorldBossPhaseApi[];
  zonas?: number[];
  ativo?: boolean;
}

export async function listarWorldBossConfigsAdmin(
  filtros: { pagina?: number; porPagina?: number; ativo?: boolean; nome?: string } = {},
): Promise<PaginaApi<WorldBossConfigListItemApi>> {
  const resposta = await axiosInstance.get<{ data: PaginaApi<WorldBossConfigListItemApi> }>("/admin/world-boss/configs", { params: filtros });
  return resposta.data.data;
}
export async function obterWorldBossConfigAdmin(id: number): Promise<WorldBossConfigApi> {
  const resposta = await axiosInstance.get<{ data: { config: WorldBossConfigApi } }>(`/admin/world-boss/configs/${id}`);
  return resposta.data.data.config;
}
export async function criarWorldBossConfigAdmin(payload: PayloadWorldBossConfigAdmin): Promise<WorldBossConfigApi> {
  const resposta = await axiosInstance.post<{ data: { config: WorldBossConfigApi } }>("/admin/world-boss/configs", payload);
  return resposta.data.data.config;
}
export async function atualizarWorldBossConfigAdmin(id: number, payload: Partial<PayloadWorldBossConfigAdmin>): Promise<WorldBossConfigApi> {
  const resposta = await axiosInstance.patch<{ data: { config: WorldBossConfigApi } }>(`/admin/world-boss/configs/${id}`, payload);
  return resposta.data.data.config;
}
export async function duplicarWorldBossConfigAdmin(id: number): Promise<WorldBossConfigApi> {
  const resposta = await axiosInstance.post<{ data: { config: WorldBossConfigApi } }>(`/admin/world-boss/configs/${id}/duplicate`);
  return resposta.data.data.config;
}
export async function desativarWorldBossConfigAdmin(id: number): Promise<WorldBossConfigApi> {
  const resposta = await axiosInstance.post<{ data: { config: WorldBossConfigApi } }>(`/admin/world-boss/configs/${id}/deactivate`);
  return resposta.data.data.config;
}
export async function reativarWorldBossConfigAdmin(id: number): Promise<WorldBossConfigApi> {
  const resposta = await axiosInstance.post<{ data: { config: WorldBossConfigApi } }>(`/admin/world-boss/configs/${id}/reactivate`);
  return resposta.data.data.config;
}

export interface WorldBossSettingsApi {
  "worldboss.enabled": boolean;
  "worldboss.cooldown_hours": number;
  "worldboss.discovery_threshold_min": number;
  "worldboss.discovery_threshold_max": number;
  "worldboss.discovery_auto_awaken_seconds": number;
  "worldboss.hp_broadcast_interval_ms": number;
  "worldboss.leaderboard_limit": number;
  "worldboss.participation_rewards_enabled": boolean;
}

export async function obterWorldBossSettingsAdmin(): Promise<WorldBossSettingsApi> {
  const resposta = await axiosInstance.get<{ data: { settings: WorldBossSettingsApi } }>("/admin/world-boss/settings");
  return resposta.data.data.settings;
}
export async function atualizarWorldBossSettingsAdmin(payload: Partial<WorldBossSettingsApi>): Promise<WorldBossSettingsApi> {
  const resposta = await axiosInstance.patch<{ data: { settings: WorldBossSettingsApi } }>("/admin/world-boss/settings", payload);
  return resposta.data.data.settings;
}

export interface WorldBossMetricsApi {
  encontrosElegiveisPorHora: { window_start: string; encontros_elegiveis: number }[];
  historico: {
    id: number;
    status: string;
    nome: string | null;
    discovered_at: string | null;
    activated_at: string | null;
    defeated_at: string | null;
    discoverer_character_id: number | null;
    final_blow_character_id: number | null;
    participation_rewards_status: string;
  }[];
}

export async function obterWorldBossMetricasAdmin(): Promise<WorldBossMetricsApi> {
  const resposta = await axiosInstance.get<{ data: WorldBossMetricsApi }>("/admin/world-boss/metrics");
  return resposta.data.data;
}

export interface WorldBossStatusOperacionalApi {
  status: string;
  id?: number;
  id_world_boss_config?: number;
  nome?: string | null;
  hp_max?: number;
  hp_current?: number;
  discovery_threshold?: number | null;
  discovery_progress?: number;
  discoverer_character_id?: number | null;
  discovery_zone_id?: number | null;
  discovered_at?: string | null;
  auto_awaken_at?: string | null;
  activated_at?: string | null;
  final_blow_character_id?: number | null;
  defeated_at?: string | null;
  next_eligible_at?: string | null;
  participation_rewards_status?: string;
}

export async function obterWorldBossStatusOperacionalAdmin(): Promise<WorldBossStatusOperacionalApi> {
  const resposta = await axiosInstance.get<{ data: WorldBossStatusOperacionalApi }>("/admin/world-boss/current/status");
  return resposta.data.data;
}
export async function forcarDescobertaWorldBossAdmin(payload: { motivo: string; characterId?: number }): Promise<void> {
  await axiosInstance.post("/admin/world-boss/current/force-discovery", payload);
}
export async function despertarWorldBossAdmin(payload: { motivo: string }): Promise<void> {
  await axiosInstance.post("/admin/world-boss/current/awaken", payload);
}
export async function cancelarCicloWorldBossAdmin(payload: { motivo: string }): Promise<void> {
  await axiosInstance.post("/admin/world-boss/current/cancel", payload);
}

// Painel Administrativo — Pesca & Navegação: Zonas, Espécies, Pool
// (zona x espécie), Portos, Iscas e Afinidades. Vara de Pesca já é
// gerenciada dentro do admin de Itens (tipo "Ferramenta").
interface ItemResumoApi {
  id: number;
  nome: string;
  raridade?: string;
  imagem_url: string | null;
}

export interface FishingZoneAdminApi {
  id: number;
  key: string;
  nome: string;
  descricao: string | null;
  imagem_url: string | null;
  id_world_node: number | null;
  nivel_pesca_minimo: number;
  tier_embarcacao_minimo: number;
  dificuldade_ambiente: number;
  ativo: boolean;
  WorldMapNode?: { id: number; nome: string } | null;
}

export interface PayloadFishingZoneAdmin {
  key?: string;
  nome: string;
  descricao?: string | null;
  imagem_url?: string | null;
  id_world_node?: number | null;
  nivel_pesca_minimo?: number;
  tier_embarcacao_minimo?: number;
  dificuldade_ambiente?: number;
  ativo?: boolean;
}

export async function listarFishingZonesAdmin(): Promise<FishingZoneAdminApi[]> {
  const resposta = await axiosInstance.get<{ data: { zonas: FishingZoneAdminApi[] } }>("/admin/fishing/zones");
  return resposta.data.data.zonas;
}
export async function criarFishingZoneAdmin(payload: PayloadFishingZoneAdmin): Promise<FishingZoneAdminApi> {
  const resposta = await axiosInstance.post<{ data: { zona: FishingZoneAdminApi } }>("/admin/fishing/zones", payload);
  return resposta.data.data.zona;
}
export async function atualizarFishingZoneAdmin(id: number, payload: Partial<PayloadFishingZoneAdmin>): Promise<FishingZoneAdminApi> {
  const resposta = await axiosInstance.patch<{ data: { zona: FishingZoneAdminApi } }>(`/admin/fishing/zones/${id}`, payload);
  return resposta.data.data.zona;
}

export type ComportamentoEspecie = "CALM" | "BURST" | "ERRATIC" | "ENDURANCE" | "DEEP_DIVE";
export type PerfilPeso = "LIGHT" | "NORMAL" | "HEAVY";

export interface FishingSpeciesAdminApi {
  id: number;
  key: string;
  id_item: number;
  nome_cientifico: string | null;
  descricao: string | null;
  comportamento_key: ComportamentoEspecie;
  dificuldade_base: number;
  peso_min_g: number;
  peso_max_g: number;
  perfil_peso: PerfilPeso;
  pontos_base_torneio: number;
  lendario: boolean;
  ativo: boolean;
  item?: ItemResumoApi;
}

export interface PayloadFishingSpeciesAdmin {
  key?: string;
  id_item?: number;
  nome_cientifico?: string | null;
  descricao?: string | null;
  comportamento_key: ComportamentoEspecie;
  dificuldade_base: number;
  peso_min_g: number;
  peso_max_g: number;
  perfil_peso?: PerfilPeso;
  pontos_base_torneio?: number;
  lendario?: boolean;
  ativo?: boolean;
}

export async function listarFishingSpeciesAdmin(): Promise<FishingSpeciesAdminApi[]> {
  const resposta = await axiosInstance.get<{ data: { especies: FishingSpeciesAdminApi[] } }>("/admin/fishing/species");
  return resposta.data.data.especies;
}
export async function criarFishingSpeciesAdmin(payload: PayloadFishingSpeciesAdmin): Promise<FishingSpeciesAdminApi> {
  const resposta = await axiosInstance.post<{ data: { especie: FishingSpeciesAdminApi } }>("/admin/fishing/species", payload);
  return resposta.data.data.especie;
}
export async function atualizarFishingSpeciesAdmin(id: number, payload: Partial<PayloadFishingSpeciesAdmin>): Promise<FishingSpeciesAdminApi> {
  const resposta = await axiosInstance.patch<{ data: { especie: FishingSpeciesAdminApi } }>(`/admin/fishing/species/${id}`, payload);
  return resposta.data.data.especie;
}

export interface FishingPoolAdminApi {
  id: number;
  id_zone: number;
  id_species: number;
  encounter_weight: number;
  nivel_pesca_minimo: number | null;
  ativo: boolean;
  FishingZone?: { id: number; nome: string };
  species?: { id: number; key: string; id_item: number; item?: { id: number; nome: string } };
}

export interface PayloadFishingPoolAdmin {
  id_zone?: number;
  id_species?: number;
  encounter_weight?: number;
  nivel_pesca_minimo?: number | null;
  ativo?: boolean;
}

export async function listarFishingPoolAdmin(idZone?: number): Promise<FishingPoolAdminApi[]> {
  const resposta = await axiosInstance.get<{ data: { pool: FishingPoolAdminApi[] } }>("/admin/fishing/pool", {
    params: idZone ? { idZone } : undefined,
  });
  return resposta.data.data.pool;
}
export async function criarFishingPoolAdmin(payload: PayloadFishingPoolAdmin): Promise<FishingPoolAdminApi> {
  const resposta = await axiosInstance.post<{ data: { item: FishingPoolAdminApi } }>("/admin/fishing/pool", payload);
  return resposta.data.data.item;
}
export async function atualizarFishingPoolAdmin(id: number, payload: Partial<PayloadFishingPoolAdmin>): Promise<FishingPoolAdminApi> {
  const resposta = await axiosInstance.patch<{ data: { item: FishingPoolAdminApi } }>(`/admin/fishing/pool/${id}`, payload);
  return resposta.data.data.item;
}

export interface FishingPortAdminApi {
  id: number;
  key: string;
  nome: string;
  id_world_node: number | null;
  descricao: string | null;
  ativo: boolean;
  WorldMapNode?: { id: number; nome: string } | null;
}

export interface PayloadFishingPortAdmin {
  key?: string;
  nome: string;
  id_world_node?: number | null;
  descricao?: string | null;
  ativo?: boolean;
}

export async function listarFishingPortsAdmin(): Promise<FishingPortAdminApi[]> {
  const resposta = await axiosInstance.get<{ data: { portos: FishingPortAdminApi[] } }>("/admin/fishing/ports");
  return resposta.data.data.portos;
}
export async function criarFishingPortAdmin(payload: PayloadFishingPortAdmin): Promise<FishingPortAdminApi> {
  const resposta = await axiosInstance.post<{ data: { porto: FishingPortAdminApi } }>("/admin/fishing/ports", payload);
  return resposta.data.data.porto;
}
export async function atualizarFishingPortAdmin(id: number, payload: Partial<PayloadFishingPortAdmin>): Promise<FishingPortAdminApi> {
  const resposta = await axiosInstance.patch<{ data: { porto: FishingPortAdminApi } }>(`/admin/fishing/ports/${id}`, payload);
  return resposta.data.data.porto;
}

export interface FishingBaitAdminApi {
  id_item: number;
  key: string;
  nome_exibicao: string | null;
  nivel_pesca_minimo: number;
  ativo: boolean;
  item?: ItemResumoApi;
}

export interface PayloadFishingBaitAdmin {
  key?: string;
  id_item?: number;
  nome_exibicao?: string | null;
  nivel_pesca_minimo?: number;
  ativo?: boolean;
}

export async function listarFishingBaitsAdmin(): Promise<FishingBaitAdminApi[]> {
  const resposta = await axiosInstance.get<{ data: { iscas: FishingBaitAdminApi[] } }>("/admin/fishing/baits");
  return resposta.data.data.iscas;
}
export async function criarFishingBaitAdmin(payload: PayloadFishingBaitAdmin): Promise<FishingBaitAdminApi> {
  const resposta = await axiosInstance.post<{ data: { isca: FishingBaitAdminApi } }>("/admin/fishing/baits", payload);
  return resposta.data.data.isca;
}
export async function atualizarFishingBaitAdmin(idItem: number, payload: Partial<PayloadFishingBaitAdmin>): Promise<FishingBaitAdminApi> {
  const resposta = await axiosInstance.patch<{ data: { isca: FishingBaitAdminApi } }>(`/admin/fishing/baits/${idItem}`, payload);
  return resposta.data.data.isca;
}

export interface FishingAffinityAdminApi {
  id: number;
  id_bait_item: number;
  id_species: number;
  multiplicador_peso_ppm: number;
  FishingBait?: { id_item: number; key: string; item?: { id: number; nome: string } };
  species?: { id: number; key: string; item?: { id: number; nome: string } };
}

export interface PayloadFishingAffinityAdmin {
  id_bait_item?: number;
  id_species?: number;
  multiplicador_peso_ppm?: number;
}

export async function listarFishingAffinitiesAdmin(idBaitItem?: number): Promise<FishingAffinityAdminApi[]> {
  const resposta = await axiosInstance.get<{ data: { afinidades: FishingAffinityAdminApi[] } }>("/admin/fishing/affinities", {
    params: idBaitItem ? { idBaitItem } : undefined,
  });
  return resposta.data.data.afinidades;
}
export async function criarFishingAffinityAdmin(payload: PayloadFishingAffinityAdmin): Promise<FishingAffinityAdminApi> {
  const resposta = await axiosInstance.post<{ data: { afinidade: FishingAffinityAdminApi } }>("/admin/fishing/affinities", payload);
  return resposta.data.data.afinidade;
}
export async function atualizarFishingAffinityAdmin(id: number, payload: Partial<PayloadFishingAffinityAdmin>): Promise<FishingAffinityAdminApi> {
  const resposta = await axiosInstance.patch<{ data: { afinidade: FishingAffinityAdminApi } }>(`/admin/fishing/affinities/${id}`, payload);
  return resposta.data.data.afinidade;
}

// Painel Administrativo — "Busca" (players.view) e "Inventário"
// (players.manage). Busca é somente leitura; Inventário reaproveita o
// mesmo fluxo de correção do backend (motivo obrigatório, auditado).
export interface PlayerSearchResultApi {
  id: number;
  nome: string;
  nivel: number;
  dinheiro: number;
  classe: string | null;
  raca: string | null;
  username: string | null;
}

export interface PlayerDetailApi {
  id: number;
  nome: string;
  nivel: number;
  experiencia: number;
  dinheiro: number;
  vida_atual: number;
  mana_atual: number;
  classe: string | null;
  raca: string | null;
  guilda: { id: number; nome: string; sigla: string } | null;
  usuario: { id: number; username: string; email: string; criado_em: string } | null;
}

export async function buscarJogadoresAdmin(termo: string): Promise<PlayerSearchResultApi[]> {
  const resposta = await axiosInstance.get<{ data: { personagens: PlayerSearchResultApi[] } }>("/admin/players/search", {
    params: { termo },
  });
  return resposta.data.data.personagens;
}

export async function obterJogadorAdmin(id: number): Promise<PlayerDetailApi> {
  const resposta = await axiosInstance.get<{ data: { personagem: PlayerDetailApi } }>(`/admin/players/${id}`);
  return resposta.data.data.personagem;
}

export interface InventoryStackApi {
  id_personagem_inventario: number;
  id_item: number;
  quantidade: number;
  equipado: boolean;
  itemEspolio?: { id: number; nome: string; tipo_item: string; raridade: string; imagem_url: string | null };
}

export interface InventoryEquipmentApi {
  id: number;
  id_item: number;
  refinamento: number;
  equipada: boolean;
  estado: "Inventario" | "Equipada" | "Mercado";
  item?: { id: number; nome: string; tipo_item: string; raridade: string; imagem_url: string | null };
}

export interface CharacterInventoryAdminApi {
  personagem: { id: number; nome: string };
  stacks: InventoryStackApi[];
  equipamentos: InventoryEquipmentApi[];
}

export async function obterInventarioAdmin(idPersonagem: number): Promise<CharacterInventoryAdminApi> {
  const resposta = await axiosInstance.get<{ data: CharacterInventoryAdminApi }>(`/admin/inventory/${idPersonagem}`);
  return resposta.data.data;
}

export async function corrigirStackInventarioAdmin(
  idPersonagem: number,
  idItem: number,
  quantidade: number,
  motivo: string,
): Promise<{ id_item: number; quantidade_antes: number; quantidade_depois: number }> {
  const resposta = await axiosInstance.patch<{ data: { id_item: number; quantidade_antes: number; quantidade_depois: number } }>(
    `/admin/inventory/${idPersonagem}/stack/${idItem}`,
    { quantidade, motivo },
  );
  return resposta.data.data;
}

export async function removerEquipamentoInventarioAdmin(idInstancia: number, motivo: string): Promise<void> {
  await axiosInstance.delete(`/admin/inventory/equipment/${idInstancia}`, { data: { motivo } });
}

// Embarcações
export interface VesselAdminApi {
  id: number;
  key: string;
  nome: string;
  tier: number;
  nivel_pesca_minimo: number;
  preco: number;
  descricao: string | null;
  ativo: boolean;
}

export interface PayloadVesselAdmin {
  key?: string;
  nome: string;
  tier?: number;
  nivel_pesca_minimo?: number;
  preco?: number;
  descricao?: string | null;
  ativo?: boolean;
}

export async function listarVesselsAdmin(): Promise<VesselAdminApi[]> {
  const resposta = await axiosInstance.get<{ data: { vessels: VesselAdminApi[] } }>("/admin/fishing/vessels");
  return resposta.data.data.vessels;
}
export async function criarVesselAdmin(payload: PayloadVesselAdmin): Promise<VesselAdminApi> {
  const resposta = await axiosInstance.post<{ data: { vessel: VesselAdminApi } }>("/admin/fishing/vessels", payload);
  return resposta.data.data.vessel;
}
export async function atualizarVesselAdmin(id: number, payload: Partial<PayloadVesselAdmin>): Promise<VesselAdminApi> {
  const resposta = await axiosInstance.patch<{ data: { vessel: VesselAdminApi } }>(`/admin/fishing/vessels/${id}`, payload);
  return resposta.data.data.vessel;
}

// Rotas marítimas
export interface MarineRouteAdminApi {
  id: number;
  id_world_connection: number;
  id_port_origem: number;
  id_zone_destino: number;
  min_vessel_tier: number;
  distance: number;
  ativo: boolean;
  portoOrigem?: { id: number; nome: string };
  zonaDestino?: { id: number; nome: string };
}

export interface PayloadMarineRouteAdmin {
  id_world_connection?: number;
  id_port_origem?: number;
  id_zone_destino?: number;
  min_vessel_tier?: number;
  distance?: number;
  ativo?: boolean;
}

export async function listarMarineRoutesAdmin(): Promise<MarineRouteAdminApi[]> {
  const resposta = await axiosInstance.get<{ data: { rotas: MarineRouteAdminApi[] } }>("/admin/fishing/routes");
  return resposta.data.data.rotas;
}
export async function criarMarineRouteAdmin(payload: PayloadMarineRouteAdmin): Promise<MarineRouteAdminApi> {
  const resposta = await axiosInstance.post<{ data: { rota: MarineRouteAdminApi } }>("/admin/fishing/routes", payload);
  return resposta.data.data.rota;
}
export async function atualizarMarineRouteAdmin(id: number, payload: Partial<PayloadMarineRouteAdmin>): Promise<MarineRouteAdminApi> {
  const resposta = await axiosInstance.patch<{ data: { rota: MarineRouteAdminApi } }>(`/admin/fishing/routes/${id}`, payload);
  return resposta.data.data.rota;
}

// Torneios de Pesca
export interface FishingTournamentAdminApi {
  id: number;
  nome: string;
  id_zone: number | null;
  inicia_em: string;
  termina_em: string;
  ativo: boolean;
  zona?: { id: number; nome: string } | null;
}

export interface PayloadFishingTournamentAdmin {
  nome: string;
  id_zone?: number | null;
  inicia_em?: string;
  termina_em?: string;
  ativo?: boolean;
}

export async function listarFishingTournamentsAdmin(): Promise<FishingTournamentAdminApi[]> {
  const resposta = await axiosInstance.get<{ data: { torneios: FishingTournamentAdminApi[] } }>("/admin/fishing/tournaments");
  return resposta.data.data.torneios;
}
export async function criarFishingTournamentAdmin(payload: PayloadFishingTournamentAdmin): Promise<FishingTournamentAdminApi> {
  const resposta = await axiosInstance.post<{ data: { torneio: FishingTournamentAdminApi } }>("/admin/fishing/tournaments", payload);
  return resposta.data.data.torneio;
}
export async function atualizarFishingTournamentAdmin(id: number, payload: Partial<PayloadFishingTournamentAdmin>): Promise<FishingTournamentAdminApi> {
  const resposta = await axiosInstance.patch<{ data: { torneio: FishingTournamentAdminApi } }>(`/admin/fishing/tournaments/${id}`, payload);
  return resposta.data.data.torneio;
}

// Painel Administrativo — "Mercado P2P": moderar anúncios ativos e
// consultar histórico de vendas.
interface PessoaResumoApi {
  id: number;
  nome: string;
}

export interface MarketListingAdminApi {
  id: number;
  id_personagem_vendedor: number;
  id_personagem_comprador: number | null;
  id_item: number;
  id_instancia: number | null;
  quantidade_total: number;
  quantidade_restante: number;
  preco_unitario: number;
  status: "Ativo" | "Vendido" | "Cancelado";
  vendido_em: string | null;
  cancelado_em: string | null;
  createdAt: string;
  item?: { id: number; nome: string; raridade: string; imagem_url: string | null };
  vendedor?: PessoaResumoApi;
  comprador?: PessoaResumoApi | null;
}

export async function listarMarketListingsAdmin(
  filtros: { pagina?: number; porPagina?: number; status?: string; idItem?: number; vendedorId?: number } = {},
): Promise<PaginaApi<MarketListingAdminApi>> {
  const resposta = await axiosInstance.get<{ data: PaginaApi<MarketListingAdminApi> }>("/admin/market/listings", {
    params: filtros,
  });
  return resposta.data.data;
}

export async function cancelarMarketListingAdmin(id: number, motivo: string): Promise<MarketListingAdminApi> {
  const resposta = await axiosInstance.post<{ data: { listing: MarketListingAdminApi } }>(`/admin/market/listings/${id}/cancel`, { motivo });
  return resposta.data.data.listing;
}

export interface MarketTransactionAdminApi {
  id: number;
  id_listing: number;
  id_item: number;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
  taxa: number;
  valor_liquido_vendedor: number;
  createdAt: string;
  item?: { id: number; nome: string; raridade: string; imagem_url: string | null };
  vendedor?: PessoaResumoApi;
  comprador?: PessoaResumoApi;
}

export async function listarMarketTransactionsAdmin(
  filtros: { pagina?: number; porPagina?: number; idItem?: number; vendedorId?: number; compradorId?: number } = {},
): Promise<PaginaApi<MarketTransactionAdminApi>> {
  const resposta = await axiosInstance.get<{ data: PaginaApi<MarketTransactionAdminApi> }>("/admin/market/transactions", {
    params: filtros,
  });
  return resposta.data.data;
}

// ---------------------------------------------------------------------
// Forja — Painel Administrativo (Especificacao_Painel_Admin_Forja).
// forge.manage: blueprints/barras/pergaminhos. forge.balance: fundição/
// fabricação/refinamento/progressão + métricas. Toda rota já é
// protegida no backend; nada aqui concede acesso por si só.
// ---------------------------------------------------------------------

export const FORGE_CATEGORIAS = ["Arma", "Armadura", "Capacete", "Escudo", "Acessorio1", "Acessorio2", "Ferramenta"] as const;
export type ForgeCategoria = (typeof FORGE_CATEGORIAS)[number];
export const FORGE_QUALIDADES = ["Comum", "Incomum", "Raro", "Epico", "Lendario", "Mitico"] as const;
export type ForgeQualidade = (typeof FORGE_QUALIDADES)[number];

// ProdutoAlquimia (Forja-Materiais): id_recurso passa a ser polimórfico —
// AlchemyRecipe.id nesse tipo, ExpeditionResource.id nos outros dois.
// Por isso não existe mais um "recurso" resolvido via association aqui;
// o nome do recurso, quando precisar exibir, vem do backend já resolvido
// (ex: nome_recurso no preview) em vez de um include fixo.
export type ForgeTipoInsumo = "Barra" | "RecursoExpedicao" | "ProdutoAlquimia";
export interface ForgeIngredienteApi {
  tipo_insumo: ForgeTipoInsumo;
  id_recurso: number;
  quantidade_base: number;
}

// Reformulação V2 (Item Único por Equipamento, Raridade por Instância)
// — o blueprint aponta pra UM Item canônico, não mais uma linha por
// qualidade. Qualquer raridade que a Forja produzir desse blueprint
// vira a raridade da instância na coleta, nunca escolhe outro Item.
// Override admin de atributos por Raridade (ver equipmentRarityService no
// backend) — chave real é o Item (id_item_resultado do blueprint), não o
// blueprint em si; "atributos" é parcial: só as chaves presentes
// substituem o valor calculado pela curva global de multiplicadores.
export interface ForgeRaridadeOverrideApi {
  id_item: number;
  qualidade: ForgeQualidade;
  atributos: Record<string, number>;
}

export interface ForgeItemResultadoApi {
  id: number;
  nome: string;
  imagem_url: string | null;
  tier_equipamento?: number | null;
  raridadeOverrides?: ForgeRaridadeOverrideApi[];
}

export interface ForgeBlueprintApi {
  id: number;
  nome: string;
  categoria_equipamento: ForgeCategoria;
  tier_equipamento: number | null;
  multiplicador_tempo: number;
  nivel_forja_minimo: number;
  ativo: boolean;
  id_item_resultado: number | null;
  itemResultado: ForgeItemResultadoApi | null;
  ingredientes: ForgeIngredienteApi[];
}

export interface ForgeBlueprintLinhaApi {
  id: number;
  nome: string;
  categoria_equipamento: ForgeCategoria;
  tier_equipamento: number | null;
  nivel_forja_minimo: number;
  multiplicador_tempo: number;
  ativo: boolean;
  item_resultado: ForgeItemResultadoApi | null;
  resultados_completos: boolean;
  ingredientes_ok: boolean;
}

export interface ForgeAlertaValidacaoApi {
  nivel: "ERRO" | "AVISO" | "INFORMACAO";
  qualidade?: string;
  mensagem: string;
}

export interface ForgeRelatorioValidacaoApi {
  matrizIngredientes: Array<{
    tipo_insumo: string;
    id_recurso: number;
    quantidade_base: number;
    resolucao: Record<string, { id_item: number | null; nome?: string | null; imagem_url?: string | null; status: "OK" | "Ausente" }>;
  }>;
  resultadosValidacao: { completo: boolean; alertas: ForgeAlertaValidacaoApi[] };
  podeAtivar: boolean;
  motivos: string[];
}

export interface PayloadForgeBlueprintAdmin {
  nome?: string;
  categoria_equipamento?: ForgeCategoria;
  tier_equipamento?: number;
  multiplicador_tempo?: number;
  nivel_forja_minimo?: number;
  ingredientes?: { tipo_insumo: ForgeTipoInsumo; id_recurso: number; quantidade_base: number }[];
  id_item_resultado?: number | null;
}

export async function listarForgeBlueprintsAdmin(
  filtros: { pagina?: number; porPagina?: number; nome?: string; categoria?: string; tier?: number; nivelMinimo?: number; ativo?: boolean; incompletos?: boolean; ingredienteNaoResolvivel?: boolean } = {},
): Promise<PaginaApi<ForgeBlueprintLinhaApi>> {
  const resposta = await axiosInstance.get<{ data: PaginaApi<ForgeBlueprintLinhaApi> }>("/admin/forge/blueprints", { params: filtros });
  return resposta.data.data;
}
export async function obterForgeBlueprintAdmin(id: number): Promise<{ blueprint: ForgeBlueprintApi } & ForgeRelatorioValidacaoApi> {
  const resposta = await axiosInstance.get<{ data: { blueprint: ForgeBlueprintApi } & ForgeRelatorioValidacaoApi }>(`/admin/forge/blueprints/${id}`);
  return resposta.data.data;
}
export async function criarForgeBlueprintAdmin(payload: PayloadForgeBlueprintAdmin): Promise<ForgeBlueprintApi> {
  const resposta = await axiosInstance.post<{ data: { blueprint: ForgeBlueprintApi } }>("/admin/forge/blueprints", payload);
  return resposta.data.data.blueprint;
}
export async function atualizarForgeBlueprintAdmin(id: number, payload: PayloadForgeBlueprintAdmin): Promise<ForgeBlueprintApi> {
  const resposta = await axiosInstance.put<{ data: { blueprint: ForgeBlueprintApi } }>(`/admin/forge/blueprints/${id}`, payload);
  return resposta.data.data.blueprint;
}
export async function duplicarForgeBlueprintAdmin(id: number): Promise<ForgeBlueprintApi> {
  const resposta = await axiosInstance.post<{ data: { blueprint: ForgeBlueprintApi } }>(`/admin/forge/blueprints/${id}/duplicate`);
  return resposta.data.data.blueprint;
}
export async function validarForgeBlueprintAdmin(id: number): Promise<ForgeRelatorioValidacaoApi> {
  const resposta = await axiosInstance.post<{ data: ForgeRelatorioValidacaoApi }>(`/admin/forge/blueprints/${id}/validate`);
  return resposta.data.data;
}
export async function ativarForgeBlueprintAdmin(id: number, motivo?: string): Promise<ForgeBlueprintApi> {
  const resposta = await axiosInstance.post<{ data: { blueprint: ForgeBlueprintApi } }>(`/admin/forge/blueprints/${id}/activate`, { motivo });
  return resposta.data.data.blueprint;
}
export async function desativarForgeBlueprintAdmin(id: number, motivo?: string): Promise<ForgeBlueprintApi> {
  const resposta = await axiosInstance.post<{ data: { blueprint: ForgeBlueprintApi } }>(`/admin/forge/blueprints/${id}/deactivate`, { motivo });
  return resposta.data.data.blueprint;
}
// Bug "FORJA - CORREÇÃO EXCLUA TODOS OS BLUEPRINTS EXISTENTES NA
// FORJA, ATIVOS OU INATIVOS" — exclusão de verdade (nunca existia antes,
// só ativar/desativar).
export async function excluirForgeBlueprintAdmin(id: number, motivo?: string): Promise<{ id: number; excluido: boolean }> {
  const resposta = await axiosInstance.delete<{ data: { id: number; excluido: boolean } }>(`/admin/forge/blueprints/${id}`, { data: { motivo } });
  return resposta.data.data;
}
export async function excluirTodosForgeBlueprintsAdmin(motivo?: string): Promise<{ total: number; excluidos: number }> {
  const resposta = await axiosInstance.delete<{ data: { total: number; excluidos: number } }>("/admin/forge/blueprints", { data: { motivo } });
  return resposta.data.data;
}

export interface ForgePreviewBlueprintApi {
  blueprint: { id: number; nome: string; categoria_equipamento: string; tier_equipamento: number | null };
  nivel_forja_simulado: number;
  qualidade_base: string;
  ingredientes: Array<{ tipo_insumo: string; nome_recurso?: string; quantidade_necessaria: number; id_item: number | null; nome_item: string | null; imagem_url: string | null }>;
  chances_percentual_por_qualidade_final: Record<string, number>;
  tempo_segundos: number;
  item_resultado_qualidade_base: { id: number; nome: string; imagem_url: string | null; raridade: string; propriedades: Record<string, unknown> | null } | null;
}
export async function previewForgeBlueprintAdmin(id: number, params: { nivelForja: number; qualidadeBase: string }): Promise<ForgePreviewBlueprintApi> {
  const resposta = await axiosInstance.get<{ data: ForgePreviewBlueprintApi }>(`/admin/forge/blueprints/${id}/preview`, { params });
  return resposta.data.data;
}

// Overrides já vêm junto de obterForgeBlueprintAdmin (blueprint.itemResultado.raridadeOverrides)
// — estas duas funções só escrevem. atributos vazio/omitido numa chave
// volta a usar o multiplicador global pra aquele atributo.
export async function salvarForgeRaridadeOverrideAdmin(
  idBlueprint: number,
  qualidade: ForgeQualidade,
  atributos: Record<string, number | string>,
): Promise<ForgeRaridadeOverrideApi> {
  const resposta = await axiosInstance.put<{ data: { override: ForgeRaridadeOverrideApi } }>(
    `/admin/forge/blueprints/${idBlueprint}/rarity-overrides/${qualidade}`,
    { atributos },
  );
  return resposta.data.data.override;
}
export async function removerForgeRaridadeOverrideAdmin(idBlueprint: number, qualidade: ForgeQualidade): Promise<{ removido: boolean }> {
  const resposta = await axiosInstance.delete<{ data: { removido: boolean } }>(`/admin/forge/blueprints/${idBlueprint}/rarity-overrides/${qualidade}`);
  return resposta.data.data;
}

export interface ForgeRecursoApi {
  id: number;
  nome: string;
  profissao: string;
  ativo: boolean;
}
export async function listarForgeRecursosAdmin(profissao?: string): Promise<ForgeRecursoApi[]> {
  const resposta = await axiosInstance.get<{ data: { recursos: ForgeRecursoApi[] } }>("/admin/forge/resources", { params: { profissao } });
  return resposta.data.data.recursos;
}

// Forja-Materiais: produtos do Caldeirão (Alquimia) elegíveis como
// ingrediente ProdutoAlquimia — a Forja usa AlchemyRecipe.id como
// id_recurso desse tipo (não confundir com ExpeditionResource.id, que
// serve pra Barra/RecursoExpedicao).
export interface ForgeProdutoAlquimiaApi {
  id: number;
  key: string;
  nome: string;
  categoria: string;
  item_resultado: { id: number; nome: string; imagem_url: string | null } | null;
}
export async function listarForgeProdutosAlquimiaAdmin(): Promise<ForgeProdutoAlquimiaApi[]> {
  const resposta = await axiosInstance.get<{ data: { produtos: ForgeProdutoAlquimiaApi[] } }>("/admin/forge/alchemy-products");
  return resposta.data.data.produtos;
}

export interface ForgeBarraLinhaApi {
  id_recurso: number;
  nome_recurso: string;
  qualidades: Array<{ qualidade: ForgeQualidade; item: { id: number; nome: string; imagem_url: string | null; raridade: string } | null }>;
}
export async function listarForgeBarrasAdmin(): Promise<ForgeBarraLinhaApi[]> {
  const resposta = await axiosInstance.get<{ data: { recursos: ForgeBarraLinhaApi[] } }>("/admin/forge/bars");
  return resposta.data.data.recursos;
}
export async function salvarForgeBarraAdmin(idRecurso: number, qualidade: string, idItem: number) {
  await axiosInstance.put(`/admin/forge/bars/${idRecurso}/${qualidade}`, { id_item: idItem });
}
export async function removerForgeBarraAdmin(idRecurso: number, qualidade: string) {
  await axiosInstance.delete(`/admin/forge/bars/${idRecurso}/${qualidade}`, { data: { confirmar: true } });
}

export interface ForgeScrollApi {
  id_item: number;
  bonus_percentual: number;
  nivel_forja_minimo: number;
  tempo_segundos: number;
  ativo: boolean;
  excede_cap_sozinho?: boolean;
  item?: { id: number; nome: string; imagem_url: string | null; raridade: string };
  ingredientes: Array<{ id_item_material: number; quantidade: number; material?: { id: number; nome: string; imagem_url: string | null } }>;
}
export interface PayloadForgeScrollAdmin {
  id_item?: number;
  bonus_percentual: number;
  nivel_forja_minimo: number;
  tempo_segundos: number;
  ingredientes?: { id_item_material: number; quantidade: number }[];
}
export async function listarForgeScrollsAdmin(ativo?: boolean): Promise<ForgeScrollApi[]> {
  const resposta = await axiosInstance.get<{ data: { itens: ForgeScrollApi[] } }>("/admin/forge/scrolls", { params: { ativo } });
  return resposta.data.data.itens;
}
export async function criarForgeScrollAdmin(payload: PayloadForgeScrollAdmin): Promise<ForgeScrollApi> {
  const resposta = await axiosInstance.post<{ data: { scroll: ForgeScrollApi } }>("/admin/forge/scrolls", payload);
  return resposta.data.data.scroll;
}
export async function atualizarForgeScrollAdmin(idItem: number, payload: Partial<PayloadForgeScrollAdmin>): Promise<ForgeScrollApi> {
  const resposta = await axiosInstance.put<{ data: { scroll: ForgeScrollApi } }>(`/admin/forge/scrolls/${idItem}`, payload);
  return resposta.data.data.scroll;
}
export async function duplicarForgeScrollAdmin(idItem: number, novoIdItem: number): Promise<ForgeScrollApi> {
  const resposta = await axiosInstance.post<{ data: { scroll: ForgeScrollApi } }>(`/admin/forge/scrolls/${idItem}/duplicate`, { novo_id_item: novoIdItem });
  return resposta.data.data.scroll;
}
export async function desativarForgeScrollAdmin(idItem: number): Promise<ForgeScrollApi> {
  const resposta = await axiosInstance.post<{ data: { scroll: ForgeScrollApi } }>(`/admin/forge/scrolls/${idItem}/deactivate`);
  return resposta.data.data.scroll;
}
export async function reativarForgeScrollAdmin(idItem: number): Promise<ForgeScrollApi> {
  const resposta = await axiosInstance.post<{ data: { scroll: ForgeScrollApi } }>(`/admin/forge/scrolls/${idItem}/reactivate`);
  return resposta.data.data.scroll;
}

export interface ForgeBalanceGrupoApi<T = Record<string, unknown>> {
  atual: T;
  padrao: T;
}
export interface ForgeBalanceCompletoApi {
  "forge.smelting": ForgeBalanceGrupoApi;
  "forge.crafting": ForgeBalanceGrupoApi;
  "forge.refinement": ForgeBalanceGrupoApi;
  "forge.progression": ForgeBalanceGrupoApi;
}
export async function obterForgeBalanceAdmin(): Promise<ForgeBalanceCompletoApi> {
  const resposta = await axiosInstance.get<{ data: ForgeBalanceCompletoApi }>("/admin/forge/balance");
  return resposta.data.data;
}
export async function atualizarForgeBalanceAdmin(grupo: string, valores: Record<string, unknown>): Promise<ForgeBalanceGrupoApi> {
  const resposta = await axiosInstance.put<{ data: ForgeBalanceGrupoApi }>(`/admin/forge/balance/${grupo}`, valores);
  return resposta.data.data;
}

export interface ForgeSimulacaoRefinamentoApi {
  alvo: number;
  garantido: boolean;
  chance_base_percentual: number;
  bonus_forja_percentual: number;
  bonus_pergaminho_percentual: number;
  chance_final_percentual: number;
  cap_percentual: number;
  custo_gold: number;
  materiais: Array<{ papel: string; quantidade: number; nome: string | null; imagem_url: string | null }>;
  xp_sucesso: number;
  xp_falha: number;
  bonus_atributo_apos_sucesso_percentual: number | null;
  pergaminho_aplicado: { id_item: number; nome: string; bonus_percentual: number } | null;
}
export async function previewForgeRefinamentoAdmin(payload: { categoria: string; qualidade: string; refinamentoAtual: number; nivelForja: number; idItemPergaminho?: number | null; tierEquipamento?: number }): Promise<ForgeSimulacaoRefinamentoApi> {
  const resposta = await axiosInstance.post<{ data: ForgeSimulacaoRefinamentoApi }>("/admin/forge/balance/preview-refinement", payload);
  return resposta.data.data;
}

export interface ForgeImpactoProgressaoApi {
  total_personagens: number;
  personagens_sobem: number;
  personagens_descem: number;
  distribuicao_antes: Record<string, number>;
  distribuicao_depois: Record<string, number>;
  blueprints_potencialmente_afetados: Array<{ id: number; nome: string; nivel_forja_minimo: number }>;
  curva_xp_total_nova: Record<string, number>;
}
export async function previewForgeImpactoProgressaoAdmin(XP_NECESSARIO_POR_ETAPA: Record<string, number>): Promise<ForgeImpactoProgressaoApi> {
  const resposta = await axiosInstance.post<{ data: ForgeImpactoProgressaoApi }>("/admin/forge/balance/preview-progression-impact", { XP_NECESSARIO_POR_ETAPA });
  return resposta.data.data;
}

export interface ForgeMetricasApi {
  porTipo24h: Array<{ tipo_acao: string; total: number }>;
  porTipo7d: Array<{ tipo_acao: string; total: number }>;
  fabricacoesPorBlueprint: Array<{ id_blueprint: number | null; nome: string | null; total: number; com_upgrade_qualidade: number }>;
  fundicaoPorRecursoQualidade: Array<{ id_recurso: number; qualidade_base: string; total: number }>;
  refinoPorAlvo: Array<{ alvo: number; tentativas: number; taxa_sucesso_observada: number }>;
  pergaminhosUsados: Array<{ id_item_pergaminho: number; nome: string | null; total: number }>;
  goldRemovido: { gold_removido_24h: number; gold_removido_7d: number; gold_removido_total: number };
}
export async function obterForgeMetricasAdmin(): Promise<ForgeMetricasApi> {
  const resposta = await axiosInstance.get<{ data: ForgeMetricasApi }>("/admin/forge/metrics");
  return resposta.data.data;
}

// ---------------------------------------------------------------------
// Painel Administrativo Fase 6 — Sistema de Proezas Únicas (§19).
// uniquefeats.manage cobre Proezas/Legados/Triggers/Histórico; a
// revogação e a transferência de claim (reparo excepcional) exigem a
// permissão SEPARADA e mais forte uniquefeats.repair (só SuperAdmin —
// ver adminUniqueFeatRoutes.js no backend). trigger_key/trigger_config
// nunca são validados aqui: os schemas vêm sempre em runtime de
// listarUniqueFeatTriggerSchemasAdmin/validarUniqueFeatTriggerConfigAdmin,
// nunca hardcoded no frontend.
export interface UniqueFeatTriggerSchemaApi {
  trigger_key: string;
  schema: Record<string, "number" | "string" | "boolean" | "array">;
}
export async function listarUniqueFeatTriggerSchemasAdmin(): Promise<UniqueFeatTriggerSchemaApi[]> {
  const resposta = await axiosInstance.get<{ data: { itens: UniqueFeatTriggerSchemaApi[] } }>("/admin/unique-feats/triggers/schemas");
  return resposta.data.data.itens;
}
export async function obterUniqueFeatTriggerSchemaAdmin(triggerKey: string): Promise<UniqueFeatTriggerSchemaApi> {
  const resposta = await axiosInstance.get<{ data: UniqueFeatTriggerSchemaApi }>(`/admin/unique-feats/triggers/schemas/${triggerKey}`);
  return resposta.data.data;
}
export async function validarUniqueFeatTriggerConfigAdmin(triggerKey: string, triggerConfig: Record<string, unknown>): Promise<{ valido: true }> {
  const resposta = await axiosInstance.post<{ data: { valido: true } }>("/admin/unique-feats/triggers/validar", {
    trigger_key: triggerKey,
    trigger_config: triggerConfig,
  });
  return resposta.data.data;
}

export interface UniqueFeatClaimApi {
  id: number;
  id_unique_feat: number;
  id_personagem: number | null;
  character_name_snapshot: string;
  claimed_at: string;
  trigger_key: string;
  trigger_snapshot: Record<string, unknown>;
  source_event_id: string | null;
  status: "VALID" | "REVOKED";
  repair_metadata: Record<string, unknown> | null;
  proeza?: { id: number; key: string; nome: string; id_power_reward: number };
  personagem?: { id: number; nome: string } | null;
}

export interface UniqueFeatApi {
  id: number;
  key: string;
  nome: string;
  descricao_publica: string;
  descricao_secreta_admin: string;
  icone_url: string | null;
  categoria: string | null;
  trigger_key: string;
  trigger_config: Record<string, unknown>;
  id_power_reward: number;
  id_achievement_reward: number | null;
  id_title_reward: number | null;
  visibility_before_claim: "HIDDEN" | "TEASER";
  reveal_after_claim: "FULL" | "FLAVOR_ONLY" | "REMAIN_SECRET";
  announce_global: boolean;
  ativa: boolean;
  claim?: UniqueFeatClaimApi | null;
  powerRecompensa?: { id: number; nome: string; acquisition_scope: "NORMAL" | "UNIQUE_FEAT" };
  achievementRecompensa?: { id: number; nome: string } | null;
  titleRecompensa?: { id: number; nome: string } | null;
}

export interface PayloadNovoPowerUniqueFeatAdmin {
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

export interface PayloadUniqueFeatAdmin {
  nome: string;
  key: string;
  descricao_publica: string;
  descricao_secreta_admin: string;
  icone_url?: string | null;
  categoria?: string | null;
  trigger_key: string;
  trigger_config?: Record<string, unknown>;
  id_achievement_reward?: number | null;
  id_title_reward?: number | null;
  visibility_before_claim?: "HIDDEN" | "TEASER";
  reveal_after_claim?: "FULL" | "FLAVOR_ONLY" | "REMAIN_SECRET";
  announce_global?: boolean;
  // Exatamente um dos dois é obrigatório na CRIAÇÃO (nunca nos dois —
  // o backend rejeita se faltarem ambos); nenhum dos dois é aceito na
  // edição (o Legado fica fixo depois de criado).
  id_power_reward?: number;
  novo_power?: PayloadNovoPowerUniqueFeatAdmin;
}

export type PayloadEdicaoUniqueFeatAdmin = Partial<Omit<PayloadUniqueFeatAdmin, "id_power_reward" | "novo_power">>;

export interface FiltrosUniqueFeatsAdmin {
  nome?: string;
  trigger_key?: string;
  ativa?: boolean;
  conquistada?: boolean;
  categoria?: string;
}

export async function listarUniqueFeatsAdmin(filtros: FiltrosUniqueFeatsAdmin = {}): Promise<UniqueFeatApi[]> {
  const resposta = await axiosInstance.get<{ data: { itens: UniqueFeatApi[] } }>("/admin/unique-feats", { params: filtros });
  return resposta.data.data.itens;
}
export async function obterUniqueFeatAdmin(id: number): Promise<UniqueFeatApi> {
  const resposta = await axiosInstance.get<{ data: { feat: UniqueFeatApi } }>(`/admin/unique-feats/${id}`);
  return resposta.data.data.feat;
}
export async function criarUniqueFeatAdmin(payload: PayloadUniqueFeatAdmin): Promise<UniqueFeatApi> {
  const resposta = await axiosInstance.post<{ data: { feat: UniqueFeatApi } }>("/admin/unique-feats", payload);
  return resposta.data.data.feat;
}
export async function atualizarUniqueFeatAdmin(id: number, payload: PayloadEdicaoUniqueFeatAdmin): Promise<UniqueFeatApi> {
  const resposta = await axiosInstance.put<{ data: { feat: UniqueFeatApi } }>(`/admin/unique-feats/${id}`, payload);
  return resposta.data.data.feat;
}
export async function duplicarUniqueFeatAdmin(id: number): Promise<UniqueFeatApi> {
  const resposta = await axiosInstance.post<{ data: { feat: UniqueFeatApi } }>(`/admin/unique-feats/${id}/duplicate`);
  return resposta.data.data.feat;
}
export async function desativarUniqueFeatAdmin(id: number, motivo?: string): Promise<UniqueFeatApi> {
  const resposta = await axiosInstance.post<{ data: { feat: UniqueFeatApi } }>(`/admin/unique-feats/${id}/deactivate`, { motivo });
  return resposta.data.data.feat;
}
export async function reativarUniqueFeatAdmin(id: number): Promise<UniqueFeatApi> {
  const resposta = await axiosInstance.post<{ data: { feat: UniqueFeatApi } }>(`/admin/unique-feats/${id}/reactivate`);
  return resposta.data.data.feat;
}

export interface UniquePowerEffectApi {
  id_power: number;
  effect_key: string;
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
export interface UniqueFeatLegadoApi {
  power: PowerApi;
  efeito: UniquePowerEffectApi | null;
  jogadoresAfetados: number;
}
export async function obterUniqueFeatLegadoAdmin(idPower: number): Promise<UniqueFeatLegadoApi> {
  const resposta = await axiosInstance.get<{ data: UniqueFeatLegadoApi }>(`/admin/unique-feats/legados/${idPower}`);
  return resposta.data.data;
}
export interface PayloadUniqueFeatLegadoAdmin {
  effect_key?: string;
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
export async function atualizarUniqueFeatLegadoAdmin(idPower: number, payload: PayloadUniqueFeatLegadoAdmin): Promise<UniquePowerEffectApi> {
  const resposta = await axiosInstance.put<{ data: { efeito: UniquePowerEffectApi } }>(`/admin/unique-feats/legados/${idPower}`, payload);
  return resposta.data.data.efeito;
}

export interface FiltrosUniqueFeatClaimsAdmin {
  idPersonagem?: number;
  trigger_key?: string;
  status?: "VALID" | "REVOKED";
}
export async function listarUniqueFeatClaimsAdmin(filtros: FiltrosUniqueFeatClaimsAdmin = {}): Promise<UniqueFeatClaimApi[]> {
  const resposta = await axiosInstance.get<{ data: { itens: UniqueFeatClaimApi[] } }>("/admin/unique-feats/claims/historico", { params: filtros });
  return resposta.data.data.itens;
}
export async function revogarUniqueFeatClaimAdmin(id: number, motivo: string): Promise<UniqueFeatClaimApi> {
  const resposta = await axiosInstance.post<{ data: { claim: UniqueFeatClaimApi } }>(`/admin/unique-feats/claims/${id}/revogar`, { motivo });
  return resposta.data.data.claim;
}
export async function transferirUniqueFeatClaimAdmin(id: number, idPersonagemNovo: number, motivo: string): Promise<UniqueFeatClaimApi> {
  const resposta = await axiosInstance.post<{ data: { claim: UniqueFeatClaimApi } }>(`/admin/unique-feats/claims/${id}/transferir`, {
    idPersonagemNovo,
    motivo,
  });
  return resposta.data.data.claim;
}

// Modo Manutenção — kill-switch site-wide (pedido do usuário: "ao
// ativar, só admin consegue jogar"). Status público é lido pelo
// RootLayout via o backend direto (sem passar por esses helpers, que
// exigem sessão admin); estes dois cobrem só a tela de administração
// do painel.
export interface MaintenanceStatusApi {
  enabled: boolean;
  message: string;
}
export async function obterStatusManutencaoAdmin(): Promise<MaintenanceStatusApi> {
  const resposta = await axiosInstance.get<{ data: MaintenanceStatusApi }>("/admin/maintenance");
  return resposta.data.data;
}
export async function atualizarStatusManutencaoAdmin(payload: { enabled: boolean; message?: string }): Promise<MaintenanceStatusApi> {
  const resposta = await axiosInstance.patch<{ data: MaintenanceStatusApi }>("/admin/maintenance", payload);
  return resposta.data.data;
}
