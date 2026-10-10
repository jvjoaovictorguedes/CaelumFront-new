import { getCurrentCharacter } from "@/utils/character-session";
import EventPuzzleClient from "./components/EventPuzzleClient";

// "O Coração da Máquina Celestial" — Fase 16. Shell do servidor (só
// resolve o personagem atual, igual a /dashboard/temple/page.tsx); todo
// o resto (abas Salas/Caderno/Pioneiros/Custódio) é client, porque
// depende do socket compartilhado (PvpSocketContext) pro Custódio.
export default async function EventPuzzleEditionPage({ params }: { params: Promise<{ editionId: string }> }) {
  const { editionId } = await params;
  const idEdicao = Number(editionId);
  const character = await getCurrentCharacter();

  if (!character) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <h1 className="mb-4 font-imFeel text-5xl text-[#F3B43F]">O Coração da Máquina Celestial</h1>
        <p className="max-w-md text-lg text-white/70">Crie um personagem para explorar as câmaras do evento.</p>
      </div>
    );
  }

  if (!Number.isInteger(idEdicao) || idEdicao <= 0) {
    return <div className="p-6 text-center text-white/60">Edição inválida.</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-2 sm:p-4">
      <EventPuzzleClient editionId={idEdicao} />
    </div>
  );
}
