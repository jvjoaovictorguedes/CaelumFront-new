"use client";
import { useEffect, useState } from "react";
import api from "@/utils/axiosIntance";
import type { Affinity } from "./types";
interface PowerProfile {
  nature: string;
  affinityMode: string;
  affinity: Affinity | null;
  addedAffinity: Affinity | null;
  addedDamagePct: number;
  imbueAffinity: Affinity | null;
  imbueDamagePct: number;
  imbueDurationTurns: number;
  familyBonuses: { family: string; damageBonusPct: number }[];
}
export default function PowerTypingDetails({ powerId }: { powerId: number }) {
  const [value, setValue] = useState<PowerProfile | null>(null);
  useEffect(() => {
    let active = true;
    api
      .get(`/combat-typing/powers/${powerId}`)
      .then((r) => {
        if (active) setValue(r.data.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [powerId]);
  if (!value) return null;
  return (
    <div className="text-xs">
      <p>
        {value.nature} —{" "}
        {value.affinityMode === "INHERIT_WEAPON"
          ? "Herda afinidade da arma"
          : (value.affinity?.nome ?? "Neutro")}
      </p>
      {value.addedAffinity && value.addedDamagePct > 0 && (
        <p>
          +{value.addedDamagePct}% como {value.addedAffinity.nome}
        </p>
      )}
      {value.imbueAffinity && value.imbueDurationTurns > 0 && (
        <p>
          Encanta a arma: +{value.imbueDamagePct}% {value.imbueAffinity.nome},{" "}
          {value.imbueDurationTurns} turnos
        </p>
      )}
      {value.familyBonuses.map((b, i) => (
        <p key={i}>
          +{b.damageBonusPct}% contra {b.family}
        </p>
      ))}
    </div>
  );
}
