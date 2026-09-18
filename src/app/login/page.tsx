import Login from "@/app/login/components/Login/login";
import { CaelumBrasao } from "@/components/CaelumBrand/CaelumBrand";
import React, { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="homeMe relative flex min-h-screen w-full flex-col items-center justify-center gap-2 overflow-y-auto bg-cover px-4 py-6">
      <CaelumBrasao className="shrink-0" />
      {/* Suspense é exigido pelo Next.js porque Login usa useSearchParams
          (pro aviso de "sessão expirada" vindo do middleware). */}
      <Suspense fallback={null}>
        <Login />
      </Suspense>
    </div>
  );
}
