"use client";
import { useState } from "react";
import type { Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "@/types/contracts/socketEvents";
import { createListenerScope } from "./listenerScope";
import type {
  EstadoCustodioDoMeridianoPayload,
  CastStartCustodioDoMeridianoPayload,
  TurnoResultadoCustodioDoMeridianoPayload,
  FaseAlteradaCustodioDoMeridianoPayload,
  FimCustodioDoMeridianoPayload,
} from "@/types/contracts/eventpuzzleboss";

// Evento "O Coração da Máquina Celestial" — Fase 16. Clone estrutural
// de ./templeboss.ts (mesmo raciocínio: luta solo, "estado" é sempre o
// MESMO shape completo, tanto no resync de "entrar" quanto embutido em
// cada resultado de turno).
export function useEventPuzzleBossState() {
  const [erroCustodio, setErroCustodio] = useState("");
  const [estadoCustodio, setEstadoCustodio] = useState<EstadoCustodioDoMeridianoPayload | null>(null);
  const [logCustodio, setLogCustodio] = useState<string[]>([]);
  const [castCustodio, setCastCustodio] = useState<CastStartCustodioDoMeridianoPayload | null>(null);
  const [faseAlteradaCustodio, setFaseAlteradaCustodio] = useState<FaseAlteradaCustodioDoMeridianoPayload | null>(null);
  const [resultadoCustodio, setResultadoCustodio] = useState<FimCustodioDoMeridianoPayload | null>(null);
  return {
    erroCustodio,
    setErroCustodio,
    estadoCustodio,
    setEstadoCustodio,
    logCustodio,
    setLogCustodio,
    castCustodio,
    setCastCustodio,
    faseAlteradaCustodio,
    setFaseAlteradaCustodio,
    resultadoCustodio,
    setResultadoCustodio,
  };
}

export function registerEventPuzzleBossListeners(
  socket: Socket,
  dependencies: {
    setEstadoCustodio: ReturnType<typeof useEventPuzzleBossState>["setEstadoCustodio"];
    setLogCustodio: ReturnType<typeof useEventPuzzleBossState>["setLogCustodio"];
    setCastCustodio: ReturnType<typeof useEventPuzzleBossState>["setCastCustodio"];
    setFaseAlteradaCustodio: ReturnType<typeof useEventPuzzleBossState>["setFaseAlteradaCustodio"];
    setResultadoCustodio: ReturnType<typeof useEventPuzzleBossState>["setResultadoCustodio"];
    setErroCustodio: ReturnType<typeof useEventPuzzleBossState>["setErroCustodio"];
  },
) {
  const { setEstadoCustodio, setLogCustodio, setCastCustodio, setFaseAlteradaCustodio, setResultadoCustodio, setErroCustodio } = dependencies;
  const scope = createListenerScope(socket);

  scope.on(SOCKET_EVENTS.EVENTPUZZLEBOSS.ESTADO, (payload: EstadoCustodioDoMeridianoPayload) => {
    setResultadoCustodio(null);
    setLogCustodio([]);
    setCastCustodio(null);
    setFaseAlteradaCustodio(null);
    setEstadoCustodio(payload);
  });

  scope.on(SOCKET_EVENTS.EVENTPUZZLEBOSS.TURNO_RESULTADO, (payload: TurnoResultadoCustodioDoMeridianoPayload) => {
    setEstadoCustodio(payload.estado);
    setLogCustodio((atual) => [...atual, ...payload.log].slice(-30));
    setCastCustodio(null);
  });

  scope.on(SOCKET_EVENTS.EVENTPUZZLEBOSS.CAST_START, (payload: CastStartCustodioDoMeridianoPayload) => {
    setCastCustodio(payload);
  });

  scope.on(SOCKET_EVENTS.EVENTPUZZLEBOSS.FASE_ALTERADA, (payload: FaseAlteradaCustodioDoMeridianoPayload) => {
    setFaseAlteradaCustodio(payload);
  });

  scope.on(SOCKET_EVENTS.EVENTPUZZLEBOSS.FIM, (payload: FimCustodioDoMeridianoPayload) => {
    setResultadoCustodio(payload);
    setCastCustodio(null);
  });

  scope.on(SOCKET_EVENTS.EVENTPUZZLEBOSS.ERRO, ({ mensagem }: { mensagem: string }) => {
    setErroCustodio(mensagem);
  });

  return scope.dispose;
}
