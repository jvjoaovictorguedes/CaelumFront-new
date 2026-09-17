import axios, { type AxiosInstance } from "axios";
import { MockApiClient } from "./mock-api";

const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
const isServer = typeof window === "undefined";

// No navegador, chama o proxy same-origin (/api/backend/...) em vez do
// backend direto — só assim o token JWT (guardado num cookie httpOnly,
// de propósito inacessível a JS) consegue viajar: o navegador manda o
// cookie sozinho pra própria página, e o proxy (rodando no servidor do
// Next.js) é quem tem acesso pra anexar o Authorization de verdade.
// No servidor (Server Components/Actions), chama o backend direto e
// anexa o header aqui mesmo, via interceptor (também lendo o cookie).
const baseURL = isServer
  ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
  : "/api/backend";

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
  }

  return instancia;
}

const axiosInstance = useMocks ? new MockApiClient() : criarInstanciaReal();

export default axiosInstance;
