// Cliente de API do domínio de Pesca & Navegação (ver especificação
// completa — pesca_spec.txt). Espelha o padrão de src/lib/api/pvp.ts:
// cada função chama axiosInstance e devolve `data.data` já desembrulhado.
// O servidor é sempre autoritativo (§15/§31) — este arquivo nunca decide
// espécie/peso/tensão/resultado, só envia intenção e mostra o que a API
// devolve.
import axiosInstance from "@/utils/axiosIntance";

export function mensagemDeErro(erro: unknown, padrao: string): string {
  const dados = (erro as { response?: { data?: { message?: string } } })?.response?.data;
  return dados?.message ?? padrao;
}

export interface ProgressoPesca {
  nivel: number;
  experiencia: number;
  xp_proximo_nivel: number | null;
  nivel_maximo: number;
  total_capturado: number;
}

export interface FishingZone {
  id: number;
  key: string;
  nome: string;
  descricao: string | null;
  imagem_url: string | null;
  nivel_pesca_minimo: number;
  tier_embarcacao_minimo: number;
  dificuldade_ambiente: number;
}

export interface VaraPesca {
  id_instancia: number;
  id_item: number;
  nome: string;
  raridade: string;
  imagem_url: string | null;
  refinamento: number;
  estado: "Inventario" | "Equipada" | "Mercado";
  propriedades_efetivas: {
    forca_linha: number;
    controle: number;
    recolhimento: number;
    precisao: number;
    estabilidade: number;
  } | null;
}

export interface IscaPesca {
  id_item: number;
  key: string;
  nome: string;
  imagem_url: string | null;
  nivel_pesca_minimo: number;
  quantidade_disponivel: number;
}

export interface SessaoPesca {
  id: number;
  fase:
    | "CREATED"
    | "CASTING"
    | "WAITING_BITE"
    | "HOOK_WINDOW"
    | "FIGHTING"
    | "CAUGHT"
    | "ESCAPED"
    | "BROKEN_LINE"
    | "EXPIRED"
    | "ABORTED";
  tensao: number;
  progresso: number;
  sequence: number;
  expires_at: string;
  mordida_disponivel_em: string | null;
  janela_mordida_expira_em: string | null;
  resultado?: {
    resultado?: string;
    motivo?: string;
    nome_especie?: string;
    weight_g?: number;
    quality?: number;
    xp?: number;
    primeira_descoberta?: boolean;
  };
}

export interface Vessel {
  id: number;
  key: string;
  nome: string;
  tier: number;
  nivel_pesca_minimo: number;
  preco: number;
  possuida: boolean;
}

export interface MarineRouteDto {
  id: number;
  min_vessel_tier: number;
  distance: number;
  zonaDestino: { id: number; nome: string };
  portoOrigem: { id: number; nome: string };
}

export interface NavigationState {
  id_port_atual: number | null;
  id_zone_atual: number | null;
}

export interface AlmanacEspecie {
  id: number;
  key: string;
  nome: string | null;
  descoberto: boolean;
  comportamento: { key: string; nome: string; descricao: string; dica: string } | null;
  dificuldade: { valor: number; rotulo: string } | null;
  peso_min_g: number | null;
  peso_max_g: number | null;
  total_capturado: number;
  maior_peso_g: number;
  zonas: { id: number; nome: string }[];
  lendario: boolean;
}

export interface RankingPescaItemTotal {
  posicao: number;
  id: number;
  nome: string;
  nivel_pesca: number;
  total_capturado: number;
}

export interface RankingPescaItemMaiorPeixe {
  posicao: number;
  id: number;
  nome: string;
  weight_g: number;
  especie_nome: string | null;
  caught_at: string;
}

export interface RankingPescaMinhaPosicao {
  elegivel: boolean;
  motivo?: string;
  posicao?: number;
  total_capturado?: number;
  weight_g?: number;
}

export interface RankingPescaResposta<T> {
  itens: T[];
  pagina: number;
  totalPaginas: number;
  totalItens: number;
  minhaPosicao: RankingPescaMinhaPosicao;
}

export interface TorneioPescaItem {
  posicao: number;
  id: number;
  nome: string;
  pontuacao: number;
  capturas: number;
}

export interface TorneioPesca {
  id: number;
  nome: string;
  id_zone: number | null;
  inicia_em: string;
  termina_em: string;
  ativo: boolean;
  zona?: { id: number; nome: string } | null;
  // Ideia #1 da fila de melhorias — fechamento automático (ver
  // fishingTournamentScheduler.js no backend): preenchidos quando o
  // torneio termina sozinho, nunca por ninguém diretamente.
  finalizado_em?: string | null;
  vencedor_character_id?: number | null;
  vencedor_nome?: string | null;
}

