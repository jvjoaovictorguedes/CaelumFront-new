import type { DefensiveAffinity, DamageResolution } from "./types";
export function ResistanceList({ values }: { values?: DefensiveAffinity[] }) {
  if (!values?.length) return null;
  return (
    <section className="space-y-2 rounded border border-amber-900/50 p-3">
      <h3 className="font-semibold text-amber-300">
        Resistências e vulnerabilidades
      </h3>
      <p className="text-xs opacity-70">
        Efetividade do ataque recebido. Valores neutros não alteram o dano.
      </p>
      <div className="grid grid-cols-2 gap-2">
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
    <details className="rounded border border-amber-900/50 p-2">
      <summary>Detalhes do dano: {value.totalDamage}</summary>
      {value.components.map((c, i) => (
        <p key={i}>
          {c.affinity?.nome ?? c.nature}: {c.finalDamage}{" "}
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
