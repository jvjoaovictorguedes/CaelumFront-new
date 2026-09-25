import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/utils/character-session";
import AdminTavernClient from "./AdminTavernClient";

export default async function AdminTavernPage() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-2 sm:p-4">
      <AdminTavernClient />
    </div>
  );
}
