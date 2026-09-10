import { NextRequest, NextResponse } from "next/server";
import { TOKEN_KEY } from "./constants/index";

async function userHasCharacter(request: NextRequest, token: string) {
  const userCookie = request.cookies.get("user")?.value;
  const fallback =
    request.cookies.get("notCharacter")?.value === "false" ||
    Boolean(request.cookies.get("characterId")?.value);

  if (!userCookie) return fallback;

  try {
    const user = JSON.parse(userCookie) as { id?: string };
    if (!user.id) return fallback;

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    const response = await fetch(
      `${apiUrl.replace(/\/$/, "")}/characters/by-user/${user.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );

    if (response.status === 404) return false;
    if (!response.ok) return fallback;

    const body = (await response.json()) as {
      data?: { character?: unknown };
      character?: unknown;
    };
    return Boolean(body.data?.character ?? body.character ?? body.data);
  } catch {
    return fallback;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(TOKEN_KEY)?.value;
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
  const hasCharacter = useMocks
    ? request.cookies.get("notCharacter")?.value === "false"
    : token
      ? await userHasCharacter(request, token)
      : false;
  const hasTempCharacter = Boolean(
    request.cookies.get("tempCharacterData")?.value,
  );
  const publicRoutes = ["/login", "/register", "/"];

  const pathname = request.nextUrl.pathname;

  const isPublicRoute = publicRoutes.includes(pathname);
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isCreationRoute =
    pathname.startsWith("/create") || pathname.startsWith("/classselection");

  if (isPublicRoute && token) {
    return NextResponse.redirect(
      new URL(hasCharacter ? "/dashboard" : "/create", request.url),
    );
  }

  if ((isDashboardRoute || isCreationRoute) && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
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
