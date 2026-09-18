"use client";

import { useState, type ReactNode } from "react";

type AbaId = "equipamentos" | "materiais" | "consumiveis";

const ABAS: { id: AbaId; label: string }[] = [
  { id: "equipamentos", label: "Meus Equipamentos" },
  { id: "materiais", label: "Meus Materiais" },
  { id: "consumiveis", label: "Meus Consumíveis" },
];

export default function InventoryTabs({
  equipamentos,
  materiais,
  consumiveis,
}: {
  equipamentos: ReactNode;
  materiais: ReactNode;
  consumiveis: ReactNode;
}) {
  const [abaAtiva, setAbaAtiva] = useState<AbaId>("equipamentos");

  const conteudoPorAba: Record<AbaId, ReactNode> = {
    equipamentos,
    materiais,
    consumiveis,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-2 rounded-2xl border border-black/10 bg-[#3a2f24] p-2 shadow-lg sm:grid-cols-3">
        {ABAS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setAbaAtiva(id)}
            className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wide transition sm:text-sm ${
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
