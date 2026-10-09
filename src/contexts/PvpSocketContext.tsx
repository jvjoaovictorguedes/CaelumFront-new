"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { type Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "@/types/contracts/socketEvents";
import { usePvpState, registerPvpListeners } from "@/hooks/realtime/pvp";
import { useRankedState, registerRankedListeners } from "@/hooks/realtime/ranked";
import { useTournamentState, registerTournamentListeners } from "@/hooks/realtime/tournament";
import { usePartyState, registerPartyListeners } from "@/hooks/realtime/party";
import { useGuildbossState, registerGuildbossListeners } from "@/hooks/realtime/guildboss";
import { useTempleBossState, registerTempleBossListeners } from "@/hooks/realtime/templeboss";
import { useCombatTransport } from "@/hooks/realtime/useCombatTransport";

import type { LutadorDuelo, PoderDuelo, ConsumivelDuelo, DueloIniciadoPayload, StatusInstanceDuelo, CombatBuffInstanceDuelo, TurnoResultadoPayload, DueloFimPayload, DesafioRecebido } from "@/types/contracts/pvp";
export type { LutadorDuelo, PoderDuelo, ConsumivelDuelo, DueloIniciadoPayload, StatusInstanceDuelo, CombatBuffInstanceDuelo, TurnoResultadoPayload, DueloFimPayload, DesafioRecebido } from "@/types/contracts/pvp";
import type { RankedQueueUpdatePayload, RankedMatchFoundPayload, ResumoTierPayload, RankedRatingUpdatePayload, RankedOponenteDesconectadoPayload } from "@/types/contracts/ranked";
export type { RankedQueueUpdatePayload, RankedMatchFoundPayload, ResumoTierPayload, RankedRatingUpdatePayload, RankedOponenteDesconectadoPayload } from "@/types/contracts/ranked";
import type { TorneioSerieAtualizadaPayload } from "@/types/contracts/tournament";
export type { TorneioSerieAtualizadaPayload } from "@/types/contracts/tournament";
import type { MembroGrupo, GrupoAtualizadoPayload, ConvitePartyRecebido, PoderGrupo, ConsumivelGrupo, AliadoBatalhaGrupo, BatalhaGrupoIniciadaPayload, TurnoGrupoPayload, ProximoTurnoGrupoPayload, BatalhaGrupoFimPayload } from "@/types/contracts/party";
export type { MembroGrupo, GrupoAtualizadoPayload, ConvitePartyRecebido, PoderGrupo, ConsumivelGrupo, AliadoBatalhaGrupo, BatalhaGrupoIniciadaPayload, TurnoGrupoPayload, ProximoTurnoGrupoPayload, BatalhaGrupoFimPayload } from "@/types/contracts/party";
import type { AliadoBossGuilda, BatalhaBossGuildaIniciadaPayload, MembroEntrouBossGuildaPayload, CastStartBossGuildaPayload, TurnoBossGuildaPayload, ProximoTurnoBossGuildaPayload, RecompensasBossGuilda, BatalhaBossGuildaFimPayload } from "@/types/contracts/guildboss";
export type { AliadoBossGuilda, BatalhaBossGuildaIniciadaPayload, MembroEntrouBossGuildaPayload, CastStartBossGuildaPayload, TurnoBossGuildaPayload, ProximoTurnoBossGuildaPayload, RecompensasBossGuilda, BatalhaBossGuildaFimPayload } from "@/types/contracts/guildboss";
import type { EstadoGuardiaoPayload, CastStartGuardiaoPayload, FaseAlteradaGuardiaoPayload, FimGuardiaoPayload, PoderGuardiao } from "@/types/contracts/templeboss";
export type { EstadoGuardiaoPayload, CastStartGuardiaoPayload, FaseAlteradaGuardiaoPayload, FimGuardiaoPayload, PoderGuardiao } from "@/types/contracts/templeboss";

