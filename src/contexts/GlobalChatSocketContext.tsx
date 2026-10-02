"use client";

// Conexão única do chat global — mesmo padrão de GuildSocketContext.tsx:
// um Provider montado uma vez no DashboardLayout (sobrevive à troca de
// página, não só de aba) faz o handshake (identificar + entrar) uma vez
// só, e o widget flutuante (FloatingGlobalChatWidget) só consome o
// contexto. Conectado o tempo todo, mesmo com o painel fechado — é isso
// que permite o badge de "não lida" funcionar sem precisar abrir o chat.
import {
  createContext,
  useCallback,
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

// Pedido do jogador: responder uma mensagem específica, igual WhatsApp.
// nome/texto aqui são a citação CONGELADA no momento do envio (ver
// globalChatService.persistirMensagem no backend) — nunca mudam
// retroativamente, mesmo que o personagem original troque de nome ou a
// mensagem citada já tenha sido apagada pela limpeza mensal.
export interface RespostaChatGlobal {
  id: number;
  nome: string;
  texto: string;
}

export interface MensagemChatGlobal {
  id: number;
  idPersonagem: number;
  nome: string;
  texto: string;
  data: string;
  respondendoA?: RespostaChatGlobal | null;
}

interface GlobalChatSocketContextValue {
  pronto: boolean;
  erro: string;
  mensagens: MensagemChatGlobal[];
  naoLidas: number;
  limparNaoLidas: () => void;
  enviarMensagem: (texto: string, idMensagemRespondida?: number) => void;
}

const GlobalChatSocketContext = createContext<GlobalChatSocketContextValue>({
  pronto: false,
  erro: "",
  mensagens: [],
  naoLidas: 0,
  limparNaoLidas: () => {},
  enviarMensagem: () => {},
});

const LIMITE_MENSAGENS_EM_MEMORIA = 200;

export function GlobalChatSocketProvider({ children }: { children: ReactNode }) {
  const [pronto, setPronto] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagens, setMensagens] = useState<MensagemChatGlobal[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  // Só conta como "não lida" mensagem que chegou DEPOIS do histórico
  // inicial — sem isso, as 200 mensagens do histórico já apareciam como
  // "200 não lidas" assim que a conexão abria.
  const historicoCarregadoRef = useRef(false);

  useEffect(() => {
    const baseUrl = socketUrlFromApiUrl(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api");
    const novoSocket = io(baseUrl, { transports: ["websocket", "polling"] });
    socketRef.current = novoSocket;
    setPronto(false);
    historicoCarregadoRef.current = false;

    novoSocket.on("connect", () => {
      setErro("");
      axiosInstance
        .get<{ data?: { ticket?: string } }>("/users/socket-ticket")
        .then((resp) => {
          const ticket = resp.data?.data?.ticket;
          if (!ticket) return;
          novoSocket.emit("globalchat:identificar", { ticket }, (respostaIdentificar: { erro?: string }) => {
            if (respostaIdentificar?.erro) {
              console.error("Erro ao identificar personagem no chat global:", respostaIdentificar.erro);
              setErro("Não foi possível autenticar o chat global.");
              return;
            }
            novoSocket.emit(
              "globalchat:entrar",
              {},
              (resposta: { historico?: MensagemChatGlobal[]; erro?: string }) => {
                if (resposta?.erro) {
                  console.error("Erro ao entrar no chat global:", resposta.erro);
                  setErro(resposta.erro);
                  return;
                }
                setMensagens(resposta?.historico ?? []);
                historicoCarregadoRef.current = true;
                setPronto(true);
              },
            );
          });
        })
        .catch((erroCatch) => {
          console.error("Erro ao autenticar conexão do chat global:", erroCatch);
          setErro("Não foi possível autenticar o chat global.");
        });
    });

    novoSocket.on("globalchat:message:new", (mensagem: MensagemChatGlobal) => {
      setMensagens((atual) => [...atual, mensagem].slice(-LIMITE_MENSAGENS_EM_MEMORIA));
      if (historicoCarregadoRef.current) {
        setNaoLidas((atual) => atual + 1);
      }
    });

    novoSocket.on("globalchat:erro", ({ mensagem }: { mensagem?: string }) => {
      if (mensagem) setErro(mensagem);
    });

    novoSocket.on("disconnect", () => setPronto(false));

    return () => {
      novoSocket.disconnect();
      socketRef.current = null;
      setPronto(false);
    };
  }, []);

  const limparNaoLidas = useCallback(() => setNaoLidas(0), []);

  const enviarMensagem = useCallback((texto: string, idMensagemRespondida?: number) => {
    socketRef.current?.emit("globalchat:message", { texto, idMensagemRespondida });
  }, []);

  return (
    <GlobalChatSocketContext.Provider value={{ pronto, erro, mensagens, naoLidas, limparNaoLidas, enviarMensagem }}>
      {children}
    </GlobalChatSocketContext.Provider>
  );
}

export function useGlobalChatSocket() {
  return useContext(GlobalChatSocketContext);
}
