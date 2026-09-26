"use client";

// Caldeirão (Alquimia) — spec §23: aba dentro da Forja, com progresso
// PRÓPRIO (independente do nível de Forja), filtros por categoria,
// estoque "possui/necessário" por ingrediente, seletor de lote e
// feedback pós-craft sem reload completo. Toda a matemática (custo,
// máximo produzível, XP, nível) é AUTORITATIVA do backend — este
// componente só exibe o que a API devolve e reconsulta depois do craft.
import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { resolveMediaUrl } from "@/utils/media-url";
import { useToast } from "@/contexts/ToastContext";

interface ProgressoAlquimia {
  nivel: number;
  experiencia: number;
  xp_para_proximo_nivel: number | null;
  nivel_maximo: number;
  total_produzido: number;
}

interface IngredienteReceita {
  id_item: number;
  nome: string | null;
  imagem_url: string | null;
  raridade: string | null;
  quantidade_necessaria: number;
  quantidade_possuida: number;
}

interface ReceitaAlquimia {
  id: number;
  key: string;
  nome: string;
  descricao: string | null;
  categoria: "POCAO" | "ANTIDOTO" | "TONICO" | "ELIXIR" | "PREPARADO";
  nivel_alquimia_minimo: number;
  xp_alquimia: number;
  custo_ouro: number;
  modo_desbloqueio: "NIVEL" | "DESCOBERTA";
  resultado: {
    id_item: number;
    nome: string | null;
    imagem_url: string | null;
    raridade: string | null;
    negociavel_mercado: boolean | null;
    quantidade: number;
  };
  ingredientes: IngredienteReceita[];
  desbloqueada: boolean;
  motivo_bloqueio: string | null;
  max_craftable: number;
}

const FILTROS: { chave: ReceitaAlquimia["categoria"] | "TODAS"; rotulo: string }[] = [
  { chave: "TODAS", rotulo: "Todas" },
  { chave: "POCAO", rotulo: "Poções" },
  { chave: "ANTIDOTO", rotulo: "Antídotos" },
  { chave: "TONICO", rotulo: "Tônicos" },
  { chave: "ELIXIR", rotulo: "Elixires" },
  { chave: "PREPARADO", rotulo: "Preparados" },
];

const BORDA_RARIDADE: Record<string, string> = {
  comum: "border-[#9CA3AF]/80",
  incomum: "border-[#4ADE80]/80",
  raro: "border-[#60A5FA]/80",
  epico: "border-[#C084FC]/80",
  lendario: "border-[#FB923C]/80",
  mitico: "border-[#F87171]/80",
};

function bordaPorRaridade(raridade?: string | null) {
  if (!raridade) return BORDA_RARIDADE.comum;
  return BORDA_RARIDADE[raridade.toLowerCase()] ?? BORDA_RARIDADE.comum;
}

function extrairMensagemErro(error: unknown, padrao: string) {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? padrao;
}

