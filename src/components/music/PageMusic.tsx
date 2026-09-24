"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useMusic } from "@/contexts/MusicContext";
import { MUSIC_PRIORITY, type MusicTrack } from "@/constants/music";

interface PageMusicProps {
  track?: MusicTrack;
  // Solicitação explícita de silêncio no escopo/prioridade desta
  // página — ausência do componente e intenção de parar NÃO são a
  // mesma coisa (§5.1).
  stop?: boolean;
  priority?: number;
  fadeMs?: number;
}

// Declaração de música por página (§5) — não renderiza nada visível.
// Registra uma solicitação ao montar e a remove ao desmontar; quem
// decide o que toca de fato é sempre o MusicProvider (prioridades +
// estado global), nunca este componente.
export default function PageMusic({ track, stop = false, priority = MUSIC_PRIORITY.PAGE, fadeMs }: PageMusicProps) {
  const pathname = usePathname();
  const { requestMusic, releaseMusic } = useMusic();
  const ownerId = `page:${pathname}`;

  useEffect(() => {
    if (!track && !stop) return undefined;
    requestMusic({ ownerId, track: stop ? null : (track ?? null), priority, fadeMs });
    return () => releaseMusic(ownerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId, track?.key, stop, priority, fadeMs]);

  return null;
}
