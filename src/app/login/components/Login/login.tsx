"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { login } from "../../action";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // O middleware manda pra cá com ?expired=1 quando detecta que o token
  // do jogador não é mais aceito pelo backend (expirou ou foi
  // invalidado) — sem isso, a sessão simplesmente caía sem nenhum aviso
  // e a próxima ação dentro do jogo só dava erro sem explicação.
  useEffect(() => {
    if (searchParams.get("expired") === "1") {
      setErrorMessage("Sua sessão expirou. Faça login novamente.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const result = await login({ email, password, rememberMe });

    if (isLoading) return;

    if (!email || !password) {
      setErrorMessage("Por favor, preencha todos os campos.");
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMessage("Por favor, insira um e-mail válido.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(
        `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      );
      return;
    }
    setIsLoading(false);

    if (result.success && result.character === 200) {
      alert("Login bem-sucedido! Redirecionando...");
      router.push("/dashboard");
    } else if (result.success && result.character === 404) {
      alert("Login bem-sucedido! Redirecionando...");
      router.push("/create");
    } else {
      setErrorMessage(result.message || "Erro desconhecido ao fazer login.");
    }
  };

  const MIN_PASSWORD_LENGTH = 6;

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleRegisterClick = (event: React.MouseEvent) => {
    event.preventDefault();
    router.push("/register");
  };

  return (
    <div className="h-fit min-h-[500px] w-[calc(100%-2rem)] max-w-[443px] rounded-lg border-4 border-[#F3B43F] bg-[#292018] p-5 shadow-md sm:p-8">
      <h1 className="mb-6 text-center font-imFeel text-5xl font-bold text-transparent sm:text-[86px] bg-gradient-to-b from-[#F3B43F] to-[#8D6825] bg-clip-text">
        LOGIN
      </h1>
      <form onSubmit={handleSubmit}>
        <div className="flex justify-center mb-4">
          <input
            type="email"
            id="email"
            className="w-full px-3 py-2 text-[18px] text-black bg-[#DFC492] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-[#DFC492] font-imFeel"
            placeholder="E-mail"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            disabled={isLoading}
          />
        </div>
        <div className="flex justify-center mb-4 flex-wrap">
          <input
            type="password"
            id="password"
            className="w-full px-3 py-2 text-[18px] text-black bg-[#DFC492] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-imFeel focus:bg-[#DFC492]"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
          {errorMessage && (
            <p className="text-red-500 text-center font-imFeel text-[14px] h-[10px] mt-1">
              {errorMessage}
            </p>
          )}
        </div>
        <div className="flex justify-center flex-wrap">
          <button
            type="submit"
            className="w-[258px] h-[51px] bg-[#8D6825] font-imFeel text-white text-4xl mb-4 hover:bg-gradient-to-b rounded-2xl cursor-pointer hover:to-[#8D6825] hover:from-[#684424] border-[#F3B43F] border-4"
            disabled={isLoading}
          >
            {isLoading ? "Entrando..." : "LOGAR"}
          </button>
          <button
            type="button"
            onClick={handleRegisterClick}
            className="w-[258px] h-[51px] bg-[#8D6825] font-imFeel text-white text-4xl hover:bg-gradient-to-b rounded-2xl hover:to-[#8D6825] hover:from-[#684424] cursor-pointer border-[#F3B43F] border-4"
            disabled={isLoading}
          >
            REGISTRAR
          </button>
        </div>
        <div className="flex items-center justify-center mt-4">
          <button
            type="button"
            onClick={() => router.push("/forgot-password")}
            className="font-imFeel text-lg text-[#F3B43F] underline hover:text-white"
          >
            Esqueci minha senha
          </button>
        </div>
        <div className="flex items-center justify-center mt-3">
          <label
            htmlFor="remember"
            className="flex items-center cursor-pointer font-imFeel text-2xl"
          >
            <input
              type="checkbox"
              id="remember"
              name="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="hidden"
              disabled={isLoading}
            />
            <span className="w-6 h-6 border-2 border-[#F3B43F] rounded-full flex items-center justify-center mr-2">
              {rememberMe && (
                <span className="w-3 h-3 bg-[#F3B43F] rounded-full"></span>
              )}
            </span>
            Lembrar-me
          </label>
        </div>
      </form>
    </div>
  );
}
