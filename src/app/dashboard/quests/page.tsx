import { getCurrentCharacter } from "@/utils/character-session";
import RankGatePanel from "./components/RankGatePanel";

export default async function QuestsPage() {
  const character = await getCurrentCharacter();

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <h1 className="font-imFeel text-5xl mb-4">Missões</h1>
        <p className="text-lg text-black/70 max-w-md">
          Crie um personagem para ver as missões disponíveis.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-2 sm:p-4">
      <h1 className="font-imFeel text-4xl sm:text-5xl text-center">Missões</h1>
      <RankGatePanel characterId={character.id} />
      <p className="rounded-xl border border-white/10 bg-[#292018]/80 p-3 text-center text-sm text-white/70">
        Sua guilda tem seu próprio Portal de Ranque — veja na aba &quot;Portal&quot; da sua guilda.
      </p>
    </div>
  );
}
