"use client";

import { coresDoTier, rotuloDeElo } from "@/lib/api/pvp";

/**
 * Emblema de Elo (Tier + Divisão).
 *
 * Ainda não existe arte real de emblema no projeto (public/images não tem
 * pasta de badges). Conforme a própria spec sugere — "preferir uma imagem
 * por Tier e renderizar IV/III/II/I como texto/overlay do frontend" — o
 * emblema aqui é um disco com o gradiente do Tier e a divisão em romano
 * por cima. Quando a arte chegar, basta trocar o miolo deste componente
 * por um <img src={...tierAssetKey}/> mantendo o overlay da divisão.
 */
export default function EloBadge({
  tier,
  divisao,
  tamanho = "md",
  mostrarRotulo = true,
}: {
  tier?: string | null;
  divisao?: string | null;
  tamanho?: "sm" | "md" | "lg";
  mostrarRotulo?: boolean;
}) {
  const cores = coresDoTier(tier);
  const semClassificacao = !tier;

  const dimensoes = {
    sm: { disco: "h-12 w-12", divisao: "text-sm", rotulo: "text-xs" },
    md: { disco: "h-20 w-20", divisao: "text-xl", rotulo: "text-sm" },
    lg: { disco: "h-28 w-28", divisao: "text-3xl", rotulo: "text-base" },
  }[tamanho];

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`${dimensoes.disco} flex items-center justify-center rounded-full border-4 shadow-lg`}
        style={{
          borderColor: cores.borda,
          background: `radial-gradient(circle at 35% 30%, ${cores.de}, ${cores.para})`,
          color: cores.texto,
        }}
        title={rotuloDeElo(tier, divisao)}
      >
        <span className={`font-imFeel font-bold ${dimensoes.divisao}`}>
          {semClassificacao ? "?" : tier === "Mestre" ? "M" : (divisao ?? "—")}
        </span>
      </div>
      {mostrarRotulo && (
        <p className={`font-imFeel leading-none text-[#F3B43F] ${dimensoes.rotulo}`}>
          {rotuloDeElo(tier, divisao)}
        </p>
      )}
    </div>
  );
}
