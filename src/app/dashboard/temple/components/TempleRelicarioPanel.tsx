"use client";
import { useCallback, useEffect, useState } from "react";
import {
  obterRelicarioTemplo,
  sortearRelicarioTemplo,
  listarHistoricoRelicarioTemplo,
  mensagemDeErroTemplo,
  type TempleRelicarioApi,
  type TempleDrawApi,
} from "@/lib/api/temple";

const COR_RARIDADE: Record<string, string> = {
  Comum: "#9ca3af",
  Incomum: "#4ade80",
  Raro: "#60a5fa",
  Epico: "#c084fc",
  Lendario: "#F3B43F",
  Mitico: "#f87171",
};

function gerarRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// §13.4 — custo, odds após elegibilidade, pity atual, histórico recente
// e saldo de Sigilos. Cada draw dentro de um lote 10x é resolvido
// individualmente no backend (pity/duplicata corretos por draw) — aqui
// só exibimos a lista final, já revelada.
export default function TempleRelicarioPanel({ aoSortear }: { aoSortear: () => void }) {
  const [dados, setDados] = useState<TempleRelicarioApi | null>(null);
  const [historico, setHistorico] = useState<TempleDrawApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [sorteando, setSorteando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [ultimosGanhos, setUltimosGanhos] = useState<TempleDrawApi[] | null>(null);

  const carregar = useCallback(async () => {
    try {
      const [relicario, draws] = await Promise.all([obterRelicarioTemplo(), listarHistoricoRelicarioTemplo()]);
      setDados(relicario);
      setHistorico(draws);
    } catch (erro) {
      setMensagem(mensagemDeErroTemplo(erro, "Não foi possível carregar o Relicário."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function sortear(count: 1 | 10) {
    if (sorteando || !dados?.relicario) return;
    setSorteando(true);
    setMensagem("");
    setUltimosGanhos(null);
    try {
      const resultado = await sortearRelicarioTemplo(count, gerarRequestId());
      setUltimosGanhos(resultado.draws);
      await carregar();
      aoSortear();
    } catch (erro) {
      setMensagem(mensagemDeErroTemplo(erro, "Não foi possível sortear no Relicário."));
    } finally {
      setSorteando(false);
    }
  }

  if (carregando) {
    return <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-white">Abrindo o Relicário...</div>;
  }

  if (!dados?.relicario) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-white/60">
        O Relicário desta Convergência ainda não foi configurado.
      </div>
    );
  }

  const r = dados.relicario;
  const custo10 = r.custo_sigilos_draw * 10;
  const semSaldo1 = r.meus_sigilos < r.custo_sigilos_draw;
  const semSaldo10 = r.meus_sigilos < custo10;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-[#F3B43F]/40 bg-[#292018]/60 p-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-imFeel text-2xl text-[#F3B43F]">{r.nome}</p>
            <p className="text-xs text-white/60">Custo: {r.custo_sigilos_draw} Sigilos por draw</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => sortear(1)}
              disabled={sorteando || semSaldo1}
              className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black transition hover:bg-[#a5710f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sortear 1x ({r.custo_sigilos_draw})
            </button>
            <button
              type="button"
              onClick={() => sortear(10)}
              disabled={sorteando || semSaldo10}
              className="rounded-lg border-2 border-[#F3B43F] bg-black/30 px-4 py-2 text-sm font-bold text-[#F3B43F] transition hover:bg-black/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sortear 10x ({custo10})
            </button>
          </div>
        </div>

        {(r.pity_raro_mais_garantia || r.pity_featured_garantia) && (
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/60">
            {r.pity_raro_mais_garantia != null && (
              <span>
                Garantia Raro+: {r.draws_desde_raro_mais}/{r.pity_raro_mais_garantia}
              </span>
            )}
            {r.pity_featured_garantia != null && (
              <span>
                Garantia Featured: {r.draws_desde_featured}/{r.pity_featured_garantia}
              </span>
            )}
            <span>Total de draws: {r.total_draws}</span>
          </div>
        )}

        {mensagem && <p className="mt-3 text-sm text-red-400">{mensagem}</p>}

        {ultimosGanhos && ultimosGanhos.length > 0 && (
          <div className="mt-4 rounded-xl border border-[#F3B43F]/30 bg-black/30 p-3">
            <p className="mb-2 text-xs uppercase tracking-widest text-[#F3B43F]/80">Você conquistou</p>
            <div className="flex flex-wrap gap-2">
              {ultimosGanhos.map((draw, indice) => (
                <TempleRevealCard key={indice} draw={draw} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[#F3B43F]/40 bg-[#292018]/60 p-5 text-white">
        <p className="mb-3 text-sm uppercase tracking-widest text-[#F3B43F]">Odds (após elegibilidade)</p>
        <div className="flex flex-col gap-1">
          {r.entries.map((entrada) => (
            <div key={entrada.key} className="flex items-center justify-between gap-2 text-sm text-white/80">
              <span className="flex items-center gap-2">
                <span className="truncate">{entrada.nome_exibicao}</span>
                {entrada.eh_featured && <span className="rounded bg-[#F3B43F]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#F3B43F]">Featured</span>}
              </span>
              <span className="shrink-0 text-white/50">{(entrada.chance_normal * 100).toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-white">
        <p className="mb-3 text-sm uppercase tracking-widest text-[#F3B43F]">Histórico recente</p>
        {historico.length === 0 ? (
          <p className="text-sm text-white/50">Nenhum draw ainda.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {historico.slice(0, 20).map((draw) => (
              <div key={draw.draw_seq} className="flex items-center justify-between gap-2 text-sm">
                <span style={{ color: COR_RARIDADE[draw.raridade ?? ""] ?? "#ffffff" }}>
                  {draw.nome}
                  {draw.quantidade > 1 ? ` x${draw.quantidade}` : ""}
                </span>
                <span className="shrink-0 text-xs text-white/40">{new Date(draw.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TempleRevealCard({ draw }: { draw: TempleDrawApi }) {
  const cor = COR_RARIDADE[draw.raridade ?? ""] ?? "#ffffff";
  return (
    <div
      className="flex min-w-[7rem] flex-col items-center rounded-lg border-2 bg-black/40 p-2 text-center"
      style={{ borderColor: cor }}
    >
      <span className="text-sm font-bold" style={{ color: cor }}>
        {draw.nome}
      </span>
      {draw.quantidade > 1 && <span className="text-xs text-white/60">x{draw.quantidade}</span>}
      {draw.eh_fallback && <span className="mt-1 text-[10px] text-white/40">(substituída — já possuída)</span>}
    </div>
  );
}
