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
  // Diferente de `conectado` (só a camada de transporte/TCP-websocket):
  // `identificado` só vira true DEPOIS do ack de SOCKET_EVENTS.TRANSPORT.
  // IDENTIFY, que é quando o servidor efetivamente seta socket.characterId.
  // Bug reportado ("clico em Enfrentar o Guardião e a batalha não
  // inicia"): qualquer ação que dependa de socket.characterId (ex.:
  // templeboss:entrar) emitida ENTRE o `connect` e esse ack chega no
  // servidor sem characterId nenhum — nunca basta `conectado === true`
  // pra saber que já dá pra agir.
  const [identificado, setIdentificado] = useState(false);
  const [onlineIds, setOnlineIds] = useState<Set<number>>(new Set());
  useEffect(() => {
    if (!characterId) return;

    const baseUrl = socketUrlFromApiUrl(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
    );
    // "polling" primeiro, "websocket" depois (faz o upgrade assim que
    // possível) — na ordem inversa, o cliente tenta um handshake de
    // WebSocket "a frio" (sem a negociação HTTP normal antes), que pode
    // falhar silenciosamente atrás de certos proxies/load balancers
    // (reproduzido: o handshake HTTP comum do Socket.IO respondia
    // perfeito, mas a conexão real do app nunca terminava de
    // identificar). Esta é a ordem padrão do próprio socket.io-client.
    const socket = io(baseUrl, { transports: ["polling", "websocket"] });
    socketRef.current = socket;
    let active = true;
    const scope = createListenerScope(socket);

    scope.on("connect", () => {
      setConectado(true);
      // Toda conexão NOVA (primeira vez ou reconexão) sempre exige um
      // IDENTIFY novo — nunca reaproveita um `identificado=true` de uma
      // conexão anterior enquanto o ack desta ainda não chegou.
      setIdentificado(false);
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
            if (!active || !socket.connected) return;
            setIdentificado(true);
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

    scope.on("disconnect", () => {
      setConectado(false);
      setIdentificado(false);
    });

    const disposeDomains = registerDomains(socket);
    for (const event of ["pvp:erro","party:erro","guildboss:erro"]) {
      scope.on(event,(error: {code?:string}) => {
        if(error.code === "ANTI_AUTOMATION_CHALLENGE_REQUIRED") window.dispatchEvent(new Event("caelum:verification-required"));
      });
    }
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
  }, [characterId, setErro, registerDomains]);
  return { socketRef, conectado, identificado, onlineIds };
}
