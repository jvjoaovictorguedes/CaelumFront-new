"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { resolveMediaUrl } from "@/utils/media-url";
import { useToast } from "@/contexts/ToastContext";
import { formatarTier } from "@/utils/equipmentTier";

interface IngredienteBlueprint {
  id_item: number;
  quantidade_necessaria: number;
  quantidade_disponivel: number;
  nome_recurso?: string;
  nome_item: string;
  imagem_url?: string | null;
  tipo_insumo: "Barra" | "RecursoExpedicao";
}

type Atributo = "Forca" | "Vitalidade" | "Inteligencia" | "Agilidade" | "Velocidade";

const NOME_ATRIBUTO: Record<Atributo, string> = {
  Forca: "Força",
  Vitalidade: "Vitalidade",
  Inteligencia: "Inteligência",
  Agilidade: "Agilidade",
  Velocidade: "Velocidade",
};

interface PropriedadesArma {
  tipo: "Arma";
  dano_min: number;
  dano_max: number;
  tipo_dano: "Fisico" | "Magico";
  bonus_atributo: Atributo;
  valor_bonus_atributo: number;
}

interface PropriedadesArmadura {
  tipo: "Armadura";
  defesa: number;
  bonus_forca: number;
  bonus_vitalidade: number;
  bonus_inteligencia: number;
  bonus_agilidade: number;
  bonus_velocidade: number;
}

type PropriedadesItem = PropriedadesArma | PropriedadesArmadura | null;

interface VarianteBlueprint {
  qualidade: string;
  qualidade_exibicao: string;
  ingredientes: IngredienteBlueprint[];
  pode_fabricar: boolean;
  chances_percentual: Record<string, number>;
  propriedades: PropriedadesItem;
  tempo_segundos: number;
}

// Atributos do item que essa qualidade vai produzir — tooltip pro
// jogador entender qual blueprint/qualidade vale mais a pena fabricar
// sem precisar já ter o item em mãos.
function AtributosDoItem({ propriedades }: { propriedades: PropriedadesItem }) {
  if (!propriedades) return null;

  if (propriedades.tipo === "Arma") {
    return (
      <ul className="space-y-0.5">
        <li>
          <span className="font-bold text-[#F3B43F]">Dano:</span> {propriedades.dano_min}–{propriedades.dano_max}{" "}
          ({propriedades.tipo_dano === "Fisico" ? "Físico" : "Mágico"})
        </li>
        {propriedades.valor_bonus_atributo > 0 && (
          <li>
            <span className="font-bold text-[#F3B43F]">+{propriedades.valor_bonus_atributo}</span>{" "}
            {NOME_ATRIBUTO[propriedades.bonus_atributo]}
          </li>
        )}
      </ul>
    );
  }

  const bonus: [Atributo, number][] = [
    ["Forca", propriedades.bonus_forca],
    ["Vitalidade", propriedades.bonus_vitalidade],
    ["Inteligencia", propriedades.bonus_inteligencia],
    ["Agilidade", propriedades.bonus_agilidade],
    ["Velocidade", propriedades.bonus_velocidade],
  ];
  return (
    <ul className="space-y-0.5">
      {propriedades.defesa > 0 && (
        <li>
          <span className="font-bold text-[#F3B43F]">Defesa:</span> {propriedades.defesa}
        </li>
      )}
      {bonus
        .filter(([, valor]) => valor > 0)
        .map(([atributo, valor]) => (
          <li key={atributo}>
            <span className="font-bold text-[#F3B43F]">+{valor}</span> {NOME_ATRIBUTO[atributo]}
          </li>
        ))}
    </ul>
  );
}

interface Blueprint {
  id: number;
  nome: string;
  tier_equipamento: number | null;
  categoria_equipamento: string;
  tipo_arma?: string | null;
  nivel_forja_minimo: number;
  imagem_url?: string | null;
  variantes: VarianteBlueprint[];
}

