import ResetPassword from "@/app/reset-password/components/ResetPassword/ResetPassword";
import { CaelumBrasao } from "@/components/CaelumBrand/CaelumBrand";
import React, { Suspense } from "react";

export default function ResetPasswordPage() {
  return (
    <div className="homeMe relative w-full h-screen flex items-center bg-cover justify-center">
      <CaelumBrasao className="absolute left-1/2 top-4 z-10 -translate-x-1/2 sm:top-6" />
      {/* Suspense é exigido pelo Next.js porque ResetPassword usa
          useSearchParams (pra ler o token do link do e-mail). */}
      <Suspense fallback={null}>
        <ResetPassword />
      </Suspense>
    </div>
  );
}
