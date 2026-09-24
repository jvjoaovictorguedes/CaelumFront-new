import { getCurrentCharacter } from "@/utils/character-session";
import ForgeClient from "./components/ForgeClient";
import PageMusic from "@/components/music/PageMusic";
import { MUSIC } from "@/constants/music";

export default async function ForgePage() {
  const character = await getCurrentCharacter();

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <PageMusic track={MUSIC.AVENTUREIRO} />
        <h1 className="font-imFeel text-5xl mb-4">Forja de Caelum</h1>
        <p className="text-lg text-black/70 max-w-md">
          Crie um personagem pra fundir itens na forja.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-2 sm:p-4">
      <PageMusic track={MUSIC.AVENTUREIRO} />
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">Profissão de Forja</p>
        <h1 className="font-imFeel text-4xl sm:text-5xl">Forja de Caelum</h1>
        <p className="mt-2 text-white/70">
          Funda fragmentos da Expedição em barras, fabrique equipamentos a
          partir delas (a qualidade dos materiais define o piso — sua sorte e
          seu nível de Forja decidem se sai melhor ainda) e refine o que já
          tem de +1 até +10. Fundição é instantânea; Fabricação e Refinamento
          dividem o mesmo posto de trabalho da Forja.
        </p>
      </div>

      <ForgeClient />
    </div>
  );
}
