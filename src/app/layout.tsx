import type { Metadata } from "next";
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
  const manutencao = await obterStatusManutencao();
  const bloqueado = manutencao.enabled && !(await isCurrentUserAdmin());

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