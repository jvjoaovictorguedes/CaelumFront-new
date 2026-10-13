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

// Evolução "RPM ajustável" — motor LEGADO (sem `ajustavel`) continua
// com o shape de sempre (ligado/rpm/sentido); motor AJUSTÁVEL ganha
// `ajustavel:true` + os limites do regulador (rpmMin/rpmMax/rpmStep) e
// `rpmConfigurado` (o valor "guardado", mesmo desligado) — nunca
// segredo, o jogador PRECISA desses números pra operar o controle.
export interface MotorFeedbackLegado {
  ligado: boolean;
  rpm: number;
  sentido: Sentido;
  ajustavel?: false;
}
export interface MotorFeedbackAjustavel {
  ligado: boolean;
  rpm: number;
  sentido: Sentido;
  ajustavel: true;
  rpmConfigurado: number;
  rpmMin: number;
  rpmMax: number;
  rpmStep: number;
}
export type MotorFeedback = MotorFeedbackLegado | MotorFeedbackAjustavel;
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
// Evolução "esconder targets do jogador" — `atingido` (boolean cru)
// NUNCA mais atravessa o backend; só a classificação qualitativa de
// ressonância abaixo, que já chega pronta (o cliente nunca precisa do
// valor-alvo pra decidir a cor/texto).
export type RessonanciaSaida = "SEM_RESONANCIA" | "FRACA" | "PROXIMA" | "ESTAVEL";
export interface SaidaFeedback {
  rpm: number;
  sentido: Sentido;
  ressonancia: RessonanciaSaida;
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
