"use client";

// Boss Global — contexto de socket LEVE e SEPARADO de PvpSocketContext
// de propósito: a sala "worldboss:global" é só broadcast público (HP/
// fase/desperta/derrotado/ações do Boss/ranking), sem "identificar"
// nenhum — nunca precisa entrar na engrenagem grande de duelo/party/
// guildboss já existente (que é um arquivo crítico de mais de mil
// linhas). Uma conexão própria e pequena é o jeito mais seguro de
// adicionar isso sob prazo, sem arriscar regressão no PvP/Aventura em
// grupo. Ameaça Mundial V2 (§17.3/§18) acrescenta aqui os broadcasts
// do relógio de combate — Furia/fase/cast/derrotas/ranking — que
// QUALQUER jogador vê acontecer, esteja ele na luta ou só de passagem.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import {
  obterRankingWorldBoss,
  obterStatusWorldBoss,
  type WorldBossRankingApi,
  type WorldBossStatusApi,
} from "@/lib/api/worldBoss";
import { useCharacter } from "./CharacterContext";

interface WorldBossHpAtualizado {
  hp_max: number;
  hp_current: number;
  hp_percentual: number;
}

interface WorldBossBossAcaoPayload {
  boss_action_seq: number;
  phase_action_seq: number;
  furia_current_pct: number;
  mana_current: number;
  fase?: { ordem: number; nome_fase: string };
  boss_bloqueado?: string;
  habilidade?: {
    power: { id: number; nome: string } | null;
    // critico (Precisão/Crítico, Velocidade) ausente em respostas
    // antigas (compatibilidade), tratado como false nesse caso.
    alvos: { character_id: number; nome: string; dano: number; esquivou: boolean; critico?: boolean; derrotado: boolean }[];
    cura_self?: number;
  };
  alvo?: { character_id: number; nome: string; dano: number; esquivou: boolean; critico?: boolean; derrotado: boolean };
  castIniciado?: { power: { id: number; nome: string; imagem_url: string | null } | null; resolves_at: string };
}
interface WorldBossCastStartPayload {
  power: { id: number; nome: string; imagem_url: string | null } | null;
  started_at: string;
  resolves_at: string;
}
interface WorldBossFasePayload {
  fase: string;
  ordem: number;
  texto_alerta: string | null;
}
interface WorldBossParticipanteDerrotadoPayload {
  character_id: number;
  nome: string;
}

export interface WorldBossFeedEntry {
  id: number;
  texto: string;
  tipo: "dano" | "derrota" | "fase" | "cast" | "info";
}

// Bug relatado ("não tá igual aventura") — WorldBossArena mostrava um
// golpe do Boss em mim só como uma linha de texto no feed, nunca como
// reação visual (flash/número flutuante) na própria cena de batalha,
// porque `worldboss:boss-acao` é um broadcast GLOBAL (todo mundo recebe
// o mesmo evento, atingido ou não) e nada aqui filtrava "esse alvo sou
// eu". `seq` incrementa a cada impacto novo pra quem consome poder
// disparar a animação via useEffect mesmo quando dois impactos seguidos
// têm o mesmo dano (um valor igual ao anterior não dispara reatividade
// sozinho).
export interface WorldBossImpactoEmMim {
  seq: number;
  dano: number;
  critico: boolean;
  esquivou: boolean;
  derrotado: boolean;
  origem: string;
}

interface WorldBossSocketContextValue {
  status: WorldBossStatusApi | null;
  ranking: WorldBossRankingApi | null;
  feed: WorldBossFeedEntry[];
  faseAlerta: WorldBossFasePayload | null;
  impactoEmMim: WorldBossImpactoEmMim | null;
  recarregar: () => void;
}

const WorldBossSocketContext = createContext<WorldBossSocketContextValue>({
  status: null,
  ranking: null,
  feed: [],
  faseAlerta: null,
  impactoEmMim: null,
  recarregar: () => {},
});

function socketUrlFromApiUrl(apiUrl: string) {
  return apiUrl.replace(/\/api\/?$/, "");
}

