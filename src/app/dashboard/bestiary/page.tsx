import Link from "next/link";

import axiosInstance from "@/utils/axiosIntance";
import { getCurrentCharacter } from "@/utils/character-session";

interface RegiaoApi {
  id: number;
  nome: string;
  imagem_url: string | null;
  descobertos: number;
  total: number;
  maestria_nivel: number;
  maestria_numeral: string | null;
  progresso_pct_proximo_nivel: number;
}

interface ResumoApi {
  criaturas_descobertas: number;
  criaturas_totais: number;
  regioes_completas: number;
  regioes_totais: number;
  maestrias_v: number;
}

interface BestiarioResponse {
  data?: {
    regioes?: RegiaoApi[];
    resumo?: ResumoApi;
  };
}

export default async function BestiaryPage() {
  const character = await getCurrentCharacter();

  if (!character) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <h1 className="mb-4 font-imFeel text-4xl">Bestiário</h1>
        <p className="text-lg text-gray-700">Crie um personagem para consultar o Bestiário.</p>
      </div>
    );
  }

  let regioes: RegiaoApi[] = [];
  let resumo: ResumoApi | null = null;
  try {
    const response = await axiosInstance.get<BestiarioResponse>("/bestiary");
    regioes = response.data?.data?.regioes ?? [];
    resumo = response.data?.data?.resumo ?? null;
  } catch (error) {
    console.error("Erro ao carregar Bestiário:", error);
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h1 className="font-imFeel text-4xl">Bestiário de Caelum</h1>
        {resumo && (
          <p className="mt-1 text-sm text-white/70">
            Criaturas descobertas: {resumo.criaturas_descobertas} / {resumo.criaturas_totais} · Regiões
            completas: {resumo.regioes_completas} / {resumo.regioes_totais} · Maestrias V:{" "}
            {resumo.maestrias_v} / {resumo.regioes_totais}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {regioes.map((regiao) => {
          const completa = regiao.total > 0 && regiao.descobertos === regiao.total;
          const maestriaV = regiao.maestria_nivel === 5;

          return (
            <Link
              key={regiao.id}
              href={`/dashboard/bestiary/${regiao.id}`}
              className={`flex flex-col justify-between rounded-2xl border p-4 text-white shadow-xl transition hover:border-[#F3B43F] ${
                maestriaV
                  ? "border-[#F3B43F] bg-gradient-to-br from-[#3a2c14] to-[#292018]"
                  : "border-[#F3B43F]/30 bg-[#292018]/80"
              }`}
            >
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="font-imFeel text-xl">{regiao.nome}</h2>
                  {maestriaV && (
                    <span className="rounded-full bg-[#F3B43F] px-2 py-0.5 text-[10px] font-bold uppercase text-black">
                      ★ Maestria completa
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/70">
                  Descobertas: {regiao.descobertos} / {regiao.total}
                </p>
                <p className="text-sm text-white/70">
                  Maestria: {regiao.maestria_numeral ? `Nível ${regiao.maestria_numeral}` : "Bloqueada"}
                </p>
                {completa && regiao.maestria_nivel < 5 && (
                  <p className="mt-1 text-xs text-[#F3B43F]/80">
                    Progresso para o próximo nível: {regiao.progresso_pct_proximo_nivel}%
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
