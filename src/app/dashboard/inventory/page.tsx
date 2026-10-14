import { getCurrentCharacter } from "@/utils/character-session";
import ConsumablesGrid from "./components/ConsumablesGrid";
import EquipmentCategoriesPanel from "./components/EquipmentCategoriesPanel";
import InventoryTabs from "./components/InventoryTabs";
import MaterialsGrid from "./components/MaterialsGrid";
import PageMusic from "@/components/music/PageMusic";

export default async function InventoryPage() {
  // getCurrentCharacter() confere com o backend via /characters/me
  // (JWT), igual a toda outra página do dashboard — nunca mais o cookie
  // characterId sozinho, que é só um indicador de UI (ver comentário em
  // character-session.ts) e podia expirar/faltar com o login ainda
  // válido, mostrando "crie um personagem" pra quem já tinha um (bug
  // real reportado: Inventário pedindo personagem com o resto do
  // dashboard funcionando normalmente).
  const character = await getCurrentCharacter();

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <PageMusic slot="PAGE_INVENTORY" />
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
      <PageMusic slot="PAGE_INVENTORY" />
      <InventoryTabs
        equipamentos={<EquipmentCategoriesPanel />}
        materiais={<MaterialsGrid characterId={character.id} />}
        consumiveis={<ConsumablesGrid characterId={character.id} />}
      />
    </div>
  );
}
