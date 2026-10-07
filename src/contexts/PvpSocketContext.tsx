"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "@/types/contracts/socketEvents";
import axiosInstance from "@/utils/axiosIntance";

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
}

const PvpSocketContext = createContext<PvpSocketContextValue | null>(null);

function socketUrlFromApiUrl(apiUrl: string) {
  return apiUrl.replace(/\/api\/?$/, "");
}

export function PvpSocketProvider({
  characterId,
  children,
}: {
  characterId?: number;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  const [conectado, setConectado] = useState(false);
  const [onlineIds, setOnlineIds] = useState<Set<number>>(new Set());
  const [desafioRecebido, setDesafioRecebido] = useState<DesafioRecebido | null>(null);
  const [desafioEnviadoPara, setDesafioEnviadoPara] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [duelo, setDuelo] = useState<DueloIniciadoPayload | null>(null);
  const [turnos, setTurnos] = useState<TurnoResultadoPayload[]>([]);
  const [resultadoFinal, setResultadoFinal] = useState<DueloFimPayload | null>(null);
  const [filaRanked, setFilaRanked] = useState<RankedQueueUpdatePayload | null>(null);
  const [matchEncontradoRanked, setMatchEncontradoRanked] = useState<RankedMatchFoundPayload | null>(null);
  const [ratingUpdate, setRatingUpdate] = useState<RankedRatingUpdatePayload | null>(null);
  const [oponenteDesconectadoRanked, setOponenteDesconectadoRanked] =
    useState<RankedOponenteDesconectadoPayload | null>(null);
  const [serieTorneio, setSerieTorneio] = useState<TorneioSerieAtualizadaPayload | null>(null);
  const [grupoAtual, setGrupoAtual] = useState<GrupoAtualizadoPayload | null>(null);
  const [convitePartyRecebido, setConvitePartyRecebido] = useState<ConvitePartyRecebido | null>(null);
  const [convitePartyEnviadoPara, setConvitePartyEnviadoPara] = useState<number | null>(null);
  const [erroParty, setErroParty] = useState("");
  const [batalhaGrupo, setBatalhaGrupo] = useState<BatalhaGrupoIniciadaPayload | null>(null);
  const [turnosGrupo, setTurnosGrupo] = useState<TurnoGrupoPayload[]>([]);
  const [turnoAtualGrupo, setTurnoAtualGrupo] = useState<string | null>(null);
  const [rodadaAtualGrupo, setRodadaAtualGrupo] = useState(1);
  const [resultadoGrupo, setResultadoGrupo] = useState<BatalhaGrupoFimPayload | null>(null);
  const [erroBossGuilda, setErroBossGuilda] = useState("");
  const [batalhaBossGuilda, setBatalhaBossGuilda] = useState<BatalhaBossGuildaIniciadaPayload | null>(null);
  const [turnosBossGuilda, setTurnosBossGuilda] = useState<TurnoBossGuildaPayload[]>([]);
  const [turnoAtualBossGuilda, setTurnoAtualBossGuilda] = useState<string | null>(null);
  const [rodadaAtualBossGuilda, setRodadaAtualBossGuilda] = useState(1);
  const [castBossGuilda, setCastBossGuilda] = useState<CastStartBossGuildaPayload | null>(null);
  const [resultadoBossGuilda, setResultadoBossGuilda] = useState<BatalhaBossGuildaFimPayload | null>(null);

  useEffect(() => {
    if (!characterId) return;

    const baseUrl = socketUrlFromApiUrl(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
    );
    const socket = io(baseUrl, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConectado(true);
      // O JWT é httpOnly (o browser não tem acesso), então o socket não
      // consegue mandar um Bearer no identificar — busca um ticket de
      // curtíssima duração via HTTP (que passa pelo proxy same-origin e
      // carrega o cookie) e manda ele, nunca o characterId cru.
      axiosInstance
        .get<{ data?: { ticket?: string } }>("/users/socket-ticket")
        .then((resp) => {
          const ticket = resp.data?.data?.ticket;
          if (!ticket) return;
          // Callback de ack: o handler de SOCKET_EVENTS.TRANSPORT.IDENTIFY é assíncrono no
          // servidor, então emitir os resyncs abaixo sem esperar essa
          // confirmação corria o risco de chegar ANTES do servidor setar
          // socket.characterId (resync silenciosamente ignorado). Só
          // depois do ack é garantido que o personagem já está
          // identificado pra qualquer evento seguinte.
          socket.emit(SOCKET_EVENTS.TRANSPORT.IDENTIFY, { ticket }, () => {
            socket.emit(SOCKET_EVENTS.PVP.LISTAR_ONLINE, {}, (resposta: { online?: string[] }) => {
              setOnlineIds(new Set((resposta?.online ?? []).map(Number)));
            });
            // Resync após F5/reconexão (bug reportado): se o personagem já
            // estava numa batalha em grupo em andamento, o servidor
            // reenvia o estado ATUAL — sem isso a tela nunca repovoava
            // sozinha, só o processo do servidor continuava rodando a
            // luta.
            socket.emit(SOCKET_EVENTS.PARTY.ENTRAR_BATALHA);
          });
        })
        .catch(() => {
          setErro("Não foi possível autenticar a conexão em tempo real.");
        });
    });

    socket.on("disconnect", () => setConectado(false));

    socket.on(SOCKET_EVENTS.PVP.FICOU_ONLINE, ({ characterId: id }: { characterId: string }) => {
      setOnlineIds((atual) => new Set(atual).add(Number(id)));
    });

    socket.on(SOCKET_EVENTS.PVP.FICOU_OFFLINE, ({ characterId: id }: { characterId: string }) => {
      setOnlineIds((atual) => {
        const novo = new Set(atual);
        novo.delete(Number(id));
        return novo;
      });
    });

    socket.on(
      SOCKET_EVENTS.PVP.DESAFIO_RECEBIDO,
      (payload: { idDesafiante: number; nomeDesafiante: string; prazoSegundos: number }) => {
        setDesafioRecebido({ ...payload, recebidoEm: Date.now() });
      },
    );

    socket.on(SOCKET_EVENTS.PVP.DESAFIO_ENVIADO, ({ idDesafiado }: { idDesafiado: number }) => {
      setDesafioEnviadoPara(idDesafiado);
    });

    socket.on(SOCKET_EVENTS.PVP.DESAFIO_RECUSADO, () => {
      setDesafioEnviadoPara(null);
      setErro("O jogador recusou seu desafio.");
    });

    socket.on(SOCKET_EVENTS.PVP.DESAFIO_EXPIRADO, () => {
      setDesafioEnviadoPara(null);
      setErro("O jogador não respondeu a tempo.");
    });

    socket.on(SOCKET_EVENTS.PVP.DESAFIO_CANCELADO, () => {
      setDesafioRecebido(null);
    });

    socket.on(SOCKET_EVENTS.PVP.DUELO_INICIADO, (payload: DueloIniciadoPayload) => {
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
    });

    socket.on(SOCKET_EVENTS.PVP.TURNO_RESULTADO, (payload: TurnoResultadoPayload) => {
      setTurnos((atual) => [...atual, payload]);
    });

    socket.on(SOCKET_EVENTS.PVP.DUELO_FIM, (payload: DueloFimPayload) => {
      setResultadoFinal(payload);
    });

    socket.on(SOCKET_EVENTS.PVP.ERRO, ({ mensagem }: { mensagem: string }) => {
      setErro(mensagem);
    });

    // Arena Ranqueada — reaproveita SOCKET_EVENTS.PVP.DUELO_INICIADO's equivalente
    // (ranked:match:start), com o MESMO shape de payload, então o duelo
    // vira o mesmo estado `duelo` que LiveDuelArena já sabe renderizar.
    socket.on(SOCKET_EVENTS.RANKED.QUEUE_UPDATE, (payload: RankedQueueUpdatePayload) => {
      setFilaRanked(payload);
    });

    socket.on(SOCKET_EVENTS.RANKED.MATCH_FOUND, (payload: RankedMatchFoundPayload) => {
      setMatchEncontradoRanked(payload);
    });

    socket.on(SOCKET_EVENTS.RANKED.MATCH_START, (payload: DueloIniciadoPayload) => {
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
    });

    // Torneio — cada jogo de uma série (MD3/MD5) é um duelo ao vivo
    // normal emitido pelo MESMO evento SOCKET_EVENTS.PVP.DUELO_INICIADO (tratado
    // acima), só com `payload.torneio = {serieId, round, formato}`. Não
    // existe um evento SOCKET_EVENTS.TORNEIO.DUELO_INICIADO separado no backend.
    //
    // Ready-check da série: entra na sala com SOCKET_EVENTS.TORNEIO.ENTRAR_SALA e
    // ouve as atualizações — é o único jeito de saber quem já confirmou
    // presença (o REST não expõe readyA/readyB).
    socket.on(SOCKET_EVENTS.TORNEIO.SERIE_ATUALIZADA, (payload: TorneioSerieAtualizadaPayload) => {
      setSerieTorneio(payload);
    });

    socket.on(SOCKET_EVENTS.TORNEIO.SERIE_PLACAR, (payload: TorneioSerieAtualizadaPayload) => {
      setSerieTorneio((atual) =>
        atual && atual.serieId === payload.serieId ? { ...atual, ...payload } : payload,
      );
    });

    socket.on(SOCKET_EVENTS.TORNEIO.ERRO, ({ mensagem }: { mensagem: string }) => {
      setErro(mensagem);
    });

    socket.on(SOCKET_EVENTS.RANKED.RATING_UPDATE, (payload: RankedRatingUpdatePayload) => {
      setRatingUpdate(payload);
    });

    socket.on(SOCKET_EVENTS.RANKED.OPONENTE_DESCONECTADO, (payload: RankedOponenteDesconectadoPayload) => {
      setOponenteDesconectadoRanked(payload);
    });

    socket.on(SOCKET_EVENTS.RANKED.OPONENTE_RECONECTADO, () => {
      setOponenteDesconectadoRanked(null);
    });

    // Aventura em grupo (party)
    socket.on(SOCKET_EVENTS.PARTY.CONVITE_RECEBIDO, (payload: Omit<ConvitePartyRecebido, "recebidoEm">) => {
      setConvitePartyRecebido({ ...payload, recebidoEm: Date.now() });
    });

    socket.on(SOCKET_EVENTS.PARTY.CONVITE_ENVIADO, ({ idConvidado }: { idConvidado: number }) => {
      setConvitePartyEnviadoPara(idConvidado);
    });

    socket.on(SOCKET_EVENTS.PARTY.CONVITE_RECUSADO, () => {
      setConvitePartyEnviadoPara(null);
      setErroParty("O jogador recusou o convite.");
    });

    socket.on(SOCKET_EVENTS.PARTY.CONVITE_EXPIRADO, () => {
      setConvitePartyEnviadoPara(null);
      setErroParty("O jogador não respondeu a tempo.");
    });

    socket.on(SOCKET_EVENTS.PARTY.CONVITE_CANCELADO, () => {
      setConvitePartyRecebido(null);
    });

    socket.on(SOCKET_EVENTS.PARTY.GRUPO_ATUALIZADO, (payload: GrupoAtualizadoPayload) => {
      setConvitePartyRecebido(null);
      setConvitePartyEnviadoPara(null);
      setGrupoAtual(payload);
    });

    socket.on(SOCKET_EVENTS.PARTY.GRUPO_DESFEITO, () => {
      setGrupoAtual(null);
    });

    socket.on(SOCKET_EVENTS.PARTY.EXPULSO, () => {
      setGrupoAtual(null);
      setErroParty("Você foi removido do grupo pelo anfitrião.");
    });

    socket.on(SOCKET_EVENTS.PARTY.BATALHA_INICIADA, (payload: BatalhaGrupoIniciadaPayload) => {
      setGrupoAtual(null);
      setResultadoGrupo(null);
      setTurnosGrupo([]);
      setBatalhaGrupo(payload);
      setTurnoAtualGrupo(payload.turnoDe);
      setRodadaAtualGrupo(payload.rodada);
      router.push("/dashboard/adventure");
    });

    // Resync após F5/reconexão (bug reportado: a tela de batalha em
    // grupo nunca repovoava sozinha, só o INÍCIO da luta disparava
    // SOCKET_EVENTS.PARTY.BATALHA_INICIADA) — MESMO formato de payload (ver
    // montarPayloadBatalha no backend), com os valores ATUAIS da luta.
    socket.on(SOCKET_EVENTS.PARTY.BATALHA_ESTADO, (payload: BatalhaGrupoIniciadaPayload) => {
      setResultadoGrupo(null);
      setTurnosGrupo([]);
      setBatalhaGrupo(payload);
      setTurnoAtualGrupo(payload.turnoDe);
      setRodadaAtualGrupo(payload.rodada);
      router.push("/dashboard/adventure");
    });

    socket.on(SOCKET_EVENTS.PARTY.TURNO_RESULTADO, (payload: TurnoGrupoPayload) => {
      setTurnosGrupo((atual) => [...atual, payload]);
    });

    socket.on(SOCKET_EVENTS.PARTY.PROXIMO_TURNO, (payload: ProximoTurnoGrupoPayload) => {
      setTurnoAtualGrupo(payload.turnoDe);
      setRodadaAtualGrupo(payload.rodada);
    });

    socket.on(SOCKET_EVENTS.PARTY.BATALHA_FIM, (payload: BatalhaGrupoFimPayload) => {
      setResultadoGrupo(payload);
    });

    socket.on(SOCKET_EVENTS.PARTY.ERRO, ({ mensagem }: { mensagem: string }) => {
      setErroParty(mensagem);
    });

    // Boss da Guilda V2.0 (batalha em tempo real) — sem sala de espera,
    // "entrar" já devolve direto dentro da luta (ver comentário em
    // BatalhaBossGuildaIniciadaPayload).
    socket.on(SOCKET_EVENTS.GUILDBOSS.BATALHA_INICIADA, (payload: BatalhaBossGuildaIniciadaPayload) => {
      setResultadoBossGuilda(null);
      setTurnosBossGuilda([]);
      setCastBossGuilda(null);
      setBatalhaBossGuilda(payload);
      setTurnoAtualBossGuilda(payload.turnoDe);
      setRodadaAtualBossGuilda(payload.rodada);
    });

    // Reconexão/F5/segunda aba OU entrando numa luta já em andamento —
    // MESMO formato de "batalha-iniciada" (ver montarEstadoBatalha no
    // backend), nunca um shape próprio.
    socket.on(SOCKET_EVENTS.GUILDBOSS.ESTADO, (payload: BatalhaBossGuildaIniciadaPayload) => {
      setResultadoBossGuilda(null);
      setTurnosBossGuilda([]);
      setCastBossGuilda(null);
      setBatalhaBossGuilda(payload);
      setTurnoAtualBossGuilda(payload.turnoDe);
      setRodadaAtualBossGuilda(payload.rodada);
    });

    // Outro membro da guilda entrou no meio da luta — soma na lista de
    // aliados em vez de substituir o estado inteiro.
    socket.on(SOCKET_EVENTS.GUILDBOSS.MEMBRO_ENTROU, (payload: MembroEntrouBossGuildaPayload) => {
      setBatalhaBossGuilda((atual) => {
        if (!atual || atual.battleId !== payload.battleId) return atual;
        if (atual.membros.some((m) => m.id === payload.membro.id)) return atual;
        return { ...atual, membros: [...atual.membros, payload.membro], ordem: payload.ordem };
      });
    });

    socket.on(SOCKET_EVENTS.GUILDBOSS.TURNO_RESULTADO, (payload: TurnoBossGuildaPayload) => {
      setTurnosBossGuilda((atual) => [...atual, payload]);
      setCastBossGuilda(null);
    });

    socket.on(SOCKET_EVENTS.GUILDBOSS.PROXIMO_TURNO, (payload: ProximoTurnoBossGuildaPayload) => {
      setTurnoAtualBossGuilda(payload.turnoDe);
      setRodadaAtualBossGuilda(payload.rodada);
    });

    // Telegraph do contra-ataque do chefe (ver executarTurnoChefe no
    // backend) — SEMPRE chega antes do "turno-resultado" de origem
    // "chefe", mesmo sem nenhuma habilidade (ritmo de turno igual à
    // Ameaça Mundial).
    socket.on(SOCKET_EVENTS.GUILDBOSS.CAST_START, (payload: CastStartBossGuildaPayload) => {
      setCastBossGuilda(payload);
    });

    socket.on(SOCKET_EVENTS.GUILDBOSS.BATALHA_FIM, (payload: BatalhaBossGuildaFimPayload) => {
      setResultadoBossGuilda(payload);
      setCastBossGuilda(null);
    });

    socket.on(SOCKET_EVENTS.GUILDBOSS.ERRO, ({ mensagem }: { mensagem: string }) => {
      setErroBossGuilda(mensagem);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId]);

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
