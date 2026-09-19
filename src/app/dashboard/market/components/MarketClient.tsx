"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { useCharacter } from "@/contexts/CharacterContext";

interface WeaponPropertiesApi {
  dano_min: number;
  dano_max: number;
  tipo_dano: "Fisico" | "Magico";
  bonus_atributo: string;
  valor_bonus_atributo: number;
}

interface ArmorPropertiesApi {
  defesa: number;
  bonus_forca: number;
  bonus_vitalidade: number;
  bonus_inteligencia: number;
  bonus_agilidade: number;
  bonus_velocidade: number;
}

interface ItemApi {
  id: number;
  nome: string;
  tipo_item: string;
  raridade: string;
  weaponProperties?: WeaponPropertiesApi | null;
  armorProperties?: ArmorPropertiesApi | null;
}

interface InstanciaListingApi {
  id: number;
  refinamento: number;
  propriedades_efetivas?: (WeaponPropertiesApi & ArmorPropertiesApi) | null;
}

interface ListingApi {
  id: number;
  quantidade_total: number;
  quantidade_restante: number;
  preco_unitario: number;
  status: "Ativo" | "Vendido" | "Cancelado";
  status_exibicao?: "Ativo" | "Vendido" | "Cancelado" | "VendidoParcialmente";
  receita_liquida_acumulada?: number;
  item: ItemApi;
  vendedor?: { id: number; nome: string };
  // Inventário v2 — só preenchido quando o anúncio é de equipamento.
  instancia?: InstanciaListingApi | null;
}

