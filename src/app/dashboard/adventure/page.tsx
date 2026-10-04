import axiosInstance from "@/utils/axiosIntance";

import {
  getCurrentCharacter,
} from "@/utils/character-session";

import CombatArena from "./components/CombatArena";
import ZoneSelector, { type ZonaApi } from "./components/ZoneSelector";
import HuntingSessionHeader, { type SessaoApi } from "./components/HuntingSessionHeader";
import PartyAdventureSection from "./components/PartyAdventureSection";
import SoloCombatGate from "./components/SoloCombatGate";
import DerrotadoGate from "./components/DerrotadoGate";

export default async function AdventurePage() {
  const character =
    await getCurrentCharacter();

  if (!character) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="rounded-2xl border border-[#F3B43F]/30 bg-[#292018]/80 p-6 text-center text-white shadow-xl">
          <h1 className="mb-4 font-imFeel text-4xl">
            Aventura
          </h1>

          <p className="text-lg text-white/80">
            Crie um personagem antes de partir para o combate.
          </p>
        </div>
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

  // Lista de zonas é buscada sempre, mesmo pra quem está derrotado:
  // PartyAdventureSection precisa dela pro anfitrião escolher a área do
  // grupo, e essa seção agora é renderizada em toda entrada na página —
  // ver comentário abaixo sobre o bug do convite de party.
  let zonas: ZonaApi[] = [];
  try {
    const response = await axiosInstance.get<ZonasResponse>("/adventure/zones");
    zonas = response.data?.data?.zonas ?? [];
  } catch (error) {
    console.error("Erro ao listar áreas de caça:", error);
  }

  // Derrotado não pode caçar sozinho, mas pode ter aceitado um convite
  // de party enquanto se recuperava em outra aba — DerrotadoGate esconde
  // este aviso (e deixa o lobby do grupo aparecer) quando for o caso, em
  // vez de travar o convidado numa tela morta sem nenhuma indicação de
  // que ele está num grupo (ver DerrotadoGate.tsx).
  if (character.vida_atual <= 0) {
    return (
      <div className="flex h-full flex-col gap-4">
        <PartyAdventureSection zonas={zonas} />
        <DerrotadoGate>
          <div className="flex flex-1 flex-col items-center justify-center gap-2">
            <div className="rounded-2xl border border-[#F3B43F]/30 bg-[#292018]/80 p-6 text-center text-white shadow-xl">
              <h1 className="mb-4 font-imFeel text-4xl">Aventura</h1>
              <p className="text-lg text-white/80">
                Seu personagem está derrotado e precisa se recuperar antes de
                enfrentar outro inimigo.
              </p>
            </div>
          </div>
        </DerrotadoGate>
      </div>
    );
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

  // PartyAdventureSection ficava dentro do "if (!sessao)" — jogador que
  // aceitava convite de party e JÁ tinha uma sessão de caça solo aberta
  // caía direto no combate solo (CombatArena) e nunca chegava a montar
  // a seção de grupo (bug reportado: "aceita o convite e entra na
  // aventura solo, não na party"). Ela é client-side e lê o estado do
  // grupo via socket (PvpSocketContext), então é segura de renderizar
  // em qualquer branch — só precisa deixar de estar presa a "sem sessão".
  if (!sessao) {
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
        <PartyAdventureSection zonas={zonas} />
        <SoloCombatGate>
          <HuntingSessionHeader sessao={sessao} />
          <div className="flex flex-1 flex-col items-center justify-center gap-2">
            <div className="rounded-2xl border border-[#F3B43F]/30 bg-[#292018]/80 p-6 text-center text-white shadow-xl">
              <p className="text-lg text-white/80">
                Não foi possível encontrar uma criatura agora. Tente novamente em
                instantes.
              </p>
            </div>
          </div>
        </SoloCombatGate>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <PartyAdventureSection zonas={zonas} />
      <SoloCombatGate>
        <HuntingSessionHeader sessao={sessao} />
        <CombatArena
          key={`${inimigoInicial.nome}-${character.vida_atual}-${Date.now()}`}
          character={character}
          abilities={habilidades}
          initialEnemy={inimigoInicial}
          zona={sessao.area}
        />
      </SoloCombatGate>
    </div>
  );
}
