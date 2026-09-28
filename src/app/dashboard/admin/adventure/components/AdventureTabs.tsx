"use client";

// Especificação "Admin de Aventura + Defesa/Poder de Monstros" v3 §1.1
// — navegação principal com 4 abas (Aparições saiu: o vínculo zona-
// monstro agora se edita dentro do próprio ZoneEditor).
export type AbaAdventure = "zonas" | "monstros" | "drops" | "simulador";

const ABAS: { chave: AbaAdventure; label: string }[] = [
  { chave: "zonas", label: "Zonas" },
  { chave: "monstros", label: "Monstros" },
  { chave: "drops", label: "Drops" },
  { chave: "simulador", label: "Simulador" },
];

export function AdventureTabs({ aba, onMudar }: { aba: AbaAdventure; onMudar: (aba: AbaAdventure) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto">
      {ABAS.map(({ chave, label }) => (
        <button
          key={chave}
          type="button"
          onClick={() => onMudar(chave)}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition ${aba === chave ? "bg-[#BC8418] text-black" : "bg-black/20 text-white/70 hover:text-white"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
