import { redirect } from "next/navigation";
import { isCurrentUserAdmin, getCurrentAdminPermissions } from "@/utils/character-session";
import AdminWikiClient from "./AdminWikiClient";

export default async function AdminWikiPage() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }
  const permissoes = await getCurrentAdminPermissions();
  if (!permissoes.includes("wiki.manage")) {
    redirect("/dashboard/admin");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-2 sm:p-4">
      <AdminWikiClient />
    </div>
  );
}
