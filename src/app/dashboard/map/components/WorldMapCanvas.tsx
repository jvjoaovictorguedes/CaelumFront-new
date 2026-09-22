"use client";

import { useCallback, useRef, useState } from "react";
import type { TerritorioApi, NodeApi, ConnectionApi } from "./WorldMapClient";
import WorldMapTerritoryLayer from "./WorldMapTerritoryLayer";
import WorldMapConnectionLayer from "./WorldMapConnectionLayer";
import WorldMapNodePin from "./WorldMapNode";

const ZOOM_MIN = 0.8;
const ZOOM_MAX = 2.5;

// Zoom/pan feito à mão (spec §25: "biblioteca leve, mapa ilustrado de
// fantasia — não precisa de API de mapa geográfico real") — sem
// dependência nova, só transform CSS + Pointer Events (unifica mouse e
// touch, inclusive pinch com dois ponteiros ativos).
export default function WorldMapCanvas({
  territories,
  nodes,
  connections,
  activeAdventureZoneId,
  selectedNodeId,
  onSelectNode,
}: {
  territories: TerritorioApi[];
  nodes: NodeApi[];
  connections: ConnectionApi[];
  activeAdventureZoneId: number | null;
  selectedNodeId: number | null;
  onSelectNode: (id: number) => void;
}) {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const arrastandoRef = useRef(false);
  const ultimaPosicaoRef = useRef({ x: 0, y: 0 });
  // Ponteiros ativos (touch/pinch) — 2 pontos = gesto de pinça.
  const ponteirosRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const distanciaPinchInicialRef = useRef<number | null>(null);
  const escalaPinchInicialRef = useRef(1);

  const clamparEscala = useCallback((valor: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, valor)), []);

  function aoRodarRoda(evento: React.WheelEvent) {
    evento.preventDefault();
    setScale((atual) => clamparEscala(atual - evento.deltaY * 0.001));
  }

  function aoPressionarPonteiro(evento: React.PointerEvent) {
    viewportRef.current?.setPointerCapture(evento.pointerId);
    ponteirosRef.current.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });

    if (ponteirosRef.current.size === 1) {
      arrastandoRef.current = true;
      ultimaPosicaoRef.current = { x: evento.clientX, y: evento.clientY };
    } else if (ponteirosRef.current.size === 2) {
      arrastandoRef.current = false;
      const [a, b] = Array.from(ponteirosRef.current.values());
      distanciaPinchInicialRef.current = Math.hypot(a.x - b.x, a.y - b.y);
      escalaPinchInicialRef.current = scale;
    }
  }

  function aoMoverPonteiro(evento: React.PointerEvent) {
    if (!ponteirosRef.current.has(evento.pointerId)) return;
    ponteirosRef.current.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });

    if (ponteirosRef.current.size === 2 && distanciaPinchInicialRef.current) {
      const [a, b] = Array.from(ponteirosRef.current.values());
      const distanciaAtual = Math.hypot(a.x - b.x, a.y - b.y);
      const fator = distanciaAtual / distanciaPinchInicialRef.current;
      setScale(clamparEscala(escalaPinchInicialRef.current * fator));
      return;
    }

    if (arrastandoRef.current && ponteirosRef.current.size === 1) {
      const dx = evento.clientX - ultimaPosicaoRef.current.x;
      const dy = evento.clientY - ultimaPosicaoRef.current.y;
      ultimaPosicaoRef.current = { x: evento.clientX, y: evento.clientY };
      setTx((atual) => atual + dx);
      setTy((atual) => atual + dy);
    }
  }

  function aoSoltarPonteiro(evento: React.PointerEvent) {
    ponteirosRef.current.delete(evento.pointerId);
    if (ponteirosRef.current.size < 2) distanciaPinchInicialRef.current = null;
    if (ponteirosRef.current.size === 0) arrastandoRef.current = false;
  }

  function centralizar() {
    setScale(1);
    setTx(0);
    setTy(0);
  }

  return (
    <div className="relative h-full w-full">
      <div
        ref={viewportRef}
        onWheel={aoRodarRoda}
        onPointerDown={aoPressionarPonteiro}
        onPointerMove={aoMoverPonteiro}
        onPointerUp={aoSoltarPonteiro}
        onPointerCancel={aoSoltarPonteiro}
        className="h-full w-full touch-none overflow-hidden"
      >
        <div
          className="relative aspect-[16/10] w-full origin-center"
          style={{ transform: `translate(${tx}px, ${ty}px) scale(${scale})` }}
        >
          {/* Arte base — mapa-caelum.webp ainda não existe (spec §24);
              placeholder de gradiente no estilo pergaminho/dourado já
              usado no resto do jogo, até a arte final chegar. */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#3a2f24] via-[#292018] to-[#1a1410]" />
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(ellipse_at_center,rgba(243,180,63,0.08),transparent_70%)]" />

          <WorldMapTerritoryLayer territories={territories} />
          <WorldMapConnectionLayer nodes={nodes} connections={connections} />

          {nodes.map((node) => (
            <WorldMapNodePin
              key={node.id}
              node={node}
              selecionado={node.id === selectedNodeId}
              ativoAgora={node.tipo === "Adventure" && node.adventure?.zona_id === activeAdventureZoneId}
              onClick={() => onSelectNode(node.id)}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={centralizar}
        className="absolute bottom-3 right-3 rounded-full border-2 border-[#F3B43F] bg-black/70 px-3 py-1.5 text-xs font-bold text-[#F3B43F] shadow-lg transition hover:bg-black/90"
      >
        Centralizar
      </button>
    </div>
  );
}
