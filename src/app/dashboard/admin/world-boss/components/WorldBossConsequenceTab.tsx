"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/utils/axiosIntance";
import type { PayloadWorldBossConfigAdmin } from "@/lib/api/admin";
import { INPUT, LABEL, CARD } from "./styles";
export default function WorldBossConsequenceTab({
  form,
  setForm,
}: {
  form: PayloadWorldBossConfigAdmin;
  setForm: React.Dispatch<React.SetStateAction<PayloadWorldBossConfigAdmin>>;
}) {
  const [configs, setConfigs] = useState<
    { id: number; nome: string; ativo: boolean }[]
  >([]);
  const [error, setError] = useState("");
  useEffect(() => {
    void api
      .get("/admin/world-boss/crisis-configs")
      .then((r) => setConfigs(r.data.data))
      .catch(() => setError("Não foi possível carregar os perfis."));
  }, []);
  return (
    <div className={CARD}>
      <h2 className="font-imFeel text-2xl text-[#F3B43F]">
        Consequência da falha
      </h2>
      <p className="my-3 text-sm text-white/60">
        Prazo contado a partir do despertar. Alterações valem para ciclos
        futuros; o evento atual mantém seu snapshot.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={LABEL}>
          Duração máxima do combate (minutos)
          <input
            className={INPUT}
            type="number"
            min={1}
            max={10080}
            value={
              form.combat_duration_seconds
                ? form.combat_duration_seconds / 60
                : ""
            }
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                combat_duration_seconds: e.target.value
                  ? Math.round(Number(e.target.value) * 60)
                  : null,
              }))
            }
          />
        </label>
        <label className={LABEL}>
          Perfil de reconstrução
          <select
            className={INPUT}
            value={form.id_failure_crisis_config ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                id_failure_crisis_config: e.target.value
                  ? Number(e.target.value)
                  : null,
              }))
            }
          >
            <option value="">Sem crise de reconstrução</option>
            {configs.map((c) => (
              <option key={c.id} value={c.id} disabled={!c.ativo}>
                {c.nome}
                {!c.ativo ? " (inativo)" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!form.combat_duration_seconds && (
        <p className="my-3 text-sm text-white/60">
          Sem prazo: comportamento anterior, sem falha por tempo.
        </p>
      )}
      {form.combat_duration_seconds && !form.id_failure_crisis_config && (
        <p className="my-3 text-sm text-amber-300">
          Ao expirar, o Boss falha sem causar crise.
        </p>
      )}
      {error && <p className="text-red-300">{error}</p>}
      <Link
        href="/dashboard/admin/world-crisis"
        className="mt-4 inline-block text-sm text-[#F3B43F] hover:underline"
      >
        Gerenciar crises e reconstrução →
      </Link>
    </div>
  );
}
