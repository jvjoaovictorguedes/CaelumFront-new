import axiosInstance from "@/utils/axiosIntance";
import { getCurrentCharacter } from "@/utils/character-session";
import ShopItem, { type ShopItemData } from "./components/ShopItem";

interface ItemsResponse {
  data?: {
    items?: ShopItemData[];
  };
}

const MOSTRAR_ITENS_RAROS = false;

// Agrupa a vitrine por tipo pra ficar fácil de escanear (arma, armadura,
// consumível...) em vez de uma grade única misturando tudo.
const ORDEM_TIPOS: { tipo: ShopItemData["tipo_item"]; titulo: string }[] = [
  { tipo: "Arma", titulo: "Armas" },
  { tipo: "Capacete", titulo: "Elmos" },
  { tipo: "Armadura", titulo: "Armaduras" },
  { tipo: "Escudo", titulo: "Escudos" },
  { tipo: "Consumivel", titulo: "Consumíveis" },
  { tipo: "Material", titulo: "Materiais" },
];

/**
 * Busca todos os itens cadastrados na API
 */
async function buscarItensDaLoja(): Promise<ShopItemData[]> {
  try {
    const resposta = await axiosInstance.get<ItemsResponse>("/items");

    return resposta.data?.data?.items ?? [];
  } catch (error) {
    console.error("Erro ao buscar itens da loja:", error);

    return [];
  }
}

export default async function ShopPage() {
  const character = await getCurrentCharacter();

  const itens = await buscarItensDaLoja();

  const moedas = character?.dinheiro ?? 15;
  const classeDoPersonagem = character?.Class?.nome;

  const itensDaLoja = itens.filter((item) => {
    // O backend é a autoridade sobre o que está à venda
    // (Items.disponivel_loja) — raridade/valor_venda aqui são só pra
    // exibição, não decidem mais disponibilidade.
    if (!item.disponivel_loja) {
      return false;
    }

    if (!MOSTRAR_ITENS_RAROS && item.raridade?.toLowerCase() === "raro") {
      return false;
    }

    return true;
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-2 sm:p-4">
      {/* CABEÇALHO */}
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">
          Mercado de Caelum
        </p>

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-imFeel text-4xl sm:text-5xl">Loja</h1>

            <p className="mt-2 text-white/70">
              Equipamentos e consumíveis para sua próxima aventura.
            </p>
          </div>

          <p className="text-lg font-bold text-[#F3B43F]">Moedas: {moedas}</p>
        </div>
      </div>

      {/* ITENS, AGRUPADOS POR TIPO */}
      {ORDEM_TIPOS.map(({ tipo, titulo }) => {
        const itensDoTipo = itensDaLoja.filter((item) => item.tipo_item === tipo);
        if (itensDoTipo.length === 0) return null;

        return (
          <section key={tipo} className="flex flex-col gap-3">
            <h2 className="font-imFeel text-2xl text-[#F3B43F] sm:text-3xl">
              {titulo}
            </h2>
            <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {itensDoTipo.map((item) => (
                <ShopItem
                  key={item.id}
                  characterId={character?.id}
                  initialCoins={moedas}
                  item={item}
                  classeDoPersonagem={classeDoPersonagem}
                />
              ))}
            </div>
          </section>
        );
      })}

      {/* CASO NÃO TENHA ITENS */}
      {itensDaLoja.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#292018]/80 p-8 text-center text-white/60">
          Nenhum item disponível na loja no momento.
        </div>
      )}
    </div>
  );
}
