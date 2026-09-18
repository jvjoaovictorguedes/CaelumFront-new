"use client";

import { useState, type ReactNode } from "react";

type AbaId =
  | "equipamentos"
  | "habilidades"
  | "status"
  | "classe"
  | "combate"
  | "informacoes";

const ABAS: { id: AbaId; label: string; icone?: string }[] = [
  { id: "equipamentos", label: "Equipamentos", icone: "/icons/ui/espada.png" },
  { id: "habilidades", label: "Habilidades", icone: "/icons/ui/chama.png" },
  { id: "status", label: "Status", icone: "/icons/ui/coracao.png" },
  { id: "classe", label: "Classe", icone: "/icons/ui/mago.png" },
  { id: "combate", label: "Combate", icone: "/icons/ui/espadas-cruzadas.png" },
  { id: "informacoes", label: "Informações", icone: "/icons/ui/engrenagem.png" },
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
        {ABAS.map(({ id, label, icone }) => (
          <button
            key={id}
            type="button"
            onClick={() => setAbaAtiva(id)}
            className={`flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 py-2 text-xs font-bold uppercase tracking-wide transition sm:px-3 sm:text-sm ${
              abaAtiva === id
                ? "bg-[#F3B43F] text-black shadow"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {icone && <img src={icone} alt="" className="h-6 w-6 shrink-0" />}
            {label}
          </button>
        ))}
      </div>

      {conteudoPorAba[abaAtiva]}
    </div>
  );
}
