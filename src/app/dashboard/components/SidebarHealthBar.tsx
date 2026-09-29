"use client";

import { useRouter } from "next/navigation";
import { useCharacter } from "@/contexts/CharacterContext";

// Vida sempre visível no menu, embaixo da foto — sem isso, a única forma
// de saber quanto de vida o personagem tem era entrar na aba Status,
// mesmo estando em qualquer outra tela do jogo. Lê do mesmo contexto
// compartilhado que o resto do app já usa (atualizado a cada turno de
// combate, uso de consumível, equipar/desequipar), então fica em sincronia
// sem precisar de polling próprio.
export default function SidebarHealthBar() {
  const { character } = useCharacter();
  const router = useRouter();

  if (!character) return null;

  const pontosParaDistribuir = character.pontos_distribuir ?? 0;

  const vidaMaxima = Math.max(
    character.vida_maxima ?? 30 + character.vitalidade * 6,
    character.vida_atual,
  );
  const percentual = Math.min(100, Math.max(0, (character.vida_atual / vidaMaxima) * 100));

  const manaMaxima = Math.max(
    character.mana_maxima ?? 20 + character.inteligencia * 5,
    character.mana_atual,
  );
  const percentualMana = Math.min(100, Math.max(0, (character.mana_atual / manaMaxima) * 100));

  return (
    <div className="w-full max-w-[9rem] space-y-1">
      <div>
        <div className="mb-0.5 flex justify-between text-[10px] font-bold text-black/70">
          <span>Vida</span>
          <span>
            {character.vida_atual} / {vidaMaxima}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/30">
          <div
            className="h-full bg-red-600 transition-all duration-300"
            style={{ width: `${percentual}%` }}
          />
        </div>
      </div>
      <div>
        <div className="mb-0.5 flex justify-between text-[10px] font-bold text-black/70">
          <span>Mana</span>
          <span>
            {character.mana_atual} / {manaMaxima}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/30">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${percentualMana}%` }}
          />
        </div>
      </div>
      {/* Ouro sempre visível perto do avatar (mesmo motivo de Vida/Mana
          acima) — antes só dava pra ver na aba Status. */}
      <div className="flex items-center justify-center gap-1 rounded-full bg-black/20 px-2 py-1">
        <span aria-hidden className="text-xs">🪙</span>
        <span className="text-[11px] font-bold text-black/80">
          {(character.dinheiro ?? 0).toLocaleString("pt-BR")}
        </span>
      </div>
      {pontosParaDistribuir > 0 && (
        <button
          type="button"
          onClick={() => router.push("/dashboard/character?tab=status")}
          className="w-full rounded-lg border border-black/30 bg-[#F3B43F]/90 px-2 py-1.5 text-center text-[10px] font-bold leading-tight text-black shadow transition hover:bg-[#F3B43F]"
        >
          Você tem pontos para distribuir
          <br />
          <span className="underline">clique aqui</span> para ir distribuir
        </button>
      )}
    </div>
  );
}
