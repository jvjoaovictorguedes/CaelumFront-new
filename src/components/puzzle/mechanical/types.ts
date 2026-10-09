// Evento "O Coração da Máquina Celestial" — Fase 4 (Renderização
// Procedural Mecânica). Tipos espelhando o feedbackPublico produzido
// pelo engine do CaelumBack-new (src/services/puzzleMechanicalComponents.js
// + puzzleEngineCore.js) — duplicados de propósito (repos separados,
// nunca compartilham código em runtime). Nunca inclui segredo/golden
// solution: só o que o backend já expõe em `state.public`.
export type Sentido = "CW" | "CCW" | null;

export interface PosicaoComponente {
  x: number;
  y: number;
}

export type TipoComponenteMecanico = "MOTOR" | "SHAFT" | "GEAR" | "PULLEY" | "LEVER" | "CLUTCH" | "OUTPUT";

// Layout (posição) é dado puro de apresentação, autorado pelo Admin no
// Puzzle Builder (Fase 15) — vive ao lado de `props` no mesmo objeto de
// componente do config, mas o engine do backend nunca lê/valida este
// campo (puzzleEngineCore.validarConfig só olha id/type/props).
export interface ComponenteMecanicoConfig {
  id: string;
  type: TipoComponenteMecanico;
  props?: Record<string, unknown>;
  position: PosicaoComponente;
}

export interface ConexaoMecanicaConfig {
  id: string;
  from: { componentId: string; port: string };
  to: { componentId: string; port: string };
}

export interface PuzzleMecanicoConfig {
  components: ComponenteMecanicoConfig[];
  connections: ConexaoMecanicaConfig[];
}

export interface MotorFeedback {
  ligado: boolean;
  rpm: number;
  sentido: Sentido;
}
export interface EixoFeedback {
  rpm: number;
  sentido: Sentido;
}
export interface EngrenagemFeedback {
  rpm: number;
  sentido: Sentido;
  dentes: number;
}
export interface PoliaFeedback {
  rpm: number;
  sentido: Sentido;
  raio: number;
}
export interface AlavancaFeedback {
  acionada: boolean;
}
export interface EmbreagemFeedback {
  engatada: boolean;
  rpm: number;
  sentido: Sentido;
}
export interface SaidaFeedback {
  rpm: number;
  sentido: Sentido;
  atingido: boolean;
}

export type ComponenteFeedback =
  | MotorFeedback
  | EixoFeedback
  | EngrenagemFeedback
  | PoliaFeedback
  | AlavancaFeedback
  | EmbreagemFeedback
  | SaidaFeedback;

export interface PuzzleMecanicoEstadoPublico {
  components: Record<string, ComponenteFeedback>;
  objetivosConcluidos: string[];
}

// Mesmo shape de PuzzleAction no backend (puzzleEngineCore.js) — quem
// consome este componente (Fase 8) manda isso pro endpoint de ação.
export interface PuzzleMecanicoAcao {
  type: string;
  componentId?: string;
  payload?: Record<string, unknown>;
}
