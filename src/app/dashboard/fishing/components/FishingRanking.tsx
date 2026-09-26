"use client";

// Ranking da Pesca — duas categorias (GET /fishing/ranking?type=...):
// total de peixes capturados (a principal) e maior peixe já fisgado
// (secundária). "Minha posição" sempre vem calculada à parte pelo
// backend, mesmo padrão do Ranking v2 geral.
import { useEffect, useState } from "react";
import {
  fishingApi,
  type RankingPescaItemMaiorPeixe,
  type RankingPescaItemTotal,
  type RankingPescaResposta,
} from "@/lib/api/fishing";

type Categoria = "total" | "biggest";

export default function FishingRanking() {
  const [categoria, setCategoria] = useState<Categoria>("total");
  const [dados, setDados] = useState<RankingPescaResposta<RankingPescaItemTotal | RankingPescaItemMaiorPeixe> | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro("");
    fishingApi
      .getRanking(categoria, 1)
      .then((resposta) => {
        if (ativo) setDados(resposta);
      })
      .catch(() => {
        if (ativo) setErro("Não foi possível carregar o ranking de Pesca.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [categoria]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setCategoria("total")}
          className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
            categoria === "total" ? "border-sky-400 bg-sky-500 text-[#0b1b2b]" : "border-sky-500/40 bg-black/30 text-sky-300"
          }`}
        >
          Total capturado
        </button>
        <button
          type="button"
          onClick={() => setCategoria("biggest")}
          className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
            categoria === "biggest" ? "border-sky-400 bg-sky-500 text-[#0b1b2b]" : "border-sky-500/40 bg-black/30 text-sky-300"
          }`}
        >
          Maior peixe
        </button>
      </div>

      {carregando && <p className="text-white/70">Carregando ranking…</p>}
      {erro && <p className="text-red-400">{erro}</p>}

      {!carregando && !erro && dados && (
        <>
          <div className="rounded-xl border border-sky-500/30 bg-sky-950/30 p-3 text-sm text-white">
            {dados.minhaPosicao.elegivel ? (
              <p>
                Sua posição: <b className="text-sky-300">#{dados.minhaPosicao.posicao}</b>
                {categoria === "total"
                  ? ` — ${dados.minhaPosicao.total_capturado} capturados`
                  : ` — ${dados.minhaPosicao.weight_g}g`}
              </p>
            ) : (
              <p className="text-white/60">{dados.minhaPosicao.motivo}</p>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-sm text-white">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase text-white/50">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Personagem</th>
                  {categoria === "total" ? (
                    <>
                      <th className="px-3 py-2">Nível de Pesca</th>
                      <th className="px-3 py-2">Total capturado</th>
                    </>
                  ) : (
                    <>
                      <th className="px-3 py-2">Espécie</th>
                      <th className="px-3 py-2">Peso</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {dados.itens.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-white/50">
                      Ninguém no ranking ainda.
                    </td>
                  </tr>
                ) : (
                  dados.itens.map((item) => (
                    <tr key={item.id} className="border-b border-white/5">
                      <td className="px-3 py-2 font-bold text-sky-300">#{item.posicao}</td>
                      <td className="px-3 py-2">{item.nome}</td>
                      {categoria === "total" ? (
                        <>
                          <td className="px-3 py-2">{(item as RankingPescaItemTotal).nivel_pesca}</td>
                          <td className="px-3 py-2">{(item as RankingPescaItemTotal).total_capturado}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2">{(item as RankingPescaItemMaiorPeixe).especie_nome ?? "—"}</td>
                          <td className="px-3 py-2">{(item as RankingPescaItemMaiorPeixe).weight_g}g</td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
