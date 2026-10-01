// Cliente de API do Boss Global / Ameaça Mundial. O status público
// NUNCA expõe discovery_threshold/discovery_progress — enquanto o
// evento está em COOLDOWN/DORMANT, o "mundo" simplesmente não sabe que
// existe nada; a UI toda parte desse pressuposto.
import axiosInstance from "@/utils/axiosIntance";

export interface WorldBossFaseApi {
  ordem: number;
  nome_fase: string;
  hp_percentual_max: number;
  modificador_dano_percentual: number;
  texto_alerta: string | null;
}

// §18.1/§18.3 — relógio de combate público (Furia/próxima ação/cast em
// andamento), só presente enquanto o evento está ACTIVE. O frontend
// NUNCA decide quando o cast resolve — só anima a diferença de tempo
// até resolves_at (servidor autoritativo).
export interface WorldBossCombatePublicoApi {
  furia_atual_pct: number;
  boss_action_seq: number;
  phase_action_seq: number;
  proxima_acao_em_ms: number | null;
  cast_pendente: { power: { id: number; nome: string; imagem_url: string | null } | null; resolves_at: string } | null;
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
  zona_descoberta?: { id: number; nome: string } | null;
  golpe_final_por?: { id: number; nome: string } | null;
  maior_dano_por?: { id: number; nome: string; damage_total: number | null } | null;
  combate?: WorldBossCombatePublicoApi | null;
}

export async function obterStatusWorldBoss(): Promise<WorldBossStatusApi> {
  const resposta = await axiosInstance.get<{ data: WorldBossStatusApi }>("/world-boss/status");
  return resposta.data.data;
}

// §10.2/§10.4 — mesma linha do ranking admin: badges cumulativos (0 a
// 3), posição/nome/dano/percentual de HP do Boss.
export interface WorldBossRankingLinhaApi {
  posicao: number;
  character_id: number;
  nome: string | null;
  damage_total: number;
  damage_percent: number;
  badges: ("MAIOR_DANO" | "GOLPE_FINAL" | "DESCOBRIDOR")[];
}
export interface WorldBossRankingApi {
  event_id: number | null;
  status: string | null;
  lider_oficial: boolean;
  top: WorldBossRankingLinhaApi[];
  minha_posicao: WorldBossRankingLinhaApi | null;
}

export async function obterRankingWorldBoss(limit = 10): Promise<WorldBossRankingApi> {
  const resposta = await axiosInstance.get<{ data: WorldBossRankingApi }>("/world-boss/ranking", { params: { limit } });
  return resposta.data.data;
}
export async function obterMinhaPosicaoWorldBoss(): Promise<WorldBossRankingApi> {
  const resposta = await axiosInstance.get<{ data: WorldBossRankingApi }>("/world-boss/ranking/me");
  return resposta.data.data;
}

export interface WorldBossHistoricoItemApi {
  event_id: number;
  nome: string | null;
  imagem_url: string | null;
  defeated_at: string | null;
  activated_at: string | null;
  descobridor: { id: number; nome: string | null } | null;
  golpe_final_por: { id: number; nome: string | null } | null;
  maior_dano_por: { id: number; nome: string | null; damage_total: number | null } | null;
}
export async function obterHistoricoWorldBoss(limit = 5): Promise<WorldBossHistoricoItemApi[]> {
  const resposta = await axiosInstance.get<{ data: WorldBossHistoricoItemApi[] }>("/world-boss/history", { params: { limit } });
  return resposta.data.data;
}

export interface WorldBossPoderApi {
  id: number;
  nome: string;
  imagem_url: string | null;
  custo_mana: number;
  dano_base: number;
  cooldown: number | null;
  nivel_habilidade: number;
  escala_atributo?: string;
  valor_escala?: number;
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

// Mapa "power:<id>" -> turnos restantes de cooldown (§18.1/§34) — mesmo
// formato de cooldownService no backend; ausência da chave = sem cooldown.
export type WorldBossCooldownsApi = Record<string, number>;

export interface WorldBossEntrarResultado {
  sessao: { id: number; action_seq: number };
  lutador: WorldBossLutadorApi;
  poderes: WorldBossPoderApi[];
  cooldowns: WorldBossCooldownsApi;
  // "Turno" pessoal contra a Ameaça Mundial (bug relatado: dava pra
  // apertar ataque/poder em sequência imediata, sem o intervalo que
  // Aventura/Boss da Guilda sempre têm entre ações) — ms restantes até
  // a PRÓXIMA ação do jogador valer; ausente em respostas antigas
  // (compatibilidade), tratado como 0 nesse caso.
  proxima_acao_jogador_em_ms?: number;
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
  nomeAcao: string | null;
  dano: number;
  esquivou: boolean;
  // Precisão/Crítico (Velocidade) — ausente em respostas antigas
  // (compatibilidade), tratado como false nesse caso.
  critico?: boolean;
  cura: number;
  manaCurada: number;
  golpeFinal: boolean;
  morreuAoFimDoTurno?: boolean;
  bloqueado?: boolean;
  motivoBloqueio?: string;
  cooldowns: WorldBossCooldownsApi;
  // Mesmo "turno" pessoal de WorldBossEntrarResultado — ms restantes
  // até a PRÓXIMA ação valer, já contando a que acabou de ser feita.
  proxima_acao_jogador_em_ms?: number;
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
