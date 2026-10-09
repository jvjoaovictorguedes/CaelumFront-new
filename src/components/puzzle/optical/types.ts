// Evento "O Coração da Máquina Celestial" — Fase 5 (Óptica). Tipos
// espelhando o feedbackPublico do engine óptico do CaelumBack-new
// (src/services/puzzleOpticalComponents.js) — duplicados de propósito
// (repos separados). Nunca inclui segredo/golden solution.
export type Canal = "BRANCO" | "VERMELHO" | "VERDE" | "AZUL" | null;

export interface PosicaoComponente {
  x: number;
  y: number;
}

export type TipoComponenteOptico = "EMITTER" | "MIRROR" | "PRISM" | "LENS" | "SHUTTER" | "RECEIVER";

export interface ComponenteOpticoConfig {
  id: string;
  type: TipoComponenteOptico;
  props?: Record<string, unknown>;
  position: PosicaoComponente;
}

export interface ConexaoOpticaConfig {
  id: string;
  from: { componentId: string; port: string };
  to: { componentId: string; port: string };
}

export interface PuzzleOpticoConfig {
  components: ComponenteOpticoConfig[];
  connections: ConexaoOpticaConfig[];
}

export interface EmissorFeedback {
  ligado: boolean;
  intensidade: number;
  cor: Canal;
}
export interface EspelhoFeedback {
  refletindo: boolean;
  intensidade: number;
  cor: Canal;
}
export interface PrismaFeedback {
  intensidade: number;
  cor: Canal;
}
export interface LenteFeedback {
  intensidade: number;
  cor: Canal;
  fator: number;
}
export interface ObturadorFeedback {
  aberto: boolean;
  intensidade: number;
  cor: Canal;
}
export interface ReceptorFeedback {
  intensidade: number;
  cor: Canal;
  atingido: boolean;
}

export type ComponenteOpticoFeedback = EmissorFeedback | EspelhoFeedback | PrismaFeedback | LenteFeedback | ObturadorFeedback | ReceptorFeedback;

export interface PuzzleOpticoEstadoPublico {
  components: Record<string, ComponenteOpticoFeedback>;
  objetivosConcluidos: string[];
}

export interface PuzzleOpticoAcao {
  type: string;
  componentId?: string;
  payload?: Record<string, unknown>;
}
