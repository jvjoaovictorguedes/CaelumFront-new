import type {
  CombatEffectCatalogApi,
  CombatEffectFieldApi,
  CombatEffectSupportApi,
  PayloadCombatEffectAdmin,
  PowerCombatEffectApi,
} from "@/lib/api/admin";

export type CombatEffectValues = Required<PayloadCombatEffectAdmin>;
export type CombatEffectDraft = {
  values: CombatEffectValues;
  chancePercent: string;
  durationTurns: string;
  maxStacks: string;
};

const NUMBER_FORMAT = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 4,
});
export const formatNumber = (value: number) => NUMBER_FORMAT.format(value);

export function percentToPpm(percent: string | number): number {
  const value =
    typeof percent === "string" && !percent.trim() ? NaN : Number(percent);
  const ppm = Math.round(value * 10_000);
  if (!Number.isFinite(value) || value < 0.0001 || value > 100 || ppm < 1) {
    throw new Error(
      "Chance deve ser maior que 0% e no máximo 100% (mínimo 0,0001%).",
    );
  }
  return ppm;
}

export function ppmToPercent(ppm: number): number {
  return ppm / 10_000;
}

export function effectToDraft(
  catalog: CombatEffectCatalogApi,
  effect?: PowerCombatEffectApi,
): CombatEffectDraft {
  const defaults: CombatEffectValues = {
    effect_key: catalog.effectKeys[0]?.key ?? "",
    target: "SELF",
    trigger: "PASSIVE",
    magnitude_base: 0,
    scale_attribute: null,
    scale_value: 0,
    scale_with_ability_level: false,
    chance_ppm: 1_000_000,
    duration_turns: null,
    stack_group: null,
    reapply_policy: "STRONGEST",
    max_stacks: null,
    condition_key: null,
    condition_config: {},
    dispellable: true,
    config: {},
    allow_pve: true,
    allow_party: true,
    allow_guild_boss: true,
    allow_world_boss: true,
    allow_pvp_casual: true,
    allow_ranked: true,
    allow_tournament: true,
    ativo: true,
  };
  // Só campos editáveis entram no payload; configs desconhecidas/legadas
  // são copiadas integralmente, nunca reduzidas ao schema exibido.
  const values = { ...defaults };
  if (effect) {
    for (const key of Object.keys(defaults) as (keyof CombatEffectValues)[]) {
      if (effect[key] !== undefined)
        Object.assign(values, { [key]: effect[key] });
    }
  }
  values.config = structuredClone(values.config ?? {});
  values.condition_config = structuredClone(values.condition_config ?? {});
  return {
    values,
    chancePercent: String(ppmToPercent(values.chance_ppm)),
    durationTurns:
      values.duration_turns == null ? "" : String(values.duration_turns),
    maxStacks: values.max_stacks == null ? "" : String(values.max_stacks),
  };
}

function optionalTurns(value: string, label: string): number | null {
  if (!value.trim()) return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1)
    throw new Error(`${label} deve ser um inteiro de pelo menos 1.`);
  return number;
}

export function fieldOptions(
  field: CombatEffectFieldApi,
  catalog: CombatEffectCatalogApi,
) {
  if (field.optionsSource === "statusKeys") return catalog.statusKeys;
  if (field.optionsSource === "stackGroups")
    return (catalog.stackGroups ?? []).map((value) => ({
      value,
      label: value,
    }));
  return field.options ?? [];
}

function validateFields(
  fields: CombatEffectFieldApi[],
  config: Record<string, unknown>,
  catalog: CombatEffectCatalogApi,
) {
  for (const field of fields) {
    const value = config[field.key];
    if (field.required && (value == null || value === ""))
      throw new Error(`Preencha ${field.label}.`);
    if (value == null || value === "") continue;
    if (
      field.type === "number" &&
      (typeof value !== "number" ||
        !Number.isFinite(value) ||
        (field.min != null && value < field.min) ||
        (field.max != null && value > field.max))
    ) {
      throw new Error(`${field.label}: valor fora do intervalo permitido.`);
    }
    if (
      field.type === "select" &&
      !fieldOptions(field, catalog).some((option) => option.value === value)
    )
      throw new Error(`Selecione um valor válido para ${field.label}.`);
    if (
      field.type === "text" &&
      (typeof value !== "string" ||
        !value.trim() ||
        (field.maxLength != null && value.length > field.maxLength))
    )
      throw new Error(`Preencha ${field.label} com texto válido.`);
  }
}

