import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/utils/character-session";
import EventPuzzlePreviewClient from "./EventPuzzlePreviewClient";

// Evento "O Coração da Máquina Celestial" — Fase 4. Preview estático
// (sem backend ainda — isso é Fase 8) do renderer procedural mecânico
// sobre a MESMA topologia pública da fixture "Câmara das Engrenagens"
// (CaelumBack-new test/puzzleMechanicalComponents.test.js). Nunca
// inclui a golden solution — só os 4 instantâneos de estado público
// que o servidor produziria, prontos pra olho humano conferir o visual
// antes da integração real.
export default async function Page() {
  if (!(await isCurrentUserAdmin())) redirect("/dashboard");
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-2 sm:p-4">
      <EventPuzzlePreviewClient />
    </div>
  );
}
