"use client";

import { useCharacter } from "@/contexts/CharacterContext";
import type { CurrentCharacter } from "@/utils/character-session";

function formatarTempoRegen(ms: number) {
  if (ms <= 0) return null;
  const totalMinutos = Math.ceil(ms / 60000);
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  if (horas <= 0) return `${minutos}min`;
  return `${horas}h ${minutos}min`;
}

export default function VidaManaCard({
  characterInicial,
}: {
  characterInicial: CurrentCharacter;
}) {
  // Semeado com o personagem já buscado no server (sem flash em branco no
  // primeiro render) e depois lê sempre do contexto compartilhado — assim,
  // equipar/desequipar, usar consumível ou distribuir atributo atualiza a
  // barra na hora, sem precisar trocar de aba ou dar F5.
  const { character } = useCharacter();
  const atual = character ?? characterInicial;

  const vidaMaxima = Math.max(
    atual.vida_maxima ?? 30 + atual.vitalidade * 6,
    atual.vida_atual,
  );
  const manaMaxima = atual.mana_maxima ?? 20 + atual.inteligencia * 5;
  const tempoRegenTexto = formatarTempoRegen(atual.regen_vida_restante_ms ?? 0);

  return (
    <div className="rounded-2xl border border-black/10 bg-[#3a2f24] p-4 shadow-lg">
      <div className="mb-2">
        <div className="flex justify-between text-sm font-bold mb-1">
          <span>Vida</span>
          <span>
            {atual.vida_atual} / {vidaMaxima}
          </span>
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full bg-black/20">
          <div
            className="h-full bg-red-600 transition-all duration-300"
            style={{
              width: `${Math.min(100, (atual.vida_atual / vidaMaxima) * 100)}%`,
            }}
          />
        </div>
        {tempoRegenTexto && (
          <p className="mt-1 text-right text-xs text-white/60">
            Recupera tudo em {tempoRegenTexto}
          </p>
        )}
      </div>

      <div>
        <div className="flex justify-between text-sm font-bold mb-1">
          <span>Mana</span>
          <span>
            {atual.mana_atual} / {manaMaxima}
          </span>
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full bg-black/20">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{
              width: `${Math.min(100, (atual.mana_atual / manaMaxima) * 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
