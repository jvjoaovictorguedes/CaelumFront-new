"use client";
import { useCallback, useEffect, useState } from "react";
import api from "@/utils/axiosIntance";
import type { CatalogRow, Catalogs, TypingPreview } from "./types";
type Values = Record<string, string | number | boolean | null>;
type Row = Record<string, number>;
const labels: Record<string, string> = {
  defensive_affinity_id: "Afinidade do buff defensivo",
  defensive_received_pct: "Buff: dano recebido (%)",
  defensive_duration_turns: "Buff defensivo: duração (turnos)",
  weapon_type_id: "Tipo de arma",
  damage_nature_override: "Natureza (override)",
  affinity_mode: "Modo da afinidade",
  affinity_id: "Afinidade principal",
  native_element_id: "Elemento nativo",
  elemental_damage_pct: "Dano elemental adicional (%)",
  added_affinity_id: "Elemento adicional",
  added_damage_pct: "Dano adicional (%)",
  imbue_affinity_id: "Elemento do encantamento",
  imbue_damage_pct: "Encantamento: dano adicional (%)",
  imbue_duration_turns: "Encantamento: duração (turnos)",
  monster_family_id: "Família",
  affinity_profile_id: "Perfil defensivo individual",
  basic_attack_nature: "Natureza do ataque básico",
  basic_attack_affinity_id: "Afinidade do ataque básico",
};
const fields = {
  weapons: [
    "weapon_type_id",
    "damage_nature_override",
    "affinity_mode",
    "affinity_id",
    "native_element_id",
    "elemental_damage_pct",
  ],
  powers: [
    "defensive_affinity_id",
    "defensive_received_pct",
    "defensive_duration_turns",
    "affinity_mode",
    "affinity_id",
    "added_affinity_id",
    "added_damage_pct",
    "imbue_affinity_id",
    "imbue_damage_pct",
    "imbue_duration_turns",
  ],
  monsters: [
    "monster_family_id",
    "affinity_profile_id",
    "basic_attack_nature",
    "basic_attack_affinity_id",
  ],
};
export function RelationEditor({
  title,
  rows,
  setRows,
  choices,
  target,
  value,
  valueLabel,
}: {
  title: string;
  rows: Row[];
  setRows: (rows: Row[]) => void;
  choices: CatalogRow[];
  target: string;
  value: string;
  valueLabel: string;
}) {
  return (
    <fieldset className="space-y-2 rounded border border-amber-900/50 p-3">
      <legend>{title}</legend>
      {rows.map((r, i) => (
        <div className="flex flex-wrap gap-2" key={i}>
          <select
            aria-label={`${title}: tipo`}
            className="bg-stone-900 p-2"
            value={r[target] ?? ""}
            onChange={(e) =>
              setRows(
                rows.map((v, j) =>
                  j === i ? { ...v, [target]: Number(e.target.value) } : v,
                ),
              )
            }
          >
            <option value="">Selecione</option>
            {choices.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
                {!a.ativo ? " (inativo)" : ""}
              </option>
            ))}
          </select>
          <label>
            {valueLabel}
            <input
              className="ml-2 w-24 bg-stone-900 p-2"
              type="number"
              step="0.01"
              value={r[value]}
              onChange={(e) =>
                setRows(
                  rows.map((v, j) =>
                    j === i ? { ...v, [value]: Number(e.target.value) } : v,
                  ),
                )
              }
            />
          </label>
          <button
            type="button"
            onClick={() => setRows(rows.filter((_, j) => j !== i))}
          >
            Remover
          </button>
        </div>
      ))}
      <button
        type="button"
        className="rounded border p-2"
        onClick={() => setRows([...rows, { [target]: 0, [value]: 0 }])}
      >
        Adicionar
      </button>
    </fieldset>
  );
}
export default function TypingEditor({
  kind,
  id,
}: {
  kind: string;
  id: number;
}) {
  const [catalogs, setCatalogs] = useState<Catalogs | null>(null),
    [values, setValues] = useState<Values>({}),
    [bonuses, setBonuses] = useState<Row[]>([]),
    [modifiers, setModifiers] = useState<Row[]>([]),
    [preview, setPreview] = useState<TypingPreview | null>(null),
    [reason, setReason] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const [c, d] = await Promise.all([
        api.get("/admin/combat-typing"),
        api.get(`/admin/combat-typing/entities/${kind}/${id}`),
      ]);
      setCatalogs(c.data.data.catalogs);
      setValues(d.data.data.values);
      setPreview(d.data.data.preview);
      setBonuses(
        (d.data.data.familyBonuses ?? []).map((r: Row) => ({
          monster_family_id: r.monster_family_id,
          damage_bonus_pct: Number(r.damage_bonus_pct),
        })),
      );
      setModifiers(
        (d.data.data.modifiers ?? []).map((r: Row) => ({
          id_affinity: r.id_affinity,
          received_damage_pct: Number(r.received_damage_pct),
        })),
      );
    } catch {
      setMessage("Não foi possível carregar. Verifique sua permissão.");
    }
  }, [kind, id]);
  useEffect(() => {
    void load();
  }, [load]);
  const group =
    kind === "weapons" ? "weapons" : kind === "powers" ? "powers" : "monsters";
  const save = async () => {
    setBusy(true);
    try {
      const data: Record<string, unknown> = {
        reason,
        values: Object.fromEntries(
          (kind === "equipment" ? [] : fields[group]).map((k) => [
            k,
            values[k] ?? null,
          ]),
        ),
      };
      if (["weapons", "powers"].includes(kind)) data.familyBonuses = bonuses;
      if (kind === "equipment") data.modifiers = modifiers;
      await api.put(`/admin/combat-typing/entities/${kind}/${id}`, data);
      await load();
      setReason("");
      setMessage("Dados salvos. Preview atualizado pelo servidor.");
    } catch (e) {
      const error = e as { response?: { data?: { message?: string } } };
      setMessage(error.response?.data?.message ?? "Falha ao salvar.");
    } finally {
      setBusy(false);
    }
  };
  if (!catalogs) return <p>{message || "Carregando tipagens…"}</p>;
  const choices = (key: string) =>
    key === "weapon_type_id"
      ? catalogs.WeaponType
      : key === "monster_family_id"
        ? catalogs.MonsterFamily
        : key === "affinity_profile_id"
          ? catalogs.CombatAffinityProfile
          : catalogs.DamageAffinityType;
  return (
    <section className="space-y-4 rounded border border-amber-900/50 p-4 text-white">
      <h3 className="text-lg text-amber-300">
        Tipagens e afinidades —{" "}
        {String(values.nome ?? values.nome_chefe ?? `#${id}`)}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {(kind === "equipment" ? [] : fields[group])
          .filter(
            (k) =>
              !(
                kind === "powers" &&
                ["Verdadeiro", "Nenhum"].includes(String(values.tipo_dano)) &&
                [
                  "affinity_mode",
                  "affinity_id",
                  "added_affinity_id",
                  "added_damage_pct",
                ].includes(k)
              ),
          )
          .map((k) => (
            <label key={k} className="grid gap-1">
              {labels[k]}
              {k.endsWith("_id") ? (
                <select
                  className="bg-stone-900 p-2"
                  value={String(values[k] ?? "")}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      [k]: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                >
                  <option value="">Nenhum / herdar quando aplicável</option>
                  {choices(k).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                      {!a.ativo ? " (inativo)" : ""}
                    </option>
                  ))}
                </select>
              ) : k.includes("nature") || k === "affinity_mode" ? (
                <select
                  className="bg-stone-900 p-2"
                  value={String(values[k] ?? "")}
                  onChange={(e) =>
                    setValues({ ...values, [k]: e.target.value || null })
                  }
                >
                  {k !== "affinity_mode" && <option value="">Herdar</option>}
                  {(k === "affinity_mode"
                    ? kind === "powers"
                      ? [
                          ["INHERIT_WEAPON", "Herdar arma"],
                          ["EXPLICIT", "Afinidade explícita"],
                          ["NEUTRAL", "Neutro"],
                        ]
                      : [
                          ["INHERIT", "Herdar tipo de arma"],
                          ["EXPLICIT", "Afinidade explícita"],
                          ["NEUTRAL", "Neutro"],
                        ]
                    : [
                        ["Fisico", "Físico"],
                        ["Magico", "Mágico"],
                      ]
                  ).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  min={k === "defensive_received_pct" ? "-95" : "0"}
                  step={k.includes("turns") ? "1" : "0.01"}
                  className="bg-stone-900 p-2"
                  value={Number(values[k] ?? 0)}
                  onChange={(e) =>
                    setValues({ ...values, [k]: Number(e.target.value) })
                  }
                />
              )}
            </label>
          ))}
      </div>
      {preview?.multipliers && (
        <table className="w-full text-sm">
          <caption>
            Perfil defensivo salvo — alterações aparecem após salvar
          </caption>
          <thead>
            <tr>
              <th>Afinidade</th>
              <th>Herdado</th>
              <th>Override</th>
              <th>Efetivo</th>
            </tr>
          </thead>
          <tbody>
            {catalogs.DamageAffinityType.map((a) => (
              <tr key={a.id}>
                <td>{a.nome}</td>
                <td>{Number(preview.inherited?.[a.id] ?? 1).toFixed(2)}x</td>
                <td>
                  {preview.overrides?.[a.id] == null
                    ? "—"
                    : `${Number(preview.overrides[a.id]).toFixed(2)}x`}
                </td>
                <td>{Number(preview.multipliers?.[a.id] ?? 1).toFixed(2)}x</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {preview?.type && (
        <p>
          Perfil ofensivo salvo: {preview.type.nome} — {preview.nature} —{" "}
          {catalogs.DamageAffinityType.find((a) => a.id === preview.affinityId)
            ?.nome ?? "Neutro"}
          {preview.elementalPct ? ` +${preview.elementalPct}% elemental` : ""}
        </p>
      )}
      {["weapons", "powers"].includes(kind) && (
        <RelationEditor
          title="Especializações contra famílias"
          rows={bonuses}
          setRows={setBonuses}
          choices={catalogs.MonsterFamily}
          target="monster_family_id"
          value="damage_bonus_pct"
          valueLabel="Bônus (%)"
        />
      )}
      {kind === "equipment" && (
        <>
          <p>
            Negativo: resistência. Positivo: vulnerabilidade. O servidor aplica
            os caps.
          </p>
          <RelationEditor
            title="Modificadores defensivos"
            rows={modifiers}
            setRows={setModifiers}
            choices={catalogs.DamageAffinityType}
            target="id_affinity"
            value="received_damage_pct"
            valueLabel="Dano recebido (%)"
          />
        </>
      )}
      <label className="block">
        Motivo
        <input
          className="ml-2 rounded bg-stone-900 p-2"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          minLength={5}
          maxLength={500}
        />
      </label>
      <button
        type="button"
        className="rounded border p-2"
        disabled={busy || reason.trim().length < 5}
        onClick={() => void save()}
      >
        {busy ? "Salvando…" : "Salvar tipagens"}
      </button>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
