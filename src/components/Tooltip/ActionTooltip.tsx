// src/components/Tooltip/ActionTooltip.tsx
//
// Irmão genérico do Tooltip.tsx (que só aceita o formato fixo de
// atributos) — aqui o conteúdo do hover é livre (children de verdade),
// pra caber tanto "custo de mana de um poder" quanto "efeito de um
// consumível" sem precisar de um tipo novo por caso de uso. Mesma
// convenção visual (fundo dourado, texto escuro) do Tooltip original.
"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

const POSICAO_VERTICAL: Record<"top" | "bottom", string> = {
  top: "bottom-full mb-2",
  bottom: "top-full mt-2",
};

// Respiro mínimo nunca colado na borda da tela.
const MARGEM_VIEWPORT = 8;

// Quanto tempo segurando o dedo até o tooltip aparecer no celular
// (long-press) — relato de usuário: um toque rápido já abria o texto
// em cima da barra de ações, poluindo a tela o tempo todo e, pior,
// `onTouchStart` sem `onTouchEnd` correspondente deixava o tooltip
// "preso" na tela (cobrindo o botão de ataque básico) até recarregar
// a página. Agora só abre segurando por um tempo, e fecha garantido
// ao soltar/cancelar o toque ou ao mover o dedo (scroll).
const LONG_PRESS_MS = 400;

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
  const [deslocamentoX, setDeslocamentoX] = useState(0);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cancelarLongPress() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function iniciarLongPress() {
    cancelarLongPress();
    timeoutRef.current = setTimeout(() => setVisivel(true), LONG_PRESS_MS);
  }

  function esconder() {
    cancelarLongPress();
    setVisivel(false);
  }

  // O tooltip nasce centralizado no gatilho (left-1/2 -translate-x-1/2).
  // Pra um ícone perto da borda da tela (ex.: primeiro Poder da barra de
  // ações, colado no canto esquerdo — bug relatado com o texto cortado),
  // isso projeta metade da caixa pra fora da viewport. useLayoutEffect
  // mede a posição real ANTES do próximo paint e corrige com um
  // deslocamento extra, sem o tooltip "pular" visivelmente.
  useLayoutEffect(() => {
    if (!visivel || !tooltipRef.current) {
      setDeslocamentoX(0);
      return;
    }
    const rect = tooltipRef.current.getBoundingClientRect();
    if (rect.left < MARGEM_VIEWPORT) {
      setDeslocamentoX(MARGEM_VIEWPORT - rect.left);
    } else if (rect.right > window.innerWidth - MARGEM_VIEWPORT) {
      setDeslocamentoX(window.innerWidth - MARGEM_VIEWPORT - rect.right);
    } else {
      setDeslocamentoX(0);
    }
  }, [visivel]);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisivel(true)}
      onMouseLeave={() => setVisivel(false)}
      // Sem mouse (celular) o hover nunca dispara. Um toque rápido (tap)
      // só executa a ação normalmente, sem abrir o tooltip — só segurando
      // por LONG_PRESS_MS é que o texto aparece. touchend/touchcancel/
      // touchmove sempre cancelam e escondem, então nunca fica preso na
      // tela cobrindo o botão de ataque básico.
      onTouchStart={iniciarLongPress}
      onTouchEnd={esconder}
      onTouchCancel={esconder}
      onTouchMove={esconder}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
      {visivel && (
        <div
          ref={tooltipRef}
          style={{ transform: `translateX(calc(-50% + ${deslocamentoX}px))` }}
          // A tela de combate (Aventura/Duelo) é fixed inset-0 com
          // overflow-hidden — sem limite de altura aqui, uma descrição
          // de poder longa estourava o topo da tela e a borda do
          // container cortava o texto no meio. max-h + scroll interno
          // garante que o tooltip NUNCA passe do espaço disponível,
          // mesmo pra descrições bem longas.
          className={`pointer-events-none absolute left-1/2 z-50 max-h-[45vh] min-w-[160px] max-w-[260px] overflow-y-auto whitespace-normal rounded-md bg-[#F3B43F] px-3 py-2 text-left text-sm text-[#3a2f24] shadow-lg animate-fade-in ${POSICAO_VERTICAL[position]}`}
        >
          {label}
        </div>
      )}
    </div>
  );
}
