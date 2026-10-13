import test from "node:test";
import assert from "node:assert/strict";
import {
  decidirEstadoVisualDaSala,
  classificarObjetivoVisual,
  textoVisivelDoObjetivo,
} from "../src/hooks/eventPuzzleSalaEstado.ts";

// Correção de lifecycle/UX ("sala concluída recomeça"). Decisão PURA
// (sem React/DOM/rede) — mesmo princípio de
// src/hooks/realtime/templebossEntrada.ts: causa raiz isolada numa
// função testável sem montar nenhum componente. A UI real
// (EventPuzzleSalasPanel/RoomClient) chama EXATAMENTE estas funções —
// nunca uma reimplementação paralela só pro teste.

// ----------------------------- decidirEstadoVisualDaSala -----------------

test("bloqueada → mostra estado BLOQUEADA, nunca clicável, nunca 'Entrar'", () => {
  const decisao = decidirEstadoVisualDaSala({ bloqueado: true, concluido: false, em_andamento: false, replayable: false });
  assert.equal(decisao.estado, "BLOQUEADA");
  assert.equal(decisao.rotulo, "Bloqueada");
  assert.equal(decisao.clicavel, false);
  assert.equal(decisao.mostrarEntrarNormal, false);
});

test("disponível (nunca concluída, sem tentativa ativa) → mostra 'Entrar'", () => {
  const decisao = decidirEstadoVisualDaSala({ bloqueado: false, concluido: false, em_andamento: false, replayable: false });
  assert.equal(decisao.estado, "DISPONIVEL");
  assert.equal(decisao.rotulo, "Entrar");
  assert.equal(decisao.clicavel, true);
  assert.equal(decisao.mostrarEntrarNormal, true);
});

test("em andamento (CREATED/ACTIVE existente) → mostra 'Continuar', nunca 'Entrar'", () => {
  const decisao = decidirEstadoVisualDaSala({ bloqueado: false, concluido: false, em_andamento: true, replayable: false });
  assert.equal(decisao.estado, "EM_ANDAMENTO");
  assert.equal(decisao.rotulo, "Continuar");
  assert.equal(decisao.clicavel, true);
  assert.equal(decisao.mostrarEntrarNormal, false);
});

test("concluída → mostra '✓ Concluído'", () => {
  const decisao = decidirEstadoVisualDaSala({ bloqueado: false, concluido: true, em_andamento: false, replayable: false });
  assert.equal(decisao.estado, "CONCLUIDA");
  assert.equal(decisao.rotulo, "✓ Concluído");
});

test("concluída + não replayable → NUNCA mostra 'Entrar' normal, nunca mostra 'Refazer'", () => {
  const decisao = decidirEstadoVisualDaSala({ bloqueado: false, concluido: true, em_andamento: false, replayable: false });
  assert.equal(decisao.mostrarEntrarNormal, false);
  assert.equal(decisao.mostrarRefazer, false);
});

test("concluída + replayable=true → ainda nunca mostra 'Entrar' normal, mas oferece a ação SECUNDÁRIA 'Refazer'", () => {
  const decisao = decidirEstadoVisualDaSala({ bloqueado: false, concluido: true, em_andamento: false, replayable: true });
  assert.equal(decisao.mostrarEntrarNormal, false, "replay nunca reaproveita o botão normal de Entrar");
  assert.equal(decisao.mostrarRefazer, true);
});

test("prioridade visual: bloqueado vence sobre concluido/em_andamento, mesmo se ambos vierem true por algum dado de borda", () => {
  const decisao = decidirEstadoVisualDaSala({ bloqueado: true, concluido: true, em_andamento: true, replayable: true });
  assert.equal(decisao.estado, "BLOQUEADA", "bloqueado é a prioridade MÁXIMA — nunca mostra concluído/em andamento por engano");
});

test("prioridade visual: concluido vence sobre em_andamento (uma sala concluída nunca aparece como 'em andamento')", () => {
  const decisao = decidirEstadoVisualDaSala({ bloqueado: false, concluido: true, em_andamento: true, replayable: false });
  assert.equal(decisao.estado, "CONCLUIDA");
});

// ----------------------------- objectives progressivos --------------------

test("objective concluído é classificado CONCLUIDO e mostra a própria descrição (marcado/check)", () => {
  const o = { id: "obj1", descricao: "Descrição real", concluido: true, atual: false };
  assert.equal(classificarObjetivoVisual(o), "CONCLUIDO");
  assert.equal(textoVisivelDoObjetivo(o), "Descrição real");
});

test("objective atual é classificado ATUAL e mostra a própria descrição", () => {
  const o = { id: "obj2", descricao: "Descrição do atual", concluido: false, atual: true };
  assert.equal(classificarObjetivoVisual(o), "ATUAL");
  assert.equal(textoVisivelDoObjetivo(o), "Descrição do atual");
});

test("objective futuro é classificado FUTURO e NUNCA mostra descrição — sempre '???', mesmo que `descricao` venha preenchida por engano", () => {
  const futuroSemDescricao = { id: "obj3", concluido: false, atual: false };
  assert.equal(classificarObjetivoVisual(futuroSemDescricao), "FUTURO");
  assert.equal(textoVisivelDoObjetivo(futuroSemDescricao), "???");

  const futuroComDescricaoPorEngano = { id: "obj4", descricao: "NUNCA deveria aparecer", concluido: false, atual: false };
  assert.equal(textoVisivelDoObjetivo(futuroComDescricaoPorEngano), "???", "mesmo com `descricao` presente, objective futuro nunca a exibe");
});

test("sequência de conclusão: ao concluir um objective, o próximo vira atual (via a própria classificação, nunca estado React)", () => {
  // Simula a projeção que o backend devolveria em 3 momentos
  // diferentes da MESMA sala (2 objectives) — a UI só classifica o que
  // chegou, nunca decide sozinha quem é "o próximo".
  const antes = [
    { id: "obj1", descricao: "Primeiro", concluido: false, atual: true },
    { id: "obj2", concluido: false, atual: false },
  ];
  assert.deepEqual(antes.map(classificarObjetivoVisual), ["ATUAL", "FUTURO"]);

  const depoisDoPrimeiro = [
    { id: "obj1", descricao: "Primeiro", concluido: true, atual: false },
    { id: "obj2", descricao: "Segundo", concluido: false, atual: true },
  ];
  assert.deepEqual(depoisDoPrimeiro.map(classificarObjetivoVisual), ["CONCLUIDO", "ATUAL"]);
  assert.equal(textoVisivelDoObjetivo(depoisDoPrimeiro[1]), "Segundo", "o 2º, agora atual, revela a própria descrição");

  const todosConcluidos = [
    { id: "obj1", descricao: "Primeiro", concluido: true, atual: false },
    { id: "obj2", descricao: "Segundo", concluido: true, atual: false },
  ];
  assert.ok(todosConcluidos.every((o) => classificarObjetivoVisual(o) === "CONCLUIDO"), "ao concluir o último, todos ficam CONCLUIDO (feedback de câmara concluída)");
});
