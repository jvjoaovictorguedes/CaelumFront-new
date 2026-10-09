// Evento "O Coração da Máquina Celestial" — Fase 6 (Hidráulica). Tipos
// espelhando o feedbackPublico do engine hidráulico do CaelumBack-new
// (src/services/puzzleHydraulicComponents.js) — duplicados de
// propósito (repos separados). Nunca inclui segredo/golden solution.
export interface PosicaoComponente {
  x: number;
  y: number;
}

export type TipoComponenteHidraulico = "PUMP" | "PIPE" | "VALVE" | "PRESSURE_NODE" | "RESERVOIR" | "TURBINE";

export interface ComponenteHidraulicoConfig {
  id: string;
  type: TipoComponenteHidraulico;
  props?: Record<string, unknown>;
  position: PosicaoComponente;
}

export interface ConexaoHidraulicaConfig {
  id: string;
  from: { componentId: string; port: string };
  to: { componentId: string; port: string };
}

export interface PuzzleHidraulicoConfig {
  components: ComponenteHidraulicoConfig[];
  connections: ConexaoHidraulicaConfig[];
}

export interface BombaFeedback {
  ligada: boolean;
  vazao: number;
}
export interface CanoFeedback {
  vazao: number;
  sobrecarregado: boolean;
  vazaoMaxima: number;
}
export interface ValvulaFeedback {
  aberta: boolean;
  vazao: number;
}
export interface NoDePressaoFeedback {
  vazao: number;
  pressao: number;
}
export interface ReservatorioFeedback {
  nivel: number;
  transbordando: boolean;
  capacidade: number;
}
export interface TurbinaFeedback {
  vazao: number;
  atingido: boolean;
}

export type ComponenteHidraulicoFeedback = BombaFeedback | CanoFeedback | ValvulaFeedback | NoDePressaoFeedback | ReservatorioFeedback | TurbinaFeedback;

export interface PuzzleHidraulicoEstadoPublico {
  components: Record<string, ComponenteHidraulicoFeedback>;
  objetivosConcluidos: string[];
}

export interface PuzzleHidraulicoAcao {
  type: string;
  componentId?: string;
  payload?: Record<string, unknown>;
}
