import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { appendTurn, mergeTournamentSeries, addGuildBossMember } from "../src/hooks/realtime/reducers.ts";
import { createListenerScope } from "../src/hooks/realtime/listenerScope.ts";

test("history retains received order without mutating previous state", () => {
  const original = [{ duelId: 3, dano: 5 }];
  const next = appendTurn(original, { duelId: 3, dano: 7 });
  assert.equal(original.length, 1);
  assert.deepEqual(next.map((turn) => turn.dano), [5, 7]);
});

test("tournament updates merge only into the matching series", () => {
  const initial = { serieId: 1, readyA: true, placar: { a: 0, b: 0 } };
  const merged = mergeTournamentSeries(initial, { serieId: 1, placar: { a: 1 } });
  assert.equal(merged.readyA, true);
  assert.equal(initial.placar.a, 0);
  assert.deepEqual(merged.placar, { a: 1 });
  const other = { serieId: 2, placar: { a: 0 } };
  assert.equal(mergeTournamentSeries(initial, other), other);
});

test("guild boss ignores another battle and duplicate member notifications", () => {
  const initial = { battleId: 1, membros: [{ id: 10 }], ordem: ["10"] };
  assert.equal(addGuildBossMember(initial, { battleId: 2, membro: { id: 11 }, ordem: [] }), initial);
  assert.equal(addGuildBossMember(initial, { battleId: 1, membro: { id: 10 }, ordem: [] }), initial);
  const next = addGuildBossMember(initial, { battleId: 1, membro: { id: 11 }, ordem: ["10", "11"] });
  assert.deepEqual(next.membros.map((m) => m.id), [10, 11]);
  assert.equal(initial.membros.length, 1);
  assert.equal(addGuildBossMember(null, { battleId: 1, membro: { id: 11 }, ordem: [] }), null);
});

test("domain cleanup removes its exact handlers and preserves other consumers", () => {
  const socket = new EventEmitter();
  const first = createListenerScope(socket);
  const second = createListenerScope(socket);
  let a = 0;
  let b = 0;
  first.on("party:turno-resultado", () => a++);
  second.on("party:turno-resultado", () => b++);
  socket.emit("party:turno-resultado");
  first.dispose();
  first.dispose();
  socket.emit("party:turno-resultado");
  assert.equal(a, 1);
  assert.equal(b, 2);
  assert.equal(socket.listenerCount("party:turno-resultado"), 1);
  second.dispose();
  assert.equal(socket.listenerCount("party:turno-resultado"), 0);
});
