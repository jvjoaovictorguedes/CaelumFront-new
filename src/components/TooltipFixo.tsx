"use client";
import { createPortal } from "react-dom";
import type { ReactNode, RefObject } from "react";

// Portal pra `document.body` de propósito — ver useTooltipSide.ts.
// Fora do DOM do card, então `position: fixed` fica sempre relativo à
// viewport de verdade, nunca a um ancestral com `transform` (o próprio
// botão do item usa `hover:scale-110`).
export default function TooltipFixo({
  tooltipRef,
  posicao,
  visivel,
  children,
}: {
  tooltipRef: RefObject<HTMLDivElement | null>;
  posicao: { top: number; left: number } | null;
  visivel: boolean;
  children: ReactNode;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={tooltipRef}
      style={{
        position: "fixed",
        top: posicao?.top ?? -9999,
        left: posicao?.left ?? -9999,
      }}
      className={`pointer-events-none z-50 w-40 rounded-md bg-black/90 p-2 text-center shadow-lg transition-opacity ${
        visivel ? "opacity-100" : "opacity-0"
      }`}
    >
      {children}
    </div>,
    document.body,
  );
}
