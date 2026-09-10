import { cookies } from "next/headers";
import axiosInstance from "./axiosIntance";

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
    const response = await axiosInstance.get(`/characters/${characterId}`);
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
