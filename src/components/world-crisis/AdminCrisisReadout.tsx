import type { CrisisStructure } from "@/types/contracts/worldCrisis";
import { CARD } from "@/app/dashboard/admin/world-boss/components/styles";
type GuildExample = {
  raw_points: number;
  unique_contributors: number;
  member_count_snapshot: number;
  participation_pct: number;
  mobilization_multiplier: number;
  score: number;
};
export function CrisisPreview({ data }: { data: unknown }) {
  const p = data as {
    structure?: CrisisStructure;
    warnings?: string[];
    guild_examples?: GuildExample[];
  } & Partial<GuildExample>;
  return (
    <section className={CARD}>
      <h2 className="font-imFeel text-2xl text-[#F3B43F]">
        Prévia de balanceamento
      </h2>
      {p.warnings?.map((w) => (
        <p key={w} className="my-2 text-sm text-amber-300">
          {w}
        </p>
      ))}
      {p.structure?.stages.map((s, i) => (
        <div key={s.key} className="mt-3 rounded-xl border border-white/10 p-3">
          <h3 className="text-[#F3B43F]">
            {i + 1}. {s.nome}
          </h3>
          {s.requirements.map((r) => (
            <div key={r.key} className="mt-2 text-sm">
              <p>
                {r.nome}: {r.target_progress.toLocaleString("pt-BR")} progresso
                global{r.mandatory ? " (obrigatório)" : ""}
              </p>
              <p className="text-xs text-white/60">
                {r.resolved_items
                  ?.map(
                    (x) =>
                      `${x.nome}: ${x.progress_per_unit} progresso / ${x.ranking_points_per_unit} pontos`,
                  )
                  .join(" · ")}
              </p>
            </div>
          ))}
          {s.effects.map((e) => (
            <p key={e.effect_key} className="mt-2 text-sm text-red-200">
              {e.effect_key.includes("XP") ? "XP" : "Gold"} −{e.magnitude}%
            </p>
          ))}
        </div>
      ))}
      {p.structure?.restrictions.map((r) => (
        <p key={r.target_id} className="mt-3 text-sm">
          {r.nome ?? `Zona #${r.target_id}`} reabre após{" "}
          {r.unlock_after_stage_key}.
        </p>
      ))}
      {(
        p.guild_examples ?? (p.score !== undefined ? [p as GuildExample] : [])
      ).map((g, i) => (
        <p key={i} className="mt-3 text-sm">
          Guilda: {g.unique_contributors}/{g.member_count_snapshot} contribuem (
          {g.participation_pct.toFixed(1)}%).{" "}
          {g.raw_points.toLocaleString("pt-BR")} pontos ×{" "}
          {g.mobilization_multiplier.toFixed(2)} ={" "}
          <strong className="text-[#F3B43F]">
            {g.score.toLocaleString("pt-BR")}
          </strong>
          .
        </p>
      ))}
    </section>
  );
}
interface Metrics {
  history: {
    id: number;
    source_id: number;
    status: string;
    current_stage_key: string;
    started_at: string;
    completed_at: string | null;
    rewards_done: boolean;
  }[];
  aggregate: {
    event_id: number;
    donations: number;
    contributors: number;
    materials: number;
    progress: number;
    points: number;
  }[];
  grants: { event_id: number; status: string }[];
}
export function CrisisMetrics({
  data,
  historyOnly,
}: {
  data: unknown;
  historyOnly: boolean;
}) {
  if (!data) return <p>Carregando…</p>;
  const m = data as Metrics;
  return (
    <div className="overflow-x-auto">
      <table className="mt-3 w-full text-left text-sm">
        <thead className="text-[#F3B43F]">
          <tr>
            <th className="p-2">Crise</th>
            <th className="p-2">Estado</th>
            <th className="p-2">
              {historyOnly ? "Período" : "Participantes / entregas"}
            </th>
            <th className="p-2">
              {historyOnly ? "Prêmios" : "Materiais / pontos"}
            </th>
          </tr>
        </thead>
        <tbody>
          {m.history?.map((e) => {
            const a = m.aggregate?.find((a) => a.event_id === e.id);
            return (
              <tr key={e.id} className="border-t border-white/10">
                <td className="p-2">
                  #{e.id} · Boss #{e.source_id}
                </td>
                <td className="p-2">
                  {e.status === "ACTIVE"
                    ? "Em reconstrução"
                    : e.status === "COMPLETED"
                      ? "Concluída"
                      : "Cancelada"}
                  <p className="text-xs text-white/50">{e.current_stage_key}</p>
                </td>
                <td className="p-2">
                  {historyOnly ? (
                    <>
                      {new Date(e.started_at).toLocaleString("pt-BR")}
                      <p className="text-xs text-white/50">
                        {e.completed_at
                          ? new Date(e.completed_at).toLocaleString("pt-BR")
                          : "Em andamento"}
                      </p>
                    </>
                  ) : (
                    <>
                      {a?.contributors ?? 0} participantes · {a?.donations ?? 0}{" "}
                      entregas
                    </>
                  )}
                </td>
                <td className="p-2">
                  {historyOnly ? (
                    e.rewards_done ? (
                      "Processados"
                    ) : (
                      "Pendentes"
                    )
                  ) : (
                    <>
                      {(a?.materials ?? 0).toLocaleString("pt-BR")} materiais ·{" "}
                      {(a?.points ?? 0).toLocaleString("pt-BR")} pontos
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!m.history?.length && (
        <p className="my-4 text-sm text-white/60">Nenhuma crise registrada.</p>
      )}
    </div>
  );
}
