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
          Escolha o item que quer forjar e reúna os materiais da receita — o
          resultado nunca é sorteado, é sempre o item escolhido. Raridades
          maiores pedem mais materiais e um tempo de forja mais longo (um
          lendário pode levar horas), mas só existe 1 forja em andamento por
          vez.
        </p>
      </div>

      <ForgeClient />
    </div>
  );
}
