"use client";

import { useEffect, useState } from "react";
import {
  marcarGuildJournalComoVisto,
  obterGuildJournalCompleto,
  type CategoriaGuildJournal,
  type GuildJournalEntryApi,
} from "@/lib/api/guildJournal";

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

// `onVisto` — notifica o pai (AdventureGuildPanel) assim que este painel
// marca as notas como lidas, pra zerar o badge da aba "Jornal" na hora
// (mesmo comportamento do PatchNotesBell: abrir = marcar como visto).
export default function GuildJournalPanel({ onVisto }: { onVisto?: () => void } = {}) {
  const [notas, setNotas] = useState<GuildJournalEntryApi[] | null>(null);
  const [ultimoIdVistoAntes, setUltimoIdVistoAntes] = useState<number | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let cancelado = false;

    obterGuildJournalCompleto()
      .then(async (resposta) => {
        if (cancelado) return;
        setNotas(resposta.notas);
        // Captura o "último visto" ANTES de marcar como lido — é o que
        // decide quais notas ganham o marcador "Novo" nesta visita.
        setUltimoIdVistoAntes(resposta.ultimo_id_visto);

        if (resposta.quantidade_nao_lida > 0) {
          try {
            await marcarGuildJournalComoVisto();
            onVisto?.();
          } catch (marcarErro) {
            console.error("Erro ao marcar o Jornal da Guilda como visto:", marcarErro);
          }
        }
      })
      .catch(() => {
        if (!cancelado) setErro("Não foi possível carregar o Jornal da Guilda.");
      });

    return () => {
      cancelado = true;
    };
  }, [onVisto]);

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
      {notas.map((nota) => {
        const ehNova = ultimoIdVistoAntes === null || nota.id > ultimoIdVistoAntes;
        return (
          <div
            key={nota.id}
            className={`rounded-2xl border-2 bg-[#292018]/90 p-4 text-white shadow-xl ${
              nota.destaque ? "border-[#F3B43F]" : "border-[#F3B43F]/30"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${COR_CATEGORIA[nota.categoria]}`}>
                  {ROTULO_CATEGORIA[nota.categoria]}
                </span>
                {ehNova && (
                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    Novo
                  </span>
                )}
              </div>
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
        );
      })}
    </div>
  );
}
