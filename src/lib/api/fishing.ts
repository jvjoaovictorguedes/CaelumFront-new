// Cliente de API do domínio de Pesca & Navegação (ver especificação
// completa — pesca_spec.txt). Espelha o padrão de src/lib/api/pvp.ts:
// cada função chama axiosInstance e devolve `data.data` já desembrulhado.
// O servidor é sempre autoritativo (§15/§31) — este arquivo nunca decide
// espécie/peso/tensão/resultado, só envia intenção e mostra o que a API
// devolve.
import axiosInstance from "@/utils/axiosIntance";

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

export const fishingApi = {
  getProgresso: () => axiosInstance.get("/fishing/progress").then((r) => r.data.data.progresso as ProgressoPesca),
  getZonas: () => axiosInstance.get("/fishing/zones").then((r) => r.data.data.zonas as FishingZone[]),
  getRods: () => axiosInstance.get("/fishing/rods").then((r) => r.data.data.varas as VaraPesca[]),
  getLoadout: () => axiosInstance.get("/fishing/loadout").then((r) => r.data.data.loadout as { id_instancia_vara: number | null; vara: VaraPesca | null }),
  setLoadoutRod: (idInstanciaVara: number | null) =>
    axiosInstance.put("/fishing/loadout/rod", { id_instancia_vara: idInstanciaVara }).then((r) => r.data.data),
  getBaits: () => axiosInstance.get("/fishing/baits").then((r) => r.data.data.iscas as IscaPesca[]),
  getAlmanac: () => axiosInstance.get("/fishing/almanac").then((r) => r.data.data.especies),

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
