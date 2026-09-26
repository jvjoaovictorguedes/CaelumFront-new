import { getCurrentCharacter } from "@/utils/character-session";
import GuildsClient from "./components/GuildsClient";
import PageMusic from "@/components/music/PageMusic";

export default async function GuildsPage() {
  const character = await getCurrentCharacter();

  if (!character) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-white">
        <PageMusic slot="PAGE_GUILDS" />
        <h1 className="font-imFeel mb-4 text-4xl">Nenhum personagem encontrado</h1>
        <p className="text-lg text-white/70">
          Crie um personagem para acessar as guildas de Caelum.
        </p>
      </div>
    );
  }

  return (
    <>
      <PageMusic slot="PAGE_GUILDS" />
      <GuildsClient
        characterId={character.id}
        characterNome={character.nome}
        characterNivel={character.nivel}
        characterDinheiro={character.dinheiro ?? 0}
      />
    </>
  );
}
