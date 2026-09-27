// src/components/Tooltip/ItemDescriptionTooltip.tsx
//
// Mostra a descrição completa de um item/equipamento (Mercado Negro,
// e qualquer outra tela que precise do mesmo comportamento) — passar o
// mouse por cima no desktop, e um toque (clique) no celular, já que
// touch não tem "hover" de verdade. Mesma convenção visual do
// ActionTooltip (fundo dourado, texto escuro), mas com toggle por
// clique em vez de só onTouchStart — precisamos que o tooltip FIQUE
// aberto no celular até o jogador tocar de novo, não só enquanto o
// dedo estiver encostado na tela.
"use client";

import { useState, type ReactNode } from "react";

const POSICAO: Record<"top" | "bottom", string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
};

export default function ItemDescriptionTooltip({
  children,
  label,
  position = "bottom",
  className = "relative inline-block cursor-help",
}: {
  children: ReactNode;
  label: ReactNode;
  position?: "top" | "bottom";
  className?: string;
}) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div
      className={className}
      onMouseEnter={() => setVisivel(true)}
      onMouseLeave={() => setVisivel(false)}
      onClick={(e) => {
        // Sem isso, tocar no card pra ver a descrição também dispararia
        // qualquer onClick de um elemento pai (nenhum existe hoje nos
        // cards do Mercado Negro, mas evita a pegadinha se um for
        // adicionado depois).
        e.stopPropagation();
        setVisivel((v) => !v);
      }}
    >
      {children}
      {visivel && (
        <div
          className={`absolute z-50 max-h-[60vh] min-w-[200px] max-w-[300px] overflow-y-auto whitespace-normal rounded-md bg-[#F3B43F] px-3 py-2 text-left text-sm text-[#3a2f24] shadow-lg animate-fade-in ${POSICAO[position]}`}
        >
          {label}
        </div>
      )}
    </div>
  );
}
