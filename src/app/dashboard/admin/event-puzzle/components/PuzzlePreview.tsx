"use client";

// "O Coração da Máquina Celestial" — Puzzle Builder (Fase 15). Preview
// read-only da topologia de UM `config` de PuzzleBlueprintVersion,
// usando os MESMOS renderers SVG do jogo real (MechanicalPuzzleScene/
// OpticalPuzzleScene/HydraulicPuzzleScene — Fases 4/5/6), em vez de
// reimplementar a visualização. Diferente do jogo real: aqui não existe
// nenhuma PuzzleInstance nem simulação — o "estado público" mostrado é
// sempre o REPOUSO inicial de cada tipo de componente (motor desligado,
// válvula fechada etc.), espelhando fielmente `criarEstado()` de cada
// registry do CaelumBack-new (puzzleMechanicalComponents.js/
// puzzleOpticalComponents.js/puzzleHydraulicComponents.js) — nunca uma
// segunda fórmula de simulação no frontend. Campos "estáticos" que o
// feedbackPublico do backend copia direto de `props` (dentes/raio/
// fator/vazaoMaxima/capacidade) são lidos aqui do MESMO jeito. Clicar
// num componente não faz nada (`onAction` omitido) — isto é só layout,
// nunca um simulador client-side.
import { useMemo } from "react";
import MechanicalPuzzleScene from "@/components/puzzle/mechanical/MechanicalPuzzleScene";
import type { ComponenteFeedback, PuzzleMecanicoConfig, PuzzleMecanicoEstadoPublico } from "@/components/puzzle/mechanical/types";
import OpticalPuzzleScene from "@/components/puzzle/optical/OpticalPuzzleScene";
import type { ComponenteOpticoFeedback, PuzzleOpticoConfig, PuzzleOpticoEstadoPublico } from "@/components/puzzle/optical/types";
import HydraulicPuzzleScene from "@/components/puzzle/hydraulic/HydraulicPuzzleScene";
import type { ComponenteHidraulicoFeedback, PuzzleHidraulicoConfig, PuzzleHidraulicoEstadoPublico } from "@/components/puzzle/hydraulic/types";

interface ComponenteCru {
  id?: unknown;
  type?: unknown;
  props?: unknown;
  position?: unknown;
}

