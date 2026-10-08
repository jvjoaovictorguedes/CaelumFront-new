"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/utils/axiosIntance";
import { useWorldCrisis } from "@/contexts/WorldCrisisContext";
import {
  CARD,
  BTN,
  BTN_GHOST,
  INPUT,
  LABEL,
  SUBTAB_BTN,
} from "../../admin/world-boss/components/styles";
import type {
  CrisisRequirement,
  CrisisRanking,
  CrisisRankRow,
} from "@/types/contracts/worldCrisis";
const amount = (v: number | string | undefined) =>
  Number(v ?? 0).toLocaleString("pt-BR");
export function CrisisRankingTable({
  ranking,
}: {
  ranking: CrisisRanking | null;
}) {
  function row(r: CrisisRankRow) {
    return (
      <tr
        key={r.character_id ?? r.guild_id}
        className="border-t border-white/10"
      >
        <td className="p-2">#{r.rank}</td>
        <td className="p-2">{r.nome}</td>
        <td className="p-2 text-[#F3B43F]">{amount(r.score ?? r.points)}</td>
        {r.guild_id && (
          <td className="p-2 text-xs text-white/70">
            {amount(r.raw_points)} pontos · {r.unique_contributors}/
            {r.member_count_snapshot} participantes ·{" "}
            {r.participation_pct?.toFixed(1)}% ·{" "}
            {r.mobilization_multiplier?.toFixed(2)}x
          </td>
        )}
      </tr>
    );
  }
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-[#F3B43F]">
            <tr>
              <th className="p-2">Posição</th>
              <th className="p-2">Nome</th>
              <th className="p-2">Contribuição</th>
              {ranking?.rows.some((r) => r.guild_id) && (
                <th className="p-2">Mobilização</th>
              )}
            </tr>
          </thead>
          <tbody>{ranking?.rows.map(row)}</tbody>
        </table>
      </div>
      {ranking?.me && (
        <p className="mt-3 text-sm">
          Meu esforço: #{ranking.me.rank} · {amount(ranking.me.points)} pontos
          {ranking.me.ranking_guild_id
            ? ` · Guilda fixada #${ranking.me.ranking_guild_id}`
            : ""}
        </p>
      )}
      {ranking?.my_guild && (
        <p className="text-sm text-white/70">
          Minha guilda: #{ranking.my_guild.rank} · {ranking.my_guild.nome}
        </p>
      )}
      {ranking?.frozen && (
        <p className="text-xs text-white/50">Ranking final congelado.</p>
      )}
    </>
  );
}
export default function ReconstructionClient() {
  const { crisis, refresh } = useWorldCrisis();
  const [requirements, setRequirements] = useState<CrisisRequirement[]>([]),
    [ranking, setRanking] = useState<CrisisRanking | null>(null),
    [scope, setScope] = useState("individual"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [choice, setChoice] = useState<{
      key: string;
      item: number;
      quantity: number;
    } | null>(null);
  const retry = useRef<{ body: object; signature: string } | null>(null);
  useEffect(()=>{setChoice(null);},[crisis?.id,crisis?.current_stage_key]);
  const load = useCallback(async () => {
    try {
      const [r, k] = await Promise.all([
        api.get("/world-crisis/requirements"),
        api.get("/world-crisis/ranking", { params: { scope } }),
      ]);
      setRequirements(r.data.data);
      setRanking(k.data.data);
    } catch {
      setMessage("Não foi possível atualizar a reconstrução.");
    }
  }, [scope]);
  useEffect(() => {
    void load();
  }, [load, crisis?.current_stage_key, crisis?.status]);
  useEffect(() => {
    const update = () => void load();
    window.addEventListener("caelum:world-crisis-update", update);
    return () =>
      window.removeEventListener("caelum:world-crisis-update", update);
  }, [load]);
  async function donate() {
    if (!choice || busy || !crisis?.id) return;
    setBusy(true);
    const data = {
      event_id: crisis.id,
      stage_key: crisis.current_stage_key,
      requirement_key: choice.key,
      item_id: choice.item,
      quantity: choice.quantity,
    };
    const signature = JSON.stringify(data);
    if (retry.current?.signature !== signature)
      retry.current = {
        signature,
        body: { ...data, request_id: crypto.randomUUID() },
      };
    try {
      const r = await api.post("/world-crisis/contribute", retry.current.body);
      const d = r.data.data;
      setMessage(
        `${d.accepted_quantity} item(ns) entregue(s): +${d.progress_units} progresso, +${d.ranking_points} pontos. ${d.remaining_quantity} item(ns) não consumido(s).`,
      );
      retry.current = null;
      setChoice(null);
      refresh();
      await load();
    } catch (e) {
      setMessage(
        (e as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Falha de conexão. Tente novamente com a mesma doação.",
      );
      refresh();
      await load();
    } finally {
      setBusy(false);
    }
  }
  if (!crisis || crisis.status === "NONE")
    return (
      <div className={CARD}>
        <Link href="/dashboard/quests" className="text-[#F3B43F]">
          ← Guilda dos Aventureiros
        </Link>
        <h1 className="mt-3 font-imFeel text-3xl text-[#F3B43F]">
          Reconstrução de Caelum
        </h1>
        <p className="mt-3 text-white/70">
          Caelum está em paz. Nenhuma reconstrução em andamento.
        </p>
      </div>
    );
  return (
    <div className="flex flex-col gap-4 text-white">
      <Link
        prefetch={false}
        href="/dashboard/quests"
        className="self-start text-sm text-[#F3B43F] hover:underline"
      >
        ← Guilda dos Aventureiros
      </Link>
      <section className={CARD}>
        <h1 className="font-imFeel text-3xl text-[#F3B43F]">{crisis.nome}</h1>
        <p className="mt-2 text-sm text-white/70">{crisis.descricao}</p>
        {crisis.source_name && (
          <p className="mt-2 text-sm text-white/60">
            Devastação causada por {crisis.source_name}.
          </p>
        )}
        <p className="mt-3">
          {crisis.status === "ACTIVE"
            ? `Etapa ${(crisis.stage_index ?? 0) + 1}/${crisis.stage_count}: ${crisis.stage?.nome}`
            : crisis.status === "COMPLETED"
              ? "Caelum foi restaurada!"
              : "Crise encerrada"}
        </p>
        <p className="mt-2 text-sm">
          XP −{crisis.effects?.xp_pct}% · Gold −{crisis.effects?.gold_pct}%
        </p>
        {crisis.restrictions?.length ? (
          <p className="mt-2 text-sm text-red-300">
            Zonas devastadas:{" "}
            {crisis.restrictions
              .map((r) => r.nome ?? `#${r.target_id}`)
              .join(", ")}
          </p>
        ) : (
          <p className="mt-2 text-sm text-emerald-300">
            Todas as rotas estão abertas.
          </p>
        )}
        {crisis.contributions_paused && (
          <p className="text-amber-300">
            Contribuições temporariamente pausadas.
          </p>
        )}
      </section>
      {message && (
        <p
          role="status"
          className="rounded-lg border border-[#F3B43F]/30 bg-black/30 p-3 text-sm"
        >
          {message}
        </p>
      )}
      {crisis.status === "ACTIVE" &&
        requirements.map((r) => {
          const progress = crisis.progress?.find(
            (p) =>
              p.stage_key === crisis.current_stage_key &&
              p.requirement_key === r.key,
          );
          const owned = r.items?.filter((i) => (i.owned ?? 0) > 0) ?? [];
          const selected = choice?.key === r.key ? choice : null;
          const item = owned.find((i) => i.id === selected?.item);
          const remaining = Math.max(
            0,
            Number(progress?.target_progress ?? r.target_progress) -
              Number(progress?.current_progress ?? 0),
          );
          const accepted =
            item && selected
              ? Math.min(
                  selected.quantity,
                  Math.ceil(remaining / item.progress_per_unit),
                )
              : 0;
          return (
            <section key={r.key} className={CARD}>
              <h2 className="font-imFeel text-2xl text-[#F3B43F]">{r.nome}</h2>
              <p className="my-2 text-sm">
                {amount(progress?.current_progress)} /{" "}
                {amount(progress?.target_progress ?? r.target_progress)}
              </p>
              <progress
                aria-label={`Progresso de ${r.nome}`}
                className="h-3 w-full accent-[#F3B43F]"
                value={Number(progress?.current_progress ?? 0)}
                max={Number(progress?.target_progress ?? r.target_progress)}
              />
              <p className="my-2 text-xs text-white/60">
                Fontes aceitas:{" "}
                {r.items
                  ?.map(
                    (i) =>
                      `${i.nome} (${i.progress_per_unit} progresso / ${i.ranking_points_per_unit} pontos)`,
                  )
                  .join(", ")}
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <label className={LABEL}>
                  Material do inventário
                  <select
                    className={INPUT}
                    value={selected?.item ?? 0}
                    onChange={(e) =>
                      setChoice({
                        key: r.key,
                        item: Number(e.target.value),
                        quantity: 1,
                      })
                    }
                  >
                    <option value={0}>Escolha um material</option>
                    {owned.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nome} — {i.owned} disponíveis
                      </option>
                    ))}
                  </select>
                </label>
                <label className={LABEL}>
                  Quantidade
                  <input
                    className={`${INPUT} w-28`}
                    type="number"
                    min={1}
                    max={item?.owned ?? 1}
                    value={selected?.quantity ?? 1}
                    onChange={(e) =>
                      setChoice({
                        key: r.key,
                        item: selected?.item ?? 0,
                        quantity: Number(e.target.value),
                      })
                    }
                  />
                </label>
                <button
                  className={BTN}
                  disabled={
                    busy ||
                    crisis.contributions_paused ||
                    !item ||
                    !selected ||
                    !Number.isSafeInteger(selected.quantity) ||
                    selected.quantity < 1 ||
                    selected.quantity > (item.owned ?? 0) ||
                    remaining === 0
                  }
                  onClick={() => void donate()}
                >
                  {busy ? "Entregando…" : "Entregar materiais"}
                </button>
              </div>
              {item && selected && (
                <p className="mt-2 text-xs text-white/60">
                  Será aceito até {accepted} item(ns); excedentes ficam no
                  inventário. Progresso estimado:{" "}
                  {Math.min(remaining, accepted * item.progress_per_unit)}.
                </p>
              )}
              {!owned.length && (
                <p className="mt-2 text-sm text-white/50">
                  Você ainda não possui materiais elegíveis. Colete recursos na
                  Expedição.
                </p>
              )}
            </section>
          );
        })}
      <section className={CARD}>
        <h2 className="font-imFeel text-2xl text-[#F3B43F]">
          Heróis da reconstrução
        </h2>
        <div className="my-3 flex gap-2">
          {[
            ["individual", "Jogadores"],
            ["guild", "Guildas"],
          ].map(([v, l]) => (
            <button
              className={SUBTAB_BTN(scope === v)}
              onClick={() => setScope(v)}
              key={v}
            >
              {l}
            </button>
          ))}
          <button
            className={BTN_GHOST}
            onClick={() => {
              refresh();
              void load();
            }}
          >
            Atualizar
          </button>
        </div>
        <CrisisRankingTable ranking={ranking} />
      </section>
      <section className={CARD}>
        <h2 className="font-imFeel text-xl text-[#F3B43F]">
          Etapas e recompensas
        </h2>
        <p className="my-2 text-sm text-white/70">
          A ajuda de todos soma para a mesma cidade. Pontos são calculados pelo
          servidor; sua guilda de ranking fica fixada após a primeira
          contribuição como membro.
        </p>
        {crisis.progress?.map((p) => (
          <p
            className="text-sm text-white/60"
            key={`${p.stage_key}:${p.requirement_key}`}
          >
            {p.stage_nome ?? p.stage_key} ·{" "}
            {p.requirement_nome ?? p.requirement_key}:{" "}
            {amount(p.current_progress)} / {amount(p.target_progress)}
          </p>
        ))}
        {crisis.rewards?.map((r) => (
          <p className="mt-2 text-sm" key={r.key}>
            {
              {
                PARTICIPATION: "Participação",
                PERSONAL_MILESTONE: "Marco pessoal",
                INDIVIDUAL_RANK: "Ranking individual",
                GUILD_RANK: "Ranking de guildas",
                COMPLETION: "Conclusão",
              }[r.scope]
            }
            : mínimo {amount(r.min_points)} pontos
            {r.rank_start
              ? ` · posições ${r.rank_start}–${r.rank_end}`
              : ""} ·{" "}
            {r.payload
              .map(
                (p) =>
                  `${amount(p.quantity)} ${p.type === "CHARACTER_GOLD" ? "Gold" : p.type === "CHARACTER_XP" ? "XP" : p.type === "ITEM" ? (p.nome ?? `Item #${p.item_id}`) : p.type === "GUILD_XP" ? "XP de guilda" : "Gold no tesouro"}`,
              )
              .join(", ")}
          </p>
        ))}
      </section>
    </div>
  );
}
