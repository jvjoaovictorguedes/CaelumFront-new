"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import SmeltingPanel from "./SmeltingPanel";
import CraftingPanel from "./CraftingPanel";
import RefinementPanel from "./RefinementPanel";

export interface ProgressoForja {
  nivel: number;
  experiencia: number;
  xp_proximo_nivel: number | null;
}

type Aba = "fabricacao" | "fundicao" | "refinamento";

const ABAS: { chave: Aba; rotulo: string }[] = [
  { chave: "fabricacao", rotulo: "Fabricação" },
  { chave: "fundicao", rotulo: "Fundição" },
  { chave: "refinamento", rotulo: "Refinamento" },
];

export default function ForgeClient() {
  const [progresso, setProgresso] = useState<ProgressoForja | null>(null);
  const [aba, setAba] = useState<Aba>("fabricacao");
  const [carregando, setCarregando] = useState(true);

  const carregarProgresso = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{ data?: { progresso?: ProgressoForja } }>("/crafting/progress");
      setProgresso(resp.data?.data?.progresso ?? null);
    } catch (error) {
      console.error("Erro ao carregar progresso da Forja:", error);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarProgresso();
  }, [carregarProgresso]);

  if (carregando) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        Carregando Forja...
      </div>
    );
  }

  const nivel = progresso?.nivel ?? 1;
  const xp = progresso?.experiencia ?? 0;
  const xpProximo = progresso?.xp_proximo_nivel;
  const percentualXp = xpProximo ? Math.min(100, (xp / xpProximo) * 100) : 100;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm uppercase tracking-widest text-[#F3B43F]">Forja — Nível {nivel} / 10</p>
          <p className="text-xs text-white/60">
            XP {xp.toLocaleString("pt-BR")} / {xpProximo ? xpProximo.toLocaleString("pt-BR") : "MAX"}
          </p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/50">
          <div className="h-full bg-[#F3B43F]" style={{ width: `${percentualXp}%` }} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {ABAS.map((item) => (
          <button
            key={item.chave}
            type="button"
            onClick={() => setAba(item.chave)}
            className={`shrink-0 rounded-lg border-2 px-3 py-2 text-xs sm:px-4 sm:text-sm font-bold uppercase tracking-wide transition ${
              aba === item.chave
                ? "border-[#F3B43F] bg-[#F3B43F] text-black"
                : "border-[#F3B43F]/40 bg-[#292018]/90 text-[#F3B43F] hover:border-[#F3B43F]/70"
            }`}
          >
            {item.rotulo}
          </button>
        ))}
      </div>

      {aba === "fabricacao" && <CraftingPanel nivelForja={nivel} onProgressoMudou={carregarProgresso} />}
      {aba === "fundicao" && <SmeltingPanel nivelForja={nivel} onProgressoMudou={carregarProgresso} />}
      {aba === "refinamento" && <RefinementPanel nivelForja={nivel} onProgressoMudou={carregarProgresso} />}
    </div>
  );
}
