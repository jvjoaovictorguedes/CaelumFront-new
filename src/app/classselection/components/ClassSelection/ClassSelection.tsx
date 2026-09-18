"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosIntance";
import { createCharacter } from "@/app/create/action";
import {
  getTempCharacterData,
  type TempCharacterData,
} from "@/app/create/temp-character-data-action";
import { getClassImage, getRaceImage } from "@/utils/media-url";

interface ClassData {
  id: string;
  nome: string;
  descricao: string;
  imagem_url: string;
  raro: boolean;
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

export default function ClassSelection() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [rawClassesObject, setRawClassesObject] = useState<ClassData[]>([]);
  const [classesData, setClassesData] = useState<ClassData[]>([]);
  const [selectedClasses, setSelectedClasses] = useState("");
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [hasRolledSpecial, setHasRolledSpecial] = useState(false);
  // Separado de hasRolledSpecial de propósito: aquele vira true assim que
  // o SORTEIO acontece (ganhando ou não), só pra travar "não sorteia de
  // novo". A mensagem de bênção só pode aparecer se o sorteio realmente
  // TIVER sido ganho — usar hasRolledSpecial pra isso mostrava a mensagem
  // pra qualquer jogador que confirmasse a classe normal, mesmo sem ter
  // tirado a sorte de 0.9%.
  const [ganhouClasseRara, setGanhouClasseRara] = useState(false);
  const [visibleClasses, setVisibleClasses] = useState<ClassData[]>([]);
  const [rareClassTicket, setRareClassTicket] = useState<string | null>(null);
  const [tempCharacterData, setTempCharacterData] =
    useState<TempCharacterData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sorteio de raça rara: só roda depois que nome/gênero/raça comum/
  // classe já foram todos escolhidos, no confirmar final desta tela —
  // não uma escolha visível na grade normal de raças.
  const [hasRolledRareRace, setHasRolledRareRace] = useState(false);
  const [rareRaceOptions, setRareRaceOptions] = useState<OpcaoRacaRara[] | null>(
    null,
  );

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const dataFromCookie = await getTempCharacterData();
        setTempCharacterData(dataFromCookie);
        if (
          !dataFromCookie ||
          !dataFromCookie.nome ||
          !dataFromCookie.id_raca
        ) {
          setErrorMessage(
            "Dados de personagem incompletos. Por favor, reinicie a criação.",
          );
          router.replace("/create");
          return;
        }
        const response = await axiosInstance.get<{
          data?: { classes?: ClassData[] };
        }>("/classes");
        const responseData = response.data.data as
          | { classes?: ClassData[] }
          | undefined;
        const classes = responseData?.classes;
        if (classes) {
          // O servidor marca a raridade (Class.raro) — raras nunca
          // aparecem na lista normal, só se o sorteio no servidor
          // (POST /classes/sortear-raro) liberar uma.
          const commonClasses = classes.filter((classItem) => !classItem.raro);

          setRawClassesObject(classes);
          if (commonClasses.length >= 2) {
            setClassesData(commonClasses);
            setVisibleClasses(commonClasses);
          } else {
            setErrorMessage("Não há classes suficientes disponíveis.");
          }
          if (commonClasses.length > 0) {
            setSelectedClasses(commonClasses[0].id);
          }
        } else {
          console.error(
            "A API /races não retornou um objeto ou array de raças esperado:",
            responseData,
          );
          setErrorMessage("Formato de dados inesperado da API de raças.");
        }
      } catch (error) {
        console.error("Erro ao carregar as raças:", error);
        setErrorMessage(
          "Erro ao carregar as raças. Tente novamente mais tarde.",
        );
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, [router]);

  // O sorteio (e a decisão de quem ganhou) é sempre do servidor — o
  // cliente só pede o resultado e mostra o que veio. Sem isso, um
  // cliente podia pular o sorteio e mandar direto o id de uma classe
  // rara em POST /characters.
  //
  // Devolve um resultado de 3 estados ("revelado" / "nada" / "erro"),
  // não um boolean: antes, `hasRolledSpecial` virava true ANTES da
  // chamada de rede, e um erro de rede (timeout, conexão caindo) caía
  // no mesmo `return false` de "sorteou e não ganhou" — o fluxo seguia
  // direto pra criar o personagem como se o sorteio tivesse realmente
  // acontecido, sem nunca ter chegado no servidor, e sem chance de
  // tentar de novo (a flag já tinha travado em true). Agora só trava a
  // flag quando o servidor responde de verdade (ganhou ou não); erro de
  // rede mostra mensagem e deixa o jogador tentar "Confirmar" de novo.
  const rollSpecialClasses = async (): Promise<"revelado" | "nada" | "erro"> => {
    if (hasRolledSpecial) return "nada";

    try {
      const sorteio = await axiosInstance.post<SorteioClasseRaraResponse>(
        "/classes/sortear-raro",
      );
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
      setErrorMessage(
        "Não foi possível verificar o sorteio de classe rara (falha de conexão). Tente confirmar novamente.",
      );
      return "erro";
    }
  };

  // Mesma ideia da classe rara, mas pra raça: o servidor sorteia
  // (POST /races/sortear-raro) e, se ganhar, devolve TODAS as raças
  // raras disponíveis (Celestial e Primordial) pra escolher — em vez de
  // uma tela normal de seleção, mostramos a revelação dramática em
  // renderReveloRacaRara() e o jogador finaliza a criação escolhendo ali.
  const rollRareRace = async (): Promise<"revelado" | "nada" | "erro"> => {
    if (hasRolledRareRace) return "nada";

    try {
      const sorteio = await axiosInstance.post<SorteioRacaRaraResponse>(
        "/races/sortear-raro",
      );
      setHasRolledRareRace(true);
      const resultado = sorteio.data?.data;
      if (resultado?.raro && resultado.opcoes && resultado.opcoes.length > 0) {
        setRareRaceOptions(resultado.opcoes);
        return "revelado";
      }
      return "nada";
    } catch (error) {
      console.error("Erro ao sortear raça rara:", error);
      setErrorMessage(
        "Não foi possível verificar o sorteio de raça rara (falha de conexão). Tente confirmar novamente.",
      );
      return "erro";
    }
  };

  const currentClassDescription =
    rawClassesObject.find((cls) => cls.id === selectedClasses)?.descricao ||
    "Selecione uma classe para ver a descrição.";

  // Passo final de verdade: monta o payload e cria o personagem. Chamado
  // tanto pelo fluxo normal (sem raça rara) quanto pela escolha na tela
  // de revelação — nesse segundo caso, `racaRaraEscolhida` sobrescreve a
  // raça comum (e os atributos/vida/mana iniciais, recalculados com os
  // bônus da raça rara) que tinha sido salva na etapa anterior.
  const finalizarCriacaoDoPersonagem = async (
    racaRaraEscolhida: OpcaoRacaRara | null,
  ) => {
    if (
      !tempCharacterData?.nome ||
      !tempCharacterData.genero ||
      !tempCharacterData.id_raca
    ) {
      setErrorMessage("Dados de personagem incompletos. Reinicie a criação.");
      return;
    }

    const classeEscolhida = rawClassesObject.find(
      (cls) => cls.id === selectedClasses,
    );

    setIsLoading(true);

    // Mesma fórmula usada no restante do jogo (combate, criação normal):
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
          id_raca: tempCharacterData.id_raca,
          forca: tempCharacterData.forca,
          vitalidade: tempCharacterData.vitalidade,
          agilidade: tempCharacterData.agilidade,
          inteligencia: tempCharacterData.inteligencia,
          velocidade: tempCharacterData.velocidade,
          vida_atual: tempCharacterData.vida_atual,
          mana_atual: tempCharacterData.mana_atual,
          ticket_raca_rara: undefined,
        };

    const finalCharacterData = {
      nome: tempCharacterData.nome,
      genero:
        tempCharacterData.genero.toLowerCase() === "feminino"
          ? "Feminino"
          : "Masculino",
      id_classe: selectedClasses,
      nivel: tempCharacterData.nivel,
      experiencia: tempCharacterData.experiencia,
      dinheiro: tempCharacterData.dinheiro,
      id_usuario: tempCharacterData.id_usuario,
      // Só relevante se a classe escolhida for a rara sorteada — o
      // backend ignora este campo pra qualquer classe comum.
      ticket_classe_rara: classeEscolhida?.raro
        ? (rareClassTicket ?? undefined)
        : undefined,
      ...dadosDaRaca,
    };

    const result = await createCharacter(finalCharacterData);

    setIsLoading(false);

    if (result.success) {
      alert("Personagem criado com sucesso!");
      router.replace("/dashboard");
    } else {
      setErrorMessage(
        result.message || "Erro desconhecido ao criar personagem.",
      );
    }
  };

  const handleCreateFinalCharacter = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    if (!selectedClasses) {
      setErrorMessage("Por favor, selecione uma classe.");
      return;
    }
    if (
      !tempCharacterData?.nome ||
      !tempCharacterData.genero ||
      !tempCharacterData.id_raca
    ) {
      setErrorMessage("Dados de personagem incompletos. Reinicie a criação.");
      return;
    }

    // Desabilita o botão durante os dois sorteios também — antes só
    // finalizarCriacaoDoPersonagem controlava isLoading, então um
    // duplo-clique em "Confirmar" durante a chamada de rede do sorteio
    // (antes de qualquer roll travar) disparava o sorteio duas vezes.
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

  if (errorMessage && rawClassesObject.length === 0) {
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

  if (!rawClassesObject || classesData.length === 0) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-cover bg-center"
        style={{ backgroundImage: "url('/images/homeMedieval.png')" }}
      >
        <div className="text-white text-3xl">
          Nenhuma classe encontrada ou erro de carregamento.
        </div>
      </div>
    );
  }

  // O jogador ganhou o sorteio de raça rara: em vez do formulário normal,
  // mostra a revelação — ele escolhe entre as raras disponíveis e isso já
  // finaliza a criação do personagem.
  if (rareRaceOptions) {
    const genero =
      tempCharacterData?.genero?.toLowerCase() === "feminino"
        ? "feminino"
        : "Masculino";

    return (
      <div
        className="flex items-center justify-center min-h-screen bg-cover bg-center"
        style={{ backgroundImage: "url('/images/homeMedieval.png')" }}
      >
        <div className="w-full max-w-[720px] rounded-lg border-4 border-[#F3B43F] bg-[#292018] p-4 font-imFeel text-white shadow-xl sm:p-8">
          <h2 className="mb-2 text-center text-3xl text-[#F3B43F] sm:text-4xl">
            Você deu sorte!
          </h2>
          <p className="mb-6 text-center text-base text-white/80 sm:text-lg">
            Uma força além do comum se manifestou no seu destino. Escolha
            entre os seres raros que se abriram diante de você — essa escolha
            substitui a raça comum que você tinha selecionado antes.
          </p>

          <div className="mb-6 flex flex-wrap justify-center gap-4 sm:gap-8">
            {rareRaceOptions.map((opcao) => {
              const nome =
                genero === "Masculino"
                  ? opcao.raca.nome_masculino
                  : opcao.raca.nome_feminino;
              const imagem =
                genero === "Masculino"
                  ? opcao.raca.imagem_masculina_url
                  : opcao.raca.imagem_feminina_url;

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
                      backgroundImage: `url(${getRaceImage(
                        nome,
                        genero === "Masculino" ? "Masculino" : "feminino",
                        imagem,
                      )})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></div>
                  <p className="text-center text-xl text-[#F3B43F] sm:text-2xl">
                    {nome}
                  </p>
                  <p className="mt-2 text-center text-sm italic leading-relaxed text-white/90 sm:text-base">
                    {fraseDeEfeitoRaca(nome)}
                  </p>
                </button>
              );
            })}
          </div>

          {isLoading && (
            <p className="text-center text-lg text-[#F3B43F]">
              Selando seu destino...
            </p>
          )}
          {errorMessage && (
            <p className="text-red-500 text-center mb-1 text-lg">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/images/homeMedieval.png')" }}
    >
      <div className="w-full max-w-[600px] rounded-lg border-4 border-[#F3B43F] bg-[#292018] p-4 font-imFeel text-white shadow-xl sm:p-8">
        <h2 className="mb-6 text-center text-3xl text-[#F3B43F] sm:text-4xl">
          Escolha sua Classe
        </h2>
        {ganhouClasseRara && (
          <div className="bg-[#DFC492] border-2 border-[#F3B43F] p-4 rounded-md mb-6 h-10 flex items-center justify-center text-center">
            <h4 className="text-1xl text-center text-[#292018]">
              Ao reencarnar você sente um toque sutil, e os Deuses o
              abençoaram....
            </h4>
          </div>
        )}
        <form onSubmit={handleCreateFinalCharacter}>
          <div className="mb-6 flex flex-wrap justify-center gap-3 sm:gap-8">
            {visibleClasses.map((cls: ClassData) => (
              <div
                key={cls.id}
                className={`relative p-4 rounded-lg cursor-pointer transition-all duration-200
                                ${
                                  selectedClasses === cls.id
                                    ? "border-4 border-[#F3B43F] bg-[#3a2f24]"
                                    : "border-4 border-transparent hover:border-[#F3B43F]/50"
                                }`}
                onClick={() => setSelectedClasses(cls.id)}
              >
                <div
                  className="mx-auto mb-2 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gray-700 sm:h-32 sm:w-32"
                  style={{
                    backgroundImage: `url(${getClassImage(
                      cls.nome,
                      cls.imagem_url,
                    )})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                ></div>
                <p className="text-center text-lg text-[#F3B43F] sm:text-xl">
                  {cls.nome}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-[#DFC492] border-2 border-[#F3B43F] p-4 rounded-md mb-6 h-32 flex items-center justify-center text-center">
            <p className="text-lg text-[#1f1813] leading-relaxed">
              {currentClassDescription}
            </p>
          </div>

          {errorMessage && (
            <p className="text-red-500 text-center mb-4 text-lg">
              {errorMessage}
            </p>
          )}

          <div className="flex justify-center">
            <button
              type="submit"
              className="w-max h-[51px] bg-[#8D6825] font-imFeel text-white text-4xl hover:bg-gradient-to-b rounded-2xl cursor-pointer hover:to-[#8D6825] hover:from-[#684424] border-[#F3B43F] border-4 transition-all duration-200"
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
