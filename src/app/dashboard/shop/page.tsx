import axiosInstance from "@/utils/axiosIntance";
import { getCurrentCharacter } from "@/utils/character-session";
import ShopItem from "./components/ShopItem";

interface Item {
  id: number;
  nome: string;
  descricao?: string;
  valor_compra: number;
  valor_venda: number;
  imagem?: string;
  categoria?: string;
  raridade?: string;
}

interface ItemsResponse {
  data?: {
    items?: Item[];
  };
}

const MOSTRAR_ITENS_RAROS = false;

/**
 * Busca todos os itens cadastrados na API
 */
async function buscarItensDaLoja(): Promise<Item[]> {
  try {
    const resposta =
      await axiosInstance.get<ItemsResponse>("/items");

    return resposta.data?.data?.items ?? [];
  } catch (error) {
    console.error(
      "Erro ao buscar itens da loja:",
      error,
    );

    return [];
  }
}

export default async function ShopPage() {
  const character = await getCurrentCharacter();

  const itens = await buscarItensDaLoja();

  const moedas = character?.dinheiro ?? 15;

  const itensDaLoja = itens.filter((item) => {
    // Não comercializável
    if (item.valor_venda <= 0) {
      return false;
    }

    // Bloqueia itens raros
    if (
      !MOSTRAR_ITENS_RAROS &&
      item.raridade?.toLowerCase() === "raro"
    ) {
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
            <h1 className="font-imFeel text-4xl sm:text-5xl">
              Loja
            </h1>

            <p className="mt-2 text-white/70">
              Equipamentos e consumíveis para sua
              próxima aventura.
            </p>
          </div>

          <p className="text-lg font-bold text-[#F3B43F]">
            Moedas: {moedas}
          </p>
        </div>
      </div>

      {/* ITENS */}
      <section className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {itensDaLoja.map((item) => (
          <ShopItem
            key={item.id}
            characterId={character?.id}
            initialCoins={moedas}
            item={item}
          />
        ))}
      </section>

      {/* CASO NÃO TENHA ITENS */}
      {itensDaLoja.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#292018]/80 p-8 text-center text-white/60">
          Nenhum item disponível na loja no momento.
        </div>
      )}
    </div>
  );
}