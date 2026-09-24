import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/utils/character-session";
import AdminAuditClient from "./AdminAuditClient";

export default async function AdminAuditPage() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-2 sm:p-4">
      <AdminAuditClient />
    </div>
  );
}
