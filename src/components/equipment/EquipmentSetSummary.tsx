import type { EquipmentSetSummary as EquipmentSetSummaryType } from "@/types/equipmentSets";
import EquipmentSetTooltip from "./EquipmentSetTooltip";

// Lista compacta dos conjuntos presentes no loadout atual (§11.2). Não
// renderiza nada se o personagem não tiver nenhuma peça de conjunto
// equipada — não é uma seção fixa da tela.
export default function EquipmentSetSummary({ sets }: { sets: EquipmentSetSummaryType[] }) {
  if (sets.length === 0) return null;

  return (
    <div className="mb-4 flex flex-col gap-2">
      <p className="text-sm uppercase tracking-widest text-[#F3B43F]">Conjuntos</p>
      <div className="flex flex-wrap gap-2">
        {sets.map((set) => {
          const algumBonusAtivo = set.bonuses.some((b) => b.active);
          return (
            <div
              key={set.id}
              className={`group relative rounded-lg border px-3 py-2 text-xs ${
                algumBonusAtivo ? "border-[#F3B43F]/70 bg-[#3a2c14]/60" : "border-white/15 bg-[#292018]/60"
              }`}
            >
              <span className={algumBonusAtivo ? "font-bold text-[#F3B43F]" : "text-white/70"}>
                {set.nome}
              </span>{" "}
              <span className="text-white/50">
                {set.equippedPieces}/{set.totalPieces}
              </span>

              <div className="pointer-events-none absolute bottom-full left-0 z-30 mb-2 opacity-0 transition-opacity group-hover:opacity-100">
                <EquipmentSetTooltip set={set} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
