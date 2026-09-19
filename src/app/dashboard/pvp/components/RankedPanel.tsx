"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { usePvpSocket } from "@/contexts/PvpSocketContext";

interface Participacao {
  rating: number;
  liga: string;
  jogos: number;
  vitorias: number;
  derrotas: number;
  peak_rating: number;
}

interface Temporada {
  id: number;
  nome: string;
  starts_at: string;
  ends_at: string;
  status: string;
}

interface StatusRanked {
  temporada: Temporada;
  participacao: Participacao;
  emFila: boolean;
  tempoNaFilaMs: number | null;
  emPartidaRanked: boolean;
}

interface LinhaLeaderboard {
  posicao: number;
  id: number;
  nome: string;
  rating: number;
  liga: string;
  jogos: number;
  vitorias: number;
  derrotas: number;
  online: boolean;
}

function mensagemErro(error: unknown, padrao: string) {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? padrao;
}

export default function RankedPanel({ meuCharacterId }: { meuCharacterId: number }) {
  const { conectado, filaRanked, duelo } = usePvpSocket();

  const [status, setStatus] = useState<StatusRanked | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [leaderboard, setLeaderboard] = useState<LinhaLeaderboard[] | null>(null);
  const [tempoNaFila, setTempoNaFila] = useState(0);

  const carregarStatus = useCallback(async () => {
    try {
      const resposta = await axiosInstance.get<{
        temporada: Temporada;
        participacao: Participacao;
        emFila: boolean;
        tempoNaFilaMs: number | null;
        emPartidaRanked: boolean;
      }>("/pvp/ranked/status");
      setStatus(resposta.data);
    } catch {
      // silencioso — painel mostra estado vazio, não é crítico
    }
  }, []);

  useEffect(() => {
    carregarStatus();
  }, [carregarStatus, duelo]);

  // Sincroniza com o broadcast do servidor (join/leave feitos por este
  // mesmo personagem refletem aqui via socket, sem precisar recarregar).
  useEffect(() => {
    if (!filaRanked) return;
    setStatus((atual) => (atual ? { ...atual, emFila: filaRanked.emFila } : atual));
  }, [filaRanked]);

  useEffect(() => {
    if (!status?.emFila) {
      setTempoNaFila(0);
      return;
    }
    setTempoNaFila(status.tempoNaFilaMs ?? 0);
    const intervalo = setInterval(() => setTempoNaFila((t) => t + 1000), 1000);
    return () => clearInterval(intervalo);
  }, [status?.emFila, status?.tempoNaFilaMs]);

  async function entrarNaFila() {
    setCarregando(true);
    setErro("");
    try {
      await axiosInstance.post("/pvp/ranked/queue/join");
      await carregarStatus();
    } catch (error: unknown) {
      setErro(mensagemErro(error, "Não foi possível entrar na fila ranqueada."));
    } finally {
      setCarregando(false);
    }
  }

  async function sairDaFila() {
    setCarregando(true);
    setErro("");
    try {
      await axiosInstance.post("/pvp/ranked/queue/leave");
      await carregarStatus();
    } catch (error: unknown) {
      setErro(mensagemErro(error, "Não foi possível sair da fila."));
    } finally {
      setCarregando(false);
    }
  }

  async function alternarLeaderboard() {
    if (leaderboard) {
      setLeaderboard(null);
      return;
    }
    try {
      const resposta = await axiosInstance.get<{ itens: LinhaLeaderboard[] }>(
        "/pvp/ranked/leaderboard",
      );
      setLeaderboard(resposta.data.itens);
    } catch {
      setErro("Não foi possível carregar o leaderboard.");
    }
  }

  if (!status) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-4 text-white shadow-lg">
        <p className="text-sm text-white/60">Carregando Arena Ranqueada...</p>
      </div>
    );
  }

  const { participacao, temporada, emFila, emPartidaRanked } = status;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-5 text-white shadow-lg">
        <p className="text-xs uppercase tracking-widest text-[#F3B43F]">{temporada.nome}</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1">
          <p>
            <span className="text-3xl font-bold text-[#F3B43F]">{participacao.liga}</span>
          </p>
          <p className="text-white/80">
            Rating: <span className="font-bold text-white">{participacao.rating}</span>
          </p>
          <p className="text-white/80">
            Temporada: {participacao.vitorias}V / {participacao.derrotas}D
          </p>
          <p className="text-white/80">Melhor rating: {participacao.peak_rating}</p>
        </div>

        {erro && <p className="mt-3 text-sm text-red-400">{erro}</p>}

        <div className="mt-4">
          {!conectado ? (
            <p className="text-sm text-white/50">Conectando ao Duelo ao vivo...</p>
          ) : emPartidaRanked ? (
            <p className="text-sm text-white/60">Você já está em uma partida ranqueada.</p>
          ) : emFila ? (
            <div className="flex items-center gap-3">
              <p className="text-sm text-white/70">
                Na fila há {Math.floor(tempoNaFila / 1000)}s — procurando oponente...
              </p>
              <button
                onClick={sairDaFila}
                disabled={carregando}
                className="rounded-lg border-2 border-white/30 bg-transparent px-3 py-1.5 text-sm font-bold text-white hover:bg-white/10 disabled:opacity-50"
              >
                Sair da fila
              </button>
            </div>
          ) : (
            <button
              onClick={entrarNaFila}
              disabled={carregando}
              className="rounded-lg border-2 border-[#F3B43F] bg-[#BC8418] px-4 py-2 text-sm font-bold text-black transition hover:bg-[#a5710f] disabled:opacity-50"
            >
              ENTRAR NA FILA
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-4 text-white shadow-lg">
        <button
          onClick={alternarLeaderboard}
          className="text-sm uppercase tracking-widest text-[#F3B43F] underline"
        >
          {leaderboard ? "Esconder leaderboard" : "Ver leaderboard da temporada"}
        </button>
        {leaderboard && (
          <div className="mt-3 max-h-80 overflow-y-auto">
            {leaderboard.length === 0 ? (
              <p className="text-sm text-white/60">
                Ninguém se classificou ainda (mínimo de partidas não atingido).
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-white/50">
                    <th className="pb-2">#</th>
                    <th className="pb-2">Jogador</th>
                    <th className="pb-2">Liga</th>
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
                      <td className="py-1">
                        {linha.nome}{" "}
                        <span
                          className={`ml-1 inline-block h-2 w-2 rounded-full align-middle ${
                            linha.online ? "bg-green-400" : "bg-white/20"
                          }`}
                        />
                      </td>
                      <td className="py-1">{linha.liga}</td>
                      <td className="py-1">{linha.rating}</td>
                      <td className="py-1">
                        {linha.vitorias}/{linha.derrotas}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
