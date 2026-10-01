"use client";

// Chat global flutuante — canto inferior direito, igual pedido do
// jogador: não pode atrapalhar a navegação normal (sidebar, combate,
// etc), então é um botão pequeno que expande um painel só quando
// clicado, nunca ocupa a tela. Mesmo z-[200] do FloatingMusicWidget
// (fica acima de qualquer overlay de combate), mas no canto OPOSTO
// (bottom-right vs top-right) pra nunca os dois se sobreporem.
import { useEffect, useRef, useState } from "react";
import { useGlobalChatSocket } from "@/contexts/GlobalChatSocketContext";
import { useCharacter } from "@/contexts/CharacterContext";

export default function FloatingGlobalChatWidget() {
  const { character } = useCharacter();
  const { pronto, erro, mensagens, naoLidas, limparNaoLidas, enviarMensagem } = useGlobalChatSocket();
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const raizRef = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(evento: MouseEvent) {
      if (!raizRef.current?.contains(evento.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight });
  }, [mensagens, aberto]);

  function alternarAberto() {
    setAberto((atual) => {
      const novoEstado = !atual;
      if (novoEstado) limparNaoLidas();
      return novoEstado;
    });
  }

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    const mensagem = texto.trim();
    if (!mensagem || !pronto) return;
    enviarMensagem(mensagem);
    setTexto("");
  }

  return (
    <div ref={raizRef} className="fixed bottom-3 right-3 z-[200] sm:bottom-4 sm:right-4">
      {aberto && (
        <div className="mb-2 flex h-96 w-80 max-w-[90vw] flex-col overflow-hidden rounded-xl border-2 border-[#F3B43F]/70 bg-[#292018]/95 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-widest text-[#F3B43F]">Chat Global</p>
            <span className={`h-2 w-2 rounded-full ${pronto ? "bg-green-400" : "bg-red-400"}`} title={pronto ? "Conectado" : "Conectando..."} />
          </div>

          <div ref={listaRef} className="flex-1 overflow-y-auto px-3 py-2">
            {erro && <p className="mb-2 text-xs text-red-400">{erro}</p>}
            {mensagens.length === 0 ? (
              <p className="text-center text-xs text-white/40">
                Nenhuma mensagem ainda — diga oi, ou anuncie o que tem pra vender.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {mensagens.map((mensagem, indice) => {
                  const souEu = mensagem.idPersonagem === character?.id;
                  return (
                    <div key={`${mensagem.data}-${indice}`} className="text-xs leading-snug">
                      <span className={`font-bold ${souEu ? "text-[#F3B43F]" : "text-white/80"}`}>
                        {mensagem.nome}:
                      </span>{" "}
                      <span className="break-words text-white/90">{mensagem.texto}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <form onSubmit={enviar} className="flex gap-1.5 border-t border-white/10 p-2">
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={500}
              placeholder={pronto ? "Escreva uma mensagem..." : "Conectando..."}
              disabled={!pronto}
              className="flex-1 rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-xs text-white placeholder-white/40 outline-none focus:border-[#F3B43F] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!pronto || !texto.trim()}
              className="rounded-lg bg-[#BC8418] px-3 py-1.5 text-xs font-bold text-black transition hover:bg-[#a5710f] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Enviar
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={alternarAberto}
        aria-expanded={aberto}
        aria-label={aberto ? "Fechar chat global" : "Abrir chat global"}
        className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#F3B43F] bg-[#292018]/90 text-xl shadow-lg backdrop-blur-sm transition-colors hover:bg-[#292018]"
      >
        💬
        {!aberto && naoLidas > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {naoLidas > 99 ? "99+" : naoLidas}
          </span>
        )}
      </button>
    </div>
  );
}
