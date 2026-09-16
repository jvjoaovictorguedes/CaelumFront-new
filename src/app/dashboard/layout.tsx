import React from "react";
import NavMenu from "./components/NavMenu";
import { getUserCookie } from "@/app/create/temp-character-data-action";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await getUserCookie();

  return (
    <div className="homeDash min-h-[100dvh] w-full overflow-x-hidden bg-cover bg-center bg-fixed">
      <NavMenu currentUserId={user?.id ? Number(user.id) : undefined} />
      <main className="dashboard-main min-h-[100dvh] overflow-y-auto px-4 pb-8 pt-20 sm:px-6 lg:px-8 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
