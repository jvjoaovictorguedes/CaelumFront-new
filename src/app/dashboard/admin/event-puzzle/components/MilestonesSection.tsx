"use client";

import { useCallback, useEffect, useState } from "react";
import {
  atualizarMarcoEventPuzzleAdmin,
  criarMarcoEventPuzzleAdmin,
  excluirMarcoEventPuzzleAdmin,
  listarMarcosEventPuzzleAdmin,
  mensagemDeErroAdmin,
  type PayloadPuzzleMilestoneAdmin,
  type PuzzlePioneerMilestoneApi,
  type PuzzleTriggerType,
} from "@/lib/api/admin";
import { BTN, BTN_DANGER, CARD, INPUT_XS, LABEL_XS } from "./styles";

function novoVazio() {
  return { key: "", titulo: "", descricao: "", triggerType: "INSTANCE_COMPLETED" as PuzzleTriggerType, objectiveId: "", maxClaims: 1, ordem: 0 };
}

export default function MilestonesSection({ idBlueprint, editavel, setErroGlobal }: { idBlueprint: number; editavel: boolean; setErroGlobal: (s: string) => void }) {
  const [marcos, setMarcos] = useState<PuzzlePioneerMilestoneApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [novo, setNovo] = useState(novoVazio());

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setMarcos(await listarMarcosEventPuzzleAdmin(idBlueprint));
    } catch (error) {
      setErroGlobal(mensagemDeErroAdmin(error, "Não foi possível carregar os marcos Pioneer."));
    } finally {
      setCarregando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idBlueprint]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function adicionar() {
    if (!novo.key.trim() || !novo.titulo.trim() || !novo.descricao.trim()) {
      setErroGlobal("Key, título e descrição do marco são obrigatórios.");
      return;
    }
    if (novo.triggerType === "OBJECTIVE_COMPLETED" && !novo.objectiveId.trim()) {
      setErroGlobal("objectiveId é obrigatório quando o gatilho é OBJECTIVE_COMPLETED.");
      return;
    }
    try {
      await criarMarcoEventPuzzleAdmin(idBlueprint, { ...novo, objectiveId: novo.triggerType === "OBJECTIVE_COMPLETED" ? novo.objectiveId : null });
      setNovo(novoVazio());
      await carregar();
    } catch (error) {
      setErroGlobal(mensagemDeErroAdmin(error, "Não foi possível criar o marco."));
    }
  }

  async function atualizar(id: number, patch: PayloadPuzzleMilestoneAdmin) {
    try {
      await atualizarMarcoEventPuzzleAdmin(id, patch);
      await carregar();
    } catch (error) {
      setErroGlobal(mensagemDeErroAdmin(error, "Não foi possível atualizar o marco."));
    }
  }

  async function excluir(id: number) {
    try {
      await excluirMarcoEventPuzzleAdmin(id);
      await carregar();
    } catch (error) {
      // 409 esperado se já houver conquista registrada — nunca um crash, só feedback.
      setErroGlobal(mensagemDeErroAdmin(error, "Não foi possível excluir o marco."));
    }
  }

  if (carregando) return <p className="text-sm text-white/50">Carregando...</p>;

  return (
    <div className={CARD}>
      <p className="mb-1 font-imFeel text-lg text-[#F3B43F]">Marcos Pioneer (Hall das Lendas)</p>
      <p className="mb-2 text-xs text-white/50">Vagas limitadas (max_claims) — quem completar o gatilho primeiro ganha a posição. Exclusão bloqueada se já houver alguma conquista.</p>
      <table className="w-full text-left text-xs text-white/80">
        <thead>
          <tr className="border-b border-white/10 uppercase text-white/50">
            <th className="px-2 py-1">Key</th>
            <th className="px-2 py-1">Título</th>
            <th className="px-2 py-1">Gatilho</th>
            <th className="px-2 py-1">objectiveId</th>
            <th className="px-2 py-1">Vagas</th>
            <th className="px-2 py-1">Ordem</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {marcos.map((m) => (
            <tr key={m.id} className="border-b border-white/5">
              <td className="px-2 py-1 font-bold">{m.key}</td>
              <td className="px-2 py-1">
                <input disabled={!editavel} defaultValue={m.titulo} onBlur={(e) => atualizar(m.id, { titulo: e.target.value })} className={INPUT_XS} />
              </td>
              <td className="px-2 py-1">
                <select disabled={!editavel} defaultValue={m.trigger_type} onBlur={(e) => atualizar(m.id, { triggerType: e.target.value as PuzzleTriggerType })} className={INPUT_XS}>
                  <option value="OBJECTIVE_COMPLETED">OBJECTIVE_COMPLETED</option>
                  <option value="INSTANCE_COMPLETED">INSTANCE_COMPLETED</option>
                </select>
              </td>
              <td className="px-2 py-1">
                <input disabled={!editavel} defaultValue={m.objective_id ?? ""} onBlur={(e) => atualizar(m.id, { objectiveId: e.target.value || null })} className={`${INPUT_XS} w-24`} />
              </td>
              <td className="px-2 py-1">
                <input disabled={!editavel} type="number" min={1} defaultValue={m.max_claims} onBlur={(e) => atualizar(m.id, { maxClaims: Number(e.target.value) })} className={`${INPUT_XS} w-16`} />
              </td>
              <td className="px-2 py-1">
                <input disabled={!editavel} type="number" defaultValue={m.ordem} onBlur={(e) => atualizar(m.id, { ordem: Number(e.target.value) })} className={`${INPUT_XS} w-14`} />
              </td>
              <td className="px-2 py-1">
                {editavel && (
                  <button type="button" onClick={() => excluir(m.id)} className={BTN_DANGER}>
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
            Título<input value={novo.titulo} onChange={(e) => setNovo({ ...novo, titulo: e.target.value })} className={INPUT_XS} />
          </label>
          <label className={LABEL_XS}>
            Descrição<input value={novo.descricao} onChange={(e) => setNovo({ ...novo, descricao: e.target.value })} className={INPUT_XS} />
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
            Vagas<input type="number" min={1} value={novo.maxClaims} onChange={(e) => setNovo({ ...novo, maxClaims: Number(e.target.value) })} className={`${INPUT_XS} w-16`} />
          </label>
          <label className={LABEL_XS}>
            Ordem<input type="number" value={novo.ordem} onChange={(e) => setNovo({ ...novo, ordem: Number(e.target.value) })} className={`${INPUT_XS} w-14`} />
          </label>
          <button type="button" onClick={adicionar} className={BTN}>
            + Marco
          </button>
        </div>
      )}
    </div>
  );
}
