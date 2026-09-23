"use client";

// Cartão do Aventureiro — bloco Hero do Perfil (Especificação Perfil de
// Jogador §7/§8). Identidade em poucos segundos, nada de estatística
// pesada aqui.
import type { PerfilJogador } from "@/lib/api/profile";

function Avatar({ nome }: { nome: string }) {
  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-[#F3B43F] bg-gradient-to-br from-[#4a3a28] to-[#1c150f] text-3xl font-bold text-[#F3B43F] shadow-xl sm:h-28 sm:w-28">
      {nome.charAt(0).toUpperCase()}
    </div>
  );
}

export default function AdventurerHero({ perfil }: { perfil: PerfilJogador }) {
  const { identity, combatPower, guild, pvp } = perfil;

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl sm:flex-row sm:items-start sm:text-left">
      <Avatar nome={identity.nome} />

      <div className="flex min-w-0 flex-1 flex-col items-center gap-1 sm:items-start">
        <h1 className="font-imFeel text-3xl text-[#F3B43F]">{identity.nome}</h1>
        {identity.titulo && <p className="text-sm italic text-white/70">{identity.titulo}</p>}

        <p className="text-sm text-white/80">
          {identity.classe ?? "?"} • Nv. {identity.nivel}
          {identity.raca && ` • ${identity.raca}`}
        </p>
        {identity.natureza_magica && (
          <p className="text-xs text-white/60">Natureza: {identity.natureza_magica}</p>
        )}

        <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
          {combatPower && (
            <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-bold text-[#F3B43F]">
              Poder: {combatPower.total.toLocaleString("pt-BR")}
            </span>
          )}
          <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-bold text-white/80">
            Rank {perfil.progression.rank_aventureiro.rank}
          </span>
          {pvp.ranked && (
            <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-bold text-white/80">
              {pvp.ranked.tier_label}
            </span>
          )}
          {guild && (
            <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-bold text-white/80">
              {guild.nome} [{guild.sigla}]
            </span>
          )}
        </div>

        {identity.frase && (
          <p className="mt-3 max-w-md text-sm italic text-[#F3B43F]/90">&ldquo;{identity.frase}&rdquo;</p>
        )}
      </div>
    </div>
  );
}
