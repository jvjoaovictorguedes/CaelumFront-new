"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";

interface PortalApi {
  id: number;
  rank: string;
  nome_chefe: string;
  descricao: string;
  nivel_recomendado: number;
  vida: number;
  recompensa_dinheiro: number;
  recompensa_xp: number;
  imagem_url?: string | null;
}

interface StatusPortalApi {
  rank_atual: string;
  proximo_rank: string | null;
  portal: PortalApi | null;
  pode_tentar: boolean;
  cooldown_restante_ms: number;
}

interface ResultadoTentativaApi {
  venceu: boolean;
  log: string[];
  rank_promovido: string | null;
  niveis_ganhos: number;
  character: { vida_atual: number; dinheiro: number; rank: string };
}

function formatarCooldown(ms: number) {
  const totalSegundos = Math.ceil(ms / 1000);
  const min = Math.floor(totalSegundos / 60);
  const seg = totalSegundos % 60;
  return min > 0 ? `${min}min ${seg}s` : `${seg}s`;
}

export default function RankGatePanel({ characterId }: { characterId: number }) {
  const [status, setStatus] = useState<StatusPortalApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [tentando, setTentando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoTentativaApi | null>(null);
  const [mensagem, setMensagem] = useState("");

  const carregar = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{ data?: StatusPortalApi }>(
        `/characters/${characterId}/rank-gate`,
      );
      setStatus(resp.data?.data ?? null);
    } catch (error) {
      console.error("Erro ao carregar portal de ranque:", error);
      setMensagem("Não foi possível carregar o portal.");
    } finally {
      setCarregando(false);
    }
  }, [characterId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Recontagem local do cooldown pra não precisar recarregar a página
  // pra ver o botão liberar de novo.
  useEffect(() => {
    if (!status || status.cooldown_restante_ms <= 0) return;
    const timer = setInterval(() => {
      setStatus((atual) => {
        if (!atual) return atual;
        const restante = atual.cooldown_restante_ms - 1000;
        return { ...atual, cooldown_restante_ms: Math.max(0, restante), pode_tentar: restante <= 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  async function tentarPortal() {
    if (tentando) return;
    setTentando(true);
    setMensagem("");
    setResultado(null);
    try {
      const resp = await axiosInstance.post<{ data?: ResultadoTentativaApi }>(
        `/characters/${characterId}/rank-gate/attempt`,
      );
      if (resp.data?.data) setResultado(resp.data.data);
      await carregar();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Não foi possível tentar o portal.";
      setMensagem(msg);
    } finally {
      setTentando(false);
    }
  }

  if (carregando) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        Carregando portal...
      </div>
    );
  }

  if (!status) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        {mensagem || "Não foi possível carregar o portal de ranque."}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm uppercase tracking-widest text-[#F3B43F]">Portal de Ranque</p>
          <p className="text-xs text-white/50">
            Seu ranque atual: <span className="font-bold text-white">{status.rank_atual}</span>
            {status.proximo_rank && (
              <> — vença o portal pra subir pra <span className="font-bold text-white">{status.proximo_rank}</span></>
            )}
          </p>
        </div>
      </div>

      {!status.portal ? (
        <p className="text-sm text-white/60">
          {status.proximo_rank
            ? "Nenhum portal cadastrado para o seu ranque ainda."
            : "Você já está no ranque máximo (S++). Não há mais portais a vencer."}
        </p>
      ) : (
        <div className="rounded-xl border border-[#F3B43F]/40 bg-[#3a2f24] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-imFeel text-xl">{status.portal.nome_chefe}</span>
            <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/60">
              Nível recomendado {status.portal.nivel_recomendado}
            </span>
          </div>
          <p className="mt-2 text-sm text-white/80">{status.portal.descricao}</p>
          <p className="mt-2 text-xs text-white/50">
            Vida do chefe: {status.portal.vida} · Recompensa: {status.portal.recompensa_dinheiro} moedas,{" "}
            {status.portal.recompensa_xp} XP
          </p>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={tentarPortal}
              disabled={tentando || !status.pode_tentar}
              className="rounded-lg bg-[#F3B43F] px-4 py-2 text-sm font-bold text-black transition hover:bg-[#e0a52f] disabled:cursor-not-allowed disabled:bg-black/40 disabled:text-white/50"
            >
              {tentando ? "Enfrentando o portal..." : "Entrar no portal"}
            </button>
            {!status.pode_tentar && status.cooldown_restante_ms > 0 && (
              <span className="text-xs text-white/50">
                Disponível em {formatarCooldown(status.cooldown_restante_ms)}
              </span>
            )}
          </div>
        </div>
      )}

      {mensagem && <p className="mt-3 text-sm text-red-400">{mensagem}</p>}

      {resultado && (
        <div
          className={`mt-4 rounded-xl border p-4 ${
            resultado.venceu ? "border-green-500/50 bg-green-950/20" : "border-red-500/40 bg-red-950/20"
          }`}
        >
          <p className={`font-imFeel text-lg ${resultado.venceu ? "text-green-400" : "text-red-400"}`}>
            {resultado.venceu ? "Vitória!" : "Derrota"}
          </p>
          {resultado.rank_promovido && (
            <p className="text-sm text-[#F3B43F]">
              Parabéns! Você subiu para o ranque {resultado.rank_promovido}.
            </p>
          )}
          <div className="mt-2 flex flex-col gap-1 text-xs text-white/70">
            {resultado.log.map((linha, indice) => (
              <span key={indice}>{linha}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
