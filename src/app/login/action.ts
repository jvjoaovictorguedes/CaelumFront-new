"use server";

import { cookies } from "next/headers";
import { TOKEN_KEY } from "../../constants/index";
import axiosInstance from "@/utils/axiosIntance";
import axios from "axios";

interface LoginResponseData {
  token: string;
  data: {
    user: {
      id: string;
    };
  };
}

interface CharacterLookupResponse {
  data?: {
    character?: {
      id: string | number;
    };
  };
}

interface CookiesData {
  email: string;
  password: string;
  rememberMe?: boolean;
}
export async function login(data: CookiesData) {
  try {
    const response = await axiosInstance.post<LoginResponseData>(
      "/users/login",
      {
        email: data.email,
        password: data.password,
        // O backend usa isso pra decidir a validade do JWT em si (curta
        // por padrão, ~7 dias com lembrar-me) — sem mandar isso, o
        // cookie durava 7 dias mas o token expirava em 1h de qualquer
        // jeito, e "lembrar-me" não funcionava de verdade.
        rememberMe: Boolean(data.rememberMe),
      },
    );

    const { token, data: userData } = response.data;

    // "Lembrar-me" decide se os cookies sobrevivem ao fechamento do
    // navegador: marcado, viram cookies persistentes (7 dias); desmarcado,
    // viram cookies de sessão (sem maxAge) — o navegador os apaga ao
    // fechar, então da próxima vez o usuário precisa logar de novo.
    const maxAge = data.rememberMe ? 60 * 60 * 24 * 7 : undefined;

    // O cookie do token precisa ser setado ANTES da busca do personagem
    // logo abaixo: /characters/by-user agora exige authMiddleware (fecha
    // aqui um buraco que existia antes), e o axiosInstance do lado do
    // servidor só anexa o Bearer lendo esse mesmo cookie via
    // cookies().get(). Com a ordem invertida (como estava antes), a
    // busca saía sem token, o backend respondia 401, e o login parecia
    // ter dado erro genérico mesmo tendo funcionado.
    const cookieStore = await cookies();
    cookieStore.set("user", JSON.stringify(userData.user), {
      maxAge,
      path: "/",
    });
    cookieStore.set(TOKEN_KEY, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge,
      path: "/",
    });

    const character = await axiosInstance.get<CharacterLookupResponse>(
      `/characters/by-user/${userData.user.id}`,
      {
        validateStatus: (status) => status <= 404,
      },
    );
    const characterId = character.data?.data?.character?.id;

    if (character.status === 200 && characterId !== undefined) {
      const cookieStore = await cookies();
      const notCharacter = false;
      cookieStore.set("notCharacter", JSON.stringify(notCharacter), {
        maxAge,
        path: "/",
      });

      cookieStore.set("characterId", String(characterId), {
        maxAge,
        path: "/",
      });
    }
    if (character.status === 404) {
      const cookieStore = await cookies();
      cookieStore.delete("characterId");
      const notCharacter = true;
      cookieStore.set("notCharacter", JSON.stringify(notCharacter), {
        maxAge,
        path: "/",
      });
    }

    console.log(
      "Usuário logado com sucesso (Server Action):",
      userData.user.id,
    );
    return {
      success: true,
      userId: userData.user.id,
      character: character.status,
    };
  } catch (error: unknown) {
    const message = axios.isAxiosError(error)
      ? error.response?.data?.message
      : error instanceof Error
        ? error.message
        : undefined;
    console.error("Erro ao logar usuário (Server Action):", message);
    return {
      success: false,
      message: message || "Email ou senha incorretos. Tente novamente.",
    };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_KEY);
  cookieStore.delete("user");
  // Sem isso, characterId/notCharacter sobreviviam ao logout: a próxima
  // conta a logar neste mesmo navegador podia herdar, por um instante,
  // o characterId da sessão anterior (até login() sobrescrever de
  // novo), e um "notCharacter" desatualizado confundia o fluxo de
  // criação de personagem.
  cookieStore.delete("characterId");
  cookieStore.delete("notCharacter");
  return { success: true };
}
