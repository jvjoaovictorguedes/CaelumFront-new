"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { useCharacter } from "@/contexts/CharacterContext";

interface MissaoApi {
  id: number;
  nome: string;
  descricao: string;
  tipo: string;
  categoria: "Diaria" | "Unica";
  meta: number;
  progresso: number;
  concluida: boolean;
  recompensa_resgatada: boolean;
  expira_em: string | null;
  recompensa_dinheiro: number;
  recompensa_xp: number;
  recompensa_item_id: number | null;
  recompensa_item_quantidade: number;
}

function formatarExpiracao(expiraEm: string | null) {
  if (!expiraEm) return null;
  const restanteMs = new Date(expiraEm).getTime() - Date.now();
  if (restanteMs <= 0) return "renovando...";
  const horas = Math.floor(restanteMs / 3_600_000);
  const minutos = Math.floor((restanteMs % 3_600_000) / 60_000);
  return horas > 0 ? `renova em ${horas}h ${minutos}min` : `renova em ${minutos}min`;
}

export default function MissionsPanel({ characterId }: { characterId: number }) {
  const [missoes, setMissoes] = useState<MissaoApi[] | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [resgatando, setResgatando] = useState<number | null>(null);
  const [mensagem, setMensagem] = useState("");
  const { refreshCharacter } = useCharacter();

  const carregar = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{ data?: { missoes?: MissaoApi[] } }>(
        `/characters/${characterId}/missions`,
      );
      setMissoes(resp.data?.data?.missoes ?? []);
    } catch (error) {
      console.error("Erro ao carregar missões:", error);
      setMensagem("Não foi possível carregar as missões.");
    } finally {
      setCarregando(false);
    }
  }, [characterId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function resgatar(missionId: number) {
    if (resgatando) return;
    setResgatando(missionId);
    setMensagem("");
    try {
      await axiosInstance.post(`/characters/${characterId}/missions/${missionId}/claim`);
      await Promise.all([carregar(), refreshCharacter()]);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Não foi possível resgatar a recompensa.";
      setMensagem(msg);
    } finally {
      setResgatando(null);
    }
  }

  if (carregando) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        Carregando missões...
      </div>
    );
  }

  const diarias = missoes?.filter((m) => m.categoria === "Diaria") ?? [];
  const unicas = missoes?.filter((m) => m.categoria === "Unica") ?? [];

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      <p className="mb-4 text-sm uppercase tracking-widest text-[#F3B43F]">Missões</p>

      {mensagem && <p className="mb-3 text-sm text-red-400">{mensagem}</p>}

      {diarias.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-xs uppercase tracking-widest text-white/50">Diárias</p>
          <div className="flex flex-col gap-2">
            {diarias.map((missao) => (
              <CardMissao key={missao.id} missao={missao} resgatando={resgatando} onResgatar={resgatar} />
            ))}
          </div>
        </div>
      )}

      {unicas.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-white/50">Marcos</p>
          <div className="flex flex-col gap-2">
            {unicas.map((missao) => (
              <CardMissao key={missao.id} missao={missao} resgatando={resgatando} onResgatar={resgatar} />
            ))}
          </div>
        </div>
      )}

      {diarias.length === 0 && unicas.length === 0 && (
        <p className="text-sm text-white/60">Nenhuma missão disponível pro seu nível ainda.</p>
      )}
    </div>
  );
}

function CardMissao({
  missao,
  resgatando,
  onResgatar,
}: {
  missao: MissaoApi;
  resgatando: number | null;
  onResgatar: (id: number) => void;
}) {
  const percentual = Math.min(100, (missao.progresso / missao.meta) * 100);
  const expiraTexto = missao.categoria === "Diaria" ? formatarExpiracao(missao.expira_em) : null;

  return (
    <div className="rounded-xl border border-[#F3B43F]/30 bg-[#3a2f24] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-bold">{missao.nome}</span>
        {expiraTexto && <span className="text-[10px] text-white/40">{expiraTexto}</span>}
      </div>
      <p className="mt-1 text-xs text-white/70">{missao.descricao}</p>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/30">
        <div
          className={`h-full ${missao.concluida ? "bg-green-500" : "bg-[#F3B43F]"}`}
          style={{ width: `${percentual}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px] text-white/50">
        <span>
          {missao.progresso}/{missao.meta}
        </span>
        <span>
          Recompensa: {missao.recompensa_dinheiro > 0 && `${missao.recompensa_dinheiro} moedas`}
          {missao.recompensa_xp > 0 && ` · ${missao.recompensa_xp} XP`}
          {missao.recompensa_item_id && ` · ${missao.recompensa_item_quantidade}x item`}
        </span>
      </div>

      {missao.concluida && !missao.recompensa_resgatada && (
        <button
          type="button"
          onClick={() => onResgatar(missao.id)}
          disabled={resgatando === missao.id}
          className="mt-2 w-full rounded-lg bg-[#F3B43F] px-3 py-1.5 text-xs font-bold text-black transition hover:bg-[#e0a52f] disabled:opacity-50"
        >
          {resgatando === missao.id ? "Resgatando..." : "Resgatar recompensa"}
        </button>
      )}
      {missao.recompensa_resgatada && (
        <p className="mt-2 text-center text-[11px] font-bold text-green-500">Recompensa resgatada</p>
      )}
    </div>
  );
}
