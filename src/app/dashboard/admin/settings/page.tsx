import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/utils/character-session";
import AdminGameSettingsClient from "./AdminGameSettingsClient";

export default async function AdminGameSettingsPage() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 p-2 sm:p-4">
      <AdminGameSettingsClient />
    </div>
  );
}
