import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SOCKET_EVENTS } from "../src/types/contracts/socketEvents.ts";
import { combatContracts } from "./fixtures/combat-contracts.ts";

test("frontend event constants match fixtures exported by backend serializers", () => {
  assert.deepEqual(SOCKET_EVENTS, combatContracts.events);
  const json = JSON.parse(
    readFileSync(
      new URL("./fixtures/combat-contracts.json", import.meta.url),
      "utf8",
    ),
  );
  assert.deepEqual(combatContracts, json);
});

test("fixtures retain slots, current resources, ranked IA and party resync order", () => {
  assert.equal(combatContracts.casual.poderesA[0].combat_slot, 4);
  assert.equal(combatContracts.casual.vidaA, 70);
  assert.equal(combatContracts.ranked.b.controladoPorIA, true);
  assert.equal(combatContracts.ranked.resync, true);
  assert.deepEqual(combatContracts.ranked.consumiveisA, []);
  assert.equal(combatContracts.rating.ratingDefensorInalterado, 1050);
  assert.deepEqual(combatContracts.party.ordem, ["2", "1"]);
  assert.equal(combatContracts.party.turnoDe, "1");
  assert.equal(combatContracts.turn.turnoDe, "B");
  assert.deepEqual(combatContracts.end.vencedor, { id: 1, nome: "Herói 1" });
});
