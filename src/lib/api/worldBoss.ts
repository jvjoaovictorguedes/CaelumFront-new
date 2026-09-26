// Cliente de API do Boss Global / Ameaça Mundial (Caelum_Boss_Global.docx).
// O status público NUNCA expõe discovery_threshold/discovery_progress —
// enquanto o evento está em COOLDOWN/DORMANT, o "mundo" simplesmente
// não sabe que existe nada; a UI toda parte desse pressuposto.
import axiosInstance from "@/utils/axiosIntance";

export interface WorldBossFaseApi {
  ordem: number;
  nome_fase: string;
  hp_percentual_max: number;
  modificador_dano_percentual: number;
  texto_alerta: string | null;
}

export interface WorldBossStatusApi {
  status: "Nenhum" | "DISCOVERED" | "ACTIVE" | "DEFEATED" | "CANCELLED";
  event_id?: number;
  nome?: string | null;
  descricao?: string | null;
  lore?: string | null;
  imagem_url?: string | null;
  mensagem_convocacao?: string | null;
  mensagem_fase_final?: string | null;
  mensagem_derrota?: string | null;
  hp_max?: number;
  hp_current?: number;
  hp_percentual?: number;
  fase_atual?: WorldBossFaseApi | null;
  discovered_at?: string | null;
  activated_at?: string | null;
  auto_awaken_at?: string | null;
  defeated_at?: string | null;
  descobridor?: { id: number; nome: string } | null;
  golpe_final_por?: { id: number; nome: string } | null;
}

export async function obterStatusWorldBoss(): Promise<WorldBossStatusApi> {
  const resposta = await axiosInstance.get<{ data: WorldBossStatusApi }>("/world-boss/status");
  return resposta.data.data;
}

export interface WorldBossPoderApi {
  id: number;
  nome: string;
  imagem_url: string | null;
  custo_mana: number;
  dano_base: number;
  nivel_habilidade: number;
}

export interface WorldBossLutadorApi {
  vida_atual: number;
  mana_atual: number;
  vida_max: number;
  mana_max: number;
  forca?: number;
  agilidade?: number;
  nivel?: number;
}

export interface WorldBossEntrarResultado {
  sessao: { id: number; action_seq: number };
  lutador: WorldBossLutadorApi;
  poderes: WorldBossPoderApi[];
  status: WorldBossStatusApi;
}

export async function entrarWorldBoss(): Promise<WorldBossEntrarResultado> {
  const resposta = await axiosInstance.post<{ data: WorldBossEntrarResultado }>("/world-boss/join");
  return resposta.data.data;
}

export async function sairWorldBoss(): Promise<{ encerrada: boolean } | null> {
  const resposta = await axiosInstance.post<{ data: { encerrada: boolean } | null }>("/world-boss/leave");
  return resposta.data.data;
}

export interface WorldBossAcaoResultado {
  nomeAcao: string;
  dano: number;
  esquivou: boolean;
  cura: number;
  manaCurada: number;
  golpeFinal: boolean;
  lutador: { vida_atual: number; mana_atual: number; vida_max: number; mana_max: number };
  boss: { event_id: number; hp_max: number; hp_current: number; hp_percentual: number; derrotado: boolean };
}

export async function atacarWorldBoss(): Promise<WorldBossAcaoResultado> {
  const resposta = await axiosInstance.post<{ data: WorldBossAcaoResultado }>("/world-boss/action", { tipo: "attack" });
  return resposta.data.data;
}

export async function usarPoderWorldBoss(idPoder: number): Promise<WorldBossAcaoResultado> {
  const resposta = await axiosInstance.post<{ data: WorldBossAcaoResultado }>("/world-boss/action", { tipo: "power", idPoder });
  return resposta.data.data;
}

export function mensagemDeErroWorldBoss(erro: unknown, padrao: string): string {
  return (erro as { response?: { data?: { message?: string } } })?.response?.data?.message ?? padrao;
}
