"use client";
import { useCallback, useEffect, useState } from "react";
import { usePvpSocket } from "@/contexts/PvpSocketContext";
import { obterStatusBossEventPuzzle, mensagemDeErroEventPuzzle, type EventPuzzleBossStatusApi } from "@/lib/api/eventPuzzle";

// "O Coração da Máquina Celestial" — Fase 13/16 — Custódio do
// Meridiano. Clone estrutural de TempleGuardiaoPanel.tsx (mesmo
// raciocínio §13.3: lore + Poder de Combate ATUAL, nunca a fórmula de
// scaling), trocando a Provação do Templo pela Convergência deste
// evento e o contexto de entrada por eventEditionId (a luta aqui não é
// um singleton global — cada edição tem seu próprio Custódio).
export default function EventPuzzleCustodioPanel({ editionId }: { editionId: number }) {
  const { estadoCustodio, erroCustodio, entrarNoCustodio, limparErroCustodio, realtimeReady, erro: erroConexao } = usePvpSocket();
  const [status, setStatus] = useState<EventPuzzleBossStatusApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [entrando, setEntrando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const resposta = await obterStatusBossEventPuzzle(editionId);
      setStatus(resposta);
    } catch (erroOriginal) {
      setMensagem(mensagemDeErroEventPuzzle(erroOriginal, "Não foi possível consultar o Custódio do Meridiano."));
    } finally {
      setCarregando(false);
    }
  }, [editionId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!estadoCustodio) carregar();
  }, [estadoCustodio, carregar]);

  useEffect(() => {
    if (estadoCustodio || erroCustodio) setEntrando(false);
  }, [estadoCustodio, erroCustodio]);

  useEffect(() => {
    if (status?.tentativaEmAndamento && !estadoCustodio && realtimeReady) {
      entrarNoCustodio(editionId);
    }
  }, [status?.tentativaEmAndamento, estadoCustodio, realtimeReady, editionId, entrarNoCustodio]);

  function dispararEntrada() {
    if (!realtimeReady || entrando) return;
    limparErroCustodio();
    setEntrando(true);
    entrarNoCustodio(editionId);
  }

  if (carregando) {
    return <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-white">Aproximando-se do núcleo final...</div>;
  }

  if (!status || status.status === "Nenhum") {
    return <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-white/60">O Custódio desta edição ainda não foi configurado.</div>;
  }

  return (
    <div className="rounded-2xl border border-[#F3B43F]/40 bg-[#292018]/60 p-5 text-white">
      <p className="text-sm uppercase tracking-widest text-[#F3B43F]">Provação Final</p>
      <h2 className="font-imFeel text-3xl text-[#F3B43F]">{status.nomeExibicao}</h2>
      {status.lore && <p className="mt-2 text-sm italic text-white/60">&ldquo;{status.lore}&rdquo;</p>}

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        <span className="rounded-lg border border-white/20 bg-black/20 px-3 py-1.5">
          Seu Poder de Combate: <span className="font-bold text-[#F3B43F]">{status.meuPoderDeCombate ?? "?"}</span>
        </span>
        {status.jaVenceu && (
          <span className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-1.5 text-green-400">
            Já derrotado — a recompensa da primeira vitória já foi concedida
          </span>
        )}
      </div>

      <p className="mt-4 text-sm text-white/70">
        A intensidade do Custódio reflete seu Poder de Combate atual. Nenhum consumível é permitido nesta luta.
      </p>

      {!status.desbloqueado ? (
        <p className="mt-4 rounded-lg border border-white/20 bg-black/20 p-3 text-sm text-white/60">
          Conclua as câmaras exigidas desta edição para desbloquear o Custódio.
        </p>
      ) : status.tentativaEmAndamento ? (
        <p className="mt-4 rounded-lg border border-[#F3B43F]/40 bg-black/20 p-3 text-sm text-white/70">
          Você já está em combate contra o Custódio — a arena deveria estar aberta nesta tela.
        </p>
      ) : (
        <button
          type="button"
          onClick={dispararEntrada}
          disabled={!realtimeReady || entrando}
          className="mt-4 rounded-lg bg-[#BC8418] px-6 py-2.5 font-bold text-black transition hover:bg-[#a5710f] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {entrando ? "Entrando..." : !realtimeReady ? "Conectando..." : "Enfrentar o Custódio"}
        </button>
      )}

      {!realtimeReady && <p className="mt-3 text-sm text-red-400">{erroConexao}</p>}
      {erroCustodio && (
        <p className="mt-3 text-sm text-red-400">
          {erroCustodio}{" "}
          <button type="button" onClick={limparErroCustodio} className="underline">
            ok
          </button>
        </p>
      )}
      {mensagem && <p className="mt-3 text-sm text-red-400">{mensagem}</p>}
    </div>
  );
}
