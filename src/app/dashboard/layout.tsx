import React from "react";
import NavMenu from "./components/NavMenu";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="homeDash w-full h-[168%] bg-cover">
      <NavMenu />
      <main className="flex-1 overflow-y-auto ml-[25%] p-6">{children}</main>
    </div>
  );
}
