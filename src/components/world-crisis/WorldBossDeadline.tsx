"use client";
import { useEffect, useState } from "react";
import type { WorldBossStatusApi } from "@/lib/api/worldBoss";
export default function WorldBossDeadline({
  status,
}: {
  status: WorldBossStatusApi;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!status.combat_expires_at) {
      setRemaining(null);
      return;
    }
    const expires =
      Date.now() +
      (status.remaining_ms ??
        Math.max(0, new Date(status.combat_expires_at).getTime() - Date.now()));
    const tick = () => setRemaining(Math.max(0, expires - Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [status.combat_expires_at, status.remaining_ms]);
  if (remaining === null) return null;
  const seconds = Math.ceil(remaining / 1000);
  return (
    <p
      role="timer"
      className={`rounded-lg border px-3 py-2 text-center text-sm font-bold ${seconds < 300 ? "border-red-400/50 bg-red-950/80 text-red-200" : "border-[#F3B43F]/40 bg-[#292018] text-[#F3B43F]"}`}
    >
      {seconds === 0
        ? "Prazo encerrado — aguardando confirmação do servidor"
        : `Tempo restante: ${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m ${seconds % 60}s`}
    </p>
  );
}
