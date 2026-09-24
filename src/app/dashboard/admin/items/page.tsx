import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/utils/character-session";
import AdminItemsClient from "./AdminItemsClient";

export default async function AdminItemsPage() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-2 sm:p-4">
      <AdminItemsClient />
    </div>
  );
}
