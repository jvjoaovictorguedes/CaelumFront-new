"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosIntance";
import {
  getUserCookie,
  saveTempCharacterData,
} from "../../temp-character-data-action";
import Tooltip from "@/components/Tooltip/Tooltip";

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
}

interface UserCookie {
  id: string;
}

interface RacesResponseData {
  races: RaceData[];
}

export default function CharacterCreation() {
  const router = useRouter();

  const [name, setCharacterName] = useState("");
  const [gender, setGender] = useState("Masculino");
  const [selectedRace, setSelectedRace] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [racesData, setRacesData] = useState<RaceData[][]>([]);
  const [loadingRaces, setLoadingRaces] = useState(true);
  const [rawRacesObject, setrawRacesObject] = useState<RaceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cookiesUser, setCookiesUser] = useState<UserCookie | null>(null);
  const [natureMagic, setNatureMagic] = useState<string>("");

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        const cookieStore = await getUserCookie();
        setCookiesUser(cookieStore);
        setLoadingRaces(true);
        const response = await axiosInstance.get("/races");
        const rawRacesObject = response.data.data as RacesResponseData;
        if (
          rawRacesObject &&
          typeof rawRacesObject === "object" &&
          !Array.isArray(rawRacesObject)
        ) {
          const fetchedRacesArray = Object.values(
            rawRacesObject,
          ) as RaceData[][];
          setrawRacesObject(rawRacesObject.races);
          setRacesData(fetchedRacesArray);
          if (rawRacesObject.races.length > 0) {
            setSelectedRace(rawRacesObject.races[0].id);
          }
        } else {
          console.error(
            "A API /races não retornou um objeto ou array de raças esperado:",
            rawRacesObject,
          );
          setErrorMessage("Formato de dados inesperado da API de raças.");
        }
      } catch (error) {
        console.error("Erro ao carregar as raças:", error);
        setErrorMessage(
          "Erro ao carregar as raças. Tente novamente mais tarde.",
        );
      } finally {
        setLoadingRaces(false);
      }
    };

    fetchRaces();
  }, []);
  const currentRace = rawRacesObject.find((race) => race.id === selectedRace);

  const currentRaceDescription = currentRace
    ? gender === "Masculino"
      ? currentRace.descricao_masculina
      : currentRace.descricao_feminina
    : "Selecione uma raça para ver a descrição.";

  if (loadingRaces) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-cover bg-center"
        style={{ backgroundImage: "url('/images/homeMedieval.png')" }}
      >
        <div className="text-white text-3xl">Carregando raças...</div>
      </div>
    );
  }

  if (errorMessage && racesData.length === 0) {
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

    const currentRaceTempory = rawRacesObject.find(
      (race) => race.id === selectedRace,
    );

    const roll = Math.random() * 100;

    if (roll <= 2) {
      setNatureMagic("Ying&Yang");
    }
    if (roll > 2 && roll <= 6) {
      const randomMagic = Math.random() * 100;
      if (randomMagic <= 50) {
        setNatureMagic("Luz");
      } else {
        setNatureMagic("Escuridao");
      }
    }
    if (roll > 6 && roll <= 24) {
      setNatureMagic("Fogo");
    }
    if (roll > 24 && roll <= 42) {
      setNatureMagic("Agua");
    }
    if (roll > 42 && roll <= 60) {
      setNatureMagic("Ar");
    }
    if (roll > 60 && roll <= 78) {
      setNatureMagic("Terra");
    }
    if (roll > 78 && roll <= 100) {
      setNatureMagic("Raio");
    }

    setIsLoading(true);
    const result = await saveTempCharacterData({
      nome: name,
      genero: gender,
      id_raca: selectedRace,
      nivel: 1,
      experiencia: 0,
      dinheiro: 15,
      vida_atual: 100,
      mana_atual: 50,
      pontos_distribuir: 0,
      rank: "F",
      reset: 0,
      natureza_magica: natureMagic,
      forca: currentRaceTempory.bonus_forca,
      vitalidade: currentRaceTempory.bonus_vitalidade,
      agilidade: currentRaceTempory.bonus_agilidade,
      inteligencia: currentRaceTempory.bonus_inteligencia,
      velocidade: currentRaceTempory.bonus_velocidade,
      id_usuario: cookiesUser.id,
    });

    setIsLoading(false);

    if (result.success) {
      router.push("/classselection");
    } else {
      setErrorMessage(result.message || "Erro desconhecido ao prosseguir.");
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/images/homeMedieval.png')" }}
    >
      <div className="bg-[#292018] p-8 rounded-lg shadow-xl w-[600px] border-[#F3B43F] border-4 font-imFeel text-white">
        <h2 className="text-4xl text-center text-[#F3B43F] mb-6">
          Escolha sua Raça
        </h2>

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

          <div className="mb-6 flex items-center justify-center space-x-8">
            <label className="flex items-center cursor-pointer text-2xl">
              <input
                type="radio"
                name="gender"
                value="Masculino"
                checked={gender === "Masculino"}
                onChange={() => setGender("Masculino")}
                className="hidden"
              />
              <span className="w-6 h-6 border-2 border-[#F3B43F] rounded-full flex items-center justify-center mr-2">
                {gender === "Masculino" && (
                  <span className="w-3 h-3 bg-[#F3B43F] rounded-full"></span>
                )}
              </span>
              Masculino
            </label>
            <label className="flex items-center cursor-pointer text-2xl">
              <input
                type="radio"
                name="gender"
                value="feminino"
                checked={gender === "feminino"}
                onChange={() => setGender("feminino")}
                className="hidden"
              />
              <span className="w-6 h-6 border-2 border-[#F3B43F] rounded-full flex items-center justify-center mr-2">
                {gender === "feminino" && (
                  <span className="w-3 h-3 bg-[#F3B43F] rounded-full"></span>
                )}
              </span>
              Feminino
            </label>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            {racesData[0]
              .sort((a, b) => Number(a.id) - Number(b.id))
              .map((race) => (
                <div
                  key={race.id}
                  className={`relative p-2 rounded-lg cursor-pointer transition-all duration-200
                  ${
                    selectedRace === race.id
                      ? "border-4 border-[#F3B43F] bg-[#3a2f24]"
                      : "border-4 border-transparent hover:border-[#F3B43F]/50"
                  }`}
                  onClick={() => setSelectedRace(race.id)}
                >
                  <Tooltip
                    content={{
                      forca: race.bonus_forca,
                      vitalidade: race.bonus_vitalidade,
                      agilidade: race.bonus_agilidade,
                      inteligencia: race.bonus_inteligencia,
                      velocidade: race.bonus_velocidade,
                    }}
                    position="bottom"
                  >
                    <div
                      className="w-24 h-24 mx-auto mb-2 bg-gray-700 rounded-full overflow-hidden flex items-center justify-center"
                      style={{
                        backgroundImage: `url(${
                          gender === "Masculino"
                            ? race.imagem_masculina_url
                            : race.imagem_feminina_url
                        })`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    ></div>
                  </Tooltip>
                  <p className="text-center text-xl text-[#F3B43F]">
                    {gender === "Masculino"
                      ? race.nome_masculino
                      : race.nome_feminino}
                  </p>
                </div>
              ))}
          </div>

          <div className="bg-[#DFC492] border-2 border-[#F3B43F] p-4 rounded-md mb-6 h-32 flex items-center justify-center text-center">
            <p className="text-xl text-[#1f1813] leading-relaxed font-bold">
              {currentRaceDescription}
            </p>
          </div>

          {errorMessage && (
            <p className="text-red-500 text-center mb-1 text-xl">
              {errorMessage}
            </p>
          )}

          <div className="flex justify-center">
            <button
              type="submit"
              className="h-[51px] bg-[#8D6825] font-imFeel text-white text-4xl hover:bg-gradient-to-b rounded-2xl cursor-pointer hover:to-[#8D6825] hover:from-[#684424] border-[#F3B43F] border-4 transition-all duration-200 w-max"
              disabled={isLoading}
            >
              {isLoading ? "PROSSEGUINDO..." : "CONFIRMAR"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
