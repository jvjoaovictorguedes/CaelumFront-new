import { getCurrentCharacter } from "@/utils/character-session";
import { getRaceImage } from "@/utils/media-url";
import AbilitiesPanel from "./components/AbilitiesPanel";
import CharacterAttributes from "./components/CharacterAttributes";
import CharacterTabs from "./components/CharacterTabs";
import EquipmentPanel from "./components/EquipmentPanel";
import EvolutionsPanel from "./components/EvolutionsPanel";
import GenderToggleButton from "./components/GenderToggleButton";
import VidaManaCard from "./components/VidaManaCard";

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

  const bonus = character.bonus_atributos;
  const experienciaAtual = character.experiencia ?? 0;
  const experienciaNivel = Math.max(100, character.nivel * 100);
  const experienciaPercentual = Math.min(
    100,
    (experienciaAtual / experienciaNivel) * 100,
  );
  const imagemRaca = getRaceImage(
    character.Race?.nome,
    character.genero === "Feminino" ? "feminino" : "Masculino",
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
          <p className="flex flex-wrap items-center gap-x-1 text-base text-white/70 sm:text-lg">
            <span>
              Nível {character.nivel} ·{" "}
              {character.genero === "Feminino"
                ? character.Race?.nome_feminino
                : character.Race?.nome_masculino}
            </span>
            <GenderToggleButton characterId={character.id} generoAtual={character.genero} />
            <span>· {character.Class?.nome ?? "Classe desconhecida"}</span>
            {character.natureza_magica && (
              <span>· Natureza: {character.natureza_magica}</span>
            )}
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

      <VidaManaCard characterInicial={character} />

      <CharacterTabs
        equipamentos={
          <EquipmentPanel characterId={character.id} classe={character.Class?.nome} />
        }
        habilidades={<AbilitiesPanel characterId={character.id} />}
        evolucoes={<EvolutionsPanel characterId={character.id} />}
        atributos={
          <div className="flex flex-col gap-4">
            <CharacterAttributes character={character} bonus={bonus} />

            <div className="grid w-full grid-cols-2 gap-3 text-center sm:grid-cols-4">
              <div className="bg-white/40 rounded-lg p-2">
                <p className="text-sm text-black/80">Experiência</p>
                <p className="font-bold">{character.experiencia}</p>
              </div>
              <div className="bg-white/40 rounded-lg p-2">
                <p className="text-sm text-black/80">Moedas</p>
                <p className="font-bold">{character.dinheiro}</p>
              </div>
              <div className="bg-white/40 rounded-lg p-2">
                <p className="text-sm text-black/80">Rank</p>
                <p className="font-bold">{character.rank}</p>
              </div>
              <div className="bg-white/40 rounded-lg p-2">
                <p className="text-sm text-black/80">Guilda</p>
                <p className="font-bold">
                  {character.guilda ? character.guilda.sigla : "Nenhuma"}
                </p>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}
