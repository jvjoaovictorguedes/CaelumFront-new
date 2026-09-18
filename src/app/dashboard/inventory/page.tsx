import { getCurrentCharacterId } from "@/utils/character-session";
import ConsumablesGrid from "./components/ConsumablesGrid";
import EquipmentCategoriesPanel from "./components/EquipmentCategoriesPanel";
import InventoryTabs from "./components/InventoryTabs";
import MaterialsGrid from "./components/MaterialsGrid";

export default async function InventoryPage() {
  const characterId = await getCurrentCharacterId();
  const characterIdNumber = characterId ? Number(characterId) : NaN;

  if (!characterId || !Number.isInteger(characterIdNumber)) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="font-imFeel text-4xl mb-4">Meu Inventário</h1>
        <p className="text-lg text-gray-700">
          Crie um personagem para começar a guardar itens.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-2 sm:p-4">
      <InventoryTabs
        equipamentos={<EquipmentCategoriesPanel characterId={characterIdNumber} />}
        materiais={<MaterialsGrid characterId={characterIdNumber} />}
        consumiveis={<ConsumablesGrid characterId={characterIdNumber} />}
      />
    </div>
  );
}
