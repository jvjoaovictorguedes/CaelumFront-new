"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosIntance";
import { createCharacter } from "../../action";
import { getRaceImage, getClassImage } from "@/utils/media-url";
import { recomendarBuildDeRaca, recomendarBuildDeClasse } from "@/utils/buildRecommendation";

interface RaceData {
  id: string;
  nome_masculino: string;
  nome_feminino: string;
  descricao_masculina: string;
  descricao_feminina: string;
  imagem_masculina_url: string;
  imagem_feminina_url: string;
  bonus_forca: number;
  bonus_vitalidade: number;
  bonus_agilidade: number;
  bonus_inteligencia: number;
  bonus_velocidade: number;
  raro: boolean;
}

interface ClassData {
  id: string;
  nome: string;
  descricao: string;
  imagem_url: string;
  multiplicador_vida_por_nivel: number;
  multiplicador_mana_por_nivel: number;
  multiplicador_dano_fisico: number;
  multiplicador_dano_magico: number;
  raro: boolean;
}

interface CaminhoEvolucaoPreview {
  id: number;
  nome: string;
  descricao: string;
  nivel_necessario: number;
  bonus_forca: number;
  bonus_vitalidade: number;
  bonus_agilidade: number;
  bonus_inteligencia: number;
  bonus_velocidade: number;
}

interface SorteioClasseRaraResponse {
  data?: {
    raro: boolean;
    classe?: ClassData;
    ticket?: string;
  };
}

// Opção de raça rara devolvida por POST /races/sortear-raro quando o
// jogador ganha o sorteio (0.9%) — o servidor manda TODAS as raças
// marcadas como raras (hoje Celestial e Primordial), cada uma com seu
// próprio ticket, pra escolher livremente qual delas quer.
interface RaceOption {
  id: string | number;
  nome_masculino: string;
  nome_feminino: string;
  descricao_masculina: string;
  descricao_feminina: string;
  imagem_masculina_url?: string;
  imagem_feminina_url?: string;
  bonus_forca: number;
  bonus_vitalidade: number;
  bonus_agilidade: number;
  bonus_inteligencia: number;
  bonus_velocidade: number;
}

interface OpcaoRacaRara {
  raca: RaceOption;
  ticket: string;
}

interface SorteioRacaRaraResponse {
  data?: {
    raro: boolean;
    opcoes?: OpcaoRacaRara[];
  };
}

function normalizeRace(rawRace: Record<string, unknown>): RaceData {
  const name = String(rawRace.nome ?? rawRace.name ?? "Raça");
  const description = String(rawRace.descricao ?? rawRace.description ?? "");
  const image = String(rawRace.imagem_url ?? rawRace.image_url ?? "");

  return {
    id: String(rawRace.id),
    nome_masculino: String(rawRace.nome_masculino ?? name),
    nome_feminino: String(rawRace.nome_feminino ?? name),
    descricao_masculina: String(rawRace.descricao_masculina ?? description),
    descricao_feminina: String(rawRace.descricao_feminina ?? description),
    imagem_masculina_url: String(rawRace.imagem_masculina_url ?? image),
    imagem_feminina_url: String(rawRace.imagem_feminina_url ?? image),
    bonus_forca: Number(rawRace.bonus_forca ?? rawRace.forca ?? 0),
    bonus_vitalidade: Number(rawRace.bonus_vitalidade ?? rawRace.vitalidade ?? 0),
    bonus_agilidade: Number(rawRace.bonus_agilidade ?? rawRace.agilidade ?? 0),
    bonus_inteligencia: Number(rawRace.bonus_inteligencia ?? rawRace.inteligencia ?? 0),
    bonus_velocidade: Number(rawRace.bonus_velocidade ?? rawRace.velocidade ?? 0),
    raro: Boolean(rawRace.raro),
  };
}

