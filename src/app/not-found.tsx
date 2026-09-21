import Link from "next/link";
import { CaelumBrasao } from "@/components/CaelumBrand/CaelumBrand";

export default function NotFound() {
  return (
    <div className="homeMe relative flex min-h-screen w-full flex-col items-center justify-center gap-6 overflow-y-auto bg-cover px-4 py-6 text-center">
      <CaelumBrasao tamanho="sm" />
      <div className="w-full max-w-md rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-6 text-white shadow-2xl">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">Caminho perdido</p>
        <h1 className="font-imFeel text-3xl sm:text-4xl">Essa página não existe</h1>
        <p className="mt-3 text-sm text-white/70">
          O link que você seguiu não leva a lugar nenhum em Caelum. Pode ter sido movido, ou o
          endereço está errado.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-block rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black transition hover:bg-[#a5710f]"
        >
          Voltar para o Dashboard
        </Link>
      </div>
    </div>
  );
}
