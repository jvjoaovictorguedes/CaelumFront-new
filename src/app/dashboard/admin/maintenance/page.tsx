import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/utils/character-session";
import AdminMaintenanceClient from "./AdminMaintenanceClient";

export default async function AdminMaintenancePage() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-2 sm:p-4">
      <AdminMaintenanceClient />
    </div>
  );
}
