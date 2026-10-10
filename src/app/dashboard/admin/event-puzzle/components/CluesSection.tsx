"use client";

import { useCallback, useEffect, useState } from "react";
import {
  atualizarPistaEventPuzzleAdmin,
  criarPistaEventPuzzleAdmin,
  excluirPistaEventPuzzleAdmin,
  listarPistasEventPuzzleAdmin,
  mensagemDeErroAdmin,
  type PayloadPuzzleClueAdmin,
  type PuzzleClueDefinitionApi,
  type PuzzleTriggerType,
} from "@/lib/api/admin";
import { BTN, BTN_DANGER, CARD, INPUT_XS, LABEL_XS } from "./styles";

function novoVazio() {
  return { key: "", titulo: "", texto: "", triggerType: "INSTANCE_COMPLETED" as PuzzleTriggerType, objectiveId: "", ordem: 0 };
}

export default function CluesSection({ idBlueprint, editavel, setErroGlobal }: { idBlueprint: number; editavel: boolean; setErroGlobal: (s: string) => void }) {
  const [pistas, setPistas] = useState<PuzzleClueDefinitionApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [novo, setNovo] = useState(novoVazio());

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setPistas(await listarPistasEventPuzzleAdmin(idBlueprint));
    } catch (error) {
      setErroGlobal(mensagemDeErroAdmin(error, "Não foi possível carregar as pistas."));
    } finally {
      setCarregando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idBlueprint]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function adicionar() {
    if (!novo.key.trim() || !novo.titulo.trim() || !novo.texto.trim()) {
      setErroGlobal("Key, título e texto da pista são obrigatórios.");
      return;
    }
    if (novo.triggerType === "OBJECTIVE_COMPLETED" && !novo.objectiveId.trim()) {
      setErroGlobal("objectiveId é obrigatório quando o gatilho é OBJECTIVE_COMPLETED.");
      return;
    }
    try {
      await criarPistaEventPuzzleAdmin(idBlueprint, { ...novo, objectiveId: novo.triggerType === "OBJECTIVE_COMPLETED" ? novo.objectiveId : null });
      setNovo(novoVazio());
      await carregar();
    } catch (error) {
      setErroGlobal(mensagemDeErroAdmin(error, "Não foi possível criar a pista."));
    }
  }

  async function atualizar(id: number, patch: PayloadPuzzleClueAdmin) {
    try {
      await atualizarPistaEventPuzzleAdmin(id, patch);
      await carregar();
    } catch (error) {
      setErroGlobal(mensagemDeErroAdmin(error, "Não foi possível atualizar a pista."));
    }
  }

  async function excluir(id: number) {
    try {
      await excluirPistaEventPuzzleAdmin(id);
      await carregar();
    } catch (error) {
      // 409 esperado quando algum personagem já desbloqueou — nunca um crash, só feedback.
      setErroGlobal(mensagemDeErroAdmin(error, "Não foi possível excluir a pista."));
    }
  }

  if (carregando) return <p className="text-sm text-white/50">Carregando...</p>;

  return (
    <div className={CARD}>
      <p className="mb-1 font-imFeel text-lg text-[#F3B43F]">Pistas (Caderno de Investigação)</p>
      <p className="mb-2 text-xs text-white/50">Uma pista é revelada quando o gatilho (objetivo ou sala completa) acontece. Exclusão bloqueada se já desbloqueada por algum jogador.</p>
      <table className="w-full text-left text-xs text-white/80">
        <thead>
          <tr className="border-b border-white/10 uppercase text-white/50">
            <th className="px-2 py-1">Key</th>
            <th className="px-2 py-1">Título</th>
            <th className="px-2 py-1">Texto</th>
            <th className="px-2 py-1">Gatilho</th>
            <th className="px-2 py-1">objectiveId</th>
            <th className="px-2 py-1">Ordem</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {pistas.map((p) => (
            <tr key={p.id} className="border-b border-white/5">
              <td className="px-2 py-1 font-bold">{p.key}</td>
              <td className="px-2 py-1">
                <input disabled={!editavel} defaultValue={p.titulo} onBlur={(e) => atualizar(p.id, { titulo: e.target.value })} className={INPUT_XS} />
              </td>
              <td className="px-2 py-1">
                <textarea disabled={!editavel} defaultValue={p.texto} onBlur={(e) => atualizar(p.id, { texto: e.target.value })} className={`${INPUT_XS} w-48`} rows={1} />
              </td>
              <td className="px-2 py-1">
                <select
                  disabled={!editavel}
                  defaultValue={p.trigger_type}
                  onBlur={(e) => atualizar(p.id, { triggerType: e.target.value as PuzzleTriggerType })}
                  className={INPUT_XS}
                >
                  <option value="OBJECTIVE_COMPLETED">OBJECTIVE_COMPLETED</option>
                  <option value="INSTANCE_COMPLETED">INSTANCE_COMPLETED</option>
                </select>
              </td>
              <td className="px-2 py-1">
                <input disabled={!editavel} defaultValue={p.objective_id ?? ""} onBlur={(e) => atualizar(p.id, { objectiveId: e.target.value || null })} className={`${INPUT_XS} w-24`} />
              </td>
              <td className="px-2 py-1">
                <input disabled={!editavel} type="number" defaultValue={p.ordem} onBlur={(e) => atualizar(p.id, { ordem: Number(e.target.value) })} className={`${INPUT_XS} w-14`} />
              </td>
              <td className="px-2 py-1">
                {editavel && (
                  <button type="button" onClick={() => excluir(p.id)} className={BTN_DANGER}>
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
            Texto<input value={novo.texto} onChange={(e) => setNovo({ ...novo, texto: e.target.value })} className={INPUT_XS} />
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
            Ordem<input type="number" value={novo.ordem} onChange={(e) => setNovo({ ...novo, ordem: Number(e.target.value) })} className={`${INPUT_XS} w-14`} />
          </label>
          <button type="button" onClick={adicionar} className={BTN}>
            + Pista
          </button>
        </div>
      )}
    </div>
  );
}
