"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosIntance";
import { useCharacter } from "@/contexts/CharacterContext";

export default function GenderToggleButton({
  characterId,
  generoAtual,
}: {
  characterId: number;
  generoAtual: string;
}) {
  const router = useRouter();
  const { refreshCharacter } = useCharacter();
  const [carregando, setCarregando] = useState(false);

  async function alternarGenero() {
    if (carregando) return;
    setCarregando(true);
    try {
      const novoGenero = generoAtual === "Feminino" ? "Masculino" : "Feminino";
      await axiosInstance.patch(`/characters/${characterId}`, {
        genero: novoGenero,
      });
      // router.refresh() só recarrega a parte renderizada no servidor
      // (ex.: imagemPadrao do avatar) — sem refreshCharacter() o
      // CharacterContext (usado pelo texto "Sexo" aqui do lado) ficava
      // com o valor antigo até a próxima navegação.
      await refreshCharacter();
      router.refresh();
    } catch (error) {
      console.error("Erro ao mudar de sexo:", error);
      alert("Não foi possível mudar de sexo agora.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={alternarGenero}
      disabled={carregando}
      title="Mudar de sexo"
      className="group relative inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#F3B43F]/50 text-[#F3B43F] transition hover:border-[#F3B43F] hover:bg-[#F3B43F]/10 disabled:opacity-50"
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-3.5 w-3.5 ${carregando ? "animate-spin" : ""}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        aria-hidden="true"
      >
        <path d="M21 12a9 9 0 1 1-3-6.7" strokeLinecap="round" />
        <path d="M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-black/90 px-2 py-1 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100">
        Mudar de sexo
      </span>
    </button>
  );
}
