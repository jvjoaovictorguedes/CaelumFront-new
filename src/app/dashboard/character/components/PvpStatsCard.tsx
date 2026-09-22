"use client";

import { useEffect, useState } from "react";
import EloBadge from "@/components/pvp/EloBadge";
import {
  buscarStatusRanked,
  buscarTrofeusTorneio,
  type StatusRanked,
  type TrofeusTorneio,
} from "@/lib/api/pvp";

/**
 * Rodapé competitivo da aba Status do personagem.
 *
 * Substitui o antigo card "Arena", que mostrava Vitórias/Derrotas do
 * CASUAL e a "Patente de Arena" (Recruta/Aprendiz/Veterano/Campeão/
 * Mestre/Grão-Mestre). A Patente deixou de existir: o competitivo agora
 * é Tier + Divisão + Rating. E, por §38 da spec, o perfil não mostra
 * mais V/D casual — só o retrospecto RANQUEADO da temporada atual.
 *
 * Layout: bloco competitivo à esquerda, troféus de torneio à direita;
 * empilhados no mobile.
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

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-black/10 bg-[#3a2f24] p-5 shadow-lg">
        <p className="mb-3 font-imFeel text-xl text-[#F3B43F]">Arena Ranqueada</p>
        <div className="flex items-center gap-5">
          <EloBadge tier={ranked?.tier} divisao={ranked?.division} tamanho="md" />
          <div className="grid flex-1 grid-cols-2 gap-2 text-center">
            <Celula label="Rating" valor={ranked?.rating ?? "—"} />
            <Celula label="Melhor" valor={ranked?.peakRating ?? "—"} />
            <Celula label="Vitórias" valor={ranked?.seasonWins ?? 0} />
            <Celula label="Derrotas" valor={ranked?.seasonLosses ?? 0} />
          </div>
        </div>
        <p className="mt-2 text-[10px] uppercase tracking-widest text-black/50">
          Retrospecto da temporada atual
        </p>
      </div>

      <div className="rounded-2xl border border-black/10 bg-[#3a2f24] p-5 shadow-lg">
        <p className="mb-3 font-imFeel text-xl text-[#F3B43F]">Troféus de Torneio</p>
        <div className="flex items-center gap-4">
          <TrofeuGrande titulos={ouro} />
          <div className="grid flex-1 grid-cols-3 gap-2 text-center">
            <Medalha label="Ouro" valor={ouro} cor="#F3B43F" />
            <Medalha label="Prata" valor={prata} cor="#d7dde3" />
            <Medalha label="Bronze" valor={bronze} cor="#c08a4a" />
          </div>
        </div>
        <p className="mt-2 text-[10px] uppercase tracking-widest text-black/50">
          1º, 2º e 3º lugares em torneios
        </p>
      </div>
    </div>
  );
}

function Celula({ label, valor }: { label: string; valor: string | number }) {
  return (
    <div className="rounded-lg bg-[#F3B43F]/50 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-black/60">{label}</p>
      <p className="text-lg font-bold leading-tight">{valor}</p>
    </div>
  );
}

function Medalha({ label, valor, cor }: { label: string; valor: number; cor: string }) {
  return (
    <div className="rounded-lg bg-black/20 px-2 py-2">
      <div
        className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold"
        style={{ borderColor: cor, color: cor }}
        aria-hidden
      >
        {label[0]}
      </div>
      <p className="text-base font-bold leading-none text-white">{valor}</p>
      <p className="text-[10px] uppercase tracking-wide text-white/60">{label}</p>
    </div>
  );
}

/**
 * Troféu grande = total de títulos, que por definição é a contagem de
 * medalhas de ouro (não existe contador separado).
 *
 * Ainda não há arte de troféu no projeto e o projeto não usa nenhuma
 * biblioteca de ícones, então o troféu é um SVG inline simples no mesmo
 * dourado da identidade do site — trocar por arte real depois é só
 * substituir este bloco.
 */
function TrofeuGrande({ titulos }: { titulos: number }) {
  return (
    <div className="flex shrink-0 flex-col items-center">
      <svg
        viewBox="0 0 24 24"
        className="h-14 w-14"
        fill="none"
        stroke="#F3B43F"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" fill="#F3B43F" fillOpacity="0.25" />
        <path d="M7 5H4.5A1.5 1.5 0 0 0 3 6.5C3 8.5 4.5 10 7 10" />
        <path d="M17 5h2.5A1.5 1.5 0 0 1 21 6.5c0 2-1.5 3.5-4 3.5" />
        <path d="M12 14v3" />
        <path d="M9 20h6" />
        <path d="M10 17h4l.5 3h-5l.5-3Z" />
      </svg>
      <p className="font-imFeel text-2xl leading-none text-[#F3B43F]">{titulos}</p>
      <p className="text-[10px] uppercase tracking-widest text-black/60">Títulos</p>
    </div>
  );
}
