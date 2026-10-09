"use client";
import { useEffect, useState } from "react";
import api from "@/utils/axiosIntance";
import type { Affinity } from "./types";
import { damageNatureLabel } from "@/types/contracts/combatTyping";
interface PowerProfile {
  nature: string;
  affinityMode: string;
  affinity: Affinity | null;
  addedAffinity: Affinity | null;
  addedDamagePct: number;
  imbueAffinity: Affinity | null;
  imbueDamagePct: number;
  imbueDurationTurns: number;
  // Rebalanceamento de Powers §30 — "pode causar X" (nomeUi de cada
  // PowerStatusEffect.status_key ativo desta Power).
  statusPossiveis: string[];
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
  // §4 — Guerreiro elemental NUNCA "virou mágico": INHERIT_WEAPON +
  // afinidade adicional é "Físico + Fogo" (soma), nunca "Físico —
  // Fogo" (troca). affinity_mode EXPLICIT (Mago) continua "Mágico •
  // Fogo" (a afinidade É o dano, não um adicional).
  const tipoDano = damageNatureLabel(value.nature);
  const temAfinidadeAdicional = value.addedAffinity && value.addedDamagePct > 0;
  // "Nenhum" (Escudo de Mana, Renascer Místico, etc.) é puramente
  // utilitário — nunca mostra "Tipo de dano: Nenhum" pro jogador.
  const mostrarLinhaDeTipo = value.nature !== "Nenhum" || temAfinidadeAdicional;
  return (
    <div className="text-xs">
      {mostrarLinhaDeTipo && (
        <p>
          {tipoDano}
          {temAfinidadeAdicional
            ? ` + ${value.addedAffinity!.nome}`
            : value.affinityMode === "EXPLICIT" && value.affinity
              ? ` • ${value.affinity.nome}`
              : ""}
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
      {value.statusPossiveis.length > 0 && (
        <p className="font-bold text-[#F3B43F]">
          Pode causar {value.statusPossiveis.join(", ")}
        </p>
      )}
    </div>
  );
}
