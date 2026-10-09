"use client";

import { useCallback, useEffect, useState } from "react";
import {
  atualizarMissaoTemploAdmin,
  criarMissaoTemploAdmin,
  excluirMissaoTemploAdmin,
  listarMissoesTemploAdmin,
  mensagemDeErroAdmin,
  previewMissaoTemploAdmin,
  TEMPLE_OBJECTIVE_TYPES,
  type PayloadTempleMissaoAdmin,
  type TempleMissaoAdminApi,
  type TempleMissaoPreviewApi,
} from "@/lib/api/admin";
import { useItensParaSelecaoAdmin, formatarItemComId } from "@/components/admin/ItemPicker";
import { BTN, BTN_DANGER, BTN_GHOST, CARD, INPUT_XS, LABEL_XS } from "./styles";

function vazio(): PayloadTempleMissaoAdmin {
  return { key: "", categoria: "RITO_DIARIO", objective_type: "WIN_ADVENTURE_NO_CONSUMABLE", objective_config: {}, meta: 1, reward_sigils: 0, nome_exibicao: "", ordem: 0, ativo: true };
}

export default function TempleMissionsTab({ idEvento, editavel }: { idEvento: number; editavel: boolean }) {
  const [missoes, setMissoes] = useState<TempleMissaoAdminApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [editando, setEditando] = useState<number | null>(null);
  const [form, setForm] = useState<PayloadTempleMissaoAdmin>(vazio());
  const [preview, setPreview] = useState<TempleMissaoPreviewApi | null>(null);
  const { itens: itensDisponiveis } = useItensParaSelecaoAdmin();

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setMissoes(await listarMissoesTemploAdmin(idEvento));
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar as Provações."));
    } finally {
      setCarregando(false);
    }
  }, [idEvento]);

  useEffect(() => { carregar(); }, [carregar]);

  function abrirNova() {
    setEditando(0);
    setForm(vazio());
    setPreview(null);
  }
  function abrirEdicao(m: TempleMissaoAdminApi) {
    setEditando(m.id);
    setForm({ ...m });
    setPreview(null);
  }

  async function salvar() {
    try {
      if (editando) await atualizarMissaoTemploAdmin(idEvento, editando, form);
      else await criarMissaoTemploAdmin(idEvento, form);
      setEditando(null);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar a Provação."));
    }
  }

  async function excluir(id: number) {
    try {
      await excluirMissaoTemploAdmin(idEvento, id);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível excluir."));
    }
  }

  async function verPreview() {
    try {
      setPreview(await previewMissaoTemploAdmin(idEvento, form));
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível gerar o preview."));
    }
  }

  const tipo = form.objective_type;

  return (
    <div className="flex flex-col gap-3">
      {erro && <p className="text-xs text-red-400">{erro}</p>}
      {!editavel && <p className="text-xs text-red-300">Catálogo congelado — só leitura.</p>}

      {editando === null ? (
        <>
          {editavel && <button type="button" onClick={abrirNova} className={BTN}>+ Nova Provação</button>}
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-left text-xs text-white/80">
              <thead>
                <tr className="border-b border-white/10 uppercase text-white/50">
                  <th className="px-2 py-1">Key</th><th className="px-2 py-1">Categoria</th><th className="px-2 py-1">Objetivo</th>
                  <th className="px-2 py-1">Meta</th><th className="px-2 py-1">Sigilos</th><th className="px-2 py-1"></th>
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr><td colSpan={6} className="px-2 py-2 text-center">Carregando...</td></tr>
                ) : missoes.length === 0 ? (
                  <tr><td colSpan={6} className="px-2 py-2 text-center text-white/40">Nenhuma Provação cadastrada.</td></tr>
                ) : missoes.map((m) => (
                  <tr key={m.id} className="border-b border-white/5">
                    <td className="px-2 py-1 font-bold">{m.key}</td>
                    <td className="px-2 py-1">{m.categoria}</td>
                    <td className="px-2 py-1">{m.objective_type}</td>
                    <td className="px-2 py-1">{m.meta}</td>
                    <td className="px-2 py-1">{m.reward_sigils}</td>
                    <td className="px-2 py-1 flex gap-2">
                      <button type="button" onClick={() => abrirEdicao(m)} className="text-[#F3B43F] hover:underline">Editar</button>
                      {editavel && <button type="button" onClick={() => excluir(m.id)} className={BTN_DANGER}>Excluir</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className={CARD}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <label className={LABEL_XS}>Key<input disabled={!editavel} value={form.key ?? ""} onChange={(e) => setForm({ ...form, key: e.target.value })} className={INPUT_XS} /></label>
            <label className={LABEL_XS}>Nome de exibição<input disabled={!editavel} value={form.nome_exibicao ?? ""} onChange={(e) => setForm({ ...form, nome_exibicao: e.target.value })} className={INPUT_XS} /></label>
            <label className={LABEL_XS}>Categoria
              <select disabled={!editavel} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value as PayloadTempleMissaoAdmin["categoria"] })} className={INPUT_XS}>
                <option value="RITO_DIARIO">Rito Diário</option>
                <option value="PROVACAO_PRINCIPAL">Provação Principal</option>
              </select>
            </label>
            <label className={LABEL_XS}>Objetivo
              <select disabled={!editavel} value={tipo} onChange={(e) => setForm({ ...form, objective_type: e.target.value as PayloadTempleMissaoAdmin["objective_type"], objective_config: {} })} className={INPUT_XS}>
                {TEMPLE_OBJECTIVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className={LABEL_XS}>Meta<input disabled={!editavel} type="number" min={1} value={form.meta ?? 1} onChange={(e) => setForm({ ...form, meta: Number(e.target.value) })} className={INPUT_XS} /></label>
            <label className={LABEL_XS}>Sigilos de recompensa<input disabled={!editavel} type="number" min={0} value={form.reward_sigils ?? 0} onChange={(e) => setForm({ ...form, reward_sigils: Number(e.target.value) })} className={INPUT_XS} /></label>
          </div>
          <label className={`${LABEL_XS} mt-2`}>Descrição<textarea disabled={!editavel} value={form.descricao ?? ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className={INPUT_XS} rows={2} /></label>

          {tipo === "DELIVER_ITEM" && (
            <div className="mt-2 grid grid-cols-2 gap-3">
              <label className={LABEL_XS}>Item
                <select disabled={!editavel} value={form.objective_config?.itemId ?? ""} onChange={(e) => setForm({ ...form, objective_config: { ...form.objective_config, itemId: Number(e.target.value) } })} className={INPUT_XS}>
                  <option value="">Selecione...</option>
                  {itensDisponiveis.map((i) => <option key={i.id} value={i.id}>{formatarItemComId(i.nome, i.id)}</option>)}
                </select>
              </label>
              <label className={LABEL_XS}>Quantidade<input disabled={!editavel} type="number" min={1} value={form.objective_config?.quantidade ?? 1} onChange={(e) => setForm({ ...form, objective_config: { ...form.objective_config, quantidade: Number(e.target.value) } })} className={INPUT_XS} /></label>
            </div>
          )}
          {tipo === "APPLY_STATUS" && (
            <label className={`${LABEL_XS} mt-2`}>Status key (opcional)<input disabled={!editavel} value={form.objective_config?.statusKey ?? ""} onChange={(e) => setForm({ ...form, objective_config: { ...form.objective_config, statusKey: e.target.value } })} className={INPUT_XS} /></label>
          )}
          {tipo === "DEFEAT_AFFECTED_BY_STATUS" && (
            <label className={`${LABEL_XS} mt-2`}>Status keys (separadas por vírgula, opcional)
              <input disabled={!editavel} value={(form.objective_config?.statusKeys ?? []).join(",")} onChange={(e) => setForm({ ...form, objective_config: { ...form.objective_config, statusKeys: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } })} className={INPUT_XS} />
            </label>
          )}
          {tipo === "CRAFT_RARITY_OR_HIGHER" && (
            <label className={`${LABEL_XS} mt-2`}>Raridade mínima (opcional)
              <select disabled={!editavel} value={form.objective_config?.minRaridade ?? ""} onChange={(e) => setForm({ ...form, objective_config: { ...form.objective_config, minRaridade: e.target.value || undefined } })} className={INPUT_XS}>
                <option value="">—</option>
                {["Comum", "Incomum", "Raro", "Epico", "Lendario", "Mitico"].map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {editavel && <button type="button" onClick={salvar} className={BTN}>Salvar Provação</button>}
            <button type="button" onClick={verPreview} className={BTN_GHOST}>Pré-visualizar</button>
            <button type="button" onClick={() => setEditando(null)} className={BTN_GHOST}>Voltar</button>
          </div>

          {preview && (
            <div className="mt-3 rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-white/80">
              <p className="mb-1 font-bold text-[#F3B43F]">Preview (dia 1, como o jogador veria)</p>
              <p>{preview.nome_exibicao} — {preview.progresso_atual}/{preview.meta} — {preview.reward_sigils} Sigilos {preview.objetivo_e_set && "(objetivo de SET)"}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
