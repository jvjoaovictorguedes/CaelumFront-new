"use client";

// Sistema de Proezas Únicas §14 — card do perfil, deliberadamente
// distinto de AchievementShowcase (§21/§24): não diluir a raridade
// misturando com Conquistas comuns. Sem estado vazio de propósito — a
// raridade É o ponto, então "0 Proezas" nunca aparece pra ninguém.
import type { UniqueFeatItem } from "@/lib/api/unique-feats";

function dataCompleta(iso?: string): string | null {
  if (!iso) return null;
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return null;
  return data.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function UniqueFeatProfileCard({ uniqueFeats }: { uniqueFeats?: UniqueFeatItem[] }) {
  if (!uniqueFeats || uniqueFeats.length === 0) return null;

  return (
    <div className="relative rounded-2xl border-2 border-[#F3B43F] bg-gradient-to-br from-[#3a2c14] via-[#292018] to-[#292018] p-4 text-white shadow-[0_0_20px_rgba(243,180,63,0.25)]">
      <span className="absolute -top-3 left-4 rounded-full border border-[#F3B43F] bg-[#292018] px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#F3B43F]">
        ✦ Legado Único
      </span>

      <p className="mb-3 mt-2 text-xs uppercase tracking-widest text-[#F3B43F]">
        Proezas Únicas ({uniqueFeats.length})
      </p>

      <div className="flex flex-col gap-2">
        {uniqueFeats.map((feat) => (
          <div
            key={feat.key}
            className="rounded-lg border border-[#F3B43F]/50 bg-black/30 p-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-imFeel text-lg text-[#F3B43F]">{feat.nome ?? "???"}</p>
              {dataCompleta(feat.claimed_at) && (
                <p className="shrink-0 text-xs text-white/50">{dataCompleta(feat.claimed_at)}</p>
              )}
            </div>
            <p className="mt-1 text-sm text-white/75">
              {feat.descricao_publica ?? "Uma lenda ainda não foi escrita."}
            </p>
            {feat.legado?.nome && (
              <p className="mt-2 text-xs font-bold uppercase tracking-wide text-purple-300">
                Legado: {feat.legado.nome}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
