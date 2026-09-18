import ForgotPassword from "@/app/forgot-password/components/ForgotPassword/ForgotPassword";
import { CaelumBrasao } from "@/components/CaelumBrand/CaelumBrand";
import React from "react";

export default function ForgotPasswordPage() {
  return (
    <div className="homeMe relative flex min-h-screen w-full flex-col items-center justify-center gap-2 overflow-y-auto bg-cover px-4 py-6">
      <CaelumBrasao className="shrink-0" />
      <ForgotPassword />
    </div>
  );
}
