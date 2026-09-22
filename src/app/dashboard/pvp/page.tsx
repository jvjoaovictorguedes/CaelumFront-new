import { getCurrentCharacter } from "@/utils/character-session";
import {
  buscarOponentesCasuais,
  buscarStatusCasual,
  type OponenteCasual,
  type PvpStatusCasual,
} from "@/lib/api/pvp";
import PvpClient from "./components/PvpClient";

export default async function PvpPage() {
  const character = await getCurrentCharacter();

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="font-imFeel text-4xl mb-4">Duelo</h1>
        <p className="text-lg text-gray-700">
          Crie um personagem antes de entrar na arena.
        </p>
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
  );
}
