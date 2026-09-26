"use client";

// Sistema de Proezas Únicas §12.1 — contexto de socket LEVE e SEPARADO,
// no mesmo espírito de WorldBossSocketContext: o evento "uniqueFeat:claimed"
// é um broadcast global único (emitido pra TODO MUNDO conectado, sem sala
// específica — ver uniqueFeatSocket.js/emitGlobal no backend), nunca uma
// mecânica de duelo/party/guildboss. Uma conexão própria e pequena evita
// mexer no PvpSocketContext (arquivo grande e crítico) só pra um toast.
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { UniqueFeatItem } from "@/lib/api/unique-feats";

interface UniqueFeatSocketContextValue {
  ultimoAnuncio: UniqueFeatItem | null;
  dispensarAnuncio: () => void;
}

const UniqueFeatSocketContext = createContext<UniqueFeatSocketContextValue>({
  ultimoAnuncio: null,
  dispensarAnuncio: () => {},
});

function socketUrlFromApiUrl(apiUrl: string) {
  return apiUrl.replace(/\/api\/?$/, "");
}

export function UniqueFeatSocketProvider({ children }: { children: React.ReactNode }) {
  const [ultimoAnuncio, setUltimoAnuncio] = useState<UniqueFeatItem | null>(null);
  const socketRef = useRef<Socket | null>(null);

  function dispensarAnuncio() {
    setUltimoAnuncio(null);
  }

  useEffect(() => {
    const baseUrl = socketUrlFromApiUrl(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api");
    const socket = io(baseUrl, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    // Sem sala pra entrar — é um broadcast global de verdade (io.emit no
    // backend), qualquer socket conectado já recebe.
    socket.on("uniqueFeat:claimed", (payload: UniqueFeatItem) => setUltimoAnuncio(payload));

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <UniqueFeatSocketContext.Provider value={{ ultimoAnuncio, dispensarAnuncio }}>
      {children}
    </UniqueFeatSocketContext.Provider>
  );
}

export function useUniqueFeatSocket() {
  return useContext(UniqueFeatSocketContext);
}
