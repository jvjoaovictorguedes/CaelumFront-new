"use client";
import { useState } from "react";
import type { Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "@/types/contracts/socketEvents";
import { mergeTournamentSeries } from "./reducers";
import { createListenerScope } from "./listenerScope";
import type { TorneioSerieAtualizadaPayload } from "@/types/contracts/tournament";
import type { usePvpState } from "./pvp";

export function useTournamentState() {
  const [serieTorneio, setSerieTorneio] =
    useState<TorneioSerieAtualizadaPayload | null>(null);
  return { serieTorneio, setSerieTorneio };
}

export function registerTournamentListeners(
  socket: Socket,
  dependencies: {
    setSerieTorneio: ReturnType<typeof useTournamentState>["setSerieTorneio"];
    setErro: ReturnType<typeof usePvpState>["setErro"];
  },
) {
  const { setSerieTorneio, setErro } = dependencies;
  const scope = createListenerScope(socket);
  // Torneio — cada jogo de uma série (MD3/MD5) é um duelo ao vivo
  // normal emitido pelo MESMO evento SOCKET_EVENTS.PVP.DUELO_INICIADO (tratado
  // acima), só com `payload.torneio = {serieId, round, formato}`. Não
  // existe um evento SOCKET_EVENTS.TORNEIO.DUELO_INICIADO separado no backend.
  //
  // Ready-check da série: entra na sala com SOCKET_EVENTS.TORNEIO.ENTRAR_SALA e
  // ouve as atualizações — é o único jeito de saber quem já confirmou
  // presença (o REST não expõe readyA/readyB).
  scope.on(
    SOCKET_EVENTS.TORNEIO.SERIE_ATUALIZADA,
    (payload: TorneioSerieAtualizadaPayload) => {
      setSerieTorneio(payload);
    },
  );
  scope.on(
    SOCKET_EVENTS.TORNEIO.SERIE_PLACAR,
    (payload: TorneioSerieAtualizadaPayload) => {
      setSerieTorneio((atual) => mergeTournamentSeries(atual, payload));
    },
  );
  scope.on(SOCKET_EVENTS.TORNEIO.ERRO, ({ mensagem }: { mensagem: string }) => {
    setErro(mensagem);
  });
  return scope.dispose;
}
