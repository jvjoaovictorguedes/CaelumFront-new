import React from "react";
import NavMenu from "./components/NavMenu";
import { getCurrentCharacter, getCurrentCharacterId, isCurrentUserAdmin } from "@/utils/character-session";
import { PvpSocketProvider } from "@/contexts/PvpSocketContext";
import { CharacterProvider } from "@/contexts/CharacterContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { WorldBossSocketProvider } from "@/contexts/WorldBossSocketContext";
import SessionKeepAlive from "@/components/SessionKeepAlive/SessionKeepAlive";
import PartyBattleArena from "./adventure/components/PartyBattleArena";
import GuildBossLiveArena from "./guilds/components/GuildBossLiveArena";
import WorldBossGlobalAlert from "./components/WorldBossGlobalAlert";
import FloatingMusicWidget from "@/components/music/FloatingMusicWidget";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const characterId = await getCurrentCharacterId();
  const character = await getCurrentCharacter();
  const isAdmin = await isCurrentUserAdmin();

  return (
    <ToastProvider>
      <CharacterProvider initialCharacter={character}>
        <SessionKeepAlive />
        <PvpSocketProvider characterId={characterId ? Number(characterId) : undefined}>
          <WorldBossSocketProvider>
            <WorldBossGlobalAlert />
            <div className="homeDash min-h-[100dvh] w-full overflow-x-hidden bg-cover bg-center bg-fixed">
              <NavMenu
                classe={character?.Class?.nome}
                avatarKey={character?.avatar_key}
                isAdmin={isAdmin}
              />
              <main className="dashboard-main min-h-[100dvh] overflow-y-auto px-4 pb-8 pt-20 sm:px-6 lg:px-8 lg:pt-8">
                {children}
              </main>
            </div>
            <PartyBattleArena />
            <GuildBossLiveArena />
            <FloatingMusicWidget />
          </WorldBossSocketProvider>
        </PvpSocketProvider>
      </CharacterProvider>
    </ToastProvider>
  );
}
