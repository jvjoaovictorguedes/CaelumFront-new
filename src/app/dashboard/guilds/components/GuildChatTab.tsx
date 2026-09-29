"use client";

import { useEffect, useRef, useState } from "react";
import { useGuildSocket } from "@/contexts/GuildSocketContext";

interface MensagemChat {
  idPersonagem: number;
  nome: string;
  texto: string;
  data: string;
}

export default function GuildChatTab({
  characterId,
  characterNome,
}: {
  characterId: number;
  characterNome: string;
}) {
  // Conexão + handshake (identificar/join-room) já feitos uma vez pelo
  // GuildSocketProvider (ver rationale completo lá) — aqui só usa o
  // socket já pronto, escuta os eventos de chat e lê o histórico que
  // veio junto do join-room (só o join-room devolve ele).
  const { socket, pronto, erro: erroConexao, resultadoJoinRoom } = useGuildSocket();
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [texto, setTexto] = useState("");
  const [erroEnvio, setErroEnvio] = useState("");
  const historicoCarregado = useRef(false);
  const listaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (historicoCarregado.current) return;
    const historico = resultadoJoinRoom?.historico as MensagemChat[] | undefined;
    if (historico) {
      setMensagens(historico);
      historicoCarregado.current = true;
    }
  }, [resultadoJoinRoom]);

  useEffect(() => {
    if (!socket) return;
    const aoReceber = (mensagem: MensagemChat) => {
      setMensagens((atual) => [...atual, mensagem]);
    };
    // "guild:erro" é do backend inteiro de guilda (várias features usam),
    // mas só o chat manda mensagem livre o suficiente pra estourar rate
    // limit — por isso só essa aba escuta e mostra.
    const aoDarErro = ({ mensagem }: { mensagem?: string }) => {
      if (mensagem) setErroEnvio(mensagem);
    };
    socket.on("guild:message:new", aoReceber);
    socket.on("guild:erro", aoDarErro);
    return () => {
      socket.off("guild:message:new", aoReceber);
      socket.off("guild:erro", aoDarErro);
    };
  }, [socket]);

  useEffect(() => {
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight });
  }, [mensagens]);

  function enviar(event: React.FormEvent) {
    event.preventDefault();
    const mensagem = texto.trim();
    if (!mensagem || !socket) return;
    socket.emit("guild:message", { texto: mensagem });
    setTexto("");
  }

  return (
    <div className="flex flex-col rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">Chat da guilda</p>
        <span className={`text-xs ${pronto ? "text-green-400" : "text-red-400"}`}>
          {pronto ? "conectado" : "conectando..."}
        </span>
      </div>

      <div
        ref={listaRef}
        className="mb-3 flex h-80 flex-col gap-2 overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-3"
      >
        {(erroConexao || erroEnvio) && <p className="text-sm text-red-400">{erroConexao || erroEnvio}</p>}
        {mensagens.length === 0 ? (
          <p className="text-sm text-white/40">
            Nenhuma mensagem ainda esse mês. Seja o primeiro a falar!
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
          disabled={!pronto}
          className="min-w-0 flex-1 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-[#F3B43F] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!pronto || !texto.trim()}
          className="rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black hover:bg-[#a5710f] disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
