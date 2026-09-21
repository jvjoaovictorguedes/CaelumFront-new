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
import axiosInstance from "@/utils/axiosIntance";

export interface LutadorDuelo {
  id: number;
  nome: string;
  genero: string;
  classe?: string;
  chave: "A" | "B";
}

export interface PoderDuelo {
  id: number;
  nome: string;
  imagem_url?: string | null;
  custo_mana: number;
  dano_base: number;
  cura_base: number;
}

export interface ConsumivelDuelo {
  id_item: number;
  nome: string;
  imagem_url?: string | null;
  quantidade: number;
  efeito_vida?: number;
  efeito_mana?: number;
}

export interface DueloIniciadoPayload {
  duelId: number;
  arena: string;
  ranked?: boolean;
  ratingA?: number;
  ratingB?: number;
  ligaA?: string;
  ligaB?: string;
  a: LutadorDuelo;
  b: LutadorDuelo;
  vidaMaxA: number;
  vidaMaxB: number;
  manaMaxA: number;
  manaMaxB: number;
  vidaA: number;
  vidaB: number;
  manaA: number;
  manaB: number;
  poderesA: PoderDuelo[];
  poderesB: PoderDuelo[];
  consumiveisA: ConsumivelDuelo[];
  consumiveisB: ConsumivelDuelo[];
  turnoDe: "A" | "B";
  prazoSegundos: number;
}

// Arena Ranqueada (PvP Competitivo v1) — eventos próprios do socket, além
// dos "pvp:*" já existentes (que continuam servindo o Duelo casual sem
// nenhuma mudança de comportamento).
export interface RankedQueueUpdatePayload {
  emFila: boolean;
  tempoNaFilaMs?: number;
}

export interface RankedMatchFoundPayload {
  duelId: number;
  a: { id: number; nome: string; rating: number };
  b: { id: number; nome: string; rating: number };
}

export interface RankedRatingUpdatePayload {
  duelId: number;
  jogadorA: { id: number; ratingAntes: number; ratingDepois: number; liga: string };
  jogadorB: { id: number; ratingAntes: number; ratingDepois: number; liga: string };
}

export interface RankedOponenteDesconectadoPayload {
  characterId: number;
  prazoSegundos: number;
}

export interface TurnoResultadoPayload {
  duelId: number;
  atacante: "A" | "B";
  nomeAcao: string;
  dano: number;
  cura: number;
  manaCurada?: number;
  esquivou: boolean;
  vidaA: number;
  vidaB: number;
  manaA: number;
  manaB: number;
  turnoDe: "A" | "B" | null;
  prazoSegundos?: number;
}

export interface DueloFimPayload {
  duelId: number;
  vencedorChave: "A" | "B" | null;
  vencedor: { id: number; nome: string } | null;
  perdedor: { id: number; nome: string } | null;
  // Ranked não concede recompensa de Duelo casual nem nível — só rating
  // (ver ranked:rating:update). "FalhaServidor"/"Abandono" só existem
  // pra partidas ranked; casual continua só com "combate"/"desistencia".
  recompensa?: { dinheiro: number; experiencia: number };
  nivelAposVitoria?: number;
  motivo: "combate" | "desistencia" | "Vitoria" | "Abandono" | "FalhaServidor";
  ranked?: boolean;
}

