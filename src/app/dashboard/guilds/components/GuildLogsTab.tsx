"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import type { LogGuild } from "./types";

const LABEL_TIPO: Record<string, string> = {
  criacao: "Guilda fundada",
  entrada: "Entrou na guilda",
  saida: "Saiu da guilda",
  expulsao: "Foi expulso",
  convite: "Convite enviado",
  candidatura_aceita: "Candidatura aceita",
  cargo_alterado: "Cargo alterado",
  permissao_alterada: "Permissão alterada",
  edicao_identidade: "Identidade da guilda editada",
  doacao: "Doação ao tesouro",
  gasto: "Gasto do tesouro",
  lideranca_transferida: "Liderança transferida",
  dissolucao: "Guilda dissolvida",
};

export default function GuildLogsTab({ idGuild }: { idGuild: number }) {
  const [logs, setLogs] = useState<LogGuild[] | null>(null);

  useEffect(() => {
    axiosInstance
      .get<{ data?: { logs?: LogGuild[] } }>(`/guilds/${idGuild}/logs`)
      .then((resp) => setLogs(resp.data?.data?.logs ?? []))
      .catch((error) => {
        console.error("Erro ao carregar logs:", error);
        setLogs([]);
      });
  }, [idGuild]);

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      <p className="mb-3 text-sm uppercase tracking-widest text-[#F3B43F]">
        Logs administrativos
      </p>
      {logs === null ? (
        <p className="text-sm text-white/60">Carregando...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-white/60">Nenhum registro ainda.</p>
      ) : (
        <div className="flex max-h-[28rem] flex-col gap-1 overflow-y-auto">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            >
              <span className="min-w-0 flex-1">
                {LABEL_TIPO[log.tipo] ?? log.tipo}
                {log.detalhes ? ` — ${log.detalhes}` : ""}
              </span>
              <span className="shrink-0 text-xs text-white/40">
                {new Date(log.createdAt).toLocaleString("pt-BR")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
