import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/utils/character-session";
import AdminAutomation from "./AdminAutomation";
export default async function Page() {
  if (!(await isCurrentUserAdmin())) redirect("/dashboard");
  return <AdminAutomation />;
}
