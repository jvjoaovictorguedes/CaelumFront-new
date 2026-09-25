// src/components/Tooltip/ActionTooltip.tsx
//
// Irmão genérico do Tooltip.tsx (que só aceita o formato fixo de
// atributos) — aqui o conteúdo do hover é livre (children de verdade),
// pra caber tanto "custo de mana de um poder" quanto "efeito de um
// consumível" sem precisar de um tipo novo por caso de uso. Mesma
// convenção visual (fundo dourado, texto escuro) do Tooltip original.
"use client";

import { useState, type ReactNode } from "react";

const POSICAO: Record<"top" | "bottom", string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
};

export default function ActionTooltip({
  children,
  label,
  position = "top",
}: {
  children: ReactNode;
  label: ReactNode;
  position?: "top" | "bottom";
}) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisivel(true)}
      onMouseLeave={() => setVisivel(false)}
      // Sem mouse (celular) o hover nunca dispara — um toque rápido antes
      // do clique de verdade (que continua executando a ação normalmente)
      // já é suficiente pra mostrar o tooltip com custo/efeito do poder.
      onTouchStart={() => setVisivel(true)}
    >
      {children}
      {visivel && (
        <div
          className={`pointer-events-none absolute z-50 min-w-[160px] max-w-[220px] whitespace-normal rounded-md bg-[#F3B43F] px-3 py-2 text-left text-sm text-[#3a2f24] shadow-lg animate-fade-in ${POSICAO[position]}`}
        >
          {label}
        </div>
      )}
    </div>
  );
}
