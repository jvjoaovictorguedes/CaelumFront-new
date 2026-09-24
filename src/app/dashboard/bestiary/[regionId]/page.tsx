import Link from "next/link";

import axiosInstance from "@/utils/axiosIntance";
import { getCurrentCharacter } from "@/utils/character-session";
import { resolveMediaUrl } from "@/utils/media-url";
import PageMusic from "@/components/music/PageMusic";
import { MUSIC } from "@/constants/music";

interface MonstroApi {
  descoberto: boolean;
  nome: string;
  raridade: string;
  descricao: string | null;
  imagem_url: string | null;
  nivel_min: number | null;
  nivel_max: number | null;
  abates: number;
  requisito_proximo_nivel: number | null;
}

interface ZonaApi {
  id: number;
  nome: string;
  imagem_url: string | null;
  descobertos: number;
  total: number;
  maestria_nivel: number;
  maestria_numeral: string | null;
  progresso_pct_proximo_nivel: number;
  proximo_nivel: number | null;
}

interface RegiaoResponse {
  data?: {
    zona?: ZonaApi;
    monstros?: MonstroApi[];
  };
}

const COR_RARIDADE: Record<string, string> = {
  Comum: "bg-white/20 text-white",
  Raro: "bg-[#F3B43F]/80 text-black",
};

export default async function BestiaryRegionPage({
  params,
}: {
  params: Promise<{ regionId: string }>;
}) {
  const { regionId } = await params;
  const character = await getCurrentCharacter();

  if (!character) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="rounded-2xl border border-[#F3B43F]/30 bg-[#292018]/80 p-6 text-center text-white shadow-xl">
          <h1 className="mb-4 font-imFeel text-4xl">Bestiário</h1>
          <p className="text-lg text-white/80">Crie um personagem para consultar o Bestiário.</p>
        </div>
      </div>
    );
  }

  let zona: ZonaApi | null = null;
  let monstros: MonstroApi[] = [];
  try {
    const response = await axiosInstance.get<RegiaoResponse>(`/bestiary/regions/${regionId}`);
    zona = response.data?.data?.zona ?? null;
    monstros = response.data?.data?.monstros ?? [];
  } catch (error) {
    console.error("Erro ao carregar região do Bestiário:", error);
  }

  if (!zona) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#F3B43F]/30 bg-[#292018]/80 p-6 text-center text-white shadow-xl">
          <h1 className="font-imFeel text-4xl">Bestiário</h1>
          <p className="text-lg text-white/80">Região não encontrada.</p>
          <Link href="/dashboard/bestiary" className="text-[#F3B43F] underline">
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <PageMusic track={MUSIC.BESTIARIO} />
      <div>
        <Link href="/dashboard/bestiary" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Bestiário
        </Link>
        <h1 className="mt-1 font-imFeel text-4xl">{zona.nome}</h1>
        <p className="mt-1 text-sm text-white/70">
          Descobertas: {zona.descobertos} / {zona.total} · Maestria:{" "}
          {zona.maestria_numeral ? `Nível ${zona.maestria_numeral}` : "Bloqueada"}
          {zona.proximo_nivel && ` · Progresso para Maestria ${zona.proximo_nivel}: ${zona.progresso_pct_proximo_nivel}%`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {monstros.map((monstro, indice) => {
          if (!monstro.descoberto) {
            return (
              <div
                key={indice}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 p-6 text-center text-white/50"
              >
                <p className="font-imFeel text-3xl">???</p>
                <p className="text-xs">Raridade: ???</p>
                <p className="text-xs">Informações: ???</p>
                <p className="text-xs">Drops: ???</p>
              </div>
            );
          }

          const progressoRequisito =
            monstro.requisito_proximo_nivel != null
              ? Math.min(100, Math.round((monstro.abates / monstro.requisito_proximo_nivel) * 100))
              : null;
          const imagemMonstro = resolveMediaUrl(monstro.imagem_url);

          return (
            <div
              key={indice}
              className="flex flex-col gap-2 rounded-2xl border border-[#F3B43F]/30 bg-[#292018]/80 p-4 text-white shadow-xl"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-imFeel text-xl">{monstro.nome}</h2>
                <span
                  className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${COR_RARIDADE[monstro.raridade] ?? "bg-white/20 text-white"}`}
                >
                  {monstro.raridade}
                </span>
              </div>
              {imagemMonstro && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagemMonstro}
                  alt={monstro.nome}
                  className="h-40 w-full rounded-xl border border-white/10 object-cover"
                />
              )}
              {monstro.descricao && <p className="text-sm text-white/70">{monstro.descricao}</p>}
              {monstro.nivel_min != null && (
                <p className="text-xs text-white/50">
                  Níveis encontrados: {monstro.nivel_min}–{monstro.nivel_max}
                </p>
              )}
              <p className="text-sm font-bold text-[#F3B43F]">Abates: {monstro.abates}</p>
              {progressoRequisito != null && (
                <p className="text-xs text-white/60">
                  Progresso para o próximo nível de Maestria: {monstro.abates} / {monstro.requisito_proximo_nivel} (
                  {progressoRequisito}%)
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
