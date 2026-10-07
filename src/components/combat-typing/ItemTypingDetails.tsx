"use client";
import { useEffect, useState } from "react";
import api from "@/utils/axiosIntance";
import type { Affinity, TypingPreview, DefensiveAffinity } from "./types";
interface ItemProfile {
  weapon: TypingPreview | null;
  affinity: Affinity | null;
  nativeElement: Affinity | null;
  modifiers: { affinity: Affinity; receivedDamagePct: number }[];
  familyBonuses: { family: { nome: string } | null; damageBonusPct: number }[];
}
export default function ItemTypingDetails({
  itemId,
  compare = false,
}: {
  itemId: number;
  compare?: boolean;
}) {
  const [value, setValue] = useState<ItemProfile | null>(null),
    [deltas, setDeltas] = useState<
      (DefensiveAffinity & { delta: number; beforeMultiplier: number })[] | null
    >(null);
  useEffect(() => {
    let active = true;
    api
      .get(`/combat-typing/items/${itemId}`)
      .then((r) => {
        if (active) setValue(r.data.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [itemId]);
  if (!value) return null;
  return (
    <div className="space-y-1 text-xs">
      <p>
        {value.weapon?.type?.nome}{" "}
        {value.weapon &&
          `— ${value.weapon.nature} — ${value.affinity?.nome ?? "Neutro"}`}
      </p>
      {value.nativeElement && Number(value.weapon?.elementalPct) > 0 && (
        <p>
          +{value.weapon?.elementalPct}% como {value.nativeElement.nome}
        </p>
      )}
      {value.familyBonuses.map((b, i) => (
        <p key={i}>
          +{b.damageBonusPct}% contra {b.family?.nome}
        </p>
      ))}
      {value.modifiers.map((m) => (
        <p key={m.affinity.id}>
          {m.affinity.nome}: recebe {Math.abs(m.receivedDamagePct)}%{" "}
          {m.receivedDamagePct < 0 ? "menos" : "mais"} dano
        </p>
      ))}
      {compare && (
        <button
          type="button"
          className="underline"
          onClick={() => {
            api
              .get(`/combat-typing/items/${itemId}/compare`)
              .then((r) => setDeltas(r.data.data.affinities))
              .catch(() => {});
          }}
        >
          Comparar resistências ao equipar
        </button>
      )}
      {deltas?.map((a) => (
        <p key={a.id}>
          {a.nome}: {a.beforeMultiplier.toFixed(2)}x → {a.multiplier.toFixed(2)}
          x{" "}
          {a.delta < 0
            ? "(menos dano recebido)"
            : a.delta > 0
              ? "(mais dano recebido)"
              : "(sem alteração)"}
        </p>
      ))}
    </div>
  );
}
