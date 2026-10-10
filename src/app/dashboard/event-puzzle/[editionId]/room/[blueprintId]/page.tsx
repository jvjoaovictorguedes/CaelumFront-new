import { getCurrentCharacter } from "@/utils/character-session";
import RoomClient from "./RoomClient";

// "O Coração da Máquina Celestial" — Fase 16. Shell do servidor (só
// resolve o personagem atual); todo o resto (criar/retomar a
// PuzzleInstance, desenhar a cena certa por domínio, sincronizar via
// socket) é client — RoomClient.tsx.
export default async function EventPuzzleRoomPage({
  params,
}: {
  params: Promise<{ editionId: string; blueprintId: string }>;
}) {
  const { editionId, blueprintId } = await params;
  const idEdicao = Number(editionId);
  const idBlueprint = Number(blueprintId);
  const character = await getCurrentCharacter();

  if (!character) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <h1 className="mb-4 font-imFeel text-5xl text-[#F3B43F]">O Coração da Máquina Celestial</h1>
        <p className="max-w-md text-lg text-white/70">Crie um personagem para explorar as câmaras do evento.</p>
      </div>
    );
  }

  if (!Number.isInteger(idEdicao) || idEdicao <= 0 || !Number.isInteger(idBlueprint) || idBlueprint <= 0) {
    return <div className="p-6 text-center text-white/60">Câmara inválida.</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-2 sm:p-4">
      <RoomClient editionId={idEdicao} blueprintId={idBlueprint} />
    </div>
  );
}
