import { redirect } from "next/navigation";
import { isCurrentUserAdmin, getCurrentAdminPermissions } from "@/utils/character-session";
import AdminHubClient from "./AdminHubClient";

// Segunda camada, não a única (mesmo padrão de /dashboard/admin/tournaments):
// toda rota administrativa de verdade é protegida por authMiddleware +
// adminMiddleware + requireAdminPermission no backend. Isto só evita
// mostrar a tela pra quem não vai conseguir usar nada nela.
export default async function AdminHomePage() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  const permissoes = await getCurrentAdminPermissions();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-2 sm:p-4">
      <AdminHubClient permissoes={permissoes} />
    </div>
  );
}
