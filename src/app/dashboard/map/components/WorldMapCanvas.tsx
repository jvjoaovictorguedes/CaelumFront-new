"use client";

import type { TerritorioApi, NodeApi, ConnectionApi } from "./WorldMapClient";
import WorldMapTerritoryLayer from "./WorldMapTerritoryLayer";
import WorldMapConnectionLayer from "./WorldMapConnectionLayer";
import WorldMapNodePin from "./WorldMapNode";

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
  return (
    <div className="relative h-full w-full">
      <div className="h-full w-full overflow-hidden">
        <div className="relative aspect-[16/10] w-full">
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(ellipse_at_center,rgba(243,180,63,0.08),transparent_70%)]" />
          <WorldMapTerritoryLayer territories={territories} />
          <WorldMapConnectionLayer
            nodes={nodes}
            connections={connections}
          />
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
    </div>
  );
}