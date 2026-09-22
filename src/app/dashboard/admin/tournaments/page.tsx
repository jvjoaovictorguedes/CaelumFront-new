import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/utils/character-session";
import AdminTournamentsClient from "./AdminTournamentsClient";

// Segunda camada, não a única: mesmo sem esse redirect, toda chamada de
// escrita cai numa rota /admin/pvp/tournaments/* protegida por
// authMiddleware + adminMiddleware (checagem real de User.isAdmin no
// banco a cada request). Isso aqui só evita mostrar a tela pra quem não
// vai conseguir usá-la.
export default async function AdminTournamentsPage() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 p-2 sm:p-4">
      <AdminTournamentsClient />
    </div>
  );
}
