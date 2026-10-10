"use client";

import Link from "next/link";
import { useState } from "react";
import type { EventPuzzleDefinitionApi } from "@/lib/api/admin";
import EventsTab from "./components/EventsTab";
import BlueprintsTab from "./components/BlueprintsTab";
import BossTab from "./components/BossTab";
import { SUBTAB_BTN } from "./components/styles";

type Aba = "eventos" | "salas" | "guardiao";

// "O Coração da Máquina Celestial" — Puzzle Builder (Fase 15). Mesmo
// formato de AdminTempleClient.tsx: tab switcher simples + link de
// volta. A EventDefinition selecionada é compartilhada entre as abas
// "Salas" e "Custódio" (mesma ideia do `idEvento` único do Templo,
// aqui dividido em definição/edição porque o domínio tem as duas).
export default function AdminEventPuzzleClient({ editavel }: { editavel: boolean }) {
  const [aba, setAba] = useState<Aba>("eventos");
  const [definicaoSelecionada, setDefinicaoSelecionada] = useState<EventPuzzleDefinitionApi | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link prefetch={false} href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">O Coração da Máquina Celestial</h1>
        <p className="text-xs text-white/50">
          Puzzle Builder — Definições/Edições, Salas (Blueprints + Versões + solvabilidade), Pistas, Marcos Pioneer, Recompensas e o
          Custódio do Meridiano.
          {!editavel && " Você só tem permissão de leitura (event_puzzle.view) — toda mutação está desabilitada."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ["eventos", "Eventos"],
          ["salas", "Salas (Blueprints)"],
          ["guardiao", "Custódio do Meridiano"],
        ] as [Aba, string][]).map(([id, rotulo]) => (
          <button key={id} type="button" onClick={() => setAba(id)} className={SUBTAB_BTN(aba === id)}>
            {rotulo}
          </button>
        ))}
      </div>

      {aba === "eventos" && (
        <EventsTab
          editavel={editavel}
          definicaoSelecionada={definicaoSelecionada}
          onSelecionarDefinicao={setDefinicaoSelecionada}
        />
      )}
      {aba === "salas" && (
        <BlueprintsTab
          editavel={editavel}
          definicaoSelecionada={definicaoSelecionada}
          onSelecionarDefinicao={setDefinicaoSelecionada}
        />
      )}
      {aba === "guardiao" && (
        <BossTab editavel={editavel} definicaoSelecionada={definicaoSelecionada} onSelecionarDefinicao={setDefinicaoSelecionada} />
      )}
    </div>
  );
}
