"use client";

import type { ReactNode } from "react";
import { usePvpSocket } from "@/contexts/PvpSocketContext";

// Personagem derrotado (vida_atual <= 0) não pode caçar sozinho — mas
// pode muito bem ter aceitado um convite de party enquanto se
// recuperava em outra aba (bug reportado: convidado fora da aba de
// Aventura aceita a party e "bugou"). Sem isso, o convidado caía numa
// tela morta de "você está derrotado", sem nenhuma indicação de que
// acabou de entrar num grupo — PartyAdventureSection (sempre montada
// em adventure/page.tsx) ficava tecnicamente presente no DOM, mas
// escondida atrás deste aviso, do mesmo jeito que SoloCombatGate
// resolveu pro overlay de combate solo. O anfitrião já recebe o motivo
// real via party:erro se tentar começar a batalha com alguém
// derrotado — aqui só garante que o PRÓPRIO derrotado enxergue o lobby
// em vez de um beco sem saída.
export default function DerrotadoGate({ children }: { children: ReactNode }) {
  const { grupoAtual } = usePvpSocket();
  if (grupoAtual) return null;
  return <>{children}</>;
}
