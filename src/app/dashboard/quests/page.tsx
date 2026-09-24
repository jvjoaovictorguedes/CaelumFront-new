import { getCurrentCharacter } from "@/utils/character-session";
import AdventureGuildPanel from "./components/AdventureGuildPanel";
import PageMusic from "@/components/music/PageMusic";
import { MUSIC } from "@/constants/music";

export default async function QuestsPage() {
  const character = await getCurrentCharacter();

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <PageMusic track={MUSIC.GUILDA} />
        <h1 className="font-imFeel text-5xl mb-4">Guilda dos Aventureiros</h1>
        <p className="text-lg text-black/70 max-w-md">
          Crie um personagem para ver os contratos disponíveis.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-2 sm:p-4">
      <PageMusic track={MUSIC.GUILDA} />
      <h1 className="font-imFeel text-4xl sm:text-5xl text-center">Guilda dos Aventureiros</h1>
      <AdventureGuildPanel />
    </div>
  );
}
