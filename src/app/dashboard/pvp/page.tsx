import { getCurrentCharacter } from "@/utils/character-session";
import {
  buscarOponentesCasuais,
  buscarStatusCasual,
  type OponenteCasual,
  type PvpStatusCasual,
} from "@/lib/api/pvp";
import PvpClient from "./components/PvpClient";
import PageMusic from "@/components/music/PageMusic";

export default async function PvpPage() {
  const character = await getCurrentCharacter();

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <PageMusic slot="PAGE_PVP" />
        <div className="rounded-2xl border border-[#F3B43F]/30 bg-[#292018]/80 p-6 text-center text-white shadow-xl">
          <h1 className="font-imFeel text-4xl mb-4">Duelo</h1>
          <p className="text-lg text-white/80">
            Crie um personagem antes de entrar na arena.
          </p>
        </div>
      </div>
    );
  }

  // As duas chamadas já tratam erro internamente (lista vazia / null), a
  // página nunca quebra por causa de um endpoint fora do ar.
  const [oponentes, status]: [OponenteCasual[], PvpStatusCasual | null] = await Promise.all([
    buscarOponentesCasuais(character.id),
    buscarStatusCasual(character.id),
  ]);

  return (
    <>
      <PageMusic slot="PAGE_PVP" />
      <PvpClient
        character={{
          id: character.id,
          nome: character.nome,
          nivel: character.nivel,
          genero: character.genero,
          classe: character.Class?.nome,
        }}
        oponentesIniciais={oponentes}
        statusInicial={status}
      />
    </>
  );
}
