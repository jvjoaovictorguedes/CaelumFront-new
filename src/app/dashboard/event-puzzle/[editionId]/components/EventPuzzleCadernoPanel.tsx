"use client";
import { useCallback, useEffect, useState } from "react";
import { obterCadernoEventPuzzle, mensagemDeErroEventPuzzle, type PuzzleCadernoEntradaApi } from "@/lib/api/eventPuzzle";

// "O Coração da Máquina Celestial" — Fase 9/16. Caderno de
// Investigação: pistas bloqueadas vêm só com `{id, bloqueada:true}` —
// nunca título/texto antes da hora (o backend já omite o campo
// inteiro, isto aqui só respeita isso).
export default function EventPuzzleCadernoPanel({ editionId }: { editionId: number }) {
  const [pistas, setPistas] = useState<PuzzleCadernoEntradaApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    try {
      const resposta = await obterCadernoEventPuzzle(editionId);
      setPistas(resposta);
    } catch (erroOriginal) {
      setErro(mensagemDeErroEventPuzzle(erroOriginal, "Não foi possível abrir o Caderno de Investigação."));
    } finally {
      setCarregando(false);
    }
  }, [editionId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (carregando) {
    return <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-white">Abrindo o caderno...</div>;
  }

  if (erro) {
    return <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-red-400">{erro}</div>;
  }

  if (pistas.length === 0) {
    return <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-white/60">Nenhuma pista catalogada para este evento.</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {pistas.map((pista) => (
        <div
          key={pista.id}
          className={`rounded-xl border p-4 ${
            pista.bloqueada ? "border-white/10 bg-black/30 text-white/40" : "border-[#F3B43F]/40 bg-[#292018]/60 text-white"
          }`}
        >
          {pista.bloqueada ? (
            <p className="flex items-center gap-2 text-sm">
              <span aria-hidden>🔒</span> Pista ainda não descoberta.
            </p>
          ) : (
            <>
              <p className="font-imFeel text-lg text-[#F3B43F]">{pista.titulo}</p>
              <p className="mt-1 text-sm text-white/70">{pista.texto}</p>
              <p className="mt-2 text-[10px] uppercase tracking-widest text-white/30">
                Descoberta em {new Date(pista.unlockedAt).toLocaleString("pt-BR")}
              </p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
