"use client";

// PvP do perfil — só Arena Ranqueada (temporada atual + medalhas de
// temporadas encerradas), com o emblema do Elo.
import Image from "next/image";
import EloBadge from "@/components/pvp/EloBadge";
import type { PerfilPvp } from "@/lib/api/profile";

function Linha({ label, valor }: { label: string; valor: string | number }) {
  return (
    <p className="text-white/70">
      {label}: <span className="font-bold text-white">{valor}</span>
    </p>
  );
}

function Medalha({ icone, label, valor }: { icone: string; label: string; valor: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <Image src={icone} alt="" width={18} height={20} className="shrink-0" />
      <span className="text-white/70">
        {label}: <span className="font-bold text-white">{valor}</span>
      </span>
    </div>
  );
}

export default function PvpProfileSummary({ pvp }: { pvp: PerfilPvp }) {
  return (
    <div className="rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-4 text-white shadow-lg">
      <p className="mb-3 text-xs uppercase tracking-widest text-[#F3B43F]">
        PvP Ranqueado{pvp.temporada?.nome ? ` • ${pvp.temporada.nome}` : ""}
      </p>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <EloBadge tier={pvp.ranked?.tier} divisao={pvp.ranked?.divisao} tamanho="md" />

        <div className="grid flex-1 grid-cols-1 gap-y-1 text-sm">
          {pvp.ranked ? (
            <>
              <Linha label="Rating" valor={pvp.ranked.rating} />
              <Linha label="Pico da temporada" valor={`${pvp.ranked.pico_tier_label} (${pvp.ranked.pico_rating})`} />
            </>
          ) : (
            <p className="text-white/50">Ainda sem classificação ranqueada.</p>
          )}
          <Linha label="Vitórias" valor={pvp.vitorias_temporada} />
          <Linha label="Derrotas" valor={pvp.derrotas_temporada} />
          {pvp.taxa_vitoria_temporada !== null && (
            <Linha label="Taxa de vitória" valor={`${pvp.taxa_vitoria_temporada}%`} />
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-white/10 pt-2 text-sm">
        <Medalha icone="/images/badges/medalha-ouro.png" label="Ouro" valor={pvp.medalhas.ouro} />
        <Medalha icone="/images/badges/medalha-prata.png" label="Prata" valor={pvp.medalhas.prata} />
        <Medalha icone="/images/badges/medalha-bronze.png" label="Bronze" valor={pvp.medalhas.bronze} />
      </div>
    </div>
  );
}
