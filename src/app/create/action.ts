"use server";

import axiosInstance from "@/utils/axiosIntance";
import { cookies } from "next/headers";
import { clearTempCharacterData } from "./temp-character-data-action";

interface CreateCharacterData {
  nome: string;
  genero: string;
  id_raca: string;
  id_classe: string;
  nivel?: number;
  experiencia?: number;
  vida_atual?: number;
  mana_atual?: number;
  forca?: number;
  vitalidade?: number;
  agilidade?: number;
  inteligencia?: number;
  velocidade?: number;
  dinheiro?: number;
  id_usuario?: string;
}

export async function createCharacter(data: CreateCharacterData) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("user");
    if (!userCookie) {
      throw new Error("Usuário não encontrado nos cookies.");
    }
    const user = JSON.parse(userCookie.value);

    const response = await axiosInstance.post("/characters", {
      ...data,
      id_usuario: user.id,
    });
    const createdCharacter =
      response.data?.data?.character ??
      response.data?.character ??
      response.data?.data;
    const characterId = createdCharacter?.id;

    cookieStore.set("notCharacter", "false", {
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    if (characterId) {
      cookieStore.set("characterId", String(characterId), {
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }
    await clearTempCharacterData();

    console.log("Personagem criado com sucesso:", response.data);
    return { success: true, character: response.data };
  } catch (error) {
    console.error("Erro ao criar personagem:", error);
    return { success: false, message: "Erro ao criar personagem." };
  }
}
