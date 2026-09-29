"use client";

// Ameaça Mundial V2 §18.2 — cast perigoso muito legível: nome/ícone do
// Power + contagem regressiva baseada em resolves_at (servidor
// autoritativo). O componente SÓ anima a diferença de tempo local —
// nunca decide quando o cast de fato resolve (isso chega via
// worldboss:boss-acao/estado, nunca por este timer).
import { useEffect, useState } from "react";

export default function WorldBossCastCountdown({ nome, imagemUrl, resolvesAt }: { nome: string; imagemUrl: string | null; resolvesAt: string }) {
  const [restanteMs, setRestanteMs] = useState(() => new Date(resolvesAt).getTime() - Date.now());

  useEffect(() => {
    const alvo = new Date(resolvesAt).getTime();
    const intervalo = setInterval(() => setRestanteMs(Math.max(0, alvo - Date.now())), 100);
    return () => clearInterval(intervalo);
  }, [resolvesAt]);

  const segundos = Math.max(0, restanteMs / 1000);

  return (
    <div className="flex items-center gap-3 rounded-xl border-2 border-red-500 bg-red-950/60 p-3 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
      {imagemUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imagemUrl} alt={nome} className="h-10 w-10 rounded-lg border border-red-400" />
      )}
      <div className="flex-1">
        <p className="text-xs font-bold uppercase tracking-wide text-red-300">Conjurando</p>
        <p className="font-imFeel text-lg text-white">{nome}</p>
      </div>
      <p className="font-imFeel text-2xl tabular-nums text-red-300">{segundos.toFixed(1)}s</p>
    </div>
  );
}
