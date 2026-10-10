import { redirect } from "next/navigation";
import { isCurrentUserAdmin, getCurrentAdminPermissions } from "@/utils/character-session";
import AdminEventPuzzleClient from "./AdminEventPuzzleClient";

// "O Coração da Máquina Celestial" — Puzzle Builder (Fase 15). Mesmo
// padrão de dashboard/admin/temple/page.tsx, com uma diferença: o
// backend deste domínio tem DUAS permissões (event_puzzle.view pra GET,
// event_puzzle.manage pra mutação) em vez de uma só — sem manage ainda
// deixamos o admin entrar em modo só-leitura se tiver view, em vez de
// bloquear a tela inteira (ver `editavel` repassado pro client).
export default async function AdminEventPuzzlePage() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }
  const permissoes = await getCurrentAdminPermissions();
  const podeVer = permissoes.includes("event_puzzle.view") || permissoes.includes("event_puzzle.manage");
  if (!podeVer) {
    redirect("/dashboard/admin");
  }
  const editavel = permissoes.includes("event_puzzle.manage");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-2 sm:p-4">
      <AdminEventPuzzleClient editavel={editavel} />
    </div>
  );
}
