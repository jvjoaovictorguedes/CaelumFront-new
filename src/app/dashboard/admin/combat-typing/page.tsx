import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/utils/character-session";
import AdminCombatTyping from "./AdminCombatTyping";
export default async function Page() {
  if (!(await isCurrentUserAdmin())) redirect("/dashboard");
  return <AdminCombatTyping />;
}
