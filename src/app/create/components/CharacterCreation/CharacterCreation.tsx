"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosIntance";
import {
  getUserCookie,
  saveTempCharacterData,
} from "../../temp-character-data-action";
import Tooltip from "@/components/Tooltip/Tooltip";
import { getRaceImage } from "@/utils/media-url";

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
    bonus_vitalidade: Number(
      rawRace.bonus_vitalidade ?? rawRace.vitalidade ?? 0,
    ),
    bonus_agilidade: Number(rawRace.bonus_agilidade ?? rawRace.agilidade ?? 0),
    bonus_inteligencia: Number(
      rawRace.bonus_inteligencia ?? rawRace.inteligencia ?? 0,
    ),
    bonus_velocidade: Number(
      rawRace.bonus_velocidade ?? rawRace.velocidade ?? 0,
    ),
  };
}

export default function CharacterCreation() {
  const router = useRouter();

  const [name, setCharacterName] = useState("");
  const [gender, setGender] = useState<"Masculino" | "feminino">("Masculino");
  const [selectedRace, setSelectedRace] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingRaces, setLoadingRaces] = useState(true);
  const [rawRacesObject, setrawRacesObject] = useState<RaceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cookiesUser, setCookiesUser] = useState<UserCookie | null>(null);
  const [rareRace, setRareRace] = useState<RaceData | null>(null);
  const [rareRaceRevealed, setRareRaceRevealed] = useState(false);

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        const cookieStore = await getUserCookie();
        setCookiesUser(cookieStore);
        setLoadingRaces(true);
        const response = await axiosInstance.get<{
          data?: { races?: unknown[] } | unknown[];
          races?: unknown[];
        }>("/races");
        const payload = response.data?.data;
        const races = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.races)
            ? payload.races
            : Array.isArray(response.data?.races)
              ? response.data.races
              : [];

        if (races.length > 0) {
          const normalizedRaces = races.map((race: unknown) =>
            normalizeRace(race as Record<string, unknown>),
          );
          const rareRaces = normalizedRaces.filter((race: RaceData) =>
            race.nome_masculino.toLowerCase().includes("celestial"),
          );
          const commonRaces = normalizedRaces.filter(
            (race: RaceData) =>
              !rareRaces.some((rareRace: RaceData) => rareRace.id === race.id),
          );
          const availableRaces =
            commonRaces.length > 0 ? commonRaces : normalizedRaces;

          setrawRacesObject(availableRaces);
          setSelectedRace(availableRaces[0].id);

          if (rareRaces.length > 0) {
            setRareRace(rareRaces[0]);
          }
        } else {
          console.error(
            "A API /races não retornou raças em um formato reconhecido:",
            response.data,
          );
          setErrorMessage("Nenhuma raça foi encontrada na API.");
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

  if (errorMessage && rawRacesObject.length === 0) {
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
    if (!currentRaceTempory || !cookiesUser) {
      setErrorMessage("Não foi possível carregar os dados da raça ou usuário.");
      return;
    }

    if (!rareRaceRevealed) {
      setRareRaceRevealed(true);
      if (rareRace && Math.random() * 100 <= 0.01) {
        setrawRacesObject((currentRaces) =>
          currentRaces.some((race) => race.id === rareRace.id)
            ? currentRaces
            : [...currentRaces, rareRace],
        );
        setErrorMessage(
          "Uma raça Celestial apareceu. Você pode escolhê-la ou manter sua raça atual e confirmar novamente.",
        );
        return;
      }
    }

    const roll = Math.random() * 100;
    let naturezaMagica = "Raio";

    if (roll <= 2) {
      naturezaMagica = "Ying&Yang";
    }
    if (roll > 2 && roll <= 6) {
      const randomMagic = Math.random() * 100;
      if (randomMagic <= 50) {
        naturezaMagica = "Luz";
      } else {
        naturezaMagica = "Escuridao";
      }
    }
    if (roll > 6 && roll <= 24) {
      naturezaMagica = "Fogo";
    }
    if (roll > 24 && roll <= 42) {
      naturezaMagica = "Agua";
    }
    if (roll > 42 && roll <= 60) {
      naturezaMagica = "Ar";
    }
    if (roll > 60 && roll <= 78) {
      naturezaMagica = "Terra";
    }
    if (roll > 78 && roll <= 100) {
      naturezaMagica = "Raio";
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
      natureza_magica: naturezaMagica,
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
      <div className="w-full max-w-[600px] rounded-lg border-4 border-[#F3B43F] bg-[#292018] p-4 font-imFeel text-white shadow-xl sm:p-8">
        <h2 className="mb-6 text-center text-3xl text-[#F3B43F] sm:text-4xl">
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
                {gender === "Masculino" && (
                  <span className="w-3 h-3 bg-[#F3B43F] rounded-full"></span>
                )}
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
                {gender === "feminino" && (
                  <span className="w-3 h-3 bg-[#F3B43F] rounded-full"></span>
                )}
              </span>
              Feminino
            </label>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
            {rawRacesObject
              .slice()
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
                      className="mx-auto mb-2 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gray-700 sm:h-24 sm:w-24"
                      style={{
                        backgroundImage: `url(${getRaceImage(
                          gender === "Masculino"
                            ? race.nome_masculino
                            : race.nome_feminino,
                          gender,
                          gender === "Masculino"
                            ? race.imagem_masculina_url
                            : race.imagem_feminina_url,
                        )})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    ></div>
                  </Tooltip>
                  <p className="text-center text-base text-[#F3B43F] sm:text-xl">
                    {gender === "Masculino"
                      ? race.nome_masculino
                      : race.nome_feminino}
                  </p>
                </div>
              ))}
          </div>

          <div className="mb-6 flex min-h-32 items-center justify-center rounded-md border-2 border-[#F3B43F] bg-[#DFC492] p-4 text-center">
            <p className="text-lg font-bold leading-relaxed text-[#1f1813] sm:text-xl">
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
