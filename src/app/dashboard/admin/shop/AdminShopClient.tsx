"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  atualizarItemAdmin,
  listarItensAdmin,
  mensagemDeErroAdmin,
  type AdminItemApi,
} from "@/lib/api/admin";

interface LinhaEdicao {
  valor_compra: number;
  valor_venda: number;
  disponivel_loja: boolean;
}

export default function AdminShopClient() {
  const [itens, setItens] = useState<AdminItemApi[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const porPagina = 30;
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [apenasNaLoja, setApenasNaLoja] = useState(true);
  const [filtroNome, setFiltroNome] = useState("");

  const [edicoes, setEdicoes] = useState<Record<number, LinhaEdicao>>({});
  const [salvandoId, setSalvandoId] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resultado = await listarItensAdmin({
        pagina,
        porPagina,
        nome: filtroNome || undefined,
        disponivelLoja: apenasNaLoja ? true : undefined,
      });
      setItens(resultado.itens);
      setTotal(resultado.total);
      setEdicoes(
        Object.fromEntries(
          resultado.itens.map((i) => [i.id, { valor_compra: i.valor_compra, valor_venda: i.valor_venda, disponivel_loja: i.disponivel_loja }]),
        ),
      );
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar os itens."));
    } finally {
      setCarregando(false);
    }
  }, [pagina, filtroNome, apenasNaLoja]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function atualizarEdicao(id: number, campo: keyof LinhaEdicao, valor: number | boolean) {
    setEdicoes((atual) => ({ ...atual, [id]: { ...atual[id], [campo]: valor } }));
  }

  async function salvar(item: AdminItemApi) {
    const edicao = edicoes[item.id];
    if (!edicao) return;
    setSalvandoId(item.id);
    setErro("");
    try {
      await atualizarItemAdmin(item.id, {
        item: {
          nome: item.nome,
          descricao: item.descricao,
          tipo_item: item.tipo_item,
          raridade: item.raridade,
          valor_compra: edicao.valor_compra,
          valor_venda: edicao.valor_venda,
          disponivel_loja: edicao.disponivel_loja,
        },
      });
      setMensagem(`"${item.nome}" atualizado.`);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar o item."));
    } finally {
      setSalvandoId(null);
    }
  }

  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Loja NPC</h1>
        <p className="mt-1 text-sm text-white/60">
          Preços e disponibilidade dos itens na Loja NPC. Reaproveita o mesmo cadastro de Itens — pra editar outros
          campos (raridade, tipo, propriedades), use <Link href="/dashboard/admin/items" className="text-[#F3B43F] hover:underline">Itens</Link>.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={filtroNome}
          onChange={(e) => {
            setPagina(1);
            setFiltroNome(e.target.value);
          }}
          className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white"
        />
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            checked={apenasNaLoja}
            onChange={(e) => {
              setPagina(1);
              setApenasNaLoja(e.target.checked);
            }}
          />
          Só itens disponíveis na loja
        </label>
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      {mensagem && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-[#F3B43F]">{mensagem}</p>}

      <div className="overflow-x-auto rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80">
        <table className="w-full text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-white/50">
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Preço de compra</th>
              <th className="px-3 py-2">Preço de venda</th>
              <th className="px-3 py-2">Na loja?</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-white/50">Carregando...</td></tr>
            ) : itens.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-white/50">Nenhum item encontrado.</td></tr>
            ) : (
              itens.map((item) => {
                const edicao = edicoes[item.id];
                if (!edicao) return null;
                return (
                  <tr key={item.id} className="border-b border-white/5">
                    <td className="px-3 py-2 font-bold">{item.nome} <span className="text-white/40">#{item.id}</span></td>
                    <td className="px-3 py-2 text-white/60">{item.tipo_item}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={edicao.valor_compra}
                        onChange={(e) => atualizarEdicao(item.id, "valor_compra", Number(e.target.value))}
                        className="w-24 rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={edicao.valor_venda}
                        onChange={(e) => atualizarEdicao(item.id, "valor_venda", Number(e.target.value))}
                        className="w-24 rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={edicao.disponivel_loja}
                        onChange={(e) => atualizarEdicao(item.id, "disponivel_loja", e.target.checked)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        disabled={salvandoId === item.id}
                        onClick={() => salvar(item)}
                        className="rounded-lg bg-[#BC8418] px-3 py-1 text-xs font-bold text-black hover:bg-[#a5710f] disabled:opacity-50"
                      >
                        {salvandoId === item.id ? "Salvando..." : "Salvar"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-white/60">
        <span>{total} item(ns) — página {pagina} de {totalPaginas}</span>
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
