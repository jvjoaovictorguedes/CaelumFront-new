import { getCurrentCharacter } from "@/utils/character-session";
import ForgeClient from "./components/ForgeClient";

export default async function ForgePage() {
  const character = await getCurrentCharacter();

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <h1 className="font-imFeel text-5xl mb-4">Forja de Caelum</h1>
        <p className="text-lg text-black/70 max-w-md">
          Crie um personagem pra fundir itens na forja.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-2 sm:p-4">
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">Evolução de equipamento</p>
        <h1 className="font-imFeel text-4xl sm:text-5xl">Forja de Caelum</h1>
        <p className="mt-2 text-white/70">
          Funda vários itens da mesma raridade (misturados, não precisa ser cópias do
          mesmo item) em 1 item aleatório da raridade seguinte — dá um destino de
          verdade pro loot comum que só ia servir pra vender.
        </p>
      </div>

      <ForgeClient />
    </div>
  );
}
