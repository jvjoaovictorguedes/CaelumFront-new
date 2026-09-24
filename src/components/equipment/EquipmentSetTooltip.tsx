import type { EquipmentSetSummary } from "@/types/equipmentSets";
import EquipmentSetBonusList from "./EquipmentSetBonusList";

// Nome do conjunto, peças equipadas/faltantes e thresholds — conteúdo
// do hover/expandido de um conjunto (§11.2). Peças faltantes ficam
// legíveis, só atenuadas (nunca escondidas — regra visual §11.3).
export default function EquipmentSetTooltip({ set }: { set: EquipmentSetSummary }) {
  return (
    <div className="w-56 rounded-md bg-black/95 p-3 text-white shadow-lg">
      <p className="mb-1 font-imFeel text-sm text-[#F3B43F]">{set.nome}</p>
      <p className="mb-2 text-[10px] text-white/60">
        {set.equippedPieces}/{set.totalPieces} peças equipadas
      </p>
      <ul className="mb-2 flex flex-col gap-0.5">
        {set.pieces.map((peca) => (
          <li
            key={peca.pieceKey}
            className={`text-[10px] ${peca.equipped ? "text-white" : "text-white/35"}`}
          >
            {peca.equipped ? "● " : "○ "}
            {peca.nome ?? peca.pieceKey}
          </li>
        ))}
      </ul>
      <EquipmentSetBonusList bonuses={set.bonuses} />
    </div>
  );
}
