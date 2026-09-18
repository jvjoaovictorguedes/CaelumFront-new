import Register from "@/components/Register/Register";
import { CaelumBrasao } from "@/components/CaelumBrand/CaelumBrand";
import React from "react";

export default function LoginPage() {
  return (
    <div className="homeMe relative flex min-h-screen w-full flex-col items-center justify-center gap-2 overflow-y-auto bg-cover px-4 py-6">
      <CaelumBrasao tamanho="sm" className="shrink-0" />
      <Register />
    </div>
  );
}
