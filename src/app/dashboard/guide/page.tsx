import GuideClient from "./components/GuideClient";
import PageMusic from "@/components/music/PageMusic";
import { MUSIC } from "@/constants/music";

export default function GuidePage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-2 sm:p-4">
      <PageMusic track={MUSIC.AVENTUREIRO} />
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">Bem-vindo a Caelum</p>
        <h1 className="font-imFeel text-4xl sm:text-5xl">Guia do Aventureiro</h1>
        <p className="mt-2 text-white/70">
          Os primeiros passos de todo herói. Siga esses pontos pra conhecer os principais sistemas
          do jogo — cada um leva direto pra tela certa.
        </p>
      </div>

      <GuideClient />
    </div>
  );
}
