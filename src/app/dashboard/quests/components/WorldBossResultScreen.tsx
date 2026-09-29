"use client";

// Ameaça Mundial V2 §18.4 — tela de resultado: AMEAÇA DERROTADA, Maior
// Dano, Golpe Final, Descobridor e Ranking Final. Tudo já vem pronto do
// backend (status público + worldboss:ranking-final) — nenhum cálculo
// aqui, só apresentação.
import type { WorldBossRankingApi, WorldBossStatusApi } from "@/lib/api/worldBoss";
import WorldBossRankingPanel from "./WorldBossRankingPanel";

export default function WorldBossResultScreen({ status, ranking }: { status: WorldBossStatusApi; ranking: WorldBossRankingApi | null }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      <div className="text-center">
        <p className="font-imFeel text-3xl text-[#F3B43F]">AMEAÇA DERROTADA</p>
        <p className="mt-1 text-lg text-white/80">{status.nome}</p>
        {status.mensagem_derrota && <p className="mt-2 text-sm text-white/60">{status.mensagem_derrota}</p>}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#F3B43F]/30 bg-black/30 p-3 text-center">
          <p className="text-[10px] uppercase tracking-wide text-white/40">Maior Dano</p>
          {status.maior_dano_por ? (
            <>
              <p className="mt-1 font-bold text-[#F3B43F]">{status.maior_dano_por.nome}</p>
              {status.maior_dano_por.damage_total !== null && <p className="text-xs text-white/60">{status.maior_dano_por.damage_total.toLocaleString("pt-BR")}</p>}
            </>
          ) : (
            <p className="mt-1 text-xs text-white/40">—</p>
          )}
        </div>
        <div className="rounded-xl border border-[#F3B43F]/30 bg-black/30 p-3 text-center">
          <p className="text-[10px] uppercase tracking-wide text-white/40">Golpe Final</p>
          <p className="mt-1 font-bold text-[#F3B43F]">{status.golpe_final_por?.nome ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-[#F3B43F]/30 bg-black/30 p-3 text-center">
          <p className="text-[10px] uppercase tracking-wide text-white/40">Descobridor</p>
          <p className="mt-1 font-bold text-[#F3B43F]">{status.descobridor?.nome ?? "—"}</p>
          {status.zona_descoberta && <p className="text-xs text-white/60">{status.zona_descoberta.nome}</p>}
        </div>
      </div>

      <div>
        <p className="mb-1 text-center font-imFeel text-lg text-[#F3B43F]">Ranking Final</p>
        <WorldBossRankingPanel ranking={ranking} />
      </div>
    </div>
  );
}
