"use client";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { io, type Socket } from "socket.io-client";
import axiosInstance from "@/utils/axiosIntance";
import { SOCKET_EVENTS } from "@/types/contracts/socketEvents";
import { createListenerScope } from "./listenerScope";

function socketUrlFromApiUrl(apiUrl: string) {
  return apiUrl.replace(/\/api\/?$/, "");
}

/** One transport for PvP, ranked, tournament, party and guild boss domains. */
export function useCombatTransport(
  characterId: number | undefined,
  setErro: Dispatch<SetStateAction<string>>,
  registerDomains: (socket: Socket) => Array<() => void>,
) {
  const socketRef = useRef<Socket | null>(null);
  const [conectado, setConectado] = useState(false);
  const [onlineIds, setOnlineIds] = useState<Set<number>>(new Set());
  useEffect(() => {
    if (!characterId) return;

    const baseUrl = socketUrlFromApiUrl(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
    );
    const socket = io(baseUrl, { transports: ["websocket", "polling"] });
    socketRef.current = socket;
    let active = true;
    const scope = createListenerScope(socket);

    scope.on("connect", () => {
      setConectado(true);
      // O JWT é httpOnly (o browser não tem acesso), então o socket não
      // consegue mandar um Bearer no identificar — busca um ticket de
      // curtíssima duração via HTTP (que passa pelo proxy same-origin e
      // carrega o cookie) e manda ele, nunca o characterId cru.
      axiosInstance
        .get<{ data?: { ticket?: string } }>("/users/socket-ticket")
        .then((resp) => {
          if (!active || !socket.connected) return;
          const ticket = resp.data?.data?.ticket;
          if (!ticket) return;
          // Callback de ack: o handler de SOCKET_EVENTS.TRANSPORT.IDENTIFY é assíncrono no
          // servidor, então emitir os resyncs abaixo sem esperar essa
          // confirmação corria o risco de chegar ANTES do servidor setar
          // socket.characterId (resync silenciosamente ignorado). Só
          // depois do ack é garantido que o personagem já está
          // identificado pra qualquer evento seguinte.
          socket.emit(SOCKET_EVENTS.TRANSPORT.IDENTIFY, { ticket }, () => {
            socket.emit(
              SOCKET_EVENTS.PVP.LISTAR_ONLINE,
              {},
              (resposta: { online?: string[] }) => {
                setOnlineIds(new Set((resposta?.online ?? []).map(Number)));
              },
            );
            // Resync após F5/reconexão (bug reportado): se o personagem já
            // estava numa batalha em grupo em andamento, o servidor
            // reenvia o estado ATUAL — sem isso a tela nunca repovoava
            // sozinha, só o processo do servidor continuava rodando a
            // luta.
            socket.emit(SOCKET_EVENTS.PARTY.ENTRAR_BATALHA);
          });
        })
        .catch(() => {
          if (active)
            setErro("Não foi possível autenticar a conexão em tempo real.");
        });
    });

    scope.on("disconnect", () => setConectado(false));

    const disposeDomains = registerDomains(socket);
    scope.on(
      SOCKET_EVENTS.PVP.FICOU_ONLINE,
      ({ characterId: id }: { characterId: string }) => {
        setOnlineIds((atual) => new Set(atual).add(Number(id)));
      },
    );
    scope.on(
      SOCKET_EVENTS.PVP.FICOU_OFFLINE,
      ({ characterId: id }: { characterId: string }) => {
        setOnlineIds((atual) => {
          const novo = new Set(atual);
          novo.delete(Number(id));
          return novo;
        });
      },
    );

    return () => {
      active = false;
      scope.dispose();
      disposeDomains.forEach((dispose) => dispose());
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId, setErro, registerDomains]);
  return { socketRef, conectado, onlineIds };
}
