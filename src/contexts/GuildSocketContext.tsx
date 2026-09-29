"use client";

// Fonte única da conexão de socket "sala da guilda" — antes cada aba
// (Mural, Chat, Missões) abria sua PRÓPRIA conexão + handshake
// (identificar + join-room) de forma independente e duplicada, mesmo
// todas apontando pra mesma sala no backend (guildSocket.js:
// salaDaGuild(idGuild)). Isso desperdiçava conexões e, pior, uma cópia
// do handshake (a do Mural/Missões) nem esperava o ack de
// "guild:identificar" antes de mandar "guild:join-room" — exatamente a
// corrida que o comentário em guildSocket.js descreve como causa raiz
// de "chat da guilda não envia mensagem" (aqui o efeito seria "aba não
// entra na sala e não recebe eventos ao vivo").
//
// Um Provider por guilda aberta (ver GuildDashboard.tsx, fica FORA do
// `if (aba === ...)` pra sobreviver à troca de aba) faz o handshake uma
// vez só, direito, e todo mundo que estiver dentro do Provider escuta o
// mesmo socket via useGuildSocket().
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import axiosInstance from "@/utils/axiosIntance";

function socketUrlFromApiUrl(apiUrl: string) {
  return apiUrl.replace(/\/api\/?$/, "");
}

interface JoinRoomResultado {
  idGuild?: number;
  historico?: unknown[];
  erro?: string;
}

interface GuildSocketContextValue {
  socket: Socket | null;
  pronto: boolean;
  erro: string;
  // Resultado do "guild:join-room" (feito uma única vez pelo Provider) —
  // guarda o histórico de chat inicial aqui porque só esse ack o
  // devolve; quem precisar (GuildChatTab) lê na entrada, ignora depois.
  resultadoJoinRoom: JoinRoomResultado | null;
}

const GuildSocketContext = createContext<GuildSocketContextValue>({
  socket: null,
  pronto: false,
  erro: "",
  resultadoJoinRoom: null,
});

export function GuildSocketProvider({
  idGuild,
  children,
}: {
  idGuild: number;
  children: ReactNode;
}) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [pronto, setPronto] = useState(false);
  const [erro, setErro] = useState("");
  const [resultadoJoinRoom, setResultadoJoinRoom] = useState<JoinRoomResultado | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const baseUrl = socketUrlFromApiUrl(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api");
    const novoSocket = io(baseUrl, { transports: ["websocket", "polling"] });
    socketRef.current = novoSocket;
    setPronto(false);
    setResultadoJoinRoom(null);

    novoSocket.on("connect", () => {
      setErro("");
      axiosInstance
        .get<{ data?: { ticket?: string } }>("/users/socket-ticket")
        .then((resp) => {
          const ticket = resp.data?.data?.ticket;
          if (!ticket) return;
          // Só dispara join-room DEPOIS do ack de identificar — ver
          // rationale completo no comentário do topo do arquivo.
          novoSocket.emit("guild:identificar", { ticket }, (respostaIdentificar: { erro?: string }) => {
            if (respostaIdentificar?.erro) {
              console.error("Erro ao identificar personagem na guilda:", respostaIdentificar.erro);
              setErro("Não foi possível autenticar a conexão em tempo real da guilda.");
              return;
            }
            novoSocket.emit("guild:join-room", {}, (resposta: JoinRoomResultado) => {
              if (resposta?.erro) {
                console.error("Erro ao entrar na sala da guilda:", resposta.erro);
                setErro(resposta.erro);
                return;
              }
              setResultadoJoinRoom(resposta ?? null);
              setPronto(true);
            });
          });
        })
        .catch((erroCatch) => {
          console.error("Erro ao autenticar conexão da guilda:", erroCatch);
          setErro("Não foi possível autenticar a conexão em tempo real da guilda.");
        });
    });

    novoSocket.on("disconnect", () => setPronto(false));

    setSocket(novoSocket);

    return () => {
      novoSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setPronto(false);
    };
  }, [idGuild]);

  return (
    <GuildSocketContext.Provider value={{ socket, pronto, erro, resultadoJoinRoom }}>
      {children}
    </GuildSocketContext.Provider>
  );
}

export function useGuildSocket() {
  return useContext(GuildSocketContext);
}
