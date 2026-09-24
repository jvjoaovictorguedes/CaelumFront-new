"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { listarAuditoriaAdmin, mensagemDeErroAdmin, type LogAuditoriaApi } from "@/lib/api/admin";

export default function AdminAuditClient() {
  const [logs, setLogs] = useState<LogAuditoriaApi[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const porPagina = 25;
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [filtroEntidade, setFiltroEntidade] = useState("");
  const [filtroAcao, setFiltroAcao] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resultado = await listarAuditoriaAdmin({
        pagina,
        porPagina,
        entidade: filtroEntidade || undefined,
        acao: filtroAcao || undefined,
      });
      setLogs(resultado.itens);
      setTotal(resultado.total);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar a auditoria."));
    } finally {
      setCarregando(false);
    }
  }, [pagina, filtroEntidade, filtroAcao]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Auditoria</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Filtrar por entidade (ex.: Item)..."
          value={filtroEntidade}
          onChange={(e) => {
            setPagina(1);
            setFiltroEntidade(e.target.value);
          }}
          className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white"
        />
        <input
          type="text"
          placeholder="Filtrar por ação (ex.: desativar)..."
          value={filtroAcao}
          onChange={(e) => {
            setPagina(1);
            setFiltroAcao(e.target.value);
          }}
          className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white"
        />
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}

      <div className="flex flex-col gap-2">
        {carregando ? (
          <p className="text-sm text-white/50">Carregando...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-white/50">Nenhuma ação registrada com esses filtros.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="rounded-xl border border-white/10 bg-[#292018]/80 p-3 text-sm text-white">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-[#F3B43F]">
                  {log.acao} · {log.entidade}
                  {log.id_entidade != null && ` #${log.id_entidade}`}
                </span>
                <span className="text-xs text-white/50">{new Date(log.createdAt).toLocaleString("pt-BR")}</span>
              </div>
              <p className="text-xs text-white/60">Admin: usuário #{log.id_admin}</p>
              {log.motivo && <p className="mt-1 text-xs text-white/80">Motivo: {log.motivo}</p>}
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-white/60">
        <span>
          {total} ação(ões) — página {pagina} de {totalPaginas}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pagina <= 1}
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-white/20 px-3 py-1 disabled:opacity-30"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            className="rounded-lg border border-white/20 px-3 py-1 disabled:opacity-30"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
