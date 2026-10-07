"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import api from "@/utils/axiosIntance";
import TypingEditor, {
  RelationEditor,
} from "@/components/combat-typing/TypingEditor";
import {
  ResistanceList,
  DamageBreakdown,
} from "@/components/combat-typing/TypingFeedback";
import type {
  CatalogRow,
  Catalogs,
  DamageResolution,
} from "@/components/combat-typing/types";
type Values = Record<string, string | number | boolean | null>;
const groups = [
  ["affinities", "Afinidades", "DamageAffinityType"],
  ["weapons", "Tipos de arma", "WeaponType"],
  ["families", "Famílias", "MonsterFamily"],
  ["profiles", "Perfis defensivos", "CombatAffinityProfile"],
] as const;
const entityKinds = [
  ["monsters", "Monstros"],
  ["weapons", "Armas"],
  ["equipment", "Equipamentos defensivos"],
  ["powers", "Powers"],
  ["guild-bosses", "Bosses de guilda"],
  ["world-bosses", "World bosses"],
];
const label: Record<string, string> = {
  key: "Key",
  nome: "Nome",
  descricao: "Descrição",
  icon_key: "Ícone",
  imagem_url: "Imagem URL",
  ordem: "Ordem",
  ativo: "Ativo",
  categoria: "Categoria",
  default_damage_nature: "Natureza padrão",
  default_affinity_id: "Afinidade padrão",
  default_affinity_profile_id: "Perfil defensivo padrão",
};
export default function AdminCombatTyping() {
  const params = useSearchParams();
  const [familyPreview, setFamilyPreview] = useState<
    import("@/types/contracts/combatTyping").DefensiveAffinity[]
  >([]);
  const [catalogs, setCatalogs] = useState<Catalogs | null>(null),
    [config, setConfig] = useState<Record<string, unknown>>({}),
    [kind, setKind] = useState<string>("affinities"),
    [selected, setSelected] = useState<number | null>(null),
    [values, setValues] = useState<Values>({
      key: "",
      nome: "",
      ativo: true,
      ordem: 0,
      categoria: "PHYSICAL",
    }),
    [relations, setRelations] = useState<Record<string, number>[]>([]),
    [reason, setReason] = useState(""),
    [message, setMessage] = useState(""),
    [entityKind, setEntityKind] = useState(params.get("kind") ?? "monsters"),
    [entities, setEntities] = useState<Values[]>([]),
    [entityId, setEntityId] = useState(Number(params.get("id")) || 0),
    [sim, setSim] = useState({
      amount: 100,
      weaponId: 0,
      powerId: 0,
      targetKind: "monsters",
      targetId: 0,
    }),
    [result, setResult] = useState<DamageResolution | null>(null),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const r = await api.get("/admin/combat-typing");
      setCatalogs(r.data.data.catalogs);
      setConfig(r.data.data.config);
    } catch {
      setMessage("Não foi possível carregar. Verifique suas permissões.");
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    api
      .get(`/admin/combat-typing/entities/${entityKind}`)
      .then((r) => setEntities(r.data.data))
      .catch(() => setMessage("Falha ao carregar entidades."));
  }, [entityKind]);
  const choose = (nextKind: string, row?: CatalogRow) => {
    setFamilyPreview([]);
    if (row && ["families", "profiles"].includes(nextKind))
      api
        .get(`/admin/combat-typing/preview/${nextKind}/${row.id}`)
        .then((r) => setFamilyPreview(r.data.data.affinities))
        .catch(() => {});
    setKind(nextKind);
    setSelected(row?.id ?? null);
    setValues(
      row
        ? { ...row }
        : {
            key: "",
            nome: "",
            ativo: true,
            ordem: 0,
            ...(nextKind === "affinities"
              ? { categoria: "PHYSICAL" }
              : nextKind === "weapons"
                ? { default_damage_nature: "Fisico", default_affinity_id: null }
                : nextKind === "families"
                  ? { default_affinity_profile_id: null }
                  : {}),
          },
    );
    setRelations(
      nextKind === "profiles"
        ? (catalogs?.CombatAffinityProfileEntry ?? [])
            .filter((e) => e.id_profile === row?.id)
            .map((e) => ({
              id_affinity: Number(e.id_affinity),
              multiplier: Number(e.multiplier),
            }))
        : nextKind === "weapons"
          ? (catalogs?.WeaponTypeFamilyBonus ?? [])
              .filter((e) => e.weapon_type_id === row?.id)
              .map((e) => ({
                monster_family_id: Number(e.monster_family_id),
                damage_bonus_pct: Number(e.damage_bonus_pct),
              }))
          : [],
    );
  };
  const save = async () => {
    setBusy(true);
    try {
      const body = {
        values,
        reason,
        ...(kind === "profiles"
          ? { entries: relations }
          : kind === "weapons"
            ? { familyBonuses: relations }
            : {}),
      };
      if (selected)
        await api.put(`/admin/combat-typing/catalog/${kind}/${selected}`, body);
      else await api.post(`/admin/combat-typing/catalog/${kind}`, body);
      await load();
      setReason("");
      setMessage("Catálogo salvo.");
    } catch (e) {
      setMessage(
        (e as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Falha ao salvar.",
      );
    } finally {
      setBusy(false);
    }
  };
  const saveConfig = async () => {
    try {
      await api.put("/admin/combat-typing/config", { values: config, reason });
      await load();
      setMessage("Configuração salva.");
    } catch (e) {
      setMessage(
        (e as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Falha ao salvar configuração.",
      );
    }
  };
  const simulate = async () => {
    try {
      const r = await api.post("/admin/combat-typing/simulate", {
        ...sim,
        weaponId: sim.weaponId || undefined,
        powerId: sim.powerId || undefined,
      });
      setResult(r.data.data);
    } catch (e) {
      setMessage(
        (e as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Simulação recusada.",
      );
    }
  };
  if (!catalogs)
    return (
      <div className="space-y-4 text-white">
        <Link
          prefetch={false}
          href="/dashboard/admin"
          className="inline-flex rounded-lg border border-[#F3B43F]/50 px-4 py-2 text-sm text-[#F3B43F] hover:bg-[#F3B43F]/10"
        >
          ← Voltar ao Admin
        </Link>
        <p
          role="status"
          className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4"
        >
          {message || "Carregando…"}
        </p>
      </div>
    );
  const rows = catalogs[groups.find((g) => g[0] === kind)![2]];
  const configLabels: Record<string, string> = {
    min_multiplier: "Multiplicador mínimo",
    max_multiplier: "Multiplicador máximo",
    family_bonus_cap: "Cap de bônus contra família (%)",
    effective_min: "Efetivo a partir de",
    weakened_max: "Enfraquecido até",
    ineffective_max: "Ineficaz até",
  };
  return (
    <main className="flex min-w-0 flex-col gap-4 text-white">
      <Link
        prefetch={false}
        href="/dashboard/admin"
        className="inline-flex self-start items-center rounded-lg border border-[#F3B43F]/50 px-4 py-2 text-sm text-[#F3B43F] hover:bg-[#F3B43F]/10 focus-visible:outline focus-visible:outline-[#F3B43F]"
      >
        ← Voltar ao Admin
      </Link>
      <h1 className="font-imFeel text-3xl text-[#F3B43F]">
        Tipagens, afinidades e famílias
      </h1>
      <p className="text-sm text-white/60">
        Catálogos e conteúdo PvE. PvP permanece desativado na V1. Desativar um
        cadastro preserva referências existentes.
      </p>
      {message && (
        <p
          role="status"
          className="rounded-lg border border-[#F3B43F]/30 bg-black/30 p-3 text-sm"
        >
          {message}
        </p>
      )}
      <section className="space-y-4 rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4">
        <h2 className="font-imFeel text-xl text-[#F3B43F]">Catálogos</h2>
        <nav className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <button
              className={`rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${kind === g[0] ? "border-[#F3B43F] bg-[#BC8418] text-black" : "border-[#F3B43F]/30 text-[#F3B43F] hover:bg-[#F3B43F]/10"}`}
              aria-pressed={kind === g[0]}
              key={g[0]}
              onClick={() => choose(g[0])}
            >
              {g[1]}
            </button>
          ))}
        </nav>
        <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
          <div className="max-h-96 overflow-y-auto rounded-xl border border-white/10 bg-black/20">
            {rows.map((row) => (
              <button
                className={`block w-full border-b border-white/10 px-3 py-2 text-left text-sm transition-colors ${selected === row.id ? "bg-[#F3B43F]/15 text-[#F3B43F]" : "text-white/80 hover:bg-white/5"}`}
                aria-pressed={selected === row.id}
                key={row.id}
                onClick={() => choose(kind, row)}
              >
                {row.nome} {!row.ativo && "(inativo)"}
              </button>
            ))}
            <button
              className="m-3 rounded-lg bg-[#BC8418] px-3 py-2 text-sm font-bold text-black hover:bg-[#a5710f]"
              onClick={() => choose(kind)}
            >
              Novo cadastro
            </button>
          </div>
          <div className="space-y-3">
            {Object.keys(label)
              .filter(
                (k) =>
                  [
                    "key",
                    "nome",
                    "descricao",
                    "icon_key",
                    "imagem_url",
                    "ordem",
                    "ativo",
                  ].includes(k) ||
                  (kind === "affinities" && k === "categoria") ||
                  (kind === "weapons" &&
                    k.startsWith("default_") &&
                    k !== "default_affinity_profile_id") ||
                  (kind === "families" && k === "default_affinity_profile_id"),
              )
              .map((k) => (
                <label className="grid gap-1 text-sm text-white/80" key={k}>
                  {label[k]}
                  {k === "ativo" ? (
                    <input
                      type="checkbox"
                      checked={values[k] === true}
                      onChange={(e) =>
                        setValues({ ...values, [k]: e.target.checked })
                      }
                    />
                  ) : k.endsWith("_id") ? (
                    <select
                      className="rounded-lg border border-white/10 bg-black/30 p-2 text-sm text-white focus:border-[#F3B43F]/60 focus:outline-none"
                      value={String(values[k] ?? "")}
                      onChange={(e) =>
                        setValues({
                          ...values,
                          [k]: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                    >
                      <option value="">Neutro / nenhum</option>
                      {(k === "default_affinity_id"
                        ? catalogs.DamageAffinityType
                        : catalogs.CombatAffinityProfile
                      ).map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nome}
                        </option>
                      ))}
                    </select>
                  ) : k === "categoria" || k === "default_damage_nature" ? (
                    <select
                      className="rounded-lg border border-white/10 bg-black/30 p-2 text-sm text-white focus:border-[#F3B43F]/60 focus:outline-none"
                      value={String(values[k] ?? "")}
                      onChange={(e) =>
                        setValues({ ...values, [k]: e.target.value })
                      }
                    >
                      {(k === "categoria"
                        ? [
                            ["PHYSICAL", "Física"],
                            ["ELEMENTAL", "Elemental"],
                          ]
                        : [
                            ["Fisico", "Físico"],
                            ["Magico", "Mágico"],
                          ]
                      ).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={k === "ordem" ? "number" : "text"}
                      className="rounded-lg border border-white/10 bg-black/30 p-2 text-sm text-white focus:border-[#F3B43F]/60 focus:outline-none"
                      value={String(values[k] ?? "")}
                      onChange={(e) =>
                        setValues({
                          ...values,
                          [k]:
                            k === "ordem"
                              ? Number(e.target.value)
                              : e.target.value,
                        })
                      }
                    />
                  )}
                </label>
              ))}
            {kind === "profiles" && (
              <RelationEditor
                title="Multiplicadores (1 = neutro)"
                rows={relations}
                setRows={setRelations}
                choices={catalogs.DamageAffinityType}
                target="id_affinity"
                value="multiplier"
                valueLabel="Multiplicador"
              />
            )}
            {kind === "weapons" && (
              <RelationEditor
                title="Especializações do tipo de arma"
                rows={relations}
                setRows={setRelations}
                choices={catalogs.MonsterFamily}
                target="monster_family_id"
                value="damage_bonus_pct"
                valueLabel="Bônus (%)"
              />
            )}
            <ResistanceList values={familyPreview} />
            {kind === "families" && selected && (
              <div>
                <h3>Tipos de arma especializados nesta família</h3>
                {catalogs.WeaponTypeFamilyBonus.filter(
                  (b) => b.monster_family_id === selected,
                ).map((b) => (
                  <p key={b.id}>
                    {
                      catalogs.WeaponType.find((w) => w.id === b.weapon_type_id)
                        ?.nome
                    }
                    : +{String(b.damage_bonus_pct)}%
                  </p>
                ))}
              </div>
            )}
            <label>
              Motivo
              <input
                className="ml-2 rounded-lg border border-white/10 bg-black/30 p-2 text-sm text-white focus:border-[#F3B43F]/60 focus:outline-none"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <button
              className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50"
              disabled={busy || reason.trim().length < 5}
              onClick={() => void save()}
            >
              Salvar catálogo
            </button>
          </div>
        </div>
      </section>
      <section className="space-y-3 rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4">
        <h2 className="font-imFeel text-xl text-[#F3B43F]">Conteúdo do jogo</h2>
        <select
          className="rounded-lg border border-white/10 bg-black/30 p-2 text-sm text-white focus:border-[#F3B43F]/60 focus:outline-none"
          value={entityKind}
          onChange={(e) => {
            setEntityKind(e.target.value);
            setEntityId(0);
          }}
        >
          {entityKinds.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          className="ml-2 max-w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm text-white focus:border-[#F3B43F]/60 focus:outline-none"
          value={entityId}
          onChange={(e) => setEntityId(Number(e.target.value))}
        >
          <option value={0}>Escolha um registro</option>
          {entities.map((row) => {
            const id = Number(row.id ?? row.id_item);
            return (
              <option key={id} value={id}>
                {String(row.nome ?? row.nome_chefe ?? row.tipo_arma ?? "Arma")}{" "}
                — #{id}
              </option>
            );
          })}
        </select>
        {entityId > 0 && <TypingEditor kind={entityKind} id={entityId} />}
      </section>
      <details className="space-y-3 rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4">
        <summary className="cursor-pointer font-imFeel text-xl text-[#F3B43F]">
          Limites e mensagens de efetividade
        </summary>
        <label className="block">
          <input
            type="checkbox"
            checked={config.pve_enabled === true}
            onChange={(e) =>
              setConfig({ ...config, pve_enabled: e.target.checked })
            }
          />{" "}
          Afinidades ativas no PvE
        </label>
        <p>PvP: desativado</p>
        {Object.entries(configLabels).map(([k, l]) => (
          <label className="block" key={k}>
            {l}
            <input
              type="number"
              step="0.01"
              className="ml-2 rounded-lg border border-white/10 bg-black/30 p-2 text-sm text-white focus:border-[#F3B43F]/60 focus:outline-none"
              value={Number(config[k])}
              onChange={(e) =>
                setConfig({ ...config, [k]: Number(e.target.value) })
              }
            />
          </label>
        ))}
        {Object.entries((config.labels ?? {}) as Record<string, string>).map(
          ([k, v]) => (
            <label className="block" key={k}>
              Label {k}
              <input
                className="ml-2 rounded-lg border border-white/10 bg-black/30 p-2 text-sm text-white focus:border-[#F3B43F]/60 focus:outline-none"
                value={v}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    labels: {
                      ...(config.labels as Record<string, string>),
                      [k]: e.target.value,
                    },
                  })
                }
              />
            </label>
          ),
        )}
        <p>Usa o motivo informado no formulário de catálogo.</p>
        <button
          className="rounded-lg border border-[#F3B43F]/50 px-3 py-2 text-sm font-bold text-[#F3B43F] hover:bg-[#F3B43F]/10 disabled:opacity-50"
          disabled={reason.trim().length < 5}
          onClick={() => void saveConfig()}
        >
          Salvar configuração
        </button>
      </details>
      <section className="space-y-3 rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4">
        <h2 className="font-imFeel text-xl text-[#F3B43F]">
          Simulador de dano
        </h2>
        <p>
          Informe o dano bruto já escalado; o servidor aplica defesa,
          afinidades, componentes e especializações usando o resolver de
          produção.
        </p>
        {(["amount", "weaponId", "powerId", "targetId"] as const).map((k) => (
          <label
            className="mb-3 mr-3 inline-block text-sm text-white/80"
            key={k}
          >
            {
              {
                amount: "Dano bruto",
                weaponId: "ID da arma (opcional)",
                powerId: "ID da Power (opcional)",
                targetId: "ID do alvo",
              }[k]
            }
            <input
              type="number"
              min="0"
              className="ml-2 w-24 rounded-lg border border-white/10 bg-black/30 p-2 text-sm text-white focus:border-[#F3B43F]/60 focus:outline-none"
              value={sim[k]}
              onChange={(e) => setSim({ ...sim, [k]: Number(e.target.value) })}
            />
          </label>
        ))}
        <select
          className="rounded-lg border border-white/10 bg-black/30 p-2 text-sm text-white focus:border-[#F3B43F]/60 focus:outline-none"
          value={sim.targetKind}
          onChange={(e) => setSim({ ...sim, targetKind: e.target.value })}
        >
          {entityKinds
            .filter(([k]) =>
              ["monsters", "guild-bosses", "world-bosses"].includes(k),
            )
            .map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
        </select>
        <button
          className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50"
          onClick={() => void simulate()}
        >
          Simular
        </button>
        <DamageBreakdown value={result} />
      </section>
    </main>
  );
}
