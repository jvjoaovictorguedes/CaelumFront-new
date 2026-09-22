import { getCurrentCharacter } from "@/utils/character-session";
import MarketClient from "./components/MarketClient";

export default async function MarketPage() {
  const character = await getCurrentCharacter();

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <h1 className="font-imFeel text-5xl mb-4">Mercado Negro</h1>
        <p className="text-lg text-black/70 max-w-md">
          Crie um personagem para comprar e vender itens com outros jogadores.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-2 sm:p-4">
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">Comércio entre aventureiros</p>
        <h1 className="font-imFeel text-4xl sm:text-5xl">Mercado Negro</h1>
        <p className="mt-2 text-white/70">
          Venda os itens que você encontrou nas aventuras direto pra outros jogadores, ou compre o que precisa.
        </p>
      </div>

      <MarketClient characterId={character.id} />
    </div>
  );
}
