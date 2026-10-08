"use client";
import { useCallback, useEffect, useState } from "react";
import api from "@/utils/axiosIntance";
interface State {
  id_personagem: number;
  score: number;
  status: string;
  verified_until: string | null;
  restricted_until: string | null;
  last_signal_at: string | null;
}
interface Summary {
  total: number;
  items: State[];
  signalsLastDay: { event_type: string; count: string }[];
  policy: Record<string, number | boolean>;
}
interface Detail {
  state: State | null;
  events: {
    id: number;
    event_type: string;
    action_type: string;
    createdAt: string;
    risk_delta: number;
  }[];
  challenges: { id: string; status: string; attempts: number }[];
}
export default function AdminAutomation() {
  const [summary, setSummary] = useState<Summary | null>(null),
    [detail, setDetail] = useState<Detail | null>(null),
    [error, setError] = useState(""),
    [reason, setReason] = useState(""),
    [config, setConfig] = useState(""),
    [page, setPage] = useState(1),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const r = await api.get(`/admin/anti-automation?page=${page}`);
      setSummary(r.data.data);
      setConfig(JSON.stringify(r.data.data.policy, null, 2));
      setError("");
    } catch {
      setError("Não foi possível consultar os dados. Verifique sua permissão.");
    }
  }, [page]);
  useEffect(() => {
    void load();
  }, [load]);
  const select = async (id: number) => {
    try {
      const r = await api.get(`/admin/anti-automation/${id}`);
      setDetail(r.data.data);
    } catch {
      setError("Falha ao consultar personagem.");
    }
  };
  const review = async (action: string) => {
    if (!detail?.state) return;
    setBusy(true);
    try {
      await api.post(
        `/admin/anti-automation/${detail.state.id_personagem}/review`,
        { action, reason },
      );
      await select(detail.state.id_personagem);
      await load();
      setReason("");
    } catch {
      setError(
        "Revisão recusada. Verifique a justificativa e a permissão de gerenciamento.",
      );
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    setBusy(true);
    try {
      await api.patch("/admin/anti-automation/config", {
        values: JSON.parse(config),
        reason,
      });
      await load();
      setReason("");
    } catch {
      setError(
        "Configuração recusada. Verifique valores, justificativa e permissão.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 text-white">
      <h1 className="text-2xl">Anti-automação</h1>
      <p>
        O score auxilia a revisão; não comprova automação. Shadow mode registra
        decisões sem bloquear jogadores.
      </p>
      {error && <p role="alert">{error}</p>}
      {summary && (
        <>
          <p>{summary.total} personagens com sinais registrados.</p>
          <div className="flex flex-wrap gap-3">
            {summary.signalsLastDay.map((s) => (
              <span key={s.event_type}>
                {s.event_type}: {s.count}
              </span>
            ))}
          </div>
          <div className="overflow-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Personagem</th>
                  <th>Score</th>
                  <th>Estado</th>
                  <th>Restrição até</th>
                </tr>
              </thead>
              <tbody>
                {summary.items.map((s) => (
                  <tr key={s.id_personagem}>
                    <td>
                      <button onClick={() => select(s.id_personagem)}>
                        {s.id_personagem}
                      </button>
                    </td>
                    <td>{Math.round(s.score)}</td>
                    <td>{s.status}</td>
                    <td>{s.restricted_until || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-4">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
              Anterior
            </button>
            <span>Página {page}</span>
            <button
              disabled={page * 50 >= summary.total}
              onClick={() => setPage(page + 1)}
            >
              Próxima
            </button>
          </div>
        </>
      )}
      {detail && (
        <section className="space-y-3">
          <h2 className="text-xl">Personagem {detail.state?.id_personagem}</h2>
          <p>Verificado até: {detail.state?.verified_until || "—"}</p>
          <ul>
            {detail.events.map((e) => (
              <li key={e.id}>
                {e.createdAt} — {e.event_type} / {e.action_type} / delta{" "}
                {e.risk_delta.toFixed(1)}
              </li>
            ))}
          </ul>
          <ul>
            {detail.challenges.map((c) => (
              <li key={c.id}>
                {c.status} — {c.attempts} tentativas
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            {[
              ["reviewed", "Marcar revisado"],
              ["reset", "Resetar score"],
              ["release", "Liberar restrição"],
              ["challenge", "Solicitar verificação"],
              ["exempt", "Isentar por 1 hora"],
            ].map(([action, label]) => (
              <button
                className="rounded border p-2"
                disabled={busy || reason.trim().length < 5}
                key={action}
                onClick={() => review(action)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      )}
      <label className="block">
        Justificativa
        <input
          className="block w-full rounded bg-black/40 p-2"
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <details>
        <summary>Configuração e rollout</summary>
        <textarea
          aria-label="Configuração"
          className="h-80 w-full bg-black/40 p-2 font-mono"
          value={config}
          onChange={(e) => setConfig(e.target.value)}
        />
        <button
          disabled={busy || reason.trim().length < 5}
          className="rounded border p-2"
          onClick={save}
        >
          Salvar configuração
        </button>
      </details>
    </div>
  );
}
