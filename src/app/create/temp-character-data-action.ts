// src/app/create/actions/temp-character-data-action.ts
"use server";

import { cookies } from "next/headers";

const TEMP_CHARACTER_KEY = "tempCharacterData";

// Chamada em TODA página do site (RootLayout em layout.tsx usa pra
// resolver currentUserId antes de montar qualquer provider) — um
// JSON.parse sem try/catch aqui derrubava com exceção não tratada o
// render de QUALQUER página pra quem tivesse esse cookie corrompido
// (ex.: JSON.stringify(undefined) grava a string literal "undefined",
// que não é JSON válido — bug real visto em produção, log cheio de
// `SyntaxError: "undefined" is not valid JSON`). Cookie inválido agora
// só vira "sem usuário" (mesmo efeito de não estar logado) em vez de
// quebrar a página inteira, e é apagado pra parar de falhar de novo a
// cada navegação.
export async function getUserCookie() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("user");
  if (!userCookie) return null;
  try {
    return JSON.parse(userCookie.value);
  } catch (error) {
    console.error("Cookie 'user' corrompido, ignorando:", error);
    cookieStore.delete("user");
    return null;
  }
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
