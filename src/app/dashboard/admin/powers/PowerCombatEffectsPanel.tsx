"use client";

import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  adicionarCombatEffectPowerAdmin,
  atualizarCombatEffectPowerAdmin,
  catalogoCombatEffectsAdmin,
  listarCombatEffectsPowerAdmin,
  mensagemDeErroAdmin,
  removerCombatEffectPowerAdmin,
  type CombatEffectCatalogApi,
  type CombatEffectFieldApi,
  type CombatEffectSupportApi,
  type PowerCombatEffectApi,
} from "@/lib/api/admin";
import {
  changedPayload,
  draftPayload,
  effectTitle,
  effectToDraft,
  engineSupport,
  fieldOptions,
  formatNumber,
  magnitudeUnit,
  percentToPpm,
  ppmToPercent,
  previewEffect,
  type CombatEffectDraft,
  type CombatEffectValues,
} from "./combatEffectEditor";

const INPUT =
  "w-full rounded-lg border border-white/20 bg-[#14100d] px-3 py-2 text-sm text-white focus:border-[#F3B43F] focus:outline-none disabled:opacity-50";
const BUTTON =
  "rounded-lg border border-white/20 px-3 py-2 text-xs text-white/80 hover:border-[#F3B43F]/60 disabled:opacity-40";

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: ReactNode;
  children: ReactNode;
}) {
  const helpId = useId();
  const control = isValidElement<{
    "aria-label"?: string;
    "aria-describedby"?: string;
  }>(children)
    ? cloneElement(children, {
        "aria-label": label,
        "aria-describedby": help ? helpId : undefined,
      })
    : children;
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-xs text-white/75">
      <span>{label}</span>
      {control}
      {help && (
        <span id={helpId} className="text-[11px] leading-relaxed text-white/50">
          {help}
        </span>
      )}
    </label>
  );
}
function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-white/10 p-4">
      <legend className="px-2 text-sm font-semibold text-[#F3B43F]">
        {title}
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
function Badge({ support }: { support: CombatEffectSupportApi }) {
  const color =
    support.status === "FUNCTIONAL"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
      : support.status === "PARTIAL"
        ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
        : "border-red-400/30 bg-red-400/10 text-red-300";
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold ${color}`}
    >
      {support.label}
    </span>
  );
}
function SchemaFields({
  fields,
  config,
  onChange,
  catalog,
  groupList,
}: {
  fields: CombatEffectFieldApi[];
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  catalog: CombatEffectCatalogApi;
  groupList: string;
}) {
  return (
    <>
      {fields.map((field) => {
        const raw = config[field.key];
        const value =
          typeof raw === "string" || typeof raw === "number" ? raw : "";
        const set = (value: string) =>
          onChange({
            ...config,
            [field.key]:
              field.type === "number" && value !== "" ? Number(value) : value,
          });
        return (
          <Field key={field.key} label={field.label}>
            {field.type === "select" ? (
              <select
                className={INPUT}
                value={value}
                onChange={(event) => set(event.target.value)}
                required={field.required}
              >
                <option value="">Selecione...</option>
                {raw != null &&
                  raw !== "" &&
                  !fieldOptions(field, catalog).some(
                    (option) => option.value === raw,
                  ) && (
                    <option value={String(raw)}>
                      {String(raw)} (valor legado; revise)
                    </option>
                  )}
                {fieldOptions(field, catalog).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className={INPUT}
                type={field.type === "number" ? "number" : "text"}
                step={field.type === "number" ? "any" : undefined}
                value={value}
                min={field.min}
                max={field.max}
                maxLength={field.maxLength}
                required={field.required}
                list={
                  field.optionsSource === "stackGroups" ? groupList : undefined
                }
                onChange={(event) => set(event.target.value)}
              />
            )}
          </Field>
        );
      })}
    </>
  );
}

// Remonta o estado ao trocar de Power: um formulário em edição nunca
// passa a salvar silenciosamente em outra habilidade.
export default function PowerCombatEffectsPanel({
  idPower,
}: {
  idPower: number;
}) {
  return <EffectsEditor key={idPower} idPower={idPower} />;
}

function EffectsEditor({ idPower }: { idPower: number }) {
  const [catalog, setCatalog] = useState<CombatEffectCatalogApi | null>(null);
  const [effects, setEffects] = useState<PowerCombatEffectApi[]>([]);
  const [draft, setDraft] = useState<CombatEffectDraft | null>(null);
  const [editing, setEditing] = useState<PowerCombatEffectApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0);
  const groupList = useId();
  const editorRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      catalogoCombatEffectsAdmin(),
      listarCombatEffectsPowerAdmin(idPower),
    ])
      .then(([catalog, effects]) => {
        if (cancelled) return;
        setCatalog(catalog);
        setEffects(effects);
        setDraft(effectToDraft(catalog));
        setError("");
      })
      .catch((error) => {
        if (!cancelled)
          setError(
            mensagemDeErroAdmin(
              error,
              "Não foi possível carregar os efeitos de combate.",
            ),
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [idPower, retry]);

  function update<K extends keyof CombatEffectValues>(
    key: K,
    value: CombatEffectValues[K],
  ) {
    setDraft(
      (current) =>
        current && { ...current, values: { ...current.values, [key]: value } },
    );
  }
  function edit(effect: PowerCombatEffectApi) {
    if (!catalog) return;
    setEditing(effect);
    setDraft(effectToDraft(catalog, effect));
    setError("");
    setNotice("");
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function reset() {
    if (catalog) setDraft(effectToDraft(catalog));
    setEditing(null);
    setError("");
  }
  async function refresh() {
    const [newCatalog, newEffects] = await Promise.all([
      catalogoCombatEffectsAdmin(),
      listarCombatEffectsPowerAdmin(idPower),
    ]);
    setCatalog(newCatalog);
    setEffects(newEffects);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft || !catalog || busy) return;
    setError("");
    setNotice("");
    try {
      const payload = draftPayload(draft, catalog);
      const patch = editing ? changedPayload(payload, editing, catalog) : null;
      if (patch && Object.keys(patch).length === 0) {
        setNotice("Nenhum campo foi alterado.");
        return;
      }
      setBusy(true);
      if (editing && patch)
        await atualizarCombatEffectPowerAdmin(editing.id, patch);
      else await adicionarCombatEffectPowerAdmin(idPower, payload);
      reset();
      setNotice("Efeito salvo.");
      await refresh();
    } catch (error) {
      setError(
        mensagemDeErroAdmin(
          error,
          "Não foi possível salvar o efeito de combate.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  async function toggle(effect: PowerCombatEffectApi) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await atualizarCombatEffectPowerAdmin(effect.id, {
        ativo: !effect.ativo,
      });
      if (editing?.id === effect.id) reset();
      await refresh();
    } catch (error) {
      setError(
        mensagemDeErroAdmin(error, "Não foi possível atualizar o efeito."),
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove(effect: PowerCombatEffectApi) {
    if (
      !window.confirm(
        "Remover este efeito de combate? Esta ação não pode ser desfeita.",
      )
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await removerCombatEffectPowerAdmin(effect.id);
      if (editing?.id === effect.id) reset();
      await refresh();
    } catch (error) {
      setError(
        mensagemDeErroAdmin(error, "Não foi possível remover o efeito."),
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading)
    return (
      <p className="text-xs text-white/50">Carregando efeitos de combate...</p>
    );
  if (!catalog || !draft)
    return (
      <div role="alert" className="text-sm text-red-300">
        <p>{error || "Catálogo indisponível."}</p>
        <button
          type="button"
          className={BUTTON}
          onClick={() => setRetry((value) => value + 1)}
        >
          Tentar novamente
        </button>
      </div>
    );

  const values = draft.values;
  const metadata = catalog.effectKeys.find(
    (effect) => effect.key === values.effect_key,
  );
  const unit = magnitudeUnit(catalog, values.effect_key);
  const condition = catalog.conditions.find(
    (condition) => condition.key === values.condition_key,
  );
  const runtime = engineSupport(
    {
      ...values,
      chance_ppm: Number(draft.chancePercent) * 10_000,
      duration_turns: draft.durationTurns ? Number(draft.durationTurns) : null,
    },
    catalog,
  );
  let chancePpm: number | null = null;
  try {
    chancePpm = percentToPpm(draft.chancePercent);
  } catch {
    /* validação exibida ao salvar */
  }
  const preview = previewEffect(
    {
      ...values,
      chance_ppm: chancePpm ?? values.chance_ppm,
      duration_turns: draft.durationTurns ? Number(draft.durationTurns) : null,
    },
    catalog,
  );

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-white/10 bg-black/10 p-4">
      <div>
        <h3 className="text-sm font-bold text-[#F3B43F]">Efeitos de combate</h3>
        <p className="mt-1 text-xs text-white/50">
          Buffs, debuffs e efeitos da habilidade. Os valores e opções vêm do
          catálogo do servidor.
        </p>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-300"
        >
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-xs text-emerald-300">
          {notice}
        </p>
      )}
      <div className="grid gap-3 lg:grid-cols-2">
        {effects.map((effect) => {
          const support = engineSupport(effect, catalog);
          return (
            <article
              key={effect.id}
              className={`flex flex-col gap-3 rounded-xl border p-4 ${effect.ativo ? "border-white/15 bg-black/25" : "border-white/5 bg-black/10 text-white/50"}`}
            >
              <div>
                <h4 className="font-semibold">
                  {effectTitle(effect, catalog)}
                </h4>
                <p className="mt-1 text-xs text-white/60">
                  {effect.target} • {effect.trigger}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 px-2 py-1 text-[10px]">
                  {effect.trigger === "PASSIVE" ? "PASSIVO" : "REATIVO"}
                </span>
                <Badge support={support.support} />
                {!effect.ativo && <span className="text-xs">Desativado</span>}
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-white/40">Grupo</dt>
                  <dd className="break-words">
                    {effect.stack_group || "Sem grupo (soma livre)"}
                  </dd>
                </div>
                <div>
                  <dt className="text-white/40">Política</dt>
                  <dd>
                    {effect.reapply_policy}
                    {effect.reapply_policy === "STACK"
                      ? ` · máx. ${effect.max_stacks ?? "não definido"}`
                      : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-white/40">Chance</dt>
                  <dd>{formatNumber(ppmToPercent(effect.chance_ppm))}%</dd>
                </div>
                <div>
                  <dt className="text-white/40">Duração</dt>
                  <dd>
                    {effect.trigger === "PASSIVE"
                      ? "Permanente"
                      : effect.duration_turns == null
                        ? "Não definida"
                        : `${effect.duration_turns} turno(s)`}
                    {effect.trigger === "PASSIVE" &&
                    effect.duration_turns != null
                      ? ` · ${effect.duration_turns} turno(s) salvo(s), sem expiração`
                      : ""}
                  </dd>
                </div>
              </dl>
              <p className="text-xs leading-relaxed text-white/70">
                {previewEffect(effect, catalog)}
              </p>
              <p className="text-[11px] text-white/45">
                {catalog.contexts
                  .filter(
                    (context) =>
                      effect[context.field as keyof PowerCombatEffectApi] !==
                      false,
                  )
                  .map((context) => context.rotulo)
                  .join(" • ") || "Nenhum contexto permitido"}
              </p>
              {support.warnings.length > 0 && (
                <details className="text-xs text-amber-200">
                  <summary className="cursor-pointer">
                    Limitações do motor ({support.warnings.length})
                  </summary>
                  <ul className="mt-2 list-disc space-y-1 pl-4">
                    {support.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </details>
              )}
              <div className="mt-auto flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => edit(effect)}
                  className={BUTTON}
                >
                  Editar
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => toggle(effect)}
                  className={BUTTON}
                >
                  {effect.ativo ? "Desativar" : "Ativar"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(effect)}
                  className={`${BUTTON} text-red-300`}
                >
                  Remover
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {!effects.length && (
        <p className="text-xs text-white/50">
          Esta habilidade ainda não tem efeitos de combate.
        </p>
      )}
      <datalist id={groupList}>
        {(catalog.stackGroups ?? []).map((group) => (
          <option key={group} value={group} />
        ))}
      </datalist>
      <form
        ref={editorRef}
        onSubmit={save}
        className="flex scroll-mt-6 flex-col gap-4"
      >
        <h4 className="text-sm font-semibold">
          {editing ? `Editar efeito #${editing.id}` : "Adicionar efeito"}
        </h4>
        <fieldset disabled={busy} className="flex min-w-0 flex-col gap-4">
          <Block title="Efeito">
            <Field label="Tipo de efeito">
              <select
                className={INPUT}
                value={values.effect_key}
                onChange={(event) =>
                  setDraft(
                    (current) =>
                      current && {
                        ...current,
                        values: {
                          ...current.values,
                          effect_key: event.target.value,
                          config: {},
                          magnitude_base: 0,
                          scale_attribute: null,
                          scale_value: 0,
                        },
                      },
                  )
                }
              >
                {!metadata && (
                  <option value={values.effect_key}>
                    {values.effect_key} (legado)
                  </option>
                )}
                {catalog.effectKeys.map((effect) => (
                  <option key={effect.key} value={effect.key}>
                    {effect.label} · {effect.key}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Alvo"
              help={catalog.targetDescriptions[values.target]}
            >
              <select
                className={INPUT}
                value={values.target}
                onChange={(event) => update("target", event.target.value)}
              >
                {catalog.targets.map((target) => (
                  <option key={target} value={target}>
                    {target} — {catalog.targetDescriptions[target]}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Gatilho"
              help={
                catalog.triggers.find(
                  (trigger) => trigger.key === values.trigger,
                )?.descricao
              }
            >
              <select
                className={INPUT}
                value={values.trigger}
                onChange={(event) => update("trigger", event.target.value)}
              >
                {catalog.triggers.map((trigger) => (
                  <option key={trigger.key} value={trigger.key}>
                    {trigger.key} — {trigger.support.label}
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={values.ativo}
                onChange={(event) => update("ativo", event.target.checked)}
              />
              Efeito ativo
            </label>
            {metadata && (
              <SchemaFields
                fields={metadata.configFields}
                config={values.config}
                onChange={(config) => update("config", config)}
                catalog={catalog}
                groupList={groupList}
              />
            )}
          </Block>
          <Block title="Valor">
            {unit ? (
              <>
                <Field
                  label={`Magnitude base (${unit})`}
                  help={
                    unit === "%"
                      ? "15 = +15%; −12 = −12%. Digite o percentual inteiro, não 0,15 ou ppm."
                      : `Valor em ${unit}. Positivo aumenta; negativo reduz (consulte a prévia e o suporte).`
                  }
                >
                  <input
                    className={INPUT}
                    type="number"
                    step="any"
                    required
                    value={
                      Number.isFinite(values.magnitude_base)
                        ? values.magnitude_base
                        : ""
                    }
                    onChange={(event) =>
                      update(
                        "magnitude_base",
                        event.target.value === ""
                          ? NaN
                          : Number(event.target.value),
                      )
                    }
                  />
                </Field>
                <Field label="Escala por atributo">
                  <select
                    className={INPUT}
                    value={values.scale_attribute ?? ""}
                    onChange={(event) =>
                      update(
                        "scale_attribute",
                        (event.target.value ||
                          null) as CombatEffectValues["scale_attribute"],
                      )
                    }
                  >
                    <option value="">Sem escala</option>
                    {catalog.scaleAttributes.map((attribute) => (
                      <option key={attribute} value={attribute}>
                        {attribute}
                      </option>
                    ))}
                  </select>
                </Field>
                {values.scale_attribute && (
                  <Field label={`Valor por ponto (${unit})`}>
                    <input
                      className={INPUT}
                      type="number"
                      step="any"
                      required
                      value={
                        Number.isFinite(values.scale_value)
                          ? values.scale_value
                          : ""
                      }
                      onChange={(event) =>
                        update(
                          "scale_value",
                          event.target.value === ""
                            ? NaN
                            : Number(event.target.value),
                        )
                      }
                    />
                  </Field>
                )}
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={values.scale_with_ability_level}
                    onChange={(event) =>
                      update("scale_with_ability_level", event.target.checked)
                    }
                  />
                  Escala com nível da habilidade
                </label>
              </>
            ) : (
              <p className="text-xs text-white/60 sm:col-span-2">
                Este efeito não usa magnitude. Configure os parâmetros no bloco
                Efeito.
              </p>
            )}
          </Block>
          <Block title="Aplicação">
            <Field
              label="Chance (%)"
              help={
                chancePpm == null
                  ? "Informe entre 0,0001% e 100%."
                  : `${formatNumber(chancePpm)} ppm — convertido automaticamente.`
              }
            >
              <input
                className={INPUT}
                type="number"
                min="0.0001"
                max="100"
                step="0.0001"
                required
                value={draft.chancePercent}
                onChange={(event) =>
                  setDraft(
                    (current) =>
                      current && {
                        ...current,
                        chancePercent: event.target.value,
                      },
                  )
                }
              />
            </Field>
            <Field
              label="Duração (turnos)"
              help={
                values.trigger === "PASSIVE"
                  ? "Efeito permanente enquanto a Power estiver válida; duração normalmente não se aplica."
                  : "Opcional, mínimo 1. A duração salva depende do suporte temporal do motor."
              }
            >
              <input
                className={`${INPUT} ${values.trigger !== "PASSIVE" ? "border-amber-400/60" : ""}`}
                type="number"
                min="1"
                step="1"
                placeholder="Sem duração definida"
                value={draft.durationTurns}
                onChange={(event) =>
                  setDraft(
                    (current) =>
                      current && {
                        ...current,
                        durationTurns: event.target.value,
                      },
                  )
                }
              />
            </Field>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={values.dispellable}
                onChange={(event) =>
                  update("dispellable", event.target.checked)
                }
              />
              Dissipável{" "}
              <span className="text-white/40">
                (a execução depende do motor)
              </span>
            </label>
          </Block>
          <Block title="Stack / Reaplicação">
            <Field
              label="Grupo de Stack / Família do efeito"
              help="Efeitos com o mesmo effect_key + grupo interagem pela política de reaplicação. Exemplos: OFFENSE_DAMAGE, DEFENSE_FLAT_BUFF, DEBUFF_ARMOR, PASSIVE_CRIT. Sem grupo, as magnitudes somam livremente."
            >
              <input
                className={INPUT}
                maxLength={60}
                list={groupList}
                value={values.stack_group ?? ""}
                placeholder="Selecione um grupo existente ou crie o seu"
                onChange={(event) =>
                  update("stack_group", event.target.value || null)
                }
              />
            </Field>
            <Field
              label="Política de reaplicação"
              help={catalog.reapplyPolicyDescriptions[values.reapply_policy]}
            >
              <select
                className={INPUT}
                value={values.reapply_policy}
                onChange={(event) =>
                  update("reapply_policy", event.target.value)
                }
              >
                {catalog.reapplyPolicies.map((policy) => (
                  <option key={policy} value={policy}>
                    {policy} — {catalog.reapplyPolicyDescriptions[policy]}
                  </option>
                ))}
              </select>
            </Field>
            {values.reapply_policy === "STACK" && (
              <Field label="Máximo de stacks" help="Obrigatório para STACK.">
                <input
                  className={INPUT}
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={draft.maxStacks}
                  onChange={(event) =>
                    setDraft(
                      (current) =>
                        current && {
                          ...current,
                          maxStacks: event.target.value,
                        },
                    )
                  }
                />
              </Field>
            )}
          </Block>
          <Block title="Condição">
            <Field label="Aplicar quando" help={condition?.descricao}>
              <select
                className={INPUT}
                value={values.condition_key ?? ""}
                onChange={(event) =>
                  setDraft(
                    (current) =>
                      current && {
                        ...current,
                        values: {
                          ...current.values,
                          condition_key: event.target.value || null,
                          condition_config: {},
                        },
                      },
                  )
                }
              >
                <option value="">Sem condição</option>
                {catalog.conditions.map((condition) => (
                  <option key={condition.key} value={condition.key}>
                    {condition.fields[0]?.label ?? condition.key} ·{" "}
                    {condition.key}
                  </option>
                ))}
              </select>
            </Field>
            {condition && (
              <SchemaFields
                fields={condition.fields}
                config={values.condition_config}
                onChange={(config) => update("condition_config", config)}
                catalog={catalog}
                groupList={groupList}
              />
            )}
          </Block>
          <Block title="Onde este efeito funciona">
            {catalog.contexts.map((context) => (
              <label
                key={context.key}
                className="flex items-center gap-2 text-xs"
              >
                <input
                  type="checkbox"
                  checked={values[context.field] !== false}
                  onChange={(event) =>
                    update(context.field, event.target.checked)
                  }
                />
                {context.rotulo}
              </label>
            ))}
            <p className="text-[11px] text-white/50 sm:col-span-2">
              Permissão de contexto não garante execução: confira o suporte do
              motor abaixo.
            </p>
          </Block>
          <div
            aria-live="polite"
            className="rounded-xl border border-[#F3B43F]/30 bg-[#F3B43F]/5 p-4"
          >
            <h5 className="text-sm font-semibold text-[#F3B43F]">
              Prévia da configuração
            </h5>
            <p className="mt-2 text-sm leading-relaxed">{preview}</p>
            <div className="mt-3">
              <Badge support={runtime.support} />
            </div>
            {runtime.warnings.length > 0 && (
              <div
                role={
                  runtime.support.status === "UNSUPPORTED" ? "alert" : undefined
                }
                className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-100"
              >
                <strong>Confira antes de salvar</strong>
                <ul className="mt-2 list-disc space-y-2 pl-4">
                  {runtime.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-3 text-[11px] leading-relaxed text-white/45">
              A prévia descreve a intenção configurada; os avisos indicam as
              limitações atuais. {catalog.engineNotes.scope}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50"
            >
              {busy
                ? "Salvando..."
                : editing
                  ? "Salvar alterações"
                  : "+ Adicionar efeito"}
            </button>
            {editing && (
              <button type="button" className={BUTTON} onClick={reset}>
                Cancelar edição
              </button>
            )}
          </div>
        </fieldset>
      </form>
    </section>
  );
}