// Frase de efeito por raça rara, pra vender o momento de sorte grande —
// texto casado com o nome (funciona pra qualquer raça rara futura cujo
// nome não bata com nenhum dos dois, cai no genérico).
function fraseDeEfeitoRaca(nome: string) {
  const normalizado = nome.toLowerCase();
  if (normalizado.includes("celestial")) {
    return "Um anjo desceu dos céus para tocar o seu destino. Nascido da luz divina, você caminha agora entre mortais e deuses.";
  }
  if (normalizado.includes("primordial")) {
    return "As forças mais antigas da criação despertaram no seu sangue. Você é o eco vivo do início de tudo.";
  }
  return "Um poder raríssimo escolheu você.";
}

const LABEL_ATRIBUTO: { chave: keyof RaceData; label: string }[] = [
  { chave: "bonus_forca", label: "Força" },
  { chave: "bonus_vitalidade", label: "Vitalidade" },
  { chave: "bonus_agilidade", label: "Agilidade" },
  { chave: "bonus_inteligencia", label: "Inteligência" },
  { chave: "bonus_velocidade", label: "Velocidade" },
];

function AtributosDaRaca({ raca }: { raca: RaceData }) {
  return (
    <div className="flex flex-wrap justify-center gap-1 text-[10px]">
      {LABEL_ATRIBUTO.map(({ chave, label }) => {
        const valor = raca[chave] as number;
        if (!valor) return null;
        return (
          <span
            key={chave}
            className={`rounded px-1.5 py-0.5 font-bold ${
              valor > 0 ? "bg-green-900/40 text-green-300" : "bg-red-900/40 text-red-300"
            }`}
          >
            {valor > 0 ? "+" : ""}
            {valor} {label}
          </span>
        );
      })}
    </div>
  );
}

