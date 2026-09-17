"use client";

import { useState, type ReactNode } from "react";

type AbaId = "equipamentos" | "habilidades" | "evolucoes" | "atributos";

// A aba de Evoluções já está pronta e funcional por baixo (API, compra,
// árvore de pré-requisitos) — só some da navegação até o conteúdo real
// de cada evolução (nome/custo/bônus/imagem) ficar definido. Pra revelar
// depois, é só trocar pra true; nenhum outro código muda.
const EVOLUCOES_VISIVEIS = false;

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
      <div className="flex gap-2 rounded-2xl border border-black/10 bg-[#3a2f24] p-2 shadow-lg">
        {ABAS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setAbaAtiva(id)}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold uppercase tracking-wide transition sm:text-base ${
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