export default function CauldronPanel() {
  const [progresso, setProgresso] = useState<ProgressoAlquimia | null>(null);
  const [receitas, setReceitas] = useState<ReceitaAlquimia[]>([]);
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["chave"]>("TODAS");
  const [quantidades, setQuantidades] = useState<Record<number, number>>({});
  const [carregando, setCarregando] = useState(true);
  const [preparando, setPreparando] = useState<number | null>(null);
  const { mostrarErro, mostrarSucesso } = useToast();

  const carregar = useCallback(async () => {
    try {
      const [respProgresso, respReceitas] = await Promise.all([
        axiosInstance.get<{ data?: { progresso?: ProgressoAlquimia } }>("/alchemy/progress"),
        axiosInstance.get<{ data?: { receitas?: ReceitaAlquimia[] } }>("/alchemy/recipes"),
      ]);
      setProgresso(respProgresso.data?.data?.progresso ?? null);
      setReceitas(respReceitas.data?.data?.receitas ?? []);
    } catch (error) {
      console.error("Erro ao carregar o Caldeirão:", error);
      mostrarErro("Não foi possível carregar o Caldeirão.");
    } finally {
      setCarregando(false);
    }
  }, [mostrarErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function quantidadeAtual(receita: ReceitaAlquimia) {
    return Math.min(Math.max(1, quantidades[receita.id] ?? 1), Math.max(1, receita.max_craftable));
  }

  function definirQuantidade(receita: ReceitaAlquimia, valor: number) {
    const limite = Math.max(1, receita.max_craftable);
    const clamped = Math.min(Math.max(1, Math.round(valor) || 1), limite);
    setQuantidades((atual) => ({ ...atual, [receita.id]: clamped }));
  }

  async function preparar(receita: ReceitaAlquimia) {
    if (preparando || receita.max_craftable <= 0 || !receita.desbloqueada) return;
    const quantidade = quantidadeAtual(receita);
    setPreparando(receita.id);
    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${receita.id}-${Date.now()}-${Math.random()}`;
      const resp = await axiosInstance.post<{
        data?: { quantidade_produzida: number; xp_ganho: number; subiu_nivel: boolean; nivel_depois: number };
      }>(`/alchemy/recipes/${receita.id}/brew`, { quantity: quantidade, idempotencyKey });
      const dados = resp.data?.data;
      const base = `Preparou ${dados?.quantidade_produzida ?? quantidade}x ${receita.resultado.nome ?? receita.nome}!`;
      mostrarSucesso(
        dados?.subiu_nivel ? `${base} Alquimia subiu para o nível ${dados.nivel_depois}!` : base,
      );
      await carregar();
    } catch (error) {
      mostrarErro(extrairMensagemErro(error, "Não foi possível preparar essa receita."));
    } finally {
      setPreparando(null);
    }
  }

  if (carregando) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        Carregando Caldeirão...
      </div>
    );
  }

  const nivel = progresso?.nivel ?? 1;
  const xp = progresso?.experiencia ?? 0;
  const xpProximo = progresso?.xp_para_proximo_nivel;
  const percentualXp = xpProximo ? Math.min(100, (xp / xpProximo) * 100) : 100;

  const receitasFiltradas = receitas.filter((r) => filtro === "TODAS" || r.categoria === filtro);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm uppercase tracking-widest text-[#F3B43F]">
            Alquimia — Nível {nivel} / {progresso?.nivel_maximo ?? 25}
          </p>
          <p className="text-xs text-white/60">
            XP {xp.toLocaleString("pt-BR")} / {xpProximo ? xpProximo.toLocaleString("pt-BR") : "MAX"}
          </p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/50">
          <div className="h-full bg-[#F3B43F]" style={{ width: `${percentualXp}%` }} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTROS.map((item) => (
          <button
            key={item.chave}
            type="button"
            onClick={() => setFiltro(item.chave)}
            className={`shrink-0 rounded-lg border-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
              filtro === item.chave
                ? "border-[#F3B43F] bg-[#F3B43F] text-black"
                : "border-[#F3B43F]/40 bg-[#292018]/90 text-[#F3B43F] hover:border-[#F3B43F]/70"
            }`}
          >
            {item.rotulo}
          </button>
        ))}
      </div>

      {receitasFiltradas.length === 0 ? (
        <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
          <p className="text-sm text-white/60">Nenhuma receita nessa categoria ainda.</p>
        </div>
      ) : (
        receitasFiltradas.map((receita) => {
          const quantidade = quantidadeAtual(receita);
          const src = resolveMediaUrl(receita.resultado.imagem_url);
          const bloqueada = !receita.desbloqueada;
          const semEstoque = receita.max_craftable <= 0;

          return (
            <div key={receita.id} className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 bg-[#3a2f24] ${bordaPorRaridade(
                    receita.resultado.raridade,
                  )}`}
                >
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={receita.nome} className="h-full w-full object-contain p-1.5" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[#F3B43F]/80">
                      {receita.nome.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-imFeel text-xl uppercase">{receita.nome}</p>
                  <p className="text-xs text-white/50">
                    Resultado: {receita.resultado.nome ?? "?"} x{receita.resultado.quantidade}
                    {" · "}Nível mínimo: {receita.nivel_alquimia_minimo}
                  </p>
                </div>
                {receita.modo_desbloqueio === "DESCOBERTA" && (
                  <span className="shrink-0 rounded-full border border-[#F3B43F]/60 bg-black/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#F3B43F]">
                    Descoberta
                  </span>
                )}
              </div>

              {receita.descricao && <p className="mb-2 text-xs text-white/50">{receita.descricao}</p>}

              {bloqueada && (
                <p className="mb-2 rounded-md border border-red-400/40 bg-red-950/30 px-2 py-1 text-xs text-red-300">
                  {receita.motivo_bloqueio ?? "Receita bloqueada."}
                </p>
              )}

              <ul className="mb-3 flex flex-col gap-1">
                {receita.ingredientes.map((ingrediente) => {
                  const suficiente = ingrediente.quantidade_possuida >= ingrediente.quantidade_necessaria;
                  return (
                    <li key={ingrediente.id_item} className="flex items-center gap-2 text-xs">
                      <span className="truncate text-white/80">
                        {ingrediente.quantidade_necessaria}x {ingrediente.nome ?? `Item #${ingrediente.id_item}`}
                      </span>
                      <span className={`ml-auto font-bold ${suficiente ? "text-green-400" : "text-red-400"}`}>
                        {ingrediente.quantidade_possuida}/{ingrediente.quantidade_necessaria}
                      </span>
                    </li>
                  );
                })}
                {receita.custo_ouro > 0 && (
                  <li className="flex items-center gap-2 text-xs">
                    <span className="text-white/80">Custo em ouro</span>
                    <span className="ml-auto font-bold text-[#F3B43F]">{receita.custo_ouro}/lote</span>
                  </li>
                )}
              </ul>

              <p className="mb-2 text-xs text-white/50">
                Pode produzir: <span className="font-bold text-white">{receita.max_craftable}</span> lote(s) · XP por
                lote: {receita.xp_alquimia}
              </p>

              {!bloqueada && (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => definirQuantidade(receita, quantidade - 1)}
                    disabled={semEstoque}
                    className="h-8 w-8 rounded-md border-2 border-[#F3B43F]/60 text-sm font-bold text-[#F3B43F] disabled:opacity-30"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, receita.max_craftable)}
                    value={semEstoque ? 0 : quantidade}
                    disabled={semEstoque}
                    onChange={(e) => definirQuantidade(receita, Number(e.target.value))}
                    className="h-8 w-16 rounded-md border-2 border-[#F3B43F]/40 bg-black/30 text-center text-sm text-white disabled:opacity-30"
                  />
                  <button
                    type="button"
                    onClick={() => definirQuantidade(receita, quantidade + 1)}
                    disabled={semEstoque}
                    className="h-8 w-8 rounded-md border-2 border-[#F3B43F]/60 text-sm font-bold text-[#F3B43F] disabled:opacity-30"
                  >
                    +
                  </button>
                  {[5, 10].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => definirQuantidade(receita, n)}
                      disabled={semEstoque}
                      className="rounded-md border-2 border-[#F3B43F]/40 px-2 py-1 text-xs font-bold text-[#F3B43F] disabled:opacity-30"
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => definirQuantidade(receita, receita.max_craftable)}
                    disabled={semEstoque}
                    className="rounded-md border-2 border-[#F3B43F]/40 px-2 py-1 text-xs font-bold text-[#F3B43F] disabled:opacity-30"
                  >
                    Máximo
                  </button>
                </div>
              )}

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => preparar(receita)}
                  disabled={bloqueada || semEstoque || preparando === receita.id}
                  className="rounded-lg bg-[#F3B43F] px-5 py-1.5 text-sm font-bold text-black transition hover:bg-[#e0a52f] disabled:cursor-not-allowed disabled:bg-black/40 disabled:text-white/50"
                >
                  {preparando === receita.id ? "Preparando..." : bloqueada ? "Bloqueada" : semEstoque ? "Sem ingredientes" : "Preparar"}
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
