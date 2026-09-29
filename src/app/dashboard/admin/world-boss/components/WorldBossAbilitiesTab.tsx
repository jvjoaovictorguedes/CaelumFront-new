"use client";

// Ameaça Mundial V2 §6/§13.5 — Habilidades do Boss: cada linha vincula
// um Power real do catálogo (nunca um cadastro paralelo de dano/cura -
// isso já existe em Power). fases_permitidas mora aqui (não na fase)
// porque é a habilidade que decide em quais fases pode ser escolhida;
// null/vazio = elegível em toda fase.
import { useCallback, useEffect, useState } from "react";
import {
  atualizarHabilidadeWorldBossAdmin,
  criarHabilidadeWorldBossAdmin,
  excluirHabilidadeWorldBossAdmin,
  listarHabilidadesWorldBossAdmin,
  mensagemDeErroAdmin,
  previewHabilidadeWorldBossAdmin,
  type PayloadWorldBossAbilityAdmin,
  type WorldBossAbilityApi,
  type WorldBossPhaseApi,
  type WorldBossPreviewHabilidadeApi,
  type WorldBossTipoAlvoApi,
} from "@/lib/api/admin";
import { PowerSelect, usePowersParaSelecaoAdmin } from "@/components/admin/PowerPicker";
import { BTN, BTN_DANGER, BTN_GHOST, CARD, INPUT_XS, LABEL_XS } from "./styles";

const TIPOS_ALVO: WorldBossTipoAlvoApi[] = ["ALEATORIO", "MAIOR_DANO", "MENOR_VIDA", "N_ALEATORIOS", "TODOS", "SELF"];

