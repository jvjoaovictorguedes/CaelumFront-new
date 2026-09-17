import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TOKEN_KEY } from "@/constants";

// Proxy "backend for frontend": o token JWT fica num cookie httpOnly (não
// dá pra ler via JS no navegador — é assim de propósito, protege contra
// roubo de token por um XSS). Componentes client não têm como anexar
// `Authorization: Bearer` direto numa chamada pro backend por causa disso.
//
// Esse route handler roda no servidor do Next.js, então ELE consegue ler
// o cookie httpOnly da requisição recebida (o navegador manda automático,
// é uma chamada same-origin pra própria página) e repassa pro backend de
// verdade com o header certo. O navegador nunca vê o token.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function encaminhar(request: NextRequest, path: string[]) {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_KEY)?.value;

  const destino = `${API_BASE_URL.replace(/\/$/, "")}/${path.join("/")}${request.nextUrl.search}`;

  const headers: Record<string, string> = {};
  const contentType = request.headers.get("content-type");
  if (contentType) headers["content-type"] = contentType;
  if (token) headers["authorization"] = `Bearer ${token}`;

  const temCorpo = !["GET", "HEAD"].includes(request.method);
  const corpo = temCorpo ? await request.text() : undefined;

  try {
    const respostaBackend = await fetch(destino, {
      method: request.method,
      headers,
      body: corpo && corpo.length > 0 ? corpo : undefined,
      cache: "no-store",
    });

    const texto = await respostaBackend.text();
    return new NextResponse(texto, {
      status: respostaBackend.status,
      headers: { "content-type": respostaBackend.headers.get("content-type") || "application/json" },
    });
  } catch (error) {
    console.error("Erro ao repassar requisição pro backend:", error);
    return NextResponse.json(
      { message: "Não foi possível falar com o servidor do jogo agora." },
      { status: 502 },
    );
  }
}

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  return encaminhar(request, (await params).path);
}
export async function POST(request: NextRequest, { params }: RouteContext) {
  return encaminhar(request, (await params).path);
}
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  return encaminhar(request, (await params).path);
}
export async function PUT(request: NextRequest, { params }: RouteContext) {
  return encaminhar(request, (await params).path);
}
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  return encaminhar(request, (await params).path);
}
