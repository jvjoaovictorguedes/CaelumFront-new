"use client";

import type { TerritorioApi } from "./WorldMapClient";

// Fronteiras discretas + leve preenchimento, todas "Neutro" (spec §15)
// — nenhuma cor de Guilda ainda, controle territorial fica pra depois
// (§16/§47). SVG com viewBox 0-100 casa direto com as coordenadas
// percentuais de polygon_points, sem conversão nenhuma.
export default function WorldMapTerritoryLayer({ territories }: { territories: TerritorioApi[] }) {
  return (
    <>
      <img src="/image/map/map.webp" alt="Mapa do jogo" />
        {territories.map((t) => (
          <polygon
            key={t.id}
            points={t.polygon.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="rgba(243,180,63,0.05)"
            stroke="rgba(243,180,63,0.35)"
            strokeWidth={0.15}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      {territories.map((t) => (
        <div
          key={t.id}
          title="Controle territorial ainda não disponível"
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-[#F3B43F]/30 bg-black/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#F3B43F]/70"
          style={{ left: `${t.label.x}%`, top: `${t.label.y}%` }}
        >
          {t.nome}
        </div>
      ))}
    </>
  );
}
