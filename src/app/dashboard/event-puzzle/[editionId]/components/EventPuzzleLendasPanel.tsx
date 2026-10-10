"use client";
import { useCallback, useEffect, useState } from "react";
import { obterHallDasLendasEventPuzzle, mensagemDeErroEventPuzzle, type PuzzleHallDasLendasApi } from "@/lib/api/eventPuzzle";

// "O Coração da Máquina Celestial" — Fase 11/16. Hall dos Pioneiros
// PRÓPRIO deste evento — nunca confundir com /dashboard/hall-das-lendas
// (Sistema de Proezas Únicas, feature totalmente separada). `quadro` =
// agrupado por marco (quem chegou primeiro em cada coisa); `feed` =
// cronológico cruzando todos os marcos.
export default function EventPuzzleLendasPanel({ editionId }: { editionId: number }) {
  const [dados, setDados] = useState<PuzzleHallDasLendasApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    try {
      const resposta = await obterHallDasLendasEventPuzzle(editionId);
      setDados(resposta);
    } catch (erroOriginal) {
      setErro(mensagemDeErroEventPuzzle(erroOriginal, "Não foi possível abrir o Hall dos Pioneiros."));
    } finally {
      setCarregando(false);
    }
  }, [editionId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (carregando) {
    return <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-white">Consultando os registros...</div>;
  }

  if (erro) {
    return <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-red-400">{erro}</div>;
  }

  if (!dados || (dados.quadro.length === 0 && dados.feed.length === 0)) {
    return <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-white/60">Ainda nenhum pioneiro registrado neste evento.</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="flex flex-col gap-3">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]/80">Quadro de honra</p>
        {dados.quadro.map((marco) => (
          <div key={marco.id} className="rounded-xl border border-[#F3B43F]/40 bg-[#292018]/60 p-4 text-white">
            <p className="font-imFeel text-lg text-[#F3B43F]">{marco.titulo}</p>
            <p className="text-sm text-white/60">{marco.descricao}</p>
            <ol className="mt-2 flex flex-col gap-1">
              {marco.conquistas.length === 0 ? (
                <li className="text-xs text-white/30">Ninguém conquistou isto ainda.</li>
              ) : (
                marco.conquistas.map((c) => (
                  <li key={c.posicao} className="flex items-center justify-between text-sm">
                    <span>
                      <span className="mr-2 font-bold text-[#F3B43F]">#{c.posicao}</span>
                      {c.nome}
                    </span>
                    <span className="text-[10px] text-white/30">{new Date(c.claimedAt).toLocaleDateString("pt-BR")}</span>
                  </li>
                ))
              )}
            </ol>
            <p className="mt-2 text-[10px] uppercase tracking-widest text-white/30">Vagas: {marco.maxClaims}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]/80">Descobertas recentes</p>
        <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
          {dados.feed.length === 0 ? (
            <p className="text-xs text-white/30">Nenhuma descoberta recente.</p>
          ) : (
            dados.feed.map((item, indice) => (
              <p key={indice} className="text-sm text-white/70">
                <span className="font-bold text-[#F3B43F]">{item.nome}</span> alcançou #{item.posicao} em{" "}
                <span className="italic">{item.titulo}</span>
                <span className="ml-2 text-[10px] text-white/30">{new Date(item.claimedAt).toLocaleString("pt-BR")}</span>
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
