import axios, { type AxiosInstance } from "axios";

const isServer = typeof window === "undefined";

// No navegador, chama o proxy same-origin (/api/backend/...) em vez do
// backend direto — só assim o token JWT (guardado num cookie httpOnly,
// de propósito inacessível a JS) consegue viajar: o navegador manda o
// cookie sozinho pra própria página, e o proxy (rodando no servidor do
// Next.js) é quem tem acesso pra anexar o Authorization de verdade.
// No servidor (Server Components/Actions), chama o backend direto e
// anexa o header aqui mesmo, via interceptor (também lendo o cookie).
//
// INTERNAL_API_URL (sem NEXT_PUBLIC_, nunca vai pro bundle do navegador)
// é opcional: quando setada, aponta pra rede privada do Railway
// (*.railway.internal) em vez do domínio público — servidor-a-servidor
// fica dentro da rede do Railway, sem o round-trip de sair pra internet
// e voltar. Sem essa variável, cai no mesmo NEXT_PUBLIC_API_URL de
// sempre (comportamento idêntico a antes, nada quebra).
const baseURL = isServer
  ? process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
  : "/api/backend";

// Rotas cujo próprio 401 é o resultado esperado (credencial errada, ou
// que ainda não tem sessão pra perder) — nunca devem disparar o
// redirect de "sessão expirada".
const ROTAS_SEM_REDIRECT_NO_401 = ["/users/login", "/users/register", "/users/forgot-password", "/users/reset-password"];

function criarInstanciaReal(): AxiosInstance {
  const instancia = axios.create({ baseURL, timeout: 8000 });

  if (isServer) {
    instancia.interceptors.request.use(async (config) => {
      const { cookies } = await import("next/headers");
      const { TOKEN_KEY } = await import("@/constants");
      const cookieStore = await cookies();
      const token = cookieStore.get(TOKEN_KEY)?.value;
      if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
      }
      return config;
    });
  } else {
    // No navegador: um 401 aqui só pode significar "o backend recusou o
    // token" (authMiddleware usa 401 exclusivamente pra isso agora — ver
    // src/middlewares/authMiddleware.js no backend). Antes disso nada
    // avisava o jogador que a sessão tinha caído: a chamada falhava e
    // cada tela reagia (ou não) do seu próprio jeito, sem mensagem
    // nenhuma. O proxy (/api/backend/[...path]) já limpa os cookies de
    // sessão nesse caso — aqui só falta mandar o jogador de volta pro
    // login com um aviso claro.
    instancia.interceptors.response.use(
      (resposta) => resposta,
      (erro) => {
        const status = erro?.response?.status;
        if (erro?.response?.data?.code === "ANTI_AUTOMATION_CHALLENGE_REQUIRED") {
          window.dispatchEvent(new Event("caelum:verification-required"));
        }
        const url: string = erro?.config?.url ?? "";
        const rotaIsenta = ROTAS_SEM_REDIRECT_NO_401.some((rota) => url.includes(rota));
        const jaEstaNoLogin = window.location.pathname.startsWith("/login");

        if (status === 401 && !rotaIsenta && !jaEstaNoLogin) {
          window.location.href = "/login?expired=1";
        }

        return Promise.reject(erro);
      },
    );
  }

  return instancia;
}

const axiosInstance = criarInstanciaReal();

export default axiosInstance;