export function draftPayload(
  draft: CombatEffectDraft,
  catalog: CombatEffectCatalogApi,
): CombatEffectValues {
  const values = {
    ...draft.values,
    chance_ppm: percentToPpm(draft.chancePercent),
    duration_turns: optionalTurns(draft.durationTurns, "Duração"),
    max_stacks: optionalTurns(draft.maxStacks, "Máximo de stacks"),
  };
  const metadata = catalog.effectKeys.find(
    (effect) => effect.key === values.effect_key,
  );
  if (!metadata) throw new Error("Selecione um tipo de efeito válido.");
  if (
    !catalog.targets.includes(values.target) ||
    !catalog.triggers.some((trigger) => trigger.key === values.trigger) ||
    !catalog.reapplyPolicies.includes(values.reapply_policy)
  )
    throw new Error(
      "Alvo, gatilho ou política não pertence ao catálogo atual.",
    );
  if (
    !Number.isFinite(values.magnitude_base) ||
    !Number.isFinite(values.scale_value)
  )
    throw new Error("Magnitude e escala precisam ser números válidos.");
  if (values.reapply_policy === "STACK" && values.max_stacks == null)
    throw new Error("STACK exige Máximo de stacks.");
  if ((values.stack_group?.length ?? 0) > 60)
    throw new Error("Grupo de stack aceita até 60 caracteres.");
  validateFields(metadata.configFields, values.config, catalog);
  if (values.condition_key) {
    const condition = catalog.conditions.find(
      (condition) => condition.key === values.condition_key,
    );
    if (!condition) throw new Error("Selecione uma condição válida.");
    validateFields(condition.fields, values.condition_config, catalog);
  }
  return values;
}

export function changedPayload(
  values: CombatEffectValues,
  original: PowerCombatEffectApi,
  catalog: CombatEffectCatalogApi,
): Partial<PayloadCombatEffectAdmin> {
  const baseline = effectToDraft(catalog, original).values;
  return Object.fromEntries(
    (Object.keys(values) as (keyof CombatEffectValues)[])
      .filter(
        (key) => JSON.stringify(values[key]) !== JSON.stringify(baseline[key]),
      )
      .map((key) => [key, values[key]]),
  );
}

export function magnitudeUnit(
  catalog: CombatEffectCatalogApi,
  effectKey: string,
): string | null {
  const unit = catalog.effectKeys.find(
    (effect) => effect.key === effectKey,
  )?.unidade;
  return unit === "PERCENTUAL"
    ? "%"
    : unit === "FLAT"
      ? "pontos"
      : unit === "TURNOS"
        ? "turnos"
        : null;
}

export function effectTitle(
  values: PayloadCombatEffectAdmin,
  catalog: CombatEffectCatalogApi,
): string {
  const meta = catalog.effectKeys.find(
    (effect) => effect.key === values.effect_key,
  );
  const unit = magnitudeUnit(catalog, values.effect_key);
  const label = (meta?.label ?? values.effect_key).replace(/\s*\([^)]*\)$/, "");
  if (!unit) return label;
  const magnitude = values.magnitude_base ?? 0;
  return `${label} ${magnitude > 0 ? "+" : ""}${formatNumber(magnitude)}${unit === "%" ? "%" : ` ${unit}`}`;
}

