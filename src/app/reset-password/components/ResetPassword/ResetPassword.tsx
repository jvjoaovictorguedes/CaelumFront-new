"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { resetPassword } from "../../action";

const SENHA_MIN_CARACTERES = 8;

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [sucesso, setSucesso] = useState(false);

  const senhaValida = (valor: string) =>
    valor.length >= SENHA_MIN_CARACTERES && /^(?=.*[A-Za-z])(?=.*\d).+$/.test(valor);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback("");

    if (!token) {
      setFeedback("Link inválido. Solicite um novo link de redefinição.");
      return;
    }
    if (!senhaValida(password)) {
      setFeedback(
        `A senha deve ter pelo menos ${SENHA_MIN_CARACTERES} caracteres e incluir letras e números.`,
      );
      return;
    }
    if (password !== confirmarSenha) {
      setFeedback("As senhas não coincidem.");
      return;
    }

    setIsLoading(true);
    const result = await resetPassword(token, password);
    setIsLoading(false);

    setFeedback(result.message);
    setSucesso(result.success);
  };

  if (!token) {
    return (
      <div className="h-fit min-h-[300px] w-[calc(100%-2rem)] max-w-[443px] rounded-lg border-4 border-[#F3B43F] bg-[#292018] p-5 shadow-md sm:p-8">
        <h1 className="mb-6 text-center font-imFeel text-3xl font-bold text-white sm:text-4xl">
          Link inválido
        </h1>
        <p className="mb-6 text-center font-imFeel text-lg text-white/80">
          Esse link de redefinição de senha está incompleto ou inválido. Peça um
          novo na tela de &quot;esqueci minha senha&quot;.
        </p>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => router.push("/forgot-password")}
            className="w-[258px] h-[51px] bg-[#8D6825] font-imFeel text-white text-3xl hover:bg-gradient-to-b rounded-2xl cursor-pointer hover:to-[#8D6825] hover:from-[#684424] border-[#F3B43F] border-4"
          >
            SOLICITAR NOVO LINK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-fit min-h-[460px] w-[calc(100%-2rem)] max-w-[443px] rounded-lg border-4 border-[#F3B43F] bg-[#292018] p-5 shadow-md sm:p-8">
      <h1 className="mb-6 text-center font-imFeel text-4xl font-bold text-transparent sm:text-5xl bg-gradient-to-b from-[#F3B43F] to-[#8D6825] bg-clip-text">
        NOVA SENHA
      </h1>

      {!sucesso ? (
        <form onSubmit={handleSubmit}>
          <div className="flex justify-center mb-4">
            <input
              type="password"
              className="w-full px-3 py-2 text-[18px] text-black bg-[#DFC492] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-imFeel"
              placeholder="Nova senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-center mb-4">
            <input
              type="password"
              className="w-full px-3 py-2 text-[18px] text-black bg-[#DFC492] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-imFeel"
              placeholder="Confirmar nova senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              disabled={isLoading}
            />
          </div>
          {feedback && (
            <p className="mb-4 text-center font-imFeel text-[16px] text-red-400">
              {feedback}
            </p>
          )}
          <div className="flex justify-center">
            <button
              type="submit"
              className="w-[258px] h-[51px] bg-[#8D6825] font-imFeel text-white text-3xl hover:bg-gradient-to-b rounded-2xl cursor-pointer hover:to-[#8D6825] hover:from-[#684424] border-[#F3B43F] border-4"
              disabled={isLoading}
            >
              {isLoading ? "SALVANDO..." : "REDEFINIR SENHA"}
            </button>
          </div>
        </form>
      ) : (
        <div>
          <p className="mb-6 text-center font-imFeel text-lg text-white/90">
            {feedback}
          </p>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-[258px] h-[51px] bg-[#8D6825] font-imFeel text-white text-3xl hover:bg-gradient-to-b rounded-2xl cursor-pointer hover:to-[#8D6825] hover:from-[#684424] border-[#F3B43F] border-4"
            >
              IR PARA O LOGIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
