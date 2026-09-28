"use client";

import Link from "next/link";
import { useState } from "react";
import { SimuladorBalanceamento } from "@/components/admin/SimuladorBalanceamento";
import { AdventureTabs, type AbaAdventure } from "./components/AdventureTabs";
import { ZonesTab } from "./components/ZonesTab";
import { MonstersTab } from "./components/MonstersTab";
import { DropsAuditTab } from "./components/DropsAuditTab";
import { MonsterEditor } from "./components/MonsterEditor";

// Especificação "Admin de Aventura + Defesa/Poder de Monstros" v3 —
// reforma de navegação (§1): a aba Aparições saiu (o vínculo zona-
// monstro agora se edita dentro do ZoneEditor, dentro da aba Zonas) e
// Drops virou só consulta/auditoria (editar drop é trabalho do
// MonsterEditor, dentro da aba Monstros). Este componente só roteia
// entre as 4 abas e carrega a pré-seleção do Simulador quando o
// MonsterEditor manda "Simular este monstro" (§8.2).
export default function AdminAdventureClient() {
  const [aba, setAba] = useState<AbaAdventure>("zonas");
  const [preSelecaoSimulador, setPreSelecaoSimulador] = useState<{ idMonstro: number; ticket: number } | null>(null);
  // Abre o MonsterEditor a partir da aba Drops (botão "Editar monstro"
  // de cada grupo) sem duplicar o editor completo dentro da auditoria
  // (§4.3 último bullet).
  const [monstroEditandoViaDrops, setMonstroEditandoViaDrops] = useState<number | null>(null);

  function simularMonstro(idMonstro: number) {
    setPreSelecaoSimulador({ idMonstro, ticket: Date.now() });
    setAba("simulador");
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Aventura</h1>
      </div>

      <AdventureTabs aba={aba} onMudar={setAba} />

      {aba === "zonas" && <ZonesTab />}
      {aba === "monstros" && <MonstersTab onSimular={simularMonstro} />}
      {aba === "drops" && <DropsAuditTab onEditarMonstro={setMonstroEditandoViaDrops} />}
      {aba === "simulador" && <SimuladorBalanceamento preSelecao={preSelecaoSimulador ?? undefined} />}

      {monstroEditandoViaDrops != null && (
        <MonsterEditor
          idMonstro={monstroEditandoViaDrops}
          onFechar={() => setMonstroEditandoViaDrops(null)}
          onSalvo={() => setMonstroEditandoViaDrops(null)}
          onSimular={(id) => {
            setMonstroEditandoViaDrops(null);
            simularMonstro(id);
          }}
        />
      )}
    </div>
  );
}
