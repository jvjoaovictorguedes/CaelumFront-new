"use client";

import { useCallback, useRef, useState } from "react";
import type { TerritorioApi, NodeApi, ConnectionApi } from "./WorldMapClient";
import WorldMapTerritoryLayer from "./WorldMapTerritoryLayer";
import WorldMapConnectionLayer from "./WorldMapConnectionLayer";
import WorldMapNodePin from "./WorldMapNode";

const ZOOM_MIN = 0.8;
const ZOOM_MAX = 2.5;

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
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Estado para controlar o arrasto (Pan)
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });

  // Ponteiros ativos (touch/pinch)
  const ponteirosRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const distanciaPinchInicialRef = useRef<number | null>(null);
  const escalaPinchInicialRef = useRef(1);

  const clamparEscala = useCallback(
    (valor: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, valor)),
    []
  );

  function aoRodarRoda(evento: React.WheelEvent) {
    evento.preventDefault();
    setScale((atual) => clamparEscala(atual - evento.deltaY * 0.001));
  }

  function aoPressionarPonteiro(evento: React.PointerEvent) {
    // Adiciona ao mapa de ponteiros para o Zoom via Pinch/Touch
    ponteirosRef.current.set(evento.pointerId, {
      x: evento.clientX,
      y: evento.clientY,
    });

    if (ponteirosRef.current.size === 2) {
      const [a, b] = Array.from(ponteirosRef.current.values());
      distanciaPinchInicialRef.current = Math.hypot(a.x - b.x, a.y - b.y);
      escalaPinchInicialRef.current = scale;
      isDraggingRef.current = false;
      return;
    }

    // Inicia o Pan apenas no ponteiro principal (mouse/1 toque no mapa)
    if (evento.isPrimary) {
      isDraggingRef.current = true;
      dragStartRef.current = {
        x: evento.clientX - positionRef.current.x,
        y: evento.clientY - positionRef.current.y,
      };
    }
  }

  function aoMoverPonteiro(evento: React.PointerEvent) {
    if (!ponteirosRef.current.has(evento.pointerId)) return;
    ponteirosRef.current.set(evento.pointerId, {
      x: evento.clientX,
      y: evento.clientY,
    });

    // Zoom Pinch (2 dedos)
    if (ponteirosRef.current.size === 2 && distanciaPinchInicialRef.current) {
      const [a, b] = Array.from(ponteirosRef.current.values());
      const distanciaAtual = Math.hypot(a.x - b.x, a.y - b.y);
      const fator = distanciaAtual / distanciaPinchInicialRef.current;
      setScale(clamparEscala(escalaPinchInicialRef.current * fator));
      return;
    }

    // Movimentação/Pan (1 ponteiro)
    if (isDraggingRef.current && ponteirosRef.current.size === 1) {
      const newX = evento.clientX - dragStartRef.current.x;
      const newY = evento.clientY - dragStartRef.current.y;

      const newPos = { x: newX, y: newY };
      positionRef.current = newPos;
      setPosition(newPos);
    }
  }

  function aoSoltarPonteiro(evento: React.PointerEvent) {
    ponteirosRef.current.delete(evento.pointerId);
    if (ponteirosRef.current.size < 2) distanciaPinchInicialRef.current = null;
    if (ponteirosRef.current.size === 0) isDraggingRef.current = false;
  }

  function centralizar() {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    positionRef.current = { x: 0, y: 0 };
  }

  return (
    <div className="relative h-full w-full overflow-hidden flex items-center justify-center bg-black/40">
      {/* Viewport/Máscara */}
      <div
        onWheel={aoRodarRoda}
        onPointerDown={aoPressionarPonteiro}
        onPointerMove={aoMoverPonteiro}
        onPointerUp={aoSoltarPonteiro}
        onPointerCancel={aoSoltarPonteiro}
        className="h-full w-full touch-none flex items-center justify-center cursor-grab active:cursor-grabbing"
      >
        {/* Container do Mapa escalável e arrastável */}
        <div
          className="relative aspect-[16/10] w-full max-h-full max-w-full origin-center transition-transform duration-75 ease-out select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
        >
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(ellipse_at_center,rgba(243,180,63,0.08),transparent_70%)]" />
          <WorldMapTerritoryLayer territories={territories} />
          <WorldMapConnectionLayer nodes={nodes} connections={connections} />
          {nodes.map((node) => (
            <WorldMapNodePin
              key={node.id}
              node={node}
              selecionado={node.id === selectedNodeId}
              ativoAgora={
                node.tipo === "Adventure" &&
                node.adventure?.zona_id === activeAdventureZoneId
              }
              onClick={() => onSelectNode(node.id)}
            />
          ))}
        </div>
      </div>

      {/* Botão de Centralizar fixo no canto da tela */}
      <button
        type="button"
        onClick={centralizar}
        className="absolute bottom-3 right-3 z-10 rounded-full border-2 border-[#F3B43F] bg-black/70 px-3 py-1.5 text-xs font-bold text-[#F3B43F] shadow-lg transition hover:bg-black/90 cursor-pointer"
      >
        Centralizar
      </button>
    </div>
  );
}