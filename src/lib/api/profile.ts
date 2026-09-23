/**
 * Perfil de Jogador — chamadas HTTP e tipos do endpoint agregado
 * (`GET /characters/:id/profile`, `PATCH /characters/me/profile`).
 *
 * O backend já resolve privacidade (visitante x dono) e agrega tudo
 * (equipamento, progressão, PvP, Bestiário, conquistas) num payload só —
 * este arquivo só tipa e expõe, nunca recalcula nada aqui.
 */
import axiosInstance from "@/utils/axiosIntance";

export interface PerfilIdentity {
  id: number;
  nome: string;
  avatar_key: string | null;
  genero: string;
  nivel: number;
  raca: string | null;
  classe: string | null;
  natureza_magica: string | null;
  id_evolucao_classe: number | null;
  frase: string | null;
  titulo: string | null;
  atributos?: {
    forca: number;
    vitalidade: number;
    agilidade: number;
    inteligencia: number;
    velocidade: number;
  };
}

export interface PerfilCombatPower {
  total: number;
  version: number;
}

export interface PerfilGuild {
  id: number;
  nome: string;
  sigla: string;
  rank_guilda: string;
  cargo: string;
}

export interface PerfilEquipamento {
  slot: string;
  id_instancia: number | null;
  id_item: number;
  nome: string;
  tipo_item: string;
  raridade: string;
  tier_equipamento: number | null;
  imagem_url: string | null;
  refinamento: number;
  propriedades_base: Record<string, unknown> | null;
  propriedades_efetivas: Record<string, unknown> | null;
}

export interface PerfilProgressao {
  nivel: number;
  rank_aventureiro: { rank: string; contratos_concluidos: number };
  forja: { nivel: number };
  expedicao: { mineracao: number; silvicultura: number; exploracao: number };
}

export interface PerfilPvp {
  ranked: { tier: string; divisao: string | null; tier_label: string; rating: number } | null;
  vitorias_temporada: number;
  derrotas_temporada: number;
  taxa_vitoria_temporada: number | null;
  melhor_sequencia: number;
  trofeus_torneio: number;
  medalhas: { ouro: number; prata: number; bronze: number };
}

export interface PerfilBestiario {
  criaturas_descobertas: number;
  criaturas_totais: number;
  regioes_completas: number;
  regioes_totais: number;
  maestrias_v: number;
}

export interface PerfilConquista {
  id_achievement: number;
  key: string;
  nome: string;
  descricao: string;
  icone_url: string | null;
  categoria: string;
  desbloqueada_em: string;
}

export interface PerfilHighlights {
  conquistas: { slot: number; id_achievement: number; key: string; nome: string; icone_url: string | null }[];
  monstros: { slot: number; id_monstro: number; nome: string; abates: number }[];
}

export interface PerfilPermissoes {
  eh_proprio: boolean;
  pode_enviar_mensagem: boolean;
  pode_convidar_party: boolean;
  pode_convidar_guilda: boolean;
}

export interface PerfilJogador {
  identity: PerfilIdentity;
  combatPower: PerfilCombatPower | null;
  guild: PerfilGuild | null;
  equipment: PerfilEquipamento[];
  progression: PerfilProgressao;
  pvp: PerfilPvp;
  bestiary: PerfilBestiario;
  achievements: { total: number; lista: PerfilConquista[] };
  highlights: PerfilHighlights;
  permissions: PerfilPermissoes;
  // Só presente no próprio perfil (TitleSelector, §25/§43).
  titulos_disponiveis?: { id: number; nome: string }[];
}

export async function buscarPerfil(characterId: number): Promise<PerfilJogador | null> {
  try {
    const resp = await axiosInstance.get<{ data: PerfilJogador }>(`/characters/${characterId}/profile`);
    return resp.data.data;
  } catch {
    return null;
  }
}

export interface AtualizarPerfilPayload {
  frase?: string | null;
  id_titulo_selecionado?: number | null;
  conquistas_destaque?: (number | null)[];
  monstros_destaque?: (number | null)[];
}

export async function atualizarPerfilProprio(payload: AtualizarPerfilPayload): Promise<PerfilJogador> {
  const resp = await axiosInstance.patch<{ data: PerfilJogador }>(
    "/characters/me/profile",
    payload as unknown as Record<string, unknown>,
  );
  return resp.data.data;
}
