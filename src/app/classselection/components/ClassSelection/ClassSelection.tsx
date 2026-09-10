"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosIntance";
import { createCharacter } from "@/app/create/action";
import {
  getTempCharacterData,
  type TempCharacterData,
} from "@/app/create/temp-character-data-action";
import { getClassImage } from "@/utils/media-url";

interface ClassData {
  id: string;
  nome: string;
  descricao: string;
  imagem_url: string;
}

export default function ClassSelection() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [rawClassesObject, setRawClassesObject] = useState<ClassData[]>([]);
  const [classesData, setClassesData] = useState<ClassData[]>([]);
  const [selectedClasses, setSelectedClasses] = useState("");
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [hasRolledSpecial, setHasRolledSpecial] = useState(false);
  const [visibleClasses, setVisibleClasses] = useState<ClassData[]>([]);
  const [tempCharacterData, setTempCharacterData] =
    useState<TempCharacterData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const dataFromCookie = await getTempCharacterData();
        setTempCharacterData(dataFromCookie);
        console.log(dataFromCookie);
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
          const commonClasses = classes.filter(
            (classItem) =>
              !["primordial", "celestial"].some((rareName) =>
                classItem.nome.toLowerCase().includes(rareName),
              ),
          );

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
  }, []);

  //roll 100%
  const rollSpecialClasses = () => {
    if (hasRolledSpecial) return false;

    const roll = Math.random() * 100;

    if (roll <= 0.01) {
      const specialClasses = rawClassesObject.filter((classItem) =>
        ["primordial", "celestial"].some((rareName) =>
          classItem.nome.toLowerCase().includes(rareName),
        ),
      );
      if (specialClasses.length > 0) {
        setHasRolledSpecial(true);
        setVisibleClasses([...classesData, ...specialClasses]);
        setErrorMessage(
          "Uma classe lendaria apareceu. Escolha-a ou mantenha sua classe atual e confirme novamente.",
        );
        return true;
      }
    }
    return false;
  };

  const currentClassDescription =
    rawClassesObject.find((cls) => cls.id === selectedClasses)?.descricao ||
    "Selecione uma classe para ver a descrição.";

  const handleCreateFinalCharacter = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    if (!selectedClasses) {
      setErrorMessage("Por favor, selecione uma classe.");
      return;
    }

    if (loadingClasses) {
      return (
        <div
          className="flex items-center justify-center min-h-screen bg-cover bg-center"
          style={{ backgroundImage: "url('/images/homeMedieval.png')" }}
        >
          <div className="text-white text-3xl">Carregando classes...</div>
        </div>
      );
    }
    if (
      !tempCharacterData?.nome ||
      !tempCharacterData.genero ||
      !tempCharacterData.id_raca
    ) {
      setErrorMessage("Dados de personagem incompletos. Reinicie a criação.");
      return;
    }
    if (rollSpecialClasses()) return;
    setIsLoading(true);

    const finalCharacterData = {
      nome: tempCharacterData.nome,
      genero:
        tempCharacterData.genero.toLowerCase() === "feminino"
          ? "Feminino"
          : "Masculino",
      id_raca: tempCharacterData.id_raca,
      id_classe: selectedClasses,
      nivel: tempCharacterData.nivel,
      experiencia: tempCharacterData.experiencia,
      vida_atual: tempCharacterData.vida_atual,
      mana_atual: tempCharacterData.mana_atual,
      forca: tempCharacterData.forca,
      vitalidade: tempCharacterData.vitalidade,
      agilidade: tempCharacterData.agilidade,
      inteligencia: tempCharacterData.inteligencia,
      velocidade: tempCharacterData.velocidade,
      dinheiro: tempCharacterData.dinheiro,
      id_usuario: tempCharacterData.id_usuario,
    };

    console.log("Dados do personagem final:", finalCharacterData);

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

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/images/homeMedieval.png')" }}
    >
      <div className="w-full max-w-[600px] rounded-lg border-4 border-[#F3B43F] bg-[#292018] p-4 font-imFeel text-white shadow-xl sm:p-8">
        <h2 className="mb-6 text-center text-3xl text-[#F3B43F] sm:text-4xl">
          Escolha sua Classe
        </h2>
        {hasRolledSpecial && (
          <div className="bg-[#DFC492] border-2 border-[#F3B43F] p-4 rounded-md mb-6 h-10 flex items-center justify-center text-center">
            <h4 className="text-1xl text-center text-[#292018]">
              Ao reencarnar você sente um toque sutil, e os Deuses o
              abençoaram....
            </h4>
          </div>
        )}
        <form onSubmit={handleCreateFinalCharacter}>
          <div className="mb-6 flex flex-wrap justify-center gap-3 sm:gap-8">
            {/* AGORA SÓ HÁ UM ÚNICO MAP PARA visibleClasses */}
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
