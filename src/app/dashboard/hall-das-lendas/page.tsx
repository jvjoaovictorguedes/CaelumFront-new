import HallDasLendasClient from "./components/HallDasLendasClient";

export default function HallDasLendasPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-2 sm:p-4">
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">Proezas Únicas</p>
        <h1 className="font-imFeel text-4xl sm:text-5xl">Hall das Lendas</h1>
        <p className="mt-2 text-white/70">
          Feitos raros e permanentes de Caelum — cada um conquistado por um único aventureiro, pra
          sempre.
        </p>
      </div>

      <HallDasLendasClient />
    </div>
  );
}
