"use client";

// Ameaça Mundial V2 §5.1/§13.3 — editor de Fases: modelo híbrido dano
// min/max + Fúria por fase, telegraph/alerta, cast/intervalo próprios
// (opcionais, caem pro valor global de WorldBossAttributesTab quando em
// branco) e mana ao entrar na fase. "Habilidades permitidas" por fase é
// editado na aba Habilidades (fases_permitidas mora na WorldBossAbility,
// não na fase) — aqui só um resumo de quantas habilidades cada fase
// libera, pra não duplicar o dado em dois lugares.
import type { Dispatch, SetStateAction } from "react";
import type { PayloadWorldBossConfigAdmin, WorldBossAbilityApi, WorldBossPhaseApi } from "@/lib/api/admin";
import { BTN_DANGER, CARD, INPUT_XS, LABEL_XS } from "./styles";

export default function WorldBossPhasesTab({
  form,
  setForm,
  habilidades,
}: {
  form: PayloadWorldBossConfigAdmin;
  setForm: Dispatch<SetStateAction<PayloadWorldBossConfigAdmin>>;
  habilidades: WorldBossAbilityApi[];
}) {
  const fases = form.fases ?? [];

  function atualizar(index: number, patch: Partial<WorldBossPhaseApi>) {
    setForm((f) => ({ ...f, fases: (f.fases ?? []).map((fase, i) => (i === index ? { ...fase, ...patch } : fase)) }));
  }
  function adicionar() {
    setForm((f) => ({
      ...f,
      fases: [...(f.fases ?? []), { ordem: (f.fases?.length ?? 0) + 1, nome_fase: "", hp_percentual_max: 50, dano_min: 0, dano_max: 0 }],
    }));
  }
  function remover(index: number) {
    setForm((f) => ({ ...f, fases: (f.fases ?? []).filter((_, i) => i !== index) }));
  }

  function habilidadesDaFase(fase: WorldBossPhaseApi): number {
    if (!fase.id) return habilidades.filter((h) => !h.fases_permitidas).length;
    return habilidades.filter((h) => !h.fases_permitidas || h.fases_permitidas.includes(fase.id!)).length;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/50">Fases avaliadas pelo % de HP restante do Boss, na ordem cadastrada. A última fase cadastrada (menor HP%) costuma ser a mais dura.</p>
        <button type="button" onClick={adicionar} className="shrink-0 text-xs text-[#F3B43F] hover:underline">+ Adicionar fase</button>
      </div>

      {fases.length === 0 && <p className="text-sm text-white/50">Nenhuma fase cadastrada ainda.</p>}

      {fases.map((fase, i) => (
        <div key={i} className={`${CARD} !p-4`}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold text-[#F3B43F]">Fase {fase.ordem || i + 1}{fase.nome_fase ? ` — ${fase.nome_fase}` : ""}</p>
            <button type="button" onClick={() => remover(i)} className={BTN_DANGER}>Remover</button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <label className={LABEL_XS}>
              Ordem
              <input type="number" min={1} value={fase.ordem} onChange={(e) => atualizar(i, { ordem: Number(e.target.value) })} className={INPUT_XS} />
            </label>
            <label className={`${LABEL_XS} sm:col-span-2`}>
              Nome
              <input value={fase.nome_fase} onChange={(e) => atualizar(i, { nome_fase: e.target.value })} className={INPUT_XS} />
            </label>
            <label className={LABEL_XS}>
              HP% até (entra nesta fase quando HP cair até aqui)
              <input type="number" min={1} max={100} value={fase.hp_percentual_max} onChange={(e) => atualizar(i, { hp_percentual_max: Number(e.target.value) })} className={INPUT_XS} />
            </label>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <label className={LABEL_XS}>
              Dano mínimo
              <input type="number" min={0} value={fase.dano_min ?? 0} onChange={(e) => atualizar(i, { dano_min: Number(e.target.value) })} className={INPUT_XS} />
            </label>
            <label className={LABEL_XS}>
              Dano máximo
              <input type="number" min={0} value={fase.dano_max ?? 0} onChange={(e) => atualizar(i, { dano_max: Number(e.target.value) })} className={INPUT_XS} />
            </label>
            <label className={LABEL_XS}>
              Modificador de dano (%)
              <input type="number" value={fase.modificador_dano_percentual ?? 0} onChange={(e) => atualizar(i, { modificador_dano_percentual: Number(e.target.value) })} className={INPUT_XS} />
            </label>
            <label className={LABEL_XS}>
              Mana ao entrar na fase (vazio = mantém)
              <input
                type="number"
                min={0}
                placeholder="—"
                value={fase.mana_ao_entrar ?? ""}
                onChange={(e) => atualizar(i, { mana_ao_entrar: e.target.value === "" ? null : Number(e.target.value) })}
                className={INPUT_XS}
              />
            </label>
          </div>

          <p className="mb-1 mt-3 text-[10px] font-bold uppercase text-white/50">Fúria (escala o dano conforme o número de ações do Boss nesta fase)</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <label className={LABEL_XS}>
              Fúria por ação (%)
              <input type="number" min={0} step="0.1" value={fase.furia_por_acao_pct ?? 0} onChange={(e) => atualizar(i, { furia_por_acao_pct: Number(e.target.value) })} className={INPUT_XS} />
            </label>
            <label className={LABEL_XS}>
              Limite de Fúria (%, vazio = sem limite)
              <input
                type="number"
                min={0}
                placeholder="Sem limite"
                value={fase.limite_furia_pct ?? ""}
                onChange={(e) => atualizar(i, { limite_furia_pct: e.target.value === "" ? null : Number(e.target.value) })}
                className={INPUT_XS}
              />
            </label>
            <label className={LABEL_XS}>
              Intervalo de ação nesta fase (ms, vazio = usa o global)
              <input
                type="number"
                min={1}
                placeholder="Global"
                value={fase.intervalo_acao_ms ?? ""}
                onChange={(e) => atualizar(i, { intervalo_acao_ms: e.target.value === "" ? null : Number(e.target.value) })}
                className={INPUT_XS}
              />
            </label>
          </div>

          <div className="mt-3">
            <label className={LABEL_XS}>
              Texto de alerta ao entrar na fase (opcional)
              <input value={fase.texto_alerta ?? ""} onChange={(e) => atualizar(i, { texto_alerta: e.target.value })} className={INPUT_XS} />
            </label>
          </div>

          <p className="mt-2 text-[11px] text-white/40">
            {habilidadesDaFase(fase)} de {habilidades.length} habilidade(s) elegíveis nesta fase — edite quais na aba Habilidades.
          </p>
        </div>
      ))}
    </div>
  );
}
