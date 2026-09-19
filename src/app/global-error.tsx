"use client";

import { useEffect } from "react";

// Só entra em ação se o PRÓPRIO layout raiz falhar (algo grave o
// suficiente pra derrubar até o RootLayout) — por isso precisa montar
// <html>/<body> do zero, sem poder reaproveitar layout.tsx nem
// componentes que dependem de contexto (nada de CaelumBrand aqui, pra
// não arriscar essa página também quebrar).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro fatal na aplicação:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1f1813",
          color: "white",
          fontFamily: "sans-serif",
          padding: "1rem",
        }}
      >
        <div
          style={{
            maxWidth: "28rem",
            textAlign: "center",
            border: "2px solid #F3B43F",
            borderRadius: "1rem",
            background: "rgba(41,32,24,0.9)",
            padding: "1.5rem",
          }}
        >
          <p style={{ textTransform: "uppercase", letterSpacing: "0.1em", color: "#F3B43F", fontSize: "0.85rem" }}>
            Caelum
          </p>
          <h1 style={{ fontSize: "1.75rem", margin: "0.5rem 0" }}>O jogo travou de vez</h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9rem" }}>
            Algo grave aconteceu e a página inteira precisou parar. Isso não afeta seu personagem
            — tente recarregar.
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: "1.25rem",
              background: "#BC8418",
              color: "black",
              fontWeight: "bold",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.6rem 1.2rem",
              cursor: "pointer",
            }}
          >
            Tentar de novo
          </button>
        </div>
      </body>
    </html>
  );
}
