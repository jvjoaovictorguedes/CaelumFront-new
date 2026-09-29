"use client";

// Habilidades de Ferreiro — perfil da profissão: estatísticas de
// carreira + Livro de Receitas (Profissão de Ferreiro spec §7).
import { useCallback, useEffect, useState } from "react";
import {
  getBlacksmithStats,
  getRecipeBook,
  learnRecipe,
  type BlacksmithStatsApi,
  type LivroReceitasApi,
  type RaridadeReceita,
} from "@/lib/api/forge";
import { resolveMediaUrl } from "@/utils/media-url";
import { useToast } from "@/contexts/ToastContext";
import ItemIcon from "@/components/Item/ItemIcon";

const COR_RARIDADE_RECEITA: Record<RaridadeReceita, string> = {
  Comum: "text-[#9CA3AF]",
  Raro: "text-[#60A5FA]",
  Lendario: "text-[#FB923C]",
};

const FILTROS: { chave: "Todas" | RaridadeReceita; rotulo: string }[] = [
  { chave: "Todas", rotulo: "Todas" },
  { chave: "Comum", rotulo: "Comuns" },
  { chave: "Raro", rotulo: "Raras" },
  { chave: "Lendario", rotulo: "Lendárias" },
];

const ORDEM_QUALIDADE = ["Comum", "Incomum", "Raro", "Epico", "Lendario", "Mitico"];

function mensagemDeErro(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "response" in error) {
    const resp = (error as { response?: { data?: { message?: string } } }).response;
    if (resp?.data?.message) return resp.data.message;
  }
  return fallback;
}

function StatCard({ label, valor }: { label: string; valor: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-[10px] uppercase tracking-wide text-white/40">{label}</p>
      <p className="text-lg font-bold text-[#F3B43F]">{valor}</p>
    </div>
  );
}

