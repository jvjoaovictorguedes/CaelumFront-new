"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { resolveMediaUrl } from "@/utils/media-url";

interface EvolucaoApi {
  id: number;
  nome: string;
  descricao: string;
  natureza_magica: string;
  nivel_necessario: number;
  custo: number;
  bonus_forca: number;
  bonus_vitalidade: number;
  bonus_agilidade: number;
  bonus_inteligencia: number;
  bonus_velocidade: number;
  poder_concedido: { id: number; nome: string; tipo_poder: string } | null;
  id_evolucao_pre_requisito: number | null;
  imagem_url?: string | null;
  comprada: boolean;
  pode_comprar: boolean;
  pre_requisito_atendido: boolean;
  nivel_atendido: boolean;
  dinheiro_suficiente: boolean;
}

const LABEL_ATRIBUTO: Record<string, string> = {
  bonus_forca: "Força",
  bonus_vitalidade: "Vitalidade",
  bonus_agilidade: "Agilidade",
  bonus_inteligencia: "Inteligência",
  bonus_velocidade: "Velocidade",
};

function BonusDaEvolucao({ evolucao }: { evolucao: EvolucaoApi }) {
  const bonus = (
    ["bonus_forca", "bonus_vitalidade", "bonus_agilidade", "bonus_inteligencia", "bonus_velocidade"] as const
  )
    .filter((campo) => evolucao[campo] > 0)
    .map((campo) => `+${evolucao[campo]} ${LABEL_ATRIBUTO[campo]}`);

  if (evolucao.poder_concedido) bonus.push(`poder "${evolucao.poder_concedido.nome}"`);
  if (bonus.length === 0) return null;
  return <p className="text-xs text-white/60">Concede: {bonus.join(" · ")}</p>;
}

function EvolucaoThumb({ evolucao }: { evolucao: EvolucaoApi }) {
  const src = resolveMediaUrl(evolucao.imagem_url);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={evolucao.nome} className="h-full w-full rounded-lg object-cover" />
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center rounded-lg text-lg font-bold text-[#F3B43F]/80">
      {evolucao.nome.charAt(0).toUpperCase()}
    </div>
  );
}

function motivoBloqueio(evolucao: EvolucaoApi) {
  if (!evolucao.pre_requisito_atendido) return "Requer a evolução anterior desta árvore";
  if (!evolucao.nivel_atendido) return `Requer nível ${evolucao.nivel_necessario}`;
  if (!evolucao.dinheiro_suficiente) return "Moedas insuficientes";
  return null;
}

export default function EvolutionsPanel({ characterId }: { characterId: number }) {
  const [naturezaMagica, setNaturezaMagica] = useState<string | null>(null);
  const [evolucoes, setEvolucoes] = useState<EvolucaoApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [processandoId, setProcessandoId] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{
        data?: { natureza_magica?: string; evolucoes?: EvolucaoApi[] };
      }>(`/characters/${characterId}/evolutions`);
      setNaturezaMagica(resp.data?.data?.natureza_magica ?? null);
      setEvolucoes(resp.data?.data?.evolucoes ?? []);
    } catch (error) {
      console.error("Erro ao carregar evoluções:", error);
      setMensagem("Não foi possível carregar as evoluções.");
    } finally {
      setCarregando(false);
    }
  }, [characterId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function comprar(evolucao: EvolucaoApi) {
    if (processandoId) return;
    setProcessandoId(evolucao.id);
    setMensagem("");
    try {
      await axiosInstance.post(`/characters/${characterId}/evolutions/${evolucao.id}/purchase`);
      await carregar();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Não foi possível adquirir essa evolução.";
      setMensagem(msg);
    } finally {
      setProcessandoId(null);
    }
  }

  if (carregando) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        Carregando evoluções...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      <p className="mb-1 text-sm uppercase tracking-widest text-[#F3B43F]">Evoluções</p>
      <p className="mb-4 text-xs text-white/50">
        {naturezaMagica
          ? `Caminho de evolução da sua natureza mágica (${naturezaMagica}) — use moedas pra desbloquear novos estágios, cada um exigindo o anterior.`
          : "Caminho de evolução de acordo com a sua natureza mágica."}
      </p>

      {mensagem && <p className="mb-3 text-sm text-red-400">{mensagem}</p>}

      {evolucoes.length === 0 && (
        <p className="text-sm text-white/60">
          Nenhuma evolução cadastrada ainda para a sua classe e natureza mágica.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {evolucoes.map((evolucao) => {
          const bloqueio = motivoBloqueio(evolucao);
          return (
            <div
              key={evolucao.id}
              className={`flex items-center gap-3 rounded-xl border p-3 ${
                evolucao.comprada
                  ? "border-green-500/50 bg-[#3a2f24]"
                  : evolucao.pode_comprar
                    ? "border-[#F3B43F]/40 bg-[#3a2f24]"
                    : "border-white/10 bg-black/20 opacity-70"
              }`}
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                <EvolucaoThumb evolucao={evolucao} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-imFeel text-lg">{evolucao.nome}</span>
                  <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/60">
                    Nível {evolucao.nivel_necessario} · {evolucao.custo} moedas
                  </span>
                  {evolucao.comprada && (
                    <span className="rounded bg-green-900/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-green-300">
                      Adquirida
                    </span>
                  )}
                  {!evolucao.comprada && bloqueio && (
                    <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-red-300">
                      {bloqueio}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-white/80">{evolucao.descricao}</p>
                <BonusDaEvolucao evolucao={evolucao} />
              </div>

              <div className="shrink-0">
                {evolucao.comprada ? (
                  <span className="text-xs text-green-400">✓</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => comprar(evolucao)}
                    disabled={!evolucao.pode_comprar || processandoId === evolucao.id}
                    className="rounded-lg bg-[#F3B43F] px-3 py-1 text-xs font-bold text-black transition hover:bg-[#e0a52f] disabled:cursor-not-allowed disabled:bg-black/40 disabled:text-white/50"
                  >
                    Comprar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
