"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import axiosInstance from "@/utils/axiosIntance";

interface MensagemChat {
  idPersonagem: number;
  nome: string;
  texto: string;
  data: string;
}

function socketUrlFromApiUrl(apiUrl: string) {
  return apiUrl.replace(/\/api\/?$/, "");
}

export default function GuildChatTab({
  characterId,
  characterNome,
  idGuild,
}: {
  characterId: number;
  characterNome: string;
  idGuild: number;
}) {
  const socketRef = useRef<Socket | null>(null);
  const [conectado, setConectado] = useState(false);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [texto, setTexto] = useState("");
  const listaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const baseUrl = socketUrlFromApiUrl(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
    );
    const socket = io(baseUrl, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConectado(true);
      // Igual ao PvP ao vivo: busca um ticket de curta duração (o JWT é
      // httpOnly) em vez de mandar o characterId cru pro socket.
      axiosInstance
        .get<{ data?: { ticket?: string } }>("/users/socket-ticket")
        .then((resp) => {
          const ticket = resp.data?.data?.ticket;
          if (!ticket) return;
          // "guild:identificar", não "identificar" — esse socket é
          // independente do socket do PvP ao vivo, e os dois módulos do
          // backend compartilham o mesmo `io` (ver comentário em
          // guildSocket.js). Usar o mesmo nome de evento fazia esse
          // socket também "logar" no PvP ao vivo e derrubar a conexão
          // de PvP de verdade do jogador só por abrir o chat da guilda.
          socket.emit("guild:identificar", { ticket });
          socket.emit("guild:join-room", {}, (resposta: { erro?: string }) => {
            if (resposta?.erro) console.error("Erro ao entrar na sala de chat:", resposta.erro);
          });
        })
        .catch((erro) => console.error("Erro ao autenticar conexão de chat:", erro));
    });

    socket.on("disconnect", () => setConectado(false));

    socket.on("guild:message:new", (mensagem: MensagemChat) => {
      setMensagens((atual) => [...atual, mensagem]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [characterId, idGuild]);

  useEffect(() => {
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight });
  }, [mensagens]);

  function enviar(event: React.FormEvent) {
    event.preventDefault();
    const mensagem = texto.trim();
    if (!mensagem || !socketRef.current) return;
    socketRef.current.emit("guild:message", { texto: mensagem });
    setTexto("");
  }

  return (
    <div className="flex flex-col rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">Chat da guilda</p>
        <span className={`text-xs ${conectado ? "text-green-400" : "text-red-400"}`}>
          {conectado ? "conectado" : "conectando..."}
        </span>
      </div>

      <div
        ref={listaRef}
        className="mb-3 flex h-80 flex-col gap-2 overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-3"
      >
        {mensagens.length === 0 ? (
          <p className="text-sm text-white/40">
            Nenhuma mensagem ainda — o histórico não fica salvo, só quem está com a tela aberta vê.
          </p>
        ) : (
          mensagens.map((mensagem, indice) => (
            <div key={indice} className={mensagem.idPersonagem === characterId ? "text-right" : ""}>
              <p className="text-xs text-white/40">
                {mensagem.idPersonagem === characterId ? characterNome : mensagem.nome} ·{" "}
                {new Date(mensagem.data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p
                className={`inline-block rounded-lg px-3 py-1.5 text-sm ${
                  mensagem.idPersonagem === characterId
                    ? "bg-[#BC8418] text-black"
                    : "bg-white/10 text-white"
                }`}
              >
                {mensagem.texto}
              </p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={enviar} className="flex gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva uma mensagem..."
          maxLength={500}
          disabled={!conectado}
          className="min-w-0 flex-1 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-[#F3B43F] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!conectado || !texto.trim()}
          className="rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black hover:bg-[#a5710f] disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
