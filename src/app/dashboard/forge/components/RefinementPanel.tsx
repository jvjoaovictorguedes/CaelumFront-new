"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { resolveMediaUrl } from "@/utils/media-url";
import { useCharacter } from "@/contexts/CharacterContext";

interface Instancia {
  id: number;
  id_item: number;
  nome: string;
  raridade: string;
  tipo_item: string;
  imagem_url?: string | null;
  refinamento: number;
  equipada: boolean;
}

interface Pergaminho {
  id_item: number;
  nome: string;
  quantidade: number;
}

interface Previa {
  alvo: number;
  chance_percentual: number;
  ouro_custo: number;
  materiais: { id_item: number; quantidade: number; papel: string }[];
  pergaminho_aplicado: string | null;
}

interface EntradaFilaForja {
  id: number;
  tipo_acao: string;
  referencia: { id_instancia?: number };
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

function marcoVisual(refinamento: number) {
  if (refinamento >= 10) return "shadow-[0_0_20px_rgba(243,180,63,0.9)]";
  if (refinamento >= 7) return "shadow-[0_0_10px_rgba(243,180,63,0.5)]";
  if (refinamento >= 4) return "shadow-[0_0_5px_rgba(243,180,63,0.3)]";
  return "";
}

export default function RefinementPanel({ onProgressoMudou }: { nivelForja: number; onProgressoMudou: () => void }) {
  const { character } = useCharacter();
  const [instancias, setInstancias] = useState<Instancia[]>([]);
  const [pergaminhos, setPergaminhos] = useState<Pergaminho[]>([]);
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [pergaminhoEscolhido, setPergaminhoEscolhido] = useState<number | null>(null);
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [erroPrevia, setErroPrevia] = useState("");
  const [fila, setFila] = useState<EntradaFilaForja | null>(null);
  const [contagem, setContagem] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [refinando, setRefinando] = useState(false);
  const [coletando, setColetando] = useState(false);
  const [ultimoResultado, setUltimoResultado] = useState<{ sucesso: boolean; refinamento_atual: number | null } | null>(
    null,
  );
  const [mensagem, setMensagem] = useState("");
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const carregar = useCallback(async () => {
    if (!character) return;
    try {
      const [respInstancias, respInventario, respFila] = await Promise.all([
        axiosInstance.get<{ data?: { instancias?: Instancia[] } }>("/crafting/instances"),
        axiosInstance.get<{
          data?: { inventory?: { id_item: number; quantidade: number; Item: { nome: string; tipo_item: string } }[] };
        }>("/character-inventory", { params: { characterId: character.id } }),
        axiosInstance.get<{ data?: { fila?: { Forja?: EntradaFilaForja | null } } }>("/crafting/forge-queue"),
      ]);
      setInstancias(respInstancias.data?.data?.instancias ?? []);
      const inventario = respInventario.data?.data?.inventory ?? [];
      setPergaminhos(
        inventario
          .filter((entrada) => entrada.Item.tipo_item === "Consumivel" && entrada.Item.nome.startsWith("Pergaminho"))
          .map((entrada) => ({ id_item: entrada.id_item, nome: entrada.Item.nome, quantidade: entrada.quantidade })),
      );
      const filaForja = respFila.data?.data?.fila?.Forja ?? null;
      setFila(filaForja);
      setContagem(filaForja?.segundos_restantes ?? 0);
    } catch (error) {
      console.error("Erro ao carregar Refinamento:", error);
      setMensagem("Não foi possível carregar o Refinamento.");
    } finally {
      setCarregando(false);
    }
  }, [character]);

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

  const buscarPrevia = useCallback(async () => {
    if (!selecionada) {
      setPrevia(null);
      setErroPrevia("");
      return;
    }
    try {
      const resp = await axiosInstance.get<{ data?: Previa }>("/crafting/refine/preview", {
        params: { id_instancia: selecionada, id_item_pergaminho: pergaminhoEscolhido ?? undefined },
      });
      setPrevia(resp.data?.data ?? null);
      setErroPrevia("");
    } catch (error: unknown) {
      console.error("Erro ao calcular prévia de refinamento:", error);
      setPrevia(null);
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Não foi possível calcular a prévia desse refinamento.";
      setErroPrevia(msg);
    }
  }, [selecionada, pergaminhoEscolhido]);

  useEffect(() => {
    buscarPrevia();
  }, [buscarPrevia]);

  async function refinar() {
    if (!selecionada || refinando || fila) return;
    setRefinando(true);
    setMensagem("");
    try {
      await axiosInstance.post("/crafting/refine", {
        id_instancia: selecionada,
        id_item_pergaminho: pergaminhoEscolhido ?? undefined,
      });
      setMensagem("Refinamento iniciado! Volte em instantes pra coletar o resultado.");
      await carregar();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Não foi possível iniciar o refinamento.";
      setMensagem(msg);
    } finally {
      setRefinando(false);
    }
  }

  async function coletar() {
    if (coletando) return;
    setColetando(true);
    setMensagem("");
    try {
      const resp = await axiosInstance.post<{
        data?: { sucesso: boolean; refinamento_atual: number | null };
      }>("/crafting/forge-collect", { slot: "Forja" });
      const dados = resp.data?.data;
      setUltimoResultado(dados ?? null);
      await Promise.all([carregar(), onProgressoMudou()]);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Não foi possível coletar.";
      setMensagem(msg);
    } finally {
      setColetando(false);
    }
  }

  if (carregando) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        Carregando Refinamento...
      </div>
    );
  }

  const pronto = fila && (fila.pronto || contagem <= 0);
  const instanciaSelecionada = instancias.find((i) => i.id === selecionada) ?? null;

  return (
    <div className="flex flex-col gap-4">
      {mensagem && (
        <p className="rounded-xl border border-[#F3B43F]/40 bg-[#292018]/90 p-3 text-sm text-purple-300">
          {mensagem}
        </p>
      )}

      {ultimoResultado && (
        <div
          className={`rounded-2xl border-2 bg-[#292018]/90 p-5 text-center text-white shadow-xl ${
            ultimoResultado.sucesso ? "border-green-500/60" : "border-red-500/60"
          }`}
        >
          <p className="font-imFeel text-2xl">
            {ultimoResultado.sucesso ? "Refinamento bem-sucedido!" : "Refinamento falhou"}
          </p>
          <p className="text-sm text-white/70">
            {ultimoResultado.sucesso
              ? `O equipamento agora está +${ultimoResultado.refinamento_atual}.`
              : `O equipamento permanece +${ultimoResultado.refinamento_atual}. Materiais, ouro e pergaminho (se usado) foram consumidos.`}
          </p>
        </div>
      )}

      {fila && (
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#F3B43F]/80">
              {fila.tipo_acao === "Refinamento" ? "Refinando" : "Posto de Forja ocupado (Fabricação)"}
            </p>
            <p className="text-sm text-white/60">{pronto ? "Pronto!" : `Fica pronto em ${contagem}s`}</p>
          </div>
          {fila.tipo_acao === "Refinamento" && (
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

      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        <p className="mb-3 text-sm uppercase tracking-widest text-[#F3B43F]">Meus equipamentos forjados</p>
        {instancias.length === 0 ? (
          <p className="text-sm text-white/60">
            Nenhum equipamento forjado ainda — fabrique algo na aba Fabricação primeiro.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {instancias.map((instancia) => {
              const src = resolveMediaUrl(instancia.imagem_url);
              const selecionadaAtual = instancia.id === selecionada;
              return (
                <button
                  key={instancia.id}
                  type="button"
                  onClick={() => setSelecionada(instancia.id)}
                  className={`flex items-center gap-3 rounded-xl border-2 bg-[#3a2f24] p-3 text-left transition ${
                    selecionadaAtual ? "border-[#F3B43F]" : `${bordaPorQualidade(instancia.raridade)} hover:border-[#F3B43F]/70`
                  } ${marcoVisual(instancia.refinamento)}`}
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#1c150f]">
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt={instancia.nome} className="h-full w-full object-contain p-1" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#F3B43F]/80">
                        {instancia.nome.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{instancia.nome}</p>
                    <p className="text-xs text-white/50">
                      {instancia.raridade} +{instancia.refinamento} {instancia.equipada ? "· Equipado" : ""}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {instanciaSelecionada && erroPrevia && (
        <div className="rounded-2xl border-2 border-red-500/60 bg-[#292018]/90 p-5 text-sm text-red-300 shadow-xl">
          {erroPrevia}
        </div>
      )}

      {instanciaSelecionada && previa && (
        <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
          <p className="font-imFeel text-xl">
            {instanciaSelecionada.nome} +{instanciaSelecionada.refinamento}
          </p>

          {previa.alvo > 10 ? (
            <p className="mt-2 text-sm text-white/60">Esse equipamento já está no refinamento máximo.</p>
          ) : (
            <>
              <p className="mt-2 text-sm text-white/70">Alvo: +{previa.alvo}</p>
              <p className="text-sm text-white/70">Chance final: {previa.chance_percentual.toFixed(1)}%</p>
              <p className="text-sm text-white/70">Ouro necessário: {previa.ouro_custo}</p>

              {pergaminhos.length > 0 && (
                <div className="mt-2">
                  <label className="text-xs uppercase tracking-widest text-[#F3B43F]">Pergaminho (opcional)</label>
                  <select
                    value={pergaminhoEscolhido ?? ""}
                    onChange={(e) => setPergaminhoEscolhido(e.target.value ? Number(e.target.value) : null)}
                    className="mt-1 block w-full rounded border border-white/20 bg-black/30 px-2 py-1.5 text-sm text-white"
                  >
                    <option value="">Nenhum</option>
                    {pergaminhos.map((p) => (
                      <option key={p.id_item} value={p.id_item}>
                        {p.nome} (você tem {p.quantidade})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <p className="mt-2 text-xs text-white/50">
                Em caso de falha: o equipamento permanece +{instanciaSelecionada.refinamento}, mas materiais, ouro e
                pergaminho (se usado) são consumidos mesmo assim.
              </p>

              <button
                type="button"
                onClick={refinar}
                disabled={refinando || Boolean(fila)}
                className="mt-3 rounded-lg bg-[#F3B43F] px-5 py-1.5 text-sm font-bold text-black transition hover:bg-[#e0a52f] disabled:cursor-not-allowed disabled:bg-black/40 disabled:text-white/50"
              >
                {fila ? "Posto ocupado" : refinando ? "Iniciando..." : "Refinar"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
