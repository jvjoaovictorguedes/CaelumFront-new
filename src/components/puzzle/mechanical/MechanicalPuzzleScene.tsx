"use client";
// Evento "O Coração da Máquina Celestial" — Fase 4 (Renderização
// Procedural Mecânica). Renderiza em SVG puro (sem sprite/imagem
// externa, regra obrigatória da encomenda) o estado público de um
// puzzle mecânico (Fase 3 do backend). Este componente é 100%
// apresentação: NUNCA calcula rpm/sentido/atingido sozinho — só lê
// `estado` (o feedbackPublico que o servidor produziu) e `config`
// (topologia + props, dados do Admin). Clicar/tocar num componente só
// dispara `onAction`; quem decide se a ação é válida e qual o novo
// estado é sempre o backend (Fase 8).
import { useId, useMemo, useState } from "react";
import { usePrefereMovimentoReduzido } from "../usePrefereMovimentoReduzido";
import type {
  AlavancaFeedback,
  ComponenteFeedback,
  ComponenteMecanicoConfig,
  EixoFeedback,
  EmbreagemFeedback,
  EngrenagemFeedback,
  MotorFeedback,
  PoliaFeedback,
  PuzzleMecanicoAcao,
  PuzzleMecanicoConfig,
  PuzzleMecanicoEstadoPublico,
  RessonanciaSaida,
  SaidaFeedback,
  Sentido,
} from "./types";
import { apresentarRessonancia, decrementar, incrementar, interpretarDigitacaoDeRpm, motorEhAjustavel } from "./reguladorDeRpm";

const BRONZE = "#9c6b2f";
const BRONZE_CLARO = "#c89450";
const OURO = "#F3B43F";
const AZUL_ENERGIA = "#5fb3ff";
const VIOLETA_ENERGIA = "#a66bff";
const COBRE = "#b5651d";
const ACO_ESCURO = "#3a3f4b";
const VERMELHO_ERRO = "#e05a5a";

function temRpm(f: ComponenteFeedback): f is { rpm: number; sentido: Sentido } {
  return typeof (f as { rpm?: unknown }).rpm === "number";
}

function setaDeSentido(sentido: Sentido): string {
  if (sentido === "CW") return "↻";
  if (sentido === "CCW") return "↺";
  return "–";
}

function duracaoDaVolta(rpm: number): number {
  if (!rpm || rpm <= 0) return 0;
  return 60 / Math.abs(rpm); // rpm = voltas por minuto -> segundos por volta
}

interface PropsCena {
  config: PuzzleMecanicoConfig;
  estado: PuzzleMecanicoEstadoPublico;
  onAction?: (acao: PuzzleMecanicoAcao) => void;
  erro?: string | null;
  somenteLeitura?: boolean;
  className?: string;
}

