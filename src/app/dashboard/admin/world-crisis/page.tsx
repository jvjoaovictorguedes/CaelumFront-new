import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/utils/character-session";
import AdminWorldCrisisClient from "./AdminWorldCrisisClient";
export default async function Page() {
  if (!(await isCurrentUserAdmin())) redirect("/dashboard");
  return (
    <div className="mx-auto w-full max-w-6xl p-2 sm:p-4">
      <AdminWorldCrisisClient />
    </div>
  );
}
