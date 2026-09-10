import { cookies } from "next/headers";
import axiosInstance from "./axiosIntance";

interface CurrentCharacter {
  id: number;
  nome: string;
  genero: string;
  nivel: number;
  experiencia?: number;
  vida_atual: number;
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
    imagem_masculina_url?: string;
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

// Helper de servidor: pega o id do personagem salvo no login e busca os
// dados completos dele na API. Usado pelas páginas do dashboard
// (personagem, inventário, aventura) para não duplicar essa lógica.
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