interface EntradaFilaForja {
  id: number;
  slot: string;
  tipo_acao: string;
  referencia: { nome_blueprint?: string; qualidade_material?: string };
  segundos_restantes: number;
  pronto: boolean;
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

const ORDEM_CATEGORIA = ["Arma", "Armadura", "Acessorio1", "Acessorio2"];
const LABEL_CATEGORIA: Record<string, string> = {
  Arma: "Armas",
  Armadura: "Armaduras",
  Acessorio1: "Acessórios",
  Acessorio2: "Acessórios",
};

function agruparPorCategoria(blueprints: Blueprint[]) {
  const grupos = new Map<string, Blueprint[]>();
  for (const blueprint of blueprints) {
    const chave = blueprint.categoria_equipamento;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave)!.push(blueprint);
  }
  return [...grupos.entries()].sort((a, b) => {
    const ia = ORDEM_CATEGORIA.indexOf(a[0]);
    const ib = ORDEM_CATEGORIA.indexOf(b[0]);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
}

// Subseção só faz sentido pra Arma (Espada, Cajado, etc. — vem do
// tipo_arma do item resultado, ver forgeCraftingService.js) — Armadura e
// Acessório não têm variação de "tipo" pra agrupar por baixo.
function agruparPorTipoArma(blueprints: Blueprint[]) {
  const grupos = new Map<string, Blueprint[]>();
  for (const blueprint of blueprints) {
    const chave = blueprint.tipo_arma ?? "Outra";
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave)!.push(blueprint);
  }
  return [...grupos.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function formatarTempo(segundos: number) {
  if (segundos < 60) return `${segundos}s`;
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const min = minutos % 60;
  return min > 0 ? `${horas}h ${min}min` : `${horas}h`;
}

export default function CraftingPanel({ onProgressoMudou }: { nivelForja: number; onProgressoMudou: () => void }) {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [qualidadeSelecionada, setQualidadeSelecionada] = useState<Record<number, string>>({});
  const [fila, setFila] = useState<EntradaFilaForja | null>(null);
  const [contagem, setContagem] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [forjando, setForjando] = useState<number | null>(null);
  const [coletando, setColetando] = useState(false);
  const [secoesFechadas, setSecoesFechadas] = useState<Record<string, boolean>>({});
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { mostrarErro, mostrarSucesso } = useToast();

  const carregar = useCallback(async () => {
    try {
      const [respBlueprints, respFila] = await Promise.all([
        axiosInstance.get<{ data?: { blueprints?: Blueprint[] } }>("/crafting/blueprints"),
        axiosInstance.get<{ data?: { fila?: { Forja?: EntradaFilaForja | null } } }>("/crafting/forge-queue"),
      ]);
      const lista = respBlueprints.data?.data?.blueprints ?? [];
      setBlueprints(lista);
      setQualidadeSelecionada((atual) => {
        const novo = { ...atual };
        for (const bp of lista) {
          if (!novo[bp.id] && bp.variantes[0]) novo[bp.id] = bp.variantes[0].qualidade;
        }
        return novo;
      });
      const filaForja = respFila.data?.data?.fila?.Forja ?? null;
      setFila(filaForja);
      setContagem(filaForja?.segundos_restantes ?? 0);
    } catch (error) {
      console.error("Erro ao carregar Fabricação:", error);
      mostrarErro("Não foi possível carregar a Fabricação.");
    } finally {
      setCarregando(false);
    }
  }, [mostrarErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (intervaloRef.current) clearInterval(intervaloRef.current);
    if (fila && !fila.pronto) {
      intervaloRef.current = setInterval(() => setContagem((atual) => Math.max(0, atual - 1)), 1000);
    }
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [fila]);

  async function forjar(blueprint: Blueprint, variante: VarianteBlueprint) {
    if (forjando || fila) return;
    setForjando(blueprint.id);
    try {
      await axiosInstance.post("/crafting/craft", { id_blueprint: blueprint.id, qualidade: variante.qualidade });
      mostrarSucesso(`Fabricação de ${blueprint.nome} iniciada! Fica pronta em ${formatarTempo(variante.tempo_segundos)}.`);
      await carregar();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Não foi possível iniciar a fabricação.";
      mostrarErro(msg);
    } finally {
      setForjando(null);
    }
  }

  async function coletar() {
    if (coletando) return;
    setColetando(true);
    try {
      const resp = await axiosInstance.post<{ data?: { instancia?: { nome: string; raridade: string } } }>(
        "/crafting/forge-collect",
        { slot: "Forja" },
      );
      const instancia = resp.data?.data?.instancia;
      mostrarSucesso(instancia ? `Você forjou: ${instancia.nome} (${instancia.raridade})!` : "Trabalho coletado!");
      await Promise.all([carregar(), onProgressoMudou()]);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Não foi possível coletar.";
      mostrarErro(msg);
    } finally {
      setColetando(false);
    }
  }

  if (carregando) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        Carregando Fabricação...
      </div>
    );
  }

  const pronto = fila && (fila.pronto || contagem <= 0);

  return (
    <div className="flex flex-col gap-4">
      {fila && (
        <div
          className={`flex flex-col gap-3 rounded-2xl border-2 bg-[#292018]/90 p-5 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between ${
            fila.tipo_acao === "Refinamento" ? "border-[#F3B43F]/60" : "border-[#F3B43F]"
          }`}
        >
          <div>
            <p className="text-xs uppercase tracking-widest text-[#F3B43F]/80">
              {fila.tipo_acao === "Fabricacao" ? "Fabricando" : "Posto de Forja ocupado (Refinamento)"}
            </p>
            <p className="font-bold">{fila.referencia?.nome_blueprint ?? "Trabalho em andamento"}</p>
            <p className="text-sm text-white/60">{pronto ? "Pronto!" : `Fica pronto em ${formatarTempo(contagem)}`}</p>
          </div>
          {fila.tipo_acao === "Fabricacao" && (
            <button
              type="button"
              onClick={coletar}
              disabled={!pronto || coletando}
              className="shrink-0 rounded-lg bg-[#F3B43F] px-5 py-2 text-sm font-bold text-black transition hover:bg-[#e0a52f] disabled:cursor-not-allowed disabled:bg-black/40 disabled:text-white/50"
            >
              {coletando ? "Coletando..." : "Coletar"}
            </button>
          )}
        </div>
      )}

      {blueprints.length === 0 ? (
        <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
          <p className="text-sm text-white/60">Nenhum blueprint disponível ainda.</p>
        </div>
      ) : (
        agruparPorCategoria(blueprints).map(([categoria, blueprintsDaCategoria]) => {
          const fechada = secoesFechadas[categoria] ?? false;
          return (
            <div key={categoria} className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setSecoesFechadas((atual) => ({ ...atual, [categoria]: !fechada }))}
                className="flex items-center gap-2 rounded-xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 px-4 py-2 text-left text-white shadow-xl transition hover:border-[#F3B43F]"
              >
                <span className={`text-xs transition-transform ${fechada ? "-rotate-90" : ""}`}>▼</span>
                <span className="font-imFeel text-lg uppercase tracking-wide text-[#F3B43F]">
                  {LABEL_CATEGORIA[categoria] ?? categoria}
                </span>
                <span className="ml-auto text-xs text-white/50">{blueprintsDaCategoria.length} receita(s)</span>
              </button>

              {!fechada && categoria === "Arma"
                ? agruparPorTipoArma(blueprintsDaCategoria).map(([tipoArma, blueprintsDoTipo]) => (
                    <div key={tipoArma} className="flex flex-col gap-3">
                      <p className="pl-1 text-xs font-bold uppercase tracking-widest text-white/50">
                        {tipoArma}
                      </p>
                      {blueprintsDoTipo.map((blueprint) => renderBlueprintCard(blueprint))}
                    </div>
                  ))
                : !fechada &&
                  blueprintsDaCategoria.map((blueprint) => renderBlueprintCard(blueprint))}
            </div>
          );
        })
      )}
    </div>
  );

  function renderBlueprintCard(blueprint: Blueprint) {
    const qualidadeAtual = qualidadeSelecionada[blueprint.id] ?? blueprint.variantes[0]?.qualidade;
    const variante = blueprint.variantes.find((v) => v.qualidade === qualidadeAtual) ?? blueprint.variantes[0];
    if (!variante) return null;
    const src = resolveMediaUrl(blueprint.imagem_url);

    return (
      <div
        key={blueprint.id}
        className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl"
      >
        <div className="group relative mb-3 flex items-center gap-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 border-[#F3B43F]/60 bg-[#3a2f24]">
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={blueprint.nome} className="h-full w-full object-contain p-1.5" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[#F3B43F]/80">
                {blueprint.nome.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-imFeel text-xl uppercase">{blueprint.nome}</p>
              {formatarTier(blueprint.tier_equipamento) && (
                <span className="rounded-full border border-[#F3B43F]/60 bg-black/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#F3B43F]">
                  {formatarTier(blueprint.tier_equipamento)}
                </span>
              )}
            </div>
            <p className="text-xs text-white/50">Nível mínimo de Forja: {blueprint.nivel_forja_minimo}</p>
          </div>
          {variante.propriedades && (
            <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-52 rounded-md border border-[#F3B43F]/40 bg-black/95 p-2 text-left text-xs opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
              <p className="mb-1 text-white/50">Atributos ({variante.qualidade_exibicao}):</p>
              <AtributosDoItem propriedades={variante.propriedades} />
            </div>
          )}
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {blueprint.variantes.map((v) => (
            <button
              key={v.qualidade}
              type="button"
              onClick={() => setQualidadeSelecionada((atual) => ({ ...atual, [blueprint.id]: v.qualidade }))}
              className={`rounded-md border-2 px-3 py-1 text-xs font-bold uppercase transition ${
                v.qualidade === qualidadeAtual
                  ? `${bordaPorQualidade(v.qualidade)} bg-black/40 text-white`
                  : "border-white/10 bg-black/20 text-white/50 hover:border-white/30"
              }`}
            >
              {v.qualidade_exibicao}
            </button>
          ))}
        </div>

        <p className="mb-2 text-xs uppercase tracking-widest text-[#F3B43F]">
          Qualidade dos materiais: {variante.qualidade_exibicao}
        </p>

        <ul className="mb-3 flex flex-col gap-1">
          {variante.ingredientes.map((ingrediente) => {
            const suficiente = ingrediente.quantidade_disponivel >= ingrediente.quantidade_necessaria;
            return (
              <li key={ingrediente.id_item} className="flex items-center gap-2 text-xs">
                <span className="truncate text-white/80">
                  {ingrediente.quantidade_necessaria}x {ingrediente.nome_item}
                </span>
                <span className={`ml-auto font-bold ${suficiente ? "text-green-400" : "text-red-400"}`}>
                  {ingrediente.quantidade_disponivel}/{ingrediente.quantidade_necessaria}
                </span>
              </li>
            );
          })}
        </ul>

        <p className="mb-1 text-xs uppercase tracking-widest text-[#F3B43F]">Suas chances</p>
        <div className="mb-3 flex flex-wrap gap-3 text-xs">
          {Object.entries(variante.chances_percentual).map(([qualidadeResultado, pct]) => (
            <span key={qualidadeResultado} className={bordaPorQualidade(qualidadeResultado).replace("border-", "text-")}>
              {qualidadeResultado}: {pct.toFixed(2)}%
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-white/50">Tempo: {formatarTempo(variante.tempo_segundos)}</p>
          <button
            type="button"
            onClick={() => forjar(blueprint, variante)}
            disabled={!variante.pode_fabricar || forjando === blueprint.id || Boolean(fila)}
            className="rounded-lg bg-[#F3B43F] px-5 py-1.5 text-sm font-bold text-black transition hover:bg-[#e0a52f] disabled:cursor-not-allowed disabled:bg-black/40 disabled:text-white/50"
          >
            {fila ? "Posto ocupado" : forjando === blueprint.id ? "Iniciando..." : "Forjar"}
          </button>
        </div>
      </div>
    );
  }
}
