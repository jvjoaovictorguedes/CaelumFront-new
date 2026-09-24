"use client";

import type { CurrentCharacter } from "@/utils/character-session";

const LABEL_DIFICULDADE: Record<string, string> = {
  dangerous: "Perigosas",
  difficult: "Difíceis",
  deadly: "Mortais",
  nightmare: "Pesadelo",
  extermination: "Extermínio",
};

// Caçadas §12 — card próprio "Guilda dos Aventureiros" no perfil, em vez
// de espalhar mais linhas no bloco de identidade: consolida Rank F-S,
// Reputação Comercial (Balcão de Espólios) e Reputação de Caçador
// (Caçadas) sem misturar o SIGNIFICADO das três progressões.
export default function AdventureGuildProfileCard({ character }: { character: CurrentCharacter }) {
  const perfil = character.adventureGuildProfile;
  if (!perfil) return null;

  return (
    <div className="rounded-2xl border border-black/10 bg-[#3a2f24] p-5 text-white shadow-lg">
      <p className="mb-3 text-xs uppercase tracking-widest text-[#F3B43F]">Guilda dos Aventureiros</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-[#F3B43F]/10 p-3">
          <p className="text-[10px] uppercase tracking-wide text-white/50">Rank de Aventureiro</p>
          <p className="font-imFeel text-xl">{perfil.adventurerRank}</p>
        </div>

        <div className="rounded-lg bg-[#F3B43F]/10 p-3" title={`${perfil.commercialReputation.points.toLocaleString("pt-BR")} pontos`}>
          <p className="text-[10px] uppercase tracking-wide text-white/50">Reputação Comercial</p>
          <p className="font-imFeel text-lg">{perfil.commercialReputation.title}</p>
          <p className="mt-1 text-[10px] text-white/50">
            Encomendas concluídas: {perfil.commercialReputation.ordersCompleted}
          </p>
        </div>

        <div className="rounded-lg bg-[#F3B43F]/10 p-3" title={`${perfil.hunterReputation.points.toLocaleString("pt-BR")} pontos`}>
          <p className="text-[10px] uppercase tracking-wide text-white/50">Reputação de Caçador</p>
          <p className="font-imFeel text-lg">{perfil.hunterReputation.title}</p>
          <p className="mt-1 text-[10px] text-white/50">Caçadas concluídas: {perfil.hunterReputation.huntsCompleted}</p>
          {perfil.hunterReputation.huntsCompleted > 0 && (
            <p className="mt-1 text-[10px] text-white/40">
              {Object.entries(perfil.hunterReputation.byDifficulty)
                .filter(([, valor]) => valor > 0)
                .map(([chave, valor]) => `${LABEL_DIFICULDADE[chave] ?? chave}: ${valor}`)
                .join(" · ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
