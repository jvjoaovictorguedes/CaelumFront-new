import { getCurrentCharacter } from "@/utils/character-session";
import { getRaceImage } from "@/utils/media-url";

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
        <h1 className="font-imFeel text-4xl mb-4">
          Nenhum personagem encontrado
        </h1>
        <p className="text-lg text-gray-700">
          Crie um personagem para ver os detalhes dele aqui.
        </p>
      </div>
    );
  }

  const vidaMaximaCalculada = 30 + character.vitalidade * 6;
  const vidaMaxima = Math.max(
    character.vida_maxima ?? vidaMaximaCalculada,
    character.vida_atual,
  );
  const manaMaxima = 20 + character.inteligencia * 5;
  const experienciaAtual = character.experiencia ?? 0;
  const experienciaNivel = Math.max(100, character.nivel * 100);
  const experienciaPercentual = Math.min(
    100,
    (experienciaAtual / experienciaNivel) * 100,
  );
  const imagemRaca = getRaceImage(
    character.Race?.nome,
    character.genero === "feminino" ? "feminino" : "Masculino",
    character.Race?.imagem_masculina_url,
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-2 sm:p-4">
      <div className="flex flex-col gap-4 rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl sm:flex-row sm:items-center">
        <div
          className="h-32 w-32 shrink-0 self-center rounded-full border-4 border-[#F3B43F] bg-[#3a2f24] bg-cover bg-center sm:self-auto"
          style={{
            backgroundImage: imagemRaca ? `url(${imagemRaca})` : undefined,
          }}
        />
        <div className="min-w-0">
          <p className="text-sm uppercase tracking-widest text-[#F3B43F]">
            Herói de Caelum
          </p>
          <h1 className="truncate font-imFeel text-4xl sm:text-5xl">
            {character.nome}
          </h1>
          <p className="text-base text-white/70 sm:text-lg">
            Nível {character.nivel} ·{" "}
            {character.Race?.nome ?? "Raça desconhecida"} ·{" "}
            {character.Class?.nome ?? "Classe desconhecida"}
          </p>
          <div className="mt-3 max-w-xl">
            <div className="mb-1 flex justify-between text-sm font-bold">
              <span>Experiência</span>
              <span>
                {experienciaAtual} / {experienciaNivel}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-black/50">
              <div
                className="h-full bg-[#F3B43F]"
                style={{ width: `${experienciaPercentual}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid w-full gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white/50 p-4 shadow-lg">
          <div className="mb-2">
            <div className="flex justify-between text-sm font-bold mb-1">
              <span>Vida</span>
              <span>
                {character.vida_atual} / {vidaMaxima}
              </span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-black/20">
              <div
                className="h-full bg-red-600"
                style={{
                  width: `${Math.min(
                    100,
                    (character.vida_atual / vidaMaxima) * 100,
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
            <div className="h-4 w-full overflow-hidden rounded-full bg-black/20">
              <div
                className="h-full bg-blue-600"
                style={{
                  width: `${Math.min(
                    100,
                    (character.mana_atual / manaMaxima) * 100,
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-black/10 bg-white/50 p-4 shadow-lg sm:grid-cols-3">
          {ATRIBUTOS.map(({ label, campo }) => (
            <div
              key={campo}
              className="bg-[#F3B43F]/30 rounded-lg p-3 flex justify-between items-center"
            >
              <span className="font-imFeel text-xl">{label}</span>
              <span className="font-bold text-xl">{character[campo]}</span>
            </div>
          ))}
          <div className="col-span-2 flex items-center justify-between rounded-lg bg-[#F3B43F]/30 p-3 sm:col-span-1">
            <span className="font-imFeel text-xl">Pontos para distribuir</span>
            <span className="font-bold text-xl">
              {character.pontos_distribuir ?? 0}
            </span>
          </div>
        </div>
      </div>

      <div className="grid w-full grid-cols-3 gap-3 text-center">
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
