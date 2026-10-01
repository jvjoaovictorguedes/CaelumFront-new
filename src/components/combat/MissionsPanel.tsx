// src/components/combat/MissionsPanel.tsx
//
// Painel de "Missões em andamento" (sugestão de jogador — k4zUt0) na
// tela de combate solo da Aventura. Bug reportado: só mostrava a
// Caçada ativa — Contratos de Rank da Guilda dos Aventureiros e
// Missões da Guilda (clã) do jogador, mesmo aceitos/ativos, nunca
// apareciam aqui. Generalizado pra uma lista de itens heterogêneos
// (`MissaoEmAndamentoInfo`); CombatArena.tsx monta essa lista juntando
// as 3 fontes (Caçada, Contrato de Rank, Missão da Guilda), filtradas
// pros tipos de combate (matar monstro/entregar item — nunca
// "Fabricar"/"Refinar"/"CompletarExpedicoes"/"VencerDuelos"/etc, que
// não fazem sentido numa tela de Aventura).
//
// Só a Caçada tem progresso turno a turno em tempo real (via
// `huntUpdate` da resposta de /combat/action, ver CombatArena.tsx) —
// Contrato de Rank/Missão da Guilda mostram o valor da última leitura
// (mesmo comportamento que já têm em qualquer outra tela do jogo fora
// do combate).
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

export interface MissaoEmAndamentoInfo {
  id: string;
  origem: "Caçada" | "Guilda dos Aventureiros" | "Guilda";
  titulo: string;
  subtitulo?: string | null;
  progresso: number;
  total: number;
}

export default function MissionsPanel({ missoes }: { missoes: MissaoEmAndamentoInfo[] }) {
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

  const temMissoes = missoes.length > 0;

  return (
    <div ref={raizRef} className="relative shrink-0 self-end">
      {aberto && (
        <div className="absolute bottom-full right-0 z-10 mb-2 max-h-80 w-64 overflow-y-auto rounded-xl border-2 border-[#F3B43F]/70 bg-[#292018]/95 p-3 text-white shadow-xl backdrop-blur-sm">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#F3B43F]">
            Missões em andamento
          </p>
          {temMissoes ? (
            <div className="flex flex-col gap-3">
              {missoes.map((missao) => {
                const progressoPercentual = Math.min(100, (missao.progresso / Math.max(1, missao.total)) * 100);
                return (
                  <div key={missao.id}>
                    <p className="text-[9px] uppercase tracking-wide text-white/40">{missao.origem}</p>
                    <p className="text-sm font-bold">{missao.titulo}</p>
                    {missao.subtitulo && (
                      <p className="text-[10px] uppercase tracking-wide text-white/50">{missao.subtitulo}</p>
                    )}
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/50">
                      <div
                        className="h-full bg-[#F3B43F] transition-all"
                        style={{ width: `${progressoPercentual}%` }}
                      />
                    </div>
                    <p className="mt-0.5 text-right text-xs text-white/70">
                      {missao.progresso}/{missao.total}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-white/50">Nenhuma missão ativa no momento.</p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        aria-expanded={aberto}
        aria-label={aberto ? "Fechar missões em andamento" : "Ver missões em andamento"}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 bg-[#292018]/80 text-base shadow-md backdrop-blur-sm transition ${
          temMissoes ? "border-[#F3B43F]/60 hover:border-[#F3B43F]" : "border-white/20 opacity-70 hover:opacity-100"
        }`}
        title="Missões em andamento"
      >
        📜
        {temMissoes && (
          <span className="pointer-events-none absolute -right-1 -top-1 rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
            {missoes.length}
          </span>
        )}
      </button>
    </div>
  );
}
