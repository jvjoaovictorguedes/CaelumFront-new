// src/components/Item/ItemIcon.tsx
//
// Componente ÚNICO pro "ícone quadrado de item/equipamento" usado em
// TODAS as telas (Inventário, Forja, Aventura, Expedição, Balcão de
// Espólios, loadout de combate, evoluções...) — ícone com borda +
// recorte arredondado da arte (ou fallback), MAIS a ampliação ao
// passar o mouse (desktop) / tocar (celular).
//
// Estrutura importa: o recorte arredondado (overflow-hidden) fica numa
// div INTERNA; o popup ampliado é IRMÃO dela, filho direto da div
// externa (que não corta nada). Colocar o popup DENTRO da div do
// recorte foi o bug da primeira versão (ItemArtHoverPreview) — o
// overflow-hidden do recorte cortava o popup inteiro, invisível.
"use client";

import { useState, type ReactNode } from "react";

const POSICAO: Record<"top" | "bottom", string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
};

export default function ItemIcon({
  imagemUrl,
  nome,
  fallback,
  className = "h-full w-full",
  innerClassName = "rounded-lg",
  imgClassName = "h-full w-full object-contain p-1",
  position = "top",
  permiteClique = true,
  mostrarAmpliacao = true,
}: {
  imagemUrl?: string | null;
  nome: string;
  // O que mostrar quando não há imagem (emoji, letra inicial etc.) —
  // sem imagem não há o que ampliar, então o hover nem é ativado.
  fallback?: ReactNode;
  // Classes do CONTAINER externo (tamanho/posicionamento) — geralmente
  // "h-full w-full" quando já existe um wrapper de tamanho fixo por
  // fora (ex.: "h-16 w-16 ... border-2 ...").
  className?: string;
  // Classes extras só da div de recorte interna (ex.: bg, padding).
  innerClassName?: string;
  imgClassName?: string;
  position?: "top" | "bottom";
  // Alguns ícones já vivem dentro de um <button>/elemento com o
  // próprio onClick (selecionar item, equipar...) — nesses casos NÃO
  // interceptamos o clique, senão o toque no celular passaria a só
  // abrir o preview e nunca mais selecionar. O hover no desktop
  // continua funcionando normalmente.
  permiteClique?: boolean;
  // Bug real reportado: cards que já têm o PRÓPRIO tooltip rico (nome +
  // descrição, via useTooltipSide.ts/TooltipFixo) acabavam com DOIS
  // popups independentes no hover — este preview ampliado (posição
  // estática, `top`/`bottom` fixo, nunca mede espaço de verdade) E o
  // tooltip de texto (position:fixed, medido) — cada um decidindo pra
  // onde abrir por conta própria, um em cima do outro ("a imagem ficou
  // embaixo da descrição"). Esses cards passam `mostrarAmpliacao={false}`
  // e colocam a própria imagem DENTRO do tooltip único deles.
  mostrarAmpliacao?: boolean;
}) {
  const [visivel, setVisivel] = useState(false);
  const temImagem = Boolean(imagemUrl);
  const ampliacaoAtiva = mostrarAmpliacao && temImagem;

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => ampliacaoAtiva && setVisivel(true)}
      onMouseLeave={() => setVisivel(false)}
      onClick={
        ampliacaoAtiva && permiteClique
          ? (e) => {
              e.stopPropagation();
              setVisivel((v) => !v);
            }
          : undefined
      }
    >
      <div className={`h-full w-full overflow-hidden ${innerClassName}`}>
        {temImagem ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagemUrl!} alt={nome} className={imgClassName} />
        ) : (
          fallback
        )}
      </div>
      {visivel && ampliacaoAtiva && (
        <div
          className={`pointer-events-none absolute z-50 h-36 w-36 overflow-hidden rounded-xl border-2 border-[#F3B43F] bg-black/85 p-2 shadow-2xl animate-fade-in ${POSICAO[position]}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagemUrl!} alt={nome} className="h-full w-full object-contain" />
        </div>
      )}
    </div>
  );
}
