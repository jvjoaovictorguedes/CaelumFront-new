import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/utils/character-session";
import AdminDiscordNews from "./AdminDiscordNews";
export default async function Page() {
  if (!(await isCurrentUserAdmin())) redirect("/dashboard");
  return (
    <div className="mx-auto w-full max-w-6xl p-2 sm:p-4">
      <AdminDiscordNews />
    </div>
  );
}
