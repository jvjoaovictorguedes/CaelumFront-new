import Register from "@/components/Register/Register";
import { CaelumBrasao } from "@/components/CaelumBrand/CaelumBrand";
import React from "react";

export default function LoginPage() {
  return (
    <div className="homeMe relative w-full h-screen flex items-center bg-cover justify-center">
      <CaelumBrasao
        tamanho="sm"
        className="absolute left-1/2 top-0 z-10 -translate-x-1/2"
      />
      <Register />
    </div>
  );
}
