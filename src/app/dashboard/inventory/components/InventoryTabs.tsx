"use client";

import { useState, type ReactNode } from "react";

type AbaId = "equipamentos" | "materiais" | "consumiveis";

const ABAS: { id: AbaId; label: string; icone: string }[] = [
  { id: "equipamentos", label: "Meus Equipamentos", icone: "/icons/ui/espada.png" },
  { id: "materiais", label: "Meus Materiais", icone: "/icons/ui/engrenagem.png" },
  { id: "consumiveis", label: "Meus Consumíveis", icone: "/icons/ui/coracao.png" },
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
        {ABAS.map(({ id, label, icone }) => (
          <button
            key={id}
            type="button"
            onClick={() => setAbaAtiva(id)}
            className={`flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wide transition sm:text-sm ${
              abaAtiva === id
                ? "bg-[#F3B43F] text-black shadow"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <img src={icone} alt="" className="h-6 w-6 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {conteudoPorAba[abaAtiva]}
    </div>
  );
}
