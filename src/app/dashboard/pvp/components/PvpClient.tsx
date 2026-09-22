"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import PvpArena, { type ResultadoDuelo } from "./PvpArena";
import LiveDuelArena from "./LiveDuelArena";
import RankedPanel from "./RankedPanel";
import TournamentsPanel from "./TournamentsPanel";
import { usePvpSocket } from "@/contexts/PvpSocketContext";
import { AVISO_CASUAL_NAO_COMPETITIVO } from "@/lib/api/pvp";

type Aba = "casual" | "ranked" | "torneios";

const ABAS: { chave: Aba; label: string }[] = [
  { chave: "casual", label: "Casual" },
  { chave: "ranked", label: "Arena Ranqueada" },
  { chave: "torneios", label: "Torneios" },
];

interface OponenteApi {
  id: number;
  nome: string;
  nivel: number;
  genero: string;
  Race?: { nome_masculino?: string; nome_feminino?: string };
  Class?: { nome?: string };
}

interface StatusApi {
  total_batalhas: number;
  vitorias: number;
  derrotas: number;
  sequencia_vitorias: number;
  maximo_sequencia_vitorias: number;
}

interface CharacterInfo {
  id: number;
  nome: string;
  nivel: number;
  genero: string;
  classe?: string;
}

export default function PvpClient({
  character,
  oponentesIniciais,
  statusInicial,
}: {
  character: CharacterInfo;
  oponentesIniciais: OponenteApi[];
  statusInicial: StatusApi | null;
}) {
  const [status, setStatus] = useState(statusInicial);
  const [carregandoId, setCarregandoId] = useState<number | null>(null);
  const [resultado, setResultado] = useState<ResultadoDuelo | null>(null);
  const [erro, setErro] = useState("");
  const [aba, setAba] = useState<Aba>("casual");

  const {
    onlineIds,
    duelo,
    resultadoFinal,
    desafiar: desafiarAoVivo,
    desafioEnviadoPara,
    ratingUpdate,
    erro: erroSocket,
    limparErro: limparErroSocket,
  } = usePvpSocket();

  const duelosProcessadosRef = useRef<Set<number>>(new Set());

  // O RankedPanel é DESMONTADO enquanto o duelo ao vivo ocupa a tela, então
  // ele não consegue ver por si só o fim da partida ranqueada. O PvpClient,
  // que fica montado o tempo todo, guarda o desfecho aqui e entrega pronto
  // pro painel quando ele volta — é assim que a tela de resultado ranqueado
  // (antes → depois, promoção/rebaixamento) sobrevive à volta pra arena.
  const [resultadoRankedBruto, setResultadoRankedBruto] = useState<{
    duelId: number;
    venceu: boolean;
    ratingAntes: number | null;
    ratingDepois: number | null;
  } | null>(null);

  useEffect(() => {
    if (!resultadoFinal) return;
    if (!resultadoFinal.ranked && !duelo?.ranked) return;
    if (resultadoFinal.motivo === "FalhaServidor") return;
    const minhaChave = duelo?.a.id === character.id ? "A" : "B";
    // "ranked:rating:update" é sempre sobre o desafiante (eu) — o
    // defensor é IA e nunca tem rating alterado (§8), então não há
    // jogadorA/jogadorB pra escolher, é um valor só.
    setResultadoRankedBruto({
      duelId: resultadoFinal.duelId,
      venceu: resultadoFinal.vencedorChave === minhaChave,
      ratingAntes: ratingUpdate?.ratingAntes ?? null,
      ratingDepois: ratingUpdate?.ratingDepois ?? null,
    });
  }, [resultadoFinal, duelo, ratingUpdate, character.id]);

  // Online primeiro, depois por nível (maior pro menor) — recalculado
  // sempre que onlineIds muda (socket), não só na carga inicial.
  const oponentesOrdenados = useMemo(() => {
    return [...oponentesIniciais].sort((a, b) => {
      const aOnline = onlineIds.has(a.id);
      const bOnline = onlineIds.has(b.id);
      if (aOnline !== bOnline) return aOnline ? -1 : 1;
      return b.nivel - a.nivel;
    });
  }, [oponentesIniciais, onlineIds]);

  useEffect(() => {
    if (!resultadoFinal || duelosProcessadosRef.current.has(resultadoFinal.duelId)) return;
    // Só resultado CASUAL mexe nos contadores casuais. Antes este efeito
    // rodava pra qualquer duelo: uma vitória ranqueada (ou de torneio)
    // aparecia como vitória casual até o próximo refresh, misturando os
    // dois modos. Ranqueada só altera Elo/Rating (ver RankedPanel).
    const ehCasual = !resultadoFinal.ranked && !duelo?.ranked && !duelo?.torneio;
    if (!ehCasual) {
      duelosProcessadosRef.current.add(resultadoFinal.duelId);
      return;
    }
    duelosProcessadosRef.current.add(resultadoFinal.duelId);
    const venci = resultadoFinal.vencedorChave === (duelo?.a.id === character.id ? "A" : "B");
    setStatus((atual) => ({
      total_batalhas: (atual?.total_batalhas ?? 0) + 1,
      vitorias: (atual?.vitorias ?? 0) + (venci ? 1 : 0),
      derrotas: (atual?.derrotas ?? 0) + (venci ? 0 : 1),
      sequencia_vitorias: venci ? (atual?.sequencia_vitorias ?? 0) + 1 : 0,
      maximo_sequencia_vitorias: atual?.maximo_sequencia_vitorias ?? 0,
    }));
  }, [resultadoFinal, duelo, character.id]);

  async function desafiar(idOponente: number) {
    if (carregandoId) return;
    setCarregandoId(idOponente);
    setErro("");
    try {
      const resposta = await axiosInstance.post<{ data?: ResultadoDuelo }>(
        "/pvp/challenge",
        { id_desafiado: idOponente },
      );
      const data = resposta.data?.data;
      if (data) {
        setResultado(data);
        setStatus((atual) => ({
          total_batalhas: (atual?.total_batalhas ?? 0) + 1,
          vitorias: (atual?.vitorias ?? 0) + (data.vencedorChave === "A" ? 1 : 0),
          derrotas: (atual?.derrotas ?? 0) + (data.vencedorChave === "B" ? 1 : 0),
          sequencia_vitorias:
            data.vencedorChave === "A" ? (atual?.sequencia_vitorias ?? 0) + 1 : 0,
          maximo_sequencia_vitorias: atual?.maximo_sequencia_vitorias ?? 0,
        }));
      }
    } catch (error: unknown) {
      const mensagem =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Não foi possível iniciar o duelo.";
      setErro(mensagem);
    } finally {
      setCarregandoId(null);
    }
  }

  if (duelo) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-2 sm:p-4">
        <LiveDuelArena meuCharacterId={character.id} />
      </div>
    );
  }

  if (resultado) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-2 sm:p-4">
        <PvpArena resultado={resultado} aoFechar={() => setResultado(null)} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-2 sm:p-4">
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">
          Arena de Caelum
        </p>
        <h1 className="font-imFeel text-4xl sm:text-5xl">Duelo</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {ABAS.map(({ chave, label }) => (
          <button
            key={chave}
            type="button"
            onClick={() => setAba(chave)}
            className={`flex-1 rounded-lg border-2 px-3 py-2 text-xs font-bold uppercase tracking-widest transition sm:text-sm ${
              aba === chave
                ? "border-[#F3B43F] bg-[#BC8418] text-black"
                : "border-white/20 bg-transparent text-white/70 hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {erroSocket && (
        <p className="text-sm text-red-400">
          {erroSocket}{" "}
          <button onClick={limparErroSocket} className="underline">
            fechar
          </button>
        </p>
      )}

      {aba === "ranked" ? (
        <RankedPanel
          meuCharacterId={character.id}
          resultadoBruto={resultadoRankedBruto}
          aoLimparResultado={() => setResultadoRankedBruto(null)}
        />
      ) : aba === "torneios" ? (
        <TournamentsPanel meuCharacterId={character.id} />
      ) : (
        <>
          {/* Aviso obrigatório da spec §7 — curto, mas sempre visível na
              aba Casual (e na visão casual do Ranking). */}
          <p className="rounded-xl border border-[#F3B43F]/30 bg-black/30 px-4 py-2 text-xs leading-relaxed text-white/65">
            {AVISO_CASUAL_NAO_COMPETITIVO}
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <EstatisticaCard label="Vitórias" valor={status?.vitorias ?? 0} />
            <EstatisticaCard label="Derrotas" valor={status?.derrotas ?? 0} />
            <EstatisticaCard label="Sequência atual" valor={status?.sequencia_vitorias ?? 0} />
            <EstatisticaCard label="Melhor sequência" valor={status?.maximo_sequencia_vitorias ?? 0} />
          </div>

          {erro && <p className="text-sm text-red-400">{erro}</p>}

          <div className="rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-4 text-white shadow-lg">
            <p className="mb-3 text-sm uppercase tracking-widest text-[#F3B43F]">
              Desafiar um jogador
            </p>
            {oponentesOrdenados.length === 0 ? (
              <p className="text-sm text-white/60">
                Nenhum outro jogador com personagem ainda. Volte mais tarde.
              </p>
            ) : (
              <div className="grid max-h-[28rem] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                {oponentesOrdenados.map((oponente) => {
                  const nomeRaca =
                    oponente.genero === "Feminino"
                      ? oponente.Race?.nome_feminino
                      : oponente.Race?.nome_masculino;
                  const estaOnline = onlineIds.has(oponente.id);
                  const aguardandoResposta = desafioEnviadoPara === oponente.id;
                  return (
                    <div
                      key={oponente.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-[#3a2f24] px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-[#F3B43F]">
                          {oponente.nome}{" "}
                          <span
                            className={`ml-1 inline-block h-2 w-2 shrink-0 rounded-full align-middle ${
                              estaOnline ? "bg-green-400" : "bg-white/20"
                            }`}
                            title={estaOnline ? "Online" : "Offline"}
                          />
                        </p>
                        <p className="truncate text-xs text-white/60">
                          Nv. {oponente.nivel} · {nomeRaca ?? "?"} ·{" "}
                          {oponente.Class?.nome ?? "?"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
                        {estaOnline && (
                          <button
                            onClick={() => desafiarAoVivo(oponente.id)}
                            disabled={aguardandoResposta || desafioEnviadoPara !== null}
                            className="rounded-lg border-2 border-green-400 bg-transparent px-3 py-1.5 text-sm font-bold text-green-400 transition hover:bg-green-400/10 disabled:opacity-50"
                          >
                            {aguardandoResposta ? "Aguardando..." : "Duelo ao vivo"}
                          </button>
                        )}
                        <button
                          onClick={() => desafiar(oponente.id)}
                          disabled={carregandoId !== null}
                          className="rounded-lg border-2 border-[#F3B43F] bg-[#BC8418] px-3 py-1.5 text-sm font-bold text-black transition hover:bg-[#a5710f] disabled:opacity-50"
                        >
                          {carregandoId === oponente.id ? "Duelando..." : "Desafiar"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function EstatisticaCard({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#292018]/90 p-3 text-center text-white shadow-lg">
      <p className="text-2xl font-bold text-[#F3B43F]">{valor}</p>
      <p className="text-xs uppercase tracking-wide text-white/60">{label}</p>
    </div>
  );
}
