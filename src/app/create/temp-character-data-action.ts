// src/app/create/actions/temp-character-data-action.ts
"use server";

import { cookies } from "next/headers";

interface TempCharacterData {
  nome?: string;
  genero?: string;
  id_raca?: string;
  id_classe?: string;
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
  pontos_distribuir?: number;
  rank?: string;
  reset?: number;
  natureza_magica?: string;
}

const TEMP_CHARACTER_KEY = "tempCharacterData";

export async function saveTempCharacterData(data: TempCharacterData) {
  try {
    const cookieStore = await cookies();
    const existingData = cookieStore.get(TEMP_CHARACTER_KEY);
    let parsedExistingData: TempCharacterData = {};
    if (existingData) {
      parsedExistingData = JSON.parse(existingData.value);
    }

    const newData = { ...parsedExistingData, ...data };

    cookieStore.set(TEMP_CHARACTER_KEY, JSON.stringify(newData), {
      maxAge: 60 * 10,
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar dados temporários do personagem:", error);
    return { success: false, message: "Erro ao salvar dados temporários." };
  }
}

export async function getTempCharacterData(): Promise<TempCharacterData | null> {
  const cookieStore = await cookies();
  const tempCookie = cookieStore.get(TEMP_CHARACTER_KEY);
  if (tempCookie) {
    return JSON.parse(tempCookie.value);
  }
  return null;
}

export async function getUserCookie() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("user");
  if (userCookie) {
    return JSON.parse(userCookie.value);
  }
  return null;
}

export async function clearTempCharacterData() {
  const cookieStore = await cookies();
  cookieStore.delete(TEMP_CHARACTER_KEY);
  return { success: true };
}