interface InventarioEntry {
  id_personagem_inventario: number;
  quantidade: number;
  // Backend (inventoryV2Controller.formatarStack) devolve os campos do
  // item já achatados no próprio objeto — nunca aninhados em "Item".
  id_item: number;
  nome: string;
  tipo_item: string;
  raridade: string;
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

// Efetivo (dano/defesa) já considerando refinamento — direto do backend
// (spec §11: "não obrigar o comprador a abrir a Forja pra entender o
// item"). Cai pra `null` se o item não for arma nem armadura.
function PropriedadesEquipamento({ item, instancia }: { item: ItemApi; instancia: InstanciaListingApi }) {
  const efetivo = instancia.propriedades_efetivas;
  if (!efetivo) return null;

  if (item.weaponProperties) {
    return (
      <p className="mt-1 text-xs text-white/80">
        <span className="font-bold text-[#F3B43F]">Dano efetivo:</span> {efetivo.dano_min}–{efetivo.dano_max}{" "}
        ({efetivo.tipo_dano === "Fisico" ? "Físico" : "Mágico"})
      </p>
    );
  }

  if (item.armorProperties) {
    const bonusPositivos = (
      [
        ["Força", efetivo.bonus_forca],
        ["Vitalidade", efetivo.bonus_vitalidade],
        ["Inteligência", efetivo.bonus_inteligencia],
        ["Agilidade", efetivo.bonus_agilidade],
        ["Velocidade", efetivo.bonus_velocidade],
      ] as const
    ).filter(([, valor]) => valor > 0);

    return (
      <p className="mt-1 text-xs text-white/80">
        <span className="font-bold text-[#F3B43F]">Defesa efetiva:</span> {efetivo.defesa}
        {bonusPositivos.length > 0 && (
          <>
            {" · "}
            {bonusPositivos.map(([nome, valor]) => `+${valor} ${nome}`).join(", ")}
          </>
        )}
      </p>
    );
  }

  return null;
}

function HistoricoPreco({ idItem, refinamento }: { idItem: number; refinamento?: number }) {
  const [aberto, setAberto] = useState(false);
  const [dados, setDados] = useState<{
    amostras: number;
    preco_medio: number | null;
    preco_mediano: number | null;
    preco_minimo: number | null;
    preco_maximo: number | null;
  } | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function alternar() {
    if (aberto) {
      setAberto(false);
      return;
    }
    setAberto(true);
    if (dados) return;
    setCarregando(true);
    try {
      const resp = await axiosInstance.get<{ data?: typeof dados }>(`/market/price-history/${idItem}`, {
        params: refinamento !== undefined ? { refinamento } : undefined,
      });
      setDados(resp.data?.data ?? null);
    } catch (error) {
      console.error("Erro ao buscar histórico de preço:", error);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="mt-1">
      <button type="button" onClick={alternar} className="text-xs text-white/50 underline hover:text-white/80">
        {aberto ? "Ocultar histórico de preço" : "Ver histórico de preço"}
      </button>
      {aberto && (
        <div className="mt-1 rounded-lg border border-white/10 bg-black/30 p-2 text-xs text-white/70">
          {carregando ? (
            "Carregando..."
          ) : !dados || dados.amostras === 0 ? (
            "Sem vendas recentes desse item."
          ) : (
            <>
              Média: {dados.preco_medio} · Mediana: {dados.preco_mediano} · Mín: {dados.preco_minimo} · Máx:{" "}
              {dados.preco_maximo} ({dados.amostras} venda{dados.amostras > 1 ? "s" : ""} recente
              {dados.amostras > 1 ? "s" : ""})
            </>
          )}
        </div>
      )}
    </div>
  );
}

const ORDENACOES = [
  { valor: "price_asc", label: "Preço: menor primeiro" },
  { valor: "price_desc", label: "Preço: maior primeiro" },
  { valor: "date_desc", label: "Mais recentes" },
  { valor: "refinement_desc", label: "Refinamento: maior primeiro" },
] as const;

function AbaComprar({ characterId }: { characterId: number }) {
  const [listings, setListings] = useState<ListingApi[] | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [comprando, setComprando] = useState<number | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [quantidades, setQuantidades] = useState<Record<number, number>>({});

  const [filtroNome, setFiltroNome] = useState("");
  const [precoMin, setPrecoMin] = useState("");
  const [precoMax, setPrecoMax] = useState("");
  const [refinamentoMin, setRefinamentoMin] = useState("");
  const [ordenar, setOrdenar] = useState<string>("price_asc");
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const LIMITE_POR_PAGINA = 12;

  const { refreshCharacter } = useCharacter();

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const resp = await axiosInstance.get<{
        data?: { listings?: ListingApi[]; totalPaginas?: number };
      }>("/market/listings", {
        params: {
          nome: filtroNome || undefined,
          preco_min: precoMin || undefined,
          preco_max: precoMax || undefined,
          refinamento_min: refinamentoMin || undefined,
          sort: ordenar,
          page: pagina,
          limit: LIMITE_POR_PAGINA,
        },
      });
      const novosListings = resp.data?.data?.listings ?? [];
      setListings(novosListings);
      setTotalPaginas(resp.data?.data?.totalPaginas ?? 1);
      // Quantidade padrão de compra = tudo que resta (compra do anúncio
      // inteiro é o caso mais comum) — o jogador ajusta pra menos se
      // quiser comprar só uma parte do stack.
      setQuantidades((atual) => {
        const novo = { ...atual };
        for (const listing of novosListings) {
          if (novo[listing.id] === undefined) novo[listing.id] = listing.quantidade_restante;
        }
        return novo;
      });
    } catch (error) {
      console.error("Erro ao carregar anúncios:", error);
      setMensagem("Não foi possível carregar os anúncios.");
    } finally {
      setCarregando(false);
    }
  }, [filtroNome, precoMin, precoMax, refinamentoMin, ordenar, pagina]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Qualquer mudança de filtro volta pra página 1 — senão o jogador podia
  // ficar numa página 5 que não existe mais depois de filtrar.
  useEffect(() => {
    setPagina(1);
  }, [filtroNome, precoMin, precoMax, refinamentoMin, ordenar]);

