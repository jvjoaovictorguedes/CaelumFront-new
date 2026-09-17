"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import type { Permissao } from "./types";

interface ChefeGuildaApi {
  id: number;
  rank: string;
  nome_chefe: string;
  descricao: string;
  vida_total: string;
  janela_horas: number;
  recompensa_tesouro: number;
  recompensa_dinheiro_por_membro: number;
}

interface TentativaApi {
  id: number;
  vida_total: string;
  vida_restante: string;
  expira_em: string;
  status: "Ativo" | "Vencido" | "Expirado";
}

interface ContribuidorApi {
  personagem: { id: number; nome: string } | null;
  dano_total: string;
}

interface StatusGuildaApi {
  rank_atual: string;
  proximo_rank: string | null;
  chefe: ChefeGuildaApi | null;
  tentativa_ativa: TentativaApi | null;
  contribuidores: ContribuidorApi[];
}

function formatarTempoRestante(expiraEm: string) {
  const ms = new Date(expiraEm).getTime() - Date.now();
  if (ms <= 0) return "expirado";
  const horas = Math.floor(ms / 3600000);
  const min = Math.floor((ms % 3600000) / 60000);
  return `${horas}h ${min}min restantes`;
}

export default function GuildGatePortalTab({
  idGuild,
  pode,
}: {
  idGuild: number;
  pode: Record<Permissao, boolean>;
}) {
  const [status, setStatus] = useState<StatusGuildaApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [ultimoAtaque, setUltimoAtaque] = useState<{ dano: number; venceu: boolean } | null>(null);

  const carregar = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{ data?: StatusGuildaApi }>(
        `/guilds/${idGuild}/rank-gate`,
      );
      setStatus(resp.data?.data ?? null);
    } catch (error) {
      console.error("Erro ao carregar portal de guilda:", error);
      setMensagem("Não foi possível carregar o portal da guilda.");
    } finally {
      setCarregando(false);
    }
  }, [idGuild]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function iniciarPortal() {
    if (processando) return;
    setProcessando(true);
    setMensagem("");
    try {
      await axiosInstance.post(`/guilds/${idGuild}/rank-gate/start`);
      await carregar();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Não foi possível iniciar o portal.";
      setMensagem(msg);
    } finally {
      setProcessando(false);
    }
  }

  async function atacarPortal() {
    if (processando) return;
    setProcessando(true);
    setMensagem("");
    setUltimoAtaque(null);
    try {
      const resp = await axiosInstance.post<{
        data?: { dano_causado: number; vencido: boolean; rank_promovido: string | null };
      }>(`/guilds/${idGuild}/rank-gate/attack`);
      if (resp.data?.data) {
        setUltimoAtaque({ dano: resp.data.data.dano_causado, venceu: resp.data.data.vencido });
      }
      await carregar();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Não foi possível atacar o portal.";
      setMensagem(msg);
    } finally {
      setProcessando(false);
    }
  }

  if (carregando) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-white">
        Carregando portal da guilda...
      </div>
    );
  }

  if (!status) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-white">
        {mensagem || "Não foi possível carregar o portal da guilda."}
      </div>
    );
  }

  const tentativa = status.tentativa_ativa;
  const percentualVida = tentativa
    ? Math.max(0, Math.min(100, (Number(tentativa.vida_restante) / Number(tentativa.vida_total)) * 100))
    : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-[#F3B43F]/40 bg-[#292018]/60 p-5 text-white">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">Portal de Guilda</p>
        <p className="mt-1 text-xs text-white/50">
          Ranque da guilda: <span className="font-bold text-white">{status.rank_atual}</span>
          {status.proximo_rank && (
            <> — derrote o chefe pra subir pra <span className="font-bold text-white">{status.proximo_rank}</span></>
          )}
        </p>

        {!status.chefe ? (
          <p className="mt-4 text-sm text-white/60">
            {status.proximo_rank
              ? "Nenhum portal cadastrado para o ranque atual da guilda ainda."
              : "Sua guilda já está no ranque máximo (S++)."}
          </p>
        ) : (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="font-imFeel text-xl">{status.chefe.nome_chefe}</p>
            <p className="mt-1 text-sm text-white/80">{status.chefe.descricao}</p>
            <p className="mt-2 text-xs text-white/50">
              Janela: {status.chefe.janela_horas}h · Recompensa: {status.chefe.recompensa_tesouro} pro tesouro,{" "}
              {status.chefe.recompensa_dinheiro_por_membro} moedas por contribuidor
            </p>

            {tentativa ? (
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-white/60">
                  <span>Vida do chefe</span>
                  <span>
                    {Number(tentativa.vida_restante).toLocaleString()} /{" "}
                    {Number(tentativa.vida_total).toLocaleString()}
                  </span>
                </div>
                <div className="h-4 w-full overflow-hidden rounded-full bg-black/40">
                  <div className="h-full bg-red-600 transition-all" style={{ width: `${percentualVida}%` }} />
                </div>
                <p className="mt-1 text-right text-xs text-white/50">
                  {formatarTempoRestante(tentativa.expira_em)}
                </p>

                <button
                  type="button"
                  onClick={atacarPortal}
                  disabled={processando}
                  className="mt-3 rounded-lg bg-[#F3B43F] px-4 py-2 text-sm font-bold text-black transition hover:bg-[#e0a52f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processando ? "Atacando..." : "Atacar o portal"}
                </button>

                {ultimoAtaque && (
                  <p className={`mt-2 text-sm ${ultimoAtaque.venceu ? "text-green-400" : "text-white/70"}`}>
                    Você causou {ultimoAtaque.dano} de dano.
                    {ultimoAtaque.venceu && " O chefe foi derrotado — a guilda subiu de ranque!"}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4">
                {pode.iniciar_portal ? (
                  <button
                    type="button"
                    onClick={iniciarPortal}
                    disabled={processando}
                    className="rounded-lg bg-[#F3B43F] px-4 py-2 text-sm font-bold text-black transition hover:bg-[#e0a52f] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {processando ? "Iniciando..." : "Iniciar portal da guilda"}
                  </button>
                ) : (
                  <p className="text-sm text-white/50">
                    Só o fundador da guilda pode iniciar o portal.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {mensagem && <p className="mt-3 text-sm text-red-400">{mensagem}</p>}
      </div>

      {tentativa && status.contribuidores.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-white">
          <p className="mb-3 text-sm uppercase tracking-widest text-[#F3B43F]">Contribuidores</p>
          <div className="flex flex-col gap-1">
            {status.contribuidores.map((c, indice) => (
              <div key={indice} className="flex justify-between text-sm text-white/80">
                <span>{c.personagem?.nome ?? "Personagem removido"}</span>
                <span className="text-white/50">{Number(c.dano_total).toLocaleString()} de dano</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
