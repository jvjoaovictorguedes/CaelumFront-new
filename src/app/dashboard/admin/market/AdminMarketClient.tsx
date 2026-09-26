"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  cancelarMarketListingAdmin,
  listarMarketListingsAdmin,
  listarMarketTransactionsAdmin,
  mensagemDeErroAdmin,
  type MarketListingAdminApi,
  type MarketTransactionAdminApi,
} from "@/lib/api/admin";

type Aba = "Anuncios" | "Historico";

const CORES_STATUS: Record<string, string> = {
  Ativo: "bg-green-500/20 text-green-300",
  Vendido: "bg-blue-500/20 text-blue-300",
  Cancelado: "bg-white/10 text-white/60",
};

export default function AdminMarketClient() {
  const [aba, setAba] = useState<Aba>("Anuncios");
  const [erro, setErro] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Mercado P2P</h1>
        <p className="mt-1 text-sm text-white/60">Moderar anúncios ativos e consultar o histórico de vendas.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["Anuncios", "Historico"] as Aba[]).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => {
              setAba(a);
              setErro("");
            }}
            className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${
              aba === a ? "bg-[#F3B43F] text-black" : "bg-black/20 text-white/70 hover:text-white"
            }`}
          >
            {a === "Anuncios" ? "Anúncios" : "Histórico de Vendas"}
          </button>
        ))}
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}

      {aba === "Anuncios" ? <AbaAnuncios onErro={setErro} /> : <AbaHistorico onErro={setErro} />}
    </div>
  );
}

function AbaAnuncios({ onErro }: { onErro: (m: string) => void }) {
  const [listings, setListings] = useState<MarketListingAdminApi[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const porPagina = 20;
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState("Ativo");

  const [cancelando, setCancelando] = useState<MarketListingAdminApi | null>(null);
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const resultado = await listarMarketListingsAdmin({ pagina, porPagina, status: filtroStatus || undefined });
      setListings(resultado.itens);
      setTotal(resultado.total);
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível carregar os anúncios."));
    } finally {
      setCarregando(false);
    }
  }, [pagina, filtroStatus, onErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function confirmarCancelamento(e: React.FormEvent) {
    e.preventDefault();
    if (!cancelando) return;
    setSalvando(true);
    try {
      await cancelarMarketListingAdmin(cancelando.id, motivo);
      setCancelando(null);
      setMotivo("");
      await carregar();
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível cancelar o anúncio."));
    } finally {
      setSalvando(false);
    }
  }

  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

  return (
    <div className="flex flex-col gap-3">
      <select
        value={filtroStatus}
        onChange={(e) => {
          setPagina(1);
          setFiltroStatus(e.target.value);
        }}
        className="w-fit rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white"
      >
        <option value="">Todos os status</option>
        <option value="Ativo">Ativo</option>
        <option value="Vendido">Vendido</option>
        <option value="Cancelado">Cancelado</option>
      </select>

      <div className="overflow-x-auto rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80">
        <table className="w-full text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-white/50">
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2">Vendedor</th>
              <th className="px-3 py-2">Qtd. restante</th>
              <th className="px-3 py-2">Preço unit.</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-white/50">Carregando...</td></tr>
            ) : listings.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-white/50">Nenhum anúncio encontrado.</td></tr>
            ) : (
              listings.map((l) => (
                <tr key={l.id} className="border-b border-white/5">
                  <td className="px-3 py-2 font-bold">{l.item?.nome ?? `#${l.id_item}`}</td>
                  <td className="px-3 py-2 text-white/60">{l.vendedor?.nome ?? `#${l.id_personagem_vendedor}`}</td>
                  <td className="px-3 py-2">{l.quantidade_restante}/{l.quantidade_total}</td>
                  <td className="px-3 py-2">{l.preco_unitario.toLocaleString("pt-BR")}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${CORES_STATUS[l.status] ?? "bg-white/10 text-white/60"}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {l.status === "Ativo" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCancelando(l);
                          setMotivo("");
                        }}
                        className="text-red-400 hover:underline"
                      >
                        Cancelar
                      </button>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-white/60">
        <span>{total} anúncio(s) — página {pagina} de {totalPaginas}</span>
        <div className="flex gap-2">
          <button type="button" disabled={pagina <= 1} onClick={() => setPagina((p) => Math.max(1, p - 1))} className="rounded-lg border border-white/20 px-3 py-1 disabled:opacity-30">
            Anterior
          </button>
          <button type="button" disabled={pagina >= totalPaginas} onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} className="rounded-lg border border-white/20 px-3 py-1 disabled:opacity-30">
            Próxima
          </button>
        </div>
      </div>

      {cancelando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setCancelando(null)}>
          <form onSubmit={confirmarCancelamento} onClick={(e) => e.stopPropagation()} className="flex w-full max-w-md flex-col gap-3 rounded-2xl border-2 border-red-500 bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-red-400">Cancelar anúncio de &quot;{cancelando.item?.nome}&quot;?</p>
            <p className="text-sm text-white/60">O item (ou o que restou anunciado) volta pro inventário do vendedor.</p>
            <label className="flex flex-col gap-1 text-xs">Motivo (obrigatório)
              <textarea required value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setCancelando(null)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">Voltar</button>
              <button type="submit" disabled={salvando} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">
                {salvando ? "Cancelando..." : "Cancelar anúncio"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function AbaHistorico({ onErro }: { onErro: (m: string) => void }) {
  const [transacoes, setTransacoes] = useState<MarketTransactionAdminApi[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const porPagina = 20;
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const resultado = await listarMarketTransactionsAdmin({ pagina, porPagina });
      setTransacoes(resultado.itens);
      setTotal(resultado.total);
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível carregar o histórico."));
    } finally {
      setCarregando(false);
    }
  }, [pagina, onErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80">
        <table className="w-full text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-white/50">
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2">Vendedor</th>
              <th className="px-3 py-2">Comprador</th>
              <th className="px-3 py-2">Qtd.</th>
              <th className="px-3 py-2">Preço total</th>
              <th className="px-3 py-2">Taxa</th>
              <th className="px-3 py-2">Líquido vendedor</th>
              <th className="px-3 py-2">Data</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={8} className="px-3 py-4 text-center text-white/50">Carregando...</td></tr>
            ) : transacoes.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-4 text-center text-white/50">Nenhuma venda registrada.</td></tr>
            ) : (
              transacoes.map((t) => (
                <tr key={t.id} className="border-b border-white/5">
                  <td className="px-3 py-2 font-bold">{t.item?.nome ?? `#${t.id_item}`}</td>
                  <td className="px-3 py-2 text-white/60">{t.vendedor?.nome ?? "—"}</td>
                  <td className="px-3 py-2 text-white/60">{t.comprador?.nome ?? "—"}</td>
                  <td className="px-3 py-2">{t.quantidade}</td>
                  <td className="px-3 py-2">{t.preco_total.toLocaleString("pt-BR")}</td>
                  <td className="px-3 py-2 text-white/60">{t.taxa.toLocaleString("pt-BR")}</td>
                  <td className="px-3 py-2">{t.valor_liquido_vendedor.toLocaleString("pt-BR")}</td>
                  <td className="px-3 py-2 text-white/60">{new Date(t.createdAt).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-white/60">
        <span>{total} venda(s) — página {pagina} de {totalPaginas}</span>
        <div className="flex gap-2">
          <button type="button" disabled={pagina <= 1} onClick={() => setPagina((p) => Math.max(1, p - 1))} className="rounded-lg border border-white/20 px-3 py-1 disabled:opacity-30">
            Anterior
          </button>
          <button type="button" disabled={pagina >= totalPaginas} onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} className="rounded-lg border border-white/20 px-3 py-1 disabled:opacity-30">
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