interface DesafioRecebido {
  idDesafiante: number;
  nomeDesafiante: string;
  prazoSegundos: number;
  recebidoEm: number;
}

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
  agir: (tipo: "attack" | "power" | "item", id?: number) => void;
  limparDuelo: () => void;
  limparErro: () => void;
  // Arena Ranqueada
  filaRanked: RankedQueueUpdatePayload | null;
  matchEncontradoRanked: RankedMatchFoundPayload | null;
  ratingUpdate: RankedRatingUpdatePayload | null;
  oponenteDesconectadoRanked: RankedOponenteDesconectadoPayload | null;
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

  useEffect(() => {
    const usaMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
    if (!characterId || usaMocks) return;

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
          socket.emit("identificar", { ticket });
          socket.emit("pvp:listar-online", {}, (resposta: { online?: string[] }) => {
            setOnlineIds(new Set((resposta?.online ?? []).map(Number)));
          });
        })
        .catch(() => {
          setErro("Não foi possível autenticar a conexão em tempo real.");
        });
    });

    socket.on("disconnect", () => setConectado(false));

    socket.on("pvp:ficou-online", ({ characterId: id }: { characterId: string }) => {
      setOnlineIds((atual) => new Set(atual).add(Number(id)));
    });

    socket.on("pvp:ficou-offline", ({ characterId: id }: { characterId: string }) => {
      setOnlineIds((atual) => {
        const novo = new Set(atual);
        novo.delete(Number(id));
        return novo;
      });
    });

    socket.on(
      "pvp:desafio-recebido",
      (payload: { idDesafiante: number; nomeDesafiante: string; prazoSegundos: number }) => {
        setDesafioRecebido({ ...payload, recebidoEm: Date.now() });
      },
    );

    socket.on("pvp:desafio-enviado", ({ idDesafiado }: { idDesafiado: number }) => {
      setDesafioEnviadoPara(idDesafiado);
    });

    socket.on("pvp:desafio-recusado", () => {
      setDesafioEnviadoPara(null);
      setErro("O jogador recusou seu desafio.");
    });

    socket.on("pvp:desafio-expirado", () => {
      setDesafioEnviadoPara(null);
      setErro("O jogador não respondeu a tempo.");
    });

    socket.on("pvp:desafio-cancelado", () => {
      setDesafioRecebido(null);
    });

    socket.on("pvp:duelo-iniciado", (payload: DueloIniciadoPayload) => {
      setDesafioRecebido(null);
      setDesafioEnviadoPara(null);
      setResultadoFinal(null);
      setTurnos([]);
      setDuelo(payload);
      router.push("/dashboard/pvp");
    });

    socket.on("pvp:turno-resultado", (payload: TurnoResultadoPayload) => {
      setTurnos((atual) => [...atual, payload]);
    });

    socket.on("pvp:duelo-fim", (payload: DueloFimPayload) => {
      setResultadoFinal(payload);
    });

    socket.on("pvp:erro", ({ mensagem }: { mensagem: string }) => {
      setErro(mensagem);
    });

    // Arena Ranqueada — reaproveita "pvp:duelo-iniciado"'s equivalente
    // (ranked:match:start), com o MESMO shape de payload, então o duelo
    // vira o mesmo estado `duelo` que LiveDuelArena já sabe renderizar.
    socket.on("ranked:queue:update", (payload: RankedQueueUpdatePayload) => {
      setFilaRanked(payload);
    });

    socket.on("ranked:match:found", (payload: RankedMatchFoundPayload) => {
      setMatchEncontradoRanked(payload);
    });

    socket.on("ranked:match:start", (payload: DueloIniciadoPayload) => {
      setDesafioRecebido(null);
      setDesafioEnviadoPara(null);
      setResultadoFinal(null);
      setRatingUpdate(null);
      setOponenteDesconectadoRanked(null);
      setFilaRanked(null);
      setTurnos([]);
      setDuelo(payload);
      router.push("/dashboard/pvp");
    });

    socket.on("ranked:rating:update", (payload: RankedRatingUpdatePayload) => {
      setRatingUpdate(payload);
    });

    socket.on("ranked:oponente-desconectado", (payload: RankedOponenteDesconectadoPayload) => {
      setOponenteDesconectadoRanked(payload);
    });

    socket.on("ranked:oponente-reconectado", () => {
      setOponenteDesconectadoRanked(null);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId]);

  const desafiar = useCallback((idDesafiado: number) => {
    socketRef.current?.emit("pvp:desafiar", { idDesafiado });
  }, []);

  const responderDesafio = useCallback((aceitar: boolean) => {
    socketRef.current?.emit("pvp:responder-desafio", { aceitar });
    if (!aceitar) setDesafioRecebido(null);
  }, []);

  const agir = useCallback((tipo: "attack" | "power" | "item", id?: number) => {
    socketRef.current?.emit("pvp:acao", {
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

  const limparErro = useCallback(() => setErro(""), []);

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
      }}
    >
      {children}
      {desafioRecebido && (
        <DesafioModal
          desafio={desafioRecebido}
          onResponder={responderDesafio}
        />
      )}
    </PvpSocketContext.Provider>
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
