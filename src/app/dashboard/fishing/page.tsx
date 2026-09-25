import { getCurrentCharacter } from "@/utils/character-session";
import FishingClient from "./components/FishingClient";
import PageMusic from "@/components/music/PageMusic";
import { MUSIC } from "@/constants/music";

export default async function FishingPage() {
  const character = await getCurrentCharacter();

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <PageMusic track={MUSIC.AMBIENTE} />
        <h1 className="font-imFeel text-5xl mb-4">Pesca & Navegação</h1>
        <p className="text-lg text-black/70 max-w-md">
          Crie um personagem pra navegar pelos mares de Caelum.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-2 sm:p-4">
      <PageMusic track={MUSIC.AMBIENTE} />
      <div className="rounded-2xl border-2 border-sky-500/60 bg-[#0b1b2b]/90 p-5 text-white shadow-xl">
        <p className="text-sm uppercase tracking-widest text-sky-300">Atividade fora do combate</p>
        <h1 className="font-imFeel text-4xl sm:text-5xl">Pesca & Navegação</h1>
        <p className="mt-2 text-white/70">
          Navegue até uma zona de pesca, escolha sua vara e isca, e dispute um
          minigame de tensão/recolhimento pra capturar peixes. Peixes viram
          itens que alimentam Mercado e Caldeirão; varas são fabricadas e
          refinadas na Forja como Ferramentas — nunca contam como arma.
        </p>
      </div>

      <FishingClient />
    </div>
  );
}
