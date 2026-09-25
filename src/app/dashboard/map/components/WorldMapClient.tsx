"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import WorldMapCanvas from "./WorldMapCanvas";
import WorldMapFilters, { type FiltroTipo, type SubfiltroExpedicao } from "./WorldMapFilters";
import WorldMapLocationPanel from "./WorldMapLocationPanel";

// Tipos espelhando exatamente o payload de GET /api/world/map
// (worldMapService.js no backend) — snake_case de propósito, mesma
// convenção do resto da API deste projeto.
export interface TerritorioApi {
  id: number;
  nome: string;
  slug: string;
  descricao: string | null;
  polygon: { x: number; y: number }[];
  label: { x: number; y: number };
  controle_habilitado: boolean;
  estado: "neutro";
}

export interface RecursoExpedicaoApi {
  id_recurso: number;
  nome: string;
  peso_percentual: number;
}

export interface AdventureInfoApi {
  zona_id: number;
  descricao: string | null;
  nivel_recomendado: string;
  perigo: "BAIXO" | "MEDIO" | "ALTO" | "EXTREMO";
  bestiario: { descobertos: number; total: number } | null;
  maestria_nivel: number;
  maestria_numeral: string | null;
}

export interface ExpeditionInfoApi {
  regiao_id: number;
  profissao: "Mineracao" | "Silvicultura" | "Exploracao";
  nivel_minimo: number;
  descricao: string | null;
  desbloqueada: boolean;
  recursos: RecursoExpedicaoApi[];
}

export interface ServicoCapitalApi {
  chave: string;
  rota: string;
}

export interface NodeApi {
  id: number;
  nome: string;
  tipo: "Adventure" | "Expedition" | "City" | "Service" | "Landmark";
  id_territorio: number | null;
  x: number;
  y: number;
  icone_url: string | null;
  imagem_url: string | null;
  indisponivel?: boolean;
  adventure?: AdventureInfoApi;
  expedition?: ExpeditionInfoApi;
  city?: { servicos: ServicoCapitalApi[] };
}

export interface ConnectionApi {
  id: number;
  id_origem: number;
  id_destino: number;
  tipo: string;
}

export interface WorldMapApi {
  territories: TerritorioApi[];
  nodes: NodeApi[];
  connections: ConnectionApi[];
  state: { zona_aventura_ativa_id: number | null; zona_aventura_ativa_nome: string | null };
}

function nodePassaNoFiltro(node: NodeApi, filtro: FiltroTipo, subfiltroExpedicao: SubfiltroExpedicao) {
  if (node.indisponivel) return false;
  if (filtro === "TODOS") return true;
  if (filtro === "AVENTURA") return node.tipo === "Adventure";
  if (filtro === "EXPEDICAO") {
    if (node.tipo !== "Expedition") return false;
    if (!subfiltroExpedicao) return true;
    return node.expedition?.profissao === subfiltroExpedicao;
  }
  if (filtro === "CIDADES") return node.tipo === "City";
  if (filtro === "SERVICOS") return node.tipo === "Service";
  return true;
}

// Estado neutro fica sempre visível de fundo, mesmo filtrando Nodes
// (spec §27: "territórios permanecem como camada de fundo").
export default function WorldMapClient({ mapa }: { mapa: WorldMapApi }) {
  const [filtro, setFiltro] = useState<FiltroTipo>("TODOS");
  const [subfiltroExpedicao, setSubfiltroExpedicao] = useState<SubfiltroExpedicao>(null);
  const [nodeSelecionadoId, setNodeSelecionadoId] = useState<number | null>(null);

  const nodesVisiveis = useMemo(
    () => mapa.nodes.filter((n) => nodePassaNoFiltro(n, filtro, subfiltroExpedicao)),
    [mapa.nodes, filtro, subfiltroExpedicao],
  );

  const nodeSelecionado = useMemo(
    () => mapa.nodes.find((n) => n.id === nodeSelecionadoId) ?? null,
    [mapa.nodes, nodeSelecionadoId],
  );

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* O mapa cobre a tela toda (fixed inset-0) por cima do menu
              lateral/hambúrguer — sem isso não existe como sair da
              página, nem no mobile nem no desktop. */}
          <Link
            href="/dashboard"
            aria-label="Fechar mapa"
            title="Fechar mapa"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#F3B43F] bg-[#292018] text-[#F3B43F] transition hover:bg-[#3a2f24]"
          >
            ✕
          </Link>
          <h1 className="font-imFeel text-3xl text-white sm:text-4xl">Mapa de Caelum</h1>
        </div>
        <WorldMapFilters
          filtro={filtro}
          onFiltroChange={(f) => {
            setFiltro(f);
            if (f !== "EXPEDICAO") setSubfiltroExpedicao(null);
          }}
          subfiltroExpedicao={subfiltroExpedicao}
          onSubfiltroExpedicaoChange={setSubfiltroExpedicao}
        />
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border-2 border-[#F3B43F] bg-[#1a1410] shadow-xl">
        <WorldMapCanvas
          territories={mapa.territories}
          nodes={nodesVisiveis}
          connections={mapa.connections}
          activeAdventureZoneId={mapa.state.zona_aventura_ativa_id}
          selectedNodeId={nodeSelecionadoId}
          onSelectNode={(id) => setNodeSelecionadoId(id)}
        />
      </div>

      {nodeSelecionado && (
        <WorldMapLocationPanel
          node={nodeSelecionado}
          territorio={mapa.territories.find((t) => t.id === nodeSelecionado.id_territorio) ?? null}
          onFechar={() => setNodeSelecionadoId(null)}
        />
      )}
    </div>
  );
}
