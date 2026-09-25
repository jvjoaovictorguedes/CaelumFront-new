"use client";

// Boss Global — faixa fixa no topo, visível em TODO o dashboard,
// enquanto houver uma Ameaça Mundial descoberta (DISCOVERED) ou ativa
// (ACTIVE). Some sozinha assim que o status voltar pra "Nenhum"
// (derrotada, cancelada, ou nenhum evento visível) — o mesmo
// pressuposto do status público: o mundo só sabe que existe algo a
// partir da descoberta.
import Link from "next/link";
import { useWorldBossSocket } from "@/contexts/WorldBossSocketContext";

export default function WorldBossGlobalAlert() {
  const { status } = useWorldBossSocket();

  if (!status || (status.status !== "DISCOVERED" && status.status !== "ACTIVE")) return null;

  const desperta = status.status === "DISCOVERED";

  return (
    <Link
      href="/dashboard/quests"
      className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-3 bg-gradient-to-r from-red-900 via-red-700 to-red-900 px-4 py-2 text-center text-sm font-bold text-white shadow-lg hover:brightness-110"
    >
      <span className="animate-pulse">⚠</span>
      <span>
        {desperta
          ? `Uma Ameaça Mundial foi descoberta: ${status.nome}! Prepare-se — ela despertará em instantes.`
          : `Ameaça Mundial ativa: ${status.nome} — HP ${status.hp_percentual?.toFixed(1)}%. Clique para se juntar à luta.`}
      </span>
      <span className="animate-pulse">⚠</span>
    </Link>
  );
}
