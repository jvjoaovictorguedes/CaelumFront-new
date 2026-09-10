import { NextRequest, NextResponse } from "next/server";
import { TOKEN_KEY } from "./constants/index";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(TOKEN_KEY)?.value;
  const characterState = request.cookies.get("notCharacter")?.value;
  const characterId = request.cookies.get("characterId")?.value;
  const hasCharacter = characterState === "false" || Boolean(characterId);
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