  async function comprar(listing: ListingApi) {
    if (comprando) return;
    const quantidade = listing.instancia ? 1 : Math.max(1, Math.min(listing.quantidade_restante, quantidades[listing.id] ?? listing.quantidade_restante));
    setComprando(listing.id);
    setMensagem("");
    try {
      await axiosInstance.post(`/market/listings/${listing.id}/buy`, { quantidade });
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
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <input
          value={filtroNome}
          onChange={(e) => setFiltroNome(e.target.value)}
          placeholder="Buscar por nome..."
          className="min-w-0 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-[#F3B43F] sm:col-span-3 lg:col-span-1"
        />
        <input
          type="number"
          value={precoMin}
          onChange={(e) => setPrecoMin(e.target.value)}
          placeholder="Preço mín."
          className="min-w-0 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-[#F3B43F]"
        />
        <input
          type="number"
          value={precoMax}
          onChange={(e) => setPrecoMax(e.target.value)}
          placeholder="Preço máx."
          className="min-w-0 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-[#F3B43F]"
        />
        <input
          type="number"
          min={0}
          value={refinamentoMin}
          onChange={(e) => setRefinamentoMin(e.target.value)}
          placeholder="Refinamento mín."
          className="min-w-0 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-[#F3B43F]"
        />
        <select
          value={ordenar}
          onChange={(e) => setOrdenar(e.target.value)}
          className="min-w-0 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white outline-none focus:border-[#F3B43F]"
        >
          {ORDENACOES.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {mensagem && <p className="mb-3 text-sm text-red-400">{mensagem}</p>}

      {carregando ? (
        <p className="text-sm text-white/60">Carregando anúncios...</p>
      ) : !listings || listings.length === 0 ? (
        <p className="text-sm text-white/60">Nenhum anúncio ativo com esses filtros.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => {
              const souVendedor = listing.vendedor?.id === characterId;
              const ehStack = !listing.instancia;
              const quantidadeEscolhida = quantidades[listing.id] ?? listing.quantidade_restante;
              const custoTotal = listing.preco_unitario * (ehStack ? quantidadeEscolhida : 1);

              return (
                <div key={listing.id} className="rounded-xl border border-white/10 bg-[#3a2f24] p-3">
                  <p className="font-bold">
                    {listing.item.nome}
                    {listing.instancia ? ` +${listing.instancia.refinamento}` : ""}
                  </p>
                  <p className={`text-xs font-bold ${CORES_RARIDADE[listing.item.raridade] ?? "text-white/70"}`}>
                    {listing.item.raridade} · {listing.item.tipo_item}
                  </p>
                  {listing.instancia && <PropriedadesEquipamento item={listing.item} instancia={listing.instancia} />}
                  <p className="mt-2 text-sm text-white/70">
                    Vendedor: {listing.vendedor?.nome ?? "?"} ·{" "}
                    {ehStack ? `Restam: ${listing.quantidade_restante}` : "1 unidade"}
                  </p>

                  {ehStack && listing.quantidade_restante > 1 && (
                    <div className="mt-2 flex items-center gap-2">
                      <label className="text-xs text-white/60">Qtd:</label>
                      <input
                        type="number"
                        min={1}
                        max={listing.quantidade_restante}
                        value={quantidadeEscolhida}
                        onChange={(e) =>
                          setQuantidades((atual) => ({
                            ...atual,
                            [listing.id]: Math.max(1, Math.min(listing.quantidade_restante, Number(e.target.value) || 1)),
                          }))
                        }
                        className="w-20 rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm text-white outline-none focus:border-[#F3B43F]"
                      />
                    </div>
                  )}

                  <p className="mt-1 text-lg font-bold text-[#F3B43F]">{custoTotal} moedas</p>

                  <HistoricoPreco idItem={listing.item.id} refinamento={listing.instancia?.refinamento} />

                  <button
                    type="button"
                    onClick={() => comprar(listing)}
                    disabled={souVendedor || comprando === listing.id}
                    className="mt-2 w-full rounded-lg bg-[#BC8418] px-3 py-1.5 text-sm font-bold text-black transition hover:bg-[#a5710f] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {souVendedor ? "Seu anúncio" : comprando === listing.id ? "Comprando..." : "Comprar"}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina <= 1}
              className="rounded-lg border border-white/20 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="text-sm text-white/70">
              Página {pagina} de {totalPaginas}
            </span>
            <button
              type="button"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina >= totalPaginas}
              className="rounded-lg border border-white/20 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </>
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
        .filter((e) => !TIPOS_NAO_VENDAVEIS.includes(e.tipo_item))
        .map((e) => ({
          chave: `stack-${e.id_personagem_inventario}`,
          id_item: e.id_item,
          nome: e.nome,
          raridade: e.raridade,
          tipo_item: e.tipo_item,
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
    VendidoParcialmente: "text-yellow-400",
    Vendido: "text-green-400",
    Cancelado: "text-white/40",
  };
  const ROTULOS_STATUS: Record<string, string> = {
    Ativo: "Ativo",
    VendidoParcialmente: "Vendido parcialmente",
    Vendido: "Vendido",
    Cancelado: "Cancelado",
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
          {listings.map((listing) => {
            const rotuloStatus = listing.status_exibicao ?? listing.status;
            const ehStack = !listing.instancia;
            return (
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
                      <span className="text-white/50">
                        {" "}
                        {listing.quantidade_restante}/{listing.quantidade_total}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-white/60">
                    {ehStack
                      ? `Restam ${listing.quantidade_restante} de ${listing.quantidade_total}`
                      : "1 unidade"}{" "}
                    · {listing.preco_unitario} moedas/un ·{" "}
                    <span className={CORES_STATUS[rotuloStatus]}>{ROTULOS_STATUS[rotuloStatus]}</span>
                  </p>
                  {(listing.receita_liquida_acumulada ?? 0) > 0 && (
                    <p className="text-xs text-green-400">
                      Receita líquida acumulada: {listing.receita_liquida_acumulada} moedas
                    </p>
                  )}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
