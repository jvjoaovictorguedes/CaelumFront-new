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

    // Emboscada da Expedição (expeditionService.coletar) usa o mesmo
    // campo encontro_pve do personagem, sem id_area/sessão nenhuma —
    // essa flag é o que diferencia esse encontro "solto" do combate
    // normal de uma Área de Caça (ver uso abaixo).
    origemExpedicao?: boolean;
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
  //
  // Sessão e encontro-em-andamento não dependem uma da outra — iam em
  // `await` sequenciais (2 round-trips ao backend, um atrás do outro,
  // nesta página que carrega a cada entrada em /dashboard/adventure).
  // Promise.allSettled dispara as duas de uma vez: mesma informação,
  // metade da espera. (`zonas` acima fica de fora porque o branch de
  // derrotado decide se renderiza ANTES de precisar de sessão/inimigo.)
  let sessao: NonNullable<SessaoResponse["data"]>["sessao"] = null;
  let inimigoInicial: InimigoApi | null = null;
  const [sessaoResult, inimigoResult] = await Promise.allSettled([
    axiosInstance.get<SessaoResponse>("/adventure/session"),
    axiosInstance.get<InimigoResponse>(`/combat/enemy/${character.id}`),
  ]);

  if (sessaoResult.status === "fulfilled") {
    sessao = sessaoResult.value.data?.data?.sessao ?? null;
  } else {
    console.error("Erro ao obter sessão de caça:", sessaoResult.reason);
  }

  // Checa ANTES de decidir a tela se já existe um encontro pendurado no
  // personagem — pode ser o combate normal de uma Área de Caça OU uma
  // emboscada da Expedição (mesmo campo encontro_pve, ver
  // expeditionService.coletar; gerarInimigoParaPersonagem já devolve
  // esse encontro em andamento ANTES de checar sessão nenhuma). Sem essa
  // checagem aqui também, um jogador emboscado que saísse da Expedição
  // sem terminar a luta (navegação, refresh — inimigoInterrupcao em
  // ExpeditionClient.tsx é só estado local, se perde) ficava sem NENHUM
  // caminho de volta: esta página caía direto no ZoneSelector (sem
  // sessão de Área de Caça pra mostrar), e entrar em qualquer zona nova
  // era barrado pelo 409 "Termine o combate em andamento antes de
  // entrar em outra Área de Caça." — bug relatado ("deu isso e não
  // consigo acessar onde estava pois era uma emboscada").
  if (inimigoResult.status === "fulfilled") {
    inimigoInicial = inimigoResult.value.data?.data?.enemy ?? null;
  } else {
    // 409 "Entre em uma Área de Caça..." é o caso ESPERADO aqui sempre
    // que não há sessão nem encontro pendurado nenhum (cai no
    // ZoneSelector abaixo) — isso acontece em toda entrada normal na
    // página pra quem não está no meio de uma caçada, então não é um
    // erro de verdade: logar como error só inundava o log de produção
    // a cada acesso. Só um status diferente de 409 é falha real.
    const status = (inimigoResult.reason as { response?: { status?: number } })?.response?.status;
    if (status !== 409) {
      console.error("Erro ao verificar encontro em andamento:", inimigoResult.reason);
    }
  }

  // PartyAdventureSection ficava dentro do "if (!sessao)" — jogador que
  // aceitava convite de party e JÁ tinha uma sessão de caça solo aberta
  // caía direto no combate solo (CombatArena) e nunca chegava a montar
  // a seção de grupo (bug reportado: "aceita o convite e entra na
  // aventura solo, não na party"). Ela é client-side e lê o estado do
  // grupo via socket (PvpSocketContext), então é segura de renderizar
  // em qualquer branch — só precisa deixar de estar presa a "sem sessão".
  if (!sessao && !inimigoInicial) {
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

  // Encontro resgatado sem Área de Caça nenhuma por trás — o caso real
  // é a emboscada da Expedição (origemExpedicao:true), mesma
  // apresentação que ExpeditionClient.tsx já usa pra essa luta, só que
  // resolvida por aqui; "Voltar à expedição" leva de volta pra lá (não
  // tem sessão de caça pra encerrar nem zona pra mostrar no header). Um
  // encontro de zona sem sessão (não deveria acontecer, mas sairia pelo
  // mesmo caminho se acontecesse) cai no rótulo genérico "Aventura" em
  // vez de travar sem UI nenhuma pra resolver o combate pendurado.
  if (inimigoInicial && !sessao) {
    const daExpedicao = inimigoInicial.origemExpedicao === true;
    return (
      <div className="flex h-full flex-col gap-2">
        <PartyAdventureSection zonas={zonas} />
        <CombatArena
          key={`sem-sessao-${character.vida_atual}`}
          character={character}
          abilities={habilidades}
          initialEnemy={inimigoInicial}
          labelBotaoVitoria={daExpedicao ? "Voltar à expedição" : "Buscar outro inimigo"}
          tituloZona={daExpedicao ? "Expedição" : "Aventura"}
          tituloArena={daExpedicao ? "Emboscada!" : "Aventura"}
          aoSairEndpoint={null}
          aoSairRota={daExpedicao ? "/dashboard/expedition" : "/dashboard/adventure"}
        />
      </div>
    );
  }

  if (!sessao) {
    // Inalcançável na prática — o bloco acima já cobre "sem sessão"
    // (com ou sem encontro pendurado); só serve de type guard pro TS
    // enxergar `sessao` como não-nulo daqui pra baixo.
    return (
      <div className="flex h-full flex-col gap-4">
        <PartyAdventureSection zonas={zonas} />
        <ZoneSelector zonas={zonas} />
      </div>
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
