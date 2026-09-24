"use client";

import { useEffect, useRef, useState } from "react";
import { useMusic } from "@/contexts/MusicContext";

// Botão flutuante de música (canto da tela) — substitui o MusicControls
// que ficava no rodapé da sidebar: lá embaixo ninguém achava pra
// abaixar o som, e durante um combate (CombatArena é fixed inset-0
// z-[70]/z-[80]) a sidebar inteira fica coberta e o controle antigo
// fica impossível de clicar. Fixo na própria página (z-[200], acima de
// qualquer overlay de combate) resolve os dois problemas de uma vez —
// aparece em cima de tudo, sempre no mesmo canto.
export default function FloatingMusicWidget() {
  const { volume, muted, toggleMuted, setVolume, currentTrack } = useMusic();
  const [aberto, setAberto] = useState(false);
  const raizRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(evento: MouseEvent) {
      if (!raizRef.current?.contains(evento.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [aberto]);

  return (
    <div ref={raizRef} className="fixed right-3 top-3 z-[200] sm:right-4 sm:top-4">
      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        aria-expanded={aberto}
        aria-label={aberto ? "Fechar controle de música" : "Abrir controle de música"}
        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#F3B43F] bg-[#292018]/90 text-lg text-[#F3B43F] shadow-lg backdrop-blur-sm transition-colors hover:bg-[#292018]"
      >
        {muted ? "🔇" : "🔊"}
      </button>

      {aberto && (
        <div className="absolute right-0 top-12 w-56 rounded-xl border-2 border-[#F3B43F]/70 bg-[#292018]/95 p-3 text-white shadow-xl backdrop-blur-sm">
          {currentTrack && (
            <p className="mb-2 truncate text-xs text-white/60" title={currentTrack.key}>
              Tocando: {currentTrack.key}
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMuted}
              aria-pressed={muted}
              aria-label={muted ? "Ativar música" : "Silenciar música"}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#F3B43F]/60 bg-black/30 text-sm transition-colors hover:bg-black/50"
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
              className="h-1.5 w-full accent-[#F3B43F] disabled:opacity-40"
            />
          </div>
        </div>
      )}
    </div>
  );
}
