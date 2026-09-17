import ResetPassword from "@/app/reset-password/components/ResetPassword/ResetPassword";
import React, { Suspense } from "react";

export default function ResetPasswordPage() {
  return (
    <div className="homeMe w-full h-screen flex items-center bg-cover justify-center">
      {/* Suspense é exigido pelo Next.js porque ResetPassword usa
          useSearchParams (pra ler o token do link do e-mail). */}
      <Suspense fallback={null}>
        <ResetPassword />
      </Suspense>
    </div>
  );
}
