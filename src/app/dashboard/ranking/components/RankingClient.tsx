"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import axiosInstance from "@/utils/axiosIntance";

type TipoRanking = "level" | "gold" | "guild" | "pvp" | "forge";

const ABAS: { tipo: TipoRanking; label: string }[] = [
  { tipo: "level", label: "Nível" },
  { tipo: "gold", label: "Gold" },
  { tipo: "guild", label: "Guildas" },
  { tipo: "pvp", label: "PvP" },
  { tipo: "forge", label: "Forja" },
];

interface ItemRanking {
  posicao: number;
  id: number;
  nome: string;
  online?: boolean;
  nivel?: number;
  dinheiro_total_ganho?: number;
  experiencia?: number;
  forja_nivel?: number;
  forja_xp?: number;
  pontuacao?: number;
  vitorias?: number;
  derrotas?: number;
  saldo?: number;
  combates?: number;
}

interface MinhaPosicaoNivelGoldForja {
  posicao: number | null;
}

interface MinhaPosicaoGuilda {
  id_guilda?: number;
  posicao?: number | null;
  motivo?: string;
}

interface MinhaPosicaoPvp {
  elegivel: boolean;
  motivo?: string;
  posicao?: number;
  pontuacao?: number;
  vitorias?: number;
  derrotas?: number;
  saldo?: number;
  combates?: number;
}

interface RankingResponse {
  itens: ItemRanking[];
  pagina: number;
  totalPaginas: number;
  totalItens: number;
  minhaPosicao?: MinhaPosicaoNivelGoldForja | MinhaPosicaoGuilda | MinhaPosicaoPvp;
}

const ESTILO_TOP3 = [
  "border-[#F3B43F] bg-gradient-to-r from-[#3a2c14] to-[#292018]",
  "border-slate-300 bg-gradient-to-r from-[#2b2b30] to-[#292018]",
  "border-amber-700 bg-gradient-to-r from-[#2f2318] to-[#292018]",
];

