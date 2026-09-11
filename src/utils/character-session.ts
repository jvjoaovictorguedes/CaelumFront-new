import { cookies } from "next/headers";
import axiosInstance from "./axiosIntance";

interface CurrentCharacter {
  id: number;
  nome: string;
  genero: string;
  nivel: number;
  experiencia?: number;
  vida_atual: number;
  vida_maxima?: number;
  mana_atual: number;
  forca: number;
  vitalidade: number;
  agilidade: number;
  inteligencia: number;
  velocidade: number;
  dinheiro?: number;
  pontos_distribuir?: number;
  rank?: string;
  Race?: {
    nome?: string;
    nome_masculino?: string;
    nome_feminino?: string;
    bonus_agilidade: number;
    bonus_forca: number;
    bonus_inteligencia: number;
    bonus_velocidade: number;
    bonus_vitalidade: number;
    descricao_feminina: string;
    descricao_masculina: string;
    id: string;
    imagem_feminina_url: string;
    imagem_masculina_url: string;
  };
  Class?: {
    nome?: string;
  };
}

interface CurrentCharacterResponse {
  data?: {
    character?: CurrentCharacter;
  };
}

export async function getCurrentCharacter() {
  const cookieStore = await cookies();
  const characterId = cookieStore.get("characterId")?.value;

  if (!characterId) {
    return null;
  }

  try {
    const response = await axiosInstance.get<CurrentCharacterResponse>(
      `/characters/${characterId}`,
    );
    return response.data?.data?.character ?? null;
  } catch (error) {
    console.error("Erro ao buscar personagem atual:", error);
    return null;
  }
}

export async function getCurrentCharacterId() {
  const cookieStore = await cookies();
  return cookieStore.get("characterId")?.value ?? null;
}
