"use client";

import type { NodeApi } from "./WorldMapClient";

// Ícone por tipo de Node — placeholder funcional (não emoji "final",
// spec §28 pede ícones próprios do Caelum) até existirem os assets
// reais; troca é só trocar o glifo aqui ou usar `icone_url` quando
// existir (já vem pronto na API, só não tem imagem cadastrada ainda).
const GLIFO_POR_TIPO: Record<NodeApi["tipo"], string> = {
  Adventure: "⚔",
  Expedition: "⛏",
  City: "⛭",
  Service: "◆",
  Landmark: "◈",
};

function corDoPerigo(perigo?: string) {
  switch (perigo) {
    case "EXTREMO":
      return "bg-red-600";
    case "ALTO":
      return "bg-orange-500";
    case "MEDIO":
      return "bg-yellow-500";
    default:
      return null;
  }
}

// Estados visuais (spec §28): normal / hover (CSS) / selecionado (anel
// dourado) / bloqueado (dessaturado — Expedição não desbloqueada) /
// perigo extremo (indicador vermelho) / atividade atual (marcador
// pulsante — sessão de Aventura ativa nessa zona agora).
export default function WorldMapNodePin({
  node,
  selecionado,
  ativoAgora,
  onClick,
}: {
  node: NodeApi;
  selecionado: boolean;
  ativoAgora: boolean;
  onClick: () => void;
}) {
  const bloqueado = node.tipo === "Expedition" && node.expedition?.desbloqueada === false;
  const corPerigo = node.tipo === "Adventure" ? corDoPerigo(node.adventure?.perigo) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      title={node.nome}
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
      className={`group absolute z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 bg-[#292018] text-sm shadow-lg transition hover:z-20 hover:scale-110 ${
        selecionado
          ? "border-[#F3B43F] ring-2 ring-[#F3B43F] ring-offset-2 ring-offset-[#1a1410]"
          : "border-[#F3B43F]/60 hover:border-[#F3B43F]"
      } ${bloqueado ? "opacity-45 grayscale" : ""}`}
    >
      <span aria-hidden="true">{GLIFO_POR_TIPO[node.tipo]}</span>

      {corPerigo && (
        <span className={`pointer-events-none absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ${corPerigo}`} />
      )}

      {ativoAgora && (
        <span className="pointer-events-none absolute inset-0 animate-ping rounded-full border-2 border-[#F3B43F]" />
      )}

      <span className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-black/90 px-1.5 py-0.5 text-[10px] font-bold text-white opacity-0 shadow transition-opacity group-hover:opacity-100">
        {node.nome}
      </span>
    </button>
  );
}