function IndicadorOnline({ online }: { online: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${online ? "bg-emerald-500" : "bg-white/30"}`}
      title={online ? "Online" : "Offline"}
    />
  );
}

function valorPrincipal(tipo: TipoRanking, item: ItemRanking): string {
  switch (tipo) {
    case "level":
      return `Nível ${item.nivel}`;
    case "gold":
      return `${(item.dinheiro_total_ganho ?? 0).toLocaleString("pt-BR")} ouro`;
    case "guild":
      return `${(item.experiencia ?? 0).toLocaleString("pt-BR")} XP`;
    case "forge":
      return `Forja Nível ${item.forja_nivel} · ${(item.forja_xp ?? 0).toLocaleString("pt-BR")} XP`;
    case "pvp":
      return `Pontuação: ${item.pontuacao}`;
    default:
      return "";
  }
}

export default function RankingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const tipo: TipoRanking = ABAS.some((a) => a.tipo === tabParam) ? (tabParam as TipoRanking) : "level";
  const pagina = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const [dados, setDados] = useState<RankingResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await axiosInstance.get<{ data?: RankingResponse }>("/ranking", {
        params: { type: tipo, page: pagina },
      });
      setDados(resposta.data?.data ?? null);
    } catch {
      setErro("Não foi possível carregar o ranking agora. Tente novamente em instantes.");
      setDados(null);
    } finally {
      setCarregando(false);
    }
  }, [tipo, pagina]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function irParaAba(novoTipo: TipoRanking) {
    router.replace(`/dashboard/ranking?tab=${novoTipo}&page=1`);
  }

  function irParaPagina(novaPagina: number) {
    router.replace(`/dashboard/ranking?tab=${tipo}&page=${novaPagina}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 rounded-xl border border-[#F3B43F]/30 bg-[#292018]/80 p-2">
        {ABAS.map((aba) => (
          <button
            key={aba.tipo}
            type="button"
            onClick={() => irParaAba(aba.tipo)}
            className={`rounded-lg px-3 py-1.5 font-imFeel text-sm transition sm:text-base ${
              tipo === aba.tipo
                ? "bg-[#F3B43F] text-black"
                : "bg-black/20 text-white/70 hover:bg-black/30 hover:text-white"
            }`}
          >
            {aba.label}
          </button>
        ))}
      </div>

      {carregando && (
        <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-8 text-center text-white/70">
          Carregando ranking...
        </div>
      )}

      {!carregando && erro && (
        <div className="rounded-2xl border-2 border-red-800/60 bg-red-950/40 p-8 text-center text-red-200">
          {erro}
        </div>
      )}

      {!carregando && !erro && dados && (
        <>
          <MinhaPosicaoBox tipo={tipo} minhaPosicao={dados.minhaPosicao} />

          {dados.itens.length === 0 ? (
            <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-8 text-center text-white/70">
              Ninguém classificado ainda nesta categoria.
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-4 text-white shadow-lg">
              <div className="flex flex-col divide-y divide-white/10">
                {dados.itens.map((item) => {
                  const destaqueTop3 = item.posicao <= 3 ? ESTILO_TOP3[item.posicao - 1] : "";
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 ${destaqueTop3}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 text-center font-imFeel text-lg text-white/60">
                          #{item.posicao}
                        </span>
                        {typeof item.online === "boolean" && <IndicadorOnline online={item.online} />}
                        <p className="font-bold text-[#F3B43F]">{item.nome}</p>
                      </div>

                      <div className="text-right text-sm">
                        <p className="font-bold text-white">{valorPrincipal(tipo, item)}</p>
                        {tipo === "pvp" && (
                          <p className="text-xs text-white/60">
                            {item.vitorias}V · {item.derrotas}D · Saldo: {item.saldo! >= 0 ? "+" : ""}
                            {item.saldo} · {item.combates} combates
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {dados.totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-3 text-white">
              <button
                type="button"
                disabled={pagina <= 1}
                onClick={() => irParaPagina(pagina - 1)}
                className="rounded-lg border border-[#F3B43F]/50 px-3 py-1 text-sm font-bold text-[#F3B43F] disabled:opacity-40"
              >
                ← Anterior
              </button>
              <span className="text-sm text-white/70">
                Página {dados.pagina} de {dados.totalPaginas}
              </span>
              <button
                type="button"
                disabled={pagina >= dados.totalPaginas}
                onClick={() => irParaPagina(pagina + 1)}
                className="rounded-lg border border-[#F3B43F]/50 px-3 py-1 text-sm font-bold text-[#F3B43F] disabled:opacity-40"
              >
                Próxima →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MinhaPosicaoBox({
  tipo,
  minhaPosicao,
}: {
  tipo: TipoRanking;
  minhaPosicao: RankingResponse["minhaPosicao"];
}) {
  if (!minhaPosicao) return null;

  if (tipo === "pvp") {
    const posicaoPvp = minhaPosicao as MinhaPosicaoPvp;
    return (
      <div className="rounded-xl border border-[#F3B43F]/40 bg-black/30 p-3 text-white">
        <p className="text-xs font-bold uppercase tracking-wide text-[#F3B43F]/80">Sua posição</p>
        {posicaoPvp.elegivel ? (
          <>
            <p className="font-imFeel text-2xl">#{posicaoPvp.posicao}</p>
            <p className="text-xs text-white/60">
              Pontuação: {posicaoPvp.pontuacao} · {posicaoPvp.vitorias}V · {posicaoPvp.derrotas}D · Saldo:{" "}
              {posicaoPvp.saldo! >= 0 ? "+" : ""}
              {posicaoPvp.saldo}
            </p>
          </>
        ) : (
          <p className="text-sm text-white/70">{posicaoPvp.motivo}</p>
        )}
      </div>
    );
  }

  if (tipo === "guild") {
    const posicaoGuilda = minhaPosicao as MinhaPosicaoGuilda;
    return (
      <div className="rounded-xl border border-[#F3B43F]/40 bg-black/30 p-3 text-white">
        <p className="text-xs font-bold uppercase tracking-wide text-[#F3B43F]/80">Sua guilda</p>
        {posicaoGuilda.posicao ? (
          <p className="font-imFeel text-2xl">#{posicaoGuilda.posicao}</p>
        ) : (
          <p className="text-sm text-white/70">{posicaoGuilda.motivo ?? "Sem posição no momento."}</p>
        )}
      </div>
    );
  }

  const posicaoSimples = minhaPosicao as MinhaPosicaoNivelGoldForja;
  return (
    <div className="rounded-xl border border-[#F3B43F]/40 bg-black/30 p-3 text-white">
      <p className="text-xs font-bold uppercase tracking-wide text-[#F3B43F]/80">Sua posição</p>
      {posicaoSimples.posicao ? (
        <p className="font-imFeel text-2xl">#{posicaoSimples.posicao}</p>
      ) : (
        <p className="text-sm text-white/70">Sem posição no momento.</p>
      )}
    </div>
  );
}
