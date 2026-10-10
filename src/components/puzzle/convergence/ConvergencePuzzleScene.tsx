"use client";
// Evento "O Coração da Máquina Celestial" — Fase 7/16 (Núcleo da
// Convergência, renderização do jogador). O backend (Fase 7,
// puzzleConvergenceComponents.js) NÃO introduz nenhum componente novo —
// a sala de Convergência é um config ÚNICO que mistura os três
// domínios já construídos (mecânico/óptico/hidráulico) num mesmo
// `components`/`connections` plano, com um objetivo COMPOSTO (AND)
// exigindo os três terminais atingidos NA MESMA FOTO do estado. Este
// componente nunca reimplementa um 4º motor de simulação: ele só
// PARTICIONA o mesmo config/estado por tipo de componente e devolve
// cada fatia pros três renderers que já existem (MechanicalPuzzleScene/
// OpticalPuzzleScene/HydraulicPuzzleScene — Fases 4/5/6), exatamente
// como o backend particiona por `TIPOS_MECANICOS`/`TIPOS_OPTICOS`/
// `TIPOS_HIDRAULICOS` em puzzleConvergenceComponents.js. `onAction` é
// só repassado pra cima — os ids de componente são globais e únicos no
// mesmo mapa plano, então o POST de ação é idêntico ao de qualquer
// outro domínio.
import { useMemo } from "react";
import MechanicalPuzzleScene from "../mechanical/MechanicalPuzzleScene";
import type {
  ComponenteFeedback,
  ComponenteMecanicoConfig,
  PuzzleMecanicoAcao,
  PuzzleMecanicoConfig,
  PuzzleMecanicoEstadoPublico,
} from "../mechanical/types";
import OpticalPuzzleScene from "../optical/OpticalPuzzleScene";
import type {
  ComponenteOpticoConfig,
  ComponenteOpticoFeedback,
  PuzzleOpticoConfig,
  PuzzleOpticoEstadoPublico,
} from "../optical/types";
import HydraulicPuzzleScene from "../hydraulic/HydraulicPuzzleScene";
import type {
  ComponenteHidraulicoConfig,
  ComponenteHidraulicoFeedback,
  PuzzleHidraulicoConfig,
  PuzzleHidraulicoEstadoPublico,
} from "../hydraulic/types";

// Mesmos três conjuntos de TIPOS_* de puzzleConvergenceComponents.js no
// CaelumBack-new — duplicados de propósito (repos separados, nunca
// compartilham código em runtime, mesmo critério dos tipos em ./types.ts).
const TIPOS_MECANICOS = new Set(["MOTOR", "SHAFT", "GEAR", "PULLEY", "LEVER", "CLUTCH", "OUTPUT"]);
const TIPOS_OPTICOS = new Set(["EMITTER", "MIRROR", "PRISM", "LENS", "SHUTTER", "RECEIVER"]);
const TIPOS_HIDRAULICOS = new Set(["PUMP", "PIPE", "VALVE", "PRESSURE_NODE", "RESERVOIR", "TURBINE"]);

export interface ComponenteConvergenciaConfig {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  position: { x: number; y: number };
}
export interface ConexaoConvergenciaConfig {
  id: string;
  from: { componentId: string; port: string };
  to: { componentId: string; port: string };
}
export interface PuzzleConvergenciaConfig {
  components: ComponenteConvergenciaConfig[];
  connections: ConexaoConvergenciaConfig[];
  objectives?: Array<{ id: string; descricao: string | null }>;
}
export interface PuzzleConvergenciaEstadoPublico {
  components: Record<string, Record<string, unknown>>;
  objetivosConcluidos: string[];
}
export interface PuzzleConvergenciaAcao {
  type: string;
  componentId?: string;
  payload?: Record<string, unknown>;
}

interface PropsCena {
  config: PuzzleConvergenciaConfig;
  estado: PuzzleConvergenciaEstadoPublico;
  onAction?: (acao: PuzzleConvergenciaAcao) => void;
  erro?: string | null;
  somenteLeitura?: boolean;
  className?: string;
}

function particionar(config: PuzzleConvergenciaConfig, tipos: Set<string>) {
  const ids = new Set(config.components.filter((c) => tipos.has(c.type)).map((c) => c.id));
  const components = config.components.filter((c) => ids.has(c.id));
  const connections = config.connections.filter((c) => ids.has(c.from.componentId) && ids.has(c.to.componentId));
  return { ids, components, connections };
}

