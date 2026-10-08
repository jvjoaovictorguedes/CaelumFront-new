"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import type { ContribuicaoMembroDetalhe, ContribuicaoRankingLinha, PeriodoContribuicao } from "./types";

const PERIODOS: { chave: PeriodoContribuicao; label: string }[] = [
  { chave: "week", label: "Semana" },
  { chave: "month", label: "Mês" },
  { chave: "all", label: "Histórico" },
];

const LABEL_FONTE: Record<string, string> = {
  MISSION_DAILY: "Missão diária",
  MISSION_WEEKLY: "Missão semanal",
  MISSION_MONTHLY: "Missão mensal",
  MISSION_RANK: "Missão de rank",
  GUILD_BOSS: "Boss da guilda",
  GOLD_DONATION: "Doação",
};

function labelFonte(fonte: string) {
  return LABEL_FONTE[fonte] ?? fonte;
}

export default function GuildContributionTab({ idGuild }: { idGuild: number }) {
  const [periodo, setPeriodo] = useState<PeriodoContribuicao>("week");
  const [ranking, setRanking] = useState<ContribuicaoRankingLinha[] | null>(null);
  const [detalheAberto, setDetalheAberto] = useState<number | null>(null);
  const [detalhe, setDetalhe] = useState<ContribuicaoMembroDetalhe | null>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  useEffect(() => {
    setRanking(null);
    axiosInstance
      .get<{ data?: { ranking?: ContribuicaoRankingLinha[] } }>(
        `/guilds/${idGuild}/contributions/period/${periodo}`,
      )
      .then((resp) => setRanking(resp.data?.data?.ranking ?? []))
      .catch((error) => {
        console.error("Erro ao carregar contribuições por período:", error);
        setRanking([]);
      });
  }, [idGuild, periodo]);

  function abrirDetalhe(idPersonagem: number) {
    if (detalheAberto === idPersonagem) {
      setDetalheAberto(null);
      setDetalhe(null);
      return;
    }
    setDetalheAberto(idPersonagem);
    setDetalhe(null);
    setCarregandoDetalhe(true);
    axiosInstance
      .get<{ data?: ContribuicaoMembroDetalhe }>(`/guilds/${idGuild}/contributions/${idPersonagem}`)
      .then((resp) => setDetalhe(resp.data?.data ?? null))
      .catch((error) => console.error("Erro ao carregar detalhe de contribuição:", error))
      .finally(() => setCarregandoDetalhe(false));
  }

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">Ranking de contribuição</p>
        <div className="flex gap-1 rounded-lg border border-white/10 bg-black/20 p-1">
          {PERIODOS.map((p) => (
            <button
              key={p.chave}
              type="button"
              onClick={() => setPeriodo(p.chave)}
              className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                periodo === p.chave ? "bg-[#BC8418] text-black" : "text-white/60 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {ranking === null ? (
        <p className="text-sm text-white/60">Carregando...</p>
      ) : ranking.length === 0 ? (
        <p className="text-sm text-white/60">
          Ninguém contribuiu nesse período ainda — missões da guilda, o Boss e doações pontuam aqui.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {ranking.map((linha, indice) => (
            <div key={linha.personagem?.id ?? indice} className="rounded-lg border border-white/10 bg-black/30">
              <button
                type="button"
                onClick={() => linha.personagem && abrirDetalhe(linha.personagem.id)}
                className="flex w-full items-center justify-between gap-2 p-3 text-left"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="w-6 shrink-0 text-center font-bold text-[#F3B43F]">{indice + 1}º</span>
                  <span className="truncate">
                    {linha.personagem?.nome ?? "—"}
                    {linha.personagem?.nivel ? ` (nível ${linha.personagem.nivel})` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-right text-sm text-white/70">{linha.pontos} pts</span>
              </button>

              {detalheAberto === linha.personagem?.id && (
                <div className="border-t border-white/10 p-3 text-sm">
                  {carregandoDetalhe ? (
                    <p className="text-white/60">Carregando detalhe...</p>
                  ) : detalhe ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap gap-4 text-white/70">
                        <span>Semana: {detalhe.pontos_semana} pts</span>
                        <span>Mês: {detalhe.pontos_mes} pts</span>
                        <span>Histórico: {detalhe.pontos_historico} pts</span>
                      </div>
                      {Object.keys(detalhe.composicao).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(detalhe.composicao).map(([fonte, pontos]) => (
                            <span
                              key={fonte}
                              className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-xs text-white/70"
                            >
                              {labelFonte(fonte)}: {pontos} pts
                            </span>
                          ))}
                        </div>
                      )}
                      {detalhe.ultima_contribuicao && (
                        <p className="text-xs text-white/50">
                          Última contribuição: {labelFonte(detalhe.ultima_contribuicao.source_type)} (+
                          {detalhe.ultima_contribuicao.pontos} pts) em{" "}
                          {new Date(detalhe.ultima_contribuicao.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-white/60">Sem dados de contribuição ainda.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
