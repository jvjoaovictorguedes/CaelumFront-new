"use client";

// Conquistas — prestígio/identidade, nunca stats (Especificação Perfil
// de Jogador §21/§24).
import type { PerfilConquista, PerfilHighlights } from "@/lib/api/profile";

export default function AchievementShowcase({
  achievements,
  destaques,
}: {
  achievements: { total: number; lista: PerfilConquista[] };
  destaques: PerfilHighlights["conquistas"];
}) {
  return (
    <div className="rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-4 text-white shadow-lg">
      <p className="mb-2 text-xs uppercase tracking-widest text-[#F3B43F]">
        Conquistas ({achievements.total})
      </p>

      {destaques.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {destaques.map((d) => (
            <span
              key={d.slot}
              className="rounded-full border border-[#F3B43F]/60 bg-black/30 px-3 py-1 text-xs font-bold text-[#F3B43F]"
            >
              {d.nome}
            </span>
          ))}
        </div>
      )}

      {achievements.lista.length === 0 ? (
        <p className="text-sm text-white/50">Nenhuma conquista desbloqueada ainda.</p>
      ) : (
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {achievements.lista.map((c) => (
            <div key={c.key} className="rounded-lg border border-white/10 bg-black/20 p-2">
              <p className="text-sm font-bold text-white">{c.nome}</p>
              <p className="text-xs text-white/60">{c.descricao}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
