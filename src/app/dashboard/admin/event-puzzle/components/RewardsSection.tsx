"use client";

import { useCallback, useEffect, useState } from "react";
import {
  atualizarRecompensaEventPuzzleAdmin,
  criarRecompensaEventPuzzleAdmin,
  excluirRecompensaEventPuzzleAdmin,
  listarRecompensasEventPuzzleAdmin,
  mensagemDeErroAdmin,
  type PuzzleRewardDefinitionApi,
  type PuzzleTriggerType,
} from "@/lib/api/admin";
import { useItensParaSelecaoAdmin, formatarItemComId } from "@/components/admin/ItemPicker";
import { BTN, BTN_DANGER, CARD, INPUT_XS, LABEL_XS } from "./styles";

function novoVazio() {
  return {
    key: "",
    tituloExibicao: "",
    descricaoExibicao: "",
    triggerType: "INSTANCE_COMPLETED" as PuzzleTriggerType,
    objectiveId: "",
    rewardOuro: 0,
    rewardXp: 0,
    idItem: "" as number | "",
    itemQuantidade: 1,
    achievementKey: "",
    ordem: 0,
  };
}

export default function RewardsSection({ idBlueprint, editavel, setErroGlobal }: { idBlueprint: number; editavel: boolean; setErroGlobal: (s: string) => void }) {
  const [recompensas, setRecompensas] = useState<PuzzleRewardDefinitionApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [novo, setNovo] = useState(novoVazio());
  const { itens: itensDisponiveis } = useItensParaSelecaoAdmin();

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setRecompensas(await listarRecompensasEventPuzzleAdmin(idBlueprint));
    } catch (error) {
      setErroGlobal(mensagemDeErroAdmin(error, "Não foi possível carregar as recompensas."));
    } finally {
      setCarregando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idBlueprint]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function adicionar() {
    if (!novo.key.trim() || !novo.tituloExibicao.trim() || !novo.descricaoExibicao.trim()) {
      setErroGlobal("Key, título e descrição são obrigatórios.");
      return;
    }
    if (novo.triggerType === "OBJECTIVE_COMPLETED" && !novo.objectiveId.trim()) {
      setErroGlobal("objectiveId é obrigatório quando o gatilho é OBJECTIVE_COMPLETED.");
      return;
    }
    if (novo.rewardOuro === 0 && novo.rewardXp === 0 && !novo.idItem && !novo.achievementKey.trim()) {
      setErroGlobal("A recompensa precisa conceder pelo menos um de: ouro, xp, item ou conquista.");
      return;
    }
    try {
      await criarRecompensaEventPuzzleAdmin(idBlueprint, {
        ...novo,
        objectiveId: novo.triggerType === "OBJECTIVE_COMPLETED" ? novo.objectiveId : null,
        idItem: novo.idItem ? Number(novo.idItem) : null,
        achievementKey: novo.achievementKey.trim() || null,
      });
      setNovo(novoVazio());
      await carregar();
    } catch (error) {
      setErroGlobal(mensagemDeErroAdmin(error, "Não foi possível criar a recompensa."));
    }
  }

  async function atualizar(id: number, patch: Record<string, unknown>) {
    try {
      await atualizarRecompensaEventPuzzleAdmin(id, patch);
      await carregar();
    } catch (error) {
      setErroGlobal(mensagemDeErroAdmin(error, "Não foi possível atualizar a recompensa."));
    }
  }

  async function excluir(id: number) {
    try {
      await excluirRecompensaEventPuzzleAdmin(id);
      await carregar();
    } catch (error) {
      // 409 esperado se já concedida a algum personagem — nunca um crash, só feedback.
      setErroGlobal(mensagemDeErroAdmin(error, "Não foi possível excluir a recompensa."));
    }
  }

  if (carregando) return <p className="text-sm text-white/50">Carregando...</p>;

  return (
    <div className={CARD}>
      <p className="mb-1 font-imFeel text-lg text-[#F3B43F]">Recompensas temáticas</p>
      <p className="mb-2 text-xs text-white/50">Ouro/XP/item/conquista concedidos quando o gatilho acontece. Exclusão bloqueada se já concedida a algum personagem.</p>
      <table className="w-full text-left text-xs text-white/80">
        <thead>
          <tr className="border-b border-white/10 uppercase text-white/50">
            <th className="px-2 py-1">Key</th>
            <th className="px-2 py-1">Título</th>
            <th className="px-2 py-1">Gatilho</th>
            <th className="px-2 py-1">Ouro</th>
            <th className="px-2 py-1">XP</th>
            <th className="px-2 py-1">Item</th>
            <th className="px-2 py-1">Qtd</th>
            <th className="px-2 py-1">Achievement</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {recompensas.map((r) => (
            <tr key={r.id} className="border-b border-white/5">
              <td className="px-2 py-1 font-bold">{r.key}</td>
              <td className="px-2 py-1">
                <input disabled={!editavel} defaultValue={r.titulo_exibicao} onBlur={(e) => atualizar(r.id, { tituloExibicao: e.target.value })} className={INPUT_XS} />
              </td>
              <td className="px-2 py-1 text-white/60">{r.trigger_type}</td>
              <td className="px-2 py-1">
                <input disabled={!editavel} type="number" min={0} defaultValue={r.reward_ouro} onBlur={(e) => atualizar(r.id, { rewardOuro: Number(e.target.value) })} className={`${INPUT_XS} w-16`} />
              </td>
              <td className="px-2 py-1">
                <input disabled={!editavel} type="number" min={0} defaultValue={r.reward_xp} onBlur={(e) => atualizar(r.id, { rewardXp: Number(e.target.value) })} className={`${INPUT_XS} w-16`} />
              </td>
              <td className="px-2 py-1 text-white/60">{r.id_item ? itensDisponiveis.find((i) => i.id === r.id_item)?.nome ?? `#${r.id_item}` : "—"}</td>
              <td className="px-2 py-1">
                <input disabled={!editavel} type="number" min={1} defaultValue={r.item_quantidade} onBlur={(e) => atualizar(r.id, { itemQuantidade: Number(e.target.value) })} className={`${INPUT_XS} w-14`} />
              </td>
              <td className="px-2 py-1">
                <input disabled={!editavel} defaultValue={r.achievement_key ?? ""} onBlur={(e) => atualizar(r.id, { achievementKey: e.target.value || null })} className={`${INPUT_XS} w-24`} />
              </td>
              <td className="px-2 py-1">
                {editavel && (
                  <button type="button" onClick={() => excluir(r.id)} className={BTN_DANGER}>
                    Excluir
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editavel && (
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <label className={LABEL_XS}>
            Key<input value={novo.key} onChange={(e) => setNovo({ ...novo, key: e.target.value })} className={INPUT_XS} />
          </label>
          <label className={LABEL_XS}>
            Título<input value={novo.tituloExibicao} onChange={(e) => setNovo({ ...novo, tituloExibicao: e.target.value })} className={INPUT_XS} />
          </label>
          <label className={LABEL_XS}>
            Descrição<input value={novo.descricaoExibicao} onChange={(e) => setNovo({ ...novo, descricaoExibicao: e.target.value })} className={INPUT_XS} />
          </label>
          <label className={LABEL_XS}>
            Gatilho
            <select value={novo.triggerType} onChange={(e) => setNovo({ ...novo, triggerType: e.target.value as PuzzleTriggerType })} className={INPUT_XS}>
              <option value="OBJECTIVE_COMPLETED">OBJECTIVE_COMPLETED</option>
              <option value="INSTANCE_COMPLETED">INSTANCE_COMPLETED</option>
            </select>
          </label>
          {novo.triggerType === "OBJECTIVE_COMPLETED" && (
            <label className={LABEL_XS}>
              objectiveId<input value={novo.objectiveId} onChange={(e) => setNovo({ ...novo, objectiveId: e.target.value })} className={`${INPUT_XS} w-24`} />
            </label>
          )}
          <label className={LABEL_XS}>
            Ouro<input type="number" min={0} value={novo.rewardOuro} onChange={(e) => setNovo({ ...novo, rewardOuro: Number(e.target.value) })} className={`${INPUT_XS} w-16`} />
          </label>
          <label className={LABEL_XS}>
            XP<input type="number" min={0} value={novo.rewardXp} onChange={(e) => setNovo({ ...novo, rewardXp: Number(e.target.value) })} className={`${INPUT_XS} w-16`} />
          </label>
          <label className={LABEL_XS}>
            Item
            <select value={novo.idItem} onChange={(e) => setNovo({ ...novo, idItem: e.target.value ? Number(e.target.value) : "" })} className={INPUT_XS}>
              <option value="">Nenhum</option>
              {itensDisponiveis.map((i) => (
                <option key={i.id} value={i.id}>
                  {formatarItemComId(i.nome, i.id)}
                </option>
              ))}
            </select>
          </label>
          <label className={LABEL_XS}>
            Qtd<input type="number" min={1} value={novo.itemQuantidade} onChange={(e) => setNovo({ ...novo, itemQuantidade: Number(e.target.value) })} className={`${INPUT_XS} w-14`} />
          </label>
          <label className={LABEL_XS}>
            Achievement key<input value={novo.achievementKey} onChange={(e) => setNovo({ ...novo, achievementKey: e.target.value })} className={`${INPUT_XS} w-28`} />
          </label>
          <button type="button" onClick={adicionar} className={BTN}>
            + Recompensa
          </button>
        </div>
      )}
    </div>
  );
}
