import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/utils/character-session";
import AdminGrantsClient from "./AdminGrantsClient";

export default async function AdminGrantsPage() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 p-2 sm:p-4">
      <AdminGrantsClient />
    </div>
  );
}
