import { getUserCookie } from "@/app/create/temp-character-data-action";
import { getCurrentCharacter } from "@/utils/character-session";
import { getRaceImage } from "@/utils/media-url";
import AbilitiesPanel from "./components/AbilitiesPanel";
import ChangePasswordForm from "./components/ChangePasswordForm";
import CharacterTabs from "./components/CharacterTabs";
import ClassEvolutionCard from "./components/ClassEvolutionCard";
import CombatLoadoutPanel from "./components/CombatLoadoutPanel";
import EquipmentPanel from "./components/EquipmentPanel";
import EquipmentPrivacyToggle from "./components/EquipmentPrivacyToggle";
import EvolutionsPanel from "./components/EvolutionsPanel";
import StatusPanel from "./components/StatusPanel";

export default async function CharacterPage() {
  const character = await getCurrentCharacter();
  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="font-imFeel text-4xl mb-4">
          Nenhum personagem encontrado
        </h1>
        <p className="text-lg text-gray-700">
          Crie um personagem para ver os detalhes dele aqui.
        </p>
      </div>
    );
  }

  const user = await getUserCookie();
  const imagemRaca = getRaceImage(
    character.genero === "Feminino"
      ? character.Race?.nome_feminino
      : character.Race?.nome_masculino,
    character.genero === "Feminino" ? "feminino" : "Masculino",
    character.Race?.imagem_masculina_url,
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-2 sm:p-4">
      <CharacterTabs
        equipamentos={
          <EquipmentPanel classe={character.Class?.nome} />
        }
        habilidades={<AbilitiesPanel characterId={character.id} />}
        status={
          <StatusPanel
            character={character}
            bonus={character.bonus_atributos}
            imagemPadrao={imagemRaca}
          />
        }
        classe={
          <div className="flex flex-col gap-4">
            <ClassEvolutionCard characterId={character.id} />
            <EvolutionsPanel characterId={character.id} />
          </div>
        }
        combate={<CombatLoadoutPanel characterId={character.id} />}
        informacoes={
          <div className="flex flex-col gap-4">
            <EquipmentPrivacyToggle characterId={character.id} />
            <ChangePasswordForm email={user?.email} />
          </div>
        }
      />
    </div>
  );
}
