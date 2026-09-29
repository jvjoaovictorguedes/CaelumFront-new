"use client";

// Ameaça Mundial V2 §4.1/§3.2/§8.2/§13.2 — Atributos + Combate em Tempo
// Real + regras de reentrada. Agrupados numa aba só porque são todos
// campos numéricos simples do próprio WorldBossConfig (mesmo payload,
// nenhuma sub-entidade envolvida) — nunca duplicam nada calculado no
// backend, só editam os valores-fonte que o motor real usa.
import type { Dispatch, SetStateAction } from "react";
import type { PayloadWorldBossConfigAdmin } from "@/lib/api/admin";
import { INPUT, LABEL, CARD } from "./styles";

export default function WorldBossAttributesTab({
  form,
  setForm,
}: {
  form: PayloadWorldBossConfigAdmin;
  setForm: Dispatch<SetStateAction<PayloadWorldBossConfigAdmin>>;
}) {
  function num(campo: keyof PayloadWorldBossConfigAdmin) {
    return (form[campo] as number | undefined) ?? 0;
  }
  function setNum(campo: keyof PayloadWorldBossConfigAdmin, valor: number) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className={CARD}>
        <p className="mb-3 font-imFeel text-lg text-[#F3B43F]">Atributos</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className={LABEL}>
            Nível
            <input type="number" min={1} value={form.nivel ?? 1} onChange={(e) => setNum("nivel", Number(e.target.value))} className={INPUT} />
          </label>
          <label className={LABEL}>
            Força
            <input type="number" min={0} value={num("forca")} onChange={(e) => setNum("forca", Number(e.target.value))} className={INPUT} />
          </label>
          <label className={LABEL}>
            Vitalidade
            <input type="number" min={0} value={num("vitalidade")} onChange={(e) => setNum("vitalidade", Number(e.target.value))} className={INPUT} />
          </label>
          <label className={LABEL}>
            Agilidade
            <input type="number" min={0} value={num("agilidade")} onChange={(e) => setNum("agilidade", Number(e.target.value))} className={INPUT} />
          </label>
          <label className={LABEL}>
            Inteligência
            <input type="number" min={0} value={num("inteligencia")} onChange={(e) => setNum("inteligencia", Number(e.target.value))} className={INPUT} />
          </label>
          <label className={LABEL}>
            Velocidade
            <input type="number" min={0} value={num("velocidade")} onChange={(e) => setNum("velocidade", Number(e.target.value))} className={INPUT} />
          </label>
          <label className={LABEL}>
            Defesa
            <input type="number" min={0} value={form.defesa ?? 0} onChange={(e) => setNum("defesa", Number(e.target.value))} className={INPUT} />
          </label>
          <label className={LABEL}>
            Mana máxima
            <input type="number" min={0} value={num("mana_maxima")} onChange={(e) => setNum("mana_maxima", Number(e.target.value))} className={INPUT} />
          </label>
        </div>
      </div>

      <div className={CARD}>
        <p className="mb-1 font-imFeel text-lg text-[#F3B43F]">Combate em Tempo Real</p>
        <p className="mb-3 text-xs text-white/50">O relógio de ações do Boss roda sozinho — estes valores controlam o ritmo dele, não dependem de nenhum jogador agir.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label className={LABEL}>
            Intervalo entre ações (ms)
            <input type="number" min={1} value={form.intervalo_acao_ms ?? 3000} onChange={(e) => setNum("intervalo_acao_ms", Number(e.target.value))} className={INPUT} />
          </label>
          <label className={LABEL}>
            Regeneração de mana por ação
            <input type="number" min={0} value={num("regeneracao_mana_por_acao")} onChange={(e) => setNum("regeneracao_mana_por_acao", Number(e.target.value))} className={INPUT} />
          </label>
        </div>
      </div>

      <div className={CARD}>
        <p className="mb-1 font-imFeel text-lg text-[#F3B43F]">Reentrada (§8.2)</p>
        <p className="mb-3 text-xs text-white/50">Se um personagem for derrotado durante a raid, pode voltar a participar do mesmo evento?</p>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex items-center gap-2 text-sm text-white/80">
            <input type="checkbox" checked={form.reentrada_permitida ?? false} onChange={(e) => setForm((f) => ({ ...f, reentrada_permitida: e.target.checked }))} />
            Reentrada permitida
          </label>
          <label className={LABEL}>
            Cooldown de reentrada (segundos)
            <input
              type="number"
              min={0}
              disabled={!form.reentrada_permitida}
              value={form.cooldown_reentrada_segundos ?? 0}
              onChange={(e) => setNum("cooldown_reentrada_segundos", Number(e.target.value))}
              className={`${INPUT} max-w-[10rem] disabled:opacity-40`}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