export default function CharacterCreation() {
  const router = useRouter();

  const [name, setCharacterName] = useState("");
  const [gender, setGender] = useState<"Masculino" | "feminino">("Masculino");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [loadingRaces, setLoadingRaces] = useState(true);
  const [races, setRaces] = useState<RaceData[]>([]);
  const [selectedRace, setSelectedRace] = useState("");

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [rawClassesObject, setRawClassesObject] = useState<ClassData[]>([]);
  const [classesData, setClassesData] = useState<ClassData[]>([]);
  const [visibleClasses, setVisibleClasses] = useState<ClassData[]>([]);
  const [selectedClasses, setSelectedClasses] = useState("");

  const [evolucoesPorClasse, setEvolucoesPorClasse] = useState<
    Record<string, CaminhoEvolucaoPreview[] | "carregando" | "erro">
  >({});

  const [hasRolledSpecial, setHasRolledSpecial] = useState(false);
  const [ganhouClasseRara, setGanhouClasseRara] = useState(false);
  const [rareClassTicket, setRareClassTicket] = useState<string | null>(null);

  const [hasRolledRareRace, setHasRolledRareRace] = useState(false);
  const [rareRaceOptions, setRareRaceOptions] = useState<OpcaoRacaRara[] | null>(null);

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        setLoadingRaces(true);
        const response = await axiosInstance.get<{
          data?: { races?: unknown[] } | unknown[];
          races?: unknown[];
        }>("/races");
        const payload = response.data?.data;
        const rawRaces = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.races)
            ? payload.races
            : Array.isArray(response.data?.races)
              ? response.data.races
              : [];

        if (rawRaces.length > 0) {
          const normalizedRaces = rawRaces.map((race) =>
            normalizeRace(race as Record<string, unknown>),
          );
          // Raças raras (Race.raro) nunca aparecem na grade normal — só
          // entram se o sorteio no servidor (POST /races/sortear-raro)
          // liberar uma, no confirmar final.
          const commonRaces = normalizedRaces.filter((race) => !race.raro);
          const availableRaces = commonRaces.length > 0 ? commonRaces : normalizedRaces;

          setRaces(availableRaces);
          setSelectedRace(availableRaces[0].id);
        } else {
          setErrorMessage("Nenhuma raça foi encontrada na API.");
        }
      } catch (error) {
        console.error("Erro ao carregar as raças:", error);
        setErrorMessage("Erro ao carregar as raças. Tente novamente mais tarde.");
      } finally {
        setLoadingRaces(false);
      }
    };

    const fetchClasses = async () => {
      try {
        setLoadingClasses(true);
        const response = await axiosInstance.get<{ data?: { classes?: ClassData[] } }>(
          "/classes",
        );
        const classes = response.data?.data?.classes;
        if (classes) {
          const commonClasses = classes.filter((classItem) => !classItem.raro);
          setRawClassesObject(classes);
          if (commonClasses.length >= 2) {
            setClassesData(commonClasses);
            setVisibleClasses(commonClasses);
            setSelectedClasses(commonClasses[0].id);
          } else {
            setErrorMessage("Não há classes suficientes disponíveis.");
          }
        } else {
          setErrorMessage("Formato de dados inesperado da API de classes.");
        }
      } catch (error) {
        console.error("Erro ao carregar as classes:", error);
        setErrorMessage("Erro ao carregar as classes. Tente novamente mais tarde.");
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchRaces();
    fetchClasses();
  }, []);

  // Prévia das evoluções da classe selecionada — buscada sob demanda e
  // guardada em cache por id, pra não refazer a chamada toda vez que o
  // jogador volta pra uma classe que já olhou.
  const carregarEvolucoesDaClasse = useCallback(
    async (idClasse: string) => {
      if (evolucoesPorClasse[idClasse]) return;
      setEvolucoesPorClasse((atual) => ({ ...atual, [idClasse]: "carregando" }));
      try {
        const resp = await axiosInstance.get<{ data?: { caminhos?: CaminhoEvolucaoPreview[] } }>(
          `/classes/${idClasse}/evolution-paths`,
        );
        setEvolucoesPorClasse((atual) => ({
          ...atual,
          [idClasse]: resp.data?.data?.caminhos ?? [],
        }));
      } catch (error) {
        console.error("Erro ao carregar evoluções da classe:", error);
        setEvolucoesPorClasse((atual) => ({ ...atual, [idClasse]: "erro" }));
      }
    },
    [evolucoesPorClasse],
  );

  useEffect(() => {
    if (selectedClasses) carregarEvolucoesDaClasse(selectedClasses);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClasses]);

  const currentRace = races.find((race) => race.id === selectedRace);
  const currentRaceDescription = currentRace
    ? gender === "Masculino"
      ? currentRace.descricao_masculina
      : currentRace.descricao_feminina
    : "Selecione uma raça para ver a descrição.";

  const currentClass = rawClassesObject.find((cls) => cls.id === selectedClasses);
  const currentClassDescription = currentClass?.descricao || "Selecione uma classe para ver a descrição.";
  const evolucoesDaClasseAtual = selectedClasses ? evolucoesPorClasse[selectedClasses] : undefined;

  // O sorteio (e a decisão de quem ganhou) é sempre do servidor — ver
  // rationale completo no histórico desta tela (antiga ClassSelection.tsx).
  const rollSpecialClasses = async (): Promise<"revelado" | "nada" | "erro"> => {
    if (hasRolledSpecial) return "nada";
    try {
      const sorteio = await axiosInstance.post<SorteioClasseRaraResponse>("/classes/sortear-raro");
      setHasRolledSpecial(true);
      const resultado = sorteio.data?.data;
      if (resultado?.raro && resultado.classe) {
        setVisibleClasses([...classesData, resultado.classe]);
        setRareClassTicket(resultado.ticket ?? null);
        setGanhouClasseRara(true);
        setErrorMessage(
          "Uma classe lendaria apareceu. Escolha-a ou mantenha sua classe atual e confirme novamente.",
        );
        return "revelado";
      }
      return "nada";
    } catch (error) {
      console.error("Erro ao sortear classe rara:", error);
      setErrorMessage("Não foi possível verificar o sorteio de classe rara (falha de conexão). Tente confirmar novamente.");
      return "erro";
    }
  };

  const rollRareRace = async (): Promise<"revelado" | "nada" | "erro"> => {
    if (hasRolledRareRace) return "nada";
    try {
      const sorteio = await axiosInstance.post<SorteioRacaRaraResponse>("/races/sortear-raro");
      setHasRolledRareRace(true);
      const resultado = sorteio.data?.data;
      if (resultado?.raro && resultado.opcoes && resultado.opcoes.length > 0) {
        setRareRaceOptions(resultado.opcoes);
        return "revelado";
      }
      return "nada";
    } catch (error) {
      console.error("Erro ao sortear raça rara:", error);
      setErrorMessage("Não foi possível verificar o sorteio de raça rara (falha de conexão). Tente confirmar novamente.");
      return "erro";
    }
  };

  const finalizarCriacaoDoPersonagem = async (racaRaraEscolhida: OpcaoRacaRara | null) => {
    const racaComumEscolhida = races.find((race) => race.id === selectedRace);
    if (!name.trim() || (!racaRaraEscolhida && !racaComumEscolhida)) {
      setErrorMessage("Dados de personagem incompletos. Reinicie a criação.");
      return;
    }

    const classeEscolhida = rawClassesObject.find((cls) => cls.id === selectedClasses);

    setIsLoading(true);

    // Mesmas fórmulas usadas no resto do jogo (combate, uso de item):
    // vidaMaxima = 30 + vitalidade*6, manaMaxima = 20 + inteligencia*5.
    const dadosDaRaca = racaRaraEscolhida
      ? {
          id_raca: String(racaRaraEscolhida.raca.id),
          forca: racaRaraEscolhida.raca.bonus_forca,
          vitalidade: racaRaraEscolhida.raca.bonus_vitalidade,
          agilidade: racaRaraEscolhida.raca.bonus_agilidade,
          inteligencia: racaRaraEscolhida.raca.bonus_inteligencia,
          velocidade: racaRaraEscolhida.raca.bonus_velocidade,
          vida_atual: 30 + racaRaraEscolhida.raca.bonus_vitalidade * 6,
          mana_atual: 20 + racaRaraEscolhida.raca.bonus_inteligencia * 5,
          ticket_raca_rara: racaRaraEscolhida.ticket,
        }
      : {
          id_raca: racaComumEscolhida!.id,
          forca: racaComumEscolhida!.bonus_forca,
          vitalidade: racaComumEscolhida!.bonus_vitalidade,
          agilidade: racaComumEscolhida!.bonus_agilidade,
          inteligencia: racaComumEscolhida!.bonus_inteligencia,
          velocidade: racaComumEscolhida!.bonus_velocidade,
          vida_atual: 30 + racaComumEscolhida!.bonus_vitalidade * 6,
          mana_atual: 20 + racaComumEscolhida!.bonus_inteligencia * 5,
          ticket_raca_rara: undefined,
        };

    const finalCharacterData = {
      nome: name,
      genero: gender.toLowerCase() === "feminino" ? "Feminino" : "Masculino",
      id_classe: selectedClasses,
      nivel: 1,
      experiencia: 0,
      dinheiro: 15,
      // Só relevante se a classe escolhida for a rara sorteada — o
      // backend ignora este campo pra qualquer classe comum.
      ticket_classe_rara: classeEscolhida?.raro ? (rareClassTicket ?? undefined) : undefined,
      ...dadosDaRaca,
    };

    const result = await createCharacter(finalCharacterData);

    setIsLoading(false);

    if (result.success) {
      alert("Personagem criado com sucesso!");
      router.replace("/dashboard");
    } else {
      setErrorMessage(result.message || "Erro desconhecido ao criar personagem.");
    }
  };

  const handleConfirm = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");

    if (name.trim() === "") {
      setErrorMessage("Por favor, digite o nome do personagem.");
      return;
    }
    if (!selectedRace) {
      setErrorMessage("Por favor, selecione uma raça.");
      return;
    }
    if (!selectedClasses) {
      setErrorMessage("Por favor, selecione uma classe.");
      return;
    }

    // Desabilita o botão durante os dois sorteios também — um duplo-clique
    // durante a chamada de rede do sorteio (antes de qualquer roll travar)
    // disparava o sorteio duas vezes.
    setIsLoading(true);
    try {
      const resultadoClasse = await rollSpecialClasses();
      if (resultadoClasse === "revelado" || resultadoClasse === "erro") return;

      const resultadoRaca = await rollRareRace();
      if (resultadoRaca === "revelado" || resultadoRaca === "erro") return;

      await finalizarCriacaoDoPersonagem(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscolherRacaRara = (opcao: OpcaoRacaRara) => {
    finalizarCriacaoDoPersonagem(opcao);
  };

  const loading = loadingRaces || loadingClasses;

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-cover bg-center"
        style={{ backgroundImage: "url('/images/homeMedieval.png')" }}
      >
        <div className="text-white text-3xl">Carregando criação de personagem...</div>
      </div>
    );
  }

  if (errorMessage && races.length === 0) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-cover bg-center"
        style={{ backgroundImage: "url('/images/homeMedieval.png')" }}
      >
        <div className="text-red-500 text-3xl text-center">
          {errorMessage}
          <p className="text-xl mt-4">Por favor, recarregue a página.</p>
        </div>
      </div>
    );
  }

  // O jogador ganhou o sorteio de raça rara: em vez do formulário normal,
  // mostra a revelação — ele escolhe entre as raras disponíveis e isso já
  // finaliza a criação do personagem.
  if (rareRaceOptions) {
    const generoEscolha = gender === "feminino" ? "feminino" : "Masculino";

    return (
      <div
        className="flex items-center justify-center min-h-screen bg-cover bg-center"
        style={{ backgroundImage: "url('/images/homeMedieval.png')" }}
      >
        <div className="w-full max-w-[720px] rounded-lg border-4 border-[#F3B43F] bg-[#292018] p-4 font-imFeel text-white shadow-xl sm:p-8">
          <h2 className="mb-2 text-center text-3xl text-[#F3B43F] sm:text-4xl">Você deu sorte!</h2>
          <p className="mb-6 text-center text-base text-white/80 sm:text-lg">
            Uma força além do comum se manifestou no seu destino. Escolha entre os seres raros
            que se abriram diante de você — essa escolha substitui a raça comum que você tinha
            selecionado antes.
          </p>

          <div className="mb-6 flex flex-wrap justify-center gap-4 sm:gap-8">
            {rareRaceOptions.map((opcao) => {
              const nome = generoEscolha === "Masculino" ? opcao.raca.nome_masculino : opcao.raca.nome_feminino;
              const imagem = generoEscolha === "Masculino" ? opcao.raca.imagem_masculina_url : opcao.raca.imagem_feminina_url;

              return (
                <button
                  key={opcao.raca.id}
                  type="button"
                  onClick={() => handleEscolherRacaRara(opcao)}
                  disabled={isLoading}
                  className="group flex w-full max-w-[300px] flex-col items-center rounded-lg border-4 border-transparent bg-[#3a2f24] p-4 transition-all duration-200 hover:border-[#F3B43F] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div
                    className="mx-auto mb-3 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gray-700 shadow-lg sm:h-36 sm:w-36"
                    style={{
                      backgroundImage: `url(${getRaceImage(nome, generoEscolha === "Masculino" ? "Masculino" : "feminino", imagem)})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></div>
                  <p className="text-center text-xl text-[#F3B43F] sm:text-2xl">{nome}</p>
                  <p className="mt-2 text-center text-sm italic leading-relaxed text-white/90 sm:text-base">
                    {fraseDeEfeitoRaca(nome)}
                  </p>
                </button>
              );
            })}
          </div>

          {isLoading && <p className="text-center text-lg text-[#F3B43F]">Selando seu destino...</p>}
          {errorMessage && <p className="text-red-500 text-center mb-1 text-lg">{errorMessage}</p>}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center px-2 py-6"
      style={{ backgroundImage: "url('/images/homeMedieval.png')" }}
    >
      <div className="w-full max-w-[1100px] rounded-lg border-4 border-[#F3B43F] bg-[#292018] p-4 font-imFeel text-white shadow-xl sm:p-8">
        <h2 className="mb-6 text-center text-3xl text-[#F3B43F] sm:text-4xl">Crie seu Personagem</h2>

        <form onSubmit={handleConfirm}>
          <div className="mb-4">
            <input
              type="text"
              id="name"
              className="w-full px-4 py-2 bg-[#DFC492] text-black rounded-md focus:outline-none focus:ring-2 focus:ring-[#F3B43F] text-xl"
              placeholder="Digite o nome do seu personagem"
              value={name}
              onChange={(e) => setCharacterName(e.target.value)}
              maxLength={20}
            />
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-center gap-4 sm:gap-8">
            <label className="flex cursor-pointer items-center text-xl sm:text-2xl">
              <input
                type="radio"
                name="gender"
                value="Masculino"
                checked={gender === "Masculino"}
                onChange={() => setGender("Masculino")}
                className="hidden"
              />
              <span className="w-6 h-6 border-2 border-[#F3B43F] rounded-full flex items-center justify-center mr-2">
                {gender === "Masculino" && <span className="w-3 h-3 bg-[#F3B43F] rounded-full"></span>}
              </span>
              Masculino
            </label>
            <label className="flex cursor-pointer items-center text-xl sm:text-2xl">
              <input
                type="radio"
                name="gender"
                value="feminino"
                checked={gender === "feminino"}
                onChange={() => setGender("feminino")}
                className="hidden"
              />
              <span className="w-6 h-6 border-2 border-[#F3B43F] rounded-full flex items-center justify-center mr-2">
                {gender === "feminino" && <span className="w-3 h-3 bg-[#F3B43F] rounded-full"></span>}
              </span>
              Feminino
            </label>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Coluna Raça */}
            <div>
              <h3 className="mb-3 text-center text-xl text-[#F3B43F] sm:text-2xl">Raça</h3>
              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {races
                  .slice()
                  .sort((a, b) => Number(a.id) - Number(b.id))
                  .map((race) => (
                    <div
                      key={race.id}
                      className={`relative rounded-lg cursor-pointer p-2 transition-all duration-200 ${
                        selectedRace === race.id
                          ? "border-4 border-[#F3B43F] bg-[#3a2f24]"
                          : "border-4 border-transparent hover:border-[#F3B43F]/50"
                      }`}
                      onClick={() => setSelectedRace(race.id)}
                    >
                      <div
                        className="mx-auto mb-1 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gray-700 sm:h-20 sm:w-20"
                        style={{
                          backgroundImage: `url(${getRaceImage(
                            gender === "Masculino" ? race.nome_masculino : race.nome_feminino,
                            gender,
                            gender === "Masculino" ? race.imagem_masculina_url : race.imagem_feminina_url,
                          )})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      ></div>
                      <p className="text-center text-sm text-[#F3B43F] sm:text-base">
                        {gender === "Masculino" ? race.nome_masculino : race.nome_feminino}
                      </p>
                    </div>
                  ))}
              </div>

              {currentRace && (
                <div className="mb-2 rounded-md border-2 border-[#F3B43F] bg-[#DFC492] p-3">
                  <p className="mb-2 text-center text-sm font-bold leading-relaxed text-[#1f1813] sm:text-base">
                    {currentRaceDescription}
                  </p>
                  <div className="mb-2 flex justify-center">
                    <AtributosDaRaca raca={currentRace} />
                  </div>
                  <p className="text-center text-xs font-bold uppercase tracking-wide text-[#8D6825]">
                    {recomendarBuildDeRaca({
                      forca: currentRace.bonus_forca,
                      vitalidade: currentRace.bonus_vitalidade,
                      agilidade: currentRace.bonus_agilidade,
                      inteligencia: currentRace.bonus_inteligencia,
                      velocidade: currentRace.bonus_velocidade,
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Coluna Classe */}
            <div>
              <h3 className="mb-3 text-center text-xl text-[#F3B43F] sm:text-2xl">Classe</h3>
              {ganhouClasseRara && (
                <div className="bg-[#DFC492] border-2 border-[#F3B43F] p-2 rounded-md mb-3 flex items-center justify-center text-center">
                  <h4 className="text-xs text-center text-[#292018]">
                    Ao reencarnar você sente um toque sutil, e os Deuses o abençoaram....
                  </h4>
                </div>
              )}
              <div className="mb-4 flex flex-wrap justify-center gap-2 sm:gap-4">
                {visibleClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className={`relative rounded-lg cursor-pointer p-2 transition-all duration-200 ${
                      selectedClasses === cls.id
                        ? "border-4 border-[#F3B43F] bg-[#3a2f24]"
                        : "border-4 border-transparent hover:border-[#F3B43F]/50"
                    }`}
                    onClick={() => setSelectedClasses(cls.id)}
                  >
                    <div
                      className="mx-auto mb-1 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gray-700 sm:h-20 sm:w-20"
                      style={{
                        backgroundImage: `url(${getClassImage(cls.nome, cls.imagem_url)})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    ></div>
                    <p className="text-center text-sm text-[#F3B43F] sm:text-base">{cls.nome}</p>
                  </div>
                ))}
              </div>

              {currentClass && (
                <div className="mb-2 rounded-md border-2 border-[#F3B43F] bg-[#DFC492] p-3">
                  <p className="mb-2 text-center text-sm font-bold leading-relaxed text-[#1f1813] sm:text-base">
                    {currentClassDescription}
                  </p>
                  <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-[#8D6825]">
                    {recomendarBuildDeClasse(currentClass)}
                  </p>

                  <div className="rounded border border-[#8D6825]/40 bg-black/10 p-2">
                    <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-wide text-[#8D6825]">
                      Evoluções desta classe
                    </p>
                    {evolucoesDaClasseAtual === "carregando" && (
                      <p className="text-center text-xs text-[#1f1813]/70">Carregando...</p>
                    )}
                    {evolucoesDaClasseAtual === "erro" && (
                      <p className="text-center text-xs text-[#1f1813]/70">Não foi possível carregar.</p>
                    )}
                    {Array.isArray(evolucoesDaClasseAtual) && evolucoesDaClasseAtual.length === 0 && (
                      <p className="text-center text-xs text-[#1f1813]/70">
                        Sem árvore de evolução cadastrada pra essa classe ainda.
                      </p>
                    )}
                    {Array.isArray(evolucoesDaClasseAtual) && evolucoesDaClasseAtual.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        {evolucoesDaClasseAtual.map((caminho) => (
                          <div key={caminho.id} className="rounded bg-white/40 px-2 py-1">
                            <p className="text-xs font-bold text-[#1f1813]">
                              {caminho.nome}{" "}
                              <span className="font-normal text-[#1f1813]/70">
                                (nível {caminho.nivel_necessario})
                              </span>
                            </p>
                            <p className="text-[11px] text-[#1f1813]/80">{caminho.descricao}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {errorMessage && <p className="text-red-500 text-center mb-1 mt-4 text-xl">{errorMessage}</p>}

          <div className="mt-6 flex justify-center">
            <button
              type="submit"
              className="h-[51px] bg-[#8D6825] font-imFeel text-white text-4xl hover:bg-gradient-to-b rounded-2xl cursor-pointer hover:to-[#8D6825] hover:from-[#684424] border-[#F3B43F] border-4 transition-all duration-200 w-max"
              disabled={isLoading}
            >
              {isLoading ? "CRIANDO PERSONAGEM..." : "CONFIRMAR"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
