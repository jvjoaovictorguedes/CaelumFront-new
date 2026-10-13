import test from "node:test";
import assert from "node:assert/strict";
import {
  motorEhAjustavel,
  arredondarAoStep,
  incrementar,
  decrementar,
  interpretarDigitacaoDeRpm,
  apresentarRessonancia,
} from "../src/components/puzzle/mechanical/reguladorDeRpm.ts";

// Evolução "RPM ajustável" (Regulador do Eixo Mestre). Decisão PURA
// (sem React/DOM/rede) — mesmo princípio de eventPuzzleSalaEstado.ts:
// causa raiz isolada numa função testável sem montar nenhum componente.
// MechanicalPuzzleScene.tsx chama EXATAMENTE estas funções.

// ----------------------------- motorEhAjustavel -----------------------

test("motor ajustável (ajustavel:true) é reconhecido; motor legado nunca é", () => {
  assert.equal(motorEhAjustavel({ ligado: false, rpm: 0, sentido: null, ajustavel: true, rpmConfigurado: 100, rpmMin: 60, rpmMax: 240, rpmStep: 10 }), true);
  assert.equal(motorEhAjustavel({ ligado: false, rpm: 0, sentido: null }), false);
});

// ----------------------------- arredondarAoStep/incrementar/decrementar

test("arredondarAoStep: clampa ao range e arredonda pro step mais próximo a partir de min", () => {
  assert.equal(arredondarAoStep(100, 60, 240, 10), 100);
  assert.equal(arredondarAoStep(105, 60, 240, 10), 110); // exatamente no meio — Math.round arredonda pra cima
  assert.equal(arredondarAoStep(50, 60, 240, 10), 60); // abaixo do min -> clampa
  assert.equal(arredondarAoStep(300, 60, 240, 10), 240); // acima do max -> clampa
});

test("+ incrementa exatamente por `step`, nunca passa de rpmMax", () => {
  assert.equal(incrementar(100, 60, 240, 10), 110);
  assert.equal(incrementar(240, 60, 240, 10), 240, "já no máximo, incrementar nunca passa do limite");
  assert.equal(incrementar(235, 60, 240, 10), 240, "arredonda pro step mais próximo dentro do limite");
});

test("- decrementa exatamente por `step`, nunca passa abaixo de rpmMin", () => {
  assert.equal(decrementar(100, 60, 240, 10), 90);
  assert.equal(decrementar(60, 60, 240, 10), 60, "já no mínimo, decrementar nunca passa do limite");
});

test("toda a faixa min..max de step em step é alcançável incrementando repetidamente", () => {
  let rpm = 60;
  const vistos = [rpm];
  for (let i = 0; i < 18; i++) {
    rpm = incrementar(rpm, 60, 240, 10);
    vistos.push(rpm);
  }
  assert.deepEqual(vistos, Array.from({ length: 19 }, (_, i) => 60 + i * 10));
});

// ----------------------------- interpretarDigitacaoDeRpm ---------------

test("interpretarDigitacaoDeRpm: aceita inteiro válido, rejeita float/vazio/não-numérico (devolve null)", () => {
  assert.equal(interpretarDigitacaoDeRpm("150", 60, 240, 10), 150);
  assert.equal(interpretarDigitacaoDeRpm("", 60, 240, 10), null, "campo vazio nunca dispara ação");
  assert.equal(interpretarDigitacaoDeRpm("100.5", 60, 240, 10), null, "float nunca é aceito — motor não tem RPM fracionário");
  assert.equal(interpretarDigitacaoDeRpm("abc", 60, 240, 10), null);
  assert.equal(interpretarDigitacaoDeRpm("-10", 60, 240, 10), 60, "negativo é um inteiro válido, mas clampa ao mínimo");
});

test("interpretarDigitacaoDeRpm: nunca deixa passar um valor fora do passo — sempre arredonda", () => {
  assert.equal(interpretarDigitacaoDeRpm("155", 60, 240, 10), 160, "155 arredonda pro step mais próximo (160, não 150, por Math.round)");
  assert.equal(interpretarDigitacaoDeRpm("241", 60, 240, 10), 240, "acima do máximo digitado à mão ainda clampa");
});

// ----------------------------- apresentarRessonancia -------------------

test("apresentarRessonancia: ESTAVEL pulsa; as outras 3 nunca pulsam", () => {
  assert.equal(apresentarRessonancia("ESTAVEL").pulsar, true);
  assert.equal(apresentarRessonancia("PROXIMA").pulsar, false);
  assert.equal(apresentarRessonancia("FRACA").pulsar, false);
  assert.equal(apresentarRessonancia("SEM_RESONANCIA").pulsar, false);
});

test("apresentarRessonancia: rótulo nunca contém um número (nunca revela o valor-alvo por acidente)", () => {
  for (const r of ["SEM_RESONANCIA", "FRACA", "PROXIMA", "ESTAVEL"]) {
    const { rotulo } = apresentarRessonancia(r);
    assert.ok(!/\d/.test(rotulo), `rótulo de ${r} não deveria conter dígitos: "${rotulo}"`);
  }
});
