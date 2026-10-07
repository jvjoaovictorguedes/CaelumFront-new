import test from "node:test";
import assert from "node:assert/strict";
import {
  changedPayload,
  draftPayload,
  effectTitle,
  effectToDraft,
  engineSupport,
  magnitudeUnit,
  percentToPpm,
  ppmToPercent,
  previewEffect,
} from "../src/app/dashboard/admin/powers/combatEffectEditor.ts";

const functional = { status: "FUNCTIONAL", label: "Funcional" };
const unsupported = {
  status: "UNSUPPORTED",
  label: "Ainda não executado pelo motor",
  description:
    "Esta combinação é válida no catálogo, mas não é executada pelo motor atualmente.",
};
const effect = (key, label, unidade, previewTemplate, configFields = []) => ({
  key,
  label,
  unidade,
  previewTemplate,
  configFields,
  supportByTrigger: {
    PASSIVE: functional,
    ON_CAST: unsupported,
    ON_HIT: unsupported,
  },
});
const catalog = {
  effectKeys: [
    effect(
      "DAMAGE_DEALT_PCT",
      "Dano causado (%)",
      "PERCENTUAL",
      "{subject} causa {value}% {direction} dano",
    ),
    effect(
      "DAMAGE_TAKEN_PCT",
      "Dano recebido (%)",
      "PERCENTUAL",
      "{subject} recebe {value}% {direction} dano",
    ),
    effect(
      "DEFENSE_FLAT",
      "Defesa (pontos)",
      "FLAT",
      "{subject} tem {value} pontos a {direction} de defesa",
    ),
    effect(
      "COOLDOWN_REDUCTION_TURNS",
      "Redução de cooldown (turnos)",
      "TURNOS",
      "{subject} reduz o cooldown em {signedValue} turnos",
    ),
    effect(
      "CLEANSE_STATUS",
      "Remove Status específico",
      "SEM_MAGNITUDE",
      "{subject} remove o Status {status}",
      [
        {
          key: "status_key",
          label: "Status a remover",
          type: "select",
          optionsSource: "statusKeys",
          required: true,
        },
      ],
    ),
    effect(
      "CLEANSE_CATEGORY",
      "Remove categoria de Status",
      "SEM_MAGNITUDE",
      "{subject} remove Status da categoria {category}",
      [
        {
          key: "category",
          label: "Categoria",
          type: "select",
          required: true,
          options: [
            { value: "DOT", label: "Dano periódico (DoT)" },
            { value: "CONTROLE", label: "Controle" },
          ],
        },
      ],
    ),
  ],
  targets: ["SELF", "ENEMY", "ALL_ALLIES", "ALL_ENEMIES"],
  targetDescriptions: {
    SELF: "Quem possui/usa a habilidade",
    ENEMY: "Alvo inimigo",
  },
  targetSubjects: {
    SELF: "o personagem",
    ENEMY: "o inimigo",
    ALL_ALLIES: "cada aliado",
    ALL_ENEMIES: "cada inimigo",
  },
  triggers: [
    {
      key: "PASSIVE",
      descricao: "Sempre ativo",
      previewPrefix: "Enquanto esta habilidade estiver válida",
      support: functional,
    },
    {
      key: "ON_CAST",
      descricao: "Ao lançar",
      previewPrefix: "Ao lançar a habilidade",
      support: unsupported,
    },
    {
      key: "ON_HIT",
      descricao: "Ao acertar",
      previewPrefix: "Ao acertar um ataque",
      support: unsupported,
    },
  ],
  reapplyPolicies: ["STRONGEST", "STACK", "REFRESH"],
  reapplyPolicyDescriptions: {},
  conditions: [
    {
      key: "TARGET_HP_BELOW_PCT",
      campos: ["limite_pct"],
      descricao: "HP do alvo",
      fields: [
        {
          key: "limite_pct",
          label: "HP do alvo abaixo de (%)",
          type: "number",
          min: 0,
          max: 100,
          required: true,
        },
      ],
    },
    {
      key: "SELF_HAS_STATUS",
      campos: ["status_key"],
      descricao: "Status próprio",
      fields: [
        {
          key: "status_key",
          label: "Status próprio",
          type: "select",
          optionsSource: "statusKeys",
          required: true,
        },
      ],
    },
  ],
  contexts: [
    "pve",
    "party",
    "guild_boss",
    "world_boss",
    "pvp_casual",
    "ranked",
    "tournament",
  ].map((key) => ({
    key: key.toUpperCase(),
    rotulo: key,
    field: "allow_" + key,
  })),
  statusKeys: [{ value: "BURN", label: "Queimadura" }],
  scaleAttributes: ["Forca"],
  stackGroups: ["OFFENSE_DAMAGE"],
  engineNotes: {
    target: "Alvo não resolvido.",
    condition: "Condição não avaliada.",
    passiveChance: "PASSIVE com chance abaixo de 100% é ignorado.",
    duration: "Sem expiração geral.",
    passivePolicy: "Políticas convergem para maior magnitude.",
    noGroup: "Sem grupo, soma livre.",
  },
};

