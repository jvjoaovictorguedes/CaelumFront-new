"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TerritorioApi, NodeApi, ConnectionApi } from "./WorldMapClient";
import WorldMapTerritoryLayer from "./WorldMapTerritoryLayer";
import WorldMapConnectionLayer from "./WorldMapConnectionLayer";
import WorldMapNodePin from "./WorldMapNode";

const ZOOM_MIN = 0.8;
const ZOOM_MAX = 2.5;

// Mapa redondo (pedido do jogador: "deixar redondo o mapa") — a janela
// circular é mais estreita (diâmetro) do que o mapa (aspect-[16/10]) é
// alto, então sem compensar apareceria fundo vazio em cima/embaixo do
// círculo. BASE_ESCALA (16/10) amplia o conteúdo o suficiente pra cobrir
// o círculo inteiro em qualquer zoom — aplicado por CIMA do `scale` do
// usuário via transform, nunca mexendo no tamanho/aspect do container
// real, então as posições percentuais dos Nodes continuam exatamente
// onde sempre estiveram (só ficam visualmente maiores).
const BASE_ESCALA = 16 / 10;

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

  const viewportRef = useRef<HTMLDivElement>(null);

  // Estado para controlar o arrasto (Pan)
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const pointerStartPosRef = useRef({ x: 0, y: 0 });
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

  // Registra o evento de roda de forma não-passiva para permitir o preventDefault()
  useEffect(() => {
    const elemento = viewportRef.current;
    if (!elemento) return;

    const tratarRoda = (evento: WheelEvent) => {
      evento.preventDefault();
      setScale((atual) => clamparEscala(atual - evento.deltaY * 0.001));
    };

    elemento.addEventListener("wheel", tratarRoda, { passive: false });

    return () => {
      elemento.removeEventListener("wheel", tratarRoda);
    };
  }, [clamparEscala]);

  function aoPressionarPonteiro(evento: React.PointerEvent) {
    try {
      (evento.currentTarget as HTMLElement).setPointerCapture(evento.pointerId);
    } catch {}

    ponteirosRef.current.set(evento.pointerId, {
      x: evento.clientX,
      y: evento.clientY,
    });

    if (ponteirosRef.current.size === 2) {
      const [a, b] = Array.from(ponteirosRef.current.values());
      distanciaPinchInicialRef.current = Math.hypot(a.x - b.x, a.y - b.y);
      escalaPinchInicialRef.current = scale;
      isDraggingRef.current = false;
      hasDraggedRef.current = true;
      return;
    }

    if (evento.isPrimary) {
      isDraggingRef.current = true;
      hasDraggedRef.current = false;
      pointerStartPosRef.current = { x: evento.clientX, y: evento.clientY };
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
      const dx = Math.abs(evento.clientX - pointerStartPosRef.current.x);
      const dy = Math.abs(evento.clientY - pointerStartPosRef.current.y);

      if (dx > 5 || dy > 5) {
        hasDraggedRef.current = true;
      }

      const newX = evento.clientX - dragStartRef.current.x;
      const newY = evento.clientY - dragStartRef.current.y;

      const newPos = { x: newX, y: newY };
      positionRef.current = newPos;
      setPosition(newPos);
    }
  }

  function aoSoltarPonteiro(evento: React.PointerEvent) {
    try {
      (evento.currentTarget as HTMLElement).releasePointerCapture(evento.pointerId);
    } catch {}

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
      {/* Moldura redonda — wrapper quadrado que define o tamanho real do
          "medalhão"; viewport e botão de centralizar compartilham essa
          mesma caixa, então o botão fica ancorado na borda do círculo em
          vez de flutuar solto no espaço vazio ao redor dele. */}
      <div className="relative aspect-square h-full max-h-full max-w-full">
        {/* Viewport/Máscara — circular (rounded-full + overflow-hidden). */}
        <div
          ref={viewportRef}
          onPointerDown={aoPressionarPonteiro}
          onPointerMove={aoMoverPonteiro}
          onPointerUp={aoSoltarPonteiro}
          onPointerCancel={aoSoltarPonteiro}
          className="absolute inset-0 touch-none flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden rounded-full border-4 border-[#F3B43F] shadow-[0_0_35px_rgba(243,180,63,0.25)]"
        >
          {/* Container do Mapa escalável e arrastável */}
          <div
            className="relative aspect-[16/10] w-full max-h-full max-w-full origin-center select-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${BASE_ESCALA * scale})`,
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
                onClick={() => {
                  if (!hasDraggedRef.current) {
                    onSelectNode(node.id);
                  }
                }}
              />
            ))}
          </div>
        </div>

        {/* Botão de Centralizar, ancorado na borda do medalhão */}
        <button
          type="button"
          onClick={centralizar}
          className="absolute bottom-2 right-2 z-10 rounded-full border-2 border-[#F3B43F] bg-black/70 px-3 py-1.5 text-xs font-bold text-[#F3B43F] shadow-lg transition hover:bg-black/90 cursor-pointer"
        >
          Centralizar
        </button>
      </div>
    </div>
  );
}