function numeroOuZero(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function posicaoValida(position: unknown): position is { x: number; y: number } {
  return (
    typeof position === "object" &&
    position !== null &&
    typeof (position as { x?: unknown }).x === "number" &&
    typeof (position as { y?: unknown }).y === "number"
  );
}

function componentesValidos(config: unknown): ComponenteCru[] {
  const lista = (config as { components?: unknown })?.components;
  if (!Array.isArray(lista)) return [];
  return lista.filter(
    (c): c is ComponenteCru =>
      typeof c === "object" && c !== null && typeof (c as ComponenteCru).id === "string" && typeof (c as ComponenteCru).type === "string" && posicaoValida((c as ComponenteCru).position),
  );
}

function conexoesValidas(config: unknown): { id: string; from: { componentId: string; port: string }; to: { componentId: string; port: string } }[] {
  const lista = (config as { connections?: unknown })?.connections;
  if (!Array.isArray(lista)) return [];
  return lista.filter(
    (c): c is { id: string; from: { componentId: string; port: string }; to: { componentId: string; port: string } } =>
      typeof c === "object" && c !== null && typeof (c as { id?: unknown }).id === "string" && typeof (c as { from?: unknown }).from === "object" && typeof (c as { to?: unknown }).to === "object",
  );
}

function repousoMecanico(comp: ComponenteCru): ComponenteFeedback | null {
  const props = (comp.props ?? {}) as Record<string, unknown>;
  switch (comp.type) {
    case "MOTOR":
      return { ligado: false, rpm: 0, sentido: null };
    case "SHAFT":
      return { rpm: 0, sentido: null };
    case "GEAR":
      return { rpm: 0, sentido: null, dentes: numeroOuZero(props.dentes) };
    case "PULLEY":
      return { rpm: 0, sentido: null, raio: numeroOuZero(props.raio) };
    case "LEVER":
      return { acionada: false };
    case "CLUTCH":
      return { engatada: false, rpm: 0, sentido: null };
    case "OUTPUT":
      return { rpm: 0, sentido: null, atingido: false };
    default:
      return null;
  }
}

function repousoOptico(comp: ComponenteCru): ComponenteOpticoFeedback | null {
  const props = (comp.props ?? {}) as Record<string, unknown>;
  switch (comp.type) {
    case "EMITTER":
      return { ligado: false, intensidade: 0, cor: null };
    case "MIRROR":
      return { refletindo: true, intensidade: 0, cor: null };
    case "PRISM":
      return { intensidade: 0, cor: null };
    case "LENS":
      return { intensidade: 0, cor: null, fator: numeroOuZero(props.fator) };
    case "SHUTTER":
      return { aberto: false, intensidade: 0, cor: null };
    case "RECEIVER":
      return { intensidade: 0, cor: null, atingido: false };
    default:
      return null;
  }
}

function repousoHidraulico(comp: ComponenteCru): ComponenteHidraulicoFeedback | null {
  const props = (comp.props ?? {}) as Record<string, unknown>;
  switch (comp.type) {
    case "PUMP":
      return { ligada: false, vazao: 0 };
    case "PIPE":
      return { vazao: 0, sobrecarregado: false, vazaoMaxima: numeroOuZero(props.vazaoMaxima) };
    case "VALVE":
      return { aberta: false, vazao: 0 };
    case "PRESSURE_NODE":
      return { vazao: 0, pressao: 0 };
    case "RESERVOIR":
      return { nivel: 0, transbordando: false, capacidade: numeroOuZero(props.capacidade) };
    case "TURBINE":
      return { vazao: 0, atingido: false };
    default:
      return null;
  }
}

export default function PuzzlePreview({ config }: { config: unknown }) {
  const dominio = typeof (config as { dominio?: unknown })?.dominio === "string" ? ((config as { dominio: string }).dominio as string) : null;
  const componentes = useMemo(() => componentesValidos(config), [config]);
  const conexoes = useMemo(() => conexoesValidas(config), [config]);

  if (!dominio || componentes.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-center text-xs text-white/40">
        Preencha `dominio` (MECANICO/OPTICO/HIDRAULICO) e `components` (cada um com id/type/position) no JSON pra ver o preview da topologia.
      </div>
    );
  }

  if (dominio === "MECANICO") {
    const cfg: PuzzleMecanicoConfig = {
      components: componentes as PuzzleMecanicoConfig["components"],
      connections: conexoes,
    };
    const estado: PuzzleMecanicoEstadoPublico = {
      components: Object.fromEntries(
        componentes.map((c) => [c.id as string, repousoMecanico(c)]).filter(([, fb]) => fb !== null) as [string, ComponenteFeedback][],
      ),
      objetivosConcluidos: [],
    };
    return (
      <div className="rounded-lg border border-white/10 bg-black/20 p-2">
        <MechanicalPuzzleScene config={cfg} estado={estado} somenteLeitura />
      </div>
    );
  }

  if (dominio === "OPTICO") {
    const cfg: PuzzleOpticoConfig = {
      components: componentes as PuzzleOpticoConfig["components"],
      connections: conexoes,
    };
    const estado: PuzzleOpticoEstadoPublico = {
      components: Object.fromEntries(
        componentes.map((c) => [c.id as string, repousoOptico(c)]).filter(([, fb]) => fb !== null) as [string, ComponenteOpticoFeedback][],
      ),
      objetivosConcluidos: [],
    };
    return (
      <div className="rounded-lg border border-white/10 bg-black/20 p-2">
        <OpticalPuzzleScene config={cfg} estado={estado} somenteLeitura />
      </div>
    );
  }

  if (dominio === "HIDRAULICO") {
    const cfg: PuzzleHidraulicoConfig = {
      components: componentes as PuzzleHidraulicoConfig["components"],
      connections: conexoes,
    };
    const estado: PuzzleHidraulicoEstadoPublico = {
      components: Object.fromEntries(
        componentes.map((c) => [c.id as string, repousoHidraulico(c)]).filter(([, fb]) => fb !== null) as [string, ComponenteHidraulicoFeedback][],
      ),
      objetivosConcluidos: [],
    };
    return (
      <div className="rounded-lg border border-white/10 bg-black/20 p-2">
        <HydraulicPuzzleScene config={cfg} estado={estado} somenteLeitura />
      </div>
    );
  }

  return (
    <div className="flex h-56 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-center text-xs text-white/40">
      `dominio` desconhecido: &quot;{dominio}&quot;. Esperado MECANICO, OPTICO ou HIDRAULICO.
    </div>
  );
}
