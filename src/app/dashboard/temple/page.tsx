import { getCurrentCharacter } from "@/utils/character-session";
import TempleClient from "./TempleClient";

export default async function TemplePage() {
  const character = await getCurrentCharacter();

  if (!character) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <h1 className="mb-4 font-imFeel text-5xl">Templo do Véu Celestial</h1>
        <p className="max-w-md text-lg text-black/70">Crie um personagem pra conhecer o Templo.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-2 sm:p-4">
      <div className="rounded-2xl border-2 border-[#BC8418]/60 bg-[#241a10]/90 p-5 text-white shadow-xl">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]/80">Convergências, Provações e o Guardião</p>
        <h1 className="font-imFeel text-4xl sm:text-5xl text-[#F3B43F]">Templo do Véu Celestial</h1>
        <p className="mt-2 text-white/70">
          Em certas Convergências, inscrições antigas despertam, o Relicário volta a responder e um Guardião assume a
          forma necessária para julgar quem atravessa o último altar.
        </p>
      </div>

      <TempleClient />
    </div>
  );
}
