"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
    // Clicar num pino de local (<button>, WorldMapNodePin) não pode virar
    // gesto de pan — setPointerCapture no viewport redireciona TAMBÉM o
    // evento de click subsequente pro elemento que capturou (o próprio
    // viewport), não pro botão de verdade embaixo do cursor. Resultado:
    // o botão nunca recebia o click, e clicar num local pra abrir o
    // painel simplesmente não fazia nada (bug reportado). Ignorando o
    // pointerdown aqui quando ele começa em cima de um botão, o clique
    // segue o caminho normal do DOM sem a captura atrapalhar — arrastar
    // a partir do fundo do mapa continua funcionando normalmente. Reseta
    // hasDraggedRef ANTES do early return: senão, clicar um botão logo
    // depois de um arrasto de verdade herdava o hasDraggedRef=true do
    // gesto anterior (nunca mais resetado pra esse botão, já que ele não
    // passa mais pelo resto desta função) e o clique ficava suprimido
    // por engano.
    hasDraggedRef.current = false;
    if ((evento.target as HTMLElement).closest("button")) {
      return;
    }

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
      {/* Viewport/Máscara */}
      <div
        ref={viewportRef}
        onPointerDown={aoPressionarPonteiro}
        onPointerMove={aoMoverPonteiro}
        onPointerUp={aoSoltarPonteiro}
        onPointerCancel={aoSoltarPonteiro}
        className="h-full w-full touch-none flex items-center justify-center cursor-grab active:cursor-grabbing"
      >
        {/* Container do Mapa escalável e arrastável */}
        <div
          className="relative aspect-[16/10] w-full max-h-full max-w-full origin-center select-none"
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
              onClick={() => {
                if (!hasDraggedRef.current) {
                  onSelectNode(node.id);
                }
              }}
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