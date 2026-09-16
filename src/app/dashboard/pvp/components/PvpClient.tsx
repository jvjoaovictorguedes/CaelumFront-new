"use client";

import { useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import PvpArena, { type ResultadoDuelo } from "./PvpArena";

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

  async function desafiar(idOponente: number) {
    if (carregandoId) return;
    setCarregandoId(idOponente);
    setErro("");
    try {
      const resposta = await axiosInstance.post<{ data?: ResultadoDuelo }>(
        "/pvp/challenge",
        { id_desafiante: character.id, id_desafiado: idOponente },
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
        {oponentesIniciais.length === 0 ? (
          <p className="text-sm text-white/60">
            Nenhum outro jogador com personagem ainda. Volte mais tarde.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {oponentesIniciais.map((oponente) => {
              const nomeRaca =
                oponente.genero === "Feminino"
                  ? oponente.Race?.nome_feminino
                  : oponente.Race?.nome_masculino;
              return (
                <div
                  key={oponente.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-[#3a2f24] px-4 py-3"
                >
                  <div>
                    <p className="font-bold text-[#F3B43F]">{oponente.nome}</p>
                    <p className="text-xs text-white/60">
                      Nv. {oponente.nivel} · {nomeRaca ?? "?"} ·{" "}
                      {oponente.Class?.nome ?? "?"}
                    </p>
                  </div>
                  <button
                    onClick={() => desafiar(oponente.id)}
                    disabled={carregandoId !== null}
                    className="rounded-lg border-2 border-[#F3B43F] bg-[#BC8418] px-3 py-1.5 text-sm font-bold text-black transition hover:bg-[#a5710f] disabled:opacity-50"
                  >
                    {carregandoId === oponente.id ? "Duelando..." : "Desafiar"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
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
