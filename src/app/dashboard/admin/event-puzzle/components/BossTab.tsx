"use client";

// "O Coração da Máquina Celestial" — Puzzle Builder (Fase 15), Custódio
// do Meridiano (Fase 13). Mesmo formato de temple/components/
// TempleBossTab.tsx: config (monstro-base + identidade) + Fases +
// Resistências — sem simulador/recompensas-por-tabela aqui (loot é
// fixo ouro/xp, nunca um catálogo sorteável como o Guardião do Templo
// tem — ver eventPuzzleBossModels.js).
import { useCallback, useEffect, useState } from "react";
import {
  atualizarFaseBossEventPuzzleAdmin,
  atualizarResistenciaBossEventPuzzleAdmin,
  catalogoStatusAdmin,
  criarFaseBossEventPuzzleAdmin,
  criarResistenciaBossEventPuzzleAdmin,
  excluirFaseBossEventPuzzleAdmin,
  excluirResistenciaBossEventPuzzleAdmin,
  listarBlueprintsEventPuzzleAdmin,
  listarDefinicoesEventPuzzleAdmin,
  listarMonstrosAdmin,
  mensagemDeErroAdmin,
  obterBossEventPuzzleAdmin,
  salvarBossConfigEventPuzzleAdmin,
  type AdventureMonsterApi,
  type EventPuzzleBossConfigApi,
  type EventPuzzleBossPhaseApi,
  type EventPuzzleBossResistanceApi,
  type EventPuzzleDefinitionApi,
  type PayloadEventPuzzleBossConfigAdmin,
  type PuzzleBlueprintApi,
  type StatusCatalogEntryApi,
} from "@/lib/api/admin";
import { BTN, BTN_DANGER, CARD, INPUT_XS, LABEL_XS } from "./styles";

export default function BossTab({
  editavel,
  definicaoSelecionada,
  onSelecionarDefinicao,
}: {
  editavel: boolean;
  definicaoSelecionada: EventPuzzleDefinitionApi | null;
  onSelecionarDefinicao: (d: EventPuzzleDefinitionApi | null) => void;
}) {
  const [definicoes, setDefinicoes] = useState<EventPuzzleDefinitionApi[]>([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    listarDefinicoesEventPuzzleAdmin()
      .then(setDefinicoes)
      .catch((error) => setErro(mensagemDeErroAdmin(error, "Não foi possível carregar os eventos.")));
  }, []);

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

      {definicaoSelecionada && <BossConfigEEditor idDefinicao={definicaoSelecionada.id} editavel={editavel} />}
    </div>
  );
}