interface PvpSocketContextValue {
  conectado: boolean;
  onlineIds: Set<number>;
  desafioRecebido: DesafioRecebido | null;
  desafioEnviadoPara: number | null;
  erro: string;
  duelo: DueloIniciadoPayload | null;
  turnos: TurnoResultadoPayload[];
  resultadoFinal: DueloFimPayload | null;
  desafiar: (idDesafiado: number) => void;
  responderDesafio: (aceitar: boolean) => void;
  agir: (tipo: "attack" | "power" | "item" | "pass", id?: number) => void;
  limparDuelo: () => void;
  limparErro: () => void;
  // Arena Ranqueada
  filaRanked: RankedQueueUpdatePayload | null;
  matchEncontradoRanked: RankedMatchFoundPayload | null;
  ratingUpdate: RankedRatingUpdatePayload | null;
  oponenteDesconectadoRanked: RankedOponenteDesconectadoPayload | null;
  // Torneio — ready-check ao vivo
  serieTorneio: TorneioSerieAtualizadaPayload | null;
  entrarSalaTorneio: (serieId: number) => void;
  confirmarProntoTorneio: (serieId: number) => void;
  // Aventura em grupo (party)
  grupoAtual: GrupoAtualizadoPayload | null;
  convitePartyRecebido: ConvitePartyRecebido | null;
  convitePartyEnviadoPara: number | null;
  erroParty: string;
  batalhaGrupo: BatalhaGrupoIniciadaPayload | null;
  turnosGrupo: TurnoGrupoPayload[];
  turnoAtualGrupo: string | null;
  rodadaAtualGrupo: number;
  resultadoGrupo: BatalhaGrupoFimPayload | null;
  criarGrupo: () => void;
  listarJogadoresOnline: () => Promise<{ id: number; nome: string }[]>;
  convidarParaGrupo: (idConvidado: number) => void;
  responderConvitePartyFn: (aceitar: boolean) => void;
  marcarPronto: (pronto: boolean) => void;
  sairDoGrupo: () => void;
  expulsarDoGrupo: (idAlvo: number) => void;
  iniciarAventuraEmGrupo: (idZona: number) => void;
  agirGrupo: (tipo: "attack" | "power" | "item" | "pass", id?: number) => void;
  limparBatalhaGrupo: () => void;
  limparErroParty: () => void;
  // Boss da Guilda V2.0 (batalha em tempo real) — sem sala de espera,
  // "entrarNoBossGuilda" já entrega dentro da luta (ver comentário em
  // BatalhaBossGuildaIniciadaPayload).
  erroBossGuilda: string;
  batalhaBossGuilda: BatalhaBossGuildaIniciadaPayload | null;
  turnosBossGuilda: TurnoBossGuildaPayload[];
  turnoAtualBossGuilda: string | null;
  rodadaAtualBossGuilda: number;
  castBossGuilda: CastStartBossGuildaPayload | null;
  resultadoBossGuilda: BatalhaBossGuildaFimPayload | null;
  entrarNoBossGuilda: () => void;
  sairDoBossGuilda: () => void;
  agirBossGuilda: (tipo: "attack" | "power", idPoder?: number) => void;
  limparBatalhaBossGuilda: () => void;
  limparErroBossGuilda: () => void;
  // Templo do Véu Celestial — Provação Final (Guardião solo). Luta
  // individual: "entrarNoGuardiao" já devolve o estado completo direto
  // (sem sala de espera, sem ordem de aliados).
  erroGuardiao: string;
  estadoGuardiao: EstadoGuardiaoPayload | null;
  logGuardiao: string[];
  castGuardiao: CastStartGuardiaoPayload | null;
  faseAlteradaGuardiao: FaseAlteradaGuardiaoPayload | null;
  resultadoGuardiao: FimGuardiaoPayload | null;
  entrarNoGuardiao: () => void;
  sairDoGuardiao: () => void;
  agirGuardiao: (tipo: "attack" | "power", idPoder?: number) => void;
  limparBatalhaGuardiao: () => void;
  limparErroGuardiao: () => void;
}

const PvpSocketContext = createContext<PvpSocketContextValue | null>(null);


