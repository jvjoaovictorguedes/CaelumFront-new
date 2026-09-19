"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, type Socket } from "socket.io-client";
import axiosInstance from "@/utils/axiosIntance";

export interface Conversa {
  usuario: { id: number; username: string };
  ultimaMensagem: string | null;
  ultimaMensagemEm: string | null;
  naoLidas: number;
}

export interface Mensagem {
  id: number;
  id_remetente: number;
  id_destinatario: number;
  conteudo: string;
  lida: boolean;
  createdAt: string;
  client_message_id?: string | null;
}

export interface MessageAckPayload {
  clientMessageId: string | null;
  mensagem: Mensagem;
  duplicada: boolean;
}

export interface MessageReadPayload {
  porUsuario: number;
}

interface MessagesSocketContextValue {
  conectado: boolean;
  onlineUserIds: Set<number>;
  inbox: Conversa[];
  totalNaoLidas: number;
  // Eventos ao vivo — cada componente de conversa filtra pelo que
  // importa a ele via um cursor local (mesmo padrão de `turnos` em
  // PvpSocketContext), em vez do contexto tentar adivinhar qual
  // conversa está aberta em cada componente que o consome.
  mensagensNovas: Mensagem[];
  acks: MessageAckPayload[];
  leituras: MessageReadPayload[];
  usuariosDigitando: Set<number>;
  reconectadoEm: number;
  somLiberado: boolean;
  ativarSom: () => void;
  enviar: (idDestinatario: number, conteudo: string, clientMessageId: string) => void;
  marcarComoLida: (idOutroUsuario: number) => void;
  iniciarDigitacao: (idDestinatario: number) => void;
  pararDigitacao: (idDestinatario: number) => void;
  recarregarInbox: () => Promise<void>;
}

const MessagesSocketContext = createContext<MessagesSocketContextValue | null>(null);

function socketUrlFromApiUrl(apiUrl: string) {
  return apiUrl.replace(/\/api\/?$/, "");
}

const SOM_LIBERADO_KEY = "somLiberado";
const TYPING_TIMEOUT_MS = 6000; // um pouco acima do timeout do servidor (5s), só de folga

