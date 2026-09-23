"use client";

// Bestiário resumido (Especificação Perfil de Jogador §18/§19) — nunca
// carrega a ficha completa de cada monstro aqui.
import type { PerfilBestiario, PerfilHighlights } from "@/lib/api/profile";

export default function BestiaryProfileSummary({
  bestiary,
  monstrosFavoritos,
}: {
  bestiary: PerfilBestiario;
  monstrosFavoritos: PerfilHighlights["monstros"];
}) {
  return (
    <div className="rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-4 text-white shadow-lg">
      <p className="mb-2 text-xs uppercase tracking-widest text-[#F3B43F]">Bestiário</p>
      <div className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-3">
        <p className="text-white/70">
          Criaturas: <span className="font-bold text-white">{bestiary.criaturas_descobertas} / {bestiary.criaturas_totais}</span>
        </p>
        <p className="text-white/70">
          Regiões: <span className="font-bold text-white">{bestiary.regioes_completas} / {bestiary.regioes_totais}</span>
        </p>
        <p className="text-white/70">
          Maestrias V: <span className="font-bold text-white">{bestiary.maestrias_v}</span>
        </p>
      </div>

      {monstrosFavoritos.length > 0 && (
        <div className="mt-3 border-t border-white/10 pt-2">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/50">Favoritos</p>
          <div className="flex flex-col gap-1">
            {monstrosFavoritos.map((m) => (
              <p key={m.slot} className="flex justify-between text-sm text-white/80">
                <span>{m.nome}</span>
                <span className="text-white/50">{m.abates} abates</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
