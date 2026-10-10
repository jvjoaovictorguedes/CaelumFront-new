"use client";

import { useCallback, useEffect, useState } from "react";
import {
  criarBlueprintEventPuzzleAdmin,
  listarBlueprintsEventPuzzleAdmin,
  listarDefinicoesEventPuzzleAdmin,
  mensagemDeErroAdmin,
  type EventPuzzleDefinitionApi,
  type PayloadPuzzleBlueprintCriarAdmin,
  type PuzzleBlueprintApi,
} from "@/lib/api/admin";
import { BTN, INPUT_XS, LABEL_XS } from "./styles";
import BlueprintEditorDrawer from "./BlueprintEditorDrawer";

function blueprintVazio(): PayloadPuzzleBlueprintCriarAdmin {
  return { key: "", nome: "", descricao: "", ordem: 0, id_blueprint_prerequisito: null };
}

export default function BlueprintsTab({
  editavel,
  definicaoSelecionada,
  onSelecionarDefinicao,
}: {
  editavel: boolean;
  definicaoSelecionada: EventPuzzleDefinitionApi | null;
  onSelecionarDefinicao: (d: EventPuzzleDefinitionApi | null) => void;
}) {
  const [definicoes, setDefinicoes] = useState<EventPuzzleDefinitionApi[]>([]);
  const [blueprints, setBlueprints] = useState<PuzzleBlueprintApi[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [criando, setCriando] = useState(false);
  const [formNovo, setFormNovo] = useState<PayloadPuzzleBlueprintCriarAdmin>(blueprintVazio());
  const [blueprintAberto, setBlueprintAberto] = useState<PuzzleBlueprintApi | null>(null);

  useEffect(() => {
    listarDefinicoesEventPuzzleAdmin()
      .then(setDefinicoes)
      .catch((error) => setErro(mensagemDeErroAdmin(error, "Não foi possível carregar os eventos.")));
  }, []);

  const carregarBlueprints = useCallback(async () => {
    if (!definicaoSelecionada) {
      setBlueprints([]);
      return;
    }
    setCarregando(true);
    setErro("");
    try {
      setBlueprints(await listarBlueprintsEventPuzzleAdmin(definicaoSelecionada.id));
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar as salas."));
    } finally {
      setCarregando(false);
    }
  }, [definicaoSelecionada]);

  useEffect(() => {
    carregarBlueprints();
  }, [carregarBlueprints]);

  async function criar() {
    if (!definicaoSelecionada) return;
    if (!formNovo.key.trim() || !formNovo.nome.trim()) {
      setErro("Key e nome são obrigatórios.");
      return;
    }
    try {
      const { blueprint } = await criarBlueprintEventPuzzleAdmin(definicaoSelecionada.id, formNovo);
      setFormNovo(blueprintVazio());
      setCriando(false);
      await carregarBlueprints();
      setBlueprintAberto(blueprint);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível criar a sala."));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}

      <label className={LABEL_XS}>
        Evento
        <select
          value={definicaoSelecionada?.id ?? ""}
          onChange={(e) => {
            const d = definicoes.find((x) => x.id === Number(e.target.value)) ?? null;
            onSelecionarDefinicao(d);
          }}
          className={INPUT_XS}
        >
          <option value="">Selecione um evento...</option>
          {definicoes.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nome} ({d.key})
            </option>
          ))}
        </select>
      </label>

      {definicaoSelecionada && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/60">{blueprints.length} Blueprint(s) nesta sala</p>
            {editavel && (
              <button type="button" onClick={() => setCriando((v) => !v)} className={BTN}>
                {criando ? "Cancelar" : "+ Nova sala"}
              </button>
            )}
          </div>

          {criando && (
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <label className={LABEL_XS}>
                  Key<input value={formNovo.key} onChange={(e) => setFormNovo({ ...formNovo, key: e.target.value })} className={INPUT_XS} />
                </label>
                <label className={LABEL_XS}>
                  Nome<input value={formNovo.nome} onChange={(e) => setFormNovo({ ...formNovo, nome: e.target.value })} className={INPUT_XS} />
                </label>
                <label className={LABEL_XS}>
                  Ordem<input type="number" value={formNovo.ordem ?? 0} onChange={(e) => setFormNovo({ ...formNovo, ordem: Number(e.target.value) })} className={INPUT_XS} />
                </label>
                <label className={LABEL_XS}>
                  Pré-requisito
                  <select
                    value={formNovo.id_blueprint_prerequisito ?? ""}
                    onChange={(e) => setFormNovo({ ...formNovo, id_blueprint_prerequisito: e.target.value ? Number(e.target.value) : null })}
                    className={INPUT_XS}
                  >
                    <option value="">Nenhum (sala inicial)</option>
                    {blueprints.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nome}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className={`${LABEL_XS} mt-2`}>
                Descrição<textarea value={formNovo.descricao ?? ""} onChange={(e) => setFormNovo({ ...formNovo, descricao: e.target.value })} className={INPUT_XS} rows={2} />
              </label>
              <button type="button" onClick={criar} className={`${BTN} mt-3`}>
                Criar sala
              </button>
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80">
            <table className="w-full text-left text-sm text-white">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase text-white/50">
                  <th className="px-3 py-2">Nome</th>
                  <th className="px-3 py-2">Key</th>
                  <th className="px-3 py-2">Ordem</th>
                  <th className="px-3 py-2">Pré-requisito</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-white/50">
                      Carregando...
                    </td>
                  </tr>
                ) : blueprints.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-white/50">
                      Nenhuma sala cadastrada.
                    </td>
                  </tr>
                ) : (
                  blueprints.map((b) => (
                    <tr key={b.id} className="border-b border-white/5">
                      <td className="px-3 py-2 font-bold">{b.nome}</td>
                      <td className="px-3 py-2 text-white/60">{b.key}</td>
                      <td className="px-3 py-2">{b.ordem}</td>
                      <td className="px-3 py-2 text-white/60">
                        {b.id_blueprint_prerequisito ? blueprints.find((x) => x.id === b.id_blueprint_prerequisito)?.nome ?? `#${b.id_blueprint_prerequisito}` : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => setBlueprintAberto(b)} className="text-[#F3B43F] hover:underline">
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {blueprintAberto && (
        <BlueprintEditorDrawer
          blueprintInicial={blueprintAberto}
          blueprintsDoEvento={blueprints}
          editavel={editavel}
          onFechar={() => setBlueprintAberto(null)}
          onSalvo={carregarBlueprints}
        />
      )}
    </div>
  );
}