export function MessagesSocketProvider({
  currentUserId,
  children,
}: {
  currentUserId?: number;
  children: React.ReactNode;
}) {
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const typingTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const [conectado, setConectado] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());
  const [inbox, setInbox] = useState<Conversa[]>([]);
  const [mensagensNovas, setMensagensNovas] = useState<Mensagem[]>([]);
  const [acks, setAcks] = useState<MessageAckPayload[]>([]);
  const [leituras, setLeituras] = useState<MessageReadPayload[]>([]);
  const [usuariosDigitando, setUsuariosDigitando] = useState<Set<number>>(new Set());
  const [reconectadoEm, setReconectadoEm] = useState(0);
  const [somLiberado, setSomLiberado] = useState(false);
  // Só pra essa sessão (não persiste) — fechar sem ativar não deve
  // esconder o aviso pra sempre, só parar de atrapalhar agora.
  const [bannerSomDispensado, setBannerSomDispensado] = useState(false);

  const totalNaoLidas = inbox.reduce((soma, conversa) => soma + conversa.naoLidas, 0);

  const recarregarInbox = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const resposta = await axiosInstance.get<{ data?: { conversas?: Conversa[] } }>(
        `/messages/inbox/${currentUserId}`,
      );
      setInbox(resposta.data?.data?.conversas ?? []);
    } catch (error) {
      console.error("Erro ao carregar caixa de entrada:", error);
    }
  }, [currentUserId]);

  function atualizarInboxComResumo(resumo: Conversa) {
    setInbox((atual) => {
      const semEsse = atual.filter((c) => c.usuario.id !== resumo.usuario.id);
      const novo = [resumo, ...semEsse];
      novo.sort((a, b) => {
        const dataA = a.ultimaMensagemEm ? new Date(a.ultimaMensagemEm).getTime() : 0;
        const dataB = b.ultimaMensagemEm ? new Date(b.ultimaMensagemEm).getTime() : 0;
        return dataB - dataA;
      });
      return novo;
    });
  }

  useEffect(() => {
    audioRef.current = new Audio("/sounds/message.mp3");
    audioRef.current.volume = 0.5;
    audioRef.current.preload = "auto";
    try {
      if (localStorage.getItem(SOM_LIBERADO_KEY) === "true") setSomLiberado(true);
    } catch {
      // localStorage bloqueado (aba anônima) — só volta a perguntar nessa visita.
    }
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const ativarSom = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        setSomLiberado(true);
        try {
          localStorage.setItem(SOM_LIBERADO_KEY, "true");
        } catch {
          // localStorage bloqueado — sem problema, só volta a perguntar depois.
        }
      })
      .catch((error) => console.warn("Não foi possível liberar o som:", error));
  }, []);

  useEffect(() => {
    const usaMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
    if (!currentUserId || usaMocks) return;

    const baseUrl = socketUrlFromApiUrl(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api");
    const socket = io(baseUrl, { transports: ["websocket", "polling"] });
    socketRef.current = socket;
    let jaConectouUmaVez = false;

    socket.on("connect", () => {
      setConectado(true);
      // Reconexão (não a primeira conexão) — REST garante consistência
      // do que o socket possa ter perdido enquanto caiu (spec §16).
      if (jaConectouUmaVez) {
        recarregarInbox();
        setReconectadoEm(Date.now());
      }
      jaConectouUmaVez = true;

      axiosInstance
        .get<{ data?: { ticket?: string } }>("/users/socket-ticket")
        .then((resp) => {
          const ticket = resp.data?.data?.ticket;
          if (!ticket) return;
          socket.emit("message:identificar", { ticket });
          socket.emit("message:listar-online", {}, (resposta: { online?: number[] }) => {
            setOnlineUserIds(new Set(resposta?.online ?? []));
          });
        })
        .catch(() => {
          console.error("Não foi possível autenticar a conexão de mensagens.");
        });
    });

    socket.on("disconnect", () => setConectado(false));

    socket.on("message:usuario-online", ({ idUsuario }: { idUsuario: number }) => {
      setOnlineUserIds((atual) => new Set(atual).add(idUsuario));
    });

    socket.on("message:usuario-offline", ({ idUsuario }: { idUsuario: number }) => {
      setOnlineUserIds((atual) => {
        const novo = new Set(atual);
        novo.delete(idUsuario);
        return novo;
      });
    });

    socket.on("message:new", (mensagem: Mensagem) => {
      setMensagensNovas((atual) => [...atual, mensagem]);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {
          // autoplay bloqueado — usuário ainda não clicou em "Ativar som".
        });
      }
    });

    socket.on("message:ack", (payload: MessageAckPayload) => {
      setAcks((atual) => [...atual, payload]);
    });

    socket.on("message:read", (payload: MessageReadPayload) => {
      setLeituras((atual) => [...atual, payload]);
    });

    socket.on("inbox:update", (resumo: Conversa) => {
      atualizarInboxComResumo(resumo);
    });

    socket.on("typing:start", ({ de_usuario }: { de_usuario: number }) => {
      setUsuariosDigitando((atual) => new Set(atual).add(de_usuario));
      clearTimeout(typingTimersRef.current.get(de_usuario));
      typingTimersRef.current.set(
        de_usuario,
        setTimeout(() => {
          setUsuariosDigitando((atual) => {
            const novo = new Set(atual);
            novo.delete(de_usuario);
            return novo;
          });
        }, TYPING_TIMEOUT_MS),
      );
    });

    socket.on("typing:stop", ({ de_usuario }: { de_usuario: number }) => {
      clearTimeout(typingTimersRef.current.get(de_usuario));
      typingTimersRef.current.delete(de_usuario);
      setUsuariosDigitando((atual) => {
        const novo = new Set(atual);
        novo.delete(de_usuario);
        return novo;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  // Carga inicial da inbox (independe do socket conectar — REST é a
  // fonte pra carga inicial, spec §3).
  useEffect(() => {
    recarregarInbox();
  }, [recarregarInbox]);

  const enviar = useCallback((idDestinatario: number, conteudo: string, clientMessageId: string) => {
    socketRef.current?.emit("message:send", {
      id_destinatario: idDestinatario,
      conteudo,
      client_message_id: clientMessageId,
    });
  }, []);

  const marcarComoLida = useCallback((idOutroUsuario: number) => {
    socketRef.current?.emit("conversation:read", { id_outro_usuario: idOutroUsuario });
  }, []);

  const iniciarDigitacao = useCallback((idDestinatario: number) => {
    socketRef.current?.emit("typing:start", { id_destinatario: idDestinatario });
  }, []);

  const pararDigitacao = useCallback((idDestinatario: number) => {
    socketRef.current?.emit("typing:stop", { id_destinatario: idDestinatario });
  }, []);

  return (
    <MessagesSocketContext.Provider
      value={{
        conectado,
        onlineUserIds,
        inbox,
        totalNaoLidas,
        mensagensNovas,
        acks,
        leituras,
        usuariosDigitando,
        reconectadoEm,
        somLiberado,
        ativarSom,
        enviar,
        marcarComoLida,
        iniciarDigitacao,
        pararDigitacao,
        recarregarInbox,
      }}
    >
      {children}
      {!somLiberado && !bannerSomDispensado && currentUserId && (
        <div className="fixed bottom-3 right-3 left-3 z-50 flex max-w-full flex-wrap items-center gap-2 rounded-xl border-2 border-[#F3B43F] bg-[#292018] p-2.5 text-white shadow-2xl sm:left-auto sm:max-w-sm sm:flex-nowrap">
          <span className="min-w-0 flex-1 text-xs">🔊 Clique pra habilitar o som de novas mensagens.</span>
          <button
            onClick={ativarSom}
            className="shrink-0 rounded-lg bg-[#F3B43F] px-3 py-1 text-xs font-bold text-black transition hover:bg-[#dfa234]"
          >
            Ativar Som
          </button>
          <button
            onClick={() => setBannerSomDispensado(true)}
            aria-label="Fechar aviso"
            className="shrink-0 rounded-lg px-1.5 py-1 text-xs text-white/50 transition hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
    </MessagesSocketContext.Provider>
  );
}

export function useMessagesSocket() {
  const ctx = useContext(MessagesSocketContext);
  if (!ctx) {
    throw new Error("useMessagesSocket precisa ser usado dentro de MessagesSocketProvider");
  }
  return ctx;
}
