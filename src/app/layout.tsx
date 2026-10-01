import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono, IM_Fell_English_SC } from "next/font/google";
import "./globals.css";
import { getUserCookie } from "@/app/create/temp-character-data-action";
import { isCurrentUserAdmin, obterStatusManutencao } from "@/utils/character-session";
import MaintenanceScreen from "@/components/MaintenanceScreen";
import { MessagesSocketProvider } from "@/contexts/MessagesSocketContext";
import { MusicProvider } from "@/contexts/MusicContext";
import { MusicConfigProvider } from "@/contexts/MusicConfigContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const imFellEnglish = IM_Fell_English_SC({
  variable: "--font-im-fell",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Caelum",
  description: "Caelum — um RPG de texto onde você forja seu herói, enfrenta portais de ranque e comercia com outros aventureiros.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUserCookie();
  const currentUserId = user?.id ? Number(user.id) : null;

  // Modo Manutenção (painel Admin > Manutenção) — checado em TODA
  // navegação, antes de montar qualquer provider/tela: só admin passa.
  // A checagem de isAdmin só roda quando a manutenção está de fato
  // ligada (custa uma request a mais só nesse caso).
  //
  // Bug real: "/login" nunca tinha exceção aqui — antes de logar
  // ninguém tem sessão (isCurrentUserAdmin() só pode responder false),
  // então a manutenção também escondia o PRÓPRIO formulário de login,
  // travando até o admin de entrar pra desligá-la de novo. "/login"
  // fica de fora do bloqueio (pathname vem do header carimbado pelo
  // middleware.ts, que é quem realmente sabe a rota aqui) — "/register"
  // e "esqueci senha" continuam bloqueados de propósito, mesmo critério
  // do backend (maintenanceMiddleware.js: não libera criar conta nem
  // trocar senha durante a manutenção).
  const pathname = (await headers()).get("x-pathname");
  const manutencao = await obterStatusManutencao();
  const bloqueado = manutencao.enabled && pathname !== "/login" && !(await isCurrentUserAdmin());

  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${imFellEnglish.variable} antialiased`}
      >
        {bloqueado ? (
          <MaintenanceScreen message={manutencao.message} />
        ) : (
          <MusicProvider>
            <MusicConfigProvider>
              <MessagesSocketProvider currentUserId={currentUserId ?? undefined}>
                {children}
              </MessagesSocketProvider>
            </MusicConfigProvider>
          </MusicProvider>
        )}
      </body>
    </html>
  );
}