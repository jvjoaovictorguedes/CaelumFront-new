"use client";
// Evento "O Coração da Máquina Celestial" — Fase 5 (Óptica). Mesma
// filosofia de MechanicalPuzzleScene.tsx (Fase 4): SVG procedural puro,
// 100% apresentação — nunca calcula intensidade/cor/atingido sozinho,
// só reflete `estado` (feedbackPublico do backend) e `config`
// (topologia+props). Cliques só disparam `onAction`.
import { useMemo } from "react";
import { usePrefereMovimentoReduzido } from "../usePrefereMovimentoReduzido";
import type {
  Canal,
  ComponenteOpticoConfig,
  ComponenteOpticoFeedback,
  EmissorFeedback,
  EspelhoFeedback,
  LenteFeedback,
  ObturadorFeedback,
  PrismaFeedback,
  PuzzleOpticoAcao,
  PuzzleOpticoConfig,
  PuzzleOpticoEstadoPublico,
  ReceptorFeedback,
} from "./types";

const BRONZE = "#9c6b2f";
const ACO_ESCURO = "#3a3f4b";
const VERMELHO_ERRO = "#e05a5a";

function corDoCanal(canal: Canal): string {
  switch (canal) {
    case "BRANCO":
      return "#f5f0e0";
    case "VERMELHO":
      return "#e8544a";
    case "VERDE":
      return "#4ad66d";
    case "AZUL":
      return "#4a90e8";
    default:
      return BRONZE;
  }
}

function nomeDoCanal(canal: Canal): string {
  if (!canal) return "sem luz";
  return canal.toLowerCase();
}

interface PropsCena {
  config: PuzzleOpticoConfig;
  estado: PuzzleOpticoEstadoPublico;
  onAction?: (acao: PuzzleOpticoAcao) => void;
  erro?: string | null;
  somenteLeitura?: boolean;
  className?: string;
}

