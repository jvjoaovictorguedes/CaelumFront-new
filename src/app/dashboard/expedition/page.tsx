import { getCurrentCharacter } from "@/utils/character-session";
import ExpeditionClient from "./components/ExpeditionClient";

export default async function ExpeditionPage() {
  const character = await getCurrentCharacter();

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <h1 className="font-imFeel text-5xl mb-4">Expedição</h1>
        <p className="text-lg text-black/70 max-w-md">
          Crie um personagem pra sair em expedição.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-2 sm:p-4">
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">Coleta de recursos</p>
        <h1 className="font-imFeel text-4xl sm:text-5xl">Expedição</h1>
        <p className="mt-2 text-white/70">
          Escolha uma profissão e explore suas regiões pra coletar
          materiais. Quanto maior o nível da profissão, melhores as
          regiões que você desbloqueia e as qualidades que pode
          encontrar — mas cada coleta tem um tempo de espera antes da
          próxima.
        </p>
      </div>

      <ExpeditionClient />
    </div>
  );
}
