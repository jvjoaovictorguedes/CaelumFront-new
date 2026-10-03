"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { resolveMediaUrl } from "@/utils/media-url";

interface ItemResumo {
  id: number;
  nome: string;
  tipo_item: string;
  raridade: string;
  imagem_url?: string | null;
}

interface LojaResumo {
  id_personagem: number;
  nome_personagem: string | null;
  nome: string;
  descricao: string | null;
  aceita_encomendas: boolean;
}

interface MinhaLoja {
  id: number;
  id_personagem: number;
  nome: string;
  descricao: string | null;
  aceita_encomendas: boolean;
  ativa: boolean;
}

interface ProdutoResumo {
  id: number;
  id_instancia?: number | null;
  quantidade_total: number;
  quantidade_restante: number;
  preco_unitario: number;
  status: string;
  status_exibicao?: string;
  item: ItemResumo;
}

interface PerfilLoja {
  id_personagem: number;
  nome_personagem: string;
  loja: { nome: string; descricao: string | null; aceita_encomendas: boolean; ativa: boolean };
  profissoes: { ferreiro: { nivel: number } | null; alquimista: { nivel: number } | null };
  produtos: ProdutoResumo[];
  estatisticas: {
    produtos_ativos: number;
    vendas_concluidas: number;
    ouro_movimentado: number;
    demandas_concluidas: number;
    encomendas_concluidas: number;
  };
}

interface DemandaApi {
  id: number;
  id_personagem: number;
  id_item: number;
  quantidade_desejada: number;
  quantidade_entregue: number;
  preco_unitario: number;
  ouro_reservado: number;
  status: "Aberta" | "Concluida" | "Cancelada" | "Expirada";
  prazo_expiracao: string;
  item: ItemResumo;
  lojista?: { id: number; nome: string };
}

interface OfertaApi {
  id: number;
  proposal_version: number;
  autor: "Lojista" | "Cliente";
  quantidade: number;
  preco_unitario: number;
  prazo_entrega_dias: number;
  mensagem: string | null;
  status: "Pendente" | "Aceita" | "Superada" | "Recusada";
}

interface EncomendaApi {
  id: number;
  id_personagem_lojista: number;
  id_personagem_cliente: number;
  id_item: number;
  descricao: string | null;
  status:
    | "AguardandoLojista"
    | "AguardandoCliente"
    | "Aceita"
    | "ProntaEntrega"
    | "Concluida"
    | "Recusada"
    | "Cancelada"
    | "Expirada";
  proposal_version: number;
  quantidade_acordada: number | null;
  preco_total_acordado: number | null;
  item: ItemResumo;
  lojista?: { id: number; nome: string };
  cliente?: { id: number; nome: string };
  ofertas?: OfertaApi[];
}

const STATUS_LABEL: Record<string, string> = {
  AguardandoLojista: "Aguardando lojista",
  AguardandoCliente: "Aguardando cliente",
  Aceita: "Aceita — aguardando entrega",
  ProntaEntrega: "Pronta pra entrega",
  Concluida: "Concluída",
  Recusada: "Recusada",
  Cancelada: "Cancelada",
  Expirada: "Expirada",
  Aberta: "Aberta",
};

