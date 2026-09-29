"use client";

import type { AdventureMonsterDetailApi } from "@/lib/api/admin";

// Especificação v3 §7.2 — card de Poder no editor. Só EXIBE o que o
// backend calculou (GET /admin/adventure/monsters/:id); nunca
// recalcula a fórmula aqui (§9 instrução 3/4).
export function CombatPowerCard({ combatPower, onSimular }: { combatPower: AdventureMonsterDetailApi["combat_power"]; onSimular: () => void }) {
  return (
    <section className="flex flex-col gap-2 rounded-xl border border-[#F3B43F]/40 bg-black/30 p-3">
      <p className="text-xs font-bold uppercase text-[#F3B43F]">Poder de Combate</p>
      <p className="font-imFeel text-3xl text-white">{combatPower.combatPower}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-white/60">
        {combatPower.danoMedio != null && <p>Dano médio: {combatPower.danoMedio.toFixed(1)}</p>}
        <p>EHP: {Math.round(combatPower.ehp)}</p>
        {combatPower.mitigacao != null && <p>Mitigação: {(combatPower.mitigacao * 100).toFixed(1)}%</p>}
        <p>Versão da fórmula: {combatPower.version}</p>
      </div>
      <button type="button" onClick={onSimular} className="mt-1 self-start rounded-lg border border-[#F3B43F]/40 px-3 py-1.5 text-xs font-bold text-[#F3B43F] hover:bg-[#F3B43F]/10">
        Simular este monstro
      </button>
    </section>
  );
}