export default function MechanicalPuzzleScene({ config, estado, onAction, erro, somenteLeitura, className }: PropsCena) {
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

  function ajustarRpm(componentId: string, rpm: number) {
    if (somenteLeitura || !onAction) return;
    onAction({ type: "AJUSTAR_RPM", componentId, payload: { rpm } });
  }

  // Reguladores de RPM (seção 5 da encomenda) ficam FORA do <svg>, como
  // um painel HTML comum — nunca dependem de drag, funcionam com
  // teclado/toque nativo, e evitam qualquer sutileza de compatibilidade
  // de <foreignObject>. Um por MOTOR ajustável (hoje a Oficina só tem
  // um, mas isto nunca assume isso).
  const motoresAjustaveis = config.components.filter((c) => c.type === "MOTOR" && motorEhAjustavel(estado.components[c.id] as MotorFeedback));

  return (
    <div className={`relative w-full ${className ?? ""}`}>
      {erro ? (
        <div
          role="alert"
          className="absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded border border-red-400 bg-red-950/90 px-3 py-1.5 text-sm text-red-100 shadow-lg"
          style={{ borderColor: VERMELHO_ERRO }}
        >
          ⚠ {erro}
        </div>
      ) : null}
      <svg
        viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.largura} ${viewBox.altura}`}
        className="h-auto w-full"
        style={{ minHeight: 220 }}
        role="img"
        aria-label="Diagrama mecânico do puzzle"
      >
        <g>
          {config.connections.map((conn) => {
            const de = porId.get(conn.from.componentId);
            const para = porId.get(conn.to.componentId);
            if (!de || !para) return null;
            const feedbackDestino = estado.components[conn.to.componentId];
            const energizada = feedbackDestino && temRpm(feedbackDestino) && feedbackDestino.rpm > 0;
            return (
              <line
                key={conn.id}
                x1={de.position.x}
                y1={de.position.y}
                x2={para.position.x}
                y2={para.position.y}
                stroke={energizada ? AZUL_ENERGIA : BRONZE}
                strokeWidth={energizada ? 5 : 3}
                strokeDasharray={energizada ? "10 6" : undefined}
                className={energizada && !reduzido ? "puzzle-fluir-energia" : undefined}
                style={energizada ? { filter: `drop-shadow(0 0 3px ${VIOLETA_ENERGIA})` } : undefined}
              />
            );
          })}
        </g>
        <g>
          {config.components.map((comp) => (
            <ComponenteMecanico
              key={comp.id}
              comp={comp}
              feedback={estado.components[comp.id]}
              reduzido={reduzido}
              somenteLeitura={!!somenteLeitura}
              onAcionar={(type) => acionar(comp.id, type)}
            />
          ))}
        </g>
      </svg>
      {motoresAjustaveis.map((comp) => (
        <ReguladorDeRpm
          key={comp.id}
          rotulo={rotuloAmigavel(comp)}
          fb={estado.components[comp.id] as MotorFeedback & { ajustavel: true }}
          somenteLeitura={!!somenteLeitura}
          onAjustar={(rpm) => ajustarRpm(comp.id, rpm)}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Regulador do Eixo Mestre — painel HTML (fora do <svg>) com [-] RPM [+]
// e input numérico. Nunca controla estado localmente: o valor exibido é
// SEMPRE `fb.rpmConfigurado` (o que o servidor já confirmou), nunca um
// state otimista — digitar/clicar só DISPARA a ação; a UI só reflete o
// que voltar na próxima atualização de `estado` (mesmo princípio de
// "servidor é a única autoridade" do resto do puzzle).
function ReguladorDeRpm({
  rotulo,
  fb,
  somenteLeitura,
  onAjustar,
}: {
  rotulo: string;
  fb: MotorFeedback & { ajustavel: true };
  somenteLeitura: boolean;
  onAjustar: (rpm: number) => void;
}) {
  const idInput = useId();
  const [digitando, setDigitando] = useState<string | null>(null);
  const { rpmMin, rpmMax, rpmStep, rpmConfigurado } = fb;
  const desabilitado = somenteLeitura;

  function confirmarDigitacao() {
    if (digitando === null) return;
    const valor = interpretarDigitacaoDeRpm(digitando, rpmMin, rpmMax, rpmStep);
    if (valor !== null && valor !== rpmConfigurado) onAjustar(valor);
    setDigitando(null);
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-[#9c6b2f]/50 bg-black/30 p-3 text-sm text-[#d8cdb8]">
      <span className="text-xs uppercase tracking-widest text-[#F3B43F]/80">Regulador — {rotulo}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Diminuir RPM"
          disabled={desabilitado || rpmConfigurado <= rpmMin}
          onClick={() => onAjustar(decrementar(rpmConfigurado, rpmMin, rpmMax, rpmStep))}
          className="h-9 w-9 rounded-lg border border-[#9c6b2f] bg-[#241b10] text-lg font-bold text-[#F3B43F] disabled:opacity-30"
        >
          −
        </button>
        <label htmlFor={idInput} className="sr-only">
          RPM do {rotulo}
        </label>
        <input
          id={idInput}
          type="number"
          inputMode="numeric"
          min={rpmMin}
          max={rpmMax}
          step={rpmStep}
          disabled={desabilitado}
          value={digitando ?? String(rpmConfigurado)}
          onChange={(e) => setDigitando(e.target.value)}
          onBlur={confirmarDigitacao}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              confirmarDigitacao();
            }
          }}
          className="w-20 rounded-lg border border-white/20 bg-black/40 px-2 py-1.5 text-center font-bold text-white"
        />
        <span className="text-xs text-white/50">RPM</span>
        <button
          type="button"
          aria-label="Aumentar RPM"
          disabled={desabilitado || rpmConfigurado >= rpmMax}
          onClick={() => onAjustar(incrementar(rpmConfigurado, rpmMin, rpmMax, rpmStep))}
          className="h-9 w-9 rounded-lg border border-[#9c6b2f] bg-[#241b10] text-lg font-bold text-[#F3B43F] disabled:opacity-30"
        >
          +
        </button>
      </div>
      <span className="text-[10px] text-white/35">
        {rpmMin}–{rpmMax}, passo {rpmStep}
      </span>
    </div>
  );
}

function ComponenteMecanico({
  comp,
  feedback,
  reduzido,
  somenteLeitura,
  onAcionar,
}: {
  comp: ComponenteMecanicoConfig;
  feedback: ComponenteFeedback | undefined;
  reduzido: boolean;
  somenteLeitura: boolean;
  onAcionar: (type: string) => void;
}) {
  if (!feedback) return null;
  const { x, y } = comp.position;

  switch (comp.type) {
    case "MOTOR": {
      const fb = feedback as MotorFeedback;
      return (
        <FormaInterativa
          x={x}
          y={y}
          rotulo={rotuloAmigavel(comp)}
          ariaPressed={fb.ligado}
          somenteLeitura={somenteLeitura}
          onAcionar={() => onAcionar(fb.ligado ? "DESLIGAR" : "LIGAR")}
          acaoDescricao={fb.ligado ? "toque para desligar" : "toque para ligar"}
        >
          <CorpoMotor ligado={fb.ligado} rpm={fb.rpm} sentido={fb.sentido} reduzido={reduzido} />
          <Legenda linhas={[fb.ligado ? "LIGADO" : "DESLIGADO", `${fb.rpm} rpm ${setaDeSentido(fb.sentido)}`]} y={46} />
        </FormaInterativa>
      );
    }

    case "GEAR": {
      const fb = feedback as EngrenagemFeedback;
      return (
        <FormaEstatica x={x} y={y} rotulo={rotuloAmigavel(comp)}>
          <Engrenagem raio={cclamp(16 + fb.dentes * 0.5, 20, 42)} dentesVisuais={cclamp(fb.dentes, 6, 18)} rpm={fb.rpm} sentido={fb.sentido} reduzido={reduzido} cor={fb.rpm > 0 ? OURO : BRONZE_CLARO} />
          <Legenda linhas={[`${fb.dentes} dentes`, `${fb.rpm} rpm ${setaDeSentido(fb.sentido)}`]} y={54} />
        </FormaEstatica>
      );
    }

    case "PULLEY": {
      const fb = feedback as PoliaFeedback;
      return (
        <FormaEstatica x={x} y={y} rotulo={rotuloAmigavel(comp)}>
          <Polia raio={cclamp(14 + fb.raio, 20, 42)} rpm={fb.rpm} sentido={fb.sentido} reduzido={reduzido} cor={fb.rpm > 0 ? OURO : COBRE} />
          <Legenda linhas={[`raio ${fb.raio}`, `${fb.rpm} rpm ${setaDeSentido(fb.sentido)}`]} y={54} />
        </FormaEstatica>
      );
    }

    case "SHAFT": {
      const fb = feedback as EixoFeedback;
      return (
        <FormaEstatica x={x} y={y} rotulo={rotuloAmigavel(comp)}>
          <Eixo rpm={fb.rpm} sentido={fb.sentido} reduzido={reduzido} cor={fb.rpm > 0 ? OURO : ACO_ESCURO} />
          <Legenda linhas={[`${fb.rpm} rpm ${setaDeSentido(fb.sentido)}`]} y={34} />
        </FormaEstatica>
      );
    }

    case "LEVER": {
      const fb = feedback as AlavancaFeedback;
      return (
        <FormaInterativa
          x={x}
          y={y}
          rotulo={rotuloAmigavel(comp)}
          ariaPressed={fb.acionada}
          somenteLeitura={somenteLeitura}
          onAcionar={() => onAcionar("ACIONAR")}
          acaoDescricao="toque para acionar a alavanca"
        >
          <Alavanca acionada={fb.acionada} reduzido={reduzido} />
          <Legenda linhas={[fb.acionada ? "ACIONADA" : "EM REPOUSO"]} y={46} />
        </FormaInterativa>
      );
    }

    case "CLUTCH": {
      const fb = feedback as EmbreagemFeedback;
      return (
        <FormaInterativa
          x={x}
          y={y}
          rotulo={rotuloAmigavel(comp)}
          ariaPressed={fb.engatada}
          somenteLeitura={somenteLeitura}
          onAcionar={() => onAcionar(fb.engatada ? "DESENGATAR" : "ENGATAR")}
          acaoDescricao={fb.engatada ? "toque para desengatar" : "toque para engatar"}
        >
          <Embreagem engatada={fb.engatada} rpm={fb.rpm} sentido={fb.sentido} reduzido={reduzido} />
          <Legenda linhas={[fb.engatada ? "ENGATADA" : "DESENGATADA", `${fb.rpm} rpm ${setaDeSentido(fb.sentido)}`]} y={46} />
        </FormaInterativa>
      );
    }

    case "OUTPUT": {
      const fb = feedback as SaidaFeedback;
      const apresentacao = apresentarRessonancia(fb.ressonancia);
      return (
        <FormaEstatica x={x} y={y} rotulo={rotuloAmigavel(comp)}>
          <Saida ressonancia={fb.ressonancia} rpm={fb.rpm} sentido={fb.sentido} reduzido={reduzido} />
          {/* Nunca "✓ ALVO ATINGIDO" nem o valor-alvo — só a ressonância
              qualitativa (seção 8/10 da encomenda) + a RPM ATUAL, que é
              informação física observável e permitida. */}
          <Legenda linhas={[apresentacao.rotulo, `Saída atual: ${fb.rpm} rpm ${setaDeSentido(fb.sentido)}`]} y={54} destaque={apresentacao.pulsar} />
        </FormaEstatica>
      );
    }

    default:
      return null;
  }
}

function rotuloAmigavel(comp: ComponenteMecanicoConfig): string {
  const nomes: Record<string, string> = {
    MOTOR: "Motor",
    SHAFT: "Eixo",
    GEAR: "Engrenagem",
    PULLEY: "Polia",
    LEVER: "Alavanca",
    CLUTCH: "Embreagem",
    OUTPUT: "Saída",
  };
  return nomes[comp.type] ?? comp.type;
}

function cclamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
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
      {/* alvo de toque generoso — maior que a forma visível, acessibilidade mobile */}
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
        <text
          key={i}
          x={0}
          y={y + i * 13}
          textAnchor="middle"
          fontSize={11}
          fill={destaque ? OURO : "#d8cdb8"}
          className={destaque ? "puzzle-pulsar-objetivo" : undefined}
        >
          {linha}
        </text>
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Formas procedurais — tudo SVG, nenhum <image>/sprite externo.
function grupoGirante(rpm: number, sentido: Sentido, reduzido: boolean, children: React.ReactNode) {
  const duracao = duracaoDaVolta(rpm);
  if (duracao <= 0 || reduzido) {
    // Parado, ou movimento reduzido: mostra uma marca estática de raio
    // (o "spoke" dentro de cada forma) na posição inicial — o estado
    // (rpm/sentido) continua comunicado por TEXTO na legenda, nunca só
    // pela rotação.
    return <g>{children}</g>;
  }
  return (
    <g
      className="puzzle-girar"
      style={{
        animationDuration: `${duracao}s`,
        animationDirection: sentido === "CCW" ? "reverse" : "normal",
        transformOrigin: "0px 0px",
      }}
    >
      {children}
    </g>
  );
}

function Engrenagem({ raio, dentesVisuais, rpm, sentido, reduzido, cor }: { raio: number; dentesVisuais: number; rpm: number; sentido: Sentido; reduzido: boolean; cor: string }) {
  const anguloPorDente = 360 / dentesVisuais;
  return grupoGirante(
    rpm,
    sentido,
    reduzido,
    <>
      <circle r={raio} fill="#241b10" stroke={cor} strokeWidth={4} />
      {Array.from({ length: dentesVisuais }, (_, i) => (
        <rect key={i} x={-4} y={-raio - 9} width={8} height={11} fill={cor} transform={`rotate(${i * anguloPorDente})`} />
      ))}
      <line x1={0} y1={0} x2={0} y2={-raio + 4} stroke={cor} strokeWidth={3} />
      <circle r={5} fill={cor} />
    </>,
  );
}

function Polia({ raio, rpm, sentido, reduzido, cor }: { raio: number; rpm: number; sentido: Sentido; reduzido: boolean; cor: string }) {
  return grupoGirante(
    rpm,
    sentido,
    reduzido,
    <>
      <circle r={raio} fill="#241b10" stroke={cor} strokeWidth={4} />
      <circle r={raio - 7} fill="none" stroke={cor} strokeWidth={2} opacity={0.6} />
      <line x1={0} y1={0} x2={0} y2={-raio + 4} stroke={cor} strokeWidth={3} />
      <circle r={5} fill={cor} />
    </>,
  );
}

function Eixo({ rpm, sentido, reduzido, cor }: { rpm: number; sentido: Sentido; reduzido: boolean; cor: string }) {
  return grupoGirante(
    rpm,
    sentido,
    reduzido,
    <>
      <polygon points="-14,-8 14,-8 20,0 14,8 -14,8 -20,0" fill="#241b10" stroke={cor} strokeWidth={3} />
      <line x1={-14} y1={0} x2={14} y2={0} stroke={cor} strokeWidth={2} />
    </>,
  );
}

function CorpoMotor({ ligado, rpm, sentido, reduzido }: { ligado: boolean; rpm: number; sentido: Sentido; reduzido: boolean }) {
  const cor = ligado ? OURO : BRONZE;
  return (
    <>
      <rect x={-26} y={-26} width={52} height={52} rx={8} fill="#241b10" stroke={cor} strokeWidth={4} />
      {grupoGirante(
        rpm,
        sentido,
        reduzido,
        <>
          <circle r={14} fill="none" stroke={cor} strokeWidth={3} />
          <line x1={0} y1={0} x2={0} y2={-14} stroke={cor} strokeWidth={3} />
        </>,
      )}
      {ligado ? <circle r={30} fill="none" stroke={OURO} strokeWidth={1.5} opacity={0.5} /> : null}
    </>
  );
}

function Alavanca({ acionada, reduzido }: { acionada: boolean; reduzido: boolean }) {
  return (
    <>
      <circle r={6} fill={BRONZE_CLARO} />
      <rect x={-22} y={-5} width={44} height={10} rx={4} fill="#241b10" stroke={BRONZE} strokeWidth={2} />
      <line
        x1={0}
        y1={0}
        x2={0}
        y2={-30}
        stroke={acionada ? OURO : BRONZE_CLARO}
        strokeWidth={5}
        strokeLinecap="round"
        transform={`rotate(${acionada ? -38 : 0})`}
        style={reduzido ? undefined : { transition: "transform 260ms ease-out" }}
      />
    </>
  );
}

function Embreagem({ engatada, rpm, sentido, reduzido }: { engatada: boolean; rpm: number; sentido: Sentido; reduzido: boolean }) {
  const cor = engatada ? OURO : ACO_ESCURO;
  const deslocamento = engatada ? 0 : 6;
  return (
    <>
      <g style={reduzido ? undefined : { transition: "transform 220ms ease-out" }} transform={`translate(${-deslocamento},0)`}>
        {grupoGirante(rpm, sentido, reduzido, <circle r={16} fill="#241b10" stroke={cor} strokeWidth={4} />)}
      </g>
      <g style={reduzido ? undefined : { transition: "transform 220ms ease-out" }} transform={`translate(${deslocamento},0)`}>
        <circle r={16} fill="none" stroke={cor} strokeWidth={3} strokeDasharray={engatada ? undefined : "4 3"} />
      </g>
    </>
  );
}

// "Selo Solar" — instrumento/mecanismo (seção 10 da encomenda), nunca
// uma escala numérica alvo. A cor/espessura/pulso refletem só a
// classificação qualitativa de ressonância, nunca um valor exato.
const COR_POR_RESSONANCIA: Record<RessonanciaSaida, string> = {
  SEM_RESONANCIA: "#6a7a8a",
  FRACA: "#8a7a5a",
  PROXIMA: "#c89450",
  ESTAVEL: OURO,
};
function Saida({ ressonancia, rpm, sentido, reduzido }: { ressonancia: RessonanciaSaida; rpm: number; sentido: Sentido; reduzido: boolean }) {
  const estavel = ressonancia === "ESTAVEL";
  const cor = COR_POR_RESSONANCIA[ressonancia];
  return (
    <>
      <circle r={28} fill="none" stroke={cor} strokeWidth={estavel ? 5 : 3} className={estavel && !reduzido ? "puzzle-pulsar-objetivo" : undefined} />
      {grupoGirante(rpm, sentido, reduzido, <line x1={0} y1={0} x2={0} y2={-20} stroke={cor} strokeWidth={3} />)}
      <circle r={5} fill={cor} />
    </>
  );
}
