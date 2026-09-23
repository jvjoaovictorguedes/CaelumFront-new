"use client";

// /dashboard/profile → redireciona pro próprio characterId (Especificação
// Perfil de Jogador §4).
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCharacter } from "@/contexts/CharacterContext";

export default function ProfileRedirectPage() {
  const router = useRouter();
  const { character } = useCharacter();

  useEffect(() => {
    if (character?.id) {
      router.replace(`/dashboard/profile/${character.id}`);
    }
  }, [character?.id, router]);

  return (
    <div className="flex h-full items-center justify-center text-white/60">
      Carregando seu perfil...
    </div>
  );
}
