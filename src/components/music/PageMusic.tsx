"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useMusic } from "@/contexts/MusicContext";
import { useMusicConfig } from "@/contexts/MusicConfigContext";
import { MUSIC_PRIORITY, type MusicTrack } from "@/constants/music";
import { prioridadeDoSlot, type MusicSlotKey } from "@/constants/musicSlots";

interface PageMusicPropsPorSlot {
  slot: MusicSlotKey;
  track?: never;
  stop?: never;
  priority?: never;
  fadeMs?: number;
}

interface PageMusicPropsLegado {
  slot?: never;
  // Forma antiga (`track` fixo em código) — mantida só pra qualquer
  // tela que ainda não migrou; a forma recomendada agora é `slot`
  // (§12.2), resolvida pelo Painel Administrativo de Músicas via
  // MusicConfigContext.
  track?: MusicTrack;
  stop?: boolean;
  priority?: number;
  fadeMs?: number;
}

type PageMusicProps = PageMusicPropsPorSlot | PageMusicPropsLegado;

// Declaração de música por página (§5/§12.2) — não renderiza nada
// visível. Registra uma solicitação ao montar e a remove ao desmontar;
// quem decide o que toca de fato é sempre o MusicProvider (prioridades +
// estado global), nunca este componente.
export default function PageMusic(props: PageMusicProps) {
  const pathname = usePathname();
  const { requestMusic, releaseMusic } = useMusic();
  const { resolverSlot } = useMusicConfig();
  const ownerId = `page:${pathname}`;

  const usandoSlot = "slot" in props && !!props.slot;
  const priority = usandoSlot ? prioridadeDoSlot(props.slot as MusicSlotKey) : (props.priority ?? MUSIC_PRIORITY.PAGE);

  // Resolvido UMA vez por montagem (§9.2 — nenhum reroll de pool em
  // re-render); trocar de página remonta o componente (ownerId muda de
  // verdade), o que é exatamente quando uma nova ativação deveria
  // sortear de novo.
  const [resolvido] = useState(() => {
    if (usandoSlot) return resolverSlot(props.slot as MusicSlotKey);
    return null;
  });

  const track = usandoSlot ? resolvido?.track ?? null : (props as PageMusicPropsLegado).track ?? null;
  const stop = usandoSlot ? false : !!(props as PageMusicPropsLegado).stop;
  const fadeMs = props.fadeMs ?? resolvido?.fadeMs;

  useEffect(() => {
    if (!track && !stop) return undefined;
    requestMusic({ ownerId, track: stop ? null : track, priority, fadeMs });
    return () => releaseMusic(ownerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId, track?.key, stop, priority, fadeMs]);

  return null;
}