export function PvpSocketProvider({
  characterId,
  children,
}: {
  characterId?: number;
  children: React.ReactNode;
}) {
  const router = useRouter();


  const { desafioRecebido, setDesafioRecebido, desafioEnviadoPara, setDesafioEnviadoPara, erro, setErro, duelo, setDuelo, turnos, setTurnos, resultadoFinal, setResultadoFinal } = usePvpState();
  const { filaRanked, setFilaRanked, matchEncontradoRanked, setMatchEncontradoRanked, ratingUpdate, setRatingUpdate, oponenteDesconectadoRanked, setOponenteDesconectadoRanked } = useRankedState();
  const { serieTorneio, setSerieTorneio } = useTournamentState();
  const { grupoAtual, setGrupoAtual, convitePartyRecebido, setConvitePartyRecebido, convitePartyEnviadoPara, setConvitePartyEnviadoPara, erroParty, setErroParty, batalhaGrupo, setBatalhaGrupo, turnosGrupo, setTurnosGrupo, turnoAtualGrupo, setTurnoAtualGrupo, rodadaAtualGrupo, setRodadaAtualGrupo, resultadoGrupo, setResultadoGrupo } = usePartyState();
  const { erroBossGuilda, setErroBossGuilda, batalhaBossGuilda, setBatalhaBossGuilda, turnosBossGuilda, setTurnosBossGuilda, turnoAtualBossGuilda, setTurnoAtualBossGuilda, rodadaAtualBossGuilda, setRodadaAtualBossGuilda, castBossGuilda, setCastBossGuilda, resultadoBossGuilda, setResultadoBossGuilda } = useGuildbossState();
  const { erroGuardiao, setErroGuardiao, estadoGuardiao, setEstadoGuardiao, logGuardiao, setLogGuardiao, castGuardiao, setCastGuardiao, faseAlteradaGuardiao, setFaseAlteradaGuardiao, resultadoGuardiao, setResultadoGuardiao } = useTempleBossState();

  const registerDomains = useCallback((socket: Socket) => [
      registerPvpListeners(socket, { setDesafioRecebido, setDesafioEnviadoPara, setErro, setResultadoFinal, setTurnos, setDuelo, router }),
      registerRankedListeners(socket, { setFilaRanked, setMatchEncontradoRanked, setDesafioRecebido, setDesafioEnviadoPara, setResultadoFinal, setRatingUpdate, setOponenteDesconectadoRanked, setTurnos, setDuelo, setErro, router }),
      registerTournamentListeners(socket, { setSerieTorneio, setErro }),
      registerPartyListeners(socket, { setConvitePartyRecebido, setConvitePartyEnviadoPara, setErroParty, setGrupoAtual, setResultadoGrupo, setTurnosGrupo, setBatalhaGrupo, setTurnoAtualGrupo, setRodadaAtualGrupo, router }),
      registerGuildbossListeners(socket, { setResultadoBossGuilda, setTurnosBossGuilda, setCastBossGuilda, setBatalhaBossGuilda, setTurnoAtualBossGuilda, setRodadaAtualBossGuilda, setErroBossGuilda }),
      registerTempleBossListeners(socket, { setEstadoGuardiao, setLogGuardiao, setCastGuardiao, setFaseAlteradaGuardiao, setResultadoGuardiao, setErroGuardiao }),
  ], [setBatalhaBossGuilda, setBatalhaGrupo, setCastBossGuilda, setCastGuardiao, setConvitePartyEnviadoPara, setConvitePartyRecebido, setDesafioEnviadoPara, setDesafioRecebido, setDuelo, setErro, setErroBossGuilda, setErroGuardiao, setErroParty, setEstadoGuardiao, setFaseAlteradaGuardiao, setFilaRanked, setGrupoAtual, setLogGuardiao, setMatchEncontradoRanked, setOponenteDesconectadoRanked, setRatingUpdate, setResultadoBossGuilda, setResultadoFinal, setResultadoGrupo, setResultadoGuardiao, setRodadaAtualBossGuilda, setRodadaAtualGrupo, setSerieTorneio, setTurnoAtualBossGuilda, setTurnoAtualGrupo, setTurnos, setTurnosBossGuilda, setTurnosGrupo, router]);
  const { socketRef, conectado, onlineIds } = useCombatTransport(characterId, setErro, registerDomains);

  const desafiar = useCallback((idDesafiado: number) => {
    socketRef.current?.emit(SOCKET_EVENTS.PVP.DESAFIAR, { idDesafiado });
  }, []);

  const responderDesafio = useCallback((aceitar: boolean) => {
    socketRef.current?.emit(SOCKET_EVENTS.PVP.RESPONDER_DESAFIO, { aceitar });
    if (!aceitar) setDesafioRecebido(null);
  }, []);

  const agir = useCallback((tipo: "attack" | "power" | "item" | "pass", id?: number) => {
    socketRef.current?.emit(SOCKET_EVENTS.PVP.ACAO, {
      tipo,
      idPoder: tipo === "power" ? id : undefined,
      idItem: tipo === "item" ? id : undefined,
    });
  }, []);

  const limparDuelo = useCallback(() => {
    setDuelo(null);
    setTurnos([]);
    setResultadoFinal(null);
    setRatingUpdate(null);
    setOponenteDesconectadoRanked(null);
  }, []);

  const entrarSalaTorneio = useCallback((serieId: number) => {
    socketRef.current?.emit(SOCKET_EVENTS.TORNEIO.ENTRAR_SALA, { serieId });
  }, []);

  const confirmarProntoTorneio = useCallback((serieId: number) => {
    socketRef.current?.emit(SOCKET_EVENTS.TORNEIO.PRONTO, { serieId });
  }, []);

  const limparErro = useCallback(() => setErro(""), []);

  const criarGrupo = useCallback(() => {
    socketRef.current?.emit(SOCKET_EVENTS.PARTY.CRIAR);
  }, []);

  const listarJogadoresOnline = useCallback((): Promise<{ id: number; nome: string }[]> => {
    return new Promise((resolve) => {
      const socket = socketRef.current;
      if (!socket) {
        resolve([]);
        return;
      }
      socket.emit(
        SOCKET_EVENTS.PARTY.LISTAR_ONLINE,
        {},
        (resposta: { jogadores?: { id: number; nome: string }[] }) => {
          resolve(resposta?.jogadores ?? []);
        },
      );
    });
  }, []);

  const convidarParaGrupo = useCallback((idConvidado: number) => {
    socketRef.current?.emit(SOCKET_EVENTS.PARTY.CONVIDAR, { idConvidado });
  }, []);

  const responderConvitePartyFn = useCallback(
    (aceitar: boolean) => {
      socketRef.current?.emit(SOCKET_EVENTS.PARTY.RESPONDER_CONVITE, { aceitar });
      if (!aceitar) {
        setConvitePartyRecebido(null);
        return;
      }
      // O convidado pode estar em qualquer tela do dashboard quando aceita
      // — sem isso, ele ficava parado onde estava, sem ver o lobby do
      // grupo que acabou de entrar.
      router.push("/dashboard/adventure");
    },
    [router],
  );

  const marcarPronto = useCallback((pronto: boolean) => {
    socketRef.current?.emit(SOCKET_EVENTS.PARTY.PRONTO, { pronto });
  }, []);

  const sairDoGrupo = useCallback(() => {
    socketRef.current?.emit(SOCKET_EVENTS.PARTY.SAIR);
    setGrupoAtual(null);
  }, []);

  const expulsarDoGrupo = useCallback((idAlvo: number) => {
    socketRef.current?.emit(SOCKET_EVENTS.PARTY.EXPULSAR, { idAlvo });
  }, []);

  const iniciarAventuraEmGrupo = useCallback((idZona: number) => {
    socketRef.current?.emit(SOCKET_EVENTS.PARTY.INICIAR, { idZona });
  }, []);

  const agirGrupo = useCallback((tipo: "attack" | "power" | "item" | "pass", id?: number) => {
    socketRef.current?.emit(SOCKET_EVENTS.PARTY.ACAO, {
      tipo,
      idPoder: tipo === "power" ? id : undefined,
      idItem: tipo === "item" ? id : undefined,
    });
  }, []);

  const limparBatalhaGrupo = useCallback(() => {
    setBatalhaGrupo(null);
    setTurnosGrupo([]);
    setTurnoAtualGrupo(null);
    setResultadoGrupo(null);
  }, []);

  const limparErroParty = useCallback(() => setErroParty(""), []);

  const entrarNoBossGuilda = useCallback(() => {
    socketRef.current?.emit(SOCKET_EVENTS.GUILDBOSS.ENTRAR);
  }, []);

  const sairDoBossGuilda = useCallback(() => {
    socketRef.current?.emit(SOCKET_EVENTS.GUILDBOSS.SAIR);
  }, []);

  const agirBossGuilda = useCallback((tipo: "attack" | "power", idPoder?: number) => {
    socketRef.current?.emit(SOCKET_EVENTS.GUILDBOSS.ACAO, { tipo, idPoder: tipo === "power" ? idPoder : undefined });
  }, []);

  const limparBatalhaBossGuilda = useCallback(() => {
    setBatalhaBossGuilda(null);
    setTurnosBossGuilda([]);
    setTurnoAtualBossGuilda(null);
    setCastBossGuilda(null);
    setResultadoBossGuilda(null);
  }, []);

  const limparErroBossGuilda = useCallback(() => setErroBossGuilda(""), []);

  const entrarNoGuardiao = useCallback(() => {
    socketRef.current?.emit(SOCKET_EVENTS.TEMPLEBOSS.ENTRAR);
  }, []);

  const sairDoGuardiao = useCallback(() => {
    socketRef.current?.emit(SOCKET_EVENTS.TEMPLEBOSS.SAIR);
  }, []);

  const agirGuardiao = useCallback((tipo: "attack" | "power", idPoder?: number) => {
    socketRef.current?.emit(SOCKET_EVENTS.TEMPLEBOSS.ACAO, { tipo, idPoder: tipo === "power" ? idPoder : undefined });
  }, []);

  const limparBatalhaGuardiao = useCallback(() => {
    setEstadoGuardiao(null);
    setLogGuardiao([]);
    setCastGuardiao(null);
    setFaseAlteradaGuardiao(null);
    setResultadoGuardiao(null);
  }, []);

  const limparErroGuardiao = useCallback(() => setErroGuardiao(""), []);

  return (
    <PvpSocketContext.Provider
      value={{
        conectado,
        onlineIds,
        desafioRecebido,
        desafioEnviadoPara,
        erro,
        duelo,
        turnos,
        resultadoFinal,
        desafiar,
        responderDesafio,
        agir,
        limparDuelo,
        limparErro,
        filaRanked,
        matchEncontradoRanked,
        ratingUpdate,
        oponenteDesconectadoRanked,
        serieTorneio,
        entrarSalaTorneio,
        confirmarProntoTorneio,
        grupoAtual,
        convitePartyRecebido,
        convitePartyEnviadoPara,
        erroParty,
        batalhaGrupo,
        turnosGrupo,
        turnoAtualGrupo,
        rodadaAtualGrupo,
        resultadoGrupo,
        convidarParaGrupo,
        responderConvitePartyFn,
        criarGrupo,
        listarJogadoresOnline,
        marcarPronto,
        sairDoGrupo,
        expulsarDoGrupo,
        iniciarAventuraEmGrupo,
        agirGrupo,
        limparBatalhaGrupo,
        limparErroParty,
        erroBossGuilda,
        batalhaBossGuilda,
        turnosBossGuilda,
        turnoAtualBossGuilda,
        rodadaAtualBossGuilda,
        castBossGuilda,
        resultadoBossGuilda,
        entrarNoBossGuilda,
        sairDoBossGuilda,
        agirBossGuilda,
        limparBatalhaBossGuilda,
        limparErroBossGuilda,
        erroGuardiao,
        estadoGuardiao,
        logGuardiao,
        castGuardiao,
        faseAlteradaGuardiao,
        resultadoGuardiao,
        entrarNoGuardiao,
        sairDoGuardiao,
        agirGuardiao,
        limparBatalhaGuardiao,
        limparErroGuardiao,
      }}
    >
      {children}
      {desafioRecebido && (
        <DesafioModal
          desafio={desafioRecebido}
          onResponder={responderDesafio}
        />
      )}
      {convitePartyRecebido && (
        <ConvitePartyModal
          convite={convitePartyRecebido}
          onResponder={responderConvitePartyFn}
        />
      )}
    </PvpSocketContext.Provider>
  );
}

