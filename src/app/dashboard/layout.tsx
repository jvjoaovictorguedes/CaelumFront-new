import { temploDisponivel } from "@/lib/api/temple";
import React from "react";
import {WorldCrisisProvider} from "@/contexts/WorldCrisisContext";
import WorldCrisisGlobalAlert from "@/components/world-crisis/WorldCrisisGlobalAlert";
import AutomationVerification from "@/components/AutomationVerification";
import NavMenu from "./components/NavMenu";
import { getCurrentCharacter, getCurrentCharacterId, isCurrentUserAdmin } from "@/utils/character-session";
import { PvpSocketProvider } from "@/contexts/PvpSocketContext";
import { CharacterProvider } from "@/contexts/CharacterContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { WorldBossSocketProvider } from "@/contexts/WorldBossSocketContext";
import { UniqueFeatSocketProvider } from "@/contexts/UniqueFeatSocketContext";
import { GlobalChatSocketProvider } from "@/contexts/GlobalChatSocketContext";
import SessionKeepAlive from "@/components/SessionKeepAlive/SessionKeepAlive";
import PartyBattleArena from "./adventure/components/PartyBattleArena";
import GuildBossLiveArena from "./guilds/components/GuildBossLiveArena";
import TempleGuardianLiveArena from "./temple/components/TempleGuardianLiveArena";
import WorldBossGlobalAlert from "./components/WorldBossGlobalAlert";
import UniqueFeatGlobalAlert from "@/components/unique-feats/UniqueFeatGlobalAlert";
import FloatingMusicWidget from "@/components/music/FloatingMusicWidget";
import FloatingGlobalChatWidget from "@/components/chat/FloatingGlobalChatWidget";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const characterId = await getCurrentCharacterId();
  const character = await getCurrentCharacter();
  const isAdmin = await isCurrentUserAdmin();
  const templeEnabled = await temploDisponivel();

  return (
    <ToastProvider>
      <CharacterProvider initialCharacter={character}>
        <SessionKeepAlive />
        <AutomationVerification />
        <PvpSocketProvider characterId={characterId ? Number(characterId) : undefined}>
          <WorldBossSocketProvider><WorldCrisisProvider>
            <UniqueFeatSocketProvider>
              <GlobalChatSocketProvider>
                <WorldBossGlobalAlert /><WorldCrisisGlobalAlert />
                <UniqueFeatGlobalAlert />
                <div className="homeDash min-h-[100dvh] w-full overflow-x-hidden bg-cover bg-center bg-fixed">
                  <NavMenu
                    classe={character?.Class?.nome}
                    avatarKey={character?.avatar_key}
                    isAdmin={isAdmin}
                    templeEnabled={templeEnabled}
                  />
                  <main className="dashboard-main min-h-[100dvh] overflow-y-auto px-4 pb-8 pt-20 sm:px-6 lg:px-8 lg:pt-8">
                    {children}
                  </main>
                </div>
                <PartyBattleArena />
                <GuildBossLiveArena />
                {/* Nunca gatear pelo templeEnabled deste Server Layout: ele é
                   lido uma vez por render do layout e o Next pode manter o
                   mesmo layout montado entre navegações, deixando a arena
                   presa num valor desatualizado mesmo após o Templo ser
                   liberado (bug "clico em Enfrentar o Guardião e a batalha
                   não inicia"). A arena já retorna null sozinha quando
                   estadoGuardiao === null — igual às outras arenas globais
                   abaixo, que também nunca dependem de um gate do layout. A
                   segurança do release fica inteira no backend
                   (templeReleaseService.requireEnabled() + boss_unlocked_at);
                   templeEnabled aqui só esconde menu/página (NavMenu acima e
                   temple/page.tsx), nunca a infraestrutura da arena. */}
                <TempleGuardianLiveArena />
                <FloatingMusicWidget />
                <FloatingGlobalChatWidget />
              </GlobalChatSocketProvider>
            </UniqueFeatSocketProvider>
          </WorldCrisisProvider></WorldBossSocketProvider>
        </PvpSocketProvider>
      </CharacterProvider>
    </ToastProvider>
  );
}
