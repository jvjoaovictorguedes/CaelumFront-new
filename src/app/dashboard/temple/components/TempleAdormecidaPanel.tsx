"use client";
import { useEffect, useState } from "react";
import type { TempleStatusApi } from "@/lib/api/temple";

// §13.1 — "O Templo está adormecido." + contagem até a próxima
// Convergência quando já existe uma SCHEDULED; sem nenhuma data
// conhecida, só o teaser de lore (ou nada, se o Templo nunca foi
// publicado nesta conta/servidor).
export default function TempleAdormecidaPanel({ status }: { status: TempleStatusApi | null }) {
  const scheduled = status?.status === "SCHEDULED" ? status : null;

  return (
    <div className="rounded-2xl border border-[#F3B43F]/40 bg-[#292018]/60 p-8 text-center text-white">
      <p className="text-sm uppercase tracking-widest text-[#F3B43F]/80">Templo do Véu Celestial</p>
      <h2 className="mt-2 font-imFeel text-3xl">O Templo está adormecido.</h2>

      {scheduled?.starts_at ? (
        <TempleProximaConvergencia startsAt={scheduled.starts_at} />
      ) : (
        <p className="mt-3 text-white/60">Nenhuma Convergência agendada por enquanto. Volte mais tarde.</p>
      )}

      {scheduled?.teaser && <p className="mx-auto mt-4 max-w-md text-sm italic text-white/50">&ldquo;{scheduled.teaser}&rdquo;</p>}
    </div>
  );
}

function TempleProximaConvergencia({ startsAt }: { startsAt: string }) {
  const [restanteMs, setRestanteMs] = useState(() => new Date(startsAt).getTime() - Date.now());

  useEffect(() => {
    const alvo = new Date(startsAt).getTime();
    const intervalo = setInterval(() => setRestanteMs(Math.max(0, alvo - Date.now())), 1000);
    return () => clearInterval(intervalo);
  }, [startsAt]);

  if (restanteMs <= 0) {
    return <p className="mt-3 text-white/60">A Convergência está prestes a começar...</p>;
  }

  const dias = Math.floor(restanteMs / 86400000);
  const horas = Math.floor((restanteMs % 86400000) / 3600000);
  const minutos = Math.floor((restanteMs % 3600000) / 60000);

  return (
    <p className="mt-3 text-lg text-white/80">
      Próxima Convergência:{" "}
      <span className="font-imFeel text-[#F3B43F]">
        {dias > 0 ? `${dias}d ` : ""}
        {horas}h {minutos}m
      </span>
    </p>
  );
}
