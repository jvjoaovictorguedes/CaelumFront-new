import axiosInstance from "@/utils/axiosIntance";
import { getClassImage } from "@/utils/media-url";

interface RankingEntry {
  id_personagem: number;
  total_batalhas: number;
  vitorias: number;
  derrotas: number;
  sequencia_vitorias: number;
  maximo_sequencia_vitorias: number;
  Character?: {
    id: number;
    nome: string;
    nivel: number;
    genero: string;
    Race?: { nome_masculino?: string; nome_feminino?: string };
    Class?: { nome?: string };
  };
}

async function buscarRanking() {
  try {
    const resposta = await axiosInstance.get<{ data?: { ranking?: RankingEntry[] } }>(
      "/pvp/ranking",
    );
    return resposta.data?.data?.ranking ?? [];
  } catch (error) {
    console.error("Erro ao carregar ranking:", error);
    return [];
  }
}

export default async function RankingPage() {
  const ranking = await buscarRanking();
  const podio = ranking.slice(0, 3);
  const resto = ranking.slice(3);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-2 sm:p-4">
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">
          Arena de Caelum
        </p>
        <h1 className="font-imFeel text-4xl sm:text-5xl">Ranking</h1>
        <p className="mt-2 text-white/70">
          Os duelistas mais fortes de Caelum, por vitórias no duelo PVP.
        </p>
      </div>

      {ranking.length === 0 ? (
        <div className="rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-8 text-center text-white/70 shadow-lg">
          Ninguém entrou na arena ainda. Vá em Duelo e seja o primeiro a lutar!
        </div>
      ) : (
        <>
          <Podio entradas={podio} />
          {resto.length > 0 && <ListaRestante entradas={resto} />}
        </>
      )}
    </div>
  );
}

const ESTILO_POSICAO = [
  { medalha: "🥇", altura: "h-32 sm:h-40", cor: "border-[#F3B43F]", texto: "text-[#F3B43F]" },
  { medalha: "🥈", altura: "h-24 sm:h-28", cor: "border-slate-300", texto: "text-slate-200" },
  { medalha: "🥉", altura: "h-16 sm:h-20", cor: "border-amber-700", texto: "text-amber-600" },
];

// Ordem visual do pódio: 2º à esquerda, 1º no meio (mais alto), 3º à
// direita — o clássico "degrau" de pódio.
const ORDEM_VISUAL = [1, 0, 2];

function Podio({ entradas }: { entradas: RankingEntry[] }) {
  return (
    <div className="flex items-end justify-center gap-3 sm:gap-6">
      {ORDEM_VISUAL.map((indice) => (
        <CartaoPodio
          key={indice}
          posicao={indice + 1}
          entrada={entradas[indice]}
          estilo={ESTILO_POSICAO[indice]}
        />
      ))}
    </div>
  );
}

function CartaoPodio({
  posicao,
  entrada,
  estilo,
}: {
  posicao: number;
  entrada?: RankingEntry;
  estilo: (typeof ESTILO_POSICAO)[number];
}) {
  const personagem = entrada?.Character;

  if (!personagem) {
    return (
      <div className="flex flex-col items-center opacity-40">
        <div
          className={`mt-auto flex w-20 sm:w-28 ${estilo.altura} items-start justify-center rounded-t-xl border-2 border-dashed ${estilo.cor} bg-black/20 pt-2`}
        >
          <span className="font-imFeel text-2xl text-white/50">{posicao}º</span>
        </div>
      </div>
    );
  }

  const nomeRaca =
    personagem.genero === "Feminino"
      ? personagem.Race?.nome_feminino
      : personagem.Race?.nome_masculino;
  const imagem = getClassImage(personagem.Class?.nome);
  const destaque = posicao === 1;

  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl sm:text-3xl">{estilo.medalha}</span>
      <div
        className={`mb-2 h-16 w-16 rounded-full border-4 bg-[#3a2f24] bg-cover bg-center shadow-lg sm:h-20 sm:w-20 ${estilo.cor}`}
        style={{ backgroundImage: imagem ? `url(${imagem})` : undefined }}
      />
      <p
        className={`max-w-[6rem] truncate text-center font-imFeel text-white sm:max-w-[8rem] ${destaque ? "text-lg sm:text-xl" : "text-sm sm:text-base"}`}
      >
        {personagem.nome}
      </p>
      <p className="text-[10px] text-white/60 sm:text-xs">
        Nv. {personagem.nivel} · {nomeRaca ?? "?"}
      </p>
      <p className={`text-sm font-bold sm:text-base ${estilo.texto}`}>
        {entrada.vitorias} vitórias
      </p>
      <div
        className={`mt-2 flex w-20 sm:w-28 ${estilo.altura} items-start justify-center rounded-t-xl border-2 ${estilo.cor} bg-gradient-to-b from-[#3a2f24] to-[#1f1813] pt-2 shadow-inner`}
      >
        <span className="font-imFeel text-2xl text-white/80">{posicao}º</span>
      </div>
    </div>
  );
}

function ListaRestante({ entradas }: { entradas: RankingEntry[] }) {
  return (
    <div className="rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-4 text-white shadow-lg">
      <p className="mb-3 text-sm uppercase tracking-widest text-[#F3B43F]">
        Restante do ranking
      </p>
      <div className="flex flex-col divide-y divide-white/10">
        {entradas.map((entrada, indice) => {
          const personagem = entrada.Character;
          if (!personagem) return null;
          const nomeRaca =
            personagem.genero === "Feminino"
              ? personagem.Race?.nome_feminino
              : personagem.Race?.nome_masculino;

          return (
            <div
              key={entrada.id_personagem}
              className="flex items-center justify-between gap-3 py-2.5"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 text-center font-imFeel text-lg text-white/50">
                  {indice + 4}º
                </span>
                <div>
                  <p className="font-bold text-[#F3B43F]">{personagem.nome}</p>
                  <p className="text-xs text-white/60">
                    Nv. {personagem.nivel} · {nomeRaca ?? "?"} ·{" "}
                    {personagem.Class?.nome ?? "?"}
                  </p>
                </div>
              </div>
              <div className="text-right text-sm">
                <p className="font-bold text-white">
                  {entrada.vitorias}V / {entrada.derrotas}D
                </p>
                <p className="text-xs text-white/50">
                  sequência: {entrada.sequencia_vitorias}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
