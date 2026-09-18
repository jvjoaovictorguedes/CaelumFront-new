"use client";

import { useState, type ReactNode } from "react";

type AbaId = "equipamentos" | "habilidades" | "evolucoes" | "atributos";

// Primeiro conteúdo real da árvore de Evolução (naturezas Ar e Escuridão)
// já está no ar — ver 20260926030000-evolucoes-ar-escuridao.js no back.
const EVOLUCOES_VISIVEIS = true;

const ABAS: { id: AbaId; label: string }[] = [
  { id: "equipamentos", label: "Equipamentos" },
  { id: "habilidades", label: "Habilidades" },
  ...(EVOLUCOES_VISIVEIS ? ([{ id: "evolucoes", label: "Evoluções" }] as const) : []),
  { id: "atributos", label: "Atributos" },
];

export default function CharacterTabs({
  equipamentos,
  habilidades,
  evolucoes,
  atributos,
}: {
  equipamentos: ReactNode;
  habilidades: ReactNode;
  evolucoes?: ReactNode;
  atributos: ReactNode;
}) {
  const [abaAtiva, setAbaAtiva] = useState<AbaId>("equipamentos");

  const conteudoPorAba: Record<AbaId, ReactNode> = {
    equipamentos,
    habilidades,
    evolucoes,
    atributos,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-black/10 bg-[#3a2f24] p-2 shadow-lg">
        {ABAS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setAbaAtiva(id)}
            className={`min-w-fit flex-1 whitespace-nowrap rounded-xl px-2 py-2 text-xs font-bold uppercase tracking-wide transition sm:px-3 sm:text-sm md:text-base ${
              abaAtiva === id
                ? "bg-[#F3B43F] text-black shadow"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {conteudoPorAba[abaAtiva]}
    </div>
  );
}
