import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TOKEN_KEY } from "./constants/index";

export async function middleware(request: NextRequest) {
  const cookie = await cookies();
  const token = cookie.get(TOKEN_KEY)?.value;
  const character = cookie.get("notCharacter");
  const characterBoo = character?.value;
  const publicRoutes = ["/login", "/register", "/"];
  const protectedRoutes = [
    "/dashboard",
    "/create",
    "/characters",
    "/classselection",
  ];

  const pathname = request.nextUrl.pathname;

  const isPublicRoute = publicRoutes.includes(pathname);
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isPublicRoute && token && characterBoo === "false") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
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
    "/characters/:path*",
    "/classselection/:path*",
  ],
};
