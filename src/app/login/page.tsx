import Login from "@/app/login/components/Login/login";
import React, { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="homeMe w-full h-screen flex items-center bg-cover justify-center">
      {/* Suspense é exigido pelo Next.js porque Login usa useSearchParams
          (pro aviso de "sessão expirada" vindo do middleware). */}
      <Suspense fallback={null}>
        <Login />
      </Suspense>
    </div>
  );
}
