// src/components/Item/ItemArtHoverPreview.tsx
//
// Componente único e reutilizável pra "passar o mouse no item (ícone
// ou atributos) e ver a arte ampliada" — usado em TODAS as telas que
// mostram itens (Mercado, Inventário, Loja, Forja, boneco de
// equipamento, Bestiário, Balcão, Caçadas...), pra não duplicar essa
// lógica em cada tela como já acontecia com os ícones pequenos.
// Mesmo padrão de show/hide do ItemDescriptionTooltip (hover no
// desktop, toque/clique no celular — touch não tem hover de verdade).
// Sem imagem cadastrada não há o que ampliar, então o componente vira
// um passe-through puro (não intercepta clique nem mostra nada).
"use client";

import { useState, type ReactNode } from "react";

const POSICAO: Record<"top" | "bottom", string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
};

export default function ItemArtHoverPreview({
  children,
  imagemUrl,
  nome,
  position = "top",
  className = "relative inline-block cursor-help",
  permiteClique = true,
}: {
  children: ReactNode;
  imagemUrl?: string | null;
  nome: string;
  position?: "top" | "bottom";
  className?: string;
  // Alguns ícones já vivem dentro de um <button>/<a> com o próprio
  // onClick (selecionar item, equipar etc.) — nesses casos NÃO
  // interceptamos o clique (senão o toque no celular passaria a só
  // abrir a prévia e nunca mais selecionar o item), o preview funciona
  // só por hover (desktop) ali.
  permiteClique?: boolean;
}) {
  const [visivel, setVisivel] = useState(false);

  if (!imagemUrl) return <>{children}</>;

  return (
    <div
      className={className}
      onMouseEnter={() => setVisivel(true)}
      onMouseLeave={() => setVisivel(false)}
      onClick={
        permiteClique
          ? (e) => {
              e.stopPropagation();
              setVisivel((v) => !v);
            }
          : undefined
      }
    >
      {children}
      {visivel && (
        <div
          // Proporção pensada pra dar pra ver a arte direito sem tomar a
          // tela inteira nem tampar o resto do card/lista atrás dela.
          className={`pointer-events-none absolute z-50 h-36 w-36 overflow-hidden rounded-xl border-2 border-[#F3B43F] bg-black/85 p-2 shadow-2xl animate-fade-in ${POSICAO[position]}`}
        >
          <img src={imagemUrl} alt={nome} className="h-full w-full object-contain" />
        </div>
      )}
    </div>
  );
}