export interface TorneioPescaMinhaPosicao {
  elegivel: boolean;
  motivo?: string;
  posicao?: number;
  pontuacao: number;
  capturas: number;
}

export interface TorneioPescaResposta {
  torneio: TorneioPesca | null;
  statusTorneio: "EM_ANDAMENTO" | "AGENDADO" | "NENHUM" | "FINALIZADO";
  leaderboard: { itens: TorneioPescaItem[]; pagina: number; totalPaginas: number; totalItens: number } | null;
  minhaPosicao: TorneioPescaMinhaPosicao | null;
  // Ideia #1 da fila de melhorias — se o personagem atual já se
  // inscreveu (controla se mostra o botão "Inscrever-se" ou não).
  inscrito: boolean;
}

export const fishingApi = {
  getProgresso: () => axiosInstance.get("/fishing/progress").then((r) => r.data.data.progresso as ProgressoPesca),
  getZonas: () => axiosInstance.get("/fishing/zones").then((r) => r.data.data.zonas as FishingZone[]),
  getRods: () => axiosInstance.get("/fishing/rods").then((r) => r.data.data.varas as VaraPesca[]),
  getLoadout: () => axiosInstance.get("/fishing/loadout").then((r) => r.data.data.loadout as { id_instancia_vara: number | null; vara: VaraPesca | null }),
  setLoadoutRod: (idInstanciaVara: number | null) =>
    axiosInstance.put("/fishing/loadout/rod", { id_instancia_vara: idInstanciaVara }).then((r) => r.data.data),
  getBaits: () => axiosInstance.get("/fishing/baits").then((r) => r.data.data.iscas as IscaPesca[]),
  getAlmanac: () => axiosInstance.get("/fishing/almanac").then((r) => r.data.data.especies as AlmanacEspecie[]),

  getRanking: (type: "total" | "biggest", page = 1) =>
    axiosInstance
      .get("/fishing/ranking", { params: { type, page } })
      .then((r) => r.data.data as RankingPescaResposta<RankingPescaItemTotal | RankingPescaItemMaiorPeixe>),
  getTournament: () => axiosInstance.get("/fishing/tournament").then((r) => r.data.data as TorneioPescaResposta),
  inscreverTournament: (idTorneio: number) =>
    axiosInstance.post(`/fishing/tournament/${idTorneio}/inscrever`).then((r) => r.data.data as { inscrito: boolean }),

  getSessaoAtiva: () => axiosInstance.get("/fishing/sessions/active").then((r) => r.data.data.sessao as SessaoPesca | null),
  startSession: (zoneId: number, rodInstanceId: number | null, baitItemId: number | null) =>
    axiosInstance
      .post("/fishing/sessions/start", { zoneId, rodInstanceId, baitItemId })
      .then((r) => r.data.data.sessao as SessaoPesca),
  cast: (sessionId: number) => axiosInstance.post(`/fishing/sessions/${sessionId}/cast`).then((r) => r.data.data.sessao as SessaoPesca),
  hook: (sessionId: number) => axiosInstance.post(`/fishing/sessions/${sessionId}/hook`).then((r) => r.data.data.sessao as SessaoPesca),
  reel: (sessionId: number, active: boolean) =>
    axiosInstance.post(`/fishing/sessions/${sessionId}/reel`, { active }).then((r) => r.data.data.sessao as SessaoPesca),
  abandon: (sessionId: number) => axiosInstance.post(`/fishing/sessions/${sessionId}/abandon`).then((r) => r.data.data.sessao as SessaoPesca),

  getPorts: () => axiosInstance.get("/fishing/navigation/ports").then((r) => r.data.data.portos),
  getVessels: () => axiosInstance.get("/fishing/navigation/vessels").then((r) => r.data.data.embarcacoes as Vessel[]),
  getRoutes: () => axiosInstance.get("/fishing/navigation/routes").then((r) => r.data.data.rotas as MarineRouteDto[]),
  getNavigationState: () => axiosInstance.get("/fishing/navigation/state").then((r) => r.data.data.estado as NavigationState),
  acquireVessel: (vesselId: number) => axiosInstance.post(`/fishing/navigation/vessels/${vesselId}/acquire`).then((r) => r.data.data),
  travel: (routeId: number) => axiosInstance.post("/fishing/navigation/travel", { routeId }).then((r) => r.data.data.estado as NavigationState),
};
