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
import RedeemCodeForm from "./components/RedeemCodeForm";
import StatusPanel from "./components/StatusPanel";
import PageMusic from "@/components/music/PageMusic";

export default async function CharacterPage() {
  const character = await getCurrentCharacter();
  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="rounded-2xl border border-[#F3B43F]/30 bg-[#292018]/80 p-6 text-center text-white shadow-xl">
          <h1 className="font-imFeel text-4xl mb-4">
            Nenhum personagem encontrado
          </h1>
          <p className="text-lg text-white/80">
            Crie um personagem para ver os detalhes dele aqui.
          </p>
        </div>
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
      <PageMusic slot="PAGE_CHARACTER" />
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
            <RedeemCodeForm characterId={character.id} />
            <ChangePasswordForm email={user?.email} />
          </div>
        }
      />
    </div>
  );
}
