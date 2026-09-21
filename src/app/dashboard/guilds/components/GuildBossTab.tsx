"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import type { Permissao } from "./types";

interface ChefeBossApi {
  id: number;
  rank: string;
  nome_chefe: string;
  descricao: string;
  vida_total: string;
  janela_horas: number;
  custo_liberacao: number;
  xp_guilda_concedido: number;
  pool_dinheiro_total: number;
  pool_xp_total: number;
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

interface StatusBossApi {
  rank_atual: string;
  bosses_derrotados_total: number;
  chefe: ChefeBossApi | null;
  liberado_esta_semana: boolean;
  tentativa: TentativaApi | null;
  contribuidores: ContribuidorApi[];
}

function formatarTempoRestante(expiraEm: string) {
  const ms = new Date(expiraEm).getTime() - Date.now();
  if (ms <= 0) return "expirado";
  const dias = Math.floor(ms / 86400000);
  const horas = Math.floor((ms % 86400000) / 3600000);
  return dias > 0 ? `${dias}d ${horas}h restantes` : `${horas}h restantes`;
}

export default function GuildBossTab({
  idGuild,
  pode,
}: {
  idGuild: number;
  pode: Record<Permissao, boolean>;
}) {
  const [status, setStatus] = useState<StatusBossApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [ultimoAtaque, setUltimoAtaque] = useState<{ dano: number; derrotado: boolean } | null>(null);

  const carregar = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{ data?: StatusBossApi }>(`/guilds/${idGuild}/boss`);
      setStatus(resp.data?.data ?? null);
    } catch (error) {
      console.error("Erro ao carregar boss da guilda:", error);
      setMensagem("Não foi possível carregar o Boss da guilda.");
    } finally {
      setCarregando(false);
    }
  }, [idGuild]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function liberarBoss() {
    if (processando) return;
    setProcessando(true);
    setMensagem("");
    try {
      await axiosInstance.post(`/guilds/${idGuild}/boss/liberar`);
      await carregar();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Não foi possível liberar o Boss.";
      setMensagem(msg);
    } finally {
      setProcessando(false);
    }
  }

  async function atacarBoss() {
    if (processando) return;
    setProcessando(true);
    setMensagem("");
    setUltimoAtaque(null);
    try {
      const resp = await axiosInstance.post<{ data?: { dano_causado: number; derrotado: boolean } }>(
        `/guilds/${idGuild}/boss/atacar`,
      );
      if (resp.data?.data) {
        setUltimoAtaque({ dano: resp.data.data.dano_causado, derrotado: resp.data.data.derrotado });
      }
      await carregar();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Não foi possível atacar o Boss.";
      setMensagem(msg);
    } finally {
      setProcessando(false);
    }
  }

  if (carregando) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-white">
        Carregando Boss da guilda...
      </div>
    );
  }

  if (!status) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-white">
        {mensagem || "Não foi possível carregar o Boss da guilda."}
      </div>
    );
  }

  const tentativa = status.tentativa;
  const percentualVida = tentativa
    ? Math.max(0, Math.min(100, (Number(tentativa.vida_restante) / Number(tentativa.vida_total)) * 100))
    : 0;
  const bossAtivo = tentativa?.status === "Ativo";

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-[#F3B43F]/40 bg-[#292018]/60 p-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm uppercase tracking-widest text-[#F3B43F]">Boss da Guilda</p>
          <span className="text-xs text-white/50">
            {status.bosses_derrotados_total} derrotado(s) no histórico
          </span>
        </div>
        <p className="mt-1 text-xs text-white/50">
          Ranque da guilda: <span className="font-bold text-white">{status.rank_atual}</span> — o Boss não
          promove ranque, isso agora vem das Missões de Rank.
        </p>

        {!status.chefe ? (
          <p className="mt-4 text-sm text-white/60">Nenhum Boss cadastrado para o ranque atual ainda.</p>
        ) : (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="font-imFeel text-xl">{status.chefe.nome_chefe}</p>
            <p className="mt-1 text-sm text-white/80">{status.chefe.descricao}</p>
            <p className="mt-2 text-xs text-white/50">
              Janela: {status.chefe.janela_horas}h · Custo de liberação: {status.chefe.custo_liberacao.toLocaleString()} de
              ouro do Tesouro · +{status.chefe.xp_guilda_concedido} XP de Guilda ao derrotar
            </p>

            {bossAtivo && tentativa ? (
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-white/60">
                  <span>Vida do Boss</span>
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
                  onClick={atacarBoss}
                  disabled={processando}
                  className="mt-3 rounded-lg bg-[#F3B43F] px-4 py-2 text-sm font-bold text-black transition hover:bg-[#e0a52f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processando ? "Atacando..." : "Atacar o Boss"}
                </button>

                {ultimoAtaque && (
                  <p className={`mt-2 text-sm ${ultimoAtaque.derrotado ? "text-green-400" : "text-white/70"}`}>
                    Você causou {ultimoAtaque.dano} de dano.
                    {ultimoAtaque.derrotado && " O Boss foi derrotado — recompensas distribuídas!"}
                  </p>
                )}
              </div>
            ) : status.liberado_esta_semana ? (
              <p className="mt-4 text-sm text-white/50">
                {tentativa?.status === "Vencido"
                  ? "O Boss desta semana já foi derrotado."
                  : "O Boss desta semana expirou sem ser derrotado."}{" "}
                Volte na próxima semana.
              </p>
            ) : (
              <div className="mt-4">
                {pode.liberar_boss ? (
                  <button
                    type="button"
                    onClick={liberarBoss}
                    disabled={processando}
                    className="rounded-lg bg-[#F3B43F] px-4 py-2 text-sm font-bold text-black transition hover:bg-[#e0a52f] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {processando ? "Liberando..." : `Liberar Boss (${status.chefe.custo_liberacao.toLocaleString()} de ouro)`}
                  </button>
                ) : (
                  <p className="text-sm text-white/50">Só o líder da guilda pode liberar o Boss.</p>
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
              <div key={indice} className="flex justify-between gap-2 text-sm text-white/80">
                <span className="min-w-0 truncate">{c.personagem?.nome ?? "Personagem removido"}</span>
                <span className="shrink-0 text-white/50">{Number(c.dano_total).toLocaleString()} de dano</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
