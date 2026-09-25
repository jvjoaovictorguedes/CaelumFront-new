"use client";

// Almanaque Marinho — todas as espécies de Pesca, descobertas ou não
// (silhueta "???" pra quem ainda não descobriu, spec de Bestiário como
// referência de convenção visual). Reaproveita GET /fishing/almanac,
// que já existia (fishingCatalogService.listarAlmanaque) mas não tinha
// nenhuma tela — só isso.
import { useEffect, useState } from "react";
import { fishingApi, type AlmanacEspecie } from "@/lib/api/fishing";

export default function FishingAlmanaque() {
  const [especies, setEspecies] = useState<AlmanacEspecie[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    fishingApi
      .getAlmanac()
      .then((dados) => {
        if (ativo) setEspecies(dados);
      })
      .catch(() => {
        if (ativo) setErro("Não foi possível carregar o Almanaque Marinho.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  if (carregando) return <p className="text-white/70">Carregando Almanaque…</p>;
  if (erro) return <p className="text-red-400">{erro}</p>;

  const total = especies.length;
  const descobertas = especies.filter((e) => e.descoberto).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-sky-500/30 bg-sky-950/30 p-4 text-white">
        <p className="text-sm uppercase tracking-widest text-sky-300">Almanaque Marinho</p>
        <p className="text-2xl font-imFeel">
          {descobertas} / {total} espécies descobertas
        </p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-sky-400 transition-all"
            style={{ width: `${total > 0 ? (descobertas / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {especies.map((e) => (
          <div
            key={e.id}
            className={`relative rounded-xl border p-3 text-center ${
              e.descoberto ? "border-sky-500/40 bg-black/30" : "border-white/10 bg-black/50"
            }`}
          >
            {e.lendario && e.descoberto && (
              <span className="absolute right-1 top-1 rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-black">
                Lendário
              </span>
            )}
            <div
              className={`mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full text-2xl ${
                e.descoberto ? "bg-sky-500/20 text-sky-200" : "bg-white/5 text-white/30"
              }`}
              aria-hidden="true"
            >
              {e.descoberto ? "🐟" : "?"}
            </div>
            <p className={`text-sm font-bold ${e.descoberto ? "text-white" : "text-white/40"}`}>
              {e.descoberto ? e.nome : "???"}
            </p>
            {e.descoberto ? (
              <div className="mt-1 text-[11px] text-white/60">
                <p>Capturados: {e.total_capturado}</p>
                <p>Maior peso: {e.maior_peso_g}g</p>
              </div>
            ) : (
              <p className="mt-1 text-[11px] text-white/30">Ainda não descoberta</p>
            )}
          </div>
        ))}
        {especies.length === 0 && <p className="col-span-full text-white/50">Nenhuma espécie cadastrada ainda.</p>}
      </div>
    </div>
  );
}
