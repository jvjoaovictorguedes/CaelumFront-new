import React from "react";
import NavMenu from "./components/NavMenu";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="homeDash min-h-screen w-full bg-cover bg-center bg-fixed">
      <NavMenu />
      <main className="min-h-screen overflow-y-auto px-4 pb-8 pt-20 sm:px-6 lg:ml-72 lg:px-8 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
