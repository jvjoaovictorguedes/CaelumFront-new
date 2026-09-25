"use server";

import { cookies } from "next/headers";
import { TOKEN_KEY } from "@/constants";

// Mesmo raciocínio de emblemAction.ts (upload do emblema de guilda):
// upload de arquivo binário não pode passar pelo proxy genérico
// /api/backend/[...path] (route.ts) — aquele handler lê o corpo inteiro
// via request.text(), o que corrompe bytes binários. Uma action própria
// que recebe FormData e repassa DIRETO pro fetch evita isso por completo.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function enviarMediaAdmin(formData: FormData) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_KEY)?.value;
    if (!token) {
      return { success: false, message: "Sua sessão expirou. Faça login novamente." };
    }

    // Nunca definir "content-type" manualmente aqui — o fetch/undici
    // calcula o boundary do multipart sozinho a partir do FormData.
    const resposta = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/admin/media`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: formData,
      cache: "no-store",
    });

    const corpo = (await resposta.json().catch(() => null)) as
      | { message?: string; data?: { asset?: { grupo: string; versao: number } } }
      | null;

    if (!resposta.ok) {
      return { success: false, message: corpo?.message || "Não foi possível enviar o arquivo." };
    }
    return { success: true, asset: corpo?.data?.asset };
  } catch (error) {
    console.error("Erro ao enviar mídia (admin):", error);
    return { success: false, message: "Não foi possível falar com o servidor do jogo agora." };
  }
}
