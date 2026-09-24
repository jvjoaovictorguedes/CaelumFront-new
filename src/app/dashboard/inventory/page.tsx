import { getCurrentCharacterId } from "@/utils/character-session";
import ConsumablesGrid from "./components/ConsumablesGrid";
import EquipmentCategoriesPanel from "./components/EquipmentCategoriesPanel";
import InventoryTabs from "./components/InventoryTabs";
import MaterialsGrid from "./components/MaterialsGrid";
import PageMusic from "@/components/music/PageMusic";
import { MUSIC } from "@/constants/music";

export default async function InventoryPage() {
  const characterId = await getCurrentCharacterId();
  const characterIdNumber = characterId ? Number(characterId) : NaN;

  if (!characterId || !Number.isInteger(characterIdNumber)) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <PageMusic track={MUSIC.AVENTUREIRO} />
        <div className="rounded-2xl border border-[#F3B43F]/30 bg-[#292018]/80 p-6 text-center text-white shadow-xl">
          <h1 className="font-imFeel text-4xl mb-4">Meu Inventário</h1>
          <p className="text-lg text-white/80">
            Crie um personagem para começar a guardar itens.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-2 sm:p-4">
      <PageMusic track={MUSIC.AVENTUREIRO} />
      <InventoryTabs
        equipamentos={<EquipmentCategoriesPanel />}
        materiais={<MaterialsGrid characterId={characterIdNumber} />}
        consumiveis={<ConsumablesGrid characterId={characterIdNumber} />}
      />
    </div>
  );
}
