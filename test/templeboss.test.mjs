import test from "node:test";
import assert from "node:assert/strict";
import {
  podeIniciarEntradaGuardiao,
  MENSAGEM_REALTIME_INDISPONIVEL_GUARDIAO,
} from "../src/hooks/realtime/templebossEntrada.ts";

// Bug reportado ("clico em Enfrentar o Guardião e a batalha não inicia"):
// a causa raiz era permitir templeboss:entrar antes do ack de
// TRANSPORT.IDENTIFY. Estes testes cobrem só a decisão pura (sem socket).

test("bloqueia e explica quando o realtime ainda não identificou (socket.connected !== identificado)", () => {
  const decisao = podeIniciarEntradaGuardiao({ realtimeReady: false, entrando: false });
  assert.equal(decisao.podeEntrar, false);
  assert.equal(decisao.motivoBloqueio, MENSAGEM_REALTIME_INDISPONIVEL_GUARDIAO);
});

test("bloqueia silenciosamente um segundo clique enquanto já existe uma entrada em voo", () => {
  const decisao = podeIniciarEntradaGuardiao({ realtimeReady: true, entrando: true });
  assert.equal(decisao.podeEntrar, false);
  assert.equal(decisao.motivoBloqueio, undefined);
});

test("permite entrar só quando identificado e sem entrada em voo", () => {
  const decisao = podeIniciarEntradaGuardiao({ realtimeReady: true, entrando: false });
  assert.deepEqual(decisao, { podeEntrar: true });
});

test("entrando em voo tem prioridade sobre o realtime não pronto (nunca dispara dois timeouts)", () => {
  const decisao = podeIniciarEntradaGuardiao({ realtimeReady: false, entrando: true });
  assert.equal(decisao.podeEntrar, false);
  assert.equal(decisao.motivoBloqueio, undefined);
});
