"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { resolveMediaUrl } from "@/utils/media-url";
import { useCharacter } from "@/contexts/CharacterContext";
import { useToast } from "@/contexts/ToastContext";
import { agruparInstancias } from "@/utils/agruparInstancias";

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

// Catálogo (GET /crafting/scrolls) já cruzado com estoque/nível de
// Forja do personagem pelo backend — nunca inferido no cliente por
// heurística de nome de item.
interface Pergaminho {
  id_item: number;
  nome: string;
  bonus_percentual: number;
  nivel_forja_minimo: number;
  quantidade_disponivel: number;
  nivel_forja_suficiente: boolean;
}

interface MaterialPrevia {
  id_item: number;
  quantidade: number;
  papel: string;
  nome: string;
  imagem_url: string | null;
  quantidade_disponivel: number;
}

interface Previa {
  alvo: number;
  chance_percentual: number;
  chance_percentual_sem_pergaminho: number;
  ouro_custo: number;
  materiais: MaterialPrevia[];
  pergaminho_aplicado: { id_item: number; nome: string; bonus_percentual: number } | null;
  pergaminho_erro: string | null;
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

export default function RefinementPanel({ nivelForja, onProgressoMudou }: { nivelForja: number; onProgressoMudou: () => void }) {
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
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { mostrarErro, mostrarSucesso } = useToast();

  const carregar = useCallback(async () => {
    if (!character) return;
    try {
      const [respInstancias, respPergaminhos, respFila] = await Promise.all([
        axiosInstance.get<{ data?: { instancias?: Instancia[] } }>("/crafting/instances"),
        axiosInstance.get<{ data?: { pergaminhos?: Pergaminho[] } }>("/crafting/scrolls"),
        axiosInstance.get<{ data?: { fila?: { Forja?: EntradaFilaForja | null } } }>("/crafting/forge-queue"),
      ]);
      setInstancias(respInstancias.data?.data?.instancias ?? []);
      setPergaminhos(respPergaminhos.data?.data?.pergaminhos ?? []);
      const filaForja = respFila.data?.data?.fila?.Forja ?? null;
      setFila(filaForja);
      setContagem(filaForja?.segundos_restantes ?? 0);
    } catch (error) {
      console.error("Erro ao carregar Refinamento:", error);
      mostrarErro("Não foi possível carregar o Refinamento.");
    } finally {
      setCarregando(false);
    }
  }, [character, mostrarErro]);

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

  // Trocar de equipamento reseta a seleção de pergaminho pra "Nenhum"
  // (spec §7) — sem isso, escolher um pergaminho pra um item e depois
  // trocar de equipamento podia gastar o mesmo pergaminho num item que
  // o jogador nunca quis usá-lo, só porque a seleção ficou "grudada".
  useEffect(() => {
    setPergaminhoEscolhido(null);
  }, [selecionada]);

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
    try {
      await axiosInstance.post("/crafting/refine", {
        id_instancia: selecionada,
        id_item_pergaminho: pergaminhoEscolhido ?? undefined,
      });
      mostrarSucesso("Refinamento iniciado! Volte em instantes pra coletar o resultado.");
      // Fecha o popup na hora — sem isso, o card "Refinando..." lá em
      // cima da tela ficava escondido atrás do popup (que continuava
      // mostrando o botão "Refinar" como se nada tivesse acontecido)
      // até o jogador fechar manualmente.
      setSelecionada(null);
      await carregar();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Não foi possível iniciar o refinamento.";
      mostrarErro(msg);
    } finally {
      setRefinando(false);
    }
  }

