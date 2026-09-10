import axiosInstance from "@/utils/axiosIntance";
import { getCurrentCharacter } from "@/utils/character-session";
import CombatArena from "./components/CombatArena";

export default async function AdventurePage() {
  const character = await getCurrentCharacter();

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="font-imFeel text-4xl mb-4">Aventura</h1>
        <p className="text-lg text-gray-700">
          Crie um personagem antes de partir para o combate.
        </p>
      </div>
    );
  }

  if (character.vida_atual <= 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="font-imFeel text-4xl mb-4">Aventura</h1>
        <p className="text-lg text-gray-700">
          Seu personagem está derrotado e precisa se recuperar antes de
          enfrentar outro inimigo.
        </p>
      </div>
    );
  }

  interface HabilidadeApi {
    id: number;
    is_active: boolean;
    Power: {
      id: number;
      nome: string;
      descricao: string;
      tipo_poder: string;
      custo_mana: number;
      dano_base: number;
      cura_base: number;
    };
  }

  interface HabilidadesResponse {
    data?: {
      characterAbilities?: HabilidadeApi[];
    };
  }

  interface InimigoApi {
    nome: string;
    nivel: number;
    vida_atual: number;
    vida_maxima: number;
    forca: number;
    vitalidade: number;
    agilidade: number;
    velocidade: number;
    dano_base: number;
  }

  interface InimigoResponse {
    data?: {
      enemy?: InimigoApi;
    };
  }

  let habilidades: HabilidadeApi[] = [];
  try {
    const response = await axiosInstance.get<HabilidadesResponse>(
      "/character-abilities",
      { params: { characterId: character.id } },
    );
    habilidades = (response.data?.data?.characterAbilities ?? []).filter(
      (habilidade: HabilidadeApi) =>
        habilidade.is_active && habilidade.Power?.tipo_poder === "Ativo",
    );
  } catch (error) {
    console.error("Erro ao carregar habilidades:", error);
  }

  let inimigoInicial = null;
  try {
    const response = await axiosInstance.get<InimigoResponse>(
      `/combat/enemy/${character.id}`,
    );
    inimigoInicial = response.data?.data?.enemy ?? null;
  } catch (error) {
    console.error("Erro ao gerar inimigo:", error);
  }

  if (!inimigoInicial) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="font-imFeel text-4xl mb-4">Aventura</h1>
        <p className="text-lg text-gray-700">
          Não foi possível encontrar um inimigo agora. Tente novamente em
          instantes.
        </p>
      </div>
    );
  }

  return (
    <CombatArena
      character={character}
      abilities={habilidades}
      initialEnemy={inimigoInicial}
    />
  );
}
