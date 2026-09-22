"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePvpSocket } from "@/contexts/PvpSocketContext";
import EloBadge from "@/components/pvp/EloBadge";
import {
  buscarLeaderboardRanked,
  buscarStatusRanked,
  dataCurta,
  iniciarPartidaRanked,
  mensagemDeErro,
  rotuloDeElo,
  tempoRestante,
  type LinhaLeaderboard,
  type StatusRanked,
} from "@/lib/api/pvp";

/** Snapshot do Elo tirado ANTES da partida, pra montar o antes → depois. */
interface EloAntes {
  tier?: string | null;
  division?: string | null;
  rating?: number | null;
}

export default function RankedPanel({ meuCharacterId }: { meuCharacterId: number }) {
  const { conectado, duelo, resultadoFinal, ratingUpdate } = usePvpSocket();

  const [status, setStatus] = useState<StatusRanked | null>(null);
  const [carregandoStatus, setCarregandoStatus] = useState(true);
  const [buscandoPartida, setBuscandoPartida] = useState(false);
  const [erro, setErro] = useState("");
  const [leaderboard, setLeaderboard] = useState<LinhaLeaderboard[] | null>(null);
  const [carregandoLeaderboard, setCarregandoLeaderboard] = useState(false);
  const [eloAntes, setEloAntes] = useState<EloAntes | null>(null);
  const [resultadoRanked, setResultadoRanked] = useState<{
    venceu: boolean;
    antes: EloAntes;
    depois: EloAntes;
  } | null>(null);

  const eloAntesRef = useRef<EloAntes | null>(null);
  eloAntesRef.current = eloAntes;

  const carregarStatus = useCallback(async () => {
    const novo = await buscarStatusRanked();
    setStatus(novo);
    setCarregandoStatus(false);
    return novo;
  }, []);

  useEffect(() => {
    carregarStatus();
  }, [carregarStatus]);

  // Quando um duelo ranqueado termina, recarrega o status e monta a tela
  // de resultado (antes → depois). O backend v2 pode mandar o tier novo
  // no `ranked:rating:update`; se não mandar, o status recarregado já
  // traz — por isso os dois caminhos são tolerados.
  useEffect(() => {
    if (!resultadoFinal || !duelo?.ranked) return;
    const minhaChave = duelo.a.id === meuCharacterId ? "A" : "B";
    const venceu = resultadoFinal.vencedorChave === minhaChave;
    const antes = eloAntesRef.current ?? {};

    carregarStatus().then((novo) => {
      const doSocket = ratingUpdate
        ? minhaChave === "A"
          ? ratingUpdate.jogadorA
          : ratingUpdate.jogadorB
        : null;
      setResultadoRanked({
        venceu,
        antes: {
          tier: antes.tier ?? null,
          division: antes.division ?? null,
          rating: antes.rating ?? doSocket?.ratingAntes ?? null,
        },
        depois: {
          tier: novo?.tier ?? null,
          division: novo?.division ?? null,
          rating: novo?.rating ?? doSocket?.ratingDepois ?? null,
        },
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultadoFinal?.duelId, duelo?.ranked]);

  async function buscarPartida() {
    if (buscandoPartida) return;
    setBuscandoPartida(true);
    setErro("");
    setResultadoRanked(null);
    // Guarda o Elo atual pra conseguir mostrar "antes → depois" no fim.
    setEloAntes({
      tier: status?.tier ?? null,
      division: status?.division ?? null,
      rating: status?.rating ?? null,
    });
    try {
      await iniciarPartidaRanked();
      // O duelo em si chega pelo socket (ranked:match:start) e o
      // PvpClient troca a tela pra LiveDuelArena. Não há tela de espera:
      // o oponente é controlado por IA, a partida começa na hora.
      await carregarStatus();
    } catch (error: unknown) {
      setErro(mensagemDeErro(error, "Não foi possível iniciar uma partida ranqueada agora."));
    } finally {
      setBuscandoPartida(false);
    }
  }

  async function alternarLeaderboard() {
    if (leaderboard) {
      setLeaderboard(null);
      return;
    }
    setCarregandoLeaderboard(true);
    setLeaderboard(await buscarLeaderboardRanked());
    setCarregandoLeaderboard(false);
  }

  if (carregandoStatus) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-4 text-white shadow-lg">
        <p className="text-sm text-white/60">Carregando Arena Ranqueada...</p>
      </div>
    );
  }

  const partidasHoje = status?.matchesToday ?? 0;
  const limiteDiario = status?.dailyLimit ?? 10;
  const atingiuLimite = partidasHoje >= limiteDiario;
  const fimDaTemporada = status?.seasonEndsAt ?? status?.temporada?.ends_at ?? null;
  const restanteTemporada = tempoRestante(fimDaTemporada);

  return (
    <div className="flex flex-col gap-4">
      {resultadoRanked && (
        <ResultadoRanqueado
          resultado={resultadoRanked}
          partidasHoje={partidasHoje}
          limiteDiario={limiteDiario}
          aoFechar={() => setResultadoRanked(null)}
        />
      )}

      <div className="rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-5 text-white shadow-xl">
        <p className="text-xs uppercase tracking-widest text-[#F3B43F]">
          {status?.temporada?.nome ?? "Arena Ranqueada"}
        </p>

        <div className="mt-3 flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <EloBadge tier={status?.tier} divisao={status?.division} tamanho="lg" />

          <div className="grid flex-1 grid-cols-2 gap-3 text-center sm:grid-cols-4 sm:text-left">
            <Metrica label="Rating" valor={status?.rating ?? "—"} />
            <Metrica
              label="Temporada"
              valor={`${status?.seasonWins ?? 0}V / ${status?.seasonLosses ?? 0}D`}
            />
            <Metrica label="Melhor rating" valor={status?.peakRating ?? "—"} />
            <Metrica
              label="Partidas hoje"
              valor={`${partidasHoje} / ${limiteDiario}`}
              alerta={atingiuLimite}
            />
          </div>
        </div>

        {erro && <p className="mt-3 text-sm text-red-400">{erro}</p>}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={buscarPartida}
            disabled={buscandoPartida || atingiuLimite || !!duelo || !conectado}
            className="flex-1 rounded-lg border-2 border-[#F3B43F] bg-[#BC8418] px-4 py-3 text-sm font-bold uppercase tracking-widest text-black transition hover:bg-[#a5710f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {buscandoPartida ? "Preparando partida..." : "Buscar partida"}
          </button>
          <button
            type="button"
            onClick={alternarLeaderboard}
            className="flex-1 rounded-lg border-2 border-[#F3B43F]/60 bg-transparent px-4 py-3 text-sm font-bold uppercase tracking-widest text-[#F3B43F] transition hover:bg-[#F3B43F]/10"
          >
            {leaderboard ? "Esconder leaderboard" : "Ver leaderboard"}
          </button>
        </div>

        {atingiuLimite && (
          <p className="mt-2 text-center text-xs text-yellow-400 sm:text-left">
            Você atingiu o limite de {limiteDiario} partidas ranqueadas de hoje. Volte amanhã.
          </p>
        )}
        {!conectado && (
          <p className="mt-2 text-center text-xs text-white/50 sm:text-left">
            Conectando ao servidor de duelos...
          </p>
        )}
      </div>

      <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/90 p-4 text-white shadow-lg">
        <p className="text-xs uppercase tracking-widest text-[#F3B43F]">Temporada</p>
        <p className="mt-1 text-sm text-white/80">
          {restanteTemporada
            ? `Termina em ${restanteTemporada}${dataCurta(fimDaTemporada) ? ` (${dataCurta(fimDaTemporada)})` : ""}.`
            : "Data de encerramento ainda não definida pelo servidor."}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-white/55">
          Ao fim da temporada o Elo passa por um <strong>soft reset</strong>: em vez de voltar do
          zero, seu rating é puxado parcialmente na direção do valor inicial, de modo que quem
          terminou mais alto começa a próxima temporada mais alto. A posição final não garante
          nenhuma colocação na temporada seguinte.
        </p>
      </div>

      {leaderboard && (
        <div className="rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-4 text-white shadow-lg">
          <p className="mb-3 text-xs uppercase tracking-widest text-[#F3B43F]">
            Leaderboard da temporada
          </p>
          {carregandoLeaderboard ? (
            <p className="text-sm text-white/60">Carregando...</p>
          ) : leaderboard.length === 0 ? (
            <p className="text-sm text-white/60">
              Ninguém se classificou ainda (mínimo de partidas não atingido).
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="text-white/50">
                    <th className="pb-2">#</th>
                    <th className="pb-2">Jogador</th>
                    <th className="pb-2">Elo</th>
                    <th className="pb-2">Rating</th>
                    <th className="pb-2">V/D</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((linha) => (
                    <tr
                      key={linha.id}
                      className={linha.id === meuCharacterId ? "font-bold text-[#F3B43F]" : ""}
                    >
                      <td className="py-1">{linha.posicao}</td>
                      <td className="max-w-[10rem] truncate py-1">
                        {linha.nome}{" "}
                        <span
                          className={`ml-1 inline-block h-2 w-2 shrink-0 rounded-full align-middle ${
                            linha.online ? "bg-green-400" : "bg-white/20"
                          }`}
                        />
                      </td>
                      <td className="py-1">
                        {linha.tier
                          ? rotuloDeElo(linha.tier, linha.division)
                          : (linha.liga ?? "—")}
                      </td>
                      <td className="py-1">{linha.rating}</td>
                      <td className="py-1">
                        {linha.vitorias ?? 0}/{linha.derrotas ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Metrica({
  label,
  valor,
  alerta,
}: {
  label: string;
  valor: string | number;
  alerta?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-white/50">{label}</p>
      <p className={`text-lg font-bold ${alerta ? "text-yellow-400" : "text-white"}`}>{valor}</p>
    </div>
  );
}

function ResultadoRanqueado({
  resultado,
  partidasHoje,
  limiteDiario,
  aoFechar,
}: {
  resultado: { venceu: boolean; antes: EloAntes; depois: EloAntes };
  partidasHoje: number;
  limiteDiario: number;
  aoFechar: () => void;
}) {
  const { venceu, antes, depois } = resultado;
  const delta =
    typeof antes.rating === "number" && typeof depois.rating === "number"
      ? depois.rating - antes.rating
      : null;

  const eloAntes = rotuloDeElo(antes.tier, antes.division);
  const eloDepois = rotuloDeElo(depois.tier, depois.division);
  const mudouDeElo = !!antes.tier && !!depois.tier && eloAntes !== eloDepois;
  const promovido = mudouDeElo && (delta ?? 0) >= 0;

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/95 p-5 text-center text-white shadow-xl">
      <p className={`font-imFeel text-3xl ${venceu ? "text-[#F3B43F]" : "text-white/70"}`}>
        {venceu ? "Vitória!" : "Derrota"}
      </p>

      <p className="mt-2 text-sm text-white/80">
        {antes.tier ? `${eloAntes} ${antes.rating ?? ""}` : "—"} <span className="mx-1">→</span>
        <span className="font-bold text-white">
          {depois.tier ? `${eloDepois} ${depois.rating ?? ""}` : "—"}
        </span>{" "}
        {delta !== null && (
          <span className={delta >= 0 ? "font-bold text-green-400" : "font-bold text-red-400"}>
            ({delta >= 0 ? "+" : ""}
            {delta})
          </span>
        )}
      </p>

      {mudouDeElo && (
        <p
          className={`mt-3 rounded-lg px-3 py-2 font-imFeel text-xl ${
            promovido ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300"
          }`}
        >
          {promovido ? "PROMOVIDO!" : "REBAIXADO!"} {eloAntes} → {eloDepois}
        </p>
      )}

      <p className="mt-3 text-xs text-white/60">
        Partidas hoje: {partidasHoje}/{limiteDiario}
      </p>

      <button
        type="button"
        onClick={aoFechar}
        className="mt-4 rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]"
      >
        Fechar
      </button>
    </div>
  );
}
