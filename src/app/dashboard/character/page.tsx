import { getCurrentCharacter } from "@/utils/character-session";

const ATRIBUTOS = [
  { label: "Força", campo: "forca" },
  { label: "Vitalidade", campo: "vitalidade" },
  { label: "Agilidade", campo: "agilidade" },
  { label: "Inteligência", campo: "inteligencia" },
  { label: "Velocidade", campo: "velocidade" },
] as const;

export default async function CharacterPage() {
  const character = await getCurrentCharacter();

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="font-imFeel text-4xl mb-4">Nenhum personagem encontrado</h1>
        <p className="text-lg text-gray-700">
          Crie um personagem para ver os detalhes dele aqui.
        </p>
      </div>
    );
  }

  const vidaMaxima = 30 + character.vitalidade * 6;
  const manaMaxima = 20 + character.inteligencia * 5;

  return (
    <div className="flex flex-col items-center h-full p-4">
      <h1 className="font-imFeel text-5xl mb-1">{character.nome}</h1>
      <p className="text-lg text-black/70 mb-6">
        Nível {character.nivel} · {character.Race?.nome ?? "Raça desconhecida"}{" "}
        · {character.Class?.nome ?? "Classe desconhecida"}
      </p>

      <div className="w-full max-w-md mb-6">
        <div className="mb-2">
          <div className="flex justify-between text-sm font-bold mb-1">
            <span>Vida</span>
            <span>
              {character.vida_atual} / {vidaMaxima}
            </span>
          </div>
          <div className="w-full h-4 bg-black/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-600"
              style={{
                width: `${Math.min(
                  100,
                  (character.vida_atual / vidaMaxima) * 100
                )}%`,
              }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm font-bold mb-1">
            <span>Mana</span>
            <span>
              {character.mana_atual} / {manaMaxima}
            </span>
          </div>
          <div className="w-full h-4 bg-black/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600"
              style={{
                width: `${Math.min(
                  100,
                  (character.mana_atual / manaMaxima) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-6">
        {ATRIBUTOS.map(({ label, campo }) => (
          <div
            key={campo}
            className="bg-[#F3B43F]/30 rounded-lg p-3 flex justify-between items-center"
          >
            <span className="font-imFeel text-xl">{label}</span>
            <span className="font-bold text-xl">{character[campo]}</span>
          </div>
        ))}
        <div className="bg-[#F3B43F]/30 rounded-lg p-3 flex justify-between items-center col-span-2">
          <span className="font-imFeel text-xl">Pontos para distribuir</span>
          <span className="font-bold text-xl">
            {character.pontos_distribuir ?? 0}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-md text-center">
        <div className="bg-black/10 rounded-lg p-2">
          <p className="text-sm text-black/60">Experiência</p>
          <p className="font-bold">{character.experiencia}</p>
        </div>
        <div className="bg-black/10 rounded-lg p-2">
          <p className="text-sm text-black/60">Moedas</p>
          <p className="font-bold">{character.dinheiro}</p>
        </div>
        <div className="bg-black/10 rounded-lg p-2">
          <p className="text-sm text-black/60">Rank</p>
          <p className="font-bold">{character.rank}</p>
        </div>
      </div>
    </div>
  );
}
