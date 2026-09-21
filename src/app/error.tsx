"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CaelumBrasao } from "@/components/CaelumBrand/CaelumBrand";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro na aplicação:", error);
  }, [error]);

  return (
    <div className="homeMe relative flex min-h-screen w-full flex-col items-center justify-center gap-6 overflow-y-auto bg-cover px-4 py-6 text-center">
      <CaelumBrasao tamanho="sm" />
      <div className="w-full max-w-md rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-6 text-white shadow-2xl">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">Algo deu errado</p>
        <h1 className="font-imFeel text-3xl sm:text-4xl">Ops, tropeçamos numa pedra</h1>
        <p className="mt-3 text-sm text-white/70">
          Não foi possível carregar essa tela agora. Isso não afeta seu personagem — pode ser um
          problema passageiro.
        </p>
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={() => reset()}
            className="rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black transition hover:bg-[#a5710f]"
          >
            Tentar de novo
          </button>
          <Link
            href="/dashboard"
            className="rounded-lg border-2 border-white/30 px-4 py-2 font-bold text-white transition hover:bg-white/10"
          >
            Voltar para o Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
