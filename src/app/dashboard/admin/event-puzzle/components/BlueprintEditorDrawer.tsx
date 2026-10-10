"use client";

// "O Coração da Máquina Celestial" — Puzzle Builder (Fase 15). Editor
// completo de UM PuzzleBlueprint, em tela cheia — mesmo padrão de
// temple/components/TempleEditorDrawer.tsx. Identidade (nome/descrição/
// ordem/pré-requisito) sempre editável nesta tela; Versões/Pistas/
// Marcos/Recompensas são sub-recursos com CRUD próprio, sempre
// disponíveis porque todo Blueprint já nasce com uma PuzzleBlueprintVersion
// v1 (ver puzzleBlueprintService.criarBlueprint no backend).
import { useState } from "react";
import { atualizarBlueprintEventPuzzleAdmin, mensagemDeErroAdmin, type PayloadPuzzleBlueprintEditarAdmin, type PuzzleBlueprintApi } from "@/lib/api/admin";
import { BTN, BTN_GHOST, INPUT_XS, LABEL_XS, SUBTAB_BTN } from "./styles";
import VersionsSection from "./VersionsSection";
import CluesSection from "./CluesSection";
import MilestonesSection from "./MilestonesSection";
import RewardsSection from "./RewardsSection";

type AbaInterna = "identidade" | "versoes" | "pistas" | "marcos" | "recompensas";

const ABAS: [AbaInterna, string][] = [
  ["identidade", "Identidade"],
  ["versoes", "Versões"],
  ["pistas", "Pistas"],
  ["marcos", "Marcos Pioneer"],
  ["recompensas", "Recompensas"],
];

export default function BlueprintEditorDrawer({
  blueprintInicial,
  blueprintsDoEvento,
  editavel,
  onFechar,
  onSalvo,
}: {
  blueprintInicial: PuzzleBlueprintApi;
  blueprintsDoEvento: PuzzleBlueprintApi[];
  editavel: boolean;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const [aba, setAba] = useState<AbaInterna>("identidade");
  const [blueprint, setBlueprint] = useState<PuzzleBlueprintApi>(blueprintInicial);
  const [form, setForm] = useState<PayloadPuzzleBlueprintEditarAdmin>({
    nome: blueprintInicial.nome,
    descricao: blueprintInicial.descricao ?? "",
    ordem: blueprintInicial.ordem,
    id_blueprint_prerequisito: blueprintInicial.id_blueprint_prerequisito,
  });
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function salvarIdentidade() {
    setSalvando(true);
    setMensagem("");
    setErro("");
    try {
      const atualizado = await atualizarBlueprintEventPuzzleAdmin(blueprint.id, form);
      setBlueprint(atualizado);
      setMensagem("Identidade atualizada.");
      onSalvo();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar a identidade."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#181009]">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#292018] px-5 py-3">
        <div>
          <p className="font-imFeel text-2xl text-[#F3B43F]">Editando sala: {blueprint.nome}</p>
          <p className="text-xs text-white/50">key: {blueprint.key}</p>
          {mensagem && <p className="text-xs text-[#F3B43F]">{mensagem}</p>}
          {erro && <p className="text-xs text-red-400">{erro}</p>}
        </div>
        <button type="button" onClick={onFechar} className={BTN_GHOST}>
          Fechar
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-white/10 bg-[#221a11] px-5 py-2">
        {ABAS.map(([id, rotulo]) => (
          <button key={id} type="button" onClick={() => setAba(id)} className={SUBTAB_BTN(aba === id)}>
            {rotulo}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="mx-auto max-w-5xl">
          {aba === "identidade" && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <label className={LABEL_XS}>
                Nome<input disabled={!editavel} value={form.nome ?? ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={INPUT_XS} />
              </label>
              <label className={LABEL_XS}>
                Ordem<input disabled={!editavel} type="number" value={form.ordem ?? 0} onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })} className={INPUT_XS} />
              </label>
              <label className={LABEL_XS}>
                Pré-requisito
                <select
                  disabled={!editavel}
                  value={form.id_blueprint_prerequisito ?? ""}
                  onChange={(e) => setForm({ ...form, id_blueprint_prerequisito: e.target.value ? Number(e.target.value) : null })}
                  className={INPUT_XS}
                >
                  <option value="">Nenhum (sala inicial)</option>
                  {blueprintsDoEvento
                    .filter((b) => b.id !== blueprint.id)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nome}
                      </option>
                    ))}
                </select>
              </label>
              <label className={`${LABEL_XS} col-span-2 sm:col-span-3`}>
                Descrição
                <textarea disabled={!editavel} value={form.descricao ?? ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className={INPUT_XS} rows={3} />
              </label>
              {editavel && (
                <button type="button" disabled={salvando} onClick={salvarIdentidade} className={`${BTN} col-span-2 w-fit sm:col-span-3`}>
                  {salvando ? "Salvando..." : "Salvar identidade"}
                </button>
              )}
            </div>
          )}
          {aba === "versoes" && <VersionsSection idBlueprint={blueprint.id} editavel={editavel} setErroGlobal={setErro} />}
          {aba === "pistas" && <CluesSection idBlueprint={blueprint.id} editavel={editavel} setErroGlobal={setErro} />}
          {aba === "marcos" && <MilestonesSection idBlueprint={blueprint.id} editavel={editavel} setErroGlobal={setErro} />}
          {aba === "recompensas" && <RewardsSection idBlueprint={blueprint.id} editavel={editavel} setErroGlobal={setErro} />}
        </div>
      </div>
    </div>
  );
}