function ConvitePartyModal({
  convite,
  onResponder,
}: {
  convite: ConvitePartyRecebido;
  onResponder: (aceitar: boolean) => void;
}) {
  const [restante, setRestante] = useState(convite.prazoSegundos);

  useEffect(() => {
    const intervalo = setInterval(() => {
      const passado = (Date.now() - convite.recebidoEm) / 1000;
      setRestante(Math.max(0, Math.ceil(convite.prazoSegundos - passado)));
    }, 250);
    return () => clearInterval(intervalo);
  }, [convite]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-6 text-center text-white shadow-2xl">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">
          Convite pra Aventura em grupo
        </p>
        <h2 className="mb-1 font-imFeel text-2xl">{convite.nomeConvidante}</h2>
        <p className="mb-2 text-sm text-white/70">te chamou pra um grupo!</p>
        {convite.membros.length > 1 && (
          <p className="mb-3 text-xs text-white/50">
            Grupo: {convite.membros.map((m) => m.nome).join(", ")}
          </p>
        )}
        <p className="mb-4 text-3xl font-bold text-[#F3B43F]">{restante}s</p>
        <div className="flex gap-3">
          <button
            onClick={() => onResponder(false)}
            className="flex-1 rounded-lg border-2 border-white/30 bg-transparent px-3 py-2 font-bold text-white hover:bg-white/10"
          >
            Recusar
          </button>
          <button
            onClick={() => onResponder(true)}
            className="flex-1 rounded-lg bg-[#BC8418] px-3 py-2 font-bold text-black hover:bg-[#a5710f]"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}

function DesafioModal({
  desafio,
  onResponder,
}: {
  desafio: DesafioRecebido;
  onResponder: (aceitar: boolean) => void;
}) {
  const [restante, setRestante] = useState(desafio.prazoSegundos);

  useEffect(() => {
    const intervalo = setInterval(() => {
      const passado = (Date.now() - desafio.recebidoEm) / 1000;
      setRestante(Math.max(0, Math.ceil(desafio.prazoSegundos - passado)));
    }, 250);
    return () => clearInterval(intervalo);
  }, [desafio]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-6 text-center text-white shadow-2xl">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">
          Desafio de duelo ao vivo
        </p>
        <h2 className="font-imFeel text-2xl mb-1">{desafio.nomeDesafiante}</h2>
        <p className="mb-4 text-sm text-white/70">te desafiou pra um duelo!</p>
        <p className="mb-4 text-3xl font-bold text-[#F3B43F]">{restante}s</p>
        <div className="flex gap-3">
          <button
            onClick={() => onResponder(false)}
            className="flex-1 rounded-lg border-2 border-white/30 bg-transparent px-3 py-2 font-bold text-white hover:bg-white/10"
          >
            Recusar
          </button>
          <button
            onClick={() => onResponder(true)}
            className="flex-1 rounded-lg bg-[#BC8418] px-3 py-2 font-bold text-black hover:bg-[#a5710f]"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}

export function usePvpSocket() {
  const ctx = useContext(PvpSocketContext);
  if (!ctx) {
    throw new Error("usePvpSocket precisa ser usado dentro de PvpSocketProvider");
  }
  return ctx;
}
