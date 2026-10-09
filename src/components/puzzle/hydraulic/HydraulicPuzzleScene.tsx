"use client";
// Evento "O Coração da Máquina Celestial" — Fase 6 (Hidráulica). Mesma
// filosofia de MechanicalPuzzleScene/OpticalPuzzleScene: SVG
// procedural puro, 100% apresentação — nunca calcula vazão/pressão/
// nível/atingido sozinho, só reflete `estado` (feedbackPublico do
// backend) e `config` (topologia+props). Cliques só disparam
// `onAction`.
import { useMemo } from "react";
import { usePrefereMovimentoReduzido } from "../usePrefereMovimentoReduzido";
import type {
  BombaFeedback,
  CanoFeedback,
  ComponenteHidraulicoConfig,
  ComponenteHidraulicoFeedback,
  NoDePressaoFeedback,
  PuzzleHidraulicoAcao,
  PuzzleHidraulicoConfig,
  PuzzleHidraulicoEstadoPublico,
  ReservatorioFeedback,
  TurbinaFeedback,
  ValvulaFeedback,
} from "./types";

const BRONZE = "#9c6b2f";
const AZUL_AGUA = "#3fa9d6";
const AZUL_CLARO = "#8fd4f0";
const VERMELHO_ALERTA = "#e05a5a";
const ACO_ESCURO = "#3a3f4b";
const OURO = "#F3B43F";

function duracaoDoGiro(vazao: number): number {
  if (!vazao || vazao <= 0) return 0;
  return 60 / Math.max(vazao, 1);
}

interface PropsCena {
  config: PuzzleHidraulicoConfig;
  estado: PuzzleHidraulicoEstadoPublico;
  onAction?: (acao: PuzzleHidraulicoAcao) => void;
  erro?: string | null;
  somenteLeitura?: boolean;
  className?: string;
}

