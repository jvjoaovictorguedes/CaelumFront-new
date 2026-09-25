"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  buscarJogadoresAdmin,
  corrigirStackInventarioAdmin,
  mensagemDeErroAdmin,
  obterInventarioAdmin,
  removerEquipamentoInventarioAdmin,
  type CharacterInventoryAdminApi,
  type PlayerSearchResultApi,
} from "@/lib/api/admin";

export default function AdminInventoryClient() {
  const searchParams = useSearchParams();
  const idInicial = searchParams.get("id");

  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<PlayerSearchResultApi[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [idSelecionado, setIdSelecionado] = useState<number | null>(idInicial ? Number(idInicial) : null);
  const [inventario, setInventario] = useState<CharacterInventoryAdminApi | null>(null);
  const [carregandoInventario, setCarregandoInventario] = useState(false);

  const [edicaoStack, setEdicaoStack] = useState<{ idItem: number; nome: string; quantidadeAtual: number } | null>(null);
  const [novaQuantidade, setNovaQuantidade] = useState(0);
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [removendoInstancia, setRemovendoInstancia] = useState<{ id: number; nome: string } | null>(null);
  const [motivoRemocao, setMotivoRemocao] = useState("");

  const carregarInventario = useCallback(async (id: number) => {
    setCarregandoInventario(true);
    setErro("");
    try {
      setInventario(await obterInventarioAdmin(id));
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar o inventário."));
    } finally {
      setCarregandoInventario(false);
    }
  }, []);

  useEffect(() => {
    if (idSelecionado) carregarInventario(idSelecionado);
  }, [idSelecionado, carregarInventario]);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    setBuscando(true);
    setErro("");
    try {
      setResultados(await buscarJogadoresAdmin(termo));
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível buscar."));
    } finally {
      setBuscando(false);
    }
  }

  function abrirCorrecaoStack(idItem: number, nome: string, quantidadeAtual: number) {
    setEdicaoStack({ idItem, nome, quantidadeAtual });
    setNovaQuantidade(quantidadeAtual);
    setMotivo("");
  }

  async function salvarCorrecao(e: React.FormEvent) {
    e.preventDefault();
    if (!idSelecionado || !edicaoStack) return;
    setSalvando(true);
    try {
      await corrigirStackInventarioAdmin(idSelecionado, edicaoStack.idItem, novaQuantidade, motivo);
      setMensagem(`Quantidade de "${edicaoStack.nome}" corrigida pra ${novaQuantidade}.`);
      setEdicaoStack(null);
      await carregarInventario(idSelecionado);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível corrigir o item."));
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarRemocao(e: React.FormEvent) {
    e.preventDefault();
    if (!idSelecionado || !removendoInstancia) return;
    setSalvando(true);
    try {
      await removerEquipamentoInventarioAdmin(removendoInstancia.id, motivoRemocao);
      setMensagem(`"${removendoInstancia.nome}" removido do inventário.`);
      setRemovendoInstancia(null);
      setMotivoRemocao("");
      await carregarInventario(idSelecionado);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível remover o equipamento."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Inventário — Correções</h1>
        <p className="mt-1 text-sm text-white/60">
          Corrija a quantidade de um item empilhável ou remova uma peça de equipamento indevida. Toda correção exige motivo e fica na auditoria.
        </p>
      </div>

      {!idSelecionado && (
        <>
          <form onSubmit={buscar} className="flex gap-2">
            <input
              type="text"
              required
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Nome, username ou ID do personagem..."
              className="flex-1 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
            />
            <button type="submit" disabled={buscando} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
              {buscando ? "Buscando..." : "Buscar"}
            </button>
          </form>

          {resultados && (
            <div className="overflow-x-auto rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80">
              <table className="w-full text-left text-sm text-white">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase text-white/50">
                    <th className="px-3 py-2">Personagem</th>
                    <th className="px-3 py-2">Conta</th>
                    <th className="px-3 py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.length === 0 ? (
                    <tr><td colSpan={3} className="px-3 py-4 text-center text-white/50">Nenhum jogador encontrado.</td></tr>
                  ) : (
                    resultados.map((p) => (
                      <tr key={p.id} className="border-b border-white/5">
                        <td className="px-3 py-2 font-bold">{p.nome} <span className="text-white/40">#{p.id}</span></td>
                        <td className="px-3 py-2 text-white/60">{p.username ?? "—"}</td>
                        <td className="px-3 py-2">
                          <button type="button" onClick={() => setIdSelecionado(p.id)} className="text-[#F3B43F] hover:underline">
                            Ver inventário
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      {mensagem && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-[#F3B43F]">{mensagem}</p>}

      {idSelecionado && (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => {
              setIdSelecionado(null);
              setInventario(null);
              setResultados(null);
            }}
            className="self-start text-sm text-white/60 hover:underline"
          >
            ← Buscar outro jogador
          </button>

          {carregandoInventario ? (
            <p className="text-sm text-white/60">Carregando...</p>
          ) : inventario ? (
            <>
              <p className="font-imFeel text-xl text-[#F3B43F]">{inventario.personagem.nome} <span className="text-sm text-white/40">#{inventario.personagem.id}</span></p>

              <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#F3B43F]/80">Itens empilháveis</p>
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left text-sm text-white">
                    <thead>
                      <tr className="border-b border-white/10 text-xs uppercase text-white/50">
                        <th className="px-3 py-2">Item</th>
                        <th className="px-3 py-2">Tipo</th>
                        <th className="px-3 py-2">Quantidade</th>
                        <th className="px-3 py-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventario.stacks.length === 0 ? (
                        <tr><td colSpan={4} className="px-3 py-4 text-center text-white/50">Inventário vazio.</td></tr>
                      ) : (
                        inventario.stacks.map((s) => (
                          <tr key={s.id_personagem_inventario} className="border-b border-white/5">
                            <td className="px-3 py-2 font-bold">{s.itemEspolio?.nome ?? `#${s.id_item}`}</td>
                            <td className="px-3 py-2 text-white/60">{s.itemEspolio?.tipo_item ?? "—"}</td>
                            <td className="px-3 py-2">{s.quantidade}</td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => abrirCorrecaoStack(s.id_item, s.itemEspolio?.nome ?? `#${s.id_item}`, s.quantidade)}
                                className="text-[#F3B43F] hover:underline"
                              >
                                Corrigir
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#F3B43F]/80">Equipamentos</p>
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left text-sm text-white">
                    <thead>
                      <tr className="border-b border-white/10 text-xs uppercase text-white/50">
                        <th className="px-3 py-2">Item</th>
                        <th className="px-3 py-2">Refinamento</th>
                        <th className="px-3 py-2">Estado</th>
                        <th className="px-3 py-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventario.equipamentos.length === 0 ? (
                        <tr><td colSpan={4} className="px-3 py-4 text-center text-white/50">Nenhum equipamento.</td></tr>
                      ) : (
                        inventario.equipamentos.map((eq) => (
                          <tr key={eq.id} className="border-b border-white/5">
                            <td className="px-3 py-2 font-bold">{eq.item?.nome ?? `#${eq.id_item}`}</td>
                            <td className="px-3 py-2">+{eq.refinamento}</td>
                            <td className="px-3 py-2">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${eq.estado === "Inventario" ? "bg-white/10 text-white/70" : "bg-green-500/20 text-green-300"}`}>
                                {eq.estado}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              {eq.estado === "Inventario" ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRemovendoInstancia({ id: eq.id, nome: eq.item?.nome ?? `#${eq.id_item}` });
                                    setMotivoRemocao("");
                                  }}
                                  className="text-red-400 hover:underline"
                                >
                                  Remover
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
              </div>
            </>
          ) : null}
        </div>
      )}

      {edicaoStack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setEdicaoStack(null)}>
          <form onSubmit={salvarCorrecao} onClick={(e) => e.stopPropagation()} className="flex w-full max-w-md flex-col gap-3 rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-[#F3B43F]">Corrigir &quot;{edicaoStack.nome}&quot;</p>
            <p className="text-sm text-white/60">Quantidade atual: {edicaoStack.quantidadeAtual}</p>
            <label className="flex flex-col gap-1 text-xs">Nova quantidade
              <input type="number" min={0} required value={novaQuantidade} onChange={(e) => setNovaQuantidade(Number(e.target.value))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs">Motivo (obrigatório)
              <textarea required value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setEdicaoStack(null)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">Cancelar</button>
              <button type="submit" disabled={salvando} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {removendoInstancia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setRemovendoInstancia(null)}>
          <form onSubmit={confirmarRemocao} onClick={(e) => e.stopPropagation()} className="flex w-full max-w-md flex-col gap-3 rounded-2xl border-2 border-red-500 bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-red-400">Remover &quot;{removendoInstancia.nome}&quot;?</p>
            <p className="text-sm text-white/60">Essa ação é irreversível.</p>
            <label className="flex flex-col gap-1 text-xs">Motivo (obrigatório)
              <textarea required value={motivoRemocao} onChange={(e) => setMotivoRemocao(e.target.value)} rows={2} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setRemovendoInstancia(null)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">Cancelar</button>
              <button type="submit" disabled={salvando} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">
                {salvando ? "Removendo..." : "Remover"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
