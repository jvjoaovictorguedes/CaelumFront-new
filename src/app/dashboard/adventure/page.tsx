import axiosInstance from "@/utils/axiosIntance";

import {
  getCurrentCharacter,
} from "@/utils/character-session";

import CombatArena from "./components/CombatArena";
import ZoneSelector, { type ZonaApi } from "./components/ZoneSelector";
import HuntingSessionHeader, { type SessaoApi } from "./components/HuntingSessionHeader";
import PartyAdventureSection from "./components/PartyAdventureSection";

export default async function AdventurePage() {
  const character =
    await getCurrentCharacter();

  if (!character) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <h1 className="mb-4 font-imFeel text-4xl">
          Aventura
        </h1>

        <p className="text-lg text-gray-700">
          Crie um personagem antes de partir para o combate.
        </p>
      </div>
    );
  }

  if (
    character.vida_atual <= 0
  ) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <h1 className="mb-4 font-imFeel text-4xl">
          Aventura
        </h1>

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
      imagem_url?: string | null;
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

  interface SessaoResponse {
    data?: {
      sessao?: SessaoApi | null;
    };
  }

  interface ZonasResponse {
    data?: {
      zonas?: ZonaApi[];
    };
  }

  // Modo Aventura v1: combate PvE agora exige uma Área de Caça ativa
  // (validado no servidor, ver combatController.gerarInimigoParaPersonagem)
  // — sem sessão, mostra a tela de seleção de zona em vez de tentar
  // gerar um inimigo direto.
  let sessao: NonNullable<SessaoResponse["data"]>["sessao"] = null;
  try {
    const response = await axiosInstance.get<SessaoResponse>("/adventure/session");
    sessao = response.data?.data?.sessao ?? null;
  } catch (error) {
    console.error("Erro ao obter sessão de caça:", error);
  }

  if (!sessao) {
    let zonas: ZonaApi[] = [];
    try {
      const response = await axiosInstance.get<ZonasResponse>("/adventure/zones");
      zonas = response.data?.data?.zonas ?? [];
    } catch (error) {
      console.error("Erro ao listar áreas de caça:", error);
    }

    return (
      <div className="flex h-full flex-col gap-4">
        <PartyAdventureSection zonas={zonas} />
        <ZoneSelector zonas={zonas} />
      </div>
    );
  }

  let habilidades:
    HabilidadeApi[] = [];

  try {
    const response =
      await axiosInstance.get<HabilidadesResponse>(
        "/character-abilities",
        {
          params: {
            characterId:
              character.id,
          },
        },
      );

    habilidades =
      (
        response.data?.data
          ?.characterAbilities ??
        []
      ).filter(
        (habilidade) =>
          habilidade.is_active &&
          habilidade.Power
            ?.tipo_poder ===
            "Ativo",
      );
  } catch (error) {
    console.error(
      "Erro ao carregar habilidades:",
      error,
    );
  }

  let inimigoInicial:
    | InimigoApi
    | null = null;

  try {
    const response =
      await axiosInstance.get<InimigoResponse>(
        `/combat/enemy/${character.id}`,
      );

    inimigoInicial =
      response.data?.data
        ?.enemy ??
      null;
  } catch (error) {
    console.error(
      "Erro ao gerar inimigo:",
      error,
    );
  }

  if (!inimigoInicial) {
    return (
      <div className="flex h-full flex-col gap-2">
        <HuntingSessionHeader sessao={sessao} />
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <p className="text-lg text-gray-700">
            Não foi possível encontrar uma criatura agora. Tente novamente em
            instantes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <HuntingSessionHeader sessao={sessao} />
      <CombatArena
        key={`${inimigoInicial.nome}-${character.vida_atual}-${Date.now()}`}
        character={character}
        abilities={habilidades}
        initialEnemy={inimigoInicial}
        zona={sessao.area}
      />
    </div>
  );
}
