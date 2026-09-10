"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { login } from "../../action";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const result = await login({ email, password });

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
        `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`
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
    <div className="bg-[#292018] p-8 rounded-lg shadow-md w-[443px] max-w-sm inset-0 m-auto absolute h-[500px] border-[#F3B43F] border-4">
      <h1 className="text-2xl font-bold mb-6 text-center font-imFeel text-[86px] bg-gradient-to-b from-[#F3B43F] to-[#8D6825] bg-clip-text text-transparent">
        LOGIN
      </h1>
      <form onSubmit={handleSubmit}>
        <div className="flex justify-center mb-4">
          <input
            type="email"
            id="email"
            className="w-[364px] px-3 py-2 text-black bg-[#DFC492] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-[#DFC492] font-imFeel text-[18px]"
            placeholder="Usuário"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            disabled={isLoading}
          />
        </div>
        <div className="flex justify-center mb-4 flex-wrap">
          <input
            type="password"
            id="password"
            className="w-[364px] px-3 py-2 text-black bg-[#DFC492] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-imFeel text-[18px] focus:bg-[#DFC492]"
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
            Lembrar-me a senha
          </label>
        </div>
      </form>
    </div>
  );
}
