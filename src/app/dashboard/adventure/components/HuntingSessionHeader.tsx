"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import axiosInstance from "@/utils/axiosIntance";

export interface SessaoApi {
  id: number;
  id_area: number;
  area: { id: number; nome: string; imagem_url: string | null } | null;
  monstros_derrotados: number;
  raros_encontrados: number;
  xp_obtida: number;
  ouro_obtido: number;
  espolios_obtidos: number;
}

// Contadores ao vivo da sessão de caça (§16 da spec) — sempre o que o
// SERVIDOR já persistiu por kill, nunca acumulado no cliente.
export default function HuntingSessionHeader({ sessao }: { sessao: SessaoApi }) {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);

  async function sair() {
    setSaindo(true);
    try {
      await axiosInstance.post("/adventure/leave");
      router.refresh();
    } finally {
      setSaindo(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#F3B43F]/30 bg-[#292018]/80 px-4 py-2 text-white">
      <div>
        <p className="font-imFeel text-lg leading-tight">{sessao.area?.nome ?? "Área de Caça"}</p>
        <p className="text-xs text-white/60">
          Derrotados: {sessao.monstros_derrotados} · Raros: {sessao.raros_encontrados} · XP:{" "}
          {sessao.xp_obtida} · Ouro: {sessao.ouro_obtido} · Espólios: {sessao.espolios_obtidos}
        </p>
      </div>
      <button
        type="button"
        disabled={saindo}
        onClick={sair}
        className="rounded-lg border border-[#F3B43F]/50 px-3 py-1.5 text-sm font-bold text-[#F3B43F] transition hover:bg-[#F3B43F]/10 disabled:opacity-60"
      >
        {saindo ? "Saindo..." : "Retornar"}
      </button>
    </div>
  );
}
