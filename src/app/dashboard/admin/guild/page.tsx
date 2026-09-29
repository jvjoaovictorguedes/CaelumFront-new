import { redirect } from "next/navigation";
import { isCurrentUserAdmin, getCurrentAdminPermissions } from "@/utils/character-session";
import AdminGuildClient from "./AdminGuildClient";

export default async function AdminGuildPage() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }
  const permissoes = await getCurrentAdminPermissions();
  if (!permissoes.includes("guild.manage")) {
    redirect("/dashboard/admin");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-2 sm:p-4">
      <AdminGuildClient />
    </div>
  );
}
