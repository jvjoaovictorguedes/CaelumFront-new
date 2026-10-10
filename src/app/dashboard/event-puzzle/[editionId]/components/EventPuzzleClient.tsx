"use client";
import { useState } from "react";
import EventPuzzleSalasPanel from "./EventPuzzleSalasPanel";
import EventPuzzleCadernoPanel from "./EventPuzzleCadernoPanel";
import EventPuzzleLendasPanel from "./EventPuzzleLendasPanel";
import EventPuzzleCustodioPanel from "./EventPuzzleCustodioPanel";

type Aba = "salas" | "caderno" | "lendas" | "custodio";

const ABAS: { id: Aba; rotulo: string }[] = [
  { id: "salas", rotulo: "Câmaras" },
  { id: "caderno", rotulo: "Caderno" },
  { id: "lendas", rotulo: "Pioneiros" },
  { id: "custodio", rotulo: "Custódio" },
];

// "O Coração da Máquina Celestial" — Fase 16. Mesma estrutura de abas
// de TempleClient.tsx (src/app/dashboard/temple/TempleClient.tsx), só
// que aqui não existe um "status de evento adormecido" pra checar — a
// própria rota /dashboard/event-puzzle só chega até aqui quando já
// existe uma edição ACTIVE (ver page.tsx anterior na cadeia).
export default function EventPuzzleClient({ editionId }: { editionId: number }) {
  const [aba, setAba] = useState<Aba>("salas");

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-[#F3B43F]/40 bg-[#292018]/60 p-5 text-white">
        <div className="flex flex-wrap gap-2">
          {ABAS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAba(item.id)}
              className={`rounded-lg px-4 py-2 text-sm font-bold uppercase tracking-widest transition ${
                aba === item.id ? "bg-[#BC8418] text-black" : "border border-white/20 text-white/70 hover:bg-white/10"
              }`}
            >
              {item.rotulo}
            </button>
          ))}
        </div>
      </div>

      {aba === "salas" && <EventPuzzleSalasPanel editionId={editionId} />}
      {aba === "caderno" && <EventPuzzleCadernoPanel editionId={editionId} />}
      {aba === "lendas" && <EventPuzzleLendasPanel editionId={editionId} />}
      {aba === "custodio" && <EventPuzzleCustodioPanel editionId={editionId} />}
    </div>
  );
}
