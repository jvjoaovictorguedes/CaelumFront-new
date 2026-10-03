"use client";

// Habilidades V2.0 (doc "Habilidades V2.0" §7/§17) — Fase 4. Painel de
// PowerCombatEffect dentro do detalhe de uma Power no Admin — mesmo
// padrão visual/UX do painel de "Efeitos de status aplicados" logo
// acima, mas formulário contextual: os <select> vêm do catálogo
// publicado pelo backend (combatEffectCatalog), nunca hardcoded aqui —
// efeito inválido falha fechado no backend (§27), este painel só
// facilita escolher entre o que o motor de verdade interpreta.
import { useEffect, useState } from "react";
import {
  adicionarCombatEffectPowerAdmin,
  atualizarCombatEffectPowerAdmin,
  catalogoCombatEffectsAdmin,
  listarCombatEffectsPowerAdmin,
  mensagemDeErroAdmin,
  removerCombatEffectPowerAdmin,
  type CombatEffectCatalogApi,
  type PayloadCombatEffectAdmin,
  type PowerCombatEffectApi,
} from "@/lib/api/admin";

const ATRIBUTOS = ["Forca", "Vitalidade", "Agilidade", "Inteligencia", "Velocidade"] as const;

export default function PowerCombatEffectsPanel({ idPower }: { idPower: number }) {
  const [catalogo, setCatalogo] = useState<CombatEffectCatalogApi | null>(null);
  const [efeitos, setEfeitos] = useState<PowerCombatEffectApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [adicionando, setAdicionando] = useState(false);

  const [effectKey, setEffectKey] = useState("");
  const [target, setTarget] = useState("SELF");
  const [trigger, setTrigger] = useState("PASSIVE");
  const [magnitudeBase, setMagnitudeBase] = useState(0);
  const [scaleAttribute, setScaleAttribute] = useState("");
  const [scaleValue, setScaleValue] = useState(0);
  const [stackGroup, setStackGroup] = useState("");
  const [reapplyPolicy, setReapplyPolicy] = useState("STRONGEST");

  async function carregar() {
    try {
      const [cat, lista] = await Promise.all([catalogoCombatEffectsAdmin(), listarCombatEffectsPowerAdmin(idPower)]);
      setCatalogo(cat);
      setEfeitos(lista);
      if (!effectKey && cat.effectKeys[0]) setEffectKey(cat.effectKeys[0].key);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar os efeitos de combate."));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idPower]);

  async function adicionar(evento: React.FormEvent) {
    evento.preventDefault();
    setAdicionando(true);
    setErro("");
    try {
      const payload: PayloadCombatEffectAdmin = {
        effect_key: effectKey,
        target,
        trigger,
        magnitude_base: magnitudeBase,
        scale_attribute: (scaleAttribute || null) as PayloadCombatEffectAdmin["scale_attribute"],
        scale_value: scaleValue,
        stack_group: stackGroup || null,
        reapply_policy: reapplyPolicy,
      };
      await adicionarCombatEffectPowerAdmin(idPower, payload);
      setMagnitudeBase(0);
      setScaleAttribute("");
      setScaleValue(0);
      setStackGroup("");
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível adicionar o efeito de combate."));
    } finally {
      setAdicionando(false);
    }
  }

  async function alternarAtivo(id: number, ativo: boolean) {
    setErro("");
    try {
      await atualizarCombatEffectPowerAdmin(id, { ativo });
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível atualizar o efeito."));
    }
  }

  async function remover(id: number) {
    setErro("");
    try {
      await removerCombatEffectPowerAdmin(id);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível remover o efeito."));
    }
  }

  if (carregando) {
    return <p className="text-xs text-white/50">Carregando efeitos de combate...</p>;
  }
  if (!catalogo) {
    return <p className="text-xs text-red-400">{erro || "Catálogo de efeitos de combate indisponível."}</p>;
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-white/10 p-3">
      <p className="text-xs font-bold uppercase text-[#F3B43F]/80">
        Efeitos de combate (buffs/debuffs, escudo, regen, crítico, cura, Mana...)
      </p>
      {erro && <p className="text-xs text-red-400">{erro}</p>}

      {efeitos.map((efeito) => {
        const meta = catalogo.effectKeys.find((e) => e.key === efeito.effect_key);
        return (
          <div key={efeito.id} className="flex items-center justify-between rounded-lg bg-black/20 px-2 py-1 text-sm">
            <span className={efeito.ativo ? "" : "text-white/40"}>
              {meta?.label ?? efeito.effect_key} ({meta?.unidade}) · {efeito.target} · {efeito.trigger} · magnitude {efeito.magnitude_base}
              {efeito.scale_attribute ? ` +${efeito.scale_value}/pt de ${efeito.scale_attribute}` : ""}
              {efeito.stack_group ? ` · grupo "${efeito.stack_group}" (${efeito.reapply_policy})` : ""}
            </span>
            <div className="flex gap-2 text-xs">
              <button type="button" onClick={() => alternarAtivo(efeito.id, !efeito.ativo)} className="text-white/70 hover:underline">
                {efeito.ativo ? "Desativar" : "Ativar"}
              </button>
              <button type="button" onClick={() => remover(efeito.id)} className="text-red-400 hover:underline">
                Remover
              </button>
            </div>
          </div>
        );
      })}

      <form onSubmit={adicionar} className="flex flex-col gap-2 pt-1">
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-[10px] text-white/60">
            Efeito
            <select value={effectKey} onChange={(e) => setEffectKey(e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm">
              {catalogo.effectKeys.map((e) => (
                <option key={e.key} value={e.key}>
                  {e.label} ({e.unidade})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[10px] text-white/60">
            Alvo
            <select value={target} onChange={(e) => setTarget(e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm">
              {catalogo.targets.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[10px] text-white/60">
            Gatilho
            <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm">
              {catalogo.triggers.map((t) => (
                <option key={t.key} value={t.key} title={t.descricao}>
                  {t.key}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[10px] text-white/60">
            Magnitude base
            <input
              type="number"
              step="0.1"
              value={magnitudeBase}
              onChange={(e) => setMagnitudeBase(Number(e.target.value))}
              className="w-24 rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-[10px] text-white/60">
            Escala por atributo
            <select value={scaleAttribute} onChange={(e) => setScaleAttribute(e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm">
              <option value="">Sem escala</option>
              {ATRIBUTOS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[10px] text-white/60">
            Valor por ponto
            <input
              type="number"
              step="0.01"
              value={scaleValue}
              onChange={(e) => setScaleValue(Number(e.target.value))}
              className="w-24 rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-[10px] text-white/60">
            Grupo de stack (opcional)
            <input
              type="text"
              value={stackGroup}
              onChange={(e) => setStackGroup(e.target.value)}
              placeholder="ex.: OFFENSE_CRITICAL"
              className="w-40 rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-[10px] text-white/60">
            Política de reaplicação
            <select value={reapplyPolicy} onChange={(e) => setReapplyPolicy(e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm">
              {catalogo.reapplyPolicies.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={adicionando} className="rounded-lg bg-[#BC8418] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
            + Efeito de combate
          </button>
        </div>
      </form>
    </div>
  );
}
