// src/components/combat/MissionsPanel.tsx
//
// Painel de "Missões em andamento" (sugestão de jogador — k4zUt0) na
// tela de combate solo da Aventura. Hoje só mostra a Caçada ativa
// ("Caça ao Javali x8") — é o único tipo de missão com progresso
// contado por monstro específico, já atualizado turno a turno pelo
// `huntUpdate` da resposta de combate (ver CombatArena.tsx). Missões
// genéricas (diárias/semanais) e Contratos de Guilda não têm esse
// contador em tempo real na resposta de /combat/action hoje, então
// ficam de fora pra não mostrar um número que só atualiza ao reabrir a
// tela — ver nota na investigação que embasou esta feature.
//
// Mesmo padrão de toggle + painel flutuante do FloatingMusicWidget
// (botão redondo, painel absoluto que abre pra cima, fecha ao clicar
// fora) — reaproveitado aqui porque já resolve o problema de caber
// dentro do overlay de combate (CombatArena é `fixed inset-0`) sem
// disputar espaço com a barra de ações embaixo.
"use client";

import { useEffect, useRef, useState } from "react";

export interface CacadaAtivaInfo {
  id: number;
  target: { nome: string; imagem_url?: string | null } | null;
  progress: number;
  quantityRequired: number;
  difficultyLabel?: string | null;
}

export default function MissionsPanel({ cacada }: { cacada: CacadaAtivaInfo | null }) {
  const [aberto, setAberto] = useState(false);
  const raizRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(evento: MouseEvent) {
      if (!raizRef.current?.contains(evento.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [aberto]);

  const progressoPercentual = cacada
    ? Math.min(100, (cacada.progress / Math.max(1, cacada.quantityRequired)) * 100)
    : 0;

  return (
    <div ref={raizRef} className="relative shrink-0 self-end">
      {aberto && (
        <div className="absolute bottom-full right-0 z-10 mb-2 w-60 rounded-xl border-2 border-[#F3B43F]/70 bg-[#292018]/95 p-3 text-white shadow-xl backdrop-blur-sm">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#F3B43F]">
            Missões em andamento
          </p>
          {cacada ? (
            <div>
              <p className="text-sm font-bold">Caça: {cacada.target?.nome ?? "Alvo desconhecido"}</p>
              {cacada.difficultyLabel && (
                <p className="text-[10px] uppercase tracking-wide text-white/50">
                  {cacada.difficultyLabel}
                </p>
              )}
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/50">
                <div
                  className="h-full bg-[#F3B43F] transition-all"
                  style={{ width: `${progressoPercentual}%` }}
                />
              </div>
              <p className="mt-1 text-right text-xs text-white/70">
                {cacada.progress}/{cacada.quantityRequired}
              </p>
            </div>
          ) : (
            <p className="text-xs text-white/50">Nenhuma caçada ativa no momento.</p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        aria-expanded={aberto}
        aria-label={aberto ? "Fechar missões em andamento" : "Ver missões em andamento"}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 bg-[#292018]/80 text-base shadow-md backdrop-blur-sm transition ${
          cacada ? "border-[#F3B43F]/60 hover:border-[#F3B43F]" : "border-white/20 opacity-70 hover:opacity-100"
        }`}
        title="Missões em andamento"
      >
        📜
        {cacada && (
          <span className="pointer-events-none absolute -right-1 -top-1 rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
            {cacada.progress}/{cacada.quantityRequired}
          </span>
        )}
      </button>
    </div>
  );
}
