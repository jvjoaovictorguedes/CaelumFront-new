"use client";

// Painel Administrativo — Referral. Só leitura (permissão "referrals.view"):
// mostra quem foi indicado, por quem, e quantas indicações no total
// aquele indicador já tem.
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  listarReferralsAdmin,
  obterResumoReferralAdmin,
  mensagemDeErroAdmin,
  type IndicadoAdminApi,
  type ResumoReferralAdminApi,
} from "@/lib/api/admin";

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function AdminReferralsClient() {
  const [indicados, setIndicados] = useState<IndicadoAdminApi[]>([]);
  const [resumo, setResumo] = useState<ResumoReferralAdminApi | null>(null);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const PAGINA_TAMANHO = 50;

  const carregar = useCallback(async (paginaAlvo: number, buscaAlvo: string) => {
    setCarregando(true);
    setErro("");
    try {
      const resultado = await listarReferralsAdmin({ busca: buscaAlvo || undefined, pagina: paginaAlvo, porPagina: PAGINA_TAMANHO });
      setIndicados(resultado.indicados);
      setTotal(resultado.total);
      setTotalPaginas(resultado.totalPaginas);
      setPagina(resultado.pagina);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar as indicações."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar(1, "");
    obterResumoReferralAdmin()
      .then(setResumo)
      .catch(() => setResumo(null));
  }, [carregar]);

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    carregar(1, busca);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Referral</h1>
        <p className="mt-1 text-sm text-white/60">
          Contas que se registraram informando quem as indicou, e quantas indicações no total cada indicador já tem.
        </p>
      </div>

      {resumo && (
        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl border border-[#F3B43F]/40 bg-black/20 px-4 py-3">
            <p className="text-2xl font-bold text-[#F3B43F]">{resumo.totalIndicados}</p>
            <p className="text-xs text-white/60">Contas indicadas</p>
          </div>
          <div className="rounded-xl border border-[#F3B43F]/40 bg-black/20 px-4 py-3">
            <p className="text-2xl font-bold text-[#F3B43F]">{resumo.totalIndicadores}</p>
            <p className="text-xs text-white/60">Indicadores distintos</p>
          </div>
        </div>
      )}

      {erro && <p className="rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-300">{erro}</p>}

      <form onSubmit={buscar} className="flex flex-wrap gap-2">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por username do indicado ou do indicador..."
          className="min-w-[240px] flex-1 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
        />
        <button type="submit" className="rounded-lg border border-[#F3B43F]/50 px-4 py-2 text-sm font-bold text-[#F3B43F] hover:bg-[#F3B43F]/10">
          Buscar
        </button>
      </form>

      {carregando ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm text-white">
            <thead className="bg-black/40 text-xs uppercase text-white/50">
              <tr>
                <th className="px-3 py-2">Indicado</th>
                <th className="px-3 py-2">Registrado em</th>
                <th className="px-3 py-2">Indicado por</th>
                <th className="px-3 py-2">Total de indicações do indicador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {indicados.map((linha) => (
                <tr key={linha.id}>
                  <td className="px-3 py-2">
                    <p className="font-bold">{linha.username}</p>
                    <p className="text-xs text-white/40">{linha.email}</p>
                  </td>
                  <td className="px-3 py-2 text-white/70">{formatarData(linha.dataCriacao)}</td>
                  <td className="px-3 py-2 font-bold text-[#F3B43F]">{linha.indicadoPor.username}</td>
                  <td className="px-3 py-2 text-white/70">{linha.indicadoPor.totalIndicacoes}</td>
                </tr>
              ))}
              {indicados.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-white/50">
                    Nenhuma indicação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-center gap-3 text-sm text-white/70">
        <button
          type="button"
          disabled={pagina <= 1 || carregando}
          onClick={() => carregar(pagina - 1, busca)}
          className="rounded-lg border border-white/20 px-3 py-1.5 disabled:opacity-30"
        >
          ← Anterior
        </button>
        <span>
          Página {pagina} de {totalPaginas} ({total} indicações)
        </span>
        <button
          type="button"
          disabled={pagina >= totalPaginas || carregando}
          onClick={() => carregar(pagina + 1, busca)}
          className="rounded-lg border border-white/20 px-3 py-1.5 disabled:opacity-30"
        >
          Próxima →
        </button>
      </div>
    </div>
  );
}
