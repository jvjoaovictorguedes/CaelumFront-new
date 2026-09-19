"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { useCharacter } from "@/contexts/CharacterContext";

interface ItemApi {
  id: number;
  nome: string;
  tipo_item: string;
  raridade: string;
}

interface ListingApi {
  id: number;
  quantidade: number;
  preco_unitario: number;
  status: "Ativo" | "Vendido" | "Cancelado";
  item: ItemApi;
  vendedor?: { id: number; nome: string };
  // Inventário v2 — só preenchido quando o anúncio é de equipamento.
  instancia?: { id: number; refinamento: number } | null;
}

interface InventarioEntry {
  id_personagem_inventario: number;
  quantidade: number;
  Item: ItemApi;
}

// Inventário v2 — equipamento não empilha mais, cada instância tem seu
// próprio refinamento e é anunciada individualmente (nunca por
// "quantidade").
interface InstanciaApi {
  id: number;
  id_item: number;
  nome: string;
  tipo_item: string;
  raridade: string;
  refinamento: number;
}

// Item "vendável" unificado — vem de um stack (Material/Consumível/...)
// ou de uma instância de equipamento solta no inventário.
interface ItemVendavel {
  chave: string;
  id_item: number;
  id_instancia?: number;
  nome: string;
  raridade: string;
  tipo_item: string;
  quantidadeMaxima: number;
  refinamento?: number;
}

const CORES_RARIDADE: Record<string, string> = {
  Comum: "text-gray-300",
  Incomum: "text-green-400",
  Raro: "text-blue-400",
  Epico: "text-purple-400",
  Lendario: "text-orange-400",
  Mitico: "text-red-400",
};

type Aba = "comprar" | "vender" | "meus-anuncios";

