"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosIntance";
import type { NodeApi, TerritorioApi } from "./WorldMapClient";

const LABEL_SERVICO: Record<string, string> = {
  SHOP: "Loja",
  MARKET: "Mercado",
  FORGE: "Forja",
  GUILDS: "Guildas",
  QUESTS: "Guilda dos Aventureiros",
  PVP: "Arena PvP",
};

function corDoPerigoTexto(perigo?: string) {
  switch (perigo) {
    case "EXTREMO":
      return "text-red-500";
    case "ALTO":
      return "text-orange-400";
    case "MEDIO":
      return "text-yellow-400";
    default:
      return "text-green-400";
  }
}

// Painel lateral por clique (spec §29-§33) — nunca navega direto, só
// abre esse painel com resumo + ação. Reaproveita os endpoints já
// existentes de Aventura/Expedição sem duplicar regra nenhuma.
export default function WorldMapLocationPanel({
  node,
  territorio,
  onFechar,
}: {
  node: NodeApi;
  territorio: TerritorioApi | null;
  onFechar: () => void;
}) {
  const router = useRouter();
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function entrarNaAventura() {
    if (!node.adventure) return;
    setEntrando(true);
    setErro(null);
    try {
      await axiosInstance.post(`/adventure/zones/${node.adventure.zona_id}/enter`);
      router.push("/dashboard/adventure");
    } catch {
      setErro("Não foi possível entrar nessa zona agora.");
      setEntrando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70" onClick={onFechar}>
      <div
        className="w-full max-w-md rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-imFeel text-2xl text-[#F3B43F]">{node.nome}</h2>
            {territorio && <p className="text-xs uppercase tracking-widest text-white/50">{territorio.nome}</p>}
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-full border border-white/20 px-2.5 py-1 text-sm text-white/70 hover:border-white/50 hover:text-white"
          >
            ✕
          </button>
        </div>

        {node.tipo === "Adventure" && node.adventure && (
          <div className="space-y-3">
            {node.adventure.descricao && <p className="text-sm text-white/80">{node.adventure.descricao}</p>}
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-white/70">
                Nível recomendado: <b className="text-white">{node.adventure.nivel_recomendado}</b>
              </span>
              <span className={`font-bold ${corDoPerigoTexto(node.adventure.perigo)}`}>
                Perigo: {node.adventure.perigo}
              </span>
            </div>
            {node.adventure.bestiario && (
              <p className="text-sm text-white/70">
                Bestiário: <b className="text-white">{node.adventure.bestiario.descobertos}</b> /{" "}
                {node.adventure.bestiario.total} descobertos
              </p>
            )}
            {node.adventure.maestria_numeral && (
              <p className="text-sm text-white/70">
                Maestria: <b className="text-white">{node.adventure.maestria_numeral}</b>
              </p>
            )}

            {erro && <p className="text-sm text-red-400">{erro}</p>}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={entrando}
                onClick={entrarNaAventura}
                className="rounded-lg border-2 border-[#F3B43F] bg-[#F3B43F] px-4 py-2 text-sm font-bold text-[#292018] transition hover:bg-[#f5c463] disabled:opacity-50"
              >
                {entrando ? "Entrando..." : "Entrar"}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/dashboard/bestiary/${node.adventure!.zona_id}`)}
                className="rounded-lg border-2 border-[#F3B43F]/50 px-4 py-2 text-sm font-bold text-[#F3B43F] transition hover:border-[#F3B43F]"
              >
                Ver Bestiário
              </button>
            </div>
          </div>
        )}

        {node.tipo === "Expedition" && node.expedition && (
          <div className="space-y-3">
            <p className="text-sm text-white/70">
              Profissão: <b className="text-white">{node.expedition.profissao}</b> · Nível mínimo:{" "}
              <b className="text-white">{node.expedition.nivel_minimo}</b>
            </p>
            {node.expedition.descricao && <p className="text-sm text-white/80">{node.expedition.descricao}</p>}
            {node.expedition.recursos.length > 0 && (
              <div>
                <p className="mb-1 text-xs uppercase tracking-widest text-white/50">Recursos</p>
                <ul className="flex flex-wrap gap-1.5">
                  {node.expedition.recursos.map((r) => (
                    <li
                      key={r.id_recurso}
                      className="rounded-full border border-white/20 bg-black/30 px-2 py-0.5 text-xs text-white/80"
                    >
                      {r.nome}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {node.expedition.desbloqueada ? (
              <button
                type="button"
                onClick={() => router.push("/dashboard/expedition")}
                className="rounded-lg border-2 border-[#F3B43F] bg-[#F3B43F] px-4 py-2 text-sm font-bold text-[#292018] transition hover:bg-[#f5c463]"
              >
                Ir para Expedição
              </button>
            ) : (
              <p className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white/60">
                Região bloqueada — nível mínimo {node.expedition.nivel_minimo} em {node.expedition.profissao}.
              </p>
            )}
          </div>
        )}

        {node.tipo === "City" && node.city && (
          <div className="space-y-3">
            <p className="text-sm text-white/80">Capital de Caelum — ponto neutro com acesso aos serviços da cidade.</p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {node.city.servicos.map((s) => (
                <button
                  key={s.chave}
                  type="button"
                  onClick={() => router.push(s.rota)}
                  className="rounded-lg border-2 border-[#F3B43F]/50 px-3 py-2 text-sm font-bold text-[#F3B43F] transition hover:border-[#F3B43F] hover:bg-[#F3B43F]/10"
                >
                  {LABEL_SERVICO[s.chave] ?? s.chave}
                </button>
              ))}
            </div>
          </div>
        )}

        {(node.tipo === "Service" || node.tipo === "Landmark") && (
          <p className="text-sm text-white/60">Ponto de interesse — sem ações disponíveis nesta versão do mapa.</p>
        )}
      </div>
    </div>
  );
}
