"use client";
import { useState } from "react";
import type { Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "@/types/contracts/socketEvents";
import { createListenerScope } from "./listenerScope";
import type { DueloIniciadoPayload } from "@/types/contracts/pvp";
import type { RankedQueueUpdatePayload } from "@/types/contracts/ranked";
import type { RankedMatchFoundPayload } from "@/types/contracts/ranked";
import type { RankedRatingUpdatePayload } from "@/types/contracts/ranked";
import type { RankedOponenteDesconectadoPayload } from "@/types/contracts/ranked";
import type { usePvpState } from "./pvp";

export function useRankedState() {
  const [filaRanked, setFilaRanked] = useState<RankedQueueUpdatePayload | null>(
    null,
  );
  const [matchEncontradoRanked, setMatchEncontradoRanked] =
    useState<RankedMatchFoundPayload | null>(null);
  const [ratingUpdate, setRatingUpdate] =
    useState<RankedRatingUpdatePayload | null>(null);
  const [oponenteDesconectadoRanked, setOponenteDesconectadoRanked] =
    useState<RankedOponenteDesconectadoPayload | null>(null);
  return {
    filaRanked,
    setFilaRanked,
    matchEncontradoRanked,
    setMatchEncontradoRanked,
    ratingUpdate,
    setRatingUpdate,
    oponenteDesconectadoRanked,
    setOponenteDesconectadoRanked,
  };
}

export function registerRankedListeners(
  socket: Socket,
  dependencies: {
    setFilaRanked: ReturnType<typeof useRankedState>["setFilaRanked"];
    setMatchEncontradoRanked: ReturnType<
      typeof useRankedState
    >["setMatchEncontradoRanked"];
    setDesafioRecebido: ReturnType<typeof usePvpState>["setDesafioRecebido"];
    setDesafioEnviadoPara: ReturnType<
      typeof usePvpState
    >["setDesafioEnviadoPara"];
    setResultadoFinal: ReturnType<typeof usePvpState>["setResultadoFinal"];
    setRatingUpdate: ReturnType<typeof useRankedState>["setRatingUpdate"];
    setOponenteDesconectadoRanked: ReturnType<
      typeof useRankedState
    >["setOponenteDesconectadoRanked"];
    setTurnos: ReturnType<typeof usePvpState>["setTurnos"];
    setDuelo: ReturnType<typeof usePvpState>["setDuelo"];
    setErro: ReturnType<typeof usePvpState>["setErro"];
    router: { push: (href: string) => void };
  },
) {
  const {
    setFilaRanked,
    setMatchEncontradoRanked,
    setDesafioRecebido,
    setDesafioEnviadoPara,
    setResultadoFinal,
    setRatingUpdate,
    setOponenteDesconectadoRanked,
    setTurnos,
    setDuelo,
    setErro,
    router,
  } = dependencies;
  const scope = createListenerScope(socket);
  // Arena Ranqueada — reaproveita SOCKET_EVENTS.PVP.DUELO_INICIADO's equivalente
  // (ranked:match:start), com o MESMO shape de payload, então o duelo
  // vira o mesmo estado `duelo` que LiveDuelArena já sabe renderizar.
  scope.on(
    SOCKET_EVENTS.RANKED.QUEUE_UPDATE,
    (payload: RankedQueueUpdatePayload) => {
      setFilaRanked(payload);
    },
  );
  scope.on(
    SOCKET_EVENTS.RANKED.MATCH_FOUND,
    (payload: RankedMatchFoundPayload) => {
      setMatchEncontradoRanked(payload);
    },
  );
  scope.on(
    SOCKET_EVENTS.RANKED.MATCH_START,
    (payload: DueloIniciadoPayload) => {
      setDesafioRecebido(null);
      setDesafioEnviadoPara(null);
      setResultadoFinal(null);
      setRatingUpdate(null);
      setOponenteDesconectadoRanked(null);
      setFilaRanked(null);
      setTurnos([]);
      setDuelo(payload);
      setErro(""); // mesmo motivo do handler pvp:duelo-iniciado acima.
      router.push("/dashboard/pvp");
    },
  );
  scope.on(
    SOCKET_EVENTS.RANKED.RATING_UPDATE,
    (payload: RankedRatingUpdatePayload) => {
      setRatingUpdate(payload);
    },
  );
  scope.on(
    SOCKET_EVENTS.RANKED.OPONENTE_DESCONECTADO,
    (payload: RankedOponenteDesconectadoPayload) => {
      setOponenteDesconectadoRanked(payload);
    },
  );
  scope.on(SOCKET_EVENTS.RANKED.OPONENTE_RECONECTADO, () => {
    setOponenteDesconectadoRanked(null);
  });
  return scope.dispose;
}