export default function MarketClient({ characterId }: { characterId: number }) {
  const [aba, setAba] = useState<Aba>("comprar");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-[#292018]/60 p-2">
        {(
          [
            { chave: "comprar", label: "Comprar" },
            { chave: "vender", label: "Vender" },
            { chave: "meus-anuncios", label: "Meus Anúncios" },
          ] as const
        ).map(({ chave, label }) => (
          <button
            key={chave}
            onClick={() => setAba(chave)}
            className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-colors sm:px-4 sm:text-sm ${
              aba === chave ? "bg-[#BC8418] text-black" : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {aba === "comprar" && <AbaComprar characterId={characterId} />}
      {aba === "vender" && <AbaVender />}
      {aba === "meus-anuncios" && <AbaMeusAnuncios />}
    </div>
  );
}

function AbaComprar({ characterId }: { characterId: number }) {
  const [listings, setListings] = useState<ListingApi[] | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [comprando, setComprando] = useState<number | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [filtroNome, setFiltroNome] = useState("");
  const { refreshCharacter } = useCharacter();

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const resp = await axiosInstance.get<{ data?: { listings?: ListingApi[] } }>("/market/listings", {
        params: filtroNome ? { nome: filtroNome } : undefined,
      });
      setListings(resp.data?.data?.listings ?? []);
    } catch (error) {
      console.error("Erro ao carregar anúncios:", error);
      setMensagem("Não foi possível carregar os anúncios.");
    } finally {
      setCarregando(false);
    }
  }, [filtroNome]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function comprar(id: number) {
    if (comprando) return;
    setComprando(id);
    setMensagem("");
    try {
      await axiosInstance.post(`/market/listings/${id}/buy`);
      await Promise.all([carregar(), refreshCharacter()]);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Não foi possível concluir a compra.";
      setMensagem(msg);
    } finally {
      setComprando(null);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={filtroNome}
          onChange={(e) => setFiltroNome(e.target.value)}
          placeholder="Buscar por nome do item..."
          className="min-w-0 flex-1 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-[#F3B43F]"
        />
      </div>

      {mensagem && <p className="mb-3 text-sm text-red-400">{mensagem}</p>}

      {carregando ? (
        <p className="text-sm text-white/60">Carregando anúncios...</p>
      ) : !listings || listings.length === 0 ? (
        <p className="text-sm text-white/60">Nenhum anúncio ativo no momento.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => {
            const souVendedor = listing.vendedor?.id === characterId;
            return (
              <div key={listing.id} className="rounded-xl border border-white/10 bg-[#3a2f24] p-3">
                <p className="font-bold">
                  {listing.item.nome}
                  {listing.instancia ? ` +${listing.instancia.refinamento}` : ""}
                </p>
                <p className={`text-xs font-bold ${CORES_RARIDADE[listing.item.raridade] ?? "text-white/70"}`}>
                  {listing.item.raridade} · {listing.item.tipo_item}
                </p>
                <p className="mt-2 text-sm text-white/70">
                  Vendedor: {listing.vendedor?.nome ?? "?"} ·{" "}
                  {listing.instancia ? "1 unidade" : `Qtd: ${listing.quantidade}`}
                </p>
                <p className="mt-1 text-lg font-bold text-[#F3B43F]">
                  {listing.preco_unitario * listing.quantidade} moedas
                </p>
                <button
                  type="button"
                  onClick={() => comprar(listing.id)}
                  disabled={souVendedor || comprando === listing.id}
                  className="mt-2 w-full rounded-lg bg-[#BC8418] px-3 py-1.5 text-sm font-bold text-black transition hover:bg-[#a5710f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {souVendedor ? "Seu anúncio" : comprando === listing.id ? "Comprando..." : "Comprar"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const TIPOS_NAO_VENDAVEIS = ["QuestItem", "Currencia"];

function AbaVender() {
  const [itens, setItens] = useState<ItemVendavel[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [chaveSelecionada, setChaveSelecionada] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [preco, setPreco] = useState(10);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const carregar = useCallback(async () => {
    try {
      // Inventário v2 — stacks (Material/Consumível/...) e instâncias de
      // equipamento (cada uma com seu refinamento, anunciada uma a uma)
      // vêm juntos aqui.
      const resp = await axiosInstance.get<{
        data?: { stacks?: InventarioEntry[]; equipmentInstances?: InstanciaApi[] };
      }>("/inventory/v2");

      const stacks: ItemVendavel[] = (resp.data?.data?.stacks ?? [])
        .filter((e) => !TIPOS_NAO_VENDAVEIS.includes(e.Item?.tipo_item))
        .map((e) => ({
          chave: `stack-${e.id_personagem_inventario}`,
          id_item: e.Item.id,
          nome: e.Item.nome,
          raridade: e.Item.raridade,
          tipo_item: e.Item.tipo_item,
          quantidadeMaxima: e.quantidade,
        }));

      const instancias: ItemVendavel[] = (resp.data?.data?.equipmentInstances ?? []).map((i) => ({
        chave: `instancia-${i.id}`,
        id_item: i.id_item,
        id_instancia: i.id,
        nome: i.nome,
        raridade: i.raridade,
        tipo_item: i.tipo_item,
        quantidadeMaxima: 1,
        refinamento: i.refinamento,
      }));

      setItens([...stacks, ...instancias]);
    } catch (error) {
      console.error("Erro ao carregar inventário:", error);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function anunciar() {
    const item = itens.find((i) => i.chave === chaveSelecionada);
    if (!item || enviando) return;
    setEnviando(true);
    setMensagem("");
    try {
      await axiosInstance.post("/market/listings", {
        id_item: item.id_item,
        id_instancia: item.id_instancia,
        quantidade: item.id_instancia ? 1 : quantidade,
        preco_unitario: preco,
      });
      setMensagem("Anúncio criado!");
      setChaveSelecionada(null);
      setQuantidade(1);
      setPreco(10);
      await carregar();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Não foi possível criar o anúncio.";
      setMensagem(msg);
    } finally {
      setEnviando(false);
    }
  }

  const itemSelecionado = itens.find((i) => i.chave === chaveSelecionada);

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      <p className="mb-3 text-sm uppercase tracking-widest text-[#F3B43F]">Anunciar um item</p>

      {carregando ? (
        <p className="text-sm text-white/60">Carregando inventário...</p>
      ) : itens.length === 0 ? (
        <p className="text-sm text-white/60">Você não tem itens vendáveis no inventário.</p>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {itens.map((item) => (
              <button
                key={item.chave}
                onClick={() => {
                  setChaveSelecionada(item.chave);
                  setQuantidade(1);
                }}
                className={`rounded-lg border-2 p-2 text-left text-xs transition ${
                  chaveSelecionada === item.chave
                    ? "border-[#F3B43F] bg-[#3a2f24]"
                    : "border-white/10 bg-black/20 hover:border-white/30"
                }`}
              >
                <p className="font-bold">
                  {item.nome}
                  {item.refinamento ? ` +${item.refinamento}` : ""}
                </p>
                <p className="text-white/50">
                  {item.raridade} · {item.id_instancia ? "1 unidade" : `x${item.quantidadeMaxima}`}
                </p>
              </button>
            ))}
          </div>

          {itemSelecionado && (
            <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-3 sm:flex-row sm:items-end">
              {!itemSelecionado.id_instancia && (
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-white/60">
                    Quantidade (máx. {itemSelecionado.quantidadeMaxima})
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={itemSelecionado.quantidadeMaxima}
                    value={quantidade}
                    onChange={(e) =>
                      setQuantidade(Math.max(1, Math.min(itemSelecionado.quantidadeMaxima, Number(e.target.value))))
                    }
                    className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white outline-none focus:border-[#F3B43F]"
                  />
                </div>
              )}
              <div className="flex-1">
                <label className="mb-1 block text-xs text-white/60">Preço por unidade (moedas)</label>
                <input
                  type="number"
                  min={1}
                  value={preco}
                  onChange={(e) => setPreco(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white outline-none focus:border-[#F3B43F]"
                />
              </div>
              <button
                type="button"
                onClick={anunciar}
                disabled={enviando}
                className="rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black transition hover:bg-[#a5710f] disabled:opacity-50"
              >
                {enviando
                  ? "Anunciando..."
                  : `Anunciar por ${preco * (itemSelecionado.id_instancia ? 1 : quantidade)}`}
              </button>
            </div>
          )}
        </>
      )}

      {mensagem && <p className="mt-3 text-sm text-red-400">{mensagem}</p>}
    </div>
  );
}

function AbaMeusAnuncios() {
  const [listings, setListings] = useState<ListingApi[] | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [cancelando, setCancelando] = useState<number | null>(null);
  const [mensagem, setMensagem] = useState("");

  const carregar = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{ data?: { listings?: ListingApi[] } }>("/market/listings/mine");
      setListings(resp.data?.data?.listings ?? []);
    } catch (error) {
      console.error("Erro ao carregar meus anúncios:", error);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function cancelar(id: number) {
    if (cancelando) return;
    setCancelando(id);
    setMensagem("");
    try {
      await axiosInstance.delete(`/market/listings/${id}`);
      await carregar();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Não foi possível cancelar o anúncio.";
      setMensagem(msg);
    } finally {
      setCancelando(null);
    }
  }

  const CORES_STATUS: Record<string, string> = {
    Ativo: "text-[#F3B43F]",
    Vendido: "text-green-400",
    Cancelado: "text-white/40",
  };

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      <p className="mb-3 text-sm uppercase tracking-widest text-[#F3B43F]">Meus anúncios</p>

      {mensagem && <p className="mb-3 text-sm text-red-400">{mensagem}</p>}

      {carregando ? (
        <p className="text-sm text-white/60">Carregando...</p>
      ) : !listings || listings.length === 0 ? (
        <p className="text-sm text-white/60">Você ainda não anunciou nenhum item.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#3a2f24] p-3"
            >
              <div>
                <p className="font-bold">
                  {listing.item.nome}
                  {listing.instancia ? (
                    <span className="text-[#F3B43F]"> +{listing.instancia.refinamento}</span>
                  ) : (
                    <span className="text-white/50"> x{listing.quantidade}</span>
                  )}
                </p>
                <p className="text-xs text-white/60">
                  {listing.instancia ? "1 unidade" : `Qtd: ${listing.quantidade}`} ·{" "}
                  {listing.preco_unitario * listing.quantidade} moedas ·{" "}
                  <span className={CORES_STATUS[listing.status]}>{listing.status}</span>
                </p>
              </div>
              {listing.status === "Ativo" && (
                <button
                  type="button"
                  onClick={() => cancelar(listing.id)}
                  disabled={cancelando === listing.id}
                  className="rounded-lg border border-red-500/60 px-3 py-1 text-xs text-red-300 hover:bg-red-950/40 disabled:opacity-50"
                >
                  {cancelando === listing.id ? "Cancelando..." : "Cancelar"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
