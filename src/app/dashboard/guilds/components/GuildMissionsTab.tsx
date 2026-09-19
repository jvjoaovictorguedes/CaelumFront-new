"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";

interface MissaoApi {
  categoria: "Diaria" | "Semanal" | "Mensal" | "Rank";
  missao: {
    id: number;
    nome: string;
    descricao: string;
    tipo_objetivo: string;
    meta: number;
    xp_guilda: number;
    pontos_contribuicao: number;
  };
  progresso: number;
  concluida: boolean;
  membros_concluiram: number;
  ciclo_inicio: string;
}

const LABEL_CATEGORIA: Record<MissaoApi["categoria"], string> = {
  Diaria: "Diária",
  Semanal: "Semanal",
  Mensal: "Mensal",
  Rank: "Rank",
};

export default function GuildMissionsTab({ idGuild }: { idGuild: number }) {
  const [missoes, setMissoes] = useState<MissaoApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");

  const carregar = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{ data?: { missoes?: MissaoApi[] } }>(
        `/guilds/${idGuild}/missions`,
      );
      setMissoes(resp.data?.data?.missoes ?? []);
    } catch (error) {
      console.error("Erro ao carregar missões da guilda:", error);
      setMensagem("Não foi possível carregar as missões da guilda.");
    } finally {
      setCarregando(false);
    }
  }, [idGuild]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (carregando) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-white">
        Carregando missões da guilda...
      </div>
    );
  }

  if (missoes.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-white">
        {mensagem || "Nenhuma missão da guilda disponível no momento."}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-white/50">
        As missões são as mesmas pra todos os membros durante o ciclo atual — cada um progride e recebe XP de
        Guilda individualmente, sem precisar aceitar nada.
      </p>
      {missoes.map((linha) => {
        const percentual = Math.min(100, (linha.progresso / linha.missao.meta) * 100);
        return (
          <div key={`${linha.categoria}-${linha.missao.id}`} className="rounded-xl border border-[#F3B43F]/30 bg-[#3a2f24] p-3 text-white">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full border border-[#F3B43F]/60 px-2 py-0.5 text-[10px] uppercase tracking-widest text-[#F3B43F]">
                {LABEL_CATEGORIA[linha.categoria]}
              </span>
              {linha.concluida && <span className="text-xs font-bold text-green-400">Concluída ✓</span>}
            </div>
            <p className="mt-2 font-bold">{linha.missao.nome}</p>
            <p className="mt-1 text-xs text-white/70">{linha.missao.descricao}</p>

            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/30">
              <div
                className={`h-full ${linha.concluida ? "bg-green-500" : "bg-[#F3B43F]"}`}
                style={{ width: `${percentual}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-white/50">
              <span>{linha.progresso} / {linha.missao.meta}</span>
              <span>
                +{linha.missao.xp_guilda} XP de Guilda · +{linha.missao.pontos_contribuicao} contribuição
              </span>
            </div>
            <p className="mt-1 text-[11px] text-white/40">
              {linha.membros_concluiram} membro(s) já concluíram este ciclo.
            </p>
          </div>
        );
      })}
    </div>
  );
}
