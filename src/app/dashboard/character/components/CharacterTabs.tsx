"use client";

import { useState, type ReactNode } from "react";

type AbaId =
  | "equipamentos"
  | "habilidades"
  | "status"
  | "classe"
  | "combate"
  | "informacoes";

const ABAS: { id: AbaId; label: string }[] = [
  { id: "equipamentos", label: "Equipamentos" },
  { id: "habilidades", label: "Habilidades" },
  { id: "status", label: "Status" },
  { id: "classe", label: "Classe" },
  { id: "combate", label: "Combate" },
  { id: "informacoes", label: "Informações" },
];

export default function CharacterTabs({
  equipamentos,
  habilidades,
  status,
  classe,
  combate,
  informacoes,
}: {
  equipamentos: ReactNode;
  habilidades: ReactNode;
  status: ReactNode;
  classe: ReactNode;
  combate: ReactNode;
  informacoes: ReactNode;
}) {
  const [abaAtiva, setAbaAtiva] = useState<AbaId>("equipamentos");

  const conteudoPorAba: Record<AbaId, ReactNode> = {
    equipamentos,
    habilidades,
    status,
    classe,
    combate,
    informacoes,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-black/10 bg-[#3a2f24] p-2 shadow-lg sm:grid-cols-3">
        {ABAS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setAbaAtiva(id)}
            className={`whitespace-nowrap rounded-xl px-2 py-2 text-xs font-bold uppercase tracking-wide transition sm:px-3 sm:text-sm ${
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