test("conversão % ↔ ppm, precisão e limites", () => {
  for (const [percent, ppm] of [
    [100, 1000000],
    [50, 500000],
    [20, 200000],
    [33.3333, 333333],
    [0.0001, 1],
  ]) {
    assert.equal(percentToPpm(percent), ppm);
    assert.equal(ppmToPercent(ppm), percent);
  }
  for (const invalid of ["", "NaN", NaN, Infinity, -1, 0, 0.00009, 100.0001])
    assert.throws(() => percentToPpm(invalid), /Chance/);
});

test("duração opcional, inteira e >= 1", () => {
  const draft = effectToDraft(catalog);
  assert.equal(draftPayload(draft, catalog).duration_turns, null);
  draft.durationTurns = "2";
  assert.equal(draftPayload(draft, catalog).duration_turns, 2);
  for (const value of ["0", "-1", "1.5", "abc"]) {
    draft.durationTurns = value;
    assert.throws(() => draftPayload(draft, catalog), /Duração/);
  }
});

test("STACK exige máximo válido; trocar política não apaga máximo legado", () => {
  const draft = effectToDraft(catalog);
  draft.values.reapply_policy = "STACK";
  assert.throws(() => draftPayload(draft, catalog), /STACK exige/);
  draft.maxStacks = "3";
  assert.equal(draftPayload(draft, catalog).max_stacks, 3);
  draft.values.reapply_policy = "STRONGEST";
  assert.equal(draftPayload(draft, catalog).max_stacks, 3);
  draft.maxStacks = "0";
  assert.throws(() => draftPayload(draft, catalog), /Máximo de stacks/);
});

test("unidades canônicas e efeitos sem magnitude", () => {
  for (const [key, unit] of [
    ["DAMAGE_DEALT_PCT", "%"],
    ["DEFENSE_FLAT", "pontos"],
    ["COOLDOWN_REDUCTION_TURNS", "turnos"],
    ["CLEANSE_STATUS", null],
    ["CLEANSE_CATEGORY", null],
  ])
    assert.equal(magnitudeUnit(catalog, key), unit);
  assert.equal(
    effectTitle({ effect_key: "DAMAGE_DEALT_PCT", magnitude_base: 8 }, catalog),
    "Dano causado +8%",
  );
  assert.equal(
    effectTitle({ effect_key: "CLEANSE_STATUS", magnitude_base: 123 }, catalog),
    "Remove Status específico",
  );
});

test("prévia explica sinal, alvo, gatilho e duração", () => {
  const base = {
    effect_key: "DAMAGE_DEALT_PCT",
    target: "SELF",
    trigger: "PASSIVE",
    magnitude_base: 8,
  };
  assert.equal(
    previewEffect(base, catalog),
    "Enquanto esta habilidade estiver válida, o personagem causa 8% mais dano.",
  );
  assert.equal(
    previewEffect(
      {
        ...base,
        effect_key: "DAMAGE_TAKEN_PCT",
        target: "ENEMY",
        trigger: "ON_CAST",
        magnitude_base: 12,
        duration_turns: 2,
      },
      catalog,
    ),
    "Ao lançar a habilidade, o inimigo recebe 12% mais dano por 2 turnos.",
  );
  assert.match(
    previewEffect({ ...base, target: "ENEMY", magnitude_base: -12 }, catalog),
    /o inimigo causa 12% menos dano/,
  );
  assert.match(
    previewEffect(
      { ...base, effect_key: "DAMAGE_TAKEN_PCT", magnitude_base: -12 },
      catalog,
    ),
    /o personagem recebe 12% menos dano/,
  );
  assert.doesNotMatch(
    previewEffect({ ...base, duration_turns: 2 }, catalog),
    /por 2 turnos/,
  );
});

