"use client";

import { assetKeyDoTier, coresDoTier, rotuloDeElo } from "@/lib/api/pvp";

/**
 * Emblema de Elo (Tier + Divisão) — imagem real por Tier (public/images/
 * ranked/<asset>.png), com a divisão em romano como overlay no canto
 * (a própria spec sugia exatamente isso: "uma imagem por Tier e
 * renderizar IV/III/II/I como texto/overlay do frontend"). Sem
 * classificação ainda (personagem nunca jogou ranqueada) cai num
 * círculo cinza com "?" — não existe emblema de "tier zero".
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
    sm: { disco: "h-12 w-12", divisao: "text-[10px]", rotulo: "text-xs" },
    md: { disco: "h-20 w-20", divisao: "text-sm", rotulo: "text-sm" },
    lg: { disco: "h-28 w-28", divisao: "text-lg", rotulo: "text-base" },
  }[tamanho];

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`relative ${dimensoes.disco} flex items-center justify-center rounded-full`}
        title={rotuloDeElo(tier, divisao)}
      >
        {semClassificacao ? (
          <div
            className="flex h-full w-full items-center justify-center rounded-full border-4"
            style={{ borderColor: cores.borda, background: cores.para, color: cores.texto }}
          >
            <span className="font-imFeel text-xl font-bold">?</span>
          </div>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/images/ranked/${assetKeyDoTier(tier)}.png`}
              alt={rotuloDeElo(tier, divisao)}
              className="h-full w-full object-contain drop-shadow-lg"
            />
            {divisao && (
              <span
                className={`absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border-2 border-black/40 bg-[#292018] px-2 py-0.5 font-imFeel font-bold leading-none text-[#F3B43F] shadow ${dimensoes.divisao}`}
              >
                {divisao}
              </span>
            )}
          </>
        )}
      </div>
      {mostrarRotulo && (
        <p className={`font-imFeel leading-none text-[#F3B43F] ${dimensoes.rotulo}`}>
          {rotuloDeElo(tier, divisao)}
        </p>
      )}
    </div>
  );
}