function TabButton({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
        ativo ? "bg-[#F3B43F] text-black" : "bg-black/30 text-white/70 hover:bg-black/50"
      }`}
    >
      {children}
    </button>
  );
}

function Cartao({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border-2 border-[#F3B43F]/60 bg-[#1b140d]/90 p-4 text-white shadow-lg">{children}</div>;
}

function IconeItem({ item }: { item: ItemResumo }) {
  const imagem = resolveMediaUrl(item.imagem_url);
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/30">
      {imagem ? <img src={imagem} alt={item.nome} className="h-full w-full object-contain p-1" /> : <span>📦</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pedido do jogador: "faltou escolher os produtos que tem do inventário
// pra publicar" e "faltou escolher qualquer coisa que exista no jogo pra
// publicar de demanda, nenhum jogador sabe id do produto" — os dois
// seletores abaixo substituem os antigos campos "ID do item" de texto
// livre nos 3 formulários (produto/demanda/encomenda) desta tela.
// ---------------------------------------------------------------------------

// "Publicar produto" — escolhe entre o que o PRÓPRIO personagem já tem
// no inventário (stacks + instâncias de equipamento), mesmo padrão de
// GET /inventory/v2 + grade de seleção já usado em AbaVender do Mercado
// (MarketClient.tsx), só que publicando na Loja do Aventureiro em vez
// de anunciar direto no Mercado.
interface InventarioEntry {
  id_personagem_inventario: number;
  quantidade: number;
  id_item: number;
  nome: string;
  tipo_item: string;
  raridade: string;
  imagem_url?: string | null;
}

interface InstanciaInventarioApi {
  id: number;
  id_item: number;
  nome: string;
  tipo_item: string;
  raridade: string;
  refinamento: number;
  imagem_url?: string | null;
}

interface ItemDoInventario {
  chave: string;
  id_item: number;
  id_instancia?: number;
  nome: string;
  raridade: string;
  tipo_item: string;
  imagem_url?: string | null;
  quantidadeMaxima: number;
  refinamento?: number;
}

const TIPOS_NAO_PUBLICAVEIS = ["QuestItem", "Currencia"];

function useInventarioPublicavel() {
  const [itens, setItens] = useState<ItemDoInventario[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const resp = await axiosInstance.get<{
        data?: { stacks?: InventarioEntry[]; equipmentInstances?: InstanciaInventarioApi[] };
      }>("/inventory/v2");

      const stacks: ItemDoInventario[] = (resp.data?.data?.stacks ?? [])
        .filter((e) => !TIPOS_NAO_PUBLICAVEIS.includes(e.tipo_item))
        .map((e) => ({
          chave: `stack-${e.id_personagem_inventario}`,
          id_item: e.id_item,
          nome: e.nome,
          raridade: e.raridade,
          tipo_item: e.tipo_item,
          imagem_url: e.imagem_url,
          quantidadeMaxima: e.quantidade,
        }));

      const instancias: ItemDoInventario[] = (resp.data?.data?.equipmentInstances ?? []).map((i) => ({
        chave: `instancia-${i.id}`,
        id_item: i.id_item,
        id_instancia: i.id,
        nome: i.nome,
        raridade: i.raridade,
        tipo_item: i.tipo_item,
        imagem_url: i.imagem_url,
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

  return { itens, carregando, recarregar: carregar };
}

function SeletorItemInventario({
  chaveSelecionada,
  onSelecionar,
  itens,
  carregando,
}: {
  chaveSelecionada: string | null;
  onSelecionar: (item: ItemDoInventario) => void;
  itens: ItemDoInventario[];
  carregando: boolean;
}) {
  if (carregando) return <p className="text-sm text-white/60">Carregando seu inventário...</p>;
  if (itens.length === 0) return <p className="text-sm text-white/60">Você não tem itens publicáveis no inventário.</p>;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {itens.map((item) => (
        <button
          key={item.chave}
          type="button"
          onClick={() => onSelecionar(item)}
          className={`flex items-center gap-2 rounded-lg border-2 p-2 text-left text-xs transition ${
            chaveSelecionada === item.chave
              ? "border-[#F3B43F] bg-[#3a2f24]"
              : "border-white/10 bg-black/20 hover:border-white/30"
          }`}
        >
          <IconeItem item={{ id: item.id_item, nome: item.nome, tipo_item: item.tipo_item, raridade: item.raridade, imagem_url: item.imagem_url }} />
          <div className="min-w-0">
            <p className="truncate font-bold">
              {item.nome}
              {item.refinamento ? ` +${item.refinamento}` : ""}
            </p>
            <p className="text-white/50">
              {item.raridade} · {item.id_instancia ? "1 unidade" : `x${item.quantidadeMaxima}`}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

// "Publicar demanda" / "Nova encomenda" — busca em QUALQUER item do
// jogo (não só o que o jogador já tem), pelo nome. Debounce simples
// (300ms) pra não disparar uma request a cada tecla.
function SeletorItemCatalogo({
  selecionado,
  onSelecionar,
  apenasEstocaveis,
  placeholder = "Digite o nome do item...",
}: {
  selecionado: ItemResumo | null;
  onSelecionar: (item: ItemResumo | null) => void;
  apenasEstocaveis?: boolean;
  placeholder?: string;
}) {
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<ItemResumo[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!termo.trim() || selecionado) {
      setResultados([]);
      return;
    }
    let cancelado = false;
    setBuscando(true);
    const timeout = setTimeout(() => {
      axiosInstance
        .get<{ data?: { itens?: ItemResumo[] } }>("/items/search", {
          params: { q: termo.trim(), apenas_estocaveis: apenasEstocaveis ? "true" : undefined },
        })
        .then((resp) => {
          if (cancelado) return;
          setResultados(resp.data?.data?.itens ?? []);
        })
        .catch((error) => console.error("Erro ao buscar itens:", error))
        .finally(() => {
          if (!cancelado) setBuscando(false);
        });
    }, 300);
    return () => {
      cancelado = true;
      clearTimeout(timeout);
    };
  }, [termo, apenasEstocaveis, selecionado]);

  if (selecionado) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[#F3B43F]/60 bg-black/30 p-2">
        <IconeItem item={selecionado} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{selecionado.nome}</p>
          <p className="text-xs text-white/50">
            {selecionado.raridade} · {selecionado.tipo_item}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onSelecionar(null);
            setTermo("");
          }}
          className="shrink-0 rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
        >
          Trocar
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        value={termo}
        onChange={(e) => {
          setTermo(e.target.value);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        placeholder={placeholder}
        className="w-full rounded bg-black/30 px-2 py-1.5 text-sm"
      />
      {aberto && termo.trim() && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-white/10 bg-[#1b140d] shadow-xl">
          {buscando ? (
            <p className="p-2 text-xs text-white/50">Buscando...</p>
          ) : resultados.length === 0 ? (
            <p className="p-2 text-xs text-white/50">Nenhum item encontrado.</p>
          ) : (
            resultados.map((item) => (
              <button
                key={item.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelecionar(item);
                  setAberto(false);
                }}
                className="flex w-full items-center gap-2 p-2 text-left text-xs hover:bg-white/10"
              >
                <IconeItem item={item} />
                <div className="min-w-0">
                  <p className="truncate font-bold">{item.nome}</p>
                  <p className="text-white/50">
                    {item.raridade} · {item.tipo_item}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function PlayerShopsClient({ characterId }: { characterId: number }) {
  const [aba, setAba] = useState<"lojas" | "minha-loja" | "encomendas">("lojas");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <TabButton ativo={aba === "lojas"} onClick={() => setAba("lojas")}>
          Lojas
        </TabButton>
        <TabButton ativo={aba === "minha-loja"} onClick={() => setAba("minha-loja")}>
          Minha Loja
        </TabButton>
        <TabButton ativo={aba === "encomendas"} onClick={() => setAba("encomendas")}>
          Minhas Encomendas
        </TabButton>
      </div>

      {aba === "lojas" && <AbaLojas characterId={characterId} />}
      {aba === "minha-loja" && <AbaMinhaLoja />}
      {aba === "encomendas" && <AbaEncomendas characterId={characterId} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aba Lojas — descoberta pública + perfil de uma loja + pedir encomenda.
// ---------------------------------------------------------------------------
function AbaLojas({ characterId }: { characterId: number }) {
  const [busca, setBusca] = useState("");
  const [lojas, setLojas] = useState<LojaResumo[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [lojaSelecionada, setLojaSelecionada] = useState<number | null>(null);

  const buscar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await axiosInstance.get("/player-shops", { params: { busca: busca || undefined } });
      setLojas(resposta.data?.data?.lojas ?? []);
    } catch {
      setErro("Não foi possível carregar as lojas.");
    } finally {
      setCarregando(false);
    }
  }, [busca]);

  useEffect(() => {
    buscar();
  }, [buscar]);

  if (lojaSelecionada) {
    return (
      <PerfilLojaView
        characterId={characterId}
        idPersonagemLoja={lojaSelecionada}
        aoVoltar={() => setLojaSelecionada(null)}
      />
    );
  }

  return (
    <Cartao>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && buscar()}
          placeholder="Buscar por nome da loja ou do aventureiro..."
          className="flex-1 rounded-lg bg-black/30 px-3 py-2 text-white placeholder:text-white/40 outline-none"
        />
        <button onClick={buscar} className="rounded-lg bg-[#F3B43F] px-4 py-2 font-semibold text-black">
          Buscar
        </button>
      </div>

      {erro && <p className="mt-3 text-red-400">{erro}</p>}
      {carregando && <p className="mt-3 text-white/60">Carregando...</p>}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {lojas.map((loja) => (
          <button
            key={loja.id_personagem}
            onClick={() => setLojaSelecionada(loja.id_personagem)}
            className="rounded-xl border border-white/10 bg-black/30 p-3 text-left hover:border-[#F3B43F]/60"
          >
            <p className="font-semibold text-[#F3B43F]">{loja.nome}</p>
            <p className="text-sm text-white/60">de {loja.nome_personagem ?? "?"}</p>
            {loja.descricao && <p className="mt-1 text-sm text-white/70 line-clamp-2">{loja.descricao}</p>}
            <p className="mt-1 text-xs text-white/40">
              {loja.aceita_encomendas ? "Aceita encomendas" : "Não aceita encomendas no momento"}
            </p>
          </button>
        ))}
        {!carregando && lojas.length === 0 && <p className="text-white/50">Nenhuma loja encontrada.</p>}
      </div>
    </Cartao>
  );
}

function PerfilLojaView({
  characterId,
  idPersonagemLoja,
  aoVoltar,
}: {
  characterId: number;
  idPersonagemLoja: number;
  aoVoltar: () => void;
}) {
  const [perfil, setPerfil] = useState<PerfilLoja | null>(null);
  const [demandas, setDemandas] = useState<DemandaApi[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarFormEncomenda, setMostrarFormEncomenda] = useState(false);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      const [respPerfil, respDemandas] = await Promise.all([
        axiosInstance.get(`/player-shops/${idPersonagemLoja}`),
        axiosInstance.get("/player-shops/demands"),
      ]);
      setPerfil(respPerfil.data?.data ?? null);
      const todas: DemandaApi[] = respDemandas.data?.data?.demandas ?? [];
      setDemandas(todas.filter((d) => d.lojista?.id === idPersonagemLoja));
    } catch {
      setErro("Não foi possível carregar essa loja.");
    }
  }, [idPersonagemLoja]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <Cartao>
      <button onClick={aoVoltar} className="mb-3 text-sm text-[#F3B43F] hover:underline">
        ← Voltar pra lista de lojas
      </button>

      {erro && <p className="text-red-400">{erro}</p>}
      {!perfil ? (
        <p className="text-white/60">Carregando...</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="font-imFeel text-3xl">{perfil.loja.nome}</h2>
            <p className="text-white/60">de {perfil.nome_personagem}</p>
            {perfil.loja.descricao && <p className="mt-2 text-white/80">{perfil.loja.descricao}</p>}
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/50">
              {perfil.profissoes.ferreiro && <span>Ferreiro nível {perfil.profissoes.ferreiro.nivel}</span>}
              {perfil.profissoes.alquimista && <span>Alquimista nível {perfil.profissoes.alquimista.nivel}</span>}
              <span>{perfil.estatisticas.vendas_concluidas} vendas concluídas</span>
              <span>{perfil.estatisticas.encomendas_concluidas} encomendas concluídas</span>
            </div>
          </div>

          {idPersonagemLoja !== characterId && perfil.loja.aceita_encomendas && (
            <button
              onClick={() => setMostrarFormEncomenda((v) => !v)}
              className="self-start rounded-lg bg-[#F3B43F] px-4 py-2 font-semibold text-black"
            >
              {mostrarFormEncomenda ? "Cancelar" : "Solicitar Encomenda"}
            </button>
          )}
          {mostrarFormEncomenda && (
            <FormularioNovaEncomenda
              idLojista={idPersonagemLoja}
              aoEnviar={() => setMostrarFormEncomenda(false)}
            />
          )}

          <div>
            <h3 className="mb-2 font-semibold text-[#F3B43F]">Produtos ({perfil.produtos.length})</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {perfil.produtos.map((produto) => (
                <CardProdutoCompravel
                  key={produto.id}
                  produto={produto}
                  ehDonoDaLoja={idPersonagemLoja === characterId}
                  aoComprar={carregar}
                />
              ))}
              {perfil.produtos.length === 0 && <p className="text-sm text-white/50">Nenhum produto ativo no momento.</p>}
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-[#F3B43F]">Demandas abertas ({demandas.length})</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {demandas.map((demanda) => (
                <EntregarDemandaCard key={demanda.id} demanda={demanda} aoEntregar={carregar} />
              ))}
              {demandas.length === 0 && <p className="text-sm text-white/50">Nenhuma demanda aberta no momento.</p>}
            </div>
          </div>
        </div>
      )}
    </Cartao>
  );
}

// Pedido do jogador: "não está dando pra comprar nada" — a lista de
// produtos da loja só mostrava nome/quantidade/preço, sem nenhum botão
// de compra. Reaproveita POST /market/listings/:id/buy (o produto da
// loja é um MarketListing de verdade, mesmo endpoint do Mercado Negro).
function CardProdutoCompravel({
  produto,
  ehDonoDaLoja,
  aoComprar,
}: {
  produto: ProdutoResumo;
  ehDonoDaLoja: boolean;
  aoComprar: () => void;
}) {
  const ehEquipamento = Boolean(produto.id_instancia);
  const [quantidade, setQuantidade] = useState(1);
  const [comprando, setComprando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function comprar() {
    setComprando(true);
    setErro(null);
    try {
      await axiosInstance.post(`/market/listings/${produto.id}/buy`, {
        quantidade: ehEquipamento ? undefined : quantidade,
      });
      aoComprar();
    } catch (error: unknown) {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setErro(msg ?? "Erro ao comprar.");
      setComprando(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-black/30 p-2">
      <div className="flex items-center gap-2">
        <IconeItem item={produto.item} />
        <div className="flex-1">
          <p className="text-sm font-semibold">{produto.item.nome}</p>
          <p className="text-xs text-white/60">
            {produto.quantidade_restante}x por {produto.preco_unitario} ouro cada
          </p>
        </div>
      </div>
      {!ehDonoDaLoja && (
        <div className="flex items-center gap-2">
          {!ehEquipamento && (
            <input
              type="number"
              min={1}
              max={produto.quantidade_restante}
              value={quantidade}
              onChange={(e) =>
                setQuantidade(Math.max(1, Math.min(produto.quantidade_restante, Number(e.target.value) || 1)))
              }
              className="w-16 rounded bg-black/40 px-2 py-1 text-xs"
            />
          )}
          <button
            onClick={comprar}
            disabled={comprando}
            className="flex-1 rounded bg-[#F3B43F] px-2 py-1 text-xs font-semibold text-black disabled:opacity-50"
          >
            {comprando ? "Comprando..." : `Comprar (${(ehEquipamento ? 1 : quantidade) * produto.preco_unitario} ouro)`}
          </button>
        </div>
      )}
      {erro && <p className="text-xs text-red-400">{erro}</p>}
    </div>
  );
}

function EntregarDemandaCard({ demanda, aoEntregar }: { demanda: DemandaApi; aoEntregar: () => void }) {
  const [quantidade, setQuantidade] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const restante = demanda.quantidade_desejada - demanda.quantidade_entregue;

  async function entregar() {
    setEnviando(true);
    setErro(null);
    try {
      await axiosInstance.post(`/player-shops/demands/${demanda.id}/deliver`, { quantidade });
      aoEntregar();
    } catch (error: unknown) {
      const mensagem =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setErro(mensagem ?? "Erro ao entregar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rounded-lg bg-black/30 p-2">
      <div className="flex items-center gap-2">
        <IconeItem item={demanda.item} />
        <div className="flex-1">
          <p className="text-sm font-semibold">{demanda.item.nome}</p>
          <p className="text-xs text-white/60">
            Quer {restante} un. restantes por {demanda.preco_unitario} ouro/un.
          </p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={restante}
          value={quantidade}
          onChange={(e) => setQuantidade(Math.max(1, Math.min(restante, Number(e.target.value) || 1)))}
          className="w-20 rounded bg-black/40 px-2 py-1 text-sm text-white"
        />
        <button
          onClick={entregar}
          disabled={enviando}
          className="rounded bg-[#F3B43F] px-3 py-1 text-sm font-semibold text-black disabled:opacity-50"
        >
          {enviando ? "Entregando..." : "Entregar do inventário"}
        </button>
      </div>
      {erro && <p className="mt-1 text-xs text-red-400">{erro}</p>}
    </div>
  );
}

function FormularioNovaEncomenda({ idLojista, aoEnviar }: { idLojista: number; aoEnviar: () => void }) {
  const [item, setItem] = useState<ItemResumo | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [precoUnitario, setPrecoUnitario] = useState(10);
  const [prazoDias, setPrazoDias] = useState(3);
  const [mensagem, setMensagem] = useState("");
  const [descricao, setDescricao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function enviar() {
    if (!item) return;
    setEnviando(true);
    setErro(null);
    try {
      await axiosInstance.post(`/player-shops/${idLojista}/commissions`, {
        id_item: item.id,
        quantidade,
        preco_unitario: precoUnitario,
        prazo_entrega_dias: prazoDias,
        mensagem,
        descricao,
      });
      setSucesso(true);
      setTimeout(aoEnviar, 800);
    } catch (error: unknown) {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setErro(msg ?? "Erro ao enviar encomenda.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rounded-xl bg-black/30 p-3">
      <p className="mb-2 text-sm text-white/70">
        Descreva o que você quer encomendar. O lojista pode aceitar sua proposta ou fazer uma contraproposta.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Item (pode ser equipamento — a Encomenda aceita qualquer item do jogo)
          <SeletorItemCatalogo selecionado={item} onSelecionar={setItem} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Quantidade
          <input
            type="number"
            min={1}
            value={quantidade}
            onChange={(e) => setQuantidade(Number(e.target.value) || 1)}
            className="rounded bg-black/40 px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Preço unitário oferecido
          <input
            type="number"
            min={1}
            value={precoUnitario}
            onChange={(e) => setPrecoUnitario(Number(e.target.value) || 1)}
            className="rounded bg-black/40 px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Prazo de entrega (dias)
          <input
            type="number"
            min={1}
            value={prazoDias}
            onChange={(e) => setPrazoDias(Number(e.target.value) || 1)}
            className="rounded bg-black/40 px-2 py-1"
          />
        </label>
      </div>
      <label className="mt-2 flex flex-col gap-1 text-sm">
        Descrição do pedido (opcional)
        <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} className="rounded bg-black/40 px-2 py-1" />
      </label>
      <label className="mt-2 flex flex-col gap-1 text-sm">
        Mensagem pro lojista (opcional)
        <input value={mensagem} onChange={(e) => setMensagem(e.target.value)} className="rounded bg-black/40 px-2 py-1" />
      </label>
      {erro && <p className="mt-2 text-sm text-red-400">{erro}</p>}
      {sucesso && <p className="mt-2 text-sm text-green-400">Encomenda enviada!</p>}
      <button
        onClick={enviar}
        disabled={enviando || !item}
        className="mt-3 rounded bg-[#F3B43F] px-4 py-2 font-semibold text-black disabled:opacity-50"
      >
        {enviando ? "Enviando..." : "Enviar encomenda"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aba Minha Loja — perfil, publicar produto, demandas.
// ---------------------------------------------------------------------------
function AbaMinhaLoja() {
  const [loja, setLoja] = useState<MinhaLoja | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [aceitaEncomendas, setAceitaEncomendas] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [minhasDemandas, setMinhasDemandas] = useState<DemandaApi[]>([]);
  const [meusProdutos, setMeusProdutos] = useState<ProdutoResumo[]>([]);

  const carregar = useCallback(async () => {
    try {
      const resp = await axiosInstance.get("/player-shops/mine");
      const minhaLoja: MinhaLoja | null = resp.data?.data?.loja ?? null;
      setLoja(minhaLoja);
      if (minhaLoja) {
        setNome(minhaLoja.nome);
        setDescricao(minhaLoja.descricao ?? "");
        setAceitaEncomendas(minhaLoja.aceita_encomendas);
      }
      const respDemandas = await axiosInstance.get("/player-shops/mine/demands");
      setMinhasDemandas(respDemandas.data?.data?.demandas ?? []);
      // Produto da loja É um anúncio do Mercado Negro (mesmo
      // MarketListing) — "meus produtos publicados" é só a listagem de
      // /market/listings/mine que ainda está ativa.
      const respProdutos = await axiosInstance.get("/market/listings/mine");
      const todos: ProdutoResumo[] = respProdutos.data?.data?.listings ?? [];
      setMeusProdutos(todos.filter((p) => p.status === "Ativo"));
    } catch {
      setErro("Não foi possível carregar sua loja.");
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function salvarPerfil() {
    setSalvando(true);
    setErro(null);
    try {
      await axiosInstance.put("/player-shops/mine", { nome, descricao, aceita_encomendas: aceitaEncomendas });
      await carregar();
    } catch (error: unknown) {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setErro(msg ?? "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Cartao>
        <h3 className="mb-3 font-semibold text-[#F3B43F]">Perfil da loja</h3>
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1 text-sm">
            Nome da loja
            <input value={nome} onChange={(e) => setNome(e.target.value)} className="rounded bg-black/30 px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Descrição
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="rounded bg-black/30 px-2 py-1"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={aceitaEncomendas}
              onChange={(e) => setAceitaEncomendas(e.target.checked)}
            />
            Aceitar encomendas de outros jogadores
          </label>
          {erro && <p className="text-sm text-red-400">{erro}</p>}
          <button
            onClick={salvarPerfil}
            disabled={salvando || nome.trim().length < 3}
            className="mt-2 self-start rounded bg-[#F3B43F] px-4 py-2 font-semibold text-black disabled:opacity-50"
          >
            {salvando ? "Salvando..." : loja ? "Salvar alterações" : "Criar minha loja"}
          </button>
        </div>
      </Cartao>

      {loja && (
        <>
          <Cartao>
            <h3 className="mb-2 font-semibold text-[#F3B43F]">Publicar produto</h3>
            <PublicarProdutoForm aoPublicar={carregar} />
          </Cartao>

          <Cartao>
            <h3 className="mb-2 font-semibold text-[#F3B43F]">Meus produtos publicados</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {meusProdutos.map((produto) => (
                <MeuProdutoCard key={produto.id} produto={produto} aoAtualizar={carregar} />
              ))}
              {meusProdutos.length === 0 && (
                <p className="text-sm text-white/50">Nenhum produto publicado ainda.</p>
              )}
            </div>
          </Cartao>

          <Cartao>
            <h3 className="mb-2 font-semibold text-[#F3B43F]">Publicar demanda (quero comprar)</h3>
            <PublicarDemandaForm aoPublicar={carregar} />
          </Cartao>

          <Cartao>
            <h3 className="mb-2 font-semibold text-[#F3B43F]">Minhas demandas publicadas</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {minhasDemandas.map((demanda) => (
                <div key={demanda.id} className="rounded-lg bg-black/30 p-2">
                  <div className="flex items-center gap-2">
                    <IconeItem item={demanda.item} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{demanda.item.nome}</p>
                      <p className="text-xs text-white/60">
                        {demanda.quantidade_entregue}/{demanda.quantidade_desejada} entregues — {demanda.preco_unitario} ouro/un.
                      </p>
                      <p className="text-xs text-white/40">{STATUS_LABEL[demanda.status]}</p>
                    </div>
                    {demanda.status === "Aberta" && (
                      <button
                        onClick={async () => {
                          await axiosInstance.post(`/player-shops/demands/${demanda.id}/cancel`);
                          carregar();
                        }}
                        className="rounded bg-red-500/80 px-2 py-1 text-xs font-semibold text-white"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {minhasDemandas.length === 0 && <p className="text-sm text-white/50">Nenhuma demanda publicada ainda.</p>}
            </div>
          </Cartao>
        </>
      )}
    </div>
  );
}

// Pedido do jogador: "não dá pra remover o item nem editar o preço" —
// os produtos publicados não tinham NENHUMA listagem/gerência própria
// na aba Minha Loja (só "Minhas demandas publicadas" existia). Cancelar
// e editar preço usam os mesmos endpoints do Mercado Negro
// (DELETE/PATCH /market/listings/:id), já que o produto É um
// MarketListing.
function MeuProdutoCard({ produto, aoAtualizar }: { produto: ProdutoResumo; aoAtualizar: () => void }) {
  const [editando, setEditando] = useState(false);
  const [novoPreco, setNovoPreco] = useState(produto.preco_unitario);
  const [salvando, setSalvando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvarPreco() {
    setSalvando(true);
    setErro(null);
    try {
      await axiosInstance.patch(`/market/listings/${produto.id}`, { preco_unitario: novoPreco });
      setEditando(false);
      aoAtualizar();
    } catch (error: unknown) {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setErro(msg ?? "Erro ao editar preço.");
    } finally {
      setSalvando(false);
    }
  }

  async function cancelar() {
    setCancelando(true);
    setErro(null);
    try {
      await axiosInstance.delete(`/market/listings/${produto.id}`);
      aoAtualizar();
    } catch (error: unknown) {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setErro(msg ?? "Erro ao cancelar produto.");
      setCancelando(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-black/30 p-2">
      <div className="flex items-center gap-2">
        <IconeItem item={produto.item} />
        <div className="flex-1">
          <p className="text-sm font-semibold">{produto.item.nome}</p>
          <p className="text-xs text-white/60">
            {produto.quantidade_restante}/{produto.quantidade_total} restantes
          </p>
        </div>
      </div>

      {editando ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={novoPreco}
            onChange={(e) => setNovoPreco(Number(e.target.value) || 1)}
            className="w-20 rounded bg-black/40 px-2 py-1 text-xs"
          />
          <button
            onClick={salvarPreco}
            disabled={salvando}
            className="rounded bg-[#F3B43F] px-2 py-1 text-xs font-semibold text-black disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>
          <button
            onClick={() => {
              setEditando(false);
              setNovoPreco(produto.preco_unitario);
            }}
            className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <p className="flex-1 text-xs text-white/70">{produto.preco_unitario} ouro/un.</p>
          <button
            onClick={() => setEditando(true)}
            className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
          >
            Editar preço
          </button>
          <button
            onClick={cancelar}
            disabled={cancelando}
            className="rounded bg-red-500/80 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
          >
            {cancelando ? "Removendo..." : "Remover"}
          </button>
        </div>
      )}
      {erro && <p className="text-xs text-red-400">{erro}</p>}
    </div>
  );
}

function PublicarProdutoForm({ aoPublicar }: { aoPublicar: () => void }) {
  const { itens, carregando, recarregar } = useInventarioPublicavel();
  const [chaveSelecionada, setChaveSelecionada] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [precoUnitario, setPrecoUnitario] = useState(10);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const itemSelecionado = itens.find((i) => i.chave === chaveSelecionada) ?? null;

  function selecionar(item: ItemDoInventario) {
    setChaveSelecionada(item.chave);
    setQuantidade(1);
  }

  async function publicar() {
    if (!itemSelecionado) return;
    setEnviando(true);
    setErro(null);
    setSucesso(false);
    try {
      await axiosInstance.post("/player-shops/mine/listings", {
        id_item: itemSelecionado.id_item,
        quantidade: itemSelecionado.id_instancia ? 1 : quantidade,
        preco_unitario: precoUnitario,
        id_instancia: itemSelecionado.id_instancia,
      });
      setSucesso(true);
      setChaveSelecionada(null);
      setQuantidade(1);
      await recarregar();
      aoPublicar();
    } catch (error: unknown) {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setErro(msg ?? "Erro ao publicar produto.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <SeletorItemInventario
        chaveSelecionada={chaveSelecionada}
        onSelecionar={selecionar}
        itens={itens}
        carregando={carregando}
      />

      {itemSelecionado && (
        <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-black/20 p-3 sm:flex-row sm:items-end">
          {!itemSelecionado.id_instancia && (
            <label className="flex flex-1 flex-col gap-1 text-sm">
              Quantidade (máx. {itemSelecionado.quantidadeMaxima})
              <input
                type="number"
                min={1}
                max={itemSelecionado.quantidadeMaxima}
                value={quantidade}
                onChange={(e) =>
                  setQuantidade(Math.max(1, Math.min(itemSelecionado.quantidadeMaxima, Number(e.target.value) || 1)))
                }
                className="rounded bg-black/30 px-2 py-1"
              />
            </label>
          )}
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Preço unitário
            <input
              type="number"
              min={1}
              value={precoUnitario}
              onChange={(e) => setPrecoUnitario(Number(e.target.value) || 1)}
              className="rounded bg-black/30 px-2 py-1"
            />
          </label>
          <button
            onClick={publicar}
            disabled={enviando}
            className="rounded bg-[#F3B43F] px-4 py-2 font-semibold text-black disabled:opacity-50"
          >
            {enviando ? "Publicando..." : "Publicar produto"}
          </button>
        </div>
      )}

      {erro && <p className="text-sm text-red-400">{erro}</p>}
      {sucesso && <p className="text-sm text-green-400">Produto publicado!</p>}
    </div>
  );
}

function PublicarDemandaForm({ aoPublicar }: { aoPublicar: () => void }) {
  const [item, setItem] = useState<ItemResumo | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [precoUnitario, setPrecoUnitario] = useState(10);
  const [prazoDias, setPrazoDias] = useState(7);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function publicar() {
    if (!item) return;
    setEnviando(true);
    setErro(null);
    setSucesso(false);
    try {
      await axiosInstance.post("/player-shops/mine/demands", {
        id_item: item.id,
        quantidade,
        preco_unitario: precoUnitario,
        prazo_dias: prazoDias,
      });
      setSucesso(true);
      setItem(null);
      aoPublicar();
    } catch (error: unknown) {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setErro(msg ?? "Erro ao publicar demanda.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        Item desejado (equipamento não entra aqui — use Encomenda)
        <SeletorItemCatalogo selecionado={item} onSelecionar={setItem} apenasEstocaveis />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Quantidade desejada
        <input
          type="number"
          min={1}
          value={quantidade}
          onChange={(e) => setQuantidade(Number(e.target.value) || 1)}
          className="rounded bg-black/30 px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Preço unitário oferecido
        <input
          type="number"
          min={1}
          value={precoUnitario}
          onChange={(e) => setPrecoUnitario(Number(e.target.value) || 1)}
          className="rounded bg-black/30 px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Prazo (dias)
        <input
          type="number"
          min={1}
          value={prazoDias}
          onChange={(e) => setPrazoDias(Number(e.target.value) || 1)}
          className="rounded bg-black/30 px-2 py-1"
        />
      </label>
      <p className="text-xs text-white/50 sm:col-span-2">
        O ouro total (quantidade × preço) é reservado da sua carteira assim que você publica.
      </p>
      <div className="sm:col-span-2">
        {erro && <p className="text-sm text-red-400">{erro}</p>}
        {sucesso && <p className="text-sm text-green-400">Demanda publicada!</p>}
        <button
          onClick={publicar}
          disabled={enviando || !item}
          className="mt-1 rounded bg-[#F3B43F] px-4 py-2 font-semibold text-black disabled:opacity-50"
        >
          {enviando ? "Publicando..." : "Publicar demanda"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aba Encomendas — enviadas/recebidas + negociação.
// ---------------------------------------------------------------------------
function AbaEncomendas({ characterId }: { characterId: number }) {
  const [subaba, setSubaba] = useState<"recebidas" | "enviadas">("recebidas");
  const [recebidas, setRecebidas] = useState<EncomendaApi[]>([]);
  const [enviadas, setEnviadas] = useState<EncomendaApi[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const resp = await axiosInstance.get("/player-shops/mine/commissions");
      setRecebidas(resp.data?.data?.recebidas ?? []);
      setEnviadas(resp.data?.data?.enviadas ?? []);
    } catch {
      setErro("Não foi possível carregar suas encomendas.");
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const lista = subaba === "recebidas" ? recebidas : enviadas;

  return (
    <Cartao>
      <div className="mb-3 flex gap-2">
        <TabButton ativo={subaba === "recebidas"} onClick={() => setSubaba("recebidas")}>
          Recebidas ({recebidas.length})
        </TabButton>
        <TabButton ativo={subaba === "enviadas"} onClick={() => setSubaba("enviadas")}>
          Enviadas ({enviadas.length})
        </TabButton>
      </div>
      {erro && <p className="text-red-400">{erro}</p>}
      <div className="flex flex-col gap-3">
        {lista.map((encomenda) => (
          <EncomendaCard key={encomenda.id} encomenda={encomenda} characterId={characterId} aoAtualizar={carregar} />
        ))}
        {lista.length === 0 && <p className="text-sm text-white/50">Nenhuma encomenda aqui ainda.</p>}
      </div>
    </Cartao>
  );
}

function EncomendaCard({
  encomenda,
  characterId,
  aoAtualizar,
}: {
  encomenda: EncomendaApi;
  characterId: number;
  aoAtualizar: () => void;
}) {
  const [detalhe, setDetalhe] = useState<EncomendaApi | null>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);

  const souLojista = characterId === encomenda.id_personagem_lojista;
  const minhaVez =
    (encomenda.status === "AguardandoLojista" && souLojista) ||
    (encomenda.status === "AguardandoCliente" && !souLojista);

  async function abrirDetalhe() {
    if (detalhe) {
      setDetalhe(null);
      return;
    }
    setCarregandoDetalhe(true);
    try {
      const resp = await axiosInstance.get(`/player-shops/commissions/${encomenda.id}`);
      setDetalhe(resp.data?.data?.encomenda ?? null);
    } catch {
      setErro("Não foi possível carregar os detalhes.");
    } finally {
      setCarregandoDetalhe(false);
    }
  }

  async function acao(fn: () => Promise<void>) {
    setProcessando(true);
    setErro(null);
    try {
      await fn();
      await aoAtualizar();
      setDetalhe(null);
    } catch (error: unknown) {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setErro(msg ?? "Erro ao processar ação.");
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div className="rounded-xl bg-black/30 p-3">
      <button onClick={abrirDetalhe} className="flex w-full items-center gap-2 text-left">
        <IconeItem item={encomenda.item} />
        <div className="flex-1">
          <p className="font-semibold">{encomenda.item.nome}</p>
          <p className="text-xs text-white/60">
            {souLojista ? `Cliente: ${encomenda.cliente?.nome ?? "?"}` : `Lojista: ${encomenda.lojista?.nome ?? "?"}`}
          </p>
          <p className="text-xs text-white/40">
            {STATUS_LABEL[encomenda.status]}
            {minhaVez && " — é a sua vez de responder"}
          </p>
        </div>
      </button>

      {carregandoDetalhe && <p className="mt-2 text-sm text-white/50">Carregando...</p>}
      {erro && <p className="mt-2 text-sm text-red-400">{erro}</p>}

      {detalhe && (
        <div className="mt-3 border-t border-white/10 pt-3">
          {detalhe.descricao && <p className="mb-2 text-sm text-white/70">&ldquo;{detalhe.descricao}&rdquo;</p>}

          <div className="flex flex-col gap-1">
            {(detalhe.ofertas ?? []).map((oferta) => (
              <div key={oferta.id} className="rounded bg-black/30 p-2 text-sm">
                <p>
                  <strong>{oferta.autor}</strong> propôs v{oferta.proposal_version}: {oferta.quantidade}x por{" "}
                  {oferta.preco_unitario} ouro/un., entrega em {oferta.prazo_entrega_dias} dia(s) —{" "}
                  <span className="text-white/50">{oferta.status}</span>
                </p>
                {oferta.mensagem && <p className="text-white/60 italic">&ldquo;{oferta.mensagem}&rdquo;</p>}
              </div>
            ))}
          </div>

          {minhaVez && ["AguardandoLojista", "AguardandoCliente"].includes(detalhe.status) && (
            <NegociacaoAcoes
              encomenda={detalhe}
              processando={processando}
              onAceitar={() =>
                acao(async () => {
                  await axiosInstance.post(`/player-shops/commissions/${detalhe.id}/accept`, {
                    proposal_version: detalhe.proposal_version,
                  });
                })
              }
              onRecusar={() => acao(async () => await axiosInstance.post(`/player-shops/commissions/${detalhe.id}/decline`))}
              onContrapropor={(termos) =>
                acao(async () => {
                  await axiosInstance.post(`/player-shops/commissions/${detalhe.id}/counter-offer`, termos);
                })
              }
            />
          )}

          {detalhe.status === "Aceita" && souLojista && (
            <EntregarEncomendaBox
              encomenda={detalhe}
              processando={processando}
              onEntregar={(idInstancia) =>
                acao(async () => {
                  await axiosInstance.post(`/player-shops/commissions/${detalhe.id}/deliver`, {
                    id_instancia: idInstancia ? Number(idInstancia) : undefined,
                  });
                })
              }
            />
          )}

          {detalhe.status === "Aceita" && (
            <button
              onClick={() => acao(async () => await axiosInstance.post(`/player-shops/commissions/${detalhe.id}/cancel`))}
              disabled={processando}
              className="mt-2 rounded bg-red-500/80 px-3 py-1 text-sm font-semibold text-white disabled:opacity-50"
            >
              Cancelar encomenda (reembolso integral)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function NegociacaoAcoes({
  encomenda,
  processando,
  onAceitar,
  onRecusar,
  onContrapropor,
}: {
  encomenda: EncomendaApi;
  processando: boolean;
  onAceitar: () => void;
  onRecusar: () => void;
  onContrapropor: (termos: { quantidade: number; preco_unitario: number; prazo_entrega_dias: number; mensagem?: string }) => void;
}) {
  const ultimaOferta = (encomenda.ofertas ?? []).find((o) => o.proposal_version === encomenda.proposal_version);
  const [quantidade, setQuantidade] = useState(ultimaOferta?.quantidade ?? 1);
  const [precoUnitario, setPrecoUnitario] = useState(ultimaOferta?.preco_unitario ?? 1);
  const [prazoDias, setPrazoDias] = useState(ultimaOferta?.prazo_entrega_dias ?? 1);
  const [mensagem, setMensagem] = useState("");
  const [mostrarContra, setMostrarContra] = useState(false);

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onAceitar}
          disabled={processando}
          className="rounded bg-green-500/80 px-3 py-1 text-sm font-semibold text-white disabled:opacity-50"
        >
          Aceitar proposta atual
        </button>
        <button
          onClick={() => setMostrarContra((v) => !v)}
          disabled={processando}
          className="rounded bg-[#F3B43F] px-3 py-1 text-sm font-semibold text-black disabled:opacity-50"
        >
          Contrapropor
        </button>
        <button
          onClick={onRecusar}
          disabled={processando}
          className="rounded bg-red-500/80 px-3 py-1 text-sm font-semibold text-white disabled:opacity-50"
        >
          Recusar
        </button>
      </div>

      {mostrarContra && (
        <div className="grid gap-2 rounded bg-black/30 p-2 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs">
            Quantidade
            <input
              type="number"
              min={1}
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value) || 1)}
              className="rounded bg-black/40 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Preço unitário
            <input
              type="number"
              min={1}
              value={precoUnitario}
              onChange={(e) => setPrecoUnitario(Number(e.target.value) || 1)}
              className="rounded bg-black/40 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Prazo de entrega (dias)
            <input
              type="number"
              min={1}
              value={prazoDias}
              onChange={(e) => setPrazoDias(Number(e.target.value) || 1)}
              className="rounded bg-black/40 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Mensagem
            <input value={mensagem} onChange={(e) => setMensagem(e.target.value)} className="rounded bg-black/40 px-2 py-1" />
          </label>
          <button
            onClick={() => onContrapropor({ quantidade, preco_unitario: precoUnitario, prazo_entrega_dias: prazoDias, mensagem })}
            disabled={processando}
            className="sm:col-span-2 rounded bg-[#F3B43F] px-3 py-1 text-sm font-semibold text-black disabled:opacity-50"
          >
            Enviar contraproposta
          </button>
        </div>
      )}
    </div>
  );
}

function EntregarEncomendaBox({
  encomenda,
  processando,
  onEntregar,
}: {
  encomenda: EncomendaApi;
  processando: boolean;
  onEntregar: (idInstancia?: string) => void;
}) {
  const [idInstancia, setIdInstancia] = useState("");

  return (
    <div className="mt-2 flex flex-col gap-2 rounded bg-black/30 p-2">
      <p className="text-sm text-white/70">
        Termos travados: {encomenda.quantidade_acordada}x por {encomenda.preco_total_acordado} ouro no total.
      </p>
      <label className="flex flex-col gap-1 text-xs">
        ID da instância (só se for equipamento)
        <input value={idInstancia} onChange={(e) => setIdInstancia(e.target.value)} className="rounded bg-black/40 px-2 py-1" />
      </label>
      <button
        onClick={() => onEntregar(idInstancia)}
        disabled={processando}
        className="self-start rounded bg-green-500/80 px-3 py-1 text-sm font-semibold text-white disabled:opacity-50"
      >
        Entregar encomenda
      </button>
    </div>
  );
}
