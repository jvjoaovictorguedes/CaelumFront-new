"use client";

// Nome/avatar clicável → Perfil de Jogador (Especificação Perfil de
// Jogador §33/§34). Componente comum pra virar o único jeito de abrir o
// perfil de outro jogador em qualquer tela (Ranking é obrigatório na
// v1; Guilda/Mensagens/Party/PvP/Mercado reaproveitam depois).
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

export default function CharacterProfileLink({
  characterId,
  children,
  className = "",
}: {
  characterId: number;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();

  function aoClicar(evento: MouseEvent) {
    evento.stopPropagation();
    router.push(`/dashboard/profile/${characterId}`);
  }

  return (
    <button
      type="button"
      onClick={aoClicar}
      className={`cursor-pointer text-left hover:underline ${className}`}
    >
      {children}
    </button>
  );
}
