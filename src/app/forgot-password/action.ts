"use server";

import axiosInstance from "@/utils/axiosIntance";
import axios from "axios";

export async function requestPasswordReset(email: string) {
  try {
    const response = await axiosInstance.post<{ message?: string }>(
      "/users/forgot-password",
      { email },
    );
    return {
      success: true,
      message:
        response.data?.message ||
        "Se existir uma conta com esse e-mail, enviamos um link de redefinição de senha para ela.",
    };
  } catch (error: unknown) {
    // O backend sempre responde 200 com mensagem genérica pra esse
    // endpoint (evita confirmar se um e-mail existe ou não) — um erro
    // aqui só acontece por falha de rede/servidor mesmo.
    const message = axios.isAxiosError(error)
      ? error.response?.data?.message
      : undefined;
    return {
      success: false,
      message: message || "Não foi possível processar seu pedido agora. Tente novamente em instantes.",
    };
  }
}
