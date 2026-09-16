import axiosInstance from "@/utils/axiosIntance";
import { getCurrentCharacter } from "@/utils/character-session";
import ShopItem from "./components/ShopItem";

const ID_POCAO_DE_VIDA = 3;
const ID_POCAO_DE_MANA = 4;

async function buscarPrecoDaPocao() {
  try {
    //AJUSTE COM A POCAO DE MANDA TAMBÉM
    const respostaVida = await axiosInstance.get<{ data?: { item?: { valor_compra?: number } } }>(
      `/items/${ID_POCAO_DE_VIDA}`,
    );
    const respostaMana = await axiosInstance.get<{ data?: { item?: { valor_compra?: number } } }>(
      `/items/${ID_POCAO_DE_MANA}`,
    );
    return {
      vida: respostaVida.data?.data?.item?.valor_compra ?? 1,
      mana: respostaMana.data?.data?.item?.valor_compra ?? 1,
    };
  } catch (error) {
    console.error("Erro ao buscar preco da pocao de vida:", error);
    return { vida: 1, mana: 1 };
  }
}

export default async function ShopPage() {
  const character = await getCurrentCharacter();
  const precoPocao = await buscarPrecoDaPocao();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-2 sm:p-4">
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">
          Mercado de Caelum
        </p>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-imFeel text-4xl sm:text-5xl">Loja</h1>
            <p className="mt-2 text-white/70">
              Equipamentos e consumiveis para sua proxima aventura.
            </p>
          </div>
          <p className="text-lg font-bold text-[#F3B43F]">
            Moedas: {character?.dinheiro ?? 15}
          </p>
        </div>
      </div>

      <section className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ShopItem
          characterId={character?.id}
          initialCoins={character?.dinheiro ?? 15}  
          price={precoPocao.vida}
        />
        <ShopItem
          characterId={character?.id}
          initialCoins={character?.dinheiro ?? 15}  
          price={precoPocao.mana}
        />
      </section>
    </div>
  );
}
