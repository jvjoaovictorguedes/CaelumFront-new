"use client";

import { useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import type { GuildResumo } from "./types";

export default function BuscarGuildas({
  characterId,
  onCandidatou,
}: {
  characterId: number;
  onCandidatou: () => void;
}) {
  const [busca, setBusca] = useState("");
  const [guildas, setGuildas] = useState<GuildResumo[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [mensagemPorGuild, setMensagemPorGuild] = useState<Record<number, string>>({});

  async function buscar(event?: React.FormEvent) {
    event?.preventDefault();
    setBuscando(true);
    try {
      const resp = await axiosInstance.get<{ data?: { guilds?: GuildResumo[] } }>("/guilds", {
        params: busca ? { busca } : undefined,
      });
      setGuildas(resp.data?.data?.guilds ?? []);
    } catch (error) {
      console.error("Erro ao buscar guildas:", error);
      setGuildas([]);
    } finally {
      setBuscando(false);
    }
  }

  async function agir(guild: GuildResumo) {
    try {
      if (guild.tipo_recrutamento === "Aberto") {
        await axiosInstance.post(`/guilds/${guild.id}/join`, { idPersonagem: characterId });
        setMensagemPorGuild((atual) => ({ ...atual, [guild.id]: "Você entrou na guilda!" }));
      } else if (guild.tipo_recrutamento === "Aprovacao") {
        await axiosInstance.post(`/guilds/${guild.id}/applications`, {
          idPersonagem: characterId,
        });
        setMensagemPorGuild((atual) => ({ ...atual, [guild.id]: "Candidatura enviada!" }));
      } else {
        setMensagemPorGuild((atual) => ({ ...atual, [guild.id]: "Essa guilda só aceita por convite." }));
        return;
      }
      onCandidatou();
    } catch (error) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Não foi possível se candidatar.";
      setMensagemPorGuild((atual) => ({ ...atual, [guild.id]: msg }));
    }
  }

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      <p className="mb-3 text-sm uppercase tracking-widest text-[#F3B43F]">Buscar guildas</p>
      <form onSubmit={buscar} className="mb-4 flex gap-2">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Nome ou sigla"
          className="flex-1 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-[#F3B43F]"
        />
        <button
          type="submit"
          disabled={buscando}
          className="rounded-lg border-2 border-[#F3B43F] px-4 py-2 font-bold text-[#F3B43F] hover:bg-[#F3B43F]/10 disabled:opacity-50"
        >
          {buscando ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {guildas !== null && (
        guildas.length === 0 ? (
          <p className="text-sm text-white/60">Nenhuma guilda encontrada.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {guildas.map((guild) => (
              <div
                key={guild.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 p-3"
              >
                <div>
                  <p className="font-bold text-[#F3B43F]">
                    {guild.nome} [{guild.sigla}]
                  </p>
                  <p className="text-xs text-white/50">
                    Nível {guild.nivel} · {guild.totalMembros ?? 0}/{guild.limite_membros} membros ·{" "}
                    {guild.tipo_recrutamento === "Aberto"
                      ? "aberta"
                      : guild.tipo_recrutamento === "Aprovacao"
                        ? "por aprovação"
                        : "só por convite"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {mensagemPorGuild[guild.id] && (
                    <span className="text-xs text-white/60">{mensagemPorGuild[guild.id]}</span>
                  )}
                  <button
                    onClick={() => agir(guild)}
                    className="rounded-lg bg-[#BC8418] px-3 py-1.5 text-sm font-bold text-black hover:bg-[#a5710f]"
                  >
                    {guild.tipo_recrutamento === "Convite"
                      ? "Só convite"
                      : guild.tipo_recrutamento === "Aberto"
                        ? "Entrar"
                        : "Candidatar-se"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
