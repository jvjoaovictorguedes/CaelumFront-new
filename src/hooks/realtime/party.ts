"use client";
import { useState } from "react";
import type { Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "@/types/contracts/socketEvents";
import { appendTurn } from "./reducers";
import { createListenerScope } from "./listenerScope";
import type { GrupoAtualizadoPayload } from "@/types/contracts/party";
import type { ConvitePartyRecebido } from "@/types/contracts/party";
import type { BatalhaGrupoIniciadaPayload } from "@/types/contracts/party";
import type { TurnoGrupoPayload } from "@/types/contracts/party";
import type { ProximoTurnoGrupoPayload } from "@/types/contracts/party";
import type { BatalhaGrupoFimPayload } from "@/types/contracts/party";

export function usePartyState() {
  const [grupoAtual, setGrupoAtual] = useState<GrupoAtualizadoPayload | null>(
    null,
  );
  const [convitePartyRecebido, setConvitePartyRecebido] =
    useState<ConvitePartyRecebido | null>(null);
  const [convitePartyEnviadoPara, setConvitePartyEnviadoPara] = useState<
    number | null
  >(null);
  const [erroParty, setErroParty] = useState("");
  const [batalhaGrupo, setBatalhaGrupo] =
    useState<BatalhaGrupoIniciadaPayload | null>(null);
  const [turnosGrupo, setTurnosGrupo] = useState<TurnoGrupoPayload[]>([]);
  const [turnoAtualGrupo, setTurnoAtualGrupo] = useState<string | null>(null);
  const [rodadaAtualGrupo, setRodadaAtualGrupo] = useState(1);
  const [resultadoGrupo, setResultadoGrupo] =
    useState<BatalhaGrupoFimPayload | null>(null);
  return {
    grupoAtual,
    setGrupoAtual,
    convitePartyRecebido,
    setConvitePartyRecebido,
    convitePartyEnviadoPara,
    setConvitePartyEnviadoPara,
    erroParty,
    setErroParty,
    batalhaGrupo,
    setBatalhaGrupo,
    turnosGrupo,
    setTurnosGrupo,
    turnoAtualGrupo,
    setTurnoAtualGrupo,
    rodadaAtualGrupo,
    setRodadaAtualGrupo,
    resultadoGrupo,
    setResultadoGrupo,
  };
}

export function registerPartyListeners(
  socket: Socket,
  dependencies: {
    setConvitePartyRecebido: ReturnType<
      typeof usePartyState
    >["setConvitePartyRecebido"];
    setConvitePartyEnviadoPara: ReturnType<
      typeof usePartyState
    >["setConvitePartyEnviadoPara"];
    setErroParty: ReturnType<typeof usePartyState>["setErroParty"];
    setGrupoAtual: ReturnType<typeof usePartyState>["setGrupoAtual"];
    setResultadoGrupo: ReturnType<typeof usePartyState>["setResultadoGrupo"];
    setTurnosGrupo: ReturnType<typeof usePartyState>["setTurnosGrupo"];
    setBatalhaGrupo: ReturnType<typeof usePartyState>["setBatalhaGrupo"];
    setTurnoAtualGrupo: ReturnType<typeof usePartyState>["setTurnoAtualGrupo"];
    setRodadaAtualGrupo: ReturnType<
      typeof usePartyState
    >["setRodadaAtualGrupo"];
    router: { push: (href: string) => void };
  },
) {
  const {
    setConvitePartyRecebido,
    setConvitePartyEnviadoPara,
    setErroParty,
    setGrupoAtual,
    setResultadoGrupo,
    setTurnosGrupo,
    setBatalhaGrupo,
    setTurnoAtualGrupo,
    setRodadaAtualGrupo,
    router,
  } = dependencies;
  const scope = createListenerScope(socket);
  // Aventura em grupo (party)
  scope.on(
    SOCKET_EVENTS.PARTY.CONVITE_RECEBIDO,
    (payload: Omit<ConvitePartyRecebido, "recebidoEm">) => {
      setConvitePartyRecebido({ ...payload, recebidoEm: Date.now() });
    },
  );
  scope.on(
    SOCKET_EVENTS.PARTY.CONVITE_ENVIADO,
    ({ idConvidado }: { idConvidado: number }) => {
      setConvitePartyEnviadoPara(idConvidado);
    },
  );
  scope.on(SOCKET_EVENTS.PARTY.CONVITE_RECUSADO, () => {
    setConvitePartyEnviadoPara(null);
    setErroParty("O jogador recusou o convite.");
  });
  scope.on(SOCKET_EVENTS.PARTY.CONVITE_EXPIRADO, () => {
    setConvitePartyEnviadoPara(null);
    setErroParty("O jogador não respondeu a tempo.");
  });
  scope.on(SOCKET_EVENTS.PARTY.CONVITE_CANCELADO, () => {
    setConvitePartyRecebido(null);
  });
  scope.on(
    SOCKET_EVENTS.PARTY.GRUPO_ATUALIZADO,
    (payload: GrupoAtualizadoPayload) => {
      setConvitePartyRecebido(null);
      setConvitePartyEnviadoPara(null);
      setGrupoAtual(payload);
    },
  );
  scope.on(SOCKET_EVENTS.PARTY.GRUPO_DESFEITO, () => {
    setGrupoAtual(null);
  });
  scope.on(SOCKET_EVENTS.PARTY.EXPULSO, () => {
    setGrupoAtual(null);
    setErroParty("Você foi removido do grupo pelo anfitrião.");
  });
  scope.on(
    SOCKET_EVENTS.PARTY.BATALHA_INICIADA,
    (payload: BatalhaGrupoIniciadaPayload) => {
      setGrupoAtual(null);
      setResultadoGrupo(null);
      setTurnosGrupo([]);
      setBatalhaGrupo(payload);
      setTurnoAtualGrupo(payload.turnoDe);
      setRodadaAtualGrupo(payload.rodada);
      router.push("/dashboard/adventure");
    },
  );
  // Resync após F5/reconexão (bug reportado: a tela de batalha em
  // grupo nunca repovoava sozinha, só o INÍCIO da luta disparava
  // SOCKET_EVENTS.PARTY.BATALHA_INICIADA) — MESMO formato de payload (ver
  // montarPayloadBatalha no backend), com os valores ATUAIS da luta.
  scope.on(
    SOCKET_EVENTS.PARTY.BATALHA_ESTADO,
    (payload: BatalhaGrupoIniciadaPayload) => {
      setResultadoGrupo(null);
      setTurnosGrupo([]);
      setBatalhaGrupo(payload);
      setTurnoAtualGrupo(payload.turnoDe);
      setRodadaAtualGrupo(payload.rodada);
      router.push("/dashboard/adventure");
    },
  );
  scope.on(
    SOCKET_EVENTS.PARTY.TURNO_RESULTADO,
    (payload: TurnoGrupoPayload) => {
      setTurnosGrupo((atual) => appendTurn(atual, payload));
    },
  );
  scope.on(
    SOCKET_EVENTS.PARTY.PROXIMO_TURNO,
    (payload: ProximoTurnoGrupoPayload) => {
      setTurnoAtualGrupo(payload.turnoDe);
      setRodadaAtualGrupo(payload.rodada);
    },
  );
  scope.on(
    SOCKET_EVENTS.PARTY.BATALHA_FIM,
    (payload: BatalhaGrupoFimPayload) => {
      setResultadoGrupo(payload);
    },
  );
  scope.on(SOCKET_EVENTS.PARTY.ERRO, ({ mensagem }: { mensagem: string }) => {
    setErroParty(mensagem);
  });
  return scope.dispose;
}
