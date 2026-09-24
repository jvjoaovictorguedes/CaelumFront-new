"use client";

import type { ReactNode } from "react";
import { usePvpSocket } from "@/contexts/PvpSocketContext";

// CombatArena renderiza como overlay de tela cheia (fixed inset-0,
// z-[70]) por cima de tudo — inclusive por cima de PartyAdventureSection,
// que fica sempre montada na página (ver adventure/page.tsx). Um jogador
// que aceita convite de grupo enquanto já tem uma sessão de caça solo
// aberta ficava com a party tecnicamente "presente" no DOM, mas
// visualmente 100% coberta pelo overlay de combate solo — via da tela,
// só dava pra ver o combate, nunca o lobby do grupo (bug reportado:
// "aceita o convite e entra na aventura solo, não na party").
// Esconde o combate solo (e o cabeçalho da sessão) enquanto o jogador
// estiver num grupo que ainda não começou a batalha — a batalha em
// grupo tem sua própria tela cheia (ver PvpSocketContext, evento
// "party:batalha-iniciada"), então não tem conflito quando ela começa.
export default function SoloCombatGate({ children }: { children: ReactNode }) {
  const { grupoAtual } = usePvpSocket();
  if (grupoAtual) return null;
  return <>{children}</>;
}
