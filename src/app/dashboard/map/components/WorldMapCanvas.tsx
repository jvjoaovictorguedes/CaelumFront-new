"use client";

import { useCallback, useRef, useState } from "react";
import type { TerritorioApi, NodeApi, ConnectionApi } from "./WorldMapClient";
import WorldMapTerritoryLayer from "./WorldMapTerritoryLayer";
import WorldMapConnectionLayer from "./WorldMapConnectionLayer";
import WorldMapNodePin from "./WorldMapNode";

const ZOOM_MIN = 0.8;
const ZOOM_MAX = 2.5;

// Só zoom, sem pan — o mapa fica travado no lugar (feedback do
// jogador: arrastar com o mouse não deveria mover o mapa inteiro).
// Zoom por roda do mouse ou pinça de dois dedos, sem dependência nova
// (spec §25: "biblioteca leve, mapa ilustrado de fantasia — não precisa
// de API de mapa geográfico real").
//
// A versão anterior também arrastava com 1 ponteiro (mouse ou dedo) e
// chamava setPointerCapture no viewport em TODO pointerdown, inclusive
// o que começa em cima de um pino — isso sequestrava o pointerup/click
// seguinte pro viewport em vez do botão do pino (bug reportado: clicar
// numa área não abria o painel/redirecionava). Sem captura de ponteiro
// e sem esse branch de arrasto, o clique nos pinos volta a funcionar
// normalmente.
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

  // Ponteiros ativos (touch/pinch) — 2 pontos = gesto de pinça, o único
  // gesto que ainda mexe em algo (a escala) além da roda do mouse.
  const ponteirosRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const distanciaPinchInicialRef = useRef<number | null>(null);
  const escalaPinchInicialRef = useRef(1);

  const clamparEscala = useCallback((valor: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, valor)), []);

  function aoRodarRoda(evento: React.WheelEvent) {
    evento.preventDefault();
    setScale((atual) => clamparEscala(atual - evento.deltaY * 0.001));
  }

  function aoPressionarPonteiro(evento: React.PointerEvent) {
    ponteirosRef.current.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });
    if (ponteirosRef.current.size === 2) {
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
    }
  }

  function aoSoltarPonteiro(evento: React.PointerEvent) {
    ponteirosRef.current.delete(evento.pointerId);
    if (ponteirosRef.current.size < 2) distanciaPinchInicialRef.current = null;
  }

  function centralizar() {
    setScale(1);
  }

  return (
    <div className="relative h-full w-full">
      <div
        onWheel={aoRodarRoda}
        onPointerDown={aoPressionarPonteiro}
        onPointerMove={aoMoverPonteiro}
        onPointerUp={aoSoltarPonteiro}
        onPointerCancel={aoSoltarPonteiro}
        className="h-full w-full touch-none overflow-hidden"
      >
        <div
          className="relative aspect-[16/10] w-full origin-center"
          style={{ transform: `scale(${scale})` }}
        >
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
