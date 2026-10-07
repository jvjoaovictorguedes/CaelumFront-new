"use client";
import { useState } from "react";
import type { Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "@/types/contracts/socketEvents";
import { appendTurn, addGuildBossMember } from "./reducers";
import { createListenerScope } from "./listenerScope";
import type { BatalhaBossGuildaIniciadaPayload } from "@/types/contracts/guildboss";
import type { MembroEntrouBossGuildaPayload } from "@/types/contracts/guildboss";
import type { CastStartBossGuildaPayload } from "@/types/contracts/guildboss";
import type { TurnoBossGuildaPayload } from "@/types/contracts/guildboss";
import type { ProximoTurnoBossGuildaPayload } from "@/types/contracts/guildboss";
import type { BatalhaBossGuildaFimPayload } from "@/types/contracts/guildboss";

export function useGuildbossState() {
  const [erroBossGuilda, setErroBossGuilda] = useState("");
  const [batalhaBossGuilda, setBatalhaBossGuilda] =
    useState<BatalhaBossGuildaIniciadaPayload | null>(null);
  const [turnosBossGuilda, setTurnosBossGuilda] = useState<
    TurnoBossGuildaPayload[]
  >([]);
  const [turnoAtualBossGuilda, setTurnoAtualBossGuilda] = useState<
    string | null
  >(null);
  const [rodadaAtualBossGuilda, setRodadaAtualBossGuilda] = useState(1);
  const [castBossGuilda, setCastBossGuilda] =
    useState<CastStartBossGuildaPayload | null>(null);
  const [resultadoBossGuilda, setResultadoBossGuilda] =
    useState<BatalhaBossGuildaFimPayload | null>(null);
  return {
    erroBossGuilda,
    setErroBossGuilda,
    batalhaBossGuilda,
    setBatalhaBossGuilda,
    turnosBossGuilda,
    setTurnosBossGuilda,
    turnoAtualBossGuilda,
    setTurnoAtualBossGuilda,
    rodadaAtualBossGuilda,
    setRodadaAtualBossGuilda,
    castBossGuilda,
    setCastBossGuilda,
    resultadoBossGuilda,
    setResultadoBossGuilda,
  };
}

export function registerGuildbossListeners(
  socket: Socket,
  dependencies: {
    setResultadoBossGuilda: ReturnType<
      typeof useGuildbossState
    >["setResultadoBossGuilda"];
    setTurnosBossGuilda: ReturnType<
      typeof useGuildbossState
    >["setTurnosBossGuilda"];
    setCastBossGuilda: ReturnType<
      typeof useGuildbossState
    >["setCastBossGuilda"];
    setBatalhaBossGuilda: ReturnType<
      typeof useGuildbossState
    >["setBatalhaBossGuilda"];
    setTurnoAtualBossGuilda: ReturnType<
      typeof useGuildbossState
    >["setTurnoAtualBossGuilda"];
    setRodadaAtualBossGuilda: ReturnType<
      typeof useGuildbossState
    >["setRodadaAtualBossGuilda"];
    setErroBossGuilda: ReturnType<
      typeof useGuildbossState
    >["setErroBossGuilda"];
  },
) {
  const {
    setResultadoBossGuilda,
    setTurnosBossGuilda,
    setCastBossGuilda,
    setBatalhaBossGuilda,
    setTurnoAtualBossGuilda,
    setRodadaAtualBossGuilda,
    setErroBossGuilda,
  } = dependencies;
  const scope = createListenerScope(socket);
  // Boss da Guilda V2.0 (batalha em tempo real) — sem sala de espera,
  // "entrar" já devolve direto dentro da luta (ver comentário em
  // BatalhaBossGuildaIniciadaPayload).
  scope.on(
    SOCKET_EVENTS.GUILDBOSS.BATALHA_INICIADA,
    (payload: BatalhaBossGuildaIniciadaPayload) => {
      setResultadoBossGuilda(null);
      setTurnosBossGuilda([]);
      setCastBossGuilda(null);
      setBatalhaBossGuilda(payload);
      setTurnoAtualBossGuilda(payload.turnoDe);
      setRodadaAtualBossGuilda(payload.rodada);
    },
  );
  // Reconexão/F5/segunda aba OU entrando numa luta já em andamento —
  // MESMO formato de "batalha-iniciada" (ver montarEstadoBatalha no
  // backend), nunca um shape próprio.
  scope.on(
    SOCKET_EVENTS.GUILDBOSS.ESTADO,
    (payload: BatalhaBossGuildaIniciadaPayload) => {
      setResultadoBossGuilda(null);
      setTurnosBossGuilda([]);
      setCastBossGuilda(null);
      setBatalhaBossGuilda(payload);
      setTurnoAtualBossGuilda(payload.turnoDe);
      setRodadaAtualBossGuilda(payload.rodada);
    },
  );
  // Outro membro da guilda entrou no meio da luta — soma na lista de
  // aliados em vez de substituir o estado inteiro.
  scope.on(
    SOCKET_EVENTS.GUILDBOSS.MEMBRO_ENTROU,
    (payload: MembroEntrouBossGuildaPayload) => {
      setBatalhaBossGuilda((atual) => addGuildBossMember(atual, payload));
    },
  );
  scope.on(
    SOCKET_EVENTS.GUILDBOSS.TURNO_RESULTADO,
    (payload: TurnoBossGuildaPayload) => {
      setTurnosBossGuilda((atual) => appendTurn(atual, payload));
      setCastBossGuilda(null);
    },
  );
  scope.on(
    SOCKET_EVENTS.GUILDBOSS.PROXIMO_TURNO,
    (payload: ProximoTurnoBossGuildaPayload) => {
      setTurnoAtualBossGuilda(payload.turnoDe);
      setRodadaAtualBossGuilda(payload.rodada);
    },
  );
  // Telegraph do contra-ataque do chefe (ver executarTurnoChefe no
  // backend) — SEMPRE chega antes do "turno-resultado" de origem
  // "chefe", mesmo sem nenhuma habilidade (ritmo de turno igual à
  // Ameaça Mundial).
  scope.on(
    SOCKET_EVENTS.GUILDBOSS.CAST_START,
    (payload: CastStartBossGuildaPayload) => {
      setCastBossGuilda(payload);
    },
  );
  scope.on(
    SOCKET_EVENTS.GUILDBOSS.BATALHA_FIM,
    (payload: BatalhaBossGuildaFimPayload) => {
      setResultadoBossGuilda(payload);
      setCastBossGuilda(null);
    },
  );
  scope.on(
    SOCKET_EVENTS.GUILDBOSS.ERRO,
    ({ mensagem }: { mensagem: string }) => {
      setErroBossGuilda(mensagem);
    },
  );
  return scope.dispose;
}