export default function HydraulicPuzzleScene({ config, estado, onAction, erro, somenteLeitura, className }: PropsCena) {
  const reduzido = usePrefereMovimentoReduzido();

  const viewBox = useMemo(() => {
    const xs = config.components.map((c) => c.position.x);
    const ys = config.components.map((c) => c.position.y);
    const pad = 70;
    const minX = Math.min(...xs) - pad;
    const minY = Math.min(...ys) - pad;
    const maxX = Math.max(...xs) + pad;
    const maxY = Math.max(...ys) + pad;
    return { minX, minY, largura: maxX - minX, altura: maxY - minY };
  }, [config.components]);

  const porId = useMemo(() => new Map(config.components.map((c) => [c.id, c])), [config.components]);

  function acionar(componentId: string, type: string) {
    if (somenteLeitura || !onAction) return;
    onAction({ type, componentId });
  }

  return (
    <div className={`relative w-full ${className ?? ""}`}>
      {erro ? (
        <div role="alert" className="absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded border px-3 py-1.5 text-sm text-red-100 shadow-lg" style={{ borderColor: VERMELHO_ALERTA, background: "rgba(40,10,10,0.9)" }}>
          ⚠ {erro}
        </div>
      ) : null}
      <svg viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.largura} ${viewBox.altura}`} className="h-auto w-full" style={{ minHeight: 220 }} role="img" aria-label="Diagrama hidráulico do puzzle">
        <g>
          {config.connections.map((conn) => {
            const de = porId.get(conn.from.componentId);
            const para = porId.get(conn.to.componentId);
            if (!de || !para) return null;
            const feedbackDestino = estado.components[conn.to.componentId] as { vazao?: number } | undefined;
            const vazao = feedbackDestino?.vazao ?? 0;
            const ativa = vazao > 0;
            return (
              <line
                key={conn.id}
                x1={de.position.x}
                y1={de.position.y}
                x2={para.position.x}
                y2={para.position.y}
                stroke={ativa ? AZUL_AGUA : BRONZE}
                strokeWidth={ativa ? Math.min(4 + vazao / 20, 9) : 3}
                strokeDasharray={ativa ? "10 6" : undefined}
                className={ativa && !reduzido ? "puzzle-fluir-energia" : undefined}
                style={ativa ? { filter: `drop-shadow(0 0 3px ${AZUL_CLARO})` } : undefined}
              />
            );
          })}
        </g>
        <g>
          {config.components.map((comp) => (
            <ComponenteHidraulico key={comp.id} comp={comp} feedback={estado.components[comp.id]} reduzido={reduzido} somenteLeitura={!!somenteLeitura} onAcionar={(type) => acionar(comp.id, type)} />
          ))}
        </g>
      </svg>
    </div>
  );
}

function rotuloAmigavel(comp: ComponenteHidraulicoConfig): string {
  const nomes: Record<string, string> = {
    PUMP: "Bomba",
    PIPE: "Cano",
    VALVE: "Válvula",
    PRESSURE_NODE: "Medidor",
    RESERVOIR: "Reservatório",
    TURBINE: "Turbina",
  };
  return nomes[comp.type] ?? comp.type;
}

function ComponenteHidraulico({
  comp,
  feedback,
  reduzido,
  somenteLeitura,
  onAcionar,
}: {
  comp: ComponenteHidraulicoConfig;
  feedback: ComponenteHidraulicoFeedback | undefined;
  reduzido: boolean;
  somenteLeitura: boolean;
  onAcionar: (type: string) => void;
}) {
  if (!feedback) return null;
  const { x, y } = comp.position;

  switch (comp.type) {
    case "PUMP": {
      const fb = feedback as BombaFeedback;
      return (
        <FormaInterativa x={x} y={y} rotulo={rotuloAmigavel(comp)} ariaPressed={fb.ligada} somenteLeitura={somenteLeitura} onAcionar={() => onAcionar(fb.ligada ? "DESLIGAR" : "LIGAR")} acaoDescricao={fb.ligada ? "toque para desligar" : "toque para ligar"}>
          <Bomba ligada={fb.ligada} vazao={fb.vazao} reduzido={reduzido} />
          <Legenda linhas={[fb.ligada ? "LIGADA" : "DESLIGADA", `vazão ${fb.vazao}`]} y={46} />
        </FormaInterativa>
      );
    }

    case "PIPE": {
      const fb = feedback as CanoFeedback;
      return (
        <FormaEstatica x={x} y={y} rotulo={rotuloAmigavel(comp)}>
          <Cano vazao={fb.vazao} sobrecarregado={fb.sobrecarregado} />
          <Legenda linhas={[`vazão ${fb.vazao} / limite ${fb.vazaoMaxima}`, fb.sobrecarregado ? "⚠ SOBRECARREGADO" : ""]} y={40} destaque={fb.sobrecarregado} />
        </FormaEstatica>
      );
    }

    case "VALVE": {
      const fb = feedback as ValvulaFeedback;
      return (
        <FormaInterativa x={x} y={y} rotulo={rotuloAmigavel(comp)} ariaPressed={fb.aberta} somenteLeitura={somenteLeitura} onAcionar={() => onAcionar(fb.aberta ? "FECHAR" : "ABRIR")} acaoDescricao={fb.aberta ? "toque para fechar" : "toque para abrir"}>
          <Valvula aberta={fb.aberta} reduzido={reduzido} />
          <Legenda linhas={[fb.aberta ? "ABERTA" : "FECHADA", `vazão ${fb.vazao}`]} y={40} />
        </FormaInterativa>
      );
    }

    case "PRESSURE_NODE": {
      const fb = feedback as NoDePressaoFeedback;
      return (
        <FormaEstatica x={x} y={y} rotulo={rotuloAmigavel(comp)}>
          <Medidor pressao={fb.pressao} />
          <Legenda linhas={[`pressão ${fb.pressao}`, `vazão ${fb.vazao}`]} y={40} />
        </FormaEstatica>
      );
    }

    case "RESERVOIR": {
      const fb = feedback as ReservatorioFeedback;
      return (
        <FormaEstatica x={x} y={y} rotulo={rotuloAmigavel(comp)}>
          <Reservatorio nivel={fb.nivel} capacidade={fb.capacidade} transbordando={fb.transbordando} reduzido={reduzido} />
          <Legenda linhas={[`${fb.nivel} / ${fb.capacidade}`, fb.transbordando ? "⚠ TRANSBORDANDO" : ""]} y={44} destaque={fb.transbordando} />
        </FormaEstatica>
      );
    }

    case "TURBINE": {
      const fb = feedback as TurbinaFeedback;
      return (
        <FormaEstatica x={x} y={y} rotulo={rotuloAmigavel(comp)}>
          <Turbina vazao={fb.vazao} atingido={fb.atingido} reduzido={reduzido} />
          <Legenda linhas={[fb.atingido ? "✓ ALVO ATINGIDO" : "aguardando…", `vazão ${fb.vazao}`]} y={46} destaque={fb.atingido} />
        </FormaEstatica>
      );
    }

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
function FormaInterativa({
  x,
  y,
  rotulo,
  ariaPressed,
  somenteLeitura,
  onAcionar,
  acaoDescricao,
  children,
}: {
  x: number;
  y: number;
  rotulo: string;
  ariaPressed: boolean;
  somenteLeitura: boolean;
  onAcionar: () => void;
  acaoDescricao: string;
  children: React.ReactNode;
}) {
  return (
    <g
      transform={`translate(${x},${y})`}
      role={somenteLeitura ? undefined : "button"}
      tabIndex={somenteLeitura ? undefined : 0}
      aria-pressed={somenteLeitura ? undefined : ariaPressed}
      aria-label={somenteLeitura ? rotulo : `${rotulo} — ${acaoDescricao}`}
      style={{ cursor: somenteLeitura ? "default" : "pointer", outline: "none" }}
      onClick={somenteLeitura ? undefined : onAcionar}
      onKeyDown={
        somenteLeitura
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onAcionar();
              }
            }
      }
    >
      <circle r={38} fill="transparent" />
      {children}
    </g>
  );
}

function FormaEstatica({ x, y, rotulo, children }: { x: number; y: number; rotulo: string; children: React.ReactNode }) {
  return (
    <g transform={`translate(${x},${y})`} aria-label={rotulo}>
      {children}
    </g>
  );
}

function Legenda({ linhas, y, destaque }: { linhas: string[]; y: number; destaque?: boolean }) {
  const visiveis = linhas.filter(Boolean);
  return (
    <g>
      {visiveis.map((linha, i) => (
        <text key={i} x={0} y={y + i * 13} textAnchor="middle" fontSize={11} fill={destaque ? VERMELHO_ALERTA : "#d8cdb8"} className={destaque && !linha.startsWith("✓") ? "puzzle-pulsar-objetivo" : undefined}>
          {linha}
        </text>
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Formas procedurais — tudo SVG, nenhum sprite/imagem externa.
function Bomba({ ligada, vazao, reduzido }: { ligada: boolean; vazao: number; reduzido: boolean }) {
  const cor = ligada ? OURO : BRONZE;
  return (
    <>
      <circle r={22} fill="#241b10" stroke={cor} strokeWidth={4} />
      <g className={ligada && !reduzido ? "puzzle-girar" : undefined} style={ligada ? { animationDuration: `${duracaoDoGiro(vazao)}s`, transformOrigin: "0px 0px" } : undefined}>
        <path d="M0,-12 L7,0 L0,12 L-7,0 Z" fill={cor} />
        <path d="M-12,0 L0,7 L12,0 L0,-7 Z" fill={cor} opacity={0.6} />
      </g>
      {ligada ? <circle r={30} fill="none" stroke={OURO} strokeWidth={1.5} opacity={0.5} /> : null}
    </>
  );
}

function Cano({ vazao, sobrecarregado }: { vazao: number; sobrecarregado: boolean }) {
  const cor = sobrecarregado ? VERMELHO_ALERTA : vazao > 0 ? AZUL_AGUA : BRONZE;
  return (
    <>
      <rect x={-26} y={-10} width={52} height={20} rx={6} fill="#241b10" stroke={cor} strokeWidth={4} />
      {vazao > 0 ? <rect x={-20} y={-4} width={40} height={8} rx={4} fill={cor} opacity={0.6} /> : null}
    </>
  );
}

function Valvula({ aberta, reduzido }: { aberta: boolean; reduzido: boolean }) {
  const cor = aberta ? AZUL_AGUA : ACO_ESCURO;
  return (
    <>
      <rect x={-20} y={-14} width={40} height={28} rx={4} fill="none" stroke={BRONZE} strokeWidth={2} />
      <rect x={-4} y={-14} width={8} height={28} fill={cor} transform={aberta ? "rotate(90)" : "rotate(0)"} style={reduzido ? undefined : { transition: "transform 220ms ease-out" }} />
    </>
  );
}

function Medidor({ pressao }: { pressao: number }) {
  const anguloMaximo = 120;
  const angulo = Math.min(pressao, 200) / 200 * anguloMaximo - anguloMaximo / 2;
  const cor = pressao > 0 ? OURO : BRONZE;
  return (
    <>
      <circle r={22} fill="#241b10" stroke={cor} strokeWidth={4} />
      <line x1={0} y1={0} x2={0} y2={-16} stroke={cor} strokeWidth={3} strokeLinecap="round" transform={`rotate(${angulo})`} />
      <circle r={3} fill={cor} />
    </>
  );
}

function Reservatorio({ nivel, capacidade, transbordando, reduzido }: { nivel: number; capacidade: number; transbordando: boolean; reduzido: boolean }) {
  const alturaTotal = 48;
  const proporcao = capacidade > 0 ? Math.min(nivel / capacidade, 1) : 0;
  const alturaAgua = alturaTotal * proporcao;
  const cor = transbordando ? VERMELHO_ALERTA : AZUL_AGUA;
  return (
    <>
      <rect x={-20} y={-alturaTotal / 2} width={40} height={alturaTotal} rx={4} fill="none" stroke={BRONZE} strokeWidth={3} />
      <rect x={-18} y={alturaTotal / 2 - alturaAgua} width={36} height={alturaAgua} fill={cor} opacity={0.75} className={transbordando && !reduzido ? "puzzle-pulsar-objetivo" : undefined} />
    </>
  );
}

function Turbina({ vazao, atingido, reduzido }: { vazao: number; atingido: boolean; reduzido: boolean }) {
  const cor = atingido ? OURO : vazao > 0 ? AZUL_AGUA : "#6a7a8a";
  const duracao = duracaoDoGiro(vazao);
  return (
    <>
      <circle r={28} fill="none" stroke={cor} strokeWidth={atingido ? 5 : 3} className={atingido && !reduzido ? "puzzle-pulsar-objetivo" : undefined} />
      <g
        className={duracao > 0 && !reduzido ? "puzzle-girar" : undefined}
        style={duracao > 0 ? { animationDuration: `${duracao}s`, transformOrigin: "0px 0px" } : undefined}
      >
        {[0, 60, 120, 180, 240, 300].map((ang) => (
          <ellipse key={ang} cx={0} cy={-12} rx={4} ry={10} fill={cor} transform={`rotate(${ang})`} />
        ))}
      </g>
      <circle r={5} fill={cor} />
    </>
  );
}
