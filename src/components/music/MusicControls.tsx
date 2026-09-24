"use client";

import { useMusic } from "@/contexts/MusicContext";

// Mute + volume (§10.1) — só CONSOME o MusicContext, nenhuma regra de
// reprodução mora aqui. Operável por teclado (input range nativo +
// botão) e não depende só de ícone pra indicar o estado.
export default function MusicControls() {
  const { volume, muted, toggleMuted, setVolume } = useMusic();

  return (
    <div className="flex w-full items-center gap-2 px-1 py-2">
      <button
        type="button"
        onClick={toggleMuted}
        aria-pressed={muted}
        aria-label={muted ? "Ativar música" : "Silenciar música"}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-black/40 bg-black/10 text-sm text-black transition-colors hover:bg-black/20"
      >
        {muted ? "🔇" : "🔊"}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        disabled={muted}
        onChange={(evento) => setVolume(Number(evento.target.value))}
        aria-label="Volume da música"
        className="h-1.5 w-full accent-black disabled:opacity-40"
      />
    </div>
  );
}
