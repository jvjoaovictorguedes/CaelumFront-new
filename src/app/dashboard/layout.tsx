import React from "react";
import NavMenu from "./components/NavMenu";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="homeDash min-h-[100dvh] w-full overflow-x-hidden bg-cover bg-center bg-fixed">
      <NavMenu />
      <main className="dashboard-main min-h-[100dvh] overflow-y-auto px-4 pb-8 pt-20 sm:px-6 lg:px-8 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
