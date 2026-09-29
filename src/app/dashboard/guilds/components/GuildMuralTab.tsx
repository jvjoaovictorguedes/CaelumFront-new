"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { useGuildSocket } from "@/contexts/GuildSocketContext";
import type { MensagemMural, Permissao } from "./types";

export default function GuildMuralTab({
  idGuild,
  pode,
}: {
  idGuild: number;
  pode: Record<Permissao, boolean>;
}) {
  const { socket } = useGuildSocket();
  const [mensagens, setMensagens] = useState<MensagemMural[] | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  function carregar() {
    axiosInstance
      .get<{ data?: { mensagens?: MensagemMural[] } }>(`/guilds/${idGuild}/mural`)
      .then((resp) => setMensagens(resp.data?.data?.mensagens ?? []))
      .catch((error) => {
        console.error("Erro ao carregar mural:", error);
        setMensagens([]);
      });
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idGuild]);

  // Atualização ao vivo pra quem já está com a aba de Mural aberta
  // quando outro oficial/líder posta ou remove algo — a conexão em si
  // (+ entrar na sala da guilda) é compartilhada por GuildSocketProvider,
  // aqui só escuta os dois eventos do mural.
  useEffect(() => {
    if (!socket) return;
    const aoPostar = (mensagem: MensagemMural) => {
      setMensagens((atual) => (atual ? [mensagem, ...atual] : [mensagem]));
    };
    const aoRemover = ({ id }: { id: number }) => {
      setMensagens((atual) => (atual ? atual.filter((m) => m.id !== id) : atual));
    };
    socket.on("guild:mural:nova-mensagem", aoPostar);
    socket.on("guild:mural:mensagem-removida", aoRemover);
    return () => {
      socket.off("guild:mural:nova-mensagem", aoPostar);
      socket.off("guild:mural:mensagem-removida", aoRemover);
    };
  }, [socket]);

  async function postar(event: React.FormEvent) {
    event.preventDefault();
    const mensagem = texto.trim();
    if (!mensagem) return;
    setEnviando(true);
    setErro("");
    try {
      await axiosInstance.post(`/guilds/${idGuild}/mural`, { texto: mensagem });
      setTexto("");
      carregar();
    } catch (error) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Não foi possível postar a mensagem.";
      setErro(msg);
    } finally {
      setEnviando(false);
    }
  }

  async function remover(id: number) {
    if (!confirm("Remover essa mensagem do mural?")) return;
    try {
      await axiosInstance.delete(`/guilds/${idGuild}/mural/${id}`);
      setMensagens((atual) => (atual ? atual.filter((m) => m.id !== id) : atual));
    } catch (error) {
      console.error("Erro ao remover mensagem do mural:", error);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      <p className="mb-3 text-sm uppercase tracking-widest text-[#F3B43F]">Mural da guilda</p>

      {pode.gerenciar_mural && (
        <form onSubmit={postar} className="mb-4 flex flex-col gap-2">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={1000}
            placeholder="Fixar um aviso pra guilda toda ver..."
            rows={3}
            className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-[#F3B43F]"
          />
          <div className="flex items-center justify-between">
            {erro && <p className="text-xs text-red-400">{erro}</p>}
            <button
              type="submit"
              disabled={enviando || !texto.trim()}
              className="ml-auto rounded-lg bg-[#BC8418] px-4 py-1.5 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50"
            >
              {enviando ? "Postando..." : "Fixar aviso"}
            </button>
          </div>
        </form>
      )}

      {mensagens === null ? (
        <p className="text-sm text-white/60">Carregando...</p>
      ) : mensagens.length === 0 ? (
        <p className="text-sm text-white/60">Nenhum aviso fixado ainda.</p>
      ) : (
        <div className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto">
          {mensagens.map((mensagem) => (
            <div key={mensagem.id} className="rounded-lg border border-white/10 bg-black/30 p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-xs text-[#F3B43F]/80">
                  {mensagem.nomeAutor} · {new Date(mensagem.createdAt).toLocaleString("pt-BR")}
                </p>
                {pode.gerenciar_mural && (
                  <button
                    onClick={() => remover(mensagem.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remover
                  </button>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm text-white/90">{mensagem.texto}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
