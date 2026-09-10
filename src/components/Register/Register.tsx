"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import axiosInstance from "@/utils/axiosIntance";

export default function Register() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function registerUser() {
    const userData = {
      username: username,
      email: email,
      password: password,
    };

    try {
      const response = await axiosInstance.post("/users/register", userData);
      console.log("Usuário registrado com sucesso:", response.data);
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data
        : error instanceof Error
          ? error.message
          : error;
      console.error("Erro ao registrar usuário:", message);
    }
  }

  const MIN_USERNAME_LENGTH = 3;
  const MAX_USERNAME_LENGTH = 20;
  const MIN_PASSWORD_LENGTH = 8;
  const PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const isValidEmail = (email: string) => EMAIL_REGEX.test(email);

  const handleRegisterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");

    if (isLoading) return;

    if (!username || !password || !confirmPassword || !email || !confirmEmail) {
      setErrorMessage("Por favor, preencha todos os campos.");
      return;
    }
    if (
      username.length < MIN_USERNAME_LENGTH ||
      username.length > MAX_USERNAME_LENGTH
    ) {
      setErrorMessage(
        `O nome de usuário deve ter entre ${MIN_USERNAME_LENGTH} e ${MAX_USERNAME_LENGTH} caracteres.`,
      );
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMessage("Por favor, insira um e-mail válido.");
      return;
    }
    if (!isValidEmail(confirmEmail)) {
      setErrorMessage("Por favor, insira um e-mail de confirmação válido.");
      return;
    }
    if (email !== confirmEmail) {
      setErrorMessage("Os e-mails não coincidem.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(
        `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      );
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      setErrorMessage(
        "A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial.",
      );
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }
    if (!acceptTerms) {
      setErrorMessage("Você deve concordar com os Termos de Uso.");
      return;
    }

    setIsLoading(true);

    try {
      // Simulação de requisição ao backend (SUBSTITUA POR SUA API REAL)
      // Em um cenário real, você faria um fetch/axios para o seu endpoint de registro
      // await fetch('/api/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ username, email, password }),
      // });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log({ username, email, password, acceptTerms });
      alert("Registro bem-sucedido! Redirecionando para o login...");
      router.push("/login");
    } catch (error) {
      console.error("Erro durante o registro:", error);
      setErrorMessage("Ocorreu um erro ao tentar registrar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 m-auto h-fit min-h-[600px] w-[calc(100%-2rem)] max-w-[443px] rounded-lg border-4 border-[#F3B43F] bg-[#292018] p-5 shadow-md sm:p-8">
      <h1 className="mb-6 text-center font-imFeel text-5xl font-bold text-transparent sm:text-[59px] bg-gradient-to-b from-[#F3B43F] to-[#8D6825] bg-clip-text">
        REGISTRO
      </h1>
      <form onSubmit={handleRegisterSubmit}>
        {" "}
        <div className="flex justify-center mb-4">
          <input
            type="text"
            id="user"
            className="w-full px-3 py-2 text-[18px] text-black bg-[#DFC492] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-[#DFC492] font-imFeel"
            placeholder="Usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="flex justify-center mb-4">
          <input
            type="password"
            id="password"
            className="w-full px-3 py-2 text-[18px] text-black bg-[#DFC492] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-imFeel focus:bg-[#DFC492]"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="flex justify-center mb-4">
          <input
            type="password"
            id="confirm-password"
            className="w-full px-3 py-2 text-[18px] text-black bg-[#DFC492] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-imFeel focus:bg-[#DFC492]"
            placeholder="Confirmar Senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="flex justify-center mb-4">
          <input
            type="email"
            id="email"
            className="w-full px-3 py-2 text-[18px] text-black bg-[#DFC492] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-imFeel focus:bg-[#DFC492]"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="flex justify-center mb-4">
          <input
            type="email"
            id="confirm-email"
            className="w-full px-3 py-2 text-[18px] text-black bg-[#DFC492] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-imFeel focus:bg-[#DFC492]"
            placeholder="Confirmar E-mail"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        {errorMessage && (
          <p className="text-red-500 text-center font-imFeel text-[14px] h-max">
            {errorMessage}
          </p>
        )}
        <div className="flex justify-center flex-wrap">
          <div className="flex items-center justify-center mb-4">
            <label
              htmlFor="accept-terms"
              className="flex items-center cursor-pointer font-imFeel text-2xl mr-1"
            >
              <input
                type="checkbox"
                id="accept-terms"
                name="accept-terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="hidden"
                disabled={isLoading}
              />
              <span className="w-6 h-6 border-2 border-[#F3B43F] rounded-full flex items-center justify-center mr-2">
                {acceptTerms && (
                  <span className="w-3 h-3 bg-[#F3B43F] rounded-full"></span>
                )}
              </span>
              Concordo com os{" "}
            </label>
            <span className="text-blue-500 underline cursor-pointer hover:text-blue-400 font-imFeel text-2xl">
              Termos de Uso
            </span>
          </div>
          <button
            type="submit"
            onClick={registerUser}
            className="w-max h-[51px] bg-[#8D6825] font-imFeel text-white text-4xl mb-4 hover:bg-gradient-to-b rounded-2xl cursor-pointer hover:to-[#8D6825] hover:from-[#684424] border-[#F3B43F] border-4 items-center flex justify-center"
            disabled={isLoading}
          >
            {isLoading ? "REGISTRANDO..." : "REGISTRAR"}
          </button>
        </div>
      </form>
    </div>
  );
}
