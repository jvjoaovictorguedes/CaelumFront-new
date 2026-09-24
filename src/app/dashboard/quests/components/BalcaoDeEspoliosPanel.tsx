"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { resolveMediaUrl } from "@/utils/media-url";
import { useCharacter } from "@/contexts/CharacterContext";

type SubAba = "Vender" | "Encomendas";

interface ItemInfo {
  id: number;
  nome: string;
  raridade: string;
  imagem_url: string | null;
  valor_venda: number;
}

interface EspolioApi {
  item: ItemInfo;
  quantidade_inventario: number;
  quantidade_reservada: number;
  protegido_venda: boolean;
  quantidade_vendavel: number;
}

interface ReputacaoApi {
  points: number;
  level: number;
  roman: string;
  name: string;
  nextLevelAt: number | null;
  rewardMultiplier: number;
}

interface EncomendaApi {
  id: number;
  ordem: number;
  item: ItemInfo | null;
  quantidade_exigida: number;
  valor_unitario_snapshot: number;
  valor_base: number;
  concluida: boolean;
  concluida_em: string | null;
  ouro_pago: number | null;
  reputacao_paga: number | null;
}

interface EncomendasApi {
  serverTime: string;
  reputation: ReputacaoApi;
  rotation: { startedAt: string; endsAt: string; completed: number; total: number; setBonusClaimed: boolean };
  orders: EncomendaApi[];
}

const CORES_RARIDADE: Record<string, string> = {
  Comum: "border-white/20",
  Incomum: "border-green-500/60",
  Raro: "border-blue-500/60",
  Epico: "border-purple-500/60",
  Lendario: "border-orange-500/60",
  Mitico: "border-red-500/60",
};

function gerarIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatarContagem(ms: number) {
  if (ms <= 0) return "renovando...";
  const horas = Math.floor(ms / 3_600_000);
  const minutos = Math.floor((ms % 3_600_000) / 60_000);
  const segundos = Math.floor((ms % 60_000) / 1000);
  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

function ItemThumb({ item }: { item: ItemInfo }) {
  const src = resolveMediaUrl(item.imagem_url);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={item.nome} className="h-full w-full rounded-lg object-contain p-1" />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center rounded-lg text-lg font-bold text-[#F3B43F]/80">
      {item.nome.charAt(0).toUpperCase()}
    </div>
  );
}

export default function BalcaoDeEspoliosPanel() {
  const { refreshCharacter } = useCharacter();
  const [subAba, setSubAba] = useState<SubAba>("Vender");
  const [espolios, setEspolios] = useState<EspolioApi[] | null>(null);
  const [encomendas, setEncomendas] = useState<EncomendasApi | null>(null);
  const [quantidades, setQuantidades] = useState<Record<number, number>>({});
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [processando, setProcessando] = useState<string | null>(null);
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const intervalo = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  const carregarEspolios = useCallback(async () => {
    const resp = await axiosInstance.get<{ data?: { espolios?: EspolioApi[] } }>("/adventure-guild/spoils");
    setEspolios(resp.data?.data?.espolios ?? []);
  }, []);

  const carregarEncomendas = useCallback(async () => {
    const resp = await axiosInstance.get<{ data?: EncomendasApi }>("/adventure-guild/spoil-orders");
    setEncomendas(resp.data?.data ?? null);
  }, []);

  const carregarTudo = useCallback(async () => {
    setCarregando(true);
    try {
      await Promise.all([carregarEspolios(), carregarEncomendas()]);
    } catch (error) {
      console.error("Erro ao carregar o Balcão de Espólios:", error);
      setMensagem("Não foi possível carregar o Balcão de Espólios.");
    } finally {
      setCarregando(false);
    }
  }, [carregarEspolios, carregarEncomendas]);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  async function executar(chave: string, acao: () => Promise<void>) {
    if (processando) return;
    setProcessando(chave);
    setMensagem("");
    try {
      await acao();
      await Promise.all([carregarEspolios(), carregarEncomendas(), refreshCharacter()]);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Não foi possível concluir a ação.";
      setMensagem(msg);
    } finally {
      setProcessando(null);
    }
  }

  const alternarProtecao = (itemId: number, protegidoAtual: boolean) =>
    executar(`protect-${itemId}`, async () => {
      await axiosInstance.patch(`/adventure-guild/spoils/${itemId}/preferences`, {
        protegido_venda: !protegidoAtual,
      });
    });

  const definirReserva = (itemId: number, quantidade: number) =>
    executar(`reserve-${itemId}`, async () => {
      await axiosInstance.patch(`/adventure-guild/spoils/${itemId}/preferences`, {
        quantidade_reservada: Math.max(0, quantidade),
      });
    });

  const venderUm = (itemId: number, quantidade: number) =>
    executar(`sell-${itemId}`, async () => {
      await axiosInstance.post("/adventure-guild/spoils/sell", {
        linhas: [{ itemId, quantidade }],
        idempotencyKey: gerarIdempotencyKey(),
      });
    });

  const entregarEncomenda = (orderId: number) =>
    executar(`deliver-${orderId}`, async () => {
      await axiosInstance.post(`/adventure-guild/spoil-orders/${orderId}/deliver`);
    });

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      <p className="mb-1 text-sm uppercase tracking-widest text-[#F3B43F]">Balcão de Espólios</p>
      <p className="mb-4 text-xs text-white/60">
        Venda os espólios que os monstros da Aventura derrubam por um preço fixo, e receba 5
        encomendas pessoais a cada 4 horas — cumprir uma encomenda paga ouro e Reputação
        Comercial, e completar as 5 de uma vez concede um bônus extra. A Reputação Comercial é
        permanente e sobe o multiplicador de prêmio das próximas encomendas.
      </p>

      {encomendas && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#F3B43F]/30 bg-black/30 p-3">
          <div>
            <p className="font-imFeel text-2xl">
              {encomendas.reputation.name} {encomendas.reputation.roman}
            </p>
            <p className="text-xs text-white/60">
              {encomendas.reputation.points.toLocaleString("pt-BR")}
              {encomendas.reputation.nextLevelAt != null
                ? ` / ${encomendas.reputation.nextLevelAt.toLocaleString("pt-BR")}`
                : " (nível máximo)"}
              {` · multiplicador ${encomendas.reputation.rewardMultiplier.toFixed(2)}x`}
            </p>
          </div>
          <span className="rounded-full bg-[#F3B43F] px-3 py-1 text-xs font-bold uppercase text-black">
            Encomendas {encomendas.rotation.completed}/{encomendas.rotation.total}
          </span>
        </div>
      )}

      {mensagem && <p className="mb-3 text-sm text-red-400">{mensagem}</p>}

      <div className="mb-4 flex flex-wrap gap-2">
        {(["Vender", "Encomendas"] as SubAba[]).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setSubAba(a)}
            className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${
              subAba === a ? "bg-[#F3B43F] text-black" : "bg-black/20 text-white/70 hover:text-white"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      {carregando && <p className="text-sm text-white/60">Carregando...</p>}

      {!carregando && subAba === "Vender" && (
        <div className="flex flex-col gap-2">
          {(espolios ?? []).length === 0 && (
            <p className="text-sm text-white/60">Você ainda não tem espólios vendáveis.</p>
          )}
          {(espolios ?? []).map((entrada) => {
            const { item } = entrada;
            const quantidadePedida = Math.min(
              Math.max(1, quantidades[item.id] ?? (entrada.quantidade_vendavel || 1)),
              Math.max(1, entrada.quantidade_vendavel),
            );
            const chaveVender = `sell-${item.id}`;
            const chaveProteger = `protect-${item.id}`;
            const chaveReservar = `reserve-${item.id}`;
            return (
              <div
                key={item.id}
                className={`flex flex-wrap items-center gap-3 rounded-xl border bg-[#3a2f24] p-3 ${
                  CORES_RARIDADE[item.raridade] ?? "border-white/20"
                }`}
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-black/20">
                  <ItemThumb item={item} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{item.nome}</p>
                  <p className="text-[11px] text-white/50">
                    {entrada.quantidade_inventario} no inventário
                    {entrada.quantidade_reservada > 0 && ` · Reservado: ${entrada.quantidade_reservada}`}
                    {` · Vendável: ${entrada.quantidade_vendavel}`}
                  </p>
                  <p className="text-[11px] text-[#F3B43F]">{item.valor_venda} ouro/unid.</p>
                </div>

                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, entrada.quantidade_vendavel)}
                    value={quantidadePedida}
                    disabled={entrada.protegido_venda || entrada.quantidade_vendavel === 0}
                    onChange={(e) =>
                      setQuantidades((prev) => ({ ...prev, [item.id]: Number.parseInt(e.target.value, 10) || 1 }))
                    }
                    className="w-16 rounded-lg bg-black/30 px-2 py-1 text-center text-sm text-white disabled:opacity-40"
                  />
                  <button
                    type="button"
                    onClick={() => venderUm(item.id, quantidadePedida)}
                    disabled={
                      processando === chaveVender || entrada.protegido_venda || entrada.quantidade_vendavel === 0
                    }
                    className="rounded-lg bg-[#F3B43F] px-3 py-1.5 text-xs font-bold text-black transition hover:bg-[#e0a52f] disabled:opacity-50"
                  >
                    {processando === chaveVender ? "Vendendo..." : "Vender"}
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Manter unidades (reserva)"
                    onClick={() => {
                      const valor = window.prompt(
                        `Manter quantas unidades de ${item.nome} fora da venda?`,
                        String(entrada.quantidade_reservada),
                      );
                      if (valor == null) return;
                      const numero = Number.parseInt(valor, 10);
                      if (Number.isNaN(numero)) return;
                      definirReserva(item.id, numero);
                    }}
                    disabled={processando === chaveReservar}
                    className="rounded-lg border border-[#F3B43F]/50 px-2 py-1.5 text-[11px] font-bold text-[#F3B43F] transition hover:bg-[#F3B43F]/10 disabled:opacity-50"
                  >
                    Manter X
                  </button>
                  <button
                    type="button"
                    onClick={() => alternarProtecao(item.id, entrada.protegido_venda)}
                    disabled={processando === chaveProteger}
                    className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold transition disabled:opacity-50 ${
                      entrada.protegido_venda
                        ? "border-red-500 text-red-400 hover:bg-red-900/30"
                        : "border-white/30 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {entrada.protegido_venda ? "Protegido" : "Proteger"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!carregando && subAba === "Encomendas" && encomendas && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-white/60">
            Nova leva de encomendas em: {formatarContagem(new Date(encomendas.rotation.endsAt).getTime() - agora)}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {encomendas.orders.map((encomenda) => {
              const chave = `deliver-${encomenda.id}`;
              return (
                <div
                  key={encomenda.id}
                  className={`rounded-xl border p-3 ${
                    encomenda.concluida ? "border-green-600/60 bg-[#213a24]" : "border-[#F3B43F]/30 bg-[#3a2f24]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {encomenda.item && (
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-black/20">
                        <ItemThumb item={encomenda.item} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-bold">{encomenda.item?.nome ?? "Item"}</p>
                      <p className="text-[11px] text-white/50">
                        Precisa de {encomenda.quantidade_exigida}x
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-[#F3B43F]">
                    ~{Math.floor(encomenda.valor_base * encomendas.reputation.rewardMultiplier)} ouro · +
                    {encomenda.reputacao_paga ?? 5} Reputação
                  </p>
                  {encomenda.concluida ? (
                    <p className="mt-2 text-center text-[11px] font-bold text-green-500">Concluída</p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => entregarEncomenda(encomenda.id)}
                      disabled={processando === chave}
                      className="mt-2 w-full rounded-lg bg-[#F3B43F] px-3 py-1.5 text-xs font-bold text-black transition hover:bg-[#e0a52f] disabled:opacity-50"
                    >
                      {processando === chave ? "Entregando..." : "Entregar"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {encomendas.rotation.setBonusClaimed && (
            <p className="rounded-xl border border-[#F3B43F]/40 bg-black/30 p-3 text-center text-sm font-bold text-[#F3B43F]">
              Bônus de lote (5/5) já resgatado nesta janela — +25 Reputação e ouro extra.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