function BossConfigEEditor({ idDefinicao, editavel }: { idDefinicao: number; editavel: boolean }) {
  const [config, setConfig] = useState<EventPuzzleBossConfigApi | null>(null);
  const [fases, setFases] = useState<EventPuzzleBossPhaseApi[]>([]);
  const [resistencias, setResistencias] = useState<EventPuzzleBossResistanceApi[]>([]);
  const [monstros, setMonstros] = useState<AdventureMonsterApi[]>([]);
  const [blueprints, setBlueprints] = useState<PuzzleBlueprintApi[]>([]);
  const [statusCatalogo, setStatusCatalogo] = useState<StatusCatalogEntryApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [configForm, setConfigForm] = useState<PayloadEventPuzzleBossConfigAdmin>({ id_monstro_base: 0 });

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [dados, listaMonstros, listaBlueprints, cat] = await Promise.all([
        obterBossEventPuzzleAdmin(idDefinicao),
        listarMonstrosAdmin(),
        listarBlueprintsEventPuzzleAdmin(idDefinicao),
        catalogoStatusAdmin(),
      ]);
      setConfig(dados.config);
      setFases(dados.fases);
      setResistencias(dados.resistencias);
      setMonstros(listaMonstros);
      setBlueprints(listaBlueprints);
      setStatusCatalogo(cat);
      if (dados.config) setConfigForm({ ...dados.config });
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar o Custódio do Meridiano."));
    } finally {
      setCarregando(false);
    }
  }, [idDefinicao]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function salvarConfig() {
    if (!configForm.id_monstro_base) {
      setErro("Escolha o monstro-base.");
      return;
    }
    try {
      await salvarBossConfigEventPuzzleAdmin(idDefinicao, configForm);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar a configuração do Custódio."));
    }
  }

  if (carregando) return <p className="text-sm text-white/50">Carregando...</p>;

  return (
    <div className="flex flex-col gap-4">
      {erro && <p className="text-xs text-red-400">{erro}</p>}

      <div className={CARD}>
        <p className="mb-2 font-imFeel text-lg text-[#F3B43F]">Monstro-base &amp; identidade</p>
        <p className="mb-2 text-xs text-white/50">
          O monstro escolhido precisa ter ai_profile BOSS. A sala-gatilho é a que, uma vez concluída pelo jogador, libera a luta —
          opcional (sem gatilho, a luta nunca aparece como desbloqueada).
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label className={LABEL_XS}>
            Monstro-base
            <select
              disabled={!editavel}
              value={configForm.id_monstro_base || ""}
              onChange={(e) => setConfigForm({ ...configForm, id_monstro_base: Number(e.target.value) })}
              className={INPUT_XS}
            >
              <option value="">Selecione...</option>
              {monstros.map((m) => (
                <option key={m.id} value={m.id} disabled={m.ai_profile !== "BOSS"}>
                  {m.nome} (ID: {m.id}){m.ai_profile !== "BOSS" ? " — precisa de ai_profile BOSS" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className={LABEL_XS}>
            Sala-gatilho (opcional)
            <select
              disabled={!editavel}
              value={configForm.id_blueprint_gatilho ?? ""}
              onChange={(e) => setConfigForm({ ...configForm, id_blueprint_gatilho: e.target.value ? Number(e.target.value) : null })}
              className={INPUT_XS}
            >
              <option value="">Nenhuma</option>
              {blueprints.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </select>
          </label>
          <label className={LABEL_XS}>
            Nome de exibição<input disabled={!editavel} value={configForm.nome_exibicao ?? ""} onChange={(e) => setConfigForm({ ...configForm, nome_exibicao: e.target.value })} className={INPUT_XS} />
          </label>
          <label className={LABEL_XS}>
            Turnos-alvo pra matar<input disabled={!editavel} type="number" min={1} value={configForm.target_turns_to_kill ?? ""} onChange={(e) => setConfigForm({ ...configForm, target_turns_to_kill: e.target.value ? Number(e.target.value) : undefined })} className={INPUT_XS} />
          </label>
          <label className={LABEL_XS}>
            Ações-alvo que o jogador sobrevive<input disabled={!editavel} type="number" min={1} value={configForm.target_boss_actions_survivable ?? ""} onChange={(e) => setConfigForm({ ...configForm, target_boss_actions_survivable: e.target.value ? Number(e.target.value) : undefined })} className={INPUT_XS} />
          </label>
          <label className={LABEL_XS}>
            Multiplicador mín. de escala<input disabled={!editavel} type="number" step="0.1" value={configForm.scaling_min_multiplier ?? ""} onChange={(e) => setConfigForm({ ...configForm, scaling_min_multiplier: e.target.value ? Number(e.target.value) : undefined })} className={INPUT_XS} />
          </label>
          <label className={LABEL_XS}>
            Multiplicador máx. de escala<input disabled={!editavel} type="number" step="0.1" value={configForm.scaling_max_multiplier ?? ""} onChange={(e) => setConfigForm({ ...configForm, scaling_max_multiplier: e.target.value ? Number(e.target.value) : undefined })} className={INPUT_XS} />
          </label>
          <label className={LABEL_XS}>
            Ouro na 1ª vitória<input disabled={!editavel} type="number" min={0} value={configForm.reward_ouro_primeira_vitoria ?? 0} onChange={(e) => setConfigForm({ ...configForm, reward_ouro_primeira_vitoria: Number(e.target.value) })} className={INPUT_XS} />
          </label>
          <label className={LABEL_XS}>
            XP na 1ª vitória<input disabled={!editavel} type="number" min={0} value={configForm.reward_xp_primeira_vitoria ?? 0} onChange={(e) => setConfigForm({ ...configForm, reward_xp_primeira_vitoria: Number(e.target.value) })} className={INPUT_XS} />
          </label>
        </div>
        <label className={`${LABEL_XS} mt-2`}>
          Lore<textarea disabled={!editavel} value={configForm.lore ?? ""} onChange={(e) => setConfigForm({ ...configForm, lore: e.target.value })} rows={2} className={INPUT_XS} />
        </label>
        {editavel && (
          <button type="button" onClick={salvarConfig} className={`${BTN} mt-3`}>
            Salvar configuração
          </button>
        )}
      </div>

      {config && (
        <>
          <FasesSecao idDefinicao={idDefinicao} fases={fases} editavel={editavel} onMudou={carregar} setErro={setErro} />
          <ResistenciasSecao idDefinicao={idDefinicao} resistencias={resistencias} statusCatalogo={statusCatalogo} editavel={editavel} onMudou={carregar} setErro={setErro} />
        </>
      )}
    </div>
  );
}

function FasesSecao({
  idDefinicao,
  fases,
  editavel,
  onMudou,
  setErro,
}: {
  idDefinicao: number;
  fases: EventPuzzleBossPhaseApi[];
  editavel: boolean;
  onMudou: () => Promise<void>;
  setErro: (s: string) => void;
}) {
  const [novo, setNovo] = useState({ ordem: fases.length, hp_threshold_pct: 100, nome_exibicao: "", dano_multiplicador: 1, defesa_multiplicador: 1, enrage: false });

  async function adicionar() {
    try {
      await criarFaseBossEventPuzzleAdmin(idDefinicao, novo);
      await onMudou();
    } catch (e) {
      setErro(mensagemDeErroAdmin(e, "Não foi possível criar a fase."));
    }
  }
  async function atualizar(id: number, patch: Partial<EventPuzzleBossPhaseApi>) {
    try {
      await atualizarFaseBossEventPuzzleAdmin(idDefinicao, id, patch);
      await onMudou();
    } catch (e) {
      setErro(mensagemDeErroAdmin(e, "Não foi possível atualizar a fase."));
    }
  }
  async function excluir(id: number) {
    try {
      await excluirFaseBossEventPuzzleAdmin(idDefinicao, id);
      await onMudou();
    } catch (e) {
      setErro(mensagemDeErroAdmin(e, "Não foi possível excluir a fase."));
    }
  }

  return (
    <div className={CARD}>
      <p className="mb-2 font-imFeel text-lg text-[#F3B43F]">Fases (por %HP)</p>
      <table className="w-full text-left text-xs text-white/80">
        <thead>
          <tr className="border-b border-white/10 uppercase text-white/50">
            <th className="px-2 py-1">Ordem</th>
            <th className="px-2 py-1">Nome</th>
            <th className="px-2 py-1">%HP limiar</th>
            <th className="px-2 py-1">Dano x</th>
            <th className="px-2 py-1">Defesa x</th>
            <th className="px-2 py-1">Enrage</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {fases.map((f) => (
            <tr key={f.id} className="border-b border-white/5">
              <td className="px-2 py-1">
                <input disabled={!editavel} type="number" defaultValue={f.ordem} onBlur={(e) => atualizar(f.id, { ordem: Number(e.target.value) })} className={`${INPUT_XS} w-12`} />
              </td>
              <td className="px-2 py-1">
                <input disabled={!editavel} defaultValue={f.nome_exibicao ?? ""} onBlur={(e) => atualizar(f.id, { nome_exibicao: e.target.value })} className={INPUT_XS} />
              </td>
              <td className="px-2 py-1">
                <input disabled={!editavel} type="number" defaultValue={f.hp_threshold_pct} onBlur={(e) => atualizar(f.id, { hp_threshold_pct: Number(e.target.value) })} className={`${INPUT_XS} w-16`} />
              </td>
              <td className="px-2 py-1">
                <input disabled={!editavel} type="number" step="0.1" defaultValue={f.dano_multiplicador} onBlur={(e) => atualizar(f.id, { dano_multiplicador: Number(e.target.value) })} className={`${INPUT_XS} w-16`} />
              </td>
              <td className="px-2 py-1">
                <input disabled={!editavel} type="number" step="0.1" defaultValue={f.defesa_multiplicador} onBlur={(e) => atualizar(f.id, { defesa_multiplicador: Number(e.target.value) })} className={`${INPUT_XS} w-16`} />
              </td>
              <td className="px-2 py-1">
                <input disabled={!editavel} type="checkbox" defaultChecked={f.enrage} onChange={(e) => atualizar(f.id, { enrage: e.target.checked })} />
              </td>
              <td className="px-2 py-1">
                {editavel && (
                  <button type="button" onClick={() => excluir(f.id)} className={BTN_DANGER}>
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
          <input placeholder="Ordem" type="number" value={novo.ordem} onChange={(e) => setNovo({ ...novo, ordem: Number(e.target.value) })} className={`${INPUT_XS} w-16`} />
          <input placeholder="Nome" value={novo.nome_exibicao} onChange={(e) => setNovo({ ...novo, nome_exibicao: e.target.value })} className={INPUT_XS} />
          <input placeholder="%HP limiar" type="number" value={novo.hp_threshold_pct} onChange={(e) => setNovo({ ...novo, hp_threshold_pct: Number(e.target.value) })} className={`${INPUT_XS} w-20`} />
          <button type="button" onClick={adicionar} className={BTN}>
            + Fase
          </button>
        </div>
      )}
    </div>
  );
}

function ResistenciasSecao({
  idDefinicao,
  resistencias,
  statusCatalogo,
  editavel,
  onMudou,
  setErro,
}: {
  idDefinicao: number;
  resistencias: EventPuzzleBossResistanceApi[];
  statusCatalogo: StatusCatalogEntryApi[];
  editavel: boolean;
  onMudou: () => Promise<void>;
  setErro: (s: string) => void;
}) {
  const [novoStatus, setNovoStatus] = useState("");
  const disponiveis = statusCatalogo.filter((s) => !resistencias.some((r) => r.status_key === s.status_key));

  async function adicionar() {
    if (!novoStatus) return;
    try {
      await criarResistenciaBossEventPuzzleAdmin(idDefinicao, { status_key: novoStatus, resistencia_pct: 0, imune: false });
      setNovoStatus("");
      await onMudou();
    } catch (e) {
      setErro(mensagemDeErroAdmin(e, "Não foi possível adicionar."));
    }
  }
  async function atualizar(id: number, patch: Partial<EventPuzzleBossResistanceApi>) {
    try {
      await atualizarResistenciaBossEventPuzzleAdmin(idDefinicao, id, patch);
      await onMudou();
    } catch (e) {
      setErro(mensagemDeErroAdmin(e, "Não foi possível atualizar."));
    }
  }
  async function excluir(id: number) {
    try {
      await excluirResistenciaBossEventPuzzleAdmin(idDefinicao, id);
      await onMudou();
    } catch (e) {
      setErro(mensagemDeErroAdmin(e, "Não foi possível excluir."));
    }
  }

  return (
    <div className={CARD}>
      <p className="mb-2 font-imFeel text-lg text-[#F3B43F]">Resistências de status</p>
      <table className="w-full text-left text-xs text-white/80">
        <thead>
          <tr className="border-b border-white/10 uppercase text-white/50">
            <th className="px-2 py-1">Status</th>
            <th className="px-2 py-1">Resistência %</th>
            <th className="px-2 py-1">Imune</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {resistencias.map((r) => (
            <tr key={r.id} className="border-b border-white/5">
              <td className="px-2 py-1 font-bold">{statusCatalogo.find((s) => s.status_key === r.status_key)?.nomeUi ?? r.status_key}</td>
              <td className="px-2 py-1">
                <input disabled={!editavel || r.imune} type="number" min={0} max={100} defaultValue={r.resistencia_pct} onBlur={(e) => atualizar(r.id, { resistencia_pct: Number(e.target.value) })} className={`${INPUT_XS} w-20 disabled:opacity-40`} />
              </td>
              <td className="px-2 py-1">
                <input disabled={!editavel} type="checkbox" defaultChecked={r.imune} onChange={(e) => atualizar(r.id, { imune: e.target.checked })} />
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
        <div className="mt-2 flex items-end gap-2">
          <select value={novoStatus} onChange={(e) => setNovoStatus(e.target.value)} className={INPUT_XS}>
            <option value="">Selecione um status...</option>
            {disponiveis.map((s) => (
              <option key={s.status_key} value={s.status_key}>
                {s.nomeUi}
              </option>
            ))}
          </select>
          <button type="button" disabled={!novoStatus} onClick={adicionar} className={BTN}>
            + Adicionar
          </button>
        </div>
      )}
    </div>
  );
}
