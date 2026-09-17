import { NextRequest, NextResponse } from "next/server";
import { TOKEN_KEY } from "./constants/index";

const COOKIES_DE_SESSAO = [TOKEN_KEY, "user", "characterId", "notCharacter"];

function limparCookiesDeSessao(response: NextResponse) {
  for (const nome of COOKIES_DE_SESSAO) {
    response.cookies.set(nome, "", { path: "/", maxAge: 0 });
  }
  return response;
}

// Antes, um cookie de token ainda presente (ele dura 7 dias) mas com o
// JWT dentro já expirado (o JWT em si dura só 1h) fazia o middleware
// achar que o usuário seguia logado — a checagem só olhava se o cookie
// EXISTIA, nunca se o backend ainda aceitava o token. O jogador entrava
// no dashboard normalmente e só via as coisas quebrarem chamada a
// chamada, sem nenhum aviso de que a sessão tinha caído. Agora
// perguntamos pro backend (via /characters/me, que exige token válido)
// e distinguimos "token inválido/expirado" (401) de "válido mas sem
// personagem ainda" (404).
async function verificarSessao(request: NextRequest, token: string) {
  const fallback = {
    tokenValido: true,
    hasCharacter:
      request.cookies.get("notCharacter")?.value === "false" ||
      Boolean(request.cookies.get("characterId")?.value),
  };

  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/characters/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (response.status === 401) {
      return { tokenValido: false, hasCharacter: false };
    }
    if (response.status === 404) {
      return { tokenValido: true, hasCharacter: false };
    }
    if (!response.ok) return fallback;

    const body = (await response.json()) as {
      data?: { character?: unknown };
      character?: unknown;
    };
    return {
      tokenValido: true,
      hasCharacter: Boolean(body.data?.character ?? body.character ?? body.data),
    };
  } catch {
    return fallback;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(TOKEN_KEY)?.value;
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

  const sessao = useMocks
    ? { tokenValido: Boolean(token), hasCharacter: request.cookies.get("notCharacter")?.value === "false" }
    : token
      ? await verificarSessao(request, token)
      : { tokenValido: false, hasCharacter: false };

  // Cookie presente mas o backend não aceita mais o token: trata como
  // deslogado (igual a não ter token nenhum) e limpa os cookies de
  // sessão, senão essa mesma checagem ia repetir o fetch (e falhar do
  // mesmo jeito) em toda navegação daqui pra frente.
  const sessaoExpirou = Boolean(token) && !sessao.tokenValido;
  const estaLogado = Boolean(token) && sessao.tokenValido;
  const hasCharacter = sessao.hasCharacter;

  const hasTempCharacter = Boolean(
    request.cookies.get("tempCharacterData")?.value,
  );
  const publicRoutes = ["/login", "/register", "/"];

  const pathname = request.nextUrl.pathname;

  const isPublicRoute = publicRoutes.includes(pathname);
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isCreationRoute =
    pathname.startsWith("/create") || pathname.startsWith("/classselection");

  if (isPublicRoute && estaLogado) {
    return NextResponse.redirect(
      new URL(hasCharacter ? "/dashboard" : "/create", request.url),
    );
  }

  if ((isDashboardRoute || isCreationRoute) && !estaLogado) {
    const destino = new URL("/login", request.url);
    if (sessaoExpirou) destino.searchParams.set("expired", "1");
    return limparCookiesDeSessao(NextResponse.redirect(destino));
  }

  if (isDashboardRoute && !hasCharacter) {
    return NextResponse.redirect(new URL("/create", request.url));
  }

  if (isCreationRoute && hasCharacter) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/classselection") && !hasTempCharacter) {
    return NextResponse.redirect(new URL("/create", request.url));
  }

  if (sessaoExpirou) {
    // Sessão caiu mas a rota atual não exige login (ex.: "/") — ainda
    // assim limpa os cookies velhos pra não arrastar esse estado
    // inconsistente pra próxima navegação.
    return limparCookiesDeSessao(NextResponse.next());
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/dashboard/:path*",
    "/create/:path*",
    "/classselection/:path*",
  ],
};
