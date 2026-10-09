"use client";
import { useState } from "react";
import type { Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "@/types/contracts/socketEvents";
import { createListenerScope } from "./listenerScope";
import type {
  EstadoGuardiaoPayload,
  CastStartGuardiaoPayload,
  TurnoResultadoGuardiaoPayload,
  FaseAlteradaGuardiaoPayload,
  FimGuardiaoPayload,
} from "@/types/contracts/templeboss";

export function useTempleBossState() {
  const [erroGuardiao, setErroGuardiao] = useState("");
  const [estadoGuardiao, setEstadoGuardiao] = useState<EstadoGuardiaoPayload | null>(null);
  const [logGuardiao, setLogGuardiao] = useState<string[]>([]);
  const [castGuardiao, setCastGuardiao] = useState<CastStartGuardiaoPayload | null>(null);
  const [faseAlteradaGuardiao, setFaseAlteradaGuardiao] = useState<FaseAlteradaGuardiaoPayload | null>(null);
  const [resultadoGuardiao, setResultadoGuardiao] = useState<FimGuardiaoPayload | null>(null);
  return {
    erroGuardiao,
    setErroGuardiao,
    estadoGuardiao,
    setEstadoGuardiao,
    logGuardiao,
    setLogGuardiao,
    castGuardiao,
    setCastGuardiao,
    faseAlteradaGuardiao,
    setFaseAlteradaGuardiao,
    resultadoGuardiao,
    setResultadoGuardiao,
  };
}

export function registerTempleBossListeners(
  socket: Socket,
  dependencies: {
    setEstadoGuardiao: ReturnType<typeof useTempleBossState>["setEstadoGuardiao"];
    setLogGuardiao: ReturnType<typeof useTempleBossState>["setLogGuardiao"];
    setCastGuardiao: ReturnType<typeof useTempleBossState>["setCastGuardiao"];
    setFaseAlteradaGuardiao: ReturnType<typeof useTempleBossState>["setFaseAlteradaGuardiao"];
    setResultadoGuardiao: ReturnType<typeof useTempleBossState>["setResultadoGuardiao"];
    setErroGuardiao: ReturnType<typeof useTempleBossState>["setErroGuardiao"];
  },
) {
  const {
    setEstadoGuardiao,
    setLogGuardiao,
    setCastGuardiao,
    setFaseAlteradaGuardiao,
    setResultadoGuardiao,
    setErroGuardiao,
  } = dependencies;
  const scope = createListenerScope(socket);

  // templeboss:entrar devolve ESTE evento direto (sem sala de espera —
  // a luta é solo, nunca existe "entrando numa luta de outra pessoa").
  // Também é o shape de resync (F5/reconexão).
  scope.on(SOCKET_EVENTS.TEMPLEBOSS.ESTADO, (payload: EstadoGuardiaoPayload) => {
    setResultadoGuardiao(null);
    setLogGuardiao([]);
    setCastGuardiao(null);
    setFaseAlteradaGuardiao(null);
    setEstadoGuardiao(payload);
  });

  // Cada ação do jogador já resolve o turno INTEIRO (golpe + contra-
  // ataque do Guardião) — "estado" aqui é sempre o MESMO shape de cima,
  // nunca um payload parcial.
  scope.on(SOCKET_EVENTS.TEMPLEBOSS.TURNO_RESULTADO, (payload: TurnoResultadoGuardiaoPayload) => {
    setEstadoGuardiao(payload.estado);
    setLogGuardiao((atual) => [...atual, ...payload.log].slice(-30));
    setCastGuardiao(null);
  });

  scope.on(SOCKET_EVENTS.TEMPLEBOSS.CAST_START, (payload: CastStartGuardiaoPayload) => {
    setCastGuardiao(payload);
  });

  scope.on(SOCKET_EVENTS.TEMPLEBOSS.FASE_ALTERADA, (payload: FaseAlteradaGuardiaoPayload) => {
    setFaseAlteradaGuardiao(payload);
  });

  scope.on(SOCKET_EVENTS.TEMPLEBOSS.FIM, (payload: FimGuardiaoPayload) => {
    setResultadoGuardiao(payload);
    setCastGuardiao(null);
  });

  scope.on(SOCKET_EVENTS.TEMPLEBOSS.ERRO, ({ mensagem }: { mensagem: string }) => {
    setErroGuardiao(mensagem);
  });

  return scope.dispose;
}
