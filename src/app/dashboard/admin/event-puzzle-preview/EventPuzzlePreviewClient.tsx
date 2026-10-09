"use client";
import { useState } from "react";
import MechanicalPuzzleScene from "@/components/puzzle/mechanical/MechanicalPuzzleScene";
import type { PuzzleMecanicoConfig, PuzzleMecanicoEstadoPublico } from "@/components/puzzle/mechanical/types";

// Mesma topologia pública da fixture "Câmara das Engrenagens" do
// backend (CaelumBack-new test/puzzleMechanicalComponents.test.js) —
// só id/type/props/connections (dado público, nunca a golden
// solution). `position` é dado de layout do Admin (Fase 15), aqui
// fixo só pra este preview.
const CONFIG: PuzzleMecanicoConfig = {
  components: [
    { id: "motor1", type: "MOTOR", props: { rpmNominal: 120, sentido: "CW" }, position: { x: 90, y: 180 } },
    { id: "gear1", type: "GEAR", props: { dentes: 20 }, position: { x: 230, y: 180 } },
    { id: "gear2", type: "GEAR", props: { dentes: 40 }, position: { x: 380, y: 180 } },
    { id: "clutch1", type: "CLUTCH", props: {}, position: { x: 520, y: 180 } },
    { id: "output1", type: "OUTPUT", props: { rpmAlvo: 60, sentidoAlvo: "CCW" }, position: { x: 650, y: 180 } },
    { id: "lever1", type: "LEVER", props: {}, position: { x: 380, y: 320 } },
  ],
  connections: [
    { id: "c1", from: { componentId: "motor1", port: "out" }, to: { componentId: "gear1", port: "in" } },
    { id: "c2", from: { componentId: "gear1", port: "out" }, to: { componentId: "gear2", port: "in" } },
    { id: "c3", from: { componentId: "gear2", port: "out" }, to: { componentId: "clutch1", port: "in" } },
    { id: "c4", from: { componentId: "clutch1", port: "out" }, to: { componentId: "output1", port: "in" } },
  ],
};

// Os 4 instantâneos abaixo são exatamente os valores provados pelos
// testes do engine (determinismo: GEAR→GEAR inverte e escala por
// dentes, CLUTCH desengatada corta a transmissão) — nunca recalculados
// aqui. Isso é intencional: o frontend NUNCA reimplementa a física do
// puzzle, só ilustra os instantâneos que o servidor real vai mandar a
// partir da Fase 8.
const PASSOS: { titulo: string; estado: PuzzleMecanicoEstadoPublico }[] = [
  {
    titulo: "1. Estado inicial — tudo parado",
    estado: {
      components: {
        motor1: { ligado: false, rpm: 0, sentido: null },
        gear1: { rpm: 0, sentido: null, dentes: 20 },
        gear2: { rpm: 0, sentido: null, dentes: 40 },
        clutch1: { engatada: false, rpm: 0, sentido: null },
        output1: { rpm: 0, sentido: null, atingido: false },
        lever1: { acionada: false },
      },
      objetivosConcluidos: [],
    },
  },
  {
    titulo: "2. Motor ligado — engrenagens girando, embreagem ainda corta a saída",
    estado: {
      components: {
        motor1: { ligado: true, rpm: 120, sentido: "CW" },
        gear1: { rpm: 120, sentido: "CW", dentes: 20 },
        gear2: { rpm: 60, sentido: "CCW", dentes: 40 },
        clutch1: { engatada: false, rpm: 0, sentido: null },
        output1: { rpm: 0, sentido: null, atingido: false },
        lever1: { acionada: false },
      },
      objetivosConcluidos: [],
    },
  },
  {
    titulo: "3. Embreagem engatada — saída atinge o alvo (60 rpm CCW)",
    estado: {
      components: {
        motor1: { ligado: true, rpm: 120, sentido: "CW" },
        gear1: { rpm: 120, sentido: "CW", dentes: 20 },
        gear2: { rpm: 60, sentido: "CCW", dentes: 40 },
        clutch1: { engatada: true, rpm: 60, sentido: "CCW" },
        output1: { rpm: 60, sentido: "CCW", atingido: true },
        lever1: { acionada: false },
      },
      objetivosConcluidos: ["obj_rotacao"],
    },
  },
  {
    titulo: "4. Alavanca cerimonial acionada — os dois objetivos concluídos",
    estado: {
      components: {
        motor1: { ligado: true, rpm: 120, sentido: "CW" },
        gear1: { rpm: 120, sentido: "CW", dentes: 20 },
        gear2: { rpm: 60, sentido: "CCW", dentes: 40 },
        clutch1: { engatada: true, rpm: 60, sentido: "CCW" },
        output1: { rpm: 60, sentido: "CCW", atingido: true },
        lever1: { acionada: true },
      },
      objetivosConcluidos: ["obj_rotacao", "obj_alavanca"],
    },
  },
];

export default function EventPuzzlePreviewClient() {
  const [passo, setPasso] = useState(0);
  const atual = PASSOS[passo];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-[#F3B43F]/40 bg-[#292018]/80 p-4">
        <h1 className="font-imFeel text-2xl text-[#F3B43F]">Oficina dos Eixos — preview do renderer mecânico</h1>
        <p className="mt-1 text-sm text-white/70">
          Protótipo visual da Fase 4 (SVG procedural, sem backend ainda). Avance os instantâneos pra ver as regras de engrenagem/embreagem/alavanca
          sendo representadas — o estado real virá do servidor a partir da Fase 8.
        </p>
      </div>

      <div className="rounded-lg border border-[#F3B43F]/40 bg-[#292018]/80 p-4">
        <MechanicalPuzzleScene config={CONFIG} estado={atual.estado} onAction={() => setPasso((p) => Math.min(p + 1, PASSOS.length - 1))} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#F3B43F]/40 bg-[#292018]/80 p-4">
        <p className="font-imFeel text-lg text-white/90">{atual.titulo}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPasso(0)}
            className="rounded border border-white/20 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
          >
            Reiniciar
          </button>
          <button
            type="button"
            disabled={passo >= PASSOS.length - 1}
            onClick={() => setPasso((p) => Math.min(p + 1, PASSOS.length - 1))}
            className="rounded bg-[#BC8418] px-3 py-1.5 text-sm font-semibold text-black hover:bg-[#a5710f] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Próximo passo
          </button>
        </div>
      </div>
    </div>
  );
}
