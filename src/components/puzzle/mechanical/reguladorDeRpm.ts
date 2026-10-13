// "O Coração da Máquina Celestial" — evolução "RPM ajustável" (Regulador
// do Eixo Mestre). Decisões PURAS (sem React/DOM/rede) de como o
// regulador de RPM se comporta e como a ressonância do OUTPUT é
// apresentada — mesmo princípio de src/hooks/eventPuzzleSalaEstado.ts:
// causa raiz isolada numa função testável sem montar nenhum componente.
// MechanicalPuzzleScene.tsx chama EXATAMENTE estas funções, nunca uma
// reimplementação paralela só pro teste.
import type { MotorFeedback, MotorFeedbackAjustavel, RessonanciaSaida } from "./types";

// Decide se o MOTOR deste feedback deve mostrar o regulador — nunca
// inferido de nenhum outro campo (ex.: "tem rpm > 0 então é
// ajustável" seria errado: um motor LEGADO ligado também tem rpm > 0).
export function motorEhAjustavel(fb: MotorFeedback): fb is MotorFeedbackAjustavel {
  return fb.ajustavel === true;
}

// Arredonda pro STEP mais próximo dentro de [min,max] — usado tanto
// pelo input numérico (digitação livre) quanto como garantia final
// antes de disparar a ação (nunca manda um valor fora de passo pro
// backend, mesmo que o <input type="number"> deixe passar algo digitado
// à mão fora do `step` do HTML, que é só uma dica visual pro browser,
// não uma validação real).
export function arredondarAoStep(valor: number, min: number, max: number, step: number): number {
  const clampado = Math.min(Math.max(valor, min), max);
  const passos = Math.round((clampado - min) / step);
  const resultado = min + passos * step;
  return Math.min(Math.max(resultado, min), max);
}

export function incrementar(rpmAtual: number, min: number, max: number, step: number): number {
  return arredondarAoStep(rpmAtual + step, min, max, step);
}

export function decrementar(rpmAtual: number, min: number, max: number, step: number): number {
  return arredondarAoStep(rpmAtual - step, min, max, step);
}

// Parser do <input type="number"> — nunca aceita float/NaN/string
// vazia; devolve `null` quando a digitação ainda não é um rpm válido
// (ex.: campo vazio, "-", "12.5"), pra quem chama decidir manter o
// valor anterior em vez de disparar uma ação com lixo.
export function interpretarDigitacaoDeRpm(texto: string, min: number, max: number, step: number): number | null {
  if (texto.trim() === "") return null;
  const numero = Number(texto);
  if (!Number.isInteger(numero)) return null;
  return arredondarAoStep(numero, min, max, step);
}

// Apresentação qualitativa da ressonância (seção 8/10 da encomenda) —
// NUNCA deriva nem mostra o valor-alvo; só traduz o enum que o
// servidor já calculou pra cor/texto/intensidade de pulso.
export interface ApresentacaoRessonancia {
  rotulo: string;
  pulsar: boolean;
}
const APRESENTACAO_RESSONANCIA: Record<RessonanciaSaida, ApresentacaoRessonancia> = {
  SEM_RESONANCIA: { rotulo: "sem ressonância", pulsar: false },
  FRACA: { rotulo: "ressonância fraca", pulsar: false },
  PROXIMA: { rotulo: "ressonância próxima", pulsar: false },
  ESTAVEL: { rotulo: "ressonância estável", pulsar: true },
};
export function apresentarRessonancia(ressonancia: RessonanciaSaida): ApresentacaoRessonancia {
  return APRESENTACAO_RESSONANCIA[ressonancia];
}
