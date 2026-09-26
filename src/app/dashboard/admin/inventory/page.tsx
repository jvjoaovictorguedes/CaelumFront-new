import { redirect } from "next/navigation";
import { Suspense } from "react";
import { isCurrentUserAdmin } from "@/utils/character-session";
import AdminInventoryClient from "./AdminInventoryClient";

export default async function AdminInventoryPage() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 p-2 sm:p-4">
      {/* Suspense é exigido pelo Next.js porque AdminInventoryClient usa
          useSearchParams (pra abrir já com um personagem, vindo da Busca). */}
      <Suspense fallback={null}>
        <AdminInventoryClient />
      </Suspense>
    </div>
  );
}
