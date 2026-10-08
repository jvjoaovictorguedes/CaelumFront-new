"use client";
import Link from "next/link";
import {
  CrisisPreview,
  CrisisMetrics,
} from "@/components/world-crisis/AdminCrisisReadout";
import { useCallback, useEffect, useState } from "react";
import api from "@/utils/axiosIntance";
import {
  CARD,
  BTN,
  BTN_GHOST,
  BTN_DANGER,
  INPUT,
  LABEL,
  SUBTAB_BTN,
} from "../world-boss/components/styles";
import type {
  CrisisCatalogs,
  CrisisStructure,
  CrisisStage,
  CrisisStatus,
} from "@/types/contracts/worldCrisis";
const qualities = ["Comum", "Incomum", "Raro", "Epico", "Lendario", "Mitico"];
const weights = () => Object.fromEntries(qualities.map((q, i) => [q, 2 ** i]));
const contexts = ["ADVENTURE_SOLO", "ADVENTURE_PARTY", "HUNT"];
const scopeLabels: Record<string, string> = {
  PARTICIPATION: "Participação",
  PERSONAL_MILESTONE: "Marco pessoal",
  INDIVIDUAL_RANK: "Ranking individual",
  GUILD_RANK: "Ranking de guildas",
  COMPLETION: "Conclusão",
};
const rewardLabels: Record<string, string> = {
  CHARACTER_GOLD: "Gold do personagem",
  CHARACTER_XP: "XP do personagem",
  ITEM: "Item",
  GUILD_XP: "XP de guilda",
  GUILD_TREASURY_GOLD: "Gold no tesouro da guilda",
};
const newStage = (i: number): CrisisStage => ({
  key: `ETAPA_${i}`,
  nome: `Etapa ${i}`,
  requirements: [
    {
      key: "MATERIAL",
      nome: "Materiais",
      target_progress: 1000,
      mandatory: true,
      sources: [],
    },
  ],
  effects: [
    {
      effect_key: "PVE_XP_PENALTY_PCT",
      magnitude: 10,
      contexts: [...contexts],
    },
    {
      effect_key: "PVE_GOLD_PENALTY_PCT",
      magnitude: 10,
      contexts: [...contexts],
    },
  ],
});
const empty = (): CrisisStructure => ({
  key: "RECONSTRUCAO",
  nome: "Reconstrução de Caelum",
  descricao: "Ajude a reconstruir a cidade e cuidar dos feridos.",
  start_message: "A ameaça não foi contida. Caelum precisa de ajuda!",
  completion_message: "Caelum foi restaurada. Todas as rotas foram reabertas!",
  stages: [newStage(1)],
  restrictions: [],
  guild_scoring_config: {
    minimum_contributors_for_bonus: 5,
    tiers: [
      { min_pct: 0, multiplier: 1 },
      { min_pct: 20, multiplier: 1.05 },
      { min_pct: 40, multiplier: 1.1 },
      { min_pct: 60, multiplier: 1.15 },
      { min_pct: 80, multiplier: 1.2 },
    ],
  },
  rewards: [
    {
      key: "PARTICIPACAO",
      scope: "PARTICIPATION",
      min_points: 100,
      payload: [{ type: "CHARACTER_GOLD", quantity: 100 }],
    },
  ],
});
function Field({
  label,
  value,
  onChange,
  numeric = false,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  numeric?: boolean;
}) {
  return (
    <label className={LABEL}>
      {label}
      <input
        className={INPUT}
        type={numeric ? "number" : "text"}
        step={numeric ? "any" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
export default function AdminWorldCrisisClient() {
  const [catalogs, setCatalogs] = useState<CrisisCatalogs | null>(null),
    [tab, setTab] = useState("profiles"),
    [selected, setSelected] = useState<number | null>(null),
    [structure, setStructure] = useState<CrisisStructure>(empty),
    [active, setActive] = useState(false),
    [reason, setReason] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState<unknown>(null),
    [live, setLive] = useState<CrisisStatus | null>(null),
    [metrics, setMetrics] = useState<unknown>(null),
    [action, setAction] = useState("pause"),
    [liveValue, setLiveValue] = useState(""),
    [requirement, setRequirement] = useState(""),
    [rewardProcess, setRewardProcess] = useState(true),
    [confirmed, setConfirmed] = useState(false),
    [guildSim, setGuildSim] = useState({
      raw_points: 1000,
      unique_contributors: 5,
      member_count_snapshot: 10,
      existed_at_start: true,
    });
  const load = useCallback(async () => {
    try {
      const r = await api.get("/admin/world-crisis/catalogs");
      setCatalogs(r.data.data);
    } catch {
      setMessage(
        "Não foi possível carregar o catálogo. Verifique suas permissões.",
      );
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (tab === "live")
      void api
        .get("/admin/world-crisis/current")
        .then((r) => setLive(r.data.data))
        .catch(() => setMessage("Sem permissão para operar eventos."));
    if (["history", "metrics"].includes(tab))
      void api
        .get("/admin/world-crisis/metrics")
        .then((r) => setMetrics(r.data.data))
        .catch(() => setMessage("Não foi possível carregar métricas."));
  }, [tab]);
  async function perform(fn: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await fn();
      setMessage(success);
      await load();
    } catch (e) {
      setMessage(
        (e as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Não foi possível concluir a operação.",
      );
    } finally {
      setBusy(false);
    }
  }
  const updateStage = (i: number, change: Partial<CrisisStage>) =>
    setStructure((s) => ({
      ...s,
      stages: s.stages.map((x, j) => (j === i ? { ...x, ...change } : x)),
    }));
  async function save() {
    await perform(async () => {
      const r = selected
        ? await api.put(`/admin/world-crisis/configs/${selected}`, {
            structure,
            ativo: active,
            reason,
          })
        : await api.post("/admin/world-crisis/configs", {
            structure,
            ativo: active,
            reason,
          });
      setSelected(r.data.data.id);
    }, "Perfil salvo. Eventos ativos mantêm seu snapshot.");
  }
  async function liveAction() {
    await perform(async () => {
      await api.post(`/admin/world-crisis/current/${action}`, {
        reason,
        confirm: confirmed,
        process_rewards: rewardProcess,
        message: liveValue,
        magnitude: Number(liveValue),
        target_progress: Number(liveValue),
        requirement_key: requirement,
      });
      setLive((await api.get("/admin/world-crisis/current")).data.data);
      setConfirmed(false);
    }, "Operação concluída e auditada.");
  }
  return (
    <div className="flex flex-col gap-4 text-white">
      <Link
        href="/dashboard/admin"
        prefetch={false}
        className="self-start text-sm text-[#F3B43F] hover:underline"
      >
        ← Voltar ao Admin
      </Link>
      <h1 className="font-imFeel text-3xl text-[#F3B43F]">
        Crises Mundiais & Reconstrução
      </h1>
      <p className="text-sm text-white/60">
        Conteúdo para futuros eventos. Alterações no catálogo não modificam
        crises em andamento.
      </p>
      <nav className="flex flex-wrap gap-2">
        {[
          ["profiles", "Perfis"],
          ["live", "Crise atual"],
          ["history", "Histórico"],
          ["metrics", "Métricas"],
        ].map(([v, l]) => (
          <button
            key={v}
            className={SUBTAB_BTN(tab === v)}
            onClick={() => setTab(v)}
          >
            {l}
          </button>
        ))}
      </nav>
      {message && (
        <p
          role="status"
          className="rounded-lg border border-[#F3B43F]/30 bg-black/30 p-3 text-sm"
        >
          {message}
        </p>
      )}
      <label className={LABEL}>
        Motivo da alteração
        <input
          className={INPUT}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          minLength={5}
          maxLength={500}
        />
      </label>
      {tab === "profiles" && catalogs && (
        <>
          <section className={CARD}>
            <button
              className={`${BTN_GHOST} mb-3`}
              onClick={() =>
                void perform(async () => {
                  setStructure(
                    (await api.get("/admin/world-crisis/preset")).data.data,
                  );
                  setSelected(null);
                  setActive(false);
                }, "Proposta carregada como rascunho. Revise metas, zonas e prêmios antes de ativar.")
              }
            >
              Usar proposta: madeira, ferro e ervas
            </button>
            <div className="flex flex-wrap items-end gap-3">
              <label className={LABEL}>
                Perfil
                <select
                  className={INPUT}
                  value={selected ?? 0}
                  onChange={(e) => {
                    const c = catalogs.configs.find(
                      (c) => c.id === Number(e.target.value),
                    );
                    setSelected(c?.id ?? null);
                    setStructure(c ? structuredClone(c.structure) : empty());
                    setActive(c?.ativo ?? false);
                    setPreview(null);
                  }}
                >
                  <option value={0}>Novo perfil</option>
                  {catalogs.configs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                      {!c.ativo ? " (inativo)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className={BTN_GHOST}
                disabled={busy || reason.length < 5}
                onClick={() =>
                  void perform(
                    () =>
                      api.put("/admin/world-crisis/settings", {
                        enabled: !catalogs.enabled,
                        reason,
                      }),
                    catalogs.enabled
                      ? "Crises futuras desativadas."
                      : "Crises futuras ativadas.",
                  )
                }
              >
                {catalogs.enabled ? "Desativar" : "Ativar"} consequências
                futuras
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field
                label="Chave"
                value={structure.key}
                onChange={(key) => setStructure({ ...structure, key })}
              />
              <Field
                label="Nome"
                value={structure.nome}
                onChange={(nome) => setStructure({ ...structure, nome })}
              />
              <Field
                label="Descrição"
                value={structure.descricao ?? ""}
                onChange={(descricao) =>
                  setStructure({ ...structure, descricao })
                }
              />
              <Field
                label="Mensagem inicial"
                value={structure.start_message ?? ""}
                onChange={(start_message) =>
                  setStructure({ ...structure, start_message })
                }
              />
              <Field
                label="Mensagem final"
                value={structure.completion_message ?? ""}
                onChange={(completion_message) =>
                  setStructure({ ...structure, completion_message })
                }
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                Perfil ativo
              </label>
            </div>
          </section>
          {structure.stages.map((stage, i) => (
            <section className={CARD} key={i}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-imFeel text-2xl text-[#F3B43F]">
                  Etapa {i + 1}
                </h2>
                <div className="flex gap-2">
                  <button
                    className={BTN_GHOST}
                    disabled={i === 0}
                    onClick={() => {
                      const stages = [...structure.stages];
                      [stages[i - 1], stages[i]] = [stages[i], stages[i - 1]];
                      setStructure({ ...structure, stages });
                    }}
                  >
                    ↑
                  </button>
                  <button
                    className={BTN_DANGER}
                    onClick={() =>
                      setStructure({
                        ...structure,
                        stages: structure.stages.filter((_, j) => i !== j),
                      })
                    }
                  >
                    Remover etapa
                  </button>
                </div>
              </div>
              <div className="my-3 grid gap-3 sm:grid-cols-3">
                <Field
                  label="Chave da etapa"
                  value={stage.key}
                  onChange={(key) => updateStage(i, { key })}
                />
                <Field
                  label="Nome"
                  value={stage.nome}
                  onChange={(nome) => updateStage(i, { nome })}
                />
                <Field
                  label="Mensagem de conclusão"
                  value={stage.completion_message ?? ""}
                  onChange={(completion_message) =>
                    updateStage(i, { completion_message })
                  }
                />
              </div>
              {stage.requirements.map((req, j) => {
                const update = (change: Partial<typeof req>) =>
                  updateStage(i, {
                    requirements: stage.requirements.map((r, k) =>
                      k === j ? { ...r, ...change } : r,
                    ),
                  });
                return (
                  <fieldset
                    key={j}
                    className="my-4 rounded-xl border border-white/15 p-3"
                  >
                    <legend className="px-2 text-[#F3B43F]">
                      Requisito {j + 1}
                    </legend>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field
                        label="Chave"
                        value={req.key}
                        onChange={(key) => update({ key })}
                      />
                      <Field
                        label="Nome"
                        value={req.nome}
                        onChange={(nome) => update({ nome })}
                      />
                      <Field
                        label="Meta global"
                        value={req.target_progress}
                        numeric
                        onChange={(v) => update({ target_progress: Number(v) })}
                      />
                      <label className="text-sm">
                        <input
                          type="checkbox"
                          checked={req.mandatory}
                          onChange={(e) =>
                            update({ mandatory: e.target.checked })
                          }
                        />
                        Obrigatório
                      </label>
                    </div>
                    {req.sources.map((source, k) => {
                      const sourceUpdate = (change: Partial<typeof source>) =>
                        update({
                          sources: req.sources.map((s, n) =>
                            n === k ? { ...s, ...change } : s,
                          ),
                        });
                      return (
                        <div
                          key={k}
                          className="my-3 rounded-lg bg-black/20 p-3"
                        >
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <label className={LABEL}>
                              Fonte
                              <select
                                className={INPUT}
                                value={source.source_type}
                                onChange={(e) =>
                                  sourceUpdate({
                                    source_type: e.target
                                      .value as typeof source.source_type,
                                    source_id: 0,
                                  })
                                }
                              >
                                <option value="EXPEDITION_RESOURCE">
                                  Recurso da Expedição
                                </option>
                                <option value="ITEM">Item exato</option>
                              </select>
                            </label>
                            <label className={LABEL}>
                              Material
                              <select
                                className={INPUT}
                                value={source.source_id}
                                onChange={(e) =>
                                  sourceUpdate({
                                    source_id: Number(e.target.value),
                                  })
                                }
                              >
                                <option value={0}>Selecione</option>
                                {(source.source_type === "ITEM"
                                  ? catalogs.items.filter(
                                      (x) =>
                                        ![
                                          "Arma",
                                          "Armadura",
                                          "Bota",
                                          "Luva",
                                          "Capacete",
                                          "Escudo",
                                        ].includes(x.tipo_item),
                                    )
                                  : catalogs.resources
                                ).map((x) => (
                                  <option key={x.id} value={x.id}>
                                    {x.nome}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <Field
                              label="Progresso por unidade"
                              value={source.progress_per_unit}
                              numeric
                              onChange={(v) =>
                                sourceUpdate({ progress_per_unit: Number(v) })
                              }
                            />
                            <Field
                              label="Pontos por unidade"
                              value={source.ranking_points_per_unit}
                              numeric
                              onChange={(v) =>
                                sourceUpdate({
                                  ranking_points_per_unit: Number(v),
                                })
                              }
                            />
                          </div>
                          {source.source_type === "EXPEDITION_RESOURCE" && (
                            <div className="my-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                              {qualities.map((q) => (
                                <Field
                                  key={q}
                                  label={`Peso ${q}`}
                                  value={source.quality_weights[q] ?? 1}
                                  numeric
                                  onChange={(v) =>
                                    sourceUpdate({
                                      quality_weights: {
                                        ...source.quality_weights,
                                        [q]: Number(v),
                                      },
                                    })
                                  }
                                />
                              ))}
                            </div>
                          )}
                          <button
                            className={BTN_DANGER}
                            onClick={() =>
                              update({
                                sources: req.sources.filter((_, n) => n !== k),
                              })
                            }
                          >
                            Remover fonte
                          </button>
                        </div>
                      );
                    })}
                    <div className="flex flex-wrap gap-2">
                      <button
                        className={BTN_GHOST}
                        onClick={() =>
                          update({
                            sources: [
                              ...req.sources,
                              {
                                source_type: "EXPEDITION_RESOURCE",
                                source_id: 0,
                                progress_per_unit: 1,
                                ranking_points_per_unit: 1,
                                quality_weights: weights(),
                              },
                            ],
                          })
                        }
                      >
                        Adicionar fonte
                      </button>
                      <button
                        className={BTN_DANGER}
                        onClick={() =>
                          updateStage(i, {
                            requirements: stage.requirements.filter(
                              (_, n) => n !== j,
                            ),
                          })
                        }
                      >
                        Remover requisito
                      </button>
                    </div>
                  </fieldset>
                );
              })}
              <button
                className={BTN_GHOST}
                onClick={() =>
                  updateStage(i, {
                    requirements: [
                      ...stage.requirements,
                      {
                        key: `MATERIAL_${stage.requirements.length + 1}`,
                        nome: "Materiais",
                        target_progress: 1000,
                        mandatory: true,
                        sources: [],
                      },
                    ],
                  })
                }
              >
                Adicionar requisito
              </button>
              <h3 className="mt-4 font-imFeel text-xl text-[#F3B43F]">
                Penalidades de farm
              </h3>
              {stage.effects.map((effect, j) => (
                <div
                  key={effect.effect_key}
                  className="my-3 flex flex-wrap items-end gap-3"
                >
                  <Field
                    label={
                      effect.effect_key.includes("XP")
                        ? "Redução de XP (%)"
                        : "Redução de Gold (%)"
                    }
                    value={effect.magnitude}
                    numeric
                    onChange={(v) =>
                      updateStage(i, {
                        effects: stage.effects.map((x, n) =>
                          n === j ? { ...x, magnitude: Number(v) } : x,
                        ),
                      })
                    }
                  />
                  {contexts.map((c) => (
                    <label key={c} className="text-xs">
                      <input
                        type="checkbox"
                        checked={effect.contexts.includes(c)}
                        onChange={(e) =>
                          updateStage(i, {
                            effects: stage.effects.map((x, n) =>
                              n === j
                                ? {
                                    ...x,
                                    contexts: e.target.checked
                                      ? [...x.contexts, c]
                                      : x.contexts.filter((y) => y !== c),
                                  }
                                : x,
                            ),
                          })
                        }
                      />
                      {c === "ADVENTURE_SOLO"
                        ? "Aventura solo"
                        : c === "ADVENTURE_PARTY"
                          ? "Aventura em grupo"
                          : "Farm de caçada"}
                    </label>
                  ))}
                </div>
              ))}
            </section>
          ))}
          <button
            className={`${BTN_GHOST} self-start`}
            onClick={() =>
              setStructure({
                ...structure,
                stages: [
                  ...structure.stages,
                  newStage(structure.stages.length + 1),
                ],
              })
            }
          >
            Adicionar etapa
          </button>
          <section className={CARD}>
            <h2 className="font-imFeel text-2xl text-[#F3B43F]">
              Zonas devastadas
            </h2>
            {structure.restrictions.map((r, i) => (
              <div key={i} className="my-3 flex flex-wrap gap-3">
                <label className={LABEL}>
                  Zona
                  <select
                    className={INPUT}
                    value={r.target_id}
                    onChange={(e) =>
                      setStructure({
                        ...structure,
                        restrictions: structure.restrictions.map((x, n) =>
                          n === i
                            ? { ...x, target_id: Number(e.target.value) }
                            : x,
                        ),
                      })
                    }
                  >
                    <option value={0}>Selecione</option>
                    {catalogs.zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.nome}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={LABEL}>
                  Reabrir após etapa
                  <select
                    className={INPUT}
                    value={r.unlock_after_stage_key}
                    onChange={(e) =>
                      setStructure({
                        ...structure,
                        restrictions: structure.restrictions.map((x, n) =>
                          n === i
                            ? { ...x, unlock_after_stage_key: e.target.value }
                            : x,
                        ),
                      })
                    }
                  >
                    {structure.stages.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.nome}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className={BTN_DANGER}
                  onClick={() =>
                    setStructure({
                      ...structure,
                      restrictions: structure.restrictions.filter(
                        (_, n) => n !== i,
                      ),
                    })
                  }
                >
                  Remover
                </button>
              </div>
            ))}
            <button
              className={BTN_GHOST}
              onClick={() =>
                setStructure({
                  ...structure,
                  restrictions: [
                    ...structure.restrictions,
                    {
                      target_type: "ADVENTURE_ZONE",
                      target_id: 0,
                      unlock_after_stage_key:
                        structure.stages.at(-1)?.key ?? "",
                    },
                  ],
                })
              }
            >
              Adicionar zona
            </button>
          </section>
          <section className={CARD}>
            <h2 className="font-imFeel text-2xl text-[#F3B43F]">
              Mobilização das guildas
            </h2>
            <Field
              label="Mínimo de contribuidores para bônus"
              value={
                structure.guild_scoring_config.minimum_contributors_for_bonus
              }
              numeric
              onChange={(v) =>
                setStructure({
                  ...structure,
                  guild_scoring_config: {
                    ...structure.guild_scoring_config,
                    minimum_contributors_for_bonus: Number(v),
                  },
                })
              }
            />
            {structure.guild_scoring_config.tiers.map((t, i) => (
              <div className="my-3 flex gap-3" key={i}>
                {(["min_pct", "multiplier"] as const).map((k) => (
                  <Field
                    key={k}
                    label={
                      k === "min_pct"
                        ? "Participação mínima (%)"
                        : "Multiplicador"
                    }
                    value={t[k]}
                    numeric
                    onChange={(v) =>
                      setStructure({
                        ...structure,
                        guild_scoring_config: {
                          ...structure.guild_scoring_config,
                          tiers: structure.guild_scoring_config.tiers.map(
                            (x, n) => (n === i ? { ...x, [k]: Number(v) } : x),
                          ),
                        },
                      })
                    }
                  />
                ))}
              </div>
            ))}
            <h3 className="my-3 text-[#F3B43F]">
              Simular guilda (perfil salvo)
            </h3>
            <div className="flex flex-wrap gap-3">
              {(
                [
                  "raw_points",
                  "unique_contributors",
                  "member_count_snapshot",
                ] as const
              ).map((k) => (
                <Field
                  key={k}
                  label={
                    {
                      raw_points: "Pontos",
                      unique_contributors: "Contribuidores",
                      member_count_snapshot: "Membros no início",
                    }[k]
                  }
                  value={guildSim[k]}
                  numeric
                  onChange={(v) => setGuildSim({ ...guildSim, [k]: Number(v) })}
                />
              ))}
              <label className="text-sm">
                <input
                  type="checkbox"
                  checked={guildSim.existed_at_start}
                  onChange={(e) =>
                    setGuildSim({
                      ...guildSim,
                      existed_at_start: e.target.checked,
                    })
                  }
                />
                Guilda existia no início
              </label>
              <button
                className={BTN_GHOST}
                disabled={!selected}
                onClick={() =>
                  void perform(
                    async () =>
                      setPreview(
                        (
                          await api.post(
                            `/admin/world-crisis/configs/${selected}/simulate-guild-scoring`,
                            guildSim,
                          )
                        ).data.data,
                      ),
                    "Simulação concluída.",
                  )
                }
              >
                Simular
              </button>
            </div>
          </section>
          <section className={CARD}>
            <h2 className="font-imFeel text-2xl text-[#F3B43F]">Recompensas</h2>
            {structure.rewards.map((r, i) => {
              const update = (change: Partial<typeof r>) =>
                setStructure({
                  ...structure,
                  rewards: structure.rewards.map((x, n) =>
                    n === i ? { ...x, ...change } : x,
                  ),
                });
              return (
                <fieldset
                  key={i}
                  className="my-4 rounded-xl border border-white/15 p-3"
                >
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field
                      label="Chave"
                      value={r.key}
                      onChange={(key) => update({ key })}
                    />
                    <label className={LABEL}>
                      Premiar
                      <select
                        className={INPUT}
                        value={r.scope}
                        onChange={(e) => update({ scope: e.target.value })}
                      >
                        {Object.entries(scopeLabels).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Field
                      label="Pontos mínimos pessoais"
                      value={r.min_points}
                      numeric
                      onChange={(v) => update({ min_points: Number(v) })}
                    />
                    {r.scope.includes("RANK") && (
                      <>
                        <Field
                          label="Posição inicial"
                          value={r.rank_start ?? 1}
                          numeric
                          onChange={(v) => update({ rank_start: Number(v) })}
                        />
                        <Field
                          label="Posição final"
                          value={r.rank_end ?? 1}
                          numeric
                          onChange={(v) => update({ rank_end: Number(v) })}
                        />
                      </>
                    )}
                  </div>
                  {r.payload.map((p, j) => {
                    const change = (partial: Partial<typeof p>) =>
                      update({
                        payload: r.payload.map((x, n) =>
                          n === j ? { ...x, ...partial } : x,
                        ),
                      });
                    return (
                      <div
                        key={j}
                        className="my-3 flex flex-wrap items-end gap-3"
                      >
                        <label className={LABEL}>
                          Prêmio
                          <select
                            className={INPUT}
                            value={p.type}
                            onChange={(e) => change({ type: e.target.value })}
                          >
                            {Object.entries(rewardLabels)
                              .filter(
                                ([v]) =>
                                  !v.startsWith("GUILD_") ||
                                  r.scope === "GUILD_RANK",
                              )
                              .map(([v, l]) => (
                                <option key={v} value={v}>
                                  {l}
                                </option>
                              ))}
                          </select>
                        </label>
                        <Field
                          label="Quantidade"
                          value={p.quantity}
                          numeric
                          onChange={(v) => change({ quantity: Number(v) })}
                        />
                        {p.type === "ITEM" && (
                          <label className={LABEL}>
                            Item
                            <select
                              className={INPUT}
                              value={p.item_id ?? 0}
                              onChange={(e) =>
                                change({ item_id: Number(e.target.value) })
                              }
                            >
                              <option value={0}>Selecione</option>
                              {catalogs.items.map((x) => (
                                <option key={x.id} value={x.id}>
                                  {x.nome}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                        <button
                          className={BTN_DANGER}
                          onClick={() =>
                            update({
                              payload: r.payload.filter((_, n) => n !== j),
                            })
                          }
                        >
                          Remover prêmio
                        </button>
                      </div>
                    );
                  })}
                  <div className="flex gap-3">
                    <button
                      className={BTN_GHOST}
                      onClick={() =>
                        update({
                          payload: [
                            ...r.payload,
                            { type: "CHARACTER_GOLD", quantity: 100 },
                          ],
                        })
                      }
                    >
                      Adicionar prêmio
                    </button>
                    <button
                      className={BTN_DANGER}
                      onClick={() =>
                        setStructure({
                          ...structure,
                          rewards: structure.rewards.filter((_, n) => n !== i),
                        })
                      }
                    >
                      Remover faixa
                    </button>
                  </div>
                </fieldset>
              );
            })}
            <button
              className={BTN_GHOST}
              onClick={() =>
                setStructure({
                  ...structure,
                  rewards: [
                    ...structure.rewards,
                    {
                      key: `PREMIO_${structure.rewards.length + 1}`,
                      scope: "INDIVIDUAL_RANK",
                      min_points: 100,
                      rank_start: 1,
                      rank_end: 1,
                      payload: [{ type: "CHARACTER_GOLD", quantity: 1000 }],
                    },
                  ],
                })
              }
            >
              Adicionar faixa
            </button>
          </section>
          <div className="flex flex-wrap gap-3">
            <button
              className={BTN}
              disabled={busy || reason.trim().length < 5}
              onClick={() => void save()}
            >
              Salvar perfil
            </button>
            <button
              className={BTN_GHOST}
              disabled={!selected || busy}
              onClick={() =>
                void perform(
                  async () =>
                    setPreview(
                      (
                        await api.post(
                          `/admin/world-crisis/configs/${selected}/preview`,
                        )
                      ).data.data,
                    ),
                  "Preview concluído.",
                )
              }
            >
              Validar e visualizar
            </button>
            <button
              className={BTN_GHOST}
              disabled={!selected || busy || reason.length < 5}
              onClick={() =>
                void perform(
                  () =>
                    api.post(
                      `/admin/world-crisis/configs/${selected}/duplicate`,
                      { key: `${structure.key}_COPIA`, reason },
                    ),
                  "Cópia criada desativada.",
                )
              }
            >
              Duplicar
            </button>
          </div>
          {preview !== null && <CrisisPreview data={preview} />}
        </>
      )}
      {tab === "live" && (
        <section className={CARD}>
          <h2 className="font-imFeel text-2xl text-[#F3B43F]">
            Operação ao vivo
          </h2>
          <p className="my-3 text-sm">
            {live?.status === "ACTIVE"
              ? `${live.nome} — ${live.stage?.nome}`
              : "Nenhuma crise ativa"}
          </p>
          {live?.progress?.map((p) => (
            <p
              key={`${p.stage_key}:${p.requirement_key}`}
              className="text-sm text-white/60"
            >
              {p.stage_key} / {p.requirement_key}: {p.current_progress} /{" "}
              {p.target_progress}
            </p>
          ))}
          <div className="my-4 grid gap-3 sm:grid-cols-2">
            <label className={LABEL}>
              Ação
              <select
                className={INPUT}
                value={action}
                onChange={(e) => {
                  setAction(e.target.value);
                  setConfirmed(false);
                }}
              >
                {[
                  ["pause", "Pausar contribuições"],
                  ["resume", "Retomar contribuições"],
                  ["force-complete-stage", "Concluir etapa"],
                  ["adjust-requirement", "Ajustar meta"],
                  ["override-effect", "Alterar penalidade atual"],
                  ["announce", "Anunciar"],
                  ["force-resolve", "Concluir crise"],
                  ["cancel", "Cancelar crise"],
                ].map(([v, l]) => (
                  <option value={v} key={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            {action === "adjust-requirement" && (
              <Field
                label="Chave do requisito"
                value={requirement}
                onChange={setRequirement}
              />
            )}
            <Field
              label={
                action === "announce"
                  ? "Mensagem"
                  : "Novo valor (quando aplicável)"
              }
              value={liveValue}
              onChange={setLiveValue}
            />
            <label className="text-sm">
              <input
                type="checkbox"
                checked={rewardProcess}
                onChange={(e) => setRewardProcess(e.target.checked)}
              />
              Processar prêmios ao concluir crise
            </label>
            <label className="text-sm">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              Confirmo esta operação no evento ativo
            </label>
          </div>
          <button
            className={BTN_DANGER}
            disabled={
              busy ||
              !confirmed ||
              reason.length < 5 ||
              live?.status !== "ACTIVE"
            }
            onClick={() => void liveAction()}
          >
            Executar operação
          </button>
        </section>
      )}
      {["history", "metrics"].includes(tab) && (
        <section className={CARD}>
          <h2 className="font-imFeel text-2xl text-[#F3B43F]">
            {tab === "history"
              ? "Histórico de crises"
              : "Métricas de reconstrução"}
          </h2>
          <CrisisMetrics data={metrics} historyOnly={tab === "history"} />
        </section>
      )}
    </div>
  );
}
