"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { login, loginComGoogle } from "../../action";

// Tipagem mínima da API do Google Identity Services (GSI) — não existe
// pacote oficial de tipos pra ela, e não vale a pena puxar uma lib só
// por isso. Só o pedaço que este componente realmente usa.
interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (resposta: { credential?: string }) => void;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: { theme?: string; size?: string; width?: number; text?: string; locale?: string },
      ) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const botaoGoogleRef = useRef<HTMLDivElement>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

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

    // Validação ANTES de chamar login() — antes disso a requisição real
    // já tinha sido disparada mesmo com campo vazio/inválido, e o
    // isLoading só voltava a false se essas checagens passassem (senão o
    // formulário ficava travado em "Entrando..." pro resto da vida do
    // componente, sem nenhum jeito de tentar de novo sem recarregar a
    // página).
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

    setIsLoading(true);
    try {
      const result = await login({ email, password, rememberMe });
      // Login em si já deu certo aqui (senha correta, sessão criada) —
      // 404 só distingue "ainda não tem personagem" de "tem" (200).
      // Qualquer OUTRO status da busca de personagem (403/500/etc, ex.:
      // uma falha passageira) não pode virar "senha incorreta" pro
      // jogador: a senha estava certa. tratarResultadoDeLogin manda pro
      // dashboard (mesmo destino do caso normal) e deixa a tela seguinte
      // lidar com qualquer detalhe de personagem que faltar.
      if (result.success) alert("Login bem-sucedido! Redirecionando...");
      tratarResultadoDeLogin(result);
    } finally {
      setIsLoading(false);
    }
  };

  // Compartilhado entre o login por senha (handleSubmit) e o login com
  // Google (handleGoogleCredential) — os dois terminam exatamente do
  // mesmo jeito: se deu certo, redireciona (só distinguindo se o
  // usuário já tem personagem ou não); se não deu, mostra a mensagem de
  // erro.
  const tratarResultadoDeLogin = useCallback(
    (result: { success: boolean; character?: number; message?: string }) => {
      if (!result.success) {
        setErrorMessage(result.message || "Erro desconhecido ao fazer login.");
        return;
      }
      router.push(result.character === 404 ? "/create" : "/dashboard");
    },
    [router],
  );

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      setErrorMessage("");
      setIsLoading(true);
      try {
        const result = await loginComGoogle(credential);
        tratarResultadoDeLogin(result);
      } finally {
        setIsLoading(false);
      }
    },
    [tratarResultadoDeLogin],
  );

  // Inicializa o GSI e desenha o botão oficial do Google — chamada de
  // dois lugares (o `onLoad` da tag <Script> abaixo, pro caso comum do
  // script terminar de carregar DEPOIS deste componente montar; e o
  // useEffect logo abaixo, pro caso do script já estar em cache e
  // `window.google` já existir antes do <Script> disparar `onLoad`).
  // Sem client_id configurado, não faz nada (login por senha continua
  // funcionando normalmente, só o botão não aparece).
  const inicializarBotaoGoogle = useCallback(() => {
    if (!googleClientId || !window.google || !botaoGoogleRef.current) return;
    // Idempotente o bastante pra chamar mais de uma vez (initialize já
    // é; renderButton só duplicaria o botão se chamado 2x no MESMO
    // elemento — evita isso limpando o container antes).
    botaoGoogleRef.current.innerHTML = "";
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (resposta) => {
        if (resposta.credential) handleGoogleCredential(resposta.credential);
      },
    });
    window.google.accounts.id.renderButton(botaoGoogleRef.current, {
      theme: "filled_black",
      size: "large",
      width: 258,
      text: "continue_with",
      locale: "pt-BR",
    });
  }, [googleClientId, handleGoogleCredential]);

  useEffect(() => {
    inicializarBotaoGoogle();
  }, [inicializarBotaoGoogle]);

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
      {googleClientId && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={inicializarBotaoGoogle}
        />
      )}
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
        {googleClientId && (
          <div className="mt-4 flex flex-col items-center">
            <div className="mb-3 flex w-full items-center gap-3">
              <span className="h-px flex-1 bg-[#F3B43F]/30" />
              <span className="font-imFeel text-sm text-[#F3B43F]/70">ou</span>
              <span className="h-px flex-1 bg-[#F3B43F]/30" />
            </div>
            {/* O Google Identity Services desenha o botão sozinho aqui
                dentro (ver inicializarBotaoGoogle) — não é um <button>
                nosso, então isLoading só evita cliques indiretos
                desativando com pointer-events em vez de um `disabled`
                que esse elemento não tem. */}
            <div
              ref={botaoGoogleRef}
              className={isLoading ? "pointer-events-none opacity-50" : ""}
            />
          </div>
        )}
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
