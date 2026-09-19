import RankingClient from "./components/RankingClient";

export default function RankingPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-2 sm:p-4">
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">Ranking de Caelum</p>
        <h1 className="font-imFeel text-4xl sm:text-5xl">Ranking</h1>
        <p className="mt-2 text-white/70">Os melhores de Caelum, categoria por categoria.</p>
      </div>

      <RankingClient />
    </div>
  );
}
