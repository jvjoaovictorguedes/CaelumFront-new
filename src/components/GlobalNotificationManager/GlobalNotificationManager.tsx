"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";

interface ConversaInbox {
  naoLidas: number;
}

export default function GlobalNotificationManager({
  currentUserId,
}: {
  currentUserId: number;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ultimaQuantidadeNaoLidasRef = useRef<number | null>(null);
  const [somLiberado, setSomLiberado] = useState(false);

  // Inicializa o áudio globalmente
  useEffect(() => {
    audioRef.current = new Audio("/sounds/message.mp3");
    audioRef.current.volume = 0.5;
    audioRef.current.preload = "auto";

    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  // Botão flutuante para destravar o autoplay do navegador na primeira interação
  const ativarSom = () => {
    const audio = audioRef.current;
    if (audio) {
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          setSomLiberado(true);
        })
        .catch((error) => {
          console.warn("Não foi possível liberar o som:", error);
        });
    }
  };

  // Função que checa a inbox em segundo plano
  const verificarInboxGlobal = useCallback(async () => {
    try {
      const resposta = await axiosInstance.get<{
        data?: { conversas?: ConversaInbox[] };
      }>(`/messages/inbox/${currentUserId}`);

      const conversas = resposta.data?.data?.conversas ?? [];
      
      // Soma todas as mensagens não lidas de todas as conversas
      const totalNaoLidas = conversas.reduce(
        (acc, conv) => acc + (conv.naoLidas || 0),
        0
      );

      // Se já temos uma referência anterior, comparamos
      if (ultimaQuantidadeNaoLidasRef.current !== null) {
        // Se o total de não lidas subiu, chegou mensagem nova!
        if (totalNaoLidas > ultimaQuantidadeNaoLidasRef.current) {
          const audio = audioRef.current;
          if (audio) {
            audio.currentTime = 0;
            audio.play().catch((err) => {
              console.warn("Bloqueado pelo navegador:", err);
            });
          }
        }
      }

      // Atualiza a referência com a quantidade atual
      ultimaQuantidadeNaoLidasRef.current = totalNaoLidas;
    } catch (error) {
      console.error("Erro ao verificar notificações globais:", error);
    }
  }, [currentUserId]);

  useEffect(() => {
    verificarInboxGlobal();

    // Roda a checagem a cada 6 segundos em qualquer tela
    const intervalo = setInterval(verificarInboxGlobal, 6000);

    return () => clearInterval(intervalo);
  }, [verificarInboxGlobal]);

  return (
    <>
      {/* Se o som não foi liberado pelo navegador, mostra um aviso discreto no canto */}
      {!somLiberado && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border-2 border-[#F3B43F] bg-[#292018] p-3 text-white shadow-2xl">
          <span className="text-xs">
            🔊 Clique para habilitar o som de novas mensagens no jogo.
          </span>
          <button
            onClick={ativarSom}
            className="rounded-lg bg-[#F3B43F] px-3 py-1 text-xs font-bold text-black transition hover:bg-[#dfa234]"
          >
            Ativar Som
          </button>
        </div>
      )}
    </>
  );
}