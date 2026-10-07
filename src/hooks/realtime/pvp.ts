"use client";
import { useState } from "react";
import type { Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "@/types/contracts/socketEvents";
import { appendTurn } from "./reducers";
import { createListenerScope } from "./listenerScope";
import type { DueloIniciadoPayload } from "@/types/contracts/pvp";
import type { TurnoResultadoPayload } from "@/types/contracts/pvp";
import type { DueloFimPayload } from "@/types/contracts/pvp";
import type { DesafioRecebido } from "@/types/contracts/pvp";

export function usePvpState() {
  const [desafioRecebido, setDesafioRecebido] =
    useState<DesafioRecebido | null>(null);
  const [desafioEnviadoPara, setDesafioEnviadoPara] = useState<number | null>(
    null,
  );
  const [erro, setErro] = useState("");
  const [duelo, setDuelo] = useState<DueloIniciadoPayload | null>(null);
  const [turnos, setTurnos] = useState<TurnoResultadoPayload[]>([]);
  const [resultadoFinal, setResultadoFinal] = useState<DueloFimPayload | null>(
    null,
  );
  return {
    desafioRecebido,
    setDesafioRecebido,
    desafioEnviadoPara,
    setDesafioEnviadoPara,
    erro,
    setErro,
    duelo,
    setDuelo,
    turnos,
    setTurnos,
    resultadoFinal,
    setResultadoFinal,
  };
}

export function registerPvpListeners(
  socket: Socket,
  dependencies: {
    setDesafioRecebido: ReturnType<typeof usePvpState>["setDesafioRecebido"];
    setDesafioEnviadoPara: ReturnType<
      typeof usePvpState
    >["setDesafioEnviadoPara"];
    setErro: ReturnType<typeof usePvpState>["setErro"];
    setResultadoFinal: ReturnType<typeof usePvpState>["setResultadoFinal"];
    setTurnos: ReturnType<typeof usePvpState>["setTurnos"];
    setDuelo: ReturnType<typeof usePvpState>["setDuelo"];
    router: { push: (href: string) => void };
  },
) {
  const {
    setDesafioRecebido,
    setDesafioEnviadoPara,
    setErro,
    setResultadoFinal,
    setTurnos,
    setDuelo,
    router,
  } = dependencies;
  const scope = createListenerScope(socket);
  scope.on(
    SOCKET_EVENTS.PVP.DESAFIO_RECEBIDO,
    (payload: {
      idDesafiante: number;
      nomeDesafiante: string;
      prazoSegundos: number;
    }) => {
      setDesafioRecebido({ ...payload, recebidoEm: Date.now() });
    },
  );
  scope.on(
    SOCKET_EVENTS.PVP.DESAFIO_ENVIADO,
    ({ idDesafiado }: { idDesafiado: number }) => {
      setDesafioEnviadoPara(idDesafiado);
    },
  );
  scope.on(SOCKET_EVENTS.PVP.DESAFIO_RECUSADO, () => {
    setDesafioEnviadoPara(null);
    setErro("O jogador recusou seu desafio.");
  });
  scope.on(SOCKET_EVENTS.PVP.DESAFIO_EXPIRADO, () => {
    setDesafioEnviadoPara(null);
    setErro("O jogador não respondeu a tempo.");
  });
  scope.on(SOCKET_EVENTS.PVP.DESAFIO_CANCELADO, () => {
    setDesafioRecebido(null);
  });
  scope.on(
    SOCKET_EVENTS.PVP.DUELO_INICIADO,
    (payload: DueloIniciadoPayload) => {
      setDesafioRecebido(null);
      setDesafioEnviadoPara(null);
      setResultadoFinal(null);
      setTurnos([]);
      setDuelo(payload);
      // Bug real: uma mensagem de erro de ANTES desse duelo começar
      // (desafio recusado, ação rejeitada do duelo anterior...) ficava
      // presa em `erro` e continuava aparecendo em cima da tela de
      // combate já ativa e saudável, porque nada aqui limpava esse
      // estado — LiveDuelArena só lê `erro`, não sabe se é antigo.
      setErro("");
      router.push("/dashboard/pvp");
    },
  );
  scope.on(
    SOCKET_EVENTS.PVP.TURNO_RESULTADO,
    (payload: TurnoResultadoPayload) => {
      setTurnos((atual) => appendTurn(atual, payload));
    },
  );
  scope.on(SOCKET_EVENTS.PVP.DUELO_FIM, (payload: DueloFimPayload) => {
    setResultadoFinal(payload);
  });
  scope.on(SOCKET_EVENTS.PVP.ERRO, ({ mensagem }: { mensagem: string }) => {
    setErro(mensagem);
  });
  return scope.dispose;
}
