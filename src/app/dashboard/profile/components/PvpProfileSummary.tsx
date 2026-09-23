"use client";

// PvP — reaproveita as mesmas fontes do PvpStatsCard (Especificação
// Perfil de Jogador §17). Troféu de torneio != medalha de temporada.
import type { PerfilPvp } from "@/lib/api/profile";

export default function PvpProfileSummary({ pvp }: { pvp: PerfilPvp }) {
  return (
    <div className="rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-4 text-white shadow-lg">
      <p className="mb-2 text-xs uppercase tracking-widest text-[#F3B43F]">PvP</p>

      {pvp.ranked ? (
        <p className="mb-2 text-lg font-bold text-[#F3B43F]">{pvp.ranked.tier_label}</p>
      ) : (
        <p className="mb-2 text-sm text-white/50">Ainda sem classificação ranqueada.</p>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <p className="text-white/70">
          Vitórias da temporada: <span className="font-bold text-white">{pvp.vitorias_temporada}</span>
        </p>
        <p className="text-white/70">
          Derrotas da temporada: <span className="font-bold text-white">{pvp.derrotas_temporada}</span>
        </p>
        {pvp.taxa_vitoria_temporada !== null && (
          <p className="text-white/70">
            Taxa de vitória: <span className="font-bold text-white">{pvp.taxa_vitoria_temporada}%</span>
          </p>
        )}
        <p className="text-white/70">
          Melhor sequência: <span className="font-bold text-white">{pvp.melhor_sequencia}</span>
        </p>
      </div>

      <div className="mt-3 border-t border-white/10 pt-2 text-sm">
        <p className="text-white/70">
          Troféus de torneio: <span className="font-bold text-[#F3B43F]">{pvp.trofeus_torneio}</span>
        </p>
        <p className="text-white/70">
          Medalhas de temporada: {pvp.medalhas.ouro} Ouro • {pvp.medalhas.prata} Prata • {pvp.medalhas.bronze} Bronze
        </p>
      </div>
    </div>
  );
}