  async function coletar() {
    if (coletando) return;
    setColetando(true);
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
      mostrarErro(msg);
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
            {agruparInstancias(instancias).map((grupo) => {
              const instancia = grupo.representante;
              const idAcao = grupo.ids[0];
              const src = resolveMediaUrl(instancia.imagem_url);
              const selecionadaAtual = idAcao === selecionada;
              // Equipar/desequipar não é exigido pra refinar (ver
              // forgeRefinementService — só bloqueia estado "Mercado"),
              // então o grupo mistura livremente cópias equipadas e
              // soltas. O rótulo reflete quantas do grupo estão
              // equipadas, em vez de assumir que a representante fala
              // pelas outras.
              const equipadosNoGrupo = instancias.filter((i) => grupo.ids.includes(i.id) && i.equipada).length;
              const rotuloEquipado =
                equipadosNoGrupo === 0
                  ? ""
                  : equipadosNoGrupo === grupo.quantidade
                    ? "· Equipado"
                    : `· ${equipadosNoGrupo} equipado${equipadosNoGrupo > 1 ? "s" : ""}`;
              return (
                <button
                  key={idAcao}
                  type="button"
                  onClick={() => setSelecionada(idAcao)}
                  className={`flex items-center gap-3 rounded-xl border-2 bg-[#3a2f24] p-3 text-left transition ${
                    selecionadaAtual ? "border-[#F3B43F]" : `${bordaPorQualidade(instancia.raridade)} hover:border-[#F3B43F]/70`
                  } ${marcoVisual(instancia.refinamento)}`}
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#1c150f] transition duration-150 hover:scale-125">
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
                    <p className="truncate text-sm font-bold">
                      {instancia.nome}
                      {grupo.quantidade > 1 && ` (x${grupo.quantidade})`}
                    </p>
                    <p className="text-xs text-white/50">
                      {instancia.raridade} +{instancia.refinamento} {rotuloEquipado}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {instanciaSelecionada && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelecionada(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <p className="font-imFeel text-xl">
                {instanciaSelecionada.nome} +{instanciaSelecionada.refinamento}
              </p>
              <button
                type="button"
                onClick={() => setSelecionada(null)}
                className="shrink-0 rounded-full px-2 text-white/50 hover:text-white"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {erroPrevia && <p className="text-sm text-red-300">{erroPrevia}</p>}

            {!erroPrevia && !previa && <p className="text-sm text-white/60">Calculando...</p>}

            {previa && previa.alvo > 10 && (
              <p className="text-sm text-white/60">Esse equipamento já está no refinamento máximo.</p>
            )}

            {previa && previa.alvo <= 10 && (
              <>
                <p className="text-sm text-white/70">Alvo: +{previa.alvo}</p>
                <p className="text-sm text-white/70">
                  Chance final:{" "}
                  {pergaminhoEscolhido && previa.pergaminho_aplicado ? (
                    <>
                      <span className="text-white/50 line-through">
                        {previa.chance_percentual_sem_pergaminho.toFixed(1)}%
                      </span>{" "}
                      <span className="font-bold text-[#F3B43F]">{previa.chance_percentual.toFixed(1)}%</span>
                    </>
                  ) : (
                    <span className="font-bold">{previa.chance_percentual.toFixed(1)}%</span>
                  )}
                </p>
                <p className="text-sm text-white/70">Ouro necessário: {previa.ouro_custo}</p>

                <p className="mb-1 mt-3 text-xs uppercase tracking-widest text-[#F3B43F]">Materiais necessários</p>
                {previa.materiais.length === 0 ? (
                  <p className="text-xs text-white/50">Nenhum material além do ouro.</p>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {previa.materiais.map((material) => {
                      const suficiente = material.quantidade_disponivel >= material.quantidade;
                      return (
                        <li key={material.id_item} className="flex items-center gap-2 text-xs">
                          <span className="truncate text-white/80">{material.nome}</span>
                          <span className={`ml-auto font-bold ${suficiente ? "text-green-400" : "text-red-400"}`}>
                            {material.quantidade_disponivel}/{material.quantidade}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {pergaminhos.length > 0 && (
                  <div className="mt-3">
                    <label className="text-xs uppercase tracking-widest text-[#F3B43F]">
                      Pergaminho de Melhoria (opcional)
                    </label>
                    <p className="text-[10px] text-white/40">Sua Forja está no nível {nivelForja}.</p>
                    <select
                      value={pergaminhoEscolhido ?? ""}
                      onChange={(e) => setPergaminhoEscolhido(e.target.value ? Number(e.target.value) : null)}
                      className="mt-1 block w-full rounded border border-white/20 bg-black/30 px-2 py-1.5 text-sm text-white"
                    >
                      <option value="">Nenhum</option>
                      {pergaminhos.map((p) => {
                        const semEstoque = p.quantidade_disponivel < 1;
                        const desabilitado = semEstoque || !p.nivel_forja_suficiente;
                        const motivo = !p.nivel_forja_suficiente
                          ? `exige Forja nível ${p.nivel_forja_minimo}`
                          : semEstoque
                            ? "você não tem nenhum"
                            : null;
                        return (
                          <option key={p.id_item} value={p.id_item} disabled={desabilitado}>
                            {p.nome} (+{p.bonus_percentual}%) — {p.quantidade_disponivel}x
                            {motivo ? ` · ${motivo}` : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {previa.pergaminho_aplicado && (
                  <p className="mt-2 rounded-lg border border-[#F3B43F]/40 bg-black/30 px-2 py-1.5 text-xs text-[#F3B43F]">
                    Será consumido: {previa.pergaminho_aplicado.nome} (+{previa.pergaminho_aplicado.bonus_percentual}%)
                  </p>
                )}
                {previa.pergaminho_erro && (
                  <p className="mt-2 rounded-lg border border-red-500/40 bg-red-950/30 px-2 py-1.5 text-xs text-red-300">
                    Esse pergaminho não pode ser usado: {previa.pergaminho_erro}
                  </p>
                )}

                <p className="mt-2 text-xs text-white/50">
                  Em caso de falha: o equipamento permanece +{instanciaSelecionada.refinamento}, mas materiais, ouro e
                  pergaminho (se usado) são consumidos mesmo assim.
                </p>

                <button
                  type="button"
                  onClick={refinar}
                  disabled={refinando || Boolean(fila) || Boolean(previa.pergaminho_erro)}
                  className="mt-3 w-full rounded-lg bg-[#F3B43F] px-5 py-1.5 text-sm font-bold text-black transition hover:bg-[#e0a52f] disabled:cursor-not-allowed disabled:bg-black/40 disabled:text-white/50"
                >
                  {fila ? "Posto ocupado" : refinando ? "Iniciando..." : "Refinar"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