export default function BlacksmithSkillsPanel({ onProgressoMudou }: { nivelForja: number; onProgressoMudou: () => void }) {
  const [stats, setStats] = useState<BlacksmithStatsApi | null>(null);
  const [livro, setLivro] = useState<LivroReceitasApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<"Todas" | RaridadeReceita>("Todas");
  const [aprendendo, setAprendendo] = useState<number | null>(null);
  const { mostrarErro, mostrarSucesso } = useToast();

  const carregar = useCallback(async () => {
    try {
      const [statsResp, livroResp] = await Promise.all([getBlacksmithStats(), getRecipeBook()]);
      setStats(statsResp);
      setLivro(livroResp);
    } catch {
      mostrarErro("Não foi possível carregar Habilidades de Ferreiro.");
    } finally {
      setCarregando(false);
    }
  }, [mostrarErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleAprender(idItem: number) {
    setAprendendo(idItem);
    try {
      const resultado = await learnRecipe(idItem);
      mostrarSucesso(`Receita de "${resultado.nome_blueprint}" aprendida!`);
      await carregar();
      onProgressoMudou();
    } catch (error) {
      mostrarErro(mensagemDeErro(error, "Não foi possível aprender essa Receita."));
    } finally {
      setAprendendo(null);
    }
  }

  if (carregando || !stats || !livro) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        Carregando Habilidades de Ferreiro...
      </div>
    );
  }

  const conhecidasFiltradas =
    filtro === "Todas" ? livro.conhecidas : livro.conhecidas.filter((r) => r.raridade_receita === filtro);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        <p className="mb-3 text-sm uppercase tracking-widest text-[#F3B43F]">Estatísticas de Carreira</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Barras fundidas" valor={stats.stats.barras_fundidas} />
          <StatCard label="Equipamentos fabricados" valor={stats.stats.equipamentos_fabricados} />
          <StatCard label="Refinos bem-sucedidos" valor={stats.stats.refinamentos_sucesso} />
          <StatCard label="Falhas de refino" valor={stats.stats.refinamentos_falha} />
          <StatCard label="Maior refinamento" valor={`+${stats.stats.maior_refinamento_alcancado}`} />
          <StatCard label="Receitas conhecidas" valor={livro.resumo.total} />
        </div>
        {Object.keys(stats.stats.qualidades_fabricadas).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {ORDEM_QUALIDADE.filter((q) => stats.stats.qualidades_fabricadas[q]).map((qualidade) => (
              <span key={qualidade} className="rounded-full border border-white/15 bg-black/20 px-2.5 py-1 text-[11px] text-white/70">
                {qualidade}: {stats.stats.qualidades_fabricadas[qualidade]}
              </span>
            ))}
          </div>
        )}
      </div>

      {livro.no_inventario.length > 0 && (
        <div className="rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-4 text-white shadow-lg">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#F3B43F]">Receitas no Inventário</p>
          <div className="flex flex-col gap-2">
            {livro.no_inventario.map((receita) => (
              <div key={receita.id_item} className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-2">
                <div className="h-10 w-10 shrink-0">
                  <ItemIcon imagemUrl={resolveMediaUrl(receita.imagem_url)} nome={receita.nome_item} fallback={<span>📜</span>} />
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    {receita.nome_item}{" "}
                    <span className={`text-xs font-bold ${COR_RARIDADE_RECEITA[receita.raridade_receita]}`}>
                      Receita {receita.raridade_receita}
                    </span>
                  </p>
                  <p className="text-xs text-white/50">
                    Ensina: {receita.nome_blueprint} — requer Nível de Ferreiro {receita.nivel_forja_necessario}
                    {receita.quantidade_disponivel > 1 ? ` (x${receita.quantidade_disponivel})` : ""}
                  </p>
                </div>
                {receita.pode_aprender ? (
                  <button
                    type="button"
                    onClick={() => handleAprender(receita.id_item)}
                    disabled={aprendendo !== null}
                    className="shrink-0 rounded-lg border-2 border-[#F3B43F]/60 px-3 py-1.5 text-xs font-bold text-[#F3B43F] hover:bg-[#F3B43F]/10 disabled:opacity-40"
                  >
                    {aprendendo === receita.id_item ? "Aprendendo..." : "Aprender"}
                  </button>
                ) : (
                  <span className="shrink-0 text-[10px] font-bold uppercase text-red-300/80">
                    Bloqueado — Nv. {receita.nivel_forja_necessario}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-4 text-white shadow-lg">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-[#F3B43F]">
            Livro de Receitas ({livro.resumo.total})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {FILTROS.map((f) => (
              <button
                key={f.chave}
                type="button"
                onClick={() => setFiltro(f.chave)}
                className={`rounded-md border px-2.5 py-1 text-[11px] font-bold uppercase transition ${
                  filtro === f.chave
                    ? "border-[#F3B43F] bg-[#F3B43F] text-black"
                    : "border-white/15 text-white/60 hover:border-[#F3B43F]/50"
                }`}
              >
                {f.rotulo}
                {f.chave !== "Todas" ? ` (${livro.resumo[f.chave]})` : ""}
              </button>
            ))}
          </div>
        </div>

        {conhecidasFiltradas.length === 0 ? (
          <p className="text-xs text-white/50">Nenhuma Receita conhecida ainda nessa categoria.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {conhecidasFiltradas.map((receita) => (
              <div key={receita.id_blueprint} className="rounded-lg border border-white/10 bg-black/20 p-2.5">
                <p className="text-sm font-bold">{receita.nome_blueprint}</p>
                <p className="text-xs text-white/50">
                  {receita.categoria_equipamento}
                  {receita.tier_equipamento ? ` — Tier ${receita.tier_equipamento}` : ""} — Nv.{" "}
                  {receita.nivel_forja_necessario}
                </p>
                {receita.raridade_receita && (
                  <p className={`text-xs font-bold ${COR_RARIDADE_RECEITA[receita.raridade_receita]}`}>
                    Receita {receita.raridade_receita}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
