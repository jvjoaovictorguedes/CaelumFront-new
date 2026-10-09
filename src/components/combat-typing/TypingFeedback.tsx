import type { DefensiveAffinity, DamageResolution } from "./types";
import { damageNatureLabel } from "@/types/contracts/combatTyping";
export function ResistanceList({ values }: { values?: DefensiveAffinity[] }) {
  if (!values?.length) return null;
  return (
    <section className="space-y-2 rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-3">
      <h3 className="font-imFeel text-lg text-[#F3B43F]">
        Resistências e vulnerabilidades
      </h3>
      <p className="text-xs opacity-70">
        Efetividade do ataque recebido. Valores neutros não alteram o dano.
      </p>
      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        {values.map((a) => (
          <div
            key={a.id}
            title={`Você recebe ${(a.multiplier * 100).toFixed(1)}% do dano neutro de ${a.nome}.`}
          >
            <span>{a.nome}</span>: <strong>{a.effectivenessLabel}</strong>
            <small className="ml-2">{a.multiplier.toFixed(2)}x</small>
          </div>
        ))}
      </div>
    </section>
  );
}
export function DamageBreakdown({
  value,
}: {
  value?: DamageResolution | null;
}) {
  if (!value) return null;
  return (
    <details className="rounded-lg border border-[#F3B43F]/30 bg-black/20 p-3 text-sm">
      <summary className="cursor-pointer text-[#F3B43F]">
        Detalhes do dano: {value.totalDamage}
      </summary>
      {value.components.map((c, i) => (
        <p key={i}>
          {c.affinity?.nome ?? damageNatureLabel(c.nature)}: {c.finalDamage}{" "}
          {c.effectivenessLabel && (
            <strong>
              {" "}
              — {c.effectivenessLabel} ({c.affinityMultiplier.toFixed(2)}x)
            </strong>
          )}
          {c.familyBonusPct > 0 &&
            ` +${c.familyBonusPct}% contra ${value.defenderFamily?.nome ?? "família"}`}
        </p>
      ))}
    </details>
  );
}