export default function ConvergencePuzzleScene({ config, estado, onAction, erro, somenteLeitura, className }: PropsCena) {
  const mecanico = useMemo(() => particionar(config, TIPOS_MECANICOS), [config]);
  const optico = useMemo(() => particionar(config, TIPOS_OPTICOS), [config]);
  const hidraulico = useMemo(() => particionar(config, TIPOS_HIDRAULICOS), [config]);

  const objetivos = config.objectives ?? [];
  const concluidosSet = new Set(estado.objetivosConcluidos ?? []);

  function repassar(acao: PuzzleMecanicoAcao | PuzzleOpticoAcaoCompat | PuzzleHidraulicoAcaoCompat) {
    if (somenteLeitura || !onAction) return;
    onAction(acao);
  }

  return (
    <div className={`flex w-full flex-col gap-4 ${className ?? ""}`}>
      {erro ? (
        <div role="alert" className="rounded border border-red-400 bg-red-950/90 px-3 py-1.5 text-center text-sm text-red-100 shadow-lg">
          ⚠ {erro}
        </div>
      ) : null}

      {objetivos.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-lg border border-white/10 bg-black/30 p-3">
          {objetivos.map((o) => {
            const concluido = concluidosSet.has(o.id);
            return (
              <span
                key={o.id}
                className={`rounded-md border px-2.5 py-1 text-xs ${
                  concluido ? "border-green-500/50 bg-green-500/10 text-green-300" : "border-white/20 text-white/60"
                }`}
              >
                {concluido ? "✓" : "○"} {o.descricao ?? o.id}
              </span>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SubPainel titulo="Transmissão Mecânica" vazio={mecanico.components.length === 0}>
          {mecanico.components.length > 0 && (
            <MechanicalPuzzleScene
              config={{ components: mecanico.components as ComponenteMecanicoConfig[], connections: mecanico.connections } as PuzzleMecanicoConfig}
              estado={{
                components: filtrarEstado(estado.components, mecanico.ids) as Record<string, ComponenteFeedback>,
                objetivosConcluidos: estado.objetivosConcluidos,
              } as PuzzleMecanicoEstadoPublico}
              onAction={repassar}
              somenteLeitura={somenteLeitura}
            />
          )}
        </SubPainel>

        <SubPainel titulo="Feixe de Energia" vazio={optico.components.length === 0}>
          {optico.components.length > 0 && (
            <OpticalPuzzleScene
              config={{ components: optico.components as ComponenteOpticoConfig[], connections: optico.connections } as PuzzleOpticoConfig}
              estado={{
                components: filtrarEstado(estado.components, optico.ids) as Record<string, ComponenteOpticoFeedback>,
                objetivosConcluidos: estado.objetivosConcluidos,
              } as PuzzleOpticoEstadoPublico}
              onAction={repassar}
              somenteLeitura={somenteLeitura}
            />
          )}
        </SubPainel>

        <SubPainel titulo="Fluxo Hidráulico" vazio={hidraulico.components.length === 0}>
          {hidraulico.components.length > 0 && (
            <HydraulicPuzzleScene
              config={{ components: hidraulico.components as ComponenteHidraulicoConfig[], connections: hidraulico.connections } as PuzzleHidraulicoConfig}
              estado={{
                components: filtrarEstado(estado.components, hidraulico.ids) as Record<string, ComponenteHidraulicoFeedback>,
                objetivosConcluidos: estado.objetivosConcluidos,
              } as PuzzleHidraulicoEstadoPublico}
              onAction={repassar}
              somenteLeitura={somenteLeitura}
            />
          )}
        </SubPainel>
      </div>
    </div>
  );
}

// `onAction` dos três sub-renderers já tem o MESMO shape
// ({type, componentId?, payload?}) — estes dois alias só existem pra
// satisfazer TypeScript sem precisar de um tipo União espalhado por
// toda a assinatura de `repassar`.
type PuzzleOpticoAcaoCompat = PuzzleMecanicoAcao;
type PuzzleHidraulicoAcaoCompat = PuzzleMecanicoAcao;

function filtrarEstado(components: Record<string, Record<string, unknown>>, ids: Set<string>): Record<string, unknown> {
  const resultado: Record<string, unknown> = {};
  for (const id of ids) {
    if (components[id] !== undefined) resultado[id] = components[id];
  }
  return resultado;
}

function SubPainel({ titulo, vazio, children }: { titulo: string; vazio: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-2">
      <p className="mb-1 px-1 text-xs font-bold uppercase tracking-widest text-[#F3B43F]/80">{titulo}</p>
      {vazio ? <p className="px-1 py-6 text-center text-xs text-white/30">Nenhum componente deste sub-sistema nesta sala.</p> : children}
    </div>
  );
}
