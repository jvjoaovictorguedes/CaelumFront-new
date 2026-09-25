"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  adicionarRecompensaGuildaAventureirosAdmin,
  atualizarMissaoGuildaAdmin,
  atualizarMissaoGuildaAventureirosAdmin,
  atualizarMissaoLivreAdmin,
  catalogosMissoesAdmin,
  criarMissaoGuildaAdmin,
  criarMissaoGuildaAventureirosAdmin,
  criarMissaoLivreAdmin,
  duplicarMissaoGuildaAdmin,
  duplicarMissaoGuildaAventureirosAdmin,
  duplicarMissaoLivreAdmin,
  listarMissoesGuildaAdmin,
  listarMissoesGuildaAventureirosAdmin,
  listarMissoesLivresAdmin,
  mensagemDeErroAdmin,
  removerRecompensaGuildaAventureirosAdmin,
  type AdventureGuildMissionApi,
  type GuildMissionApi,
  type MissionApi,
  type MissionCatalogosApi,
  type PayloadAdventureGuildMissionAdmin,
  type PayloadGuildMissionAdmin,
  type PayloadMissionAdmin,
} from "@/lib/api/admin";
import { ItemSelect, formatarItemComId, useItensParaSelecaoAdmin } from "@/components/admin/ItemPicker";

type Aba = "livres" | "guilda-aventureiros" | "guilda";

function badgeAtiva(ativa: boolean) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${ativa ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/60"}`}>
      {ativa ? "Ativa" : "Inativa"}
    </span>
  );
}

