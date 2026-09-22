"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  buscarStatusRanked,
  buscarTrofeusTorneio,
  rotuloDeElo,
  type StatusRanked,
  type TrofeusTorneio,
} from "@/lib/api/pvp";

/**
 * Rodapé competitivo da aba Status do personagem.
 *
 * Layout pedido pelo usuário (referência visual): bloco à esquerda com
 * medalhas (Ouro/Prata/Bronze) + Vitórias/Derrotas/Arena da temporada
 * ranqueada; bloco à direita só com o Troféu. Empilha no mobile.
 *
 * Ajuste importante de semântica (pós-lançamento): Troféu e Medalha
 * pararam de vir da mesma fonte —
 * - Troféu = título de TORNEIO (torneios vencidos), como sempre foi.
 * - Medalha (Ouro/Prata/Bronze) = 1º/2º/3º lugar em TEMPORADA RANQUEADA
 *   encerrada, não mais pódio de torneio. Por isso usamos
 *   `trofeus.trofeus` pro número grande (não `trofeus.ouro` — antes os
 *   dois eram sempre iguais por definição, agora não são mais).
 */
export default function PvpStatsCard({ characterId }: { characterId: number }) {
  const [ranked, setRanked] = useState<StatusRanked | null>(null);
  const [trofeus, setTrofeus] = useState<TrofeusTorneio | null>(null);

  useEffect(() => {
    let cancelado = false;
    // As duas chamadas já engolem erro e devolvem null — o card mostra
    // "—"/zeros em vez de quebrar a aba Status.
    buscarStatusRanked().then((dados) => {
      if (!cancelado) setRanked(dados);
    });
    buscarTrofeusTorneio(characterId).then((dados) => {
      if (!cancelado) setTrofeus(dados);
    });
    return () => {
      cancelado = true;
    };
  }, [characterId]);

  const ouro = trofeus?.ouro ?? 0;
  const prata = trofeus?.prata ?? 0;
  const bronze = trofeus?.bronze ?? 0;
  const titulos = trofeus?.trofeus ?? 0;
  const arena = ranked?.tier ? rotuloDeElo(ranked.tier, ranked.division) : "—";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
      <div className="rounded-2xl border-2 border-[#F3B43F]/50 bg-[#292018] p-4 shadow-lg">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <LinhaMedalha icone="/images/badges/medalha-ouro.png" label="Ouro" valor={ouro} />
          <LinhaTexto label="Vitórias" valor={ranked?.seasonWins ?? 0} />
          <LinhaMedalha icone="/images/badges/medalha-prata.png" label="Prata" valor={prata} />
          <LinhaTexto label="Derrotas" valor={ranked?.seasonLosses ?? 0} />
          <LinhaMedalha icone="/images/badges/medalha-bronze.png" label="Bronze" valor={bronze} />
          <LinhaTexto label="Arena" valor={arena} />
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 rounded-2xl border-2 border-[#F3B43F]/50 bg-[#292018] p-4 shadow-lg sm:min-w-[11rem]">
        <Image
          src="/images/badges/trofeu.png"
          alt=""
          width={56}
          height={52}
          className="shrink-0"
        />
        <div>
          <p className="font-imFeel text-3xl leading-none text-[#F3B43F]">{titulos}</p>
          <p className="text-xs uppercase tracking-widest text-white/60">Troféus</p>
        </div>
      </div>
    </div>
  );
}

function LinhaMedalha({ icone, label, valor }: { icone: string; label: string; valor: number }) {
  return (
    <div className="flex items-center gap-2">
      <Image src={icone} alt="" width={22} height={24} className="shrink-0" />
      <p className="text-sm text-white/85">
        <span className="text-[#F3B43F]">{label}:</span>{" "}
        <span className="font-bold text-white">{valor}</span>
      </p>
    </div>
  );
}

function LinhaTexto({ label, valor }: { label: string; valor: string | number }) {
  return (
    <div className="flex items-center">
      <p className="truncate text-sm text-white/85">
        <span className="text-[#F3B43F]">{label}:</span>{" "}
        <span className="font-bold text-white">{valor}</span>
      </p>
    </div>
  );
}
