import ResetPassword from "@/app/reset-password/components/ResetPassword/ResetPassword";
import { CaelumBrasao } from "@/components/CaelumBrand/CaelumBrand";
import React, { Suspense } from "react";

export default function ResetPasswordPage() {
  return (
    <div className="homeMe relative flex min-h-screen w-full flex-col items-center justify-center gap-2 overflow-y-auto bg-cover px-4 py-6">
      <CaelumBrasao className="shrink-0" />
      {/* Suspense é exigido pelo Next.js porque ResetPassword usa
          useSearchParams (pra ler o token do link do e-mail). */}
      <Suspense fallback={null}>
        <ResetPassword />
      </Suspense>
    </div>
  );
}