export default function OpticalPuzzleScene({ config, estado, onAction, erro, somenteLeitura, className }: PropsCena) {
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
        <div role="alert" className="absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded border px-3 py-1.5 text-sm text-red-100 shadow-lg" style={{ borderColor: VERMELHO_ERRO, background: "rgba(40,10,10,0.9)" }}>
          ⚠ {erro}
        </div>
      ) : null}
      <svg viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.largura} ${viewBox.altura}`} className="h-auto w-full" style={{ minHeight: 220 }} role="img" aria-label="Diagrama óptico do puzzle">
        <g>
          {config.connections.map((conn) => {
            const de = porId.get(conn.from.componentId);
            const para = porId.get(conn.to.componentId);
            if (!de || !para) return null;
            const feedbackDestino = estado.components[conn.to.componentId] as { intensidade?: number; cor?: Canal } | undefined;
            const ativa = !!feedbackDestino && (feedbackDestino.intensidade ?? 0) > 0;
            const cor = ativa ? corDoCanal(feedbackDestino!.cor ?? null) : BRONZE;
            return (
              <line
                key={conn.id}
                x1={de.position.x}
                y1={de.position.y}
                x2={para.position.x}
                y2={para.position.y}
                stroke={cor}
                strokeWidth={ativa ? 5 : 3}
                strokeDasharray={ativa ? "10 6" : undefined}
                className={ativa && !reduzido ? "puzzle-fluir-energia" : undefined}
                style={ativa ? { filter: `drop-shadow(0 0 3px ${cor})` } : undefined}
              />
            );
          })}
        </g>
        <g>
          {config.components.map((comp) => (
            <ComponenteOptico key={comp.id} comp={comp} feedback={estado.components[comp.id]} reduzido={reduzido} somenteLeitura={!!somenteLeitura} onAcionar={(type) => acionar(comp.id, type)} />
          ))}
        </g>
      </svg>
    </div>
  );
}

function rotuloAmigavel(comp: ComponenteOpticoConfig): string {
  const nomes: Record<string, string> = {
    EMITTER: "Emissor",
    MIRROR: "Espelho",
    PRISM: "Prisma",
    LENS: "Lente",
    SHUTTER: "Obturador",
    RECEIVER: "Receptor",
  };
  return nomes[comp.type] ?? comp.type;
}

function ComponenteOptico({
  comp,
  feedback,
  reduzido,
  somenteLeitura,
  onAcionar,
}: {
  comp: ComponenteOpticoConfig;
  feedback: ComponenteOpticoFeedback | undefined;
  reduzido: boolean;
  somenteLeitura: boolean;
  onAcionar: (type: string) => void;
}) {
  if (!feedback) return null;
  const { x, y } = comp.position;

  switch (comp.type) {
    case "EMITTER": {
      const fb = feedback as EmissorFeedback;
      return (
        <FormaInterativa x={x} y={y} rotulo={rotuloAmigavel(comp)} ariaPressed={fb.ligado} somenteLeitura={somenteLeitura} onAcionar={() => onAcionar(fb.ligado ? "DESLIGAR" : "LIGAR")} acaoDescricao={fb.ligado ? "toque para desligar" : "toque para ligar"}>
          <Emissor ligado={fb.ligado} cor={fb.cor} reduzido={reduzido} />
          <Legenda linhas={[fb.ligado ? "LIGADO" : "DESLIGADO", `${fb.intensidade} · ${nomeDoCanal(fb.cor)}`]} y={46} />
        </FormaInterativa>
      );
    }

    case "MIRROR": {
      const fb = feedback as EspelhoFeedback;
      return (
        <FormaInterativa x={x} y={y} rotulo={rotuloAmigavel(comp)} ariaPressed={fb.refletindo} somenteLeitura={somenteLeitura} onAcionar={() => onAcionar("GIRAR")} acaoDescricao="toque para girar o espelho">
          <Espelho refletindo={fb.refletindo} cor={fb.cor} intensidade={fb.intensidade} />
          <Legenda linhas={[fb.refletindo ? "REFLETINDO" : "BLOQUEADO", `${fb.intensidade} · ${nomeDoCanal(fb.cor)}`]} y={40} />
        </FormaInterativa>
      );
    }

    case "PRISM": {
      const fb = feedback as PrismaFeedback;
      return (
        <FormaEstatica x={x} y={y} rotulo={rotuloAmigavel(comp)}>
          <Prisma cor={fb.cor} intensidade={fb.intensidade} />
          <Legenda linhas={[`${fb.intensidade} · ${nomeDoCanal(fb.cor)}`]} y={40} />
        </FormaEstatica>
      );
    }

    case "LENS": {
      const fb = feedback as LenteFeedback;
      return (
        <FormaEstatica x={x} y={y} rotulo={rotuloAmigavel(comp)}>
          <Lente cor={fb.cor} intensidade={fb.intensidade} />
          <Legenda linhas={[`fator ${fb.fator}`, `${fb.intensidade} · ${nomeDoCanal(fb.cor)}`]} y={40} />
        </FormaEstatica>
      );
    }

    case "SHUTTER": {
      const fb = feedback as ObturadorFeedback;
      return (
        <FormaInterativa x={x} y={y} rotulo={rotuloAmigavel(comp)} ariaPressed={fb.aberto} somenteLeitura={somenteLeitura} onAcionar={() => onAcionar(fb.aberto ? "FECHAR" : "ABRIR")} acaoDescricao={fb.aberto ? "toque para fechar" : "toque para abrir"}>
          <Obturador aberto={fb.aberto} cor={fb.cor} reduzido={reduzido} />
          <Legenda linhas={[fb.aberto ? "ABERTO" : "FECHADO", `${fb.intensidade} · ${nomeDoCanal(fb.cor)}`]} y={40} />
        </FormaInterativa>
      );
    }

    case "RECEIVER": {
      const fb = feedback as ReceptorFeedback;
      return (
        <FormaEstatica x={x} y={y} rotulo={rotuloAmigavel(comp)}>
          <Receptor atingido={fb.atingido} cor={fb.cor} reduzido={reduzido} />
          <Legenda linhas={[fb.atingido ? "✓ ALVO ATINGIDO" : "aguardando…", `${fb.intensidade} · ${nomeDoCanal(fb.cor)}`]} y={46} destaque={fb.atingido} />
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
  return (
    <g>
      {linhas.map((linha, i) => (
        <text key={i} x={0} y={y + i * 13} textAnchor="middle" fontSize={11} fill={destaque ? "#F3B43F" : "#d8cdb8"} className={destaque ? "puzzle-pulsar-objetivo" : undefined}>
          {linha}
        </text>
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Formas procedurais — tudo SVG, nenhum sprite/imagem externa.
function Emissor({ ligado, cor, reduzido }: { ligado: boolean; cor: Canal; reduzido: boolean }) {
  const corViva = ligado ? corDoCanal(cor) : BRONZE;
  return (
    <>
      <rect x={-22} y={-22} width={44} height={44} rx={8} fill="#241b10" stroke={corViva} strokeWidth={4} />
      <circle r={12} fill={ligado ? corViva : "none"} stroke={corViva} strokeWidth={3} className={ligado && !reduzido ? "puzzle-pulsar-objetivo" : undefined} />
      {ligado ? <circle r={28} fill="none" stroke={corViva} strokeWidth={1.5} opacity={0.5} /> : null}
    </>
  );
}

function Espelho({ refletindo, cor, intensidade }: { refletindo: boolean; cor: Canal; intensidade: number }) {
  const corViva = intensidade > 0 ? corDoCanal(cor) : refletindo ? "#c89450" : ACO_ESCURO;
  return (
    <g transform="rotate(-35)">
      <rect x={-24} y={-4} width={48} height={8} rx={2} fill={corViva} opacity={refletindo ? 1 : 0.4} />
      {!refletindo ? <line x1={-24} y1={-10} x2={24} y2={10} stroke={VERMELHO_ERRO} strokeWidth={2} /> : null}
    </g>
  );
}

function Prisma({ cor, intensidade }: { cor: Canal; intensidade: number }) {
  const corViva = intensidade > 0 ? corDoCanal(cor) : BRONZE;
  return <polygon points="0,-22 20,16 -20,16" fill="#241b10" stroke={corViva} strokeWidth={4} strokeLinejoin="round" />;
}

function Lente({ cor, intensidade }: { cor: Canal; intensidade: number }) {
  const corViva = intensidade > 0 ? corDoCanal(cor) : BRONZE;
  return (
    <g>
      <ellipse rx={12} ry={22} fill="#241b10" stroke={corViva} strokeWidth={4} />
    </g>
  );
}

function Obturador({ aberto, cor, reduzido }: { aberto: boolean; cor: Canal; reduzido: boolean }) {
  const corViva = corDoCanal(cor);
  const deslocamento = aberto ? 16 : 2;
  return (
    <>
      <rect x={-20} y={-20} width={40} height={40} rx={4} fill="none" stroke={BRONZE} strokeWidth={2} />
      <rect x={-20} y={-20} width={deslocamento} height={40} fill={aberto ? corViva : ACO_ESCURO} style={reduzido ? undefined : { transition: "width 220ms ease-out" }} />
      <rect x={20 - deslocamento} y={-20} width={deslocamento} height={40} fill={aberto ? corViva : ACO_ESCURO} style={reduzido ? undefined : { transition: "width 220ms ease-out, x 220ms ease-out" }} />
    </>
  );
}

function Receptor({ atingido, cor, reduzido }: { atingido: boolean; cor: Canal; reduzido: boolean }) {
  const corViva = atingido ? corDoCanal(cor) : "#6a7a8a";
  return (
    <>
      <circle r={28} fill="none" stroke={corViva} strokeWidth={atingido ? 5 : 3} className={atingido && !reduzido ? "puzzle-pulsar-objetivo" : undefined} />
      <circle r={14} fill="none" stroke={corViva} strokeWidth={2} opacity={0.6} />
      <circle r={5} fill={corViva} />
    </>
  );
}
