"use client";

// Ameaça Mundial V2 §18.1 — Ranking Top 10 + a própria posição, mesmo
// pressuposto do backend: "Líder de dano" enquanto ACTIVE, só vira
// "Maior Dano" oficial depois de DEFEATED (lider_oficial).
import type { WorldBossRankingApi, WorldBossRankingLinhaApi } from "@/lib/api/worldBoss";

const NOME_BADGE: Record<string, string> = {
  MAIOR_DANO: "Maior Dano",
  GOLPE_FINAL: "Golpe Final",
  DESCOBRIDOR: "Descobridor",
};

function LinhaRanking({ linha, destaque }: { linha: WorldBossRankingLinhaApi; destaque?: boolean }) {
  return (
    <li className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs ${destaque ? "bg-[#F3B43F]/20 text-[#F3B43F]" : "bg-black/20 text-white/80"}`}>
      <span className="flex items-center gap-2">
        <span className="w-5 text-right font-bold">{linha.posicao}º</span>
        <span>{linha.nome ?? `#${linha.character_id}`}</span>
        {linha.badges.map((b) => (
          <span key={b} className="rounded-full bg-red-900/60 px-2 py-0.5 text-[9px] uppercase text-red-200">{NOME_BADGE[b] ?? b}</span>
        ))}
      </span>
      <span className="shrink-0 tabular-nums">{linha.damage_total.toLocaleString("pt-BR")} ({linha.damage_percent}%)</span>
    </li>
  );
}

export default function WorldBossRankingPanel({ ranking }: { ranking: WorldBossRankingApi | null }) {
  if (!ranking || ranking.top.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
        <p className="text-xs font-bold uppercase text-white/50">Ranking</p>
        <p className="mt-1 text-xs text-white/40">Nenhuma contribuição registrada ainda.</p>
      </div>
    );
  }

  const minhaNoTop = ranking.minha_posicao ? ranking.top.some((l) => l.character_id === ranking.minha_posicao!.character_id) : true;

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <p className="text-xs font-bold uppercase text-white/50">{ranking.lider_oficial ? "Ranking final" : "Ranking ao vivo"} — Top {ranking.top.length}</p>
      <ol className="mt-2 flex flex-col gap-1">
        {ranking.top.map((linha) => (
          <LinhaRanking key={linha.character_id} linha={linha} destaque={ranking.minha_posicao?.character_id === linha.character_id} />
        ))}
      </ol>
      {ranking.minha_posicao && !minhaNoTop && (
        <>
          <p className="mt-2 text-[10px] uppercase text-white/40">Sua posição</p>
          <ol className="mt-1">
            <LinhaRanking linha={ranking.minha_posicao} destaque />
          </ol>
        </>
      )}
    </div>
  );
}
