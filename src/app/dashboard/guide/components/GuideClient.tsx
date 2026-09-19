"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosIntance";

interface Passo {
  chave: string;
  titulo: string;
  descricao: string;
  rota: string;
  concluido: boolean;
}

export default function GuideClient() {
  const router = useRouter();
  const [passos, setPassos] = useState<Passo[] | null>(null);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    try {
      setErro("");
      const resposta = await axiosInstance.get<{ data?: { passos?: Passo[] } }>("/onboarding/progresso");
      setPassos(resposta.data?.data?.passos ?? []);
    } catch (error: unknown) {
      const mensagem =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Não foi possível carregar seu progresso agora. Tente novamente em instantes.";
      setErro(mensagem);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (erro) {
    return (
      <div className="rounded-2xl border-2 border-red-400/60 bg-[#292018]/90 p-5 text-center text-white shadow-lg">
        <p className="text-sm text-red-300">{erro}</p>
        <button
          onClick={carregar}
          className="mt-3 rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black transition hover:bg-[#a5710f]"
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  if (!passos) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-5 text-center text-white/60 shadow-lg">
        Carregando seu progresso...
      </div>
    );
  }

  const concluidos = passos.filter((p) => p.concluido).length;
  const percentual = passos.length > 0 ? Math.round((concluidos / passos.length) * 100) : 0;
  const tudoConcluido = concluidos === passos.length && passos.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-4 text-white shadow-lg">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-bold text-[#F3B43F]">Seu progresso</span>
          <span className="text-white/70">
            {concluidos} de {passos.length}
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-black/30">
          <div
            className="h-full bg-[#F3B43F] transition-all duration-500"
            style={{ width: `${percentual}%` }}
          />
        </div>
        {tudoConcluido && (
          <p className="mt-3 text-center text-sm font-bold text-green-400">
            Você já experimentou todos os sistemas principais de Caelum. Bom jogo, aventureiro!
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {passos.map((passo, indice) => (
          <button
            key={passo.chave}
            onClick={() => router.push(passo.rota)}
            className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left shadow-lg transition ${
              passo.concluido
                ? "border-green-400/40 bg-[#22301f]/80 text-white/70 hover:bg-[#22301f]"
                : "border-[#F3B43F]/60 bg-[#292018]/90 text-white hover:bg-[#3a2f24]"
            }`}
          >
            <span
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                passo.concluido
                  ? "border-green-400 bg-green-400 text-black"
                  : "border-[#F3B43F] text-[#F3B43F]"
              }`}
            >
              {passo.concluido ? "✓" : indice + 1}
            </span>
            <span className="min-w-0">
              <p className={`font-bold ${passo.concluido ? "text-green-300 line-through decoration-2" : "text-[#F3B43F]"}`}>
                {passo.titulo}
              </p>
              <p className="mt-0.5 text-sm text-white/60">{passo.descricao}</p>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