test("combinações não suportadas e limitações reais nunca parecem funcionais", () => {
  const base = {
    effect_key: "DAMAGE_DEALT_PCT",
    target: "SELF",
    trigger: "PASSIVE",
    chance_ppm: 1000000,
    stack_group: "OFFENSE_DAMAGE",
  };
  assert.equal(engineSupport(base, catalog).support.status, "FUNCTIONAL");
  for (const trigger of ["ON_CAST", "ON_HIT"]) {
    const result = engineSupport({ ...base, trigger }, catalog);
    assert.equal(result.support.status, "UNSUPPORTED");
    assert.match(result.warnings[0], /não é executada/);
  }
  assert.equal(
    engineSupport({ ...base, chance_ppm: 200000 }, catalog).support.status,
    "UNSUPPORTED",
  );
  assert.equal(
    engineSupport({ ...base, target: "ENEMY" }, catalog).support.status,
    "PARTIAL",
  );
  assert.ok(
    engineSupport(
      { ...base, condition_key: "TARGET_HP_BELOW_PCT" },
      catalog,
    ).warnings.includes(catalog.engineNotes.condition),
  );
});

test("condition_config é construído com o schema real, sem thresholdPct", () => {
  const draft = effectToDraft(catalog);
  draft.values.condition_key = "TARGET_HP_BELOW_PCT";
  draft.values.condition_config = { limite_pct: 40 };
  assert.deepEqual(draftPayload(draft, catalog).condition_config, {
    limite_pct: 40,
  });
  draft.values.condition_config = { thresholdPct: 40 };
  assert.throws(() => draftPayload(draft, catalog), /Preencha/);
  draft.values.condition_config = { limite_pct: 101 };
  assert.throws(() => draftPayload(draft, catalog), /intervalo/);
  draft.values.condition_key = null;
  draft.values.condition_config = {};
  assert.deepEqual(draftPayload(draft, catalog).condition_config, {});
});

test("CLEANSE gera configs tipadas e rejeita seleções inválidas", () => {
  const draft = effectToDraft(catalog);
  draft.values.effect_key = "CLEANSE_STATUS";
  draft.values.config = { status_key: "BURN" };
  assert.deepEqual(draftPayload(draft, catalog).config, { status_key: "BURN" });
  assert.match(previewEffect(draft.values, catalog), /Queimadura/);
  draft.values.config = { status_key: "INVALIDO" };
  assert.throws(() => draftPayload(draft, catalog), /valor válido/);
  draft.values.effect_key = "CLEANSE_CATEGORY";
  draft.values.config = { category: "DOT" };
  assert.deepEqual(draftPayload(draft, catalog).config, { category: "DOT" });
  assert.match(previewEffect(draft.values, catalog), /Dano periódico/);
});

test("todos os contextos começam permitidos e mudanças geram flags corretas", () => {
  const draft = effectToDraft(catalog);
  for (const context of catalog.contexts)
    assert.equal(draft.values[context.field], true);
  draft.values.allow_ranked = false;
  draft.values.allow_world_boss = false;
  const payload = draftPayload(draft, catalog);
  assert.equal(payload.allow_ranked, false);
  assert.equal(payload.allow_world_boss, false);
  assert.equal(payload.allow_pve, true);
});

test("edição preserva configs extras e envia só campos alterados", () => {
  const original = {
    ...effectToDraft(catalog).values,
    id: 7,
    id_power: 9,
    magnitude_base: 8,
    scale_attribute: "Forca",
    scale_value: 0.25,
    scale_with_ability_level: true,
    chance_ppm: 333333,
    duration_turns: 4,
    max_stacks: 5,
    config: { legacy: { nested: true } },
    condition_key: "TARGET_HP_BELOW_PCT",
    condition_config: { limite_pct: 40, extra: 9 },
    allow_ranked: false,
    ativo: false,
  };
  const draft = effectToDraft(catalog, original);
  assert.deepEqual(
    changedPayload(draftPayload(draft, catalog), original, catalog),
    {},
  );
  draft.values.magnitude_base = -12;
  assert.deepEqual(
    changedPayload(draftPayload(draft, catalog), original, catalog),
    { magnitude_base: -12 },
  );
  draft.values.condition_config.limite_pct = 30;
  assert.equal(
    original.condition_config.limite_pct,
    40,
    "não muta efeito salvo",
  );
  assert.deepEqual(
    changedPayload(draftPayload(draft, catalog), original, catalog)
      .condition_config,
    { limite_pct: 30, extra: 9 },
  );
});

test("efeitos antigos com dados ocultos mantêm os dados ao editar outro campo", () => {
  const original = {
    ...effectToDraft(catalog).values,
    id: 1,
    id_power: 2,
    effect_key: "CLEANSE_STATUS",
    magnitude_base: 99,
    scale_attribute: "Forca",
    scale_value: 3,
    config: { status_key: "BURN", extra: 42 },
    condition_config: { legacy: true },
    max_stacks: 7,
  };
  const draft = effectToDraft(catalog, original);
  draft.values.dispellable = false;
  assert.deepEqual(
    changedPayload(draftPayload(draft, catalog), original, catalog),
    { dispellable: false },
  );
});
