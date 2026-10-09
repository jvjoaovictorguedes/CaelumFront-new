"use client";
import { useState } from "react";
import MechanicalPuzzleScene from "@/components/puzzle/mechanical/MechanicalPuzzleScene";
import type { PuzzleMecanicoConfig, PuzzleMecanicoEstadoPublico } from "@/components/puzzle/mechanical/types";
import OpticalPuzzleScene from "@/components/puzzle/optical/OpticalPuzzleScene";
import type { PuzzleOpticoConfig, PuzzleOpticoEstadoPublico } from "@/components/puzzle/optical/types";
import HydraulicPuzzleScene from "@/components/puzzle/hydraulic/HydraulicPuzzleScene";
import type { PuzzleHidraulicoConfig, PuzzleHidraulicoEstadoPublico } from "@/components/puzzle/hydraulic/types";

// Mesma topologia pública das fixtures canônicas do backend (nunca a
// golden solution): "Câmara das Engrenagens" (Fase 3,
// test/puzzleMechanicalComponents.test.js), "Observatório / Prisma da
// Aurora" (Fase 5, test/puzzleOpticalComponents.test.js) e "Sala das
// Marés" (Fase 6, test/puzzleHydraulicComponents.test.js). `position`
// é dado de layout do Admin (Fase 15), fixo aqui só pra este preview.
const CONFIG_MECANICO: PuzzleMecanicoConfig = {
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

const PASSOS_MECANICOS: { titulo: string; estado: PuzzleMecanicoEstadoPublico }[] = [
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

const CONFIG_OPTICO: PuzzleOpticoConfig = {
  components: [
    { id: "emitter1", type: "EMITTER", props: { intensidade: 100, cor: "BRANCO" }, position: { x: 90, y: 180 } },
    { id: "prism1", type: "PRISM", props: {}, position: { x: 230, y: 180 } },
    { id: "mirror1", type: "MIRROR", props: {}, position: { x: 370, y: 110 } },
    { id: "lens1", type: "LENS", props: { fator: 0.5 }, position: { x: 500, y: 110 } },
    { id: "shutter1", type: "SHUTTER", props: {}, position: { x: 630, y: 110 } },
    { id: "receiver1", type: "RECEIVER", props: { corAlvo: "VERMELHO", intensidadeAlvo: 50 }, position: { x: 760, y: 110 } },
    { id: "receiver2", type: "RECEIVER", props: { corAlvo: "VERDE", intensidadeAlvo: 100 }, position: { x: 370, y: 280 } },
  ],
  connections: [
    { id: "c1", from: { componentId: "emitter1", port: "out" }, to: { componentId: "prism1", port: "in" } },
    { id: "c2", from: { componentId: "prism1", port: "VERMELHO" }, to: { componentId: "mirror1", port: "in" } },
    { id: "c3", from: { componentId: "mirror1", port: "out" }, to: { componentId: "lens1", port: "in" } },
    { id: "c4", from: { componentId: "lens1", port: "out" }, to: { componentId: "shutter1", port: "in" } },
    { id: "c5", from: { componentId: "shutter1", port: "out" }, to: { componentId: "receiver1", port: "in" } },
    { id: "c6", from: { componentId: "prism1", port: "VERDE" }, to: { componentId: "receiver2", port: "in" } },
  ],
};

const PASSOS_OPTICOS: { titulo: string; estado: PuzzleOpticoEstadoPublico }[] = [
  {
    titulo: "1. Estado inicial — tudo apagado",
    estado: {
      components: {
        emitter1: { ligado: false, intensidade: 0, cor: null },
        prism1: { intensidade: 0, cor: null },
        mirror1: { refletindo: true, intensidade: 0, cor: null },
        lens1: { intensidade: 0, cor: null, fator: 0.5 },
        shutter1: { aberto: false, intensidade: 0, cor: null },
        receiver1: { intensidade: 0, cor: null, atingido: false },
        receiver2: { intensidade: 0, cor: null, atingido: false },
      },
      objetivosConcluidos: [],
    },
  },
  {
    titulo: "2. Emissor ligado — canal verde já atinge o receptor (sem gating); vermelho fica preso no obturador fechado",
    estado: {
      components: {
        emitter1: { ligado: true, intensidade: 100, cor: "BRANCO" },
        prism1: { intensidade: 100, cor: "BRANCO" },
        mirror1: { refletindo: true, intensidade: 100, cor: "VERMELHO" },
        lens1: { intensidade: 50, cor: "VERMELHO", fator: 0.5 },
        shutter1: { aberto: false, intensidade: 0, cor: null },
        receiver1: { intensidade: 0, cor: null, atingido: false },
        receiver2: { intensidade: 100, cor: "VERDE", atingido: true },
      },
      objetivosConcluidos: ["obj_verde"],
    },
  },
  {
    titulo: "3. Obturador aberto — canal vermelho (atenuado pela lente) também atinge o alvo",
    estado: {
      components: {
        emitter1: { ligado: true, intensidade: 100, cor: "BRANCO" },
        prism1: { intensidade: 100, cor: "BRANCO" },
        mirror1: { refletindo: true, intensidade: 100, cor: "VERMELHO" },
        lens1: { intensidade: 50, cor: "VERMELHO", fator: 0.5 },
        shutter1: { aberto: true, intensidade: 50, cor: "VERMELHO" },
        receiver1: { intensidade: 50, cor: "VERMELHO", atingido: true },
        receiver2: { intensidade: 100, cor: "VERDE", atingido: true },
      },
      objetivosConcluidos: ["obj_verde", "obj_vermelho"],
    },
  },
];

const CONFIG_HIDRAULICO: PuzzleHidraulicoConfig = {
  components: [
    { id: "pump1", type: "PUMP", props: { vazaoNominal: 100 }, position: { x: 90, y: 180 } },
    { id: "pipe1", type: "PIPE", props: { vazaoMaxima: 60 }, position: { x: 230, y: 180 } },
    { id: "valve1", type: "VALVE", props: {}, position: { x: 360, y: 180 } },
    { id: "pressure1", type: "PRESSURE_NODE", props: { fatorPressao: 2 }, position: { x: 490, y: 180 } },
    { id: "turbine1", type: "TURBINE", props: { vazaoAlvo: 60, toleranciaVazao: 0 }, position: { x: 620, y: 180 } },
    { id: "reservoir1", type: "RESERVOIR", props: { capacidade: 80 }, position: { x: 230, y: 320 } },
  ],
  connections: [
    { id: "c1", from: { componentId: "pump1", port: "out" }, to: { componentId: "pipe1", port: "in" } },
    { id: "c2", from: { componentId: "pipe1", port: "out" }, to: { componentId: "valve1", port: "in" } },
    { id: "c3", from: { componentId: "valve1", port: "out" }, to: { componentId: "pressure1", port: "in" } },
    { id: "c4", from: { componentId: "pressure1", port: "out" }, to: { componentId: "turbine1", port: "in" } },
    { id: "c5", from: { componentId: "pump1", port: "out2" }, to: { componentId: "reservoir1", port: "in" } },
  ],
};

const PASSOS_HIDRAULICOS: { titulo: string; estado: PuzzleHidraulicoEstadoPublico }[] = [
  {
    titulo: "1. Estado inicial — tudo parado",
    estado: {
      components: {
        pump1: { ligada: false, vazao: 0 },
        pipe1: { vazao: 0, sobrecarregado: false, vazaoMaxima: 60 },
        valve1: { aberta: false, vazao: 0 },
        pressure1: { vazao: 0, pressao: 0 },
        turbine1: { vazao: 0, atingido: false },
        reservoir1: { nivel: 0, transbordando: false, capacidade: 80 },
      },
      objetivosConcluidos: [],
    },
  },
  {
    titulo: "2. Bomba ligada — o cano limita a 60 (sobrecarregado) e o reservatório já transborda (direto, sem gating)",
    estado: {
      components: {
        pump1: { ligada: true, vazao: 100 },
        pipe1: { vazao: 60, sobrecarregado: true, vazaoMaxima: 60 },
        valve1: { aberta: false, vazao: 0 },
        pressure1: { vazao: 0, pressao: 0 },
        turbine1: { vazao: 0, atingido: false },
        reservoir1: { nivel: 80, transbordando: true, capacidade: 80 },
      },
      objetivosConcluidos: ["obj_transbordamento"],
    },
  },
  {
    titulo: "3. Válvula aberta — medidor deriva a pressão e a turbina atinge o alvo",
    estado: {
      components: {
        pump1: { ligada: true, vazao: 100 },
        pipe1: { vazao: 60, sobrecarregado: true, vazaoMaxima: 60 },
        valve1: { aberta: true, vazao: 60 },
        pressure1: { vazao: 60, pressao: 120 },
        turbine1: { vazao: 60, atingido: true },
        reservoir1: { nivel: 80, transbordando: true, capacidade: 80 },
      },
      objetivosConcluidos: ["obj_transbordamento", "obj_turbina"],
    },
  },
];

type Dominio = "mecanico" | "optico" | "hidraulico";

export default function EventPuzzlePreviewClient() {
  const [dominio, setDominio] = useState<Dominio>("mecanico");
  const [passoMecanico, setPassoMecanico] = useState(0);
  const [passoOptico, setPassoOptico] = useState(0);
  const [passoHidraulico, setPassoHidraulico] = useState(0);

  const passo = dominio === "mecanico" ? passoMecanico : dominio === "optico" ? passoOptico : passoHidraulico;
  const setPasso = dominio === "mecanico" ? setPassoMecanico : dominio === "optico" ? setPassoOptico : setPassoHidraulico;
  const passos = dominio === "mecanico" ? PASSOS_MECANICOS : dominio === "optico" ? PASSOS_OPTICOS : PASSOS_HIDRAULICOS;
  const atual = passos[passo];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-[#F3B43F]/40 bg-[#292018]/80 p-4">
        <h1 className="font-imFeel text-2xl text-[#F3B43F]">O Coração da Máquina Celestial — preview dos renderers</h1>
        <p className="mt-1 text-sm text-white/70">
          Protótipo visual (SVG procedural, sem backend ainda). Avance os instantâneos pra ver as regras de cada domínio sendo representadas — o estado real virá do servidor a partir da Fase 8.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => setDominio("mecanico")} className={`rounded px-3 py-1.5 text-sm font-semibold ${dominio === "mecanico" ? "bg-[#BC8418] text-black" : "border border-white/20 text-white/80 hover:bg-white/10"}`}>
            Oficina dos Eixos (mecânico)
          </button>
          <button type="button" onClick={() => setDominio("optico")} className={`rounded px-3 py-1.5 text-sm font-semibold ${dominio === "optico" ? "bg-[#BC8418] text-black" : "border border-white/20 text-white/80 hover:bg-white/10"}`}>
            Observatório (óptico)
          </button>
          <button type="button" onClick={() => setDominio("hidraulico")} className={`rounded px-3 py-1.5 text-sm font-semibold ${dominio === "hidraulico" ? "bg-[#BC8418] text-black" : "border border-white/20 text-white/80 hover:bg-white/10"}`}>
            Sala das Marés (hidráulico)
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-[#F3B43F]/40 bg-[#292018]/80 p-4">
        {dominio === "mecanico" ? (
          <MechanicalPuzzleScene config={CONFIG_MECANICO} estado={PASSOS_MECANICOS[passoMecanico].estado} onAction={() => setPassoMecanico((p) => Math.min(p + 1, PASSOS_MECANICOS.length - 1))} />
        ) : dominio === "optico" ? (
          <OpticalPuzzleScene config={CONFIG_OPTICO} estado={PASSOS_OPTICOS[passoOptico].estado} onAction={() => setPassoOptico((p) => Math.min(p + 1, PASSOS_OPTICOS.length - 1))} />
        ) : (
          <HydraulicPuzzleScene config={CONFIG_HIDRAULICO} estado={PASSOS_HIDRAULICOS[passoHidraulico].estado} onAction={() => setPassoHidraulico((p) => Math.min(p + 1, PASSOS_HIDRAULICOS.length - 1))} />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#F3B43F]/40 bg-[#292018]/80 p-4">
        <p className="font-imFeel text-lg text-white/90">{atual.titulo}</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPasso(0)} className="rounded border border-white/20 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10">
            Reiniciar
          </button>
          <button
            type="button"
            disabled={passo >= passos.length - 1}
            onClick={() => setPasso((p) => Math.min(p + 1, passos.length - 1))}
            className="rounded bg-[#BC8418] px-3 py-1.5 text-sm font-semibold text-black hover:bg-[#a5710f] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Próximo passo
          </button>
        </div>
      </div>
    </div>
  );
}
