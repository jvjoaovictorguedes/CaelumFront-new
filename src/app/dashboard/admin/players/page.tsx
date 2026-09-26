import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/utils/character-session";
import AdminPlayersClient from "./AdminPlayersClient";

export default async function AdminPlayersPage() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 p-2 sm:p-4">
      <AdminPlayersClient />
    </div>
  );
}
