import type { Metadata } from "next";
import { Geist, Geist_Mono, IM_Fell_English_SC } from "next/font/google";
import "./globals.css";
import GlobalNotificationManager from "@/components/GlobalNotificationManager/GlobalNotificationManager";
import { getUserCookie } from "@/app/create/temp-character-data-action";

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

  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${imFellEnglish.variable} antialiased`}
      >
        {children}
        {currentUserId && (
          <GlobalNotificationManager currentUserId={currentUserId} />
        )}
      </body>
    </html>
  );
}