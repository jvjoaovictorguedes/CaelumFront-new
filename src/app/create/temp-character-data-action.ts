// src/app/create/actions/temp-character-data-action.ts
"use server";

import { cookies } from "next/headers";

const TEMP_CHARACTER_KEY = "tempCharacterData";

export async function getUserCookie() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("user");
  if (userCookie) {
    return JSON.parse(userCookie.value);
  }
  return null;
}

// A tela de criação de personagem (CharacterCreation.tsx) hoje escolhe
// raça e classe na mesma tela e cria o personagem direto — não guarda
// mais nada nesse cookie. A função de limpeza continua existindo (e
// sendo chamada em create/action.ts) só pra apagar qualquer resquício
// que uma sessão antiga, do fluxo de duas telas, ainda tenha deixado.
export async function clearTempCharacterData() {
  const cookieStore = await cookies();
  cookieStore.delete(TEMP_CHARACTER_KEY);
  return { success: true };
}
