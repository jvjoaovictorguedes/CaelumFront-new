import type { EquipmentSetBonusSummary } from "@/types/equipmentSets";

// Renderiza os thresholds do conjunto (2/6, 4/6, 6/6, ...) com estado
// ativo/inativo. Nunca decide ativação aqui — só formata o que o
// backend já resolveu (equipmentSetService). Ativo/inativo nunca depende
// só de cor (regra visual §11.3): usa também um marcador de texto/ícone.
export default function EquipmentSetBonusList({ bonuses }: { bonuses: EquipmentSetBonusSummary[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {bonuses.map((bonus) => (
        <li
          key={bonus.piecesRequired}
          className={`flex items-start gap-2 text-xs ${bonus.active ? "text-[#F3B43F]" : "text-white/40"}`}
        >
          <span className="mt-0.5 shrink-0" aria-hidden="true">
            {bonus.active ? "✓" : "○"}
          </span>
          <span>
            <span className="font-bold">{bonus.piecesRequired} peças</span>
            {bonus.descricao ? `: ${bonus.descricao}` : ""}
            {!bonus.descricao && bonus.effectKey ? `: ${bonus.effectKey}` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}
