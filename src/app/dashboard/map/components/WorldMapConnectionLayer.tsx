"use client";

import type { NodeApi, ConnectionApi } from "./WorldMapClient";

// Estradas puramente visuais (spec §22) — não bloqueiam nada, só
// desenham a rota entre dois Nodes. Some sozinha se um dos dois
// pontos estiver fora do filtro atual (o Node não está em `nodes`).
export default function WorldMapConnectionLayer({
  nodes,
  connections,
}: {
  nodes: NodeApi[];
  connections: ConnectionApi[];
}) {
  const nodePorId = new Map(nodes.map((n) => [n.id, n]));

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      {connections.map((c) => {
        const origem = nodePorId.get(c.id_origem);
        const destino = nodePorId.get(c.id_destino);
        if (!origem || !destino) return null;
        return (
          <line
            key={c.id}
            x1={origem.x}
            y1={origem.y}
            x2={destino.x}
            y2={destino.y}
            stroke="rgba(243,180,63,0.25)"
            strokeWidth={0.2}
            strokeDasharray="0.8 0.8"
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}
