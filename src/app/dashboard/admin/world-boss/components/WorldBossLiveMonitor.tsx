"use client";

// Ameaça Mundial V2 §13.7 — monitor ao vivo do relógio de combate,
// plugado dentro do status operacional já existente (getStatusOperacional).
// Só aparece quando o ciclo está ACTIVE (runtime_v2 non-null) — fora
// disso a aba Ciclo Atual já mostra o status básico (DORMANT/
// DISCOVERED/etc), sem nada aqui pra exibir.
import type { WorldBossRuntimeV2Api } from "@/lib/api/admin";
import { CARD } from "./styles";

export default function WorldBossLiveMonitor({ runtime }: { runtime: WorldBossRuntimeV2Api }) {
  const manaPct = runtime.mana_maxima ? Math.round((runtime.mana_current / runtime.mana_maxima) * 100) : 0;

  return (
    <div className={CARD}>
      <p className="mb-3 font-imFeel text-lg text-[#F3B43F]">Monitor de combate (ao vivo)</p>

      <div className="grid grid-cols-2 gap-3 text-sm text-white/80 sm:grid-cols-4">
        <div>
          <p className="text-[10px] uppercase text-white/40">Fase atual</p>
          <p className="font-bold text-[#F3B43F]">{runtime.fase_atual?.nome_fase ?? "—"}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-white/40">Mana</p>
          <p>{runtime.mana_current}{runtime.mana_maxima !== null ? ` / ${runtime.mana_maxima} (${manaPct}%)` : ""}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-white/40">Fúria</p>
          <p>{runtime.furia_current_pct}%</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-white/40">Ação do Boss</p>
          <p>#{runtime.boss_action_seq} (#{runtime.phase_action_seq} nesta fase)</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-white/40">Próxima ação em</p>
          <p>{runtime.proxima_acao_em_ms !== null ? `${Math.ceil(runtime.proxima_acao_em_ms / 1000)}s` : "—"}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-white/40">Conjurando</p>
          <p>{runtime.cast_pendente ? `${runtime.cast_pendente.power?.nome ?? "?"} (resolve ${new Date(runtime.cast_pendente.resolves_at).toLocaleTimeString("pt-BR")})` : "—"}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-white/40">Participantes</p>
          <p>{runtime.participantes.ativos} ativos / {runtime.participantes.derrotados} derrotados ({runtime.participantes.total} total)</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-white/40">Status no Boss</p>
          <p>{runtime.status_boss.length === 0 ? "Nenhum" : runtime.status_boss.map((s) => `${s.key} (${s.remainingTurns})`).join(", ")}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1 text-[10px] uppercase text-white/40">Ranking ao vivo (Top {runtime.ranking_ao_vivo.length})</p>
        {runtime.ranking_ao_vivo.length === 0 ? (
          <p className="text-sm text-white/50">Nenhuma contribuição registrada ainda.</p>
        ) : (
          <ol className="flex flex-col gap-1 text-sm text-white/80">
            {runtime.ranking_ao_vivo.map((linha) => (
              <li key={linha.character_id} className="flex items-center justify-between rounded bg-black/20 px-2 py-1">
                <span>{linha.posicao}º — {linha.nome ?? `#${linha.character_id}`} {linha.badges.length > 0 && <span className="text-[10px] text-[#F3B43F]">[{linha.badges.join(", ")}]</span>}</span>
                <span>{linha.damage_total.toLocaleString("pt-BR")} ({linha.damage_percent}%)</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
