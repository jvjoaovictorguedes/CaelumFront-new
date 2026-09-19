"use client";

import { useRouter } from "next/navigation";

// Lista de monstros vem da ZONA ATUAL (§27 da spec do Modo Aventura —
// o servidor manda o suficiente pro frontend montar isso sem inventar a
// própria regra), não mais uma lista fixa igual dos dois lados: antes
// da Aventura ser zona-gated não existia catálogo nenhum, então isso
// era hardcoded aqui E em combatController.js.
interface MonstroDaZona {
  nome: string;
  tipo_aparicao: "Comum" | "Raro";
}

export default function HuntTargetSelector({
  monstros,
  alvoAtual,
}: {
  monstros: MonstroDaZona[];
  alvoAtual: string | null;
}) {
  const router = useRouter();

  function selecionar(nome: string | null) {
    router.push(nome ? `/dashboard/adventure?alvo=${encodeURIComponent(nome)}` : "/dashboard/adventure");
  }

  if (monstros.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#F3B43F]/30 bg-[#292018]/80 px-3 py-2 text-xs">
      <span className="mr-1 font-bold uppercase tracking-wide text-[#F3B43F]/80">Caçar:</span>
      <button
        type="button"
        onClick={() => selecionar(null)}
        className={`rounded-full px-2.5 py-1 font-bold transition ${
          !alvoAtual
            ? "bg-[#F3B43F] text-black"
            : "bg-black/30 text-white/60 hover:text-white"
        }`}
      >
        Aleatório
      </button>
      {monstros.map(({ nome, tipo_aparicao }) => (
        <button
          key={nome}
          type="button"
          onClick={() => selecionar(nome)}
          className={`rounded-full px-2.5 py-1 font-bold transition ${
            alvoAtual === nome
              ? "bg-[#F3B43F] text-black"
              : "bg-black/30 text-white/60 hover:text-white"
          } ${tipo_aparicao === "Raro" ? "ring-1 ring-[#F3B43F]/70" : ""}`}
        >
          {nome}
          {tipo_aparicao === "Raro" ? " ★" : ""}
        </button>
      ))}
    </div>
  );
}
