"use client";

// Sistema de Proezas Únicas §12.1 — "UMA NOVA LENDA FOI ESCRITA": faixa
// fixa no topo, visível em todo o dashboard, quando alguém conquista uma
// Proeza com announce_global. Some sozinha depois de alguns segundos
// (nunca fica lá esperando ser dispensada manualmente — é um anúncio,
// não um aviso persistente como o do Boss Global).
import { useEffect } from "react";
import { useUniqueFeatSocket } from "@/contexts/UniqueFeatSocketContext";

const DURACAO_MS = 8000;

export default function UniqueFeatGlobalAlert() {
  const { ultimoAnuncio, dispensarAnuncio } = useUniqueFeatSocket();

  useEffect(() => {
    if (!ultimoAnuncio) return;
    const id = setTimeout(dispensarAnuncio, DURACAO_MS);
    return () => clearTimeout(id);
  }, [ultimoAnuncio, dispensarAnuncio]);

  if (!ultimoAnuncio) return null;

  const nomeProeza = ultimoAnuncio.nome ?? "uma Proeza secreta";
  const nomeLegado = ultimoAnuncio.legado?.nome;

  return (
    <button
      type="button"
      onClick={dispensarAnuncio}
      className="fixed inset-x-0 top-0 z-[70] flex flex-col items-center gap-1 bg-gradient-to-r from-[#292018] via-[#4a3616] to-[#292018] px-4 py-3 text-center shadow-lg border-b-2 border-[#F3B43F]"
    >
      <span className="flex items-center gap-2 font-imFeel text-lg text-[#F3B43F] sm:text-xl">
        <span className="animate-pulse">✦</span>
        UMA NOVA LENDA FOI ESCRITA
        <span className="animate-pulse">✦</span>
      </span>
      <span className="text-sm text-white/90 sm:text-base">
        <span className="font-bold text-[#F3B43F]">{ultimoAnuncio.portador}</span> conquistou{" "}
        <span className="font-bold">{nomeProeza}</span>
        {nomeLegado && (
          <>
            {" "}
            e recebeu o Legado <span className="font-bold text-[#F3B43F]">{nomeLegado}</span>
          </>
        )}
        .
      </span>
    </button>
  );
}