export default function WorldBossAbilitiesTab({ configId, fases }: { configId: number; fases: WorldBossPhaseApi[] }) {
  const [habilidades, setHabilidades] = useState<WorldBossAbilityApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [novoIdPower, setNovoIdPower] = useState<number | "">("");
  const [salvando, setSalvando] = useState(false);
  const [previewDe, setPreviewDe] = useState<number | null>(null);
  const { powers } = usePowersParaSelecaoAdmin();

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setHabilidades(await listarHabilidadesWorldBossAdmin(configId));
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar as habilidades."));
    } finally {
      setCarregando(false);
    }
  }, [configId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function adicionar() {
    if (novoIdPower === "") return;
    setSalvando(true);
    setErro("");
    try {
      await criarHabilidadeWorldBossAdmin(configId, { id_power: novoIdPower });
      setNovoIdPower("");
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível adicionar a habilidade."));
    } finally {
      setSalvando(false);
    }
  }

  async function atualizar(id: number, patch: Partial<PayloadWorldBossAbilityAdmin>) {
    try {
      await atualizarHabilidadeWorldBossAdmin(configId, id, patch);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível atualizar a habilidade."));
    }
  }

  async function excluir(id: number) {
    try {
      await excluirHabilidadeWorldBossAdmin(configId, id);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível excluir a habilidade."));
    }
  }

  function alternarFasePermitida(hab: WorldBossAbilityApi, idFase: number) {
    const atual = hab.fases_permitidas ?? [];
    const jaTem = atual.includes(idFase);
    const novaLista = jaTem ? atual.filter((id) => id !== idFase) : [...atual, idFase];
    atualizar(hab.id, { fases_permitidas: novaLista.length === 0 ? null : novaLista });
  }

  const fasesComId = fases.filter((f): f is WorldBossPhaseApi & { id: number } => f.id !== undefined);

  return (
    <div className="flex flex-col gap-3">
      {erro && <p className="text-xs text-red-400">{erro}</p>}
      {fasesComId.length < fases.length && (
        <p className="text-xs text-amber-300/80">Salve o catálogo depois de editar as fases pra elas ganharem um ID e poderem ser marcadas aqui.</p>
      )}

      {carregando ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : habilidades.length === 0 ? (
        <p className="text-sm text-white/50">Nenhuma habilidade cadastrada — o Boss só ataca com o dano básico da fase.</p>
      ) : (
        habilidades.map((hab) => (
          <div key={hab.id} className={`${CARD} !p-4`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-[#F3B43F]">{hab.Power?.nome ?? `Power #${hab.id_power}`}</p>
              <div className="flex gap-2">
                <label className="flex items-center gap-1 text-xs text-white/70">
                  <input type="checkbox" checked={hab.ativo} onChange={(e) => atualizar(hab.id, { ativo: e.target.checked })} />
                  Ativo
                </label>
                <button type="button" onClick={() => setPreviewDe(previewDe === hab.id ? null : hab.id)} className="text-xs text-[#F3B43F] hover:underline">
                  {previewDe === hab.id ? "Fechar preview" : "Preview de dano/cura"}
                </button>
                <button type="button" onClick={() => excluir(hab.id)} className={BTN_DANGER}>Excluir</button>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <label className={LABEL_XS}>
                Tipo de alvo
                <select value={hab.tipo_alvo} onChange={(e) => atualizar(hab.id, { tipo_alvo: e.target.value as WorldBossTipoAlvoApi })} className={INPUT_XS}>
                  {TIPOS_ALVO.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              {hab.tipo_alvo === "N_ALEATORIOS" && (
                <label className={LABEL_XS}>
                  Quantidade de alvos
                  <input
                    type="number"
                    min={1}
                    value={hab.quantidade_alvos ?? 1}
                    onChange={(e) => atualizar(hab.id, { quantidade_alvos: Number(e.target.value) })}
                    className={INPUT_XS}
                  />
                </label>
              )}
              <label className={LABEL_XS}>
                Peso de uso
                <input type="number" min={0} value={hab.peso_uso} onChange={(e) => atualizar(hab.id, { peso_uso: Number(e.target.value) })} className={INPUT_XS} />
              </label>
              <label className={LABEL_XS}>
                Prioridade
                <input type="number" value={hab.prioridade} onChange={(e) => atualizar(hab.id, { prioridade: Number(e.target.value) })} className={INPUT_XS} />
              </label>
              <label className={LABEL_XS}>
                Tempo de conjuração (ms)
                <input type="number" min={0} value={hab.tempo_conjuracao_ms} onChange={(e) => atualizar(hab.id, { tempo_conjuracao_ms: Number(e.target.value) })} className={INPUT_XS} />
              </label>
              <label className={LABEL_XS}>
                Cooldown (override, vazio = do Power)
                <input
                  type="number"
                  min={0}
                  placeholder="Do Power"
                  value={hab.cooldown_override ?? ""}
                  onChange={(e) => atualizar(hab.id, { cooldown_override: e.target.value === "" ? null : Number(e.target.value) })}
                  className={INPUT_XS}
                />
              </label>
              <label className={LABEL_XS}>
                Custo de mana (override, vazio = do Power)
                <input
                  type="number"
                  min={0}
                  placeholder="Do Power"
                  value={hab.custo_mana_override ?? ""}
                  onChange={(e) => atualizar(hab.id, { custo_mana_override: e.target.value === "" ? null : Number(e.target.value) })}
                  className={INPUT_XS}
                />
              </label>
              <label className="flex items-center gap-1 self-end text-xs text-white/70">
                <input type="checkbox" checked={hab.escala_com_furia} onChange={(e) => atualizar(hab.id, { escala_com_furia: e.target.checked })} />
                Escala com Fúria
              </label>
            </div>

            <div className="mt-3">
              <p className="mb-1 text-[10px] font-bold uppercase text-white/50">Fases permitidas (nenhuma marcada = elegível em toda fase)</p>
              <div className="flex flex-wrap gap-2">
                {fasesComId.map((fase) => {
                  const marcada = (hab.fases_permitidas ?? []).includes(fase.id);
                  return (
                    <button
                      key={fase.id}
                      type="button"
                      onClick={() => alternarFasePermitida(hab, fase.id)}
                      className={`rounded-full px-2 py-1 text-[11px] ${marcada ? "bg-[#F3B43F] text-black" : "border border-white/20 text-white/60 hover:bg-white/10"}`}
                    >
                      {fase.nome_fase || `Fase ${fase.ordem}`}
                    </button>
                  );
                })}
                {fasesComId.length === 0 && <p className="text-[11px] text-white/40">Nenhuma fase salva ainda.</p>}
              </div>
            </div>

            {previewDe === hab.id && <PreviewHabilidade configId={configId} idAbility={hab.id} fases={fasesComId} />}
          </div>
        ))
      )}

      <div className="mt-2 flex items-end gap-2 rounded-lg border border-white/10 p-3">
        <label className={`${LABEL_XS} flex-1`}>
          Adicionar habilidade (Power)
          <PowerSelect powers={powers} value={novoIdPower} onChange={setNovoIdPower} />
        </label>
        <button type="button" disabled={salvando || novoIdPower === ""} onClick={adicionar} className={BTN}>+ Adicionar</button>
      </div>
    </div>
  );
}

function PreviewHabilidade({ configId, idAbility, fases }: { configId: number; idAbility: number; fases: (WorldBossPhaseApi & { id: number })[] }) {
  const [faseOrdem, setFaseOrdem] = useState<number | "">(fases[0]?.ordem ?? "");
  const [preview, setPreview] = useState<WorldBossPreviewHabilidadeApi | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const buscar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setPreview(await previewHabilidadeWorldBossAdmin(configId, { idAbility, faseOrdem: faseOrdem === "" ? undefined : faseOrdem }));
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível calcular o preview."));
    } finally {
      setCarregando(false);
    }
  }, [configId, idAbility, faseOrdem]);

  useEffect(() => {
    buscar();
  }, [buscar]);

  return (
    <div className="mt-3 rounded-lg border border-[#F3B43F]/30 bg-black/20 p-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className={LABEL_XS}>
          Fase de referência
          <select value={faseOrdem} onChange={(e) => setFaseOrdem(Number(e.target.value))} className={INPUT_XS}>
            {fases.map((f) => (
              <option key={f.id} value={f.ordem}>{f.nome_fase || `Fase ${f.ordem}`}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={buscar} className={BTN_GHOST}>Recalcular</button>
      </div>
      {erro && <p className="mt-2 text-xs text-red-400">{erro}</p>}
      {carregando && <p className="mt-2 text-xs text-white/50">Calculando...</p>}
      {preview && !carregando && (
        <div className="mt-2 overflow-x-auto">
          <p className="mb-1 text-[11px] text-white/50">
            Custo de mana: {preview.power.custo_mana} · Cooldown: {preview.habilidade.cooldown} ação(ões) · Escala: {preview.power.escala_atributo} x{preview.power.valor_escala}
          </p>
          <table className="w-full text-left text-xs text-white/80">
            <thead>
              <tr className="border-b border-white/10 uppercase text-white/50">
                <th className="px-2 py-1">Ação #</th>
                <th className="px-2 py-1">Fúria</th>
                <th className="px-2 py-1">Dano estimado</th>
                <th className="px-2 py-1">Cura estimada</th>
              </tr>
            </thead>
            <tbody>
              {preview.estimativas.map((e) => (
                <tr key={e.acao} className="border-b border-white/5">
                  <td className="px-2 py-1">{e.acao}</td>
                  <td className="px-2 py-1">{e.furia_pct}%</td>
                  <td className="px-2 py-1">{e.dano}</td>
                  <td className="px-2 py-1">{e.cura}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
