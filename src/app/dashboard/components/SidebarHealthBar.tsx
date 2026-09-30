"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCharacter } from "@/contexts/CharacterContext";

function formatarContagem(ms: number) {
  const totalSegundos = Math.ceil(ms / 1000);
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return `${minutos}:${String(segundos).padStart(2, "0")}`;
}

// Faz o número (e a barra) SUBIREM sozinhos entre um fetch e outro do
// personagem, sem precisar de F5 — sem isso, vida/mana só atualizavam
// quando outra coisa forçava um re-render (ação de combate, navegação).
// Reproduz a MESMA regeneração linear do backend (regenService.js: taxa
// constante = máximo / duração total), nunca uma conta própria — a taxa
// aqui é só derivada de (máximo, atual, tempo restante) que o backend já
// mandou no último fetch.
function useValorComRegen(atualServidor: number, maximoServidor: number, msRestanteServidor: number | undefined) {
  const [base, setBase] = useState(() => ({
    tempo: Date.now(),
    atual: atualServidor,
    msRestante: msRestanteServidor ?? 0,
  }));

  useEffect(() => {
    setBase({ tempo: Date.now(), atual: atualServidor, msRestante: msRestanteServidor ?? 0 });
  }, [atualServidor, maximoServidor, msRestanteServidor]);

  // Só existe pra forçar um re-render a cada segundo — o valor de
  // verdade é sempre recalculado a partir do tempo real decorrido, nunca
  // incrementado passo a passo (evita acumular erro de arredondamento).
  const [, tick] = useState(0);
  useEffect(() => {
    if (base.msRestante <= 0) return;
    const intervalo = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(intervalo);
  }, [base]);

  if (base.msRestante <= 0 || maximoServidor <= base.atual) {
    return { valor: Math.min(atualServidor, maximoServidor), restanteMs: 0 };
  }

  const decorridoMs = Date.now() - base.tempo;
  const taxaPorMs = (maximoServidor - base.atual) / base.msRestante;
  const valor = Math.min(maximoServidor, Math.round(base.atual + decorridoMs * taxaPorMs));
  const restanteMs = Math.max(0, base.msRestante - decorridoMs);
  return { valor, restanteMs };
}

// Vida sempre visível no menu, embaixo da foto — sem isso, a única forma
// de saber quanto de vida o personagem tem era entrar na aba Status,
// mesmo estando em qualquer outra tela do jogo. Lê do mesmo contexto
// compartilhado que o resto do app já usa (atualizado a cada turno de
// combate, uso de consumível, equipar/desequipar), então fica em sincronia
// sem precisar de polling próprio.
export default function SidebarHealthBar() {
  const { character } = useCharacter();
  const router = useRouter();

  // Nunca infla o máximo pelo atual (Math.max fazia isso) — se o atual
  // vier acima do máximo real por qualquer motivo transitório (a
  // sincronização do backend ainda não rodou), o certo é mostrar o
  // atual TRAVADO no máximo, nunca fingir que o máximo cresceu.
  const vidaMaxima = character ? character.vida_maxima ?? 30 + character.vitalidade * 6 : 0;
  const manaMaxima = character ? character.mana_maxima ?? 20 + character.inteligencia * 5 : 0;

  const vida = useValorComRegen(character?.vida_atual ?? 0, vidaMaxima, character?.regen_vida_restante_ms);
  const mana = useValorComRegen(character?.mana_atual ?? 0, manaMaxima, character?.regen_mana_restante_ms);

  if (!character) return null;

  const pontosParaDistribuir = character.pontos_distribuir ?? 0;

  const vidaAtualExibida = vida.valor;
  const percentual = Math.min(100, Math.max(0, (vidaAtualExibida / vidaMaxima) * 100));

  const manaAtualExibida = mana.valor;
  const percentualMana = Math.min(100, Math.max(0, (manaAtualExibida / manaMaxima) * 100));

  return (
    <div className="w-full max-w-[9rem] space-y-1">
      <div>
        <div className="mb-0.5 flex justify-between text-[10px] font-bold text-black/70">
          <span>Vida</span>
          <span>
            {vidaAtualExibida} / {vidaMaxima}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/30">
          <div
            className="h-full bg-red-600 transition-all duration-300"
            style={{ width: `${percentual}%` }}
          />
        </div>
        {vidaAtualExibida < vidaMaxima && vida.restanteMs > 0 && (
          <div className="mt-0.5 text-right text-[9px] text-black/50">
            Vida cheia em {formatarContagem(vida.restanteMs)}
          </div>
        )}
      </div>
      <div>
        <div className="mb-0.5 flex justify-between text-[10px] font-bold text-black/70">
          <span>Mana</span>
          <span>
            {manaAtualExibida} / {manaMaxima}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/30">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${percentualMana}%` }}
          />
        </div>
        {manaAtualExibida < manaMaxima && mana.restanteMs > 0 && (
          <div className="mt-0.5 text-right text-[9px] text-black/50">
            Mana cheia em {formatarContagem(mana.restanteMs)}
          </div>
        )}
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
