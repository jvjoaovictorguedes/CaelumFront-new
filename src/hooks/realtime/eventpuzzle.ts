"use client";
import { useState } from "react";
import type { Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "@/types/contracts/socketEvents";
import { createListenerScope } from "./listenerScope";
import type { EstadoEventPuzzleSocketPayload } from "@/types/contracts/eventpuzzle";

// Evento "O Coração da Máquina Celestial" — Fase 16. Socket da SALA de
// puzzle (eventpuzzle:*) — pura sincronização/feedback pra quem mais
// estiver olhando a mesma PuzzleInstance (SOLO hoje, mas o payload já
// suporta co-op futuro — ver eventPuzzleSocket.js no backend). A ação
// de jogo em si NUNCA vai por aqui, só HTTP
// (executarAcaoEventPuzzle em src/lib/api/eventPuzzle.ts); este hook só
// recebe `eventpuzzle:estado` (resync no "entrar" e broadcast depois de
// qualquer ação bem-sucedida) e `eventpuzzle:erro`.
export function useEventPuzzleRoomState() {
  const [estadoSalaPuzzle, setEstadoSalaPuzzle] = useState<EstadoEventPuzzleSocketPayload | null>(null);
  const [erroSalaPuzzle, setErroSalaPuzzle] = useState("");
  return { estadoSalaPuzzle, setEstadoSalaPuzzle, erroSalaPuzzle, setErroSalaPuzzle };
}

export function registerEventPuzzleRoomListeners(
  socket: Socket,
  dependencies: {
    setEstadoSalaPuzzle: ReturnType<typeof useEventPuzzleRoomState>["setEstadoSalaPuzzle"];
    setErroSalaPuzzle: ReturnType<typeof useEventPuzzleRoomState>["setErroSalaPuzzle"];
  },
) {
  const { setEstadoSalaPuzzle, setErroSalaPuzzle } = dependencies;
  const scope = createListenerScope(socket);

  scope.on(SOCKET_EVENTS.EVENTPUZZLE.ESTADO, (payload: EstadoEventPuzzleSocketPayload) => {
    setEstadoSalaPuzzle(payload);
  });

  scope.on(SOCKET_EVENTS.EVENTPUZZLE.ERRO, ({ mensagem }: { mensagem: string }) => {
    setErroSalaPuzzle(mensagem);
  });

  return scope.dispose;
}
