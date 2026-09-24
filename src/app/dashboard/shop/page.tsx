import axiosInstance from "@/utils/axiosIntance";
import { getCurrentCharacter } from "@/utils/character-session";
import { type ShopItemData } from "./components/ShopItem";
import ShopCatalog from "./components/ShopCatalog";
import PageMusic from "@/components/music/PageMusic";
import { MUSIC } from "@/constants/music";

interface ItemsResponse {
  data?: {
    items?: ShopItemData[];
  };
}

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
    // exibição, não decidem mais disponibilidade. Havia um filtro fixo
    // que escondia todo item raridade "Raro" mesmo com disponivel_loja
    // true — contradizia esse comentário e fazia item editado no Painel
    // Administrativo (que deixa escolher raridade Raro livremente)
    // sumir da loja sem nenhum aviso. Removido: quem decide o que
    // vende é só o botão "disponível na loja".
    return item.disponivel_loja;
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-2 sm:p-4">
      <PageMusic track={MUSIC.TAVERNA_MERCADO} />
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

      {/* SEÇÕES (Equipamentos/Consumíveis/Materiais), FILTROS DE SUBTIPO
          E GRADE DE ITENS — tudo interativo, ver ShopCatalog.tsx */}
      <ShopCatalog
        itens={itensDaLoja}
        characterId={character?.id}
        moedas={moedas}
        classeDoPersonagem={classeDoPersonagem}
      />
    </div>
  );
}
