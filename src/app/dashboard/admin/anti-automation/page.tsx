import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/utils/character-session";
import AdminAutomation from "./AdminAutomation";
export default async function Page() {
  if (!(await isCurrentUserAdmin())) redirect("/dashboard");
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-2 sm:p-4">
      <AdminAutomation />
    </div>
  );
}
