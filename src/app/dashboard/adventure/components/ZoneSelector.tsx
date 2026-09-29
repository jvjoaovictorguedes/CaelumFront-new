"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import axiosInstance from "@/utils/axiosIntance";

export interface ZonaApi {
  id: number;
  nome: string;
  descricao: string | null;
  imagem_url: string | null;
  nivel_recomendado: string;
  perigo: "BAIXO" | "MEDIO" | "ALTO" | "EXTREMO";
  // Gate de ENTRADA de verdade (pedido do jogador) — diferente do badge
  // de perigo acima, que é só indicativo. O backend também revalida
  // isso em /adventure/zones/:id/enter, nunca confia só nesta checagem
  // do lado do cliente.
  nivel_jogador_minimo: number;
  bloqueada_por_nivel: boolean;
}

const CORES_PERIGO: Record<ZonaApi["perigo"], string> = {
  BAIXO: "bg-emerald-600/80 text-white",
  MEDIO: "bg-yellow-500/80 text-black",
  ALTO: "bg-orange-600/80 text-white",
  EXTREMO: "bg-red-700/90 text-white",
};

const LABEL_PERIGO: Record<ZonaApi["perigo"], string> = {
  BAIXO: "Perigo baixo",
  MEDIO: "Perigo médio",
  ALTO: "Perigo alto",
  EXTREMO: "Perigo extremo",
};

// Tela de seleção de Área de Caça (§34 da spec) — o botão de entrar
// NUNCA fica desabilitado por causa do indicador de PERIGO (§5): é só
// um aviso, a decisão de entrar numa zona "forte demais" é do jogador.
// nivel_jogador_minimo é outra coisa — um gate de verdade (pedido do
// jogador), o backend REJEITA a entrada abaixo dele, então aqui o botão
// fica desabilitado com uma mensagem clara em vez de deixar o jogador
// levar um erro genérico ao tentar.
export default function ZoneSelector({ zonas }: { zonas: ZonaApi[] }) {
  const router = useRouter();
  const [entrandoEm, setEntrandoEm] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function entrar(idZona: number) {
    setEntrandoEm(idZona);
    setErro(null);
    try {
      await axiosInstance.post(`/adventure/zones/${idZona}/enter`);
      router.refresh();
    } catch (error: unknown) {
      const mensagem =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Não foi possível entrar nessa Área de Caça.";
      setErro(mensagem);
      setEntrandoEm(null);
    }
  }

  if (zonas.length === 0) {
    return (
      <div className="rounded-2xl border border-[#F3B43F]/30 bg-[#292018]/80 p-6 text-center text-white shadow-xl">
        <p className="text-lg text-white/80">
          Nenhuma Área de Caça disponível no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <h1 className="font-imFeel text-4xl">Aventura</h1>
      <p className="text-white/70">Escolha uma Área de Caça para começar.</p>

      {erro && <p className="rounded-lg bg-red-900/50 p-2 text-sm text-red-200">{erro}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {zonas.map((zona) => (
          <div
            key={zona.id}
            className="flex flex-col justify-between rounded-2xl border border-[#F3B43F]/30 bg-[#292018]/80 p-4 text-white shadow-xl"
          >
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="font-imFeel text-xl">{zona.nome}</h2>
                <span
                  className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-bold uppercase ${CORES_PERIGO[zona.perigo]}`}
                >
                  {LABEL_PERIGO[zona.perigo]}
                </span>
              </div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#F3B43F]/80">
                Nível recomendado: {zona.nivel_recomendado}
              </p>
              <p className={`mb-1 text-xs font-bold uppercase tracking-wide ${zona.bloqueada_por_nivel ? "text-red-400" : "text-white/50"}`}>
                Requer nível {zona.nivel_jogador_minimo}+ pra entrar
              </p>
              {zona.descricao && <p className="text-sm text-white/70">{zona.descricao}</p>}
            </div>

            <button
              type="button"
              disabled={entrandoEm === zona.id || zona.bloqueada_por_nivel}
              onClick={() => entrar(zona.id)}
              title={zona.bloqueada_por_nivel ? `Você precisa ser nível ${zona.nivel_jogador_minimo} pra entrar aqui.` : undefined}
              className="mt-4 rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black transition hover:bg-[#a5710f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {entrandoEm === zona.id
                ? "Entrando..."
                : zona.bloqueada_por_nivel
                  ? `Requer nível ${zona.nivel_jogador_minimo}`
                  : "Entrar"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
