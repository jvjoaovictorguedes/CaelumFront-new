"use client";

// Painel Administrativo de Músicas §12.2 — hook equivalente a
// <PageMusic slot="..." /> pra CONTEXTOS (combate, PvP, boss). Registra
// a solicitação ao montar/ativar (prioridade mais alta que PAGE,
// sobrepõe a música da página automaticamente — mecanismo já existente
// do MusicProvider, não reimplementado aqui) e libera ao desmontar; a
// página volta a vencer sozinha quando o contexto acaba (§8).
import { useEffect, useId, useRef, useState } from "react";
import { useMusic } from "@/contexts/MusicContext";
import { useMusicConfig } from "@/contexts/MusicConfigContext";
import { prioridadeDoSlot, type MusicSlotKey } from "@/constants/musicSlots";

// `activationKey`: pra componentes que ficam montados entre uma
// ativação e outra (ex.: PartyBattleArena entre uma batalha em grupo e
// a próxima) — muda a cada nova ativação (ex.: battleId) pra forçar um
// sorteio novo de pool, sem precisar remontar o componente inteiro.
// Componentes que já remontam por ativação (ex.: CombatArena por
// combate) podem simplesmente omitir.
export function useContextMusic(slot: MusicSlotKey, options: { ativo?: boolean; activationKey?: unknown } = {}) {
  const { ativo = true, activationKey } = options;
  const { requestMusic, releaseMusic } = useMusic();
  const { resolverSlot } = useMusicConfig();
  const instanceId = useId();
  const priority = prioridadeDoSlot(slot);

  // Sorteado uma única vez por ATIVAÇÃO — no mount, e de novo sempre
  // que activationKey mudar (§9.2: nunca em todo re-render).
  const [resolvido, setResolvido] = useState(() => resolverSlot(slot));
  const activationKeyRef = useRef(activationKey);
  const primeiraRenderRef = useRef(true);

  useEffect(() => {
    if (primeiraRenderRef.current) {
      primeiraRenderRef.current = false;
      return;
    }
    if (activationKey !== activationKeyRef.current) {
      activationKeyRef.current = activationKey;
      setResolvido(resolverSlot(slot));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activationKey]);

  const ownerId = `context:${slot}:${instanceId}`;

  useEffect(() => {
    if (!ativo || (activationKey !== undefined && !resolvido)) return undefined;
    requestMusic({ ownerId, track: resolvido.track, priority, fadeMs: resolvido.fadeMs });
    return () => releaseMusic(ownerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo, ownerId, resolvido]);

  return resolvido.track;
}
