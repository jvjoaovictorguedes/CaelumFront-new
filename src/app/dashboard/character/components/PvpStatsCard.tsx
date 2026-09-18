"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";

interface PvpStatusResponse {
  data?: {
    pvpStatus?: {
      vitorias: number;
      derrotas: number;
      patenteArena: string;
    };
  };
}

export default function PvpStatsCard({ characterId }: { characterId: number }) {
  const [status, setStatus] = useState<{
    vitorias: number;
    derrotas: number;
    patenteArena: string;
  } | null>(null);

  useEffect(() => {
    let cancelado = false;
    axiosInstance
      .get<PvpStatusResponse>(`/pvp/status/${characterId}`)
      .then((resposta) => {
        if (!cancelado && resposta.data?.data?.pvpStatus) {
          setStatus(resposta.data.data.pvpStatus);
        }
      })
      .catch((error) => console.error("Erro ao buscar status de PVP:", error));
    return () => {
      cancelado = true;
    };
  }, [characterId]);

  return (
    <div className="rounded-2xl border border-black/10 bg-[#3a2f24] p-5 shadow-lg">
      <p className="mb-3 font-imFeel text-xl text-[#F3B43F]">Arena</p>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-[#F3B43F]/50 p-3">
          <p className="text-xs text-black/70">Vitórias</p>
          <p className="text-xl font-bold">{status?.vitorias ?? "—"}</p>
        </div>
        <div className="rounded-lg bg-[#F3B43F]/50 p-3">
          <p className="text-xs text-black/70">Derrotas</p>
          <p className="text-xl font-bold">{status?.derrotas ?? "—"}</p>
        </div>
        <div className="rounded-lg bg-[#F3B43F]/50 p-3">
          <p className="text-xs text-black/70">Patente</p>
          <p className="text-lg font-bold">{status?.patenteArena ?? "—"}</p>
        </div>
      </div>
    </div>
  );
}
