"use client";

import { useEffect, useState } from "react";
import { obterGuildJournal, type CategoriaGuildJournal, type GuildJournalEntryApi } from "@/lib/api/guildJournal";

const ROTULO_CATEGORIA: Record<CategoriaGuildJournal, string> = {
  ConquistaIndividual: "Conquista Individual",
  ConquistaDeGuilda: "Conquista de Guilda",
  Evento: "Evento",
  Outro: "Novidade",
};

const COR_CATEGORIA: Record<CategoriaGuildJournal, string> = {
  ConquistaIndividual: "bg-green-500/20 text-green-300",
  ConquistaDeGuilda: "bg-blue-500/20 text-blue-300",
  Evento: "bg-purple-500/20 text-purple-300",
  Outro: "bg-white/10 text-white/70",
};

export default function GuildJournalPanel() {
  const [notas, setNotas] = useState<GuildJournalEntryApi[] | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    obterGuildJournal()
      .then(setNotas)
      .catch(() => setErro("Não foi possível carregar o Jornal da Guilda."));
  }, []);

  if (erro) {
    return <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>;
  }

  if (!notas) {
    return <p className="text-center text-white/50">Carregando...</p>;
  }

  if (notas.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-center text-white shadow-xl">
        <p className="text-white/70">
          Nada registrado ainda. As maiores conquistas de Caelum aparecem aqui assim que acontecem.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {notas.map((nota) => (
        <div
          key={nota.id}
          className={`rounded-2xl border-2 bg-[#292018]/90 p-4 text-white shadow-xl ${
            nota.destaque ? "border-[#F3B43F]" : "border-[#F3B43F]/30"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${COR_CATEGORIA[nota.categoria]}`}>
              {ROTULO_CATEGORIA[nota.categoria]}
            </span>
            <span className="text-xs text-white/50">{nota.publicado_em}</span>
          </div>
          <h3 className="mt-2 font-imFeel text-lg text-[#F3B43F]">{nota.titulo}</h3>
          {(nota.personagem_nome || nota.guilda_nome) && (
            <p className="mt-1 text-xs text-white/60">
              {nota.personagem_nome}
              {nota.personagem_nome && nota.guilda_nome ? " · " : ""}
              {nota.guilda_nome}
            </p>
          )}
          <p className="mt-2 text-sm text-white/80">{nota.resumo || nota.descricao}</p>
          {nota.resumo && nota.descricao !== nota.resumo && (
            <p className="mt-2 text-sm text-white/60">{nota.descricao}</p>
          )}
        </div>
      ))}
    </div>
  );
}
