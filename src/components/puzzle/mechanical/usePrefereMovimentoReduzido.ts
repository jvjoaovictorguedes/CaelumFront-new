"use client";
import { useEffect, useState } from "react";

// Fase 4 — regra obrigatória de acessibilidade do evento: nenhuma
// animação de rotação/fluxo de energia pode ser a ÚNICA forma de
// comunicar estado (ver MechanicalPuzzleScene — todo estado também tem
// texto/ícone), e quem pede menos movimento no SO nunca deve receber
// rotação contínua de engrenagem.
export function usePrefereMovimentoReduzido(): boolean {
  const [reduzido, setReduzido] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduzido(consulta.matches);
    const ouvir = (evento: MediaQueryListEvent) => setReduzido(evento.matches);
    consulta.addEventListener("change", ouvir);
    return () => consulta.removeEventListener("change", ouvir);
  }, []);

  return reduzido;
}
