"use server";

import axiosInstance from "@/utils/axiosIntance";
import axios from "axios";

export async function resetPassword(token: string, password: string) {
  try {
    const response = await axiosInstance.post<{ message?: string }>(
      "/users/reset-password",
      { token, password },
    );
    return {
      success: true,
      message: response.data?.message || "Senha redefinida com sucesso.",
    };
  } catch (error: unknown) {
    const message = axios.isAxiosError(error)
      ? error.response?.data?.message
      : undefined;
    return {
      success: false,
      message: message || "Não foi possível redefinir sua senha. Tente novamente.",
    };
  }
}