export function previewEffect(
  values: PayloadCombatEffectAdmin,
  catalog: CombatEffectCatalogApi,
): string {
  const metadata = catalog.effectKeys.find(
    (effect) => effect.key === values.effect_key,
  );
  if (!metadata) return "Selecione um efeito para visualizar a configuração.";
  const magnitude = values.magnitude_base ?? 0;
  const trigger = catalog.triggers.find(
    (trigger) => trigger.key === values.trigger,
  );
  const status = catalog.statusKeys.find(
    (status) => status.value === values.config?.status_key,
  );
  const categoryField = metadata.configFields.find(
    (field) => field.key === "category",
  );
  const category =
    categoryField &&
    fieldOptions(categoryField, catalog).find(
      (option) => option.value === values.config?.category,
    );
  const replacements: Record<string, string> = {
    subject: catalog.targetSubjects[values.target ?? "SELF"] ?? "o alvo",
    value: formatNumber(Math.abs(magnitude)),
    signedValue: formatNumber(magnitude),
    direction: magnitude < 0 ? "menos" : "mais",
    status:
      status?.label ??
      String(values.config?.status_key || "(selecione um Status)"),
    category:
      category?.label ??
      String(values.config?.category || "(selecione uma categoria)"),
  };
  const sentence = metadata.previewTemplate.replace(
    /\{(\w+)\}/g,
    (_, key: string) => replacements[key] ?? "",
  );
  let result = `${trigger?.previewPrefix ?? "No gatilho configurado"}, ${sentence}`;
  if (values.trigger !== "PASSIVE" && values.duration_turns != null)
    result += ` por ${values.duration_turns} ${values.duration_turns === 1 ? "turno" : "turnos"}`;
  if (values.chance_ppm != null && values.chance_ppm < 1_000_000)
    result += ` (chance de ${formatNumber(ppmToPercent(values.chance_ppm))}%)`;
  result += ".";
  if (values.scale_attribute)
    result += ` Valor base; soma ${formatNumber(values.scale_value ?? 0)} por ponto de ${values.scale_attribute}.`;
  if (values.scale_with_ability_level)
    result += " Escala com o nível da habilidade.";
  if (values.condition_key) {
    const condition = catalog.conditions.find(
      (condition) => condition.key === values.condition_key,
    );
    result += ` Condição: ${condition?.fields.map((field) => `${field.label}: ${String(values.condition_config?.[field.key] ?? "não preenchido")}`).join("; ") ?? values.condition_key}.`;
  }
  return result;
}

export function engineSupport(
  values: PayloadCombatEffectAdmin,
  catalog: CombatEffectCatalogApi,
): { support: CombatEffectSupportApi; warnings: string[] } {
  const metadata = catalog.effectKeys.find(
    (effect) => effect.key === values.effect_key,
  );
  let support = metadata?.supportByTrigger[values.trigger ?? "PASSIVE"] ?? {
    status: "UNSUPPORTED" as const,
    label: "Suporte não informado pelo backend",
  };
  const warnings: string[] = [];
  if (support.status !== "FUNCTIONAL" && support.description)
    warnings.push(support.description);
  if (values.target && values.target !== "SELF")
    warnings.push(catalog.engineNotes.target);
  if (values.condition_key) warnings.push(catalog.engineNotes.condition);
  if (
    values.trigger === "PASSIVE" &&
    (values.chance_ppm ?? 1_000_000) < 1_000_000
  ) {
    warnings.push(catalog.engineNotes.passiveChance);
    support = { status: "UNSUPPORTED", label: "Ignorado pelo motor" };
  }
  if (values.duration_turns != null)
    warnings.push(catalog.engineNotes.duration);
  if (
    values.trigger === "PASSIVE" &&
    values.stack_group &&
    values.reapply_policy !== "STACK" &&
    values.reapply_policy !== "STRONGEST"
  )
    warnings.push(catalog.engineNotes.passivePolicy);
  if (!values.stack_group) warnings.push(catalog.engineNotes.noGroup);
  if (
    support.status === "FUNCTIONAL" &&
    (values.target !== "SELF" ||
      values.condition_key ||
      values.duration_turns != null)
  )
    support = {
      status: "PARTIAL",
      label: "Suporte parcial",
      description: support.description,
    };
  return { support, warnings: warnings.filter(Boolean) };
}
