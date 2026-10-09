"use client";

import { useCallback, useEffect, useState } from "react";
import {
  atualizarEntryRelicarioTemploAdmin,
  criarEntryRelicarioTemploAdmin,
  excluirEntryRelicarioTemploAdmin,
  mensagemDeErroAdmin,
  obterRelicarioTemploAdmin,
  previewOddsRelicarioTemploAdmin,
  salvarPoolRelicarioTemploAdmin,
  type PayloadTempleRewardEntryAdmin,
  type PayloadTempleRewardPoolAdmin,
  type TempleOddsPreviewApi,
  type TempleRewardEntryAdminApi,
  type TempleRewardPoolAdminApi,
} from "@/lib/api/admin";
import { useItensParaSelecaoAdmin, formatarItemComId } from "@/components/admin/ItemPicker";
import { BTN, BTN_DANGER, BTN_GHOST, CARD, INPUT_XS, LABEL_XS } from "./styles";

function entryVazia(): PayloadTempleRewardEntryAdmin {
  return { key: "", reward_kind: "STACKABLE_ITEM", id_item: undefined, quantidade: 1, weight: 1, eh_raro_mais: false, eh_featured: false, eh_unico: false, nome_exibicao: "", ordem: 0, ativo: true };
}

export default function TempleRelicaryTab({ idEvento, editavel }: { idEvento: number; editavel: boolean }) {
  const [pool, setPool] = useState<TempleRewardPoolAdminApi | null>(null);
  const [entries, setEntries] = useState<TempleRewardEntryAdminApi[]>([]);
  const [poolForm, setPoolForm] = useState<PayloadTempleRewardPoolAdmin>({ nome: "", custo_sigilos_draw: 1, pity_raro_mais_garantia: null, pity_featured_garantia: null, ativo: true });
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [editandoEntry, setEditandoEntry] = useState<number | null>(null);
  const [entryForm, setEntryForm] = useState<PayloadTempleRewardEntryAdmin>(entryVazia());
  const [odds, setOdds] = useState<TempleOddsPreviewApi | null>(null);
  const { itens: itensDisponiveis } = useItensParaSelecaoAdmin();

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const dados = await obterRelicarioTemploAdmin(idEvento);
      setPool(dados.pool);
      setEntries(dados.entries);
      if (dados.pool) setPoolForm({ ...dados.pool });
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar o Relicário."));
    } finally {
      setCarregando(false);
    }
  }, [idEvento]);

  useEffect(() => { carregar(); }, [carregar]);

  async function salvarPool() {
    try {
      await salvarPoolRelicarioTemploAdmin(idEvento, poolForm);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar o pool."));
    }
  }

  function abrirNovaEntry() { setEditandoEntry(0); setEntryForm(entryVazia()); }
  function abrirEdicaoEntry(e: TempleRewardEntryAdminApi) { setEditandoEntry(e.id); setEntryForm({ ...e }); }

  async function salvarEntry() {
    try {
      if (editandoEntry) await atualizarEntryRelicarioTemploAdmin(idEvento, editandoEntry, entryForm);
      else await criarEntryRelicarioTemploAdmin(idEvento, entryForm);
      setEditandoEntry(null);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar a entry."));
    }
  }

  async function excluirEntry(id: number) {
    try {
      await excluirEntryRelicarioTemploAdmin(idEvento, id);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível excluir."));
    }
  }

  async function verOdds() {
    try {
      setOdds(await previewOddsRelicarioTemploAdmin(idEvento));
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível calcular as odds."));
    }
  }

  if (carregando) return <p className="text-sm text-white/50">Carregando...</p>;

  return (
    <div className="flex flex-col gap-4">
      {erro && <p className="text-xs text-red-400">{erro}</p>}
      {!editavel && <p className="text-xs text-red-300">Catálogo congelado — só leitura.</p>}

      <div className={CARD}>
        <p className="mb-2 font-imFeel text-lg text-[#F3B43F]">Pool do Relicário</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className={LABEL_XS}>Nome<input disabled={!editavel} value={poolForm.nome ?? ""} onChange={(e) => setPoolForm({ ...poolForm, nome: e.target.value })} className={INPUT_XS} /></label>
          <label className={LABEL_XS}>Custo em Sigilos/sorteio<input disabled={!editavel} type="number" min={1} value={poolForm.custo_sigilos_draw ?? 1} onChange={(e) => setPoolForm({ ...poolForm, custo_sigilos_draw: Number(e.target.value) })} className={INPUT_XS} /></label>
          <label className={LABEL_XS}>Pity Raro+ (garantia, opcional)<input disabled={!editavel} type="number" min={1} value={poolForm.pity_raro_mais_garantia ?? ""} onChange={(e) => setPoolForm({ ...poolForm, pity_raro_mais_garantia: e.target.value ? Number(e.target.value) : null })} className={INPUT_XS} /></label>
          <label className={LABEL_XS}>Pity Featured (garantia, opcional)<input disabled={!editavel} type="number" min={1} value={poolForm.pity_featured_garantia ?? ""} onChange={(e) => setPoolForm({ ...poolForm, pity_featured_garantia: e.target.value ? Number(e.target.value) : null })} className={INPUT_XS} /></label>
        </div>
        {editavel && <button type="button" onClick={salvarPool} className={`${BTN} mt-3`}>Salvar pool</button>}
      </div>

      {pool && (
        <div className="flex flex-col gap-3">
          {editandoEntry === null ? (
            <>
              {editavel && <button type="button" onClick={abrirNovaEntry} className={BTN}>+ Nova entry</button>}
              <button type="button" onClick={verOdds} className={BTN_GHOST}>Pré-visualizar odds</button>
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full text-left text-xs text-white/80">
                  <thead><tr className="border-b border-white/10 uppercase text-white/50">
                    <th className="px-2 py-1">Key</th><th className="px-2 py-1">Nome</th><th className="px-2 py-1">Peso</th>
                    <th className="px-2 py-1">Raro+</th><th className="px-2 py-1">Featured</th><th className="px-2 py-1">Único</th><th className="px-2 py-1"></th>
                  </tr></thead>
                  <tbody>
                    {entries.map((e) => (
                      <tr key={e.id} className="border-b border-white/5">
                        <td className="px-2 py-1 font-bold">{e.key}</td>
                        <td className="px-2 py-1">{e.nome_exibicao}</td>
                        <td className="px-2 py-1">{e.weight}</td>
                        <td className="px-2 py-1">{e.eh_raro_mais ? "Sim" : "—"}</td>
                        <td className="px-2 py-1">{e.eh_featured ? "Sim" : "—"}</td>
                        <td className="px-2 py-1">{e.eh_unico ? "Sim" : "—"}</td>
                        <td className="px-2 py-1 flex gap-2">
                          <button type="button" onClick={() => abrirEdicaoEntry(e)} className="text-[#F3B43F] hover:underline">Editar</button>
                          {editavel && <button type="button" onClick={() => excluirEntry(e.id)} className={BTN_DANGER}>Excluir</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {odds && (
                <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-white/80">
                  <p className="mb-1 font-bold text-[#F3B43F]">Odds (calculado pelo backend — mesma fórmula do sorteio real)</p>
                  {odds.avisos.length > 0 && (
                    <ul className="mb-2 list-disc pl-4 text-amber-300">{odds.avisos.map((a, i) => <li key={i}>{a}</li>)}</ul>
                  )}
                  <ul className="flex flex-wrap gap-2">
                    {odds.entries.map((e) => (
                      <li key={e.key} className="rounded bg-black/30 px-2 py-1">{e.nome_exibicao}: {e.chance_pct.toFixed(2)}%</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className={CARD}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <label className={LABEL_XS}>Key<input disabled={!editavel} value={entryForm.key ?? ""} onChange={(e) => setEntryForm({ ...entryForm, key: e.target.value })} className={INPUT_XS} /></label>
                <label className={LABEL_XS}>Nome de exibição<input disabled={!editavel} value={entryForm.nome_exibicao ?? ""} onChange={(e) => setEntryForm({ ...entryForm, nome_exibicao: e.target.value })} className={INPUT_XS} /></label>
                <label className={LABEL_XS}>Tipo
                  <select disabled={!editavel} value={entryForm.reward_kind} onChange={(e) => setEntryForm({ ...entryForm, reward_kind: e.target.value as PayloadTempleRewardEntryAdmin["reward_kind"] })} className={INPUT_XS}>
                    <option value="STACKABLE_ITEM">Item empilhável</option>
                    <option value="EQUIPMENT">Equipamento</option>
                  </select>
                </label>
                <label className={LABEL_XS}>Item
                  <select disabled={!editavel} value={entryForm.id_item ?? ""} onChange={(e) => setEntryForm({ ...entryForm, id_item: Number(e.target.value) })} className={INPUT_XS}>
                    <option value="">Selecione...</option>
                    {itensDisponiveis.map((i) => <option key={i.id} value={i.id}>{formatarItemComId(i.nome, i.id)}</option>)}
                  </select>
                </label>
                <label className={LABEL_XS}>Quantidade<input disabled={!editavel} type="number" min={1} value={entryForm.quantidade ?? 1} onChange={(e) => setEntryForm({ ...entryForm, quantidade: Number(e.target.value) })} className={INPUT_XS} /></label>
                <label className={LABEL_XS}>Peso (weight)<input disabled={!editavel} type="number" min={0} value={entryForm.weight ?? 1} onChange={(e) => setEntryForm({ ...entryForm, weight: Number(e.target.value) })} className={INPUT_XS} /></label>
                {entryForm.reward_kind === "EQUIPMENT" && (
                  <label className={LABEL_XS}>Raridade da instância<input disabled={!editavel} value={entryForm.raridade_instancia ?? ""} onChange={(e) => setEntryForm({ ...entryForm, raridade_instancia: e.target.value })} className={INPUT_XS} /></label>
                )}
                {entryForm.eh_unico && (
                  <label className={LABEL_XS}>Fallback key (obrigatória se único)<input disabled={!editavel} value={entryForm.fallback_key ?? ""} onChange={(e) => setEntryForm({ ...entryForm, fallback_key: e.target.value })} className={INPUT_XS} /></label>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-xs">
                <label className="flex items-center gap-1"><input disabled={!editavel} type="checkbox" checked={!!entryForm.eh_raro_mais} onChange={(e) => setEntryForm({ ...entryForm, eh_raro_mais: e.target.checked })} /> Raro+</label>
                <label className="flex items-center gap-1"><input disabled={!editavel} type="checkbox" checked={!!entryForm.eh_featured} onChange={(e) => setEntryForm({ ...entryForm, eh_featured: e.target.checked })} /> Featured</label>
                <label className="flex items-center gap-1"><input disabled={!editavel} type="checkbox" checked={!!entryForm.eh_unico} onChange={(e) => setEntryForm({ ...entryForm, eh_unico: e.target.checked })} /> Único (duplicata cai no fallback)</label>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {editavel && <button type="button" onClick={salvarEntry} className={BTN}>Salvar entry</button>}
                <button type="button" onClick={() => setEditandoEntry(null)} className={BTN_GHOST}>Voltar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
