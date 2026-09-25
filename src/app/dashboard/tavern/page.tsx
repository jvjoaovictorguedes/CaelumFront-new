import { getCurrentCharacter } from "@/utils/character-session";
import TavernClient from "./TavernClient";
import PageMusic from "@/components/music/PageMusic";
import { MUSIC } from "@/constants/music";

export default async function TavernPage() {
  const character = await getCurrentCharacter();

  if (!character) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <PageMusic track={MUSIC.GUILDA} />
        <h1 className="mb-4 font-imFeel text-5xl">Taverna</h1>
        <p className="max-w-md text-lg text-black/70">Crie um personagem pra entrar na Taverna.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-2 sm:p-4">
      <PageMusic track={MUSIC.GUILDA} />
      <div className="rounded-2xl border-2 border-[#BC8418]/60 bg-[#241a10]/90 p-5 text-white shadow-xl">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]/80">Descanso, cardápio e jogos de Gold</p>
        <h1 className="font-imFeel text-4xl sm:text-5xl text-[#F3B43F]">Taverna</h1>
        <p className="mt-2 text-white/70">
          Descanse pra recuperar HP e Mana, compre uma Refeição e uma Bebida pra ganhar bônus temporários, ou arrisque
          seu Gold nos jogos de azar da casa. Nada aqui usa dinheiro real.
        </p>
      </div>

      <TavernClient />
    </div>
  );
}
