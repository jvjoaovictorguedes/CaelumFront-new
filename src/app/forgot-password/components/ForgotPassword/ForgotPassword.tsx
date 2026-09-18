"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { requestPasswordReset } from "../../action";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [enviado, setEnviado] = useState(false);

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback("");

    if (!email || !isValidEmail(email)) {
      setFeedback("Por favor, insira um e-mail válido.");
      return;
    }

    setIsLoading(true);
    const result = await requestPasswordReset(email);
    setIsLoading(false);

    // Sempre mostra a mesma mensagem de sucesso do backend, exista ou
    // não uma conta com esse e-mail — isso é intencional (evita que
    // alguém use essa tela pra descobrir quais e-mails estão
    // cadastrados no jogo).
    setFeedback(result.message);
    setEnviado(result.success);
  };

  return (
    <div className="h-fit min-h-[420px] w-[calc(100%-2rem)] max-w-[443px] rounded-lg border-4 border-[#F3B43F] bg-[#292018] p-5 shadow-md sm:p-8">
      <h1 className="mb-6 text-center font-imFeel text-4xl font-bold text-transparent sm:text-6xl bg-gradient-to-b from-[#F3B43F] to-[#8D6825] bg-clip-text">
        ESQUECI MINHA SENHA
      </h1>

      {!enviado ? (
        <form onSubmit={handleSubmit}>
          <p className="mb-4 text-center font-imFeel text-lg text-white/80">
            Informe o e-mail da sua conta. Se ele existir, mandamos um link para
            redefinir sua senha.
          </p>
          <div className="flex justify-center mb-4">
            <input
              type="email"
              className="w-full px-3 py-2 text-[18px] text-black bg-[#DFC492] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-imFeel"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              {isLoading ? "ENVIANDO..." : "ENVIAR LINK"}
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
              VOLTAR AO LOGIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
