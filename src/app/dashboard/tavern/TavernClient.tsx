"use client";

import { useState } from "react";
import { useCharacter } from "@/contexts/CharacterContext";
import TavernRestPanel from "./components/TavernRestPanel";
import TavernMenuPanel from "./components/TavernMenuPanel";
import TavernGamesPanel from "./components/TavernGamesPanel";

type Aba = "descanso" | "cardapio" | "jogos";

const ABAS: { id: Aba; rotulo: string }[] = [
  { id: "descanso", rotulo: "Hospedagem" },
  { id: "cardapio", rotulo: "Cardápio" },
  { id: "jogos", rotulo: "Jogos" },
];

export default function TavernClient() {
  const { character } = useCharacter();
  const [aba, setAba] = useState<Aba>("descanso");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-3">
        <div className="flex gap-2">
          {ABAS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAba(item.id)}
              className={`rounded-lg px-4 py-2 text-sm font-bold uppercase tracking-widest transition ${
                aba === item.id
                  ? "bg-[#BC8418] text-black"
                  : "border border-white/20 text-white/70 hover:bg-white/10"
              }`}
            >
              {item.rotulo}
            </button>
          ))}
        </div>
        <div className="rounded-lg bg-black/30 px-3 py-1.5 text-sm text-white">
          <span className="text-white/60">Seu Gold:</span>{" "}
          <span className="font-bold text-[#F3B43F]">{character?.dinheiro ?? 0}</span>
        </div>
      </div>

      {aba === "descanso" && <TavernRestPanel />}
      {aba === "cardapio" && <TavernMenuPanel />}
      {aba === "jogos" && <TavernGamesPanel />}
    </div>
  );
}
