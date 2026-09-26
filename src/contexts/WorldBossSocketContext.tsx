"use client";

// Boss Global — contexto de socket LEVE e SEPARADO de PvpSocketContext
// de propósito: a sala "worldboss:global" é só broadcast público (HP/
// fase/desperta/derrotado), sem "identificar" nenhum — nunca precisa
// entrar na engrenagem grande de duelo/party/guildboss já existente
// (que é um arquivo crítico de mais de mil linhas). Uma conexão própria
// e pequena é o jeito mais seguro de adicionar isso sob prazo, sem
// arriscar regressão no PvP/Aventura em grupo.
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { obterStatusWorldBoss, type WorldBossStatusApi } from "@/lib/api/worldBoss";

interface WorldBossHpAtualizado {
  hp_max: number;
  hp_current: number;
  hp_percentual: number;
}

interface WorldBossSocketContextValue {
  status: WorldBossStatusApi | null;
  recarregar: () => void;
}

const WorldBossSocketContext = createContext<WorldBossSocketContextValue>({
  status: null,
  recarregar: () => {},
});

function socketUrlFromApiUrl(apiUrl: string) {
  return apiUrl.replace(/\/api\/?$/, "");
}

export function WorldBossSocketProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<WorldBossStatusApi | null>(null);
  const socketRef = useRef<Socket | null>(null);

  function recarregar() {
    obterStatusWorldBoss()
      .then(setStatus)
      .catch(() => {});
  }

  useEffect(() => {
    recarregar();

    const baseUrl = socketUrlFromApiUrl(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api");
    const socket = io(baseUrl, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => socket.emit("worldboss:entrar"));

    socket.on("worldboss:status", (payload: WorldBossStatusApi) => setStatus(payload));
    socket.on("worldboss:desperta", (payload: WorldBossStatusApi) => setStatus(payload));
    socket.on("worldboss:derrotado", (payload: WorldBossStatusApi) => setStatus(payload));
    socket.on("worldboss:hp-atualizado", (payload: WorldBossHpAtualizado) => {
      setStatus((atual) => (atual ? { ...atual, ...payload } : atual));
    });

    return () => {
      socket.emit("worldboss:sair");
      socket.disconnect();
    };
  }, []);

  return (
    <WorldBossSocketContext.Provider value={{ status, recarregar }}>
      {children}
    </WorldBossSocketContext.Provider>
  );
}

export function useWorldBossSocket() {
  return useContext(WorldBossSocketContext);
}
