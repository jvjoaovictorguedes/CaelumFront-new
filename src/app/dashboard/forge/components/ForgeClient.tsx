"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { resolveMediaUrl } from "@/utils/media-url";
import { useCharacter } from "@/contexts/CharacterContext";

interface IngredienteReceita {
  id_item: number;
  nome: string;
  raridade: string;
  imagem_url?: string | null;
  quantidade_necessaria: number;
  quantidade_disponivel: number;
}

interface Receita {
  id: number;
  tempo_segundos: number;
  ouro_custo: number;
  item: {
    id: number;
    nome: string;
    tipo_item: string;
    raridade: string;
    imagem_url?: string | null;
  };
  ingredientes: IngredienteReceita[];
  pode_forjar: boolean;
}

interface FilaAtiva {
  id_receita: number;
  item: { id: number; nome: string; raridade: string; imagem_url?: string | null };
  pronto_em: string;
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

function bordaPorRaridade(raridade?: string) {
  return BORDA_RARIDADE[(raridade ?? "comum").toLowerCase()] ?? BORDA_RARIDADE.comum;
}

const LABEL_CATEGORIA: Record<string, string> = {
  Capacete: "Capacetes",
  Escudo: "Escudos",
  Armadura: "Armaduras",
  Arma: "Armas",
  Acessorio1: "Anéis",
  Acessorio2: "Colares",
};

function formatarTempo(segundos: number) {
  if (segundos < 60) return `${segundos}s`;
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  return minutosRestantes > 0 ? `${horas}h ${minutosRestantes}min` : `${horas}h`;
}

function ImagemItem({ nome, imagem_url, className = "" }: { nome: string; imagem_url?: string | null; className?: string }) {
  const src = resolveMediaUrl(imagem_url);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={nome} className={`object-contain ${className}`} />;
  }
  return (
    <div className={`flex items-center justify-center text-lg font-bold text-[#F3B43F]/80 ${className}`}>
      {nome.charAt(0).toUpperCase()}
    </div>
  );
}