// ======================================================= MISSÕES LIVRES
function MissoesLivresTab({ catalogos }: { catalogos: MissionCatalogosApi | null }) {
  const [missoes, setMissoes] = useState<MissionApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<PayloadMissionAdmin>({});
  const { itens: itensDisponiveis } = useItensParaSelecaoAdmin();
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setMissoes(await listarMissoesLivresAdmin());
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar as missões."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirCriacao() {
    setEditandoId(null);
    setForm({ nome: "", descricao: "", tipo: catalogos?.tiposMissaoLivre[0], meta: 1, categoria: "Diaria", nivel_minimo: 1, recompensa_dinheiro: 0, recompensa_xp: 0, recompensa_item_quantidade: 1, ativa: true });
    setMostrarForm(true);
  }
  function abrirEdicao(missao: MissionApi) {
    setEditandoId(missao.id);
    setForm(missao);
    setMostrarForm(true);
  }
  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      if (editandoId) await atualizarMissaoLivreAdmin(editandoId, form);
      else await criarMissaoLivreAdmin(form);
      setMostrarForm(false);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar a missão."));
    } finally {
      setSalvando(false);
    }
  }
  async function alternarAtiva(missao: MissionApi) {
    try {
      await atualizarMissaoLivreAdmin(missao.id, { ativa: !missao.ativa });
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível mudar o status."));
    }
  }
  async function duplicar(id: number) {
    try {
      await duplicarMissaoLivreAdmin(id);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível duplicar."));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <button type="button" onClick={abrirCriacao} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
          + Nova missão
        </button>
      </div>
      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      {carregando ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80">
          <table className="w-full text-left text-sm text-white">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-white/50">
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Categoria</th>
                <th className="px-3 py-2">Meta</th>
                <th className="px-3 py-2">Recompensas</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {missoes.map((m) => (
                <tr key={m.id} className={`border-b border-white/5 ${!m.ativa ? "opacity-60" : ""}`}>
                  <td className="px-3 py-2 font-bold">{m.nome}</td>
                  <td className="px-3 py-2">{m.tipo}</td>
                  <td className="px-3 py-2">{m.categoria}</td>
                  <td className="px-3 py-2">{m.meta}</td>
                  <td className="px-3 py-2">
                    {m.recompensa_dinheiro > 0 && `${m.recompensa_dinheiro} ouro `}
                    {m.recompensa_xp > 0 && `${m.recompensa_xp} XP `}
                    {m.itemRecompensa && `${m.recompensa_item_quantidade}x ${m.itemRecompensa.nome}`}
                  </td>
                  <td className="px-3 py-2">{badgeAtiva(m.ativa)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => abrirEdicao(m)} className="text-[#F3B43F] hover:underline">
                        Editar
                      </button>
                      <button type="button" onClick={() => duplicar(m.id)} className="text-white/70 hover:underline">
                        Duplicar
                      </button>
                      <button type="button" onClick={() => alternarAtiva(m)} className="text-white/70 hover:underline">
                        {m.ativa ? "Desativar" : "Ativar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {missoes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-center text-white/50">
                    Nenhuma missão livre cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMostrarForm(false)}>
          <form onSubmit={salvar} onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-[#F3B43F]">{editandoId ? "Editar missão" : "Nova missão"}</p>
            <label className="flex flex-col gap-1 text-xs">
              Nome
              <input required value={form.nome ?? ""} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Descrição
              <textarea required value={form.descricao ?? ""} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} rows={2} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Tipo
                <select value={form.tipo ?? ""} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
                  {catalogos?.tiposMissaoLivre.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Categoria
                <select value={form.categoria ?? "Diaria"} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
                  {catalogos?.categoriasMissaoLivre.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Meta
                <input type="number" min={1} required value={form.meta ?? 1} onChange={(e) => setForm((f) => ({ ...f, meta: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Nível mínimo
                <input type="number" min={1} value={form.nivel_minimo ?? 1} onChange={(e) => setForm((f) => ({ ...f, nivel_minimo: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
            </div>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Recompensa (ouro)
                <input type="number" min={0} value={form.recompensa_dinheiro ?? 0} onChange={(e) => setForm((f) => ({ ...f, recompensa_dinheiro: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Recompensa (XP)
                <input type="number" min={0} value={form.recompensa_xp ?? 0} onChange={(e) => setForm((f) => ({ ...f, recompensa_xp: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
            </div>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Item de recompensa (opcional)
                <ItemSelect
                  itens={itensDisponiveis}
                  value={form.recompensa_item_id ?? ""}
                  onChange={(id) => setForm((f) => ({ ...f, recompensa_item_id: id === "" ? null : id }))}
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Quantidade do item
                <input type="number" min={1} value={form.recompensa_item_quantidade ?? 1} onChange={(e) => setForm((f) => ({ ...f, recompensa_item_quantidade: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setMostrarForm(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">
                Cancelar
              </button>
              <button type="submit" disabled={salvando} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ============================================ GUILDA DOS AVENTUREIROS
function RecompensasModal({ missao, onFechar, onMudou }: { missao: AdventureGuildMissionApi; onFechar: () => void; onMudou: () => void }) {
  const [erro, setErro] = useState("");
  const [tipo, setTipo] = useState<"Ouro" | "XP" | "Item">("Ouro");
  const [idItem, setIdItem] = useState<number | "">("");
  const [quantidade, setQuantidade] = useState(1);
  const [salvando, setSalvando] = useState(false);
  const { itens: itensDisponiveis } = useItensParaSelecaoAdmin();

  async function adicionar() {
    setSalvando(true);
    setErro("");
    try {
      await adicionarRecompensaGuildaAventureirosAdmin(missao.id, { tipo, id_item: tipo === "Item" ? Number(idItem) : null, quantidade });
      setIdItem("");
      onMudou();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível adicionar a recompensa."));
    } finally {
      setSalvando(false);
    }
  }
  async function remover(id: number) {
    setErro("");
    try {
      await removerRecompensaGuildaAventureirosAdmin(id);
      onMudou();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível remover a recompensa."));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onFechar}>
      <div onClick={(e) => e.stopPropagation()} className="flex w-full max-w-md flex-col gap-3 rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <p className="font-imFeel text-lg text-[#F3B43F]">Recompensas — {missao.nome}</p>
          <button type="button" onClick={onFechar} className="text-white/60 hover:text-white">
            ✕
          </button>
        </div>
        {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
        {(missao.recompensas ?? []).map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-lg bg-black/20 px-2 py-1 text-sm">
            <span>
              {r.tipo === "Item" ? `${r.quantidade}x ${r.item ? formatarItemComId(r.item.nome, r.id_item ?? 0) : `Item #${r.id_item}`}` : `${r.quantidade} ${r.tipo}`}
            </span>
            <button type="button" onClick={() => remover(r.id)} className="text-xs text-red-400 hover:underline">
              Remover
            </button>
          </div>
        ))}
        {(missao.recompensas ?? []).length === 0 && <p className="text-sm text-white/50">Nenhuma recompensa ainda.</p>}
        <div className="flex flex-wrap items-end gap-2 border-t border-white/10 pt-3">
          <select value={tipo} onChange={(e) => setTipo(e.target.value as "Ouro" | "XP" | "Item")} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
            <option value="Ouro">Ouro</option>
            <option value="XP">XP</option>
            <option value="Item">Item</option>
          </select>
          {tipo === "Item" && (
            <ItemSelect
              itens={itensDisponiveis}
              value={idItem}
              onChange={setIdItem}
              className="w-64 rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
            />
          )}
          <input type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} className="w-20 rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
          <button type="button" onClick={adicionar} disabled={salvando} className="rounded-lg bg-[#BC8418] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
            + Recompensa
          </button>
        </div>
      </div>
    </div>
  );
}

function GuildaAventureirosTab({ catalogos }: { catalogos: MissionCatalogosApi | null }) {
  const [missoes, setMissoes] = useState<AdventureGuildMissionApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [filtroRank, setFiltroRank] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<PayloadAdventureGuildMissionAdmin>({});
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [recompensasId, setRecompensasId] = useState<number | null>(null);
  const { itens: itensDisponiveis } = useItensParaSelecaoAdmin();

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setMissoes(await listarMissoesGuildaAventureirosAdmin({ rank: filtroRank || undefined }));
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar os contratos."));
    } finally {
      setCarregando(false);
    }
  }, [filtroRank]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirCriacao() {
    setEditandoId(null);
    setForm({ rank: catalogos?.ranksAventureiros[0], nome: "", descricao: "", tipo_objetivo: catalogos?.tiposObjetivoGuildaAventureiros[0], quantidade_objetivo: 1, eh_provacao: false, ativa: true });
    setMostrarForm(true);
  }
  function abrirEdicao(missao: AdventureGuildMissionApi) {
    setEditandoId(missao.id);
    setForm(missao);
    setMostrarForm(true);
  }
  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      if (editandoId) await atualizarMissaoGuildaAventureirosAdmin(editandoId, form);
      else await criarMissaoGuildaAventureirosAdmin(form);
      setMostrarForm(false);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar o contrato."));
    } finally {
      setSalvando(false);
    }
  }
  async function alternarAtiva(missao: AdventureGuildMissionApi) {
    try {
      await atualizarMissaoGuildaAventureirosAdmin(missao.id, { ativa: !missao.ativa });
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível mudar o status."));
    }
  }
  async function duplicar(id: number) {
    try {
      await duplicarMissaoGuildaAventureirosAdmin(id);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível duplicar."));
    }
  }

  const missaoRecompensas = missoes.find((m) => m.id === recompensasId) ?? null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <select value={filtroRank} onChange={(e) => setFiltroRank(e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white">
          <option value="">Todos os ranks</option>
          {catalogos?.ranksAventureiros.map((r) => (
            <option key={r} value={r}>
              Rank {r}
            </option>
          ))}
        </select>
        <button type="button" onClick={abrirCriacao} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
          + Novo contrato
        </button>
      </div>
      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      {carregando ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80">
          <table className="w-full text-left text-sm text-white">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-white/50">
                <th className="px-3 py-2">Rank</th>
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2">Objetivo</th>
                <th className="px-3 py-2">Qtd.</th>
                <th className="px-3 py-2">Provação</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {missoes.map((m) => (
                <tr key={m.id} className={`border-b border-white/5 ${!m.ativa ? "opacity-60" : ""}`}>
                  <td className="px-3 py-2 font-bold">{m.rank}</td>
                  <td className="px-3 py-2">{m.nome}</td>
                  <td className="px-3 py-2">{m.tipo_objetivo}</td>
                  <td className="px-3 py-2">{m.quantidade_objetivo}</td>
                  <td className="px-3 py-2">{m.eh_provacao ? "Sim" : "Não"}</td>
                  <td className="px-3 py-2">{badgeAtiva(m.ativa)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => abrirEdicao(m)} className="text-[#F3B43F] hover:underline">
                        Editar
                      </button>
                      <button type="button" onClick={() => setRecompensasId(m.id)} className="text-white/70 hover:underline">
                        Recompensas ({m.recompensas?.length ?? 0})
                      </button>
                      <button type="button" onClick={() => duplicar(m.id)} className="text-white/70 hover:underline">
                        Duplicar
                      </button>
                      <button type="button" onClick={() => alternarAtiva(m)} className="text-white/70 hover:underline">
                        {m.ativa ? "Desativar" : "Ativar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {missoes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-center text-white/50">
                    Nenhum contrato cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMostrarForm(false)}>
          <form onSubmit={salvar} onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-[#F3B43F]">{editandoId ? "Editar contrato" : "Novo contrato"}</p>
            <label className="flex flex-col gap-1 text-xs">
              Nome
              <input required value={form.nome ?? ""} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Descrição
              <textarea required value={form.descricao ?? ""} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} rows={2} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Rank
                <select value={form.rank ?? ""} onChange={(e) => setForm((f) => ({ ...f, rank: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
                  {catalogos?.ranksAventureiros.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Objetivo
                <select value={form.tipo_objetivo ?? ""} onChange={(e) => setForm((f) => ({ ...f, tipo_objetivo: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
                  {catalogos?.tiposObjetivoGuildaAventureiros.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Quantidade objetivo
                <input type="number" min={1} required value={form.quantidade_objetivo ?? 1} onChange={(e) => setForm((f) => ({ ...f, quantidade_objetivo: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Qualidade mínima (opcional)
                <input value={form.qualidade_minima ?? ""} onChange={(e) => setForm((f) => ({ ...f, qualidade_minima: e.target.value || null }))} placeholder="ex: Raro" className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
            </div>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Monstro alvo (ID, opcional)
                <input type="number" value={form.id_monstro_alvo ?? ""} onChange={(e) => setForm((f) => ({ ...f, id_monstro_alvo: e.target.value ? Number(e.target.value) : null }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Zona alvo (ID, opcional)
                <input type="number" value={form.id_area_alvo ?? ""} onChange={(e) => setForm((f) => ({ ...f, id_area_alvo: e.target.value ? Number(e.target.value) : null }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Item alvo (opcional)
                <ItemSelect
                  itens={itensDisponiveis}
                  value={form.id_item_alvo ?? ""}
                  onChange={(id) => setForm((f) => ({ ...f, id_item_alvo: id === "" ? null : id }))}
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={form.eh_provacao ?? false} onChange={(e) => setForm((f) => ({ ...f, eh_provacao: e.target.checked }))} />
              É provação (missão de promoção — nunca entra no sorteio normal)
            </label>
            <p className="text-[11px] text-white/50">Depois de criado, use &quot;Recompensas&quot; na lista pra adicionar ouro/XP/itens.</p>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setMostrarForm(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">
                Cancelar
              </button>
              <button type="submit" disabled={salvando} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {missaoRecompensas && <RecompensasModal missao={missaoRecompensas} onFechar={() => setRecompensasId(null)} onMudou={carregar} />}
    </div>
  );
}

// ===================================================== MISSÕES DE GUILDA
function MissoesGuildaTab({ catalogos }: { catalogos: MissionCatalogosApi | null }) {
  const [missoes, setMissoes] = useState<GuildMissionApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<PayloadGuildMissionAdmin>({});
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setMissoes(await listarMissoesGuildaAdmin());
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar as missões de guilda."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirCriacao() {
    setEditandoId(null);
    setForm({ categoria: "Diaria", nome: "", descricao: "", tipo_objetivo: catalogos?.tiposObjetivoMissaoGuilda[0], meta: 1, xp_guilda: 0, pontos_contribuicao: 0, ativa: true });
    setMostrarForm(true);
  }
  function abrirEdicao(missao: GuildMissionApi) {
    setEditandoId(missao.id);
    setForm(missao);
    setMostrarForm(true);
  }
  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      if (editandoId) await atualizarMissaoGuildaAdmin(editandoId, form);
      else await criarMissaoGuildaAdmin(form);
      setMostrarForm(false);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar a missão de guilda."));
    } finally {
      setSalvando(false);
    }
  }
  async function alternarAtiva(missao: GuildMissionApi) {
    try {
      await atualizarMissaoGuildaAdmin(missao.id, { ativa: !missao.ativa });
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível mudar o status."));
    }
  }
  async function duplicar(id: number) {
    try {
      await duplicarMissaoGuildaAdmin(id);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível duplicar."));
    }
  }

  const categoriaAtual = form.categoria ?? "Diaria";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <button type="button" onClick={abrirCriacao} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
          + Nova missão de guilda
        </button>
      </div>
      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      {carregando ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80">
          <table className="w-full text-left text-sm text-white">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-white/50">
                <th className="px-3 py-2">Categoria</th>
                <th className="px-3 py-2">Rank</th>
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2">Objetivo</th>
                <th className="px-3 py-2">Meta</th>
                <th className="px-3 py-2">XP guilda</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {missoes.map((m) => (
                <tr key={m.id} className={`border-b border-white/5 ${!m.ativa ? "opacity-60" : ""}`}>
                  <td className="px-3 py-2">{m.categoria}</td>
                  <td className="px-3 py-2">{m.rank ?? "—"}</td>
                  <td className="px-3 py-2 font-bold">{m.nome}</td>
                  <td className="px-3 py-2">{m.tipo_objetivo}</td>
                  <td className="px-3 py-2">{m.meta}</td>
                  <td className="px-3 py-2">{m.xp_guilda}</td>
                  <td className="px-3 py-2">{badgeAtiva(m.ativa)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => abrirEdicao(m)} className="text-[#F3B43F] hover:underline">
                        Editar
                      </button>
                      <button type="button" onClick={() => duplicar(m.id)} className="text-white/70 hover:underline">
                        Duplicar
                      </button>
                      <button type="button" onClick={() => alternarAtiva(m)} className="text-white/70 hover:underline">
                        {m.ativa ? "Desativar" : "Ativar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {missoes.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-4 text-center text-white/50">
                    Nenhuma missão de guilda cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMostrarForm(false)}>
          <form onSubmit={salvar} onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-[#F3B43F]">{editandoId ? "Editar missão de guilda" : "Nova missão de guilda"}</p>
            <label className="flex flex-col gap-1 text-xs">
              Nome
              <input required value={form.nome ?? ""} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Descrição
              <textarea required value={form.descricao ?? ""} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} rows={2} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Categoria
                <select value={categoriaAtual} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value, rank: e.target.value === "Rank" ? f.rank : null }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
                  {catalogos?.categoriasMissaoGuilda.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              {categoriaAtual === "Rank" && (
                <label className="flex flex-1 flex-col gap-1 text-xs">
                  Rank da guilda
                  <select value={form.rank ?? ""} onChange={(e) => setForm((f) => ({ ...f, rank: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
                    <option value="">Selecione...</option>
                    {catalogos?.ranksGuilda.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <label className="flex flex-col gap-1 text-xs">
              Objetivo
              <select value={form.tipo_objetivo ?? ""} onChange={(e) => setForm((f) => ({ ...f, tipo_objetivo: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
                {catalogos?.tiposObjetivoMissaoGuilda.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Meta
                <input type="number" min={1} required value={form.meta ?? 1} onChange={(e) => setForm((f) => ({ ...f, meta: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                XP de guilda
                <input type="number" min={0} value={form.xp_guilda ?? 0} onChange={(e) => setForm((f) => ({ ...f, xp_guilda: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Pontos de contribuição
                <input type="number" min={0} value={form.pontos_contribuicao ?? 0} onChange={(e) => setForm((f) => ({ ...f, pontos_contribuicao: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setMostrarForm(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">
                Cancelar
              </button>
              <button type="submit" disabled={salvando} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function AdminMissionsClient() {
  const [aba, setAba] = useState<Aba>("livres");
  const [catalogos, setCatalogos] = useState<MissionCatalogosApi | null>(null);

  useEffect(() => {
    catalogosMissoesAdmin()
      .then(setCatalogos)
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Missões</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {(
          [
            { chave: "livres", label: "Missões Livres" },
            { chave: "guilda-aventureiros", label: "Guilda dos Aventureiros" },
            { chave: "guilda", label: "Missões de Guilda" },
          ] as const
        ).map(({ chave, label }) => (
          <button
            key={chave}
            type="button"
            onClick={() => setAba(chave)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition ${aba === chave ? "bg-[#BC8418] text-black" : "bg-black/20 text-white/70 hover:text-white"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {aba === "livres" && <MissoesLivresTab catalogos={catalogos} />}
      {aba === "guilda-aventureiros" && <GuildaAventureirosTab catalogos={catalogos} />}
      {aba === "guilda" && <MissoesGuildaTab catalogos={catalogos} />}
    </div>
  );
}
