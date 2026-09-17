"use client";

import { useState, type ReactNode } from "react";

type AbaId = "equipamentos" | "habilidades" | "atributos";

const ABAS: { id: AbaId; label: string }[] = [
  { id: "equipamentos", label: "Equipamentos" },
  { id: "habilidades", label: "Habilidades" },
  { id: "atributos", label: "Atributos" },
];

export default function CharacterTabs({
  equipamentos,
  habilidades,
  atributos,
}: {
  equipamentos: ReactNode;
  habilidades: ReactNode;
  atributos: ReactNode;
}) {
  const [abaAtiva, setAbaAtiva] = useState<AbaId>("equipamentos");

  const conteudoPorAba: Record<AbaId, ReactNode> = {
    equipamentos,
    habilidades,
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
