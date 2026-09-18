"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import axiosInstance from "@/utils/axiosIntance";
import type { CurrentCharacter } from "@/utils/character-session";

interface CharacterContextValue {
  character: CurrentCharacter | null;
  // Atualização otimista/imediata a partir de uma resposta que já trouxe os
  // novos valores (equipar, usar consumível, distribuir atributo...) — sem
  // isso, vida/mana/bônus só refletiam o estado real depois de trocar de
  // aba ou dar F5, porque cada página busca o personagem uma vez no server.
  atualizarCharacter: (parcial: Partial<CurrentCharacter>) => void;
  refreshCharacter: () => Promise<void>;
}

const CharacterContext = createContext<CharacterContextValue | null>(null);

export function CharacterProvider({
  initialCharacter,
  children,
}: {
  initialCharacter: CurrentCharacter | null;
  children: ReactNode;
}) {
  const [character, setCharacter] = useState<CurrentCharacter | null>(
    initialCharacter,
  );

  const atualizarCharacter = useCallback((parcial: Partial<CurrentCharacter>) => {
    setCharacter((atual) => (atual ? { ...atual, ...parcial } : atual));
  }, []);

  const refreshCharacter = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{
        data?: { character?: CurrentCharacter };
      }>("/characters/me");
      if (resp.data?.data?.character) setCharacter(resp.data.data.character);
    } catch (error) {
      console.error("Erro ao atualizar dados do personagem:", error);
    }
  }, []);

  return (
    <CharacterContext.Provider
      value={{ character, atualizarCharacter, refreshCharacter }}
    >
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter() {
  const ctx = useContext(CharacterContext);
  if (!ctx) {
    throw new Error("useCharacter precisa ser usado dentro de CharacterProvider");
  }
  return ctx;
}
