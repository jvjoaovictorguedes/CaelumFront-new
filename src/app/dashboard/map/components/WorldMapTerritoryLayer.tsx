"use client";

import type { TerritorioApi } from "./WorldMapClient";

// Fronteiras discretas + leve preenchimento, todas "Neutro" (spec §15)
// — nenhuma cor de Guilda ainda, controle territorial fica pra depois
// (§16/§47). SVG com viewBox 0-100 casa direto com as coordenadas
// percentuais de polygon_points, sem conversão nenhuma.
export default function WorldMapTerritoryLayer({ territories }: { territories: TerritorioApi[] }) {
  return (
    <>
      {/* draggable=false + pointer-events-none — sem isso, arrastar o mapa
          a partir de cima da imagem disparava o drag nativo do navegador
          (todo <img> é draggable por padrão), que sequestrava a sequência
          de ponteiro do pan customizado (WorldMapCanvas) e travava o mapa
          por completo (bug reportado: "não consigo ir pra lugar nenhum"). */}
      <img
        src="/images/map/map.webp"
        className="pointer-events-none w-full h-full select-none"
        alt="Mapa do jogo"
        draggable={false}
      />
      {/* <polygon> é um elemento SVG — precisa estar dentro de um <svg>
          pra ser válido; solto direto num Fragment ao lado de um <img> o
          navegador simplesmente não sabia o que fazer com a tag, então os
          contornos de território nunca apareciam. */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
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
      </svg>
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
