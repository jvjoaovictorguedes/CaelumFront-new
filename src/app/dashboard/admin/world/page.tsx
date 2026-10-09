import { redirect } from "next/navigation";
import { isCurrentUserAdmin, getCurrentAdminPermissions } from "@/utils/character-session";
import WorldAccessClient from "./WorldAccessClient";
export default async function AdminWorldPage() {
  if (!await isCurrentUserAdmin() || !(await getCurrentAdminPermissions()).includes("world.manage")) redirect("/dashboard/admin");
  return <WorldAccessClient />;
}