export function WorldBossSocketProvider({ children }: { children: React.ReactNode }) {
  const { character } = useCharacter();
  const [status, setStatus] = useState<WorldBossStatusApi | null>(null);
  const [ranking, setRanking] = useState<WorldBossRankingApi | null>(null);
  const [feed, setFeed] = useState<WorldBossFeedEntry[]>([]);
  const [faseAlerta, setFaseAlerta] = useState<WorldBossFasePayload | null>(null);
  const [impactoEmMim, setImpactoEmMim] = useState<WorldBossImpactoEmMim | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const proximoFeedId = useRef(1);
  const proximoImpactoSeq = useRef(1);
  // Lido dentro do listener de socket (montado uma única vez no mount
  // deste provider) — nunca o `character` da closure, que ficaria
  // travado no personagem de quando o socket conectou.
  const meuIdRef = useRef<number | null>(character?.id ?? null);
  useEffect(() => {
    meuIdRef.current = character?.id ?? null;
  }, [character?.id]);

  const adicionarFeed = useCallback((texto: string, tipo: WorldBossFeedEntry["tipo"]) => {
    const id = proximoFeedId.current++;
    setFeed((linhas) => [{ id, texto, tipo }, ...linhas].slice(0, 40));
  }, []);

  const recarregar = useCallback(() => {
    obterStatusWorldBoss()
      .then(setStatus)
      .catch(() => {});
    obterRankingWorldBoss()
      .then(setRanking)
      .catch(() => {});
  }, []);

  useEffect(() => {
    recarregar();

    const baseUrl = socketUrlFromApiUrl(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api");
    const socket = io(baseUrl, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => socket.emit("worldboss:entrar"));

    socket.on("worldboss:status", (payload: WorldBossStatusApi) => setStatus(payload));
    socket.on("worldboss:desperta", (payload: WorldBossStatusApi) => {
      setStatus(payload);
      setFeed([]);
      setFaseAlerta(null);
    });
    socket.on("worldboss:derrotado", (payload: WorldBossStatusApi) => {
      setStatus(payload);
      adicionarFeed(`${payload.nome ?? "A Ameaça Mundial"} foi derrotada!`, "derrota");
      obterRankingWorldBoss()
        .then(setRanking)
        .catch(() => {});
    });
    socket.on("worldboss:hp-atualizado", (payload: WorldBossHpAtualizado) => {
      setStatus((atual) => (atual ? { ...atual, ...payload } : atual));
    });

    // §18.1/§18.2 — relógio de combate ao vivo: cada ação do Boss
    // (ataque básico ou habilidade) atualiza Furia/fase/mana e vira uma
    // linha no feed pra TODO MUNDO conectado, não só quem foi atingido.
    socket.on("worldboss:boss-acao", (payload: WorldBossBossAcaoPayload) => {
      setStatus((atual) => {
        if (!atual) return atual;
        return {
          ...atual,
          combate: {
            furia_atual_pct: payload.furia_current_pct,
            boss_action_seq: payload.boss_action_seq,
            phase_action_seq: payload.phase_action_seq,
            proxima_acao_em_ms: atual.combate?.proxima_acao_em_ms ?? null,
            cast_pendente: payload.castIniciado ? { power: payload.castIniciado.power, resolves_at: payload.castIniciado.resolves_at } : null,
          },
        };
      });

      const registrarImpactoSeEuForOAlvo = (
        alvo: { character_id: number; dano: number; esquivou: boolean; critico?: boolean; derrotado: boolean },
        origem: string,
      ) => {
        if (meuIdRef.current === null || alvo.character_id !== meuIdRef.current) return;
        setImpactoEmMim({
          seq: proximoImpactoSeq.current++,
          dano: alvo.dano,
          critico: Boolean(alvo.critico),
          esquivou: alvo.esquivou,
          derrotado: alvo.derrotado,
          origem,
        });
      };

      if (payload.habilidade) {
        const nomePower = payload.habilidade.power?.nome ?? "uma habilidade";
        for (const alvo of payload.habilidade.alvos) {
          if (alvo.esquivou) adicionarFeed(`${nomePower} mirou em ${alvo.nome}, que esquivou.`, "info");
          else
            adicionarFeed(
              `${nomePower} atingiu ${alvo.nome}: ${alvo.dano.toLocaleString("pt-BR")} de dano.${alvo.critico ? " ACERTO CRÍTICO!" : ""}`,
              "dano",
            );
          registrarImpactoSeEuForOAlvo(alvo, nomePower);
        }
        if (payload.habilidade.alvos.length === 0 && payload.habilidade.cura_self) {
          adicionarFeed(`O Boss usou ${nomePower} e se curou.`, "info");
        }
      } else if (payload.alvo) {
        if (payload.alvo.esquivou) adicionarFeed(`O Boss atacou ${payload.alvo.nome}, que esquivou.`, "info");
        else
          adicionarFeed(
            `O Boss atacou ${payload.alvo.nome}: ${payload.alvo.dano.toLocaleString("pt-BR")} de dano.${payload.alvo.critico ? " ACERTO CRÍTICO!" : ""}`,
            "dano",
          );
        registrarImpactoSeEuForOAlvo(payload.alvo, "O Boss");
      } else if (payload.boss_bloqueado) {
        adicionarFeed(`O Boss perdeu a ação (${payload.boss_bloqueado}).`, "info");
      }
    });

    socket.on("worldboss:cast-start", (payload: WorldBossCastStartPayload) => {
      setStatus((atual) => {
        if (!atual) return atual;
        return { ...atual, combate: atual.combate ? { ...atual.combate, cast_pendente: { power: payload.power, resolves_at: payload.resolves_at } } : atual.combate };
      });
      adicionarFeed(`O Boss está conjurando ${payload.power?.nome ?? "algo perigoso"}!`, "cast");
    });

    socket.on("worldboss:fase", (payload: WorldBossFasePayload) => {
      setStatus((atual) => (atual ? { ...atual, fase_atual: { ...(atual.fase_atual ?? { hp_percentual_max: 0, modificador_dano_percentual: 0 }), ordem: payload.ordem, nome_fase: payload.fase, texto_alerta: payload.texto_alerta } } : atual));
      setFaseAlerta(payload);
      adicionarFeed(`Nova fase: ${payload.fase}!`, "fase");
      window.setTimeout(() => setFaseAlerta((atual) => (atual?.ordem === payload.ordem ? null : atual)), 6000);
    });

    socket.on("worldboss:participante-derrotado", (payload: WorldBossParticipanteDerrotadoPayload) => {
      adicionarFeed(`${payload.nome} foi derrotado pela Ameaça Mundial.`, "derrota");
    });

    socket.on("worldboss:ranking-update", (payload: WorldBossRankingApi) => setRanking(payload));
    socket.on("worldboss:ranking-final", (payload: WorldBossRankingApi) => setRanking(payload));

    return () => {
      socket.emit("worldboss:sair");
      socket.disconnect();
    };
  }, [recarregar, adicionarFeed]);

  return (
    <WorldBossSocketContext.Provider value={{ status, ranking, feed, faseAlerta, impactoEmMim, recarregar }}>
      {children}
    </WorldBossSocketContext.Provider>
  );
}

export function useWorldBossSocket() {
  return useContext(WorldBossSocketContext);
}
