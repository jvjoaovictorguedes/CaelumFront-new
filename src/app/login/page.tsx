import Login from "@/app/login/components/Login/login";
import { CaelumBrasao } from "@/components/CaelumBrand/CaelumBrand";
import React, { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="homeMe relative w-full h-screen flex items-center bg-cover justify-center">
      <CaelumBrasao className="absolute left-1/2 top-4 z-10 -translate-x-1/2 sm:top-6" />
      {/* Suspense é exigido pelo Next.js porque Login usa useSearchParams
          (pro aviso de "sessão expirada" vindo do middleware). */}
      <Suspense fallback={null}>
        <Login />
      </Suspense>
    </div>
  );
}
