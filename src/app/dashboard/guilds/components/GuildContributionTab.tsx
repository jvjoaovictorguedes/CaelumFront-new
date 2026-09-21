"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import type { Contribuicao } from "./types";

export default function GuildContributionTab({ idGuild }: { idGuild: number }) {
  const [contribuicoes, setContribuicoes] = useState<Contribuicao[] | null>(null);

  useEffect(() => {
    axiosInstance
      .get<{ data?: { contribuicoes?: Contribuicao[] } }>(`/guilds/${idGuild}/contributions`)
      .then((resp) => setContribuicoes(resp.data?.data?.contribuicoes ?? []))
      .catch((error) => {
        console.error("Erro ao carregar contribuições:", error);
        setContribuicoes([]);
      });
  }, [idGuild]);

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      <p className="mb-3 text-sm uppercase tracking-widest text-[#F3B43F]">
        Ranking de contribuição
      </p>
      {contribuicoes === null ? (
        <p className="text-sm text-white/60">Carregando...</p>
      ) : contribuicoes.length === 0 ? (
        <p className="text-sm text-white/60">
          Ninguém contribuiu ainda — seja o primeiro a doar na aba Tesouro.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {contribuicoes.map((contribuicao, indice) => (
            <div
              key={contribuicao.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/30 p-3"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="w-6 shrink-0 text-center font-bold text-[#F3B43F]">{indice + 1}º</span>
                <span className="truncate">
                  {contribuicao.Character?.nome} (nível {contribuicao.Character?.nivel})
                </span>
              </span>
              <span className="shrink-0 text-right text-sm text-white/70">
                {contribuicao.contribuicao_total} pts · {contribuicao.ouro_doado_total} ouro doado
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
