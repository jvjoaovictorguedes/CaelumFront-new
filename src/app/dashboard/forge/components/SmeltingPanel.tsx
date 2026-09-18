"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { resolveMediaUrl } from "@/utils/media-url";

interface OpcaoFundicao {
  id_recurso: number;
  nome_recurso: string;
  qualidade: string;
  desbloqueada: boolean;
  nivel_forja_necessario: number;
  fragmentos_disponiveis: number;
  fragmentos_por_barra: number;
  bonus_chance_percentual: number;
  nome_fragmento: string;
  imagem_fragmento?: string | null;
  nome_barra: string;
  imagem_barra?: string | null;
}

const BORDA_RARIDADE: Record<string, string> = {
  comum: "border-[#9CA3AF]/80",
  incomum: "border-[#4ADE80]/80",
  raro: "border-[#60A5FA]/80",
  epico: "border-[#C084FC]/80",
  lendario: "border-[#FB923C]/80",
  mitico: "border-[#F87171]/80",
};

function bordaPorQualidade(qualidade: string) {
  return BORDA_RARIDADE[qualidade.toLowerCase()] ?? BORDA_RARIDADE.comum;
}

function agruparPorMinerio(opcoes: OpcaoFundicao[]) {
  const grupos = new Map<string, OpcaoFundicao[]>();
  for (const opcao of opcoes) {
    if (!grupos.has(opcao.nome_recurso)) grupos.set(opcao.nome_recurso, []);
    grupos.get(opcao.nome_recurso)!.push(opcao);
  }
  return [...grupos.entries()];
}

export default function SmeltingPanel({
  onProgressoMudou,
}: {
  nivelForja: number;
  onProgressoMudou: () => void;
}) {
  const [opcoes, setOpcoes] = useState<OpcaoFundicao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [fundindo, setFundindo] = useState<string | null>(null);
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});
  const [mensagem, setMensagem] = useState("");
  const [secoesFechadas, setSecoesFechadas] = useState<Record<string, boolean>>({});

  const carregar = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{ data?: { opcoes?: OpcaoFundicao[] } }>("/crafting/smelting");
      setOpcoes(resp.data?.data?.opcoes ?? []);
    } catch (error) {
      console.error("Erro ao carregar opções de Fundição:", error);
      setMensagem("Não foi possível carregar a Fundição.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function chave(opcao: OpcaoFundicao) {
    return `${opcao.id_recurso}-${opcao.qualidade}`;
  }

  async function fundir(opcao: OpcaoFundicao) {
    const k = chave(opcao);
    const quantidade = quantidades[k] ?? 1;
    if (fundindo) return;
    setFundindo(k);
    setMensagem("");
    try {
      const resp = await axiosInstance.post<{
        data?: { barras_produzidas: number; barras_bonus: number; subiu_nivel: boolean };
      }>("/crafting/smelt", {
        id_recurso: opcao.id_recurso,
        qualidade: opcao.qualidade,
        quantidade_barras: quantidade,
      });
      const dados = resp.data?.data;
      setMensagem(
        `Você fundiu ${dados?.barras_produzidas ?? quantidade} barra(s) de ${opcao.nome_recurso}${
          dados?.barras_bonus ? ` (${dados.barras_bonus} de bônus!)` : ""
        }.${dados?.subiu_nivel ? " Sua Forja subiu de nível!" : ""}`,
      );
      await Promise.all([carregar(), onProgressoMudou()]);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Não foi possível fundir.";
      setMensagem(msg);
    } finally {
      setFundindo(null);
    }
  }

  if (carregando) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        Carregando Fundição...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {mensagem && (
        <p className="rounded-xl border border-[#F3B43F]/40 bg-[#292018]/90 p-3 text-sm text-purple-300">
          {mensagem}
        </p>
      )}

      {opcoes.length === 0 ? (
        <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
          <p className="text-sm text-white/60">
            Nenhum fragmento disponível ainda — vá pra Expedição de Mineração buscar minério.
          </p>
        </div>
      ) : (
        agruparPorMinerio(opcoes).map(([mineral, opcoesDoMineral]) => {
          const fechada = secoesFechadas[mineral] ?? false;
          return (
            <div key={mineral} className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setSecoesFechadas((atual) => ({ ...atual, [mineral]: !fechada }))}
                className="flex items-center gap-2 rounded-xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 px-4 py-2 text-left text-white shadow-xl transition hover:border-[#F3B43F]"
              >
                <span className={`text-xs transition-transform ${fechada ? "-rotate-90" : ""}`}>▼</span>
                <span className="font-imFeel text-lg uppercase tracking-wide text-[#F3B43F]">{mineral}</span>
                <span className="ml-auto text-xs text-white/50">
                  {opcoesDoMineral.filter((o) => o.desbloqueada).length}/{opcoesDoMineral.length} qualidades liberadas
                </span>
              </button>

              {!fechada && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {opcoesDoMineral.map((opcao) => {
                    const k = chave(opcao);
                    const quantidade = quantidades[k] ?? 1;
                    const necessario = opcao.fragmentos_por_barra * quantidade;
                    const podeFundir =
                      opcao.desbloqueada && opcao.fragmentos_disponiveis >= necessario && quantidade >= 1;
                    const src = resolveMediaUrl(opcao.desbloqueada ? opcao.imagem_barra : opcao.imagem_fragmento);
                    return (
                      <div
                        key={k}
                        className={`flex flex-col gap-2 rounded-xl border-2 bg-[#3a2f24] p-4 ${
                          opcao.desbloqueada ? bordaPorQualidade(opcao.qualidade) : "border-white/10 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#1c150f]">
                            {src ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={src} alt={opcao.nome_barra} className="h-full w-full object-contain p-1.5" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[#F3B43F]/80">
                                {opcao.nome_recurso.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold uppercase">
                              {opcao.nome_recurso} — {opcao.qualidade}
                            </p>
                            {opcao.desbloqueada ? (
                              <p className="text-xs text-white/50">
                                Fragmentos disponíveis: {opcao.fragmentos_disponiveis} · Necessário:{" "}
                                {opcao.fragmentos_por_barra} por barra
                              </p>
                            ) : (
                              <p className="text-xs text-red-300">
                                Requer nível {opcao.nivel_forja_necessario} de Forja
                              </p>
                            )}
                          </div>
                        </div>

                        {opcao.desbloqueada && (
                          <>
                            <p className="text-xs text-[#F3B43F]/80">
                              Bônus do Forjador: {opcao.bonus_chance_percentual}% de chance por barra de produzir +1
                            </p>

                            <div className="flex items-center gap-2">
                              <label className="text-xs text-white/60">Barras:</label>
                              <input
                                type="number"
                                min={1}
                                value={quantidade}
                                onChange={(e) =>
                                  setQuantidades((atual) => ({
                                    ...atual,
                                    [k]: Math.max(1, Number(e.target.value) || 1),
                                  }))
                                }
                                className="w-16 rounded border border-white/20 bg-black/30 px-2 py-1 text-sm text-white"
                              />
                              <span className="text-xs text-white/50">Custo: {necessario} fragmentos</span>
                            </div>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => fundir(opcao)}
                          disabled={!podeFundir || fundindo === k}
                          className="mt-1 rounded-lg bg-[#F3B43F] px-4 py-1.5 text-sm font-bold text-black transition hover:bg-[#e0a52f] disabled:cursor-not-allowed disabled:bg-black/40 disabled:text-white/50"
                        >
                          {!opcao.desbloqueada
                            ? "Bloqueada"
                            : fundindo === k
                              ? "Fundindo..."
                              : "Fundir"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
