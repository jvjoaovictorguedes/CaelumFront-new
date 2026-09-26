import { redirect } from "next/navigation";
import { isCurrentUserAdmin, getCurrentAdminPermissions } from "@/utils/character-session";
import AdminUniqueFeatsClient from "./AdminUniqueFeatsClient";

export default async function AdminUniqueFeatsPage() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }
  const permissoes = await getCurrentAdminPermissions();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-2 sm:p-4">
      <AdminUniqueFeatsClient podeReparar={permissoes.includes("uniquefeats.repair")} />
    </div>
  );
}
