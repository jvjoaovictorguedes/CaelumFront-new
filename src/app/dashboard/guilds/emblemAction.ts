"use server";

import { cookies } from "next/headers";
import { TOKEN_KEY } from "@/constants";

// Upload de arquivo binário (imagem) não pode passar pelo proxy
// genérico /api/backend/[...path] (route.ts) — aquele handler lê o
// corpo inteiro via request.text(), o que corrompe bytes binários
// (decodificação de texto não é round-trip seguro pra um PNG/JPEG).
// Uma action própria que recebe FormData e repassa DIRETO pro fetch
// evita esse problema por completo: nunca decodifica os bytes do
// arquivo como string em nenhum momento.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function enviarEmblemaDaGuild(idGuild: number, formData: FormData) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_KEY)?.value;
    if (!token) {
      return { success: false, message: "Sua sessão expirou. Faça login novamente." };
    }

    // Nunca definir "content-type" manualmente aqui — o fetch/undici
    // calcula o boundary do multipart sozinho a partir do FormData; um
    // header fixo sem esse boundary quebraria o parse no backend.
    const resposta = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/guilds/${idGuild}/emblem`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: formData,
      cache: "no-store",
    });

    const corpo = (await resposta.json().catch(() => null)) as
      | { message?: string; data?: { emblema_url?: string } }
      | null;

    if (!resposta.ok) {
      return { success: false, message: corpo?.message || "Não foi possível enviar a imagem." };
    }
    return { success: true, emblemaUrl: corpo?.data?.emblema_url };
  } catch (error) {
    console.error("Erro ao enviar emblema da guilda:", error);
    return { success: false, message: "Não foi possível falar com o servidor do jogo agora." };
  }
}
