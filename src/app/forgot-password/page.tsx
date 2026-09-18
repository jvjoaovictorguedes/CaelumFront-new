import ForgotPassword from "@/app/forgot-password/components/ForgotPassword/ForgotPassword";
import { CaelumBrasao } from "@/components/CaelumBrand/CaelumBrand";
import React from "react";

export default function ForgotPasswordPage() {
  return (
    <div className="homeMe relative w-full h-screen flex items-center bg-cover justify-center">
      <CaelumBrasao className="absolute left-1/2 top-4 z-10 -translate-x-1/2 sm:top-6" />
      <ForgotPassword />
    </div>
  );
}