export default function ForgeClient() {
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [fila, setFila] = useState<FilaAtiva | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [forjando, setForjando] = useState(false);
  const [coletando, setColetando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [contagem, setContagem] = useState(0);
  const { character, refreshCharacter } = useCharacter();
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const carregar = useCallback(async () => {
    try {
      const [respReceitas, respFila] = await Promise.all([
        axiosInstance.get<{ data?: { receitas?: Receita[] } }>("/crafting/recipes"),
        axiosInstance.get<{ data?: { fila?: FilaAtiva | null } }>("/crafting/queue"),
      ]);
      setReceitas(respReceitas.data?.data?.receitas ?? []);
      const filaAtual = respFila.data?.data?.fila ?? null;
      setFila(filaAtual);
      setContagem(filaAtual?.segundos_restantes ?? 0);
    } catch (error) {
      console.error("Erro ao carregar forja:", error);
      setMensagem("Não foi possível carregar a forja.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Contagem regressiva local (1x por segundo) baseada no tempo restante
  // que o servidor mandou — evita ficar chamando /queue toda hora só pra
  // atualizar um número. Quando bate 0, o botão "Coletar" já libera na
  // hora; o clique nele ainda revalida pronto_em no servidor de verdade.
  useEffect(() => {
    if (intervaloRef.current) clearInterval(intervaloRef.current);
    if (fila && !fila.pronto) {
      intervaloRef.current = setInterval(() => {
        setContagem((atual) => Math.max(0, atual - 1));
      }, 1000);
    }
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [fila]);

  async function forjar(receita: Receita) {
    if (forjando || fila) return;
    setForjando(true);
    setMensagem("");
    try {
      const resp = await axiosInstance.post<{ message?: string }>("/crafting/start", {
        id_receita: receita.id,
      });
      setMensagem(resp.data?.message ?? "Forja iniciada!");
      await Promise.all([carregar(), refreshCharacter()]);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Não foi possível iniciar a forja.";
      setMensagem(msg);
    } finally {
      setForjando(false);
    }
  }

  async function coletar() {
    if (coletando) return;
    setColetando(true);
    setMensagem("");
    try {
      const resp = await axiosInstance.post<{ message?: string }>("/crafting/collect");
      setMensagem(resp.data?.message ?? "Item coletado!");
      await Promise.all([carregar(), refreshCharacter()]);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Não foi possível coletar a forja.";
      setMensagem(msg);
    } finally {
      setColetando(false);
    }
  }

  if (carregando) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        Carregando forja...
      </div>
    );
  }

  const categorias = Object.keys(LABEL_CATEGORIA).filter((cat) =>
    receitas.some((receita) => receita.item.tipo_item === cat),
  );
  const pronto = fila && (fila.pronto || contagem <= 0);

  return (
    <div className="flex flex-col gap-4">
      {character && (
        <p className="text-sm text-[#F3B43F]/80">
          Você tem <span className="font-bold">{character.dinheiro}</span> de ouro.
        </p>
      )}

      {mensagem && (
        <p className="rounded-xl border border-[#F3B43F]/40 bg-[#292018]/90 p-3 text-sm text-purple-300">
          {mensagem}
        </p>
      )}

      {fila && (
        <div
          className={`flex flex-col gap-3 rounded-2xl border-2 bg-[#292018]/90 p-5 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between ${bordaPorRaridade(fila.item.raridade)}`}
        >
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 border-[#F3B43F]/70 bg-[#3a2f24]">
              <ImagemItem nome={fila.item.nome} imagem_url={fila.item.imagem_url} className="h-full w-full p-1.5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-[#F3B43F]/80">Forjando</p>
              <p className="font-bold">{fila.item.nome}</p>
              <p className="text-sm text-white/60">
                {pronto ? "Pronto!" : `Fica pronto em ${formatarTempo(contagem)}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={coletar}
            disabled={!pronto || coletando}
            className="shrink-0 rounded-lg bg-[#F3B43F] px-5 py-2 text-sm font-bold text-black transition hover:bg-[#e0a52f] disabled:cursor-not-allowed disabled:bg-black/40 disabled:text-white/50"
          >
            {coletando ? "Coletando..." : "Coletar"}
          </button>
        </div>
      )}

      {receitas.length === 0 ? (
        <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
          <p className="text-sm text-white/60">Nenhuma receita disponível na forja ainda.</p>
        </div>
      ) : (
        categorias.map((categoria) => {
          const doGrupo = receitas.filter((receita) => receita.item.tipo_item === categoria);
          return (
            <div key={categoria} className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
              <p className="mb-3 text-sm uppercase tracking-widest text-[#F3B43F]">
                {LABEL_CATEGORIA[categoria]}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {doGrupo.map((receita) => (
                  <div
                    key={receita.id}
                    className={`flex flex-col gap-2 rounded-xl border-2 bg-[#3a2f24] p-3 ${bordaPorRaridade(receita.item.raridade)}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#1c150f]">
                        <ImagemItem nome={receita.item.nome} imagem_url={receita.item.imagem_url} className="h-full w-full p-1.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{receita.item.nome}</p>
                        <p className="text-xs text-white/50">
                          {receita.item.raridade} · {formatarTempo(receita.tempo_segundos)} · {receita.ouro_custo} ouro
                        </p>
                      </div>
                    </div>

                    <ul className="flex flex-col gap-1">
                      {receita.ingredientes.map((ingrediente) => {
                        const suficiente = ingrediente.quantidade_disponivel >= ingrediente.quantidade_necessaria;
                        return (
                          <li key={ingrediente.id_item} className="flex items-center gap-2 text-xs">
                            <div className="h-6 w-6 shrink-0 overflow-hidden rounded border border-white/10 bg-black/30">
                              <ImagemItem nome={ingrediente.nome} imagem_url={ingrediente.imagem_url} className="h-full w-full p-0.5" />
                            </div>
                            <span className="truncate text-white/80">{ingrediente.nome}</span>
                            <span className={`ml-auto font-bold ${suficiente ? "text-green-400" : "text-red-400"}`}>
                              {ingrediente.quantidade_disponivel}/{ingrediente.quantidade_necessaria}
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    <button
                      type="button"
                      onClick={() => forjar(receita)}
                      disabled={!receita.pode_forjar || forjando || Boolean(fila)}
                      className="mt-1 rounded-lg bg-[#F3B43F] px-4 py-1.5 text-sm font-bold text-black transition hover:bg-[#e0a52f] disabled:cursor-not-allowed disabled:bg-black/40 disabled:text-white/50"
                    >
                      {fila ? "Forja ocupada" : "Forjar"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
