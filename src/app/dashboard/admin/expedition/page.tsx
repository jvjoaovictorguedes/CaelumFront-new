import { redirect } from "next/navigation";
import { isCurrentUserAdmin, getCurrentAdminPermissions } from "@/utils/character-session";
import AdminExpeditionClient from "./AdminExpeditionClient";

export default async function AdminExpeditionPage() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }
  const permissoes = await getCurrentAdminPermissions();
  if (!permissoes.includes("expedition.balance")) {
    redirect("/dashboard/admin");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-2 sm:p-4">
      <AdminExpeditionClient />
    </div>
  );
}
