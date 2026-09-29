"use client";

// Ameaça Mundial V2 §13.2 — aba "Descoberta": mensagens narrativas do
// ciclo (descoberta/convocação/fase final/derrota) + zonas elegíveis
// pra descoberta. A recompensa em gold do descobridor fica na aba
// Recompensas (§13.6), junto das outras recompensas do ciclo.
import type { Dispatch, SetStateAction } from "react";
import type { PayloadWorldBossConfigAdmin } from "@/lib/api/admin";
import { INPUT, LABEL } from "./styles";

export default function WorldBossDiscoveryTab({
  form,
  setForm,
}: {
  form: PayloadWorldBossConfigAdmin;
  setForm: Dispatch<SetStateAction<PayloadWorldBossConfigAdmin>>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className={LABEL}>
        Mensagem de descoberta
        <input required value={form.mensagem_descoberta} onChange={(e) => setForm((f) => ({ ...f, mensagem_descoberta: e.target.value }))} className={INPUT} />
      </label>
      <label className={LABEL}>
        Mensagem de convocação (chamado global ao despertar)
        <input required value={form.mensagem_convocacao} onChange={(e) => setForm((f) => ({ ...f, mensagem_convocacao: e.target.value }))} className={INPUT} />
      </label>
      <label className={LABEL}>
        Mensagem de fase final (opcional)
        <input value={form.mensagem_fase_final ?? ""} onChange={(e) => setForm((f) => ({ ...f, mensagem_fase_final: e.target.value }))} className={INPUT} />
      </label>
      <label className={LABEL}>
        Mensagem de derrota (opcional)
        <input value={form.mensagem_derrota ?? ""} onChange={(e) => setForm((f) => ({ ...f, mensagem_derrota: e.target.value }))} className={INPUT} />
      </label>

      <label className={LABEL}>
        IDs das zonas elegíveis pra descoberta (separados por vírgula — vazio = qualquer zona)
        <input
          value={(form.zonas ?? []).join(", ")}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              zonas: e.target.value
                .split(",")
                .map((v) => Number(v.trim()))
                .filter((v) => Number.isInteger(v) && v > 0),
            }))
          }
          className={INPUT}
        />
      </label>
    </div>
  );
}
