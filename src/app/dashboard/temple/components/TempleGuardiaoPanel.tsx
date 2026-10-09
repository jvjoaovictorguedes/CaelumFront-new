"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePvpSocket } from "@/contexts/PvpSocketContext";
import { obterStatusGuardiaoTemplo, mensagemDeErroTemplo, type TempleBossStatusApi } from "@/lib/api/temple";
import {
  podeIniciarEntradaGuardiao,
  MENSAGEM_TIMEOUT_ENTRADA_GUARDIAO,
  TIMEOUT_ENTRADA_GUARDIAO_MS,
} from "@/hooks/realtime/templebossEntrada";

// §13.3 — lore + Poder ATUAL do personagem, nunca a fórmula de scaling.
// Depois de tentativas, Bestiário/Templo pode revelar Powers observadas
// e resistências descobertas (fora de escopo do V1 deste painel).
export default function TempleGuardiaoPanel() {
  const { estadoGuardiao, erroGuardiao, entrarNoGuardiao, limparErroGuardiao, realtimeReady } = usePvpSocket();
  const [status, setStatus] = useState<TempleBossStatusApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  // Bug reportado ("clico em Enfrentar o Guardião e a batalha não
  // inicia"): clique sem feedback nenhum enquanto o socket não tinha
  // terminado de se identificar. `entrando` dá o estado "Entrando..."
  // (nunca clique duplicado) e `mensagemBloqueio` cobre tanto "ainda
  // conectando" quanto "não respondeu a tempo" — nunca um loading
  // infinito silencioso.
  const [entrando, setEntrando] = useState(false);
  const [mensagemBloqueio, setMensagemBloqueio] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const limparTimeoutDeEntrada = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const carregar = useCallback(async () => {
    try {
      const resposta = await obterStatusGuardiaoTemplo();
      setStatus(resposta);
    } catch (erro) {
      setMensagem(mensagemDeErroTemplo(erro, "Não foi possível carregar o status do Guardião."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // A luta ao vivo em si acontece na arena de tela cheia (montada
  // globalmente em DashboardLayout); quando ela termina, o status/Poder
  // mostrado aqui fica desatualizado até recarregar.
  useEffect(() => {
    if (!estadoGuardiao) carregar();
  }, [estadoGuardiao, carregar]);

  // Assim que o servidor responde (sucesso OU erro), a espera acabou —
  // nunca deixa "Entrando..." travado esperando um evento que já chegou.
  useEffect(() => {
    if (estadoGuardiao || erroGuardiao) {
      limparTimeoutDeEntrada();
      setEntrando(false);
    }
  }, [estadoGuardiao, erroGuardiao, limparTimeoutDeEntrada]);

  useEffect(() => () => limparTimeoutDeEntrada(), [limparTimeoutDeEntrada]);

  const dispararEntrada = useCallback(() => {
    const decisao = podeIniciarEntradaGuardiao({ realtimeReady, entrando });
    if (!decisao.podeEntrar) {
      if (decisao.motivoBloqueio) setMensagemBloqueio(decisao.motivoBloqueio);
      return;
    }
    setMensagemBloqueio("");
    limparErroGuardiao();
    setEntrando(true);
    entrarNoGuardiao();
    limparTimeoutDeEntrada();
    timeoutRef.current = setTimeout(() => {
      setEntrando(false);
      setMensagemBloqueio(MENSAGEM_TIMEOUT_ENTRADA_GUARDIAO);
    }, TIMEOUT_ENTRADA_GUARDIAO_MS);
  }, [realtimeReady, entrando, entrarNoGuardiao, limparErroGuardiao, limparTimeoutDeEntrada]);

  // Resync (F5/reconexão) — mesma ideia de GuildBossTab: se já existe
  // uma tentativa Ativa no servidor e a arena ainda não está montada,
  // entra de novo (idempotente — templeboss:entrar sempre devolve o
  // estado ATUAL, nunca duplica a tentativa). Só dispara quando
  // `realtimeReady` — nunca antes do IDENTIFY terminar, mesma garantia
  // do clique manual (dispararEntrada é um no-op silencioso enquanto
  // não está pronto; este efeito reavalia sozinho assim que
  // `realtimeReady` virar true). `dispararEntrada` é OMITIDO de
  // propósito das deps: ele muda de identidade a cada toggle de
  // `entrando` (seu próprio estado interno), e incluí-lo faria este
  // efeito re-disparar em loop a cada erro do servidor (erroGuardiao
  // seta entrando=false, dispararEntrada muda, o efeito reavalia e
  // tenta de novo na hora) — o resync deve reagir só a mudança REAL de
  // tentativa_em_andamento/estadoGuardiao/realtimeReady, nunca ao
  // próprio ciclo de entrando.
  useEffect(() => {
    if (status?.tentativa_em_andamento && !estadoGuardiao) {
      dispararEntrada();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.tentativa_em_andamento, estadoGuardiao, realtimeReady]);

  if (carregando) {
    return <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-white">Aproximando-se do último altar...</div>;
  }

  if (!status || status.status === "Nenhum") {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-white/60">
        O Guardião desta Convergência ainda não foi configurado.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#F3B43F]/40 bg-[#292018]/60 p-5 text-white">
      <p className="text-sm uppercase tracking-widest text-[#F3B43F]">Provação Final</p>
      <h2 className="font-imFeel text-3xl text-[#F3B43F]">{status.nome_exibicao}</h2>
      {status.lore && <p className="mt-2 text-sm italic text-white/60">&ldquo;{status.lore}&rdquo;</p>}

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        <span className="rounded-lg border border-white/20 bg-black/20 px-3 py-1.5">
          Seu Poder de Combate: <span className="font-bold text-[#F3B43F]">{status.meu_poder_de_combate ?? "?"}</span>
        </span>
        {status.ja_venceu && <span className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-1.5 text-green-400">Já derrotado — a recompensa da primeira vitória já foi concedida</span>}
      </div>

      <p className="mt-4 text-sm text-white/70">
        O julgamento se adapta à força que você apresentar — a Build do Guardião é fixa pelo evento, mas sua
        intensidade (vida, dano e defesa) reflete o seu Combat Power atual. Nenhum consumível é permitido nesta luta.
      </p>

      {!status.desbloqueado ? (
        <p className="mt-4 rounded-lg border border-white/20 bg-black/20 p-3 text-sm text-white/60">
          Conclua todas as Provações Principais desta Convergência para desbloquear o Guardião.
        </p>
      ) : status.tentativa_em_andamento ? (
        <p className="mt-4 rounded-lg border border-[#F3B43F]/40 bg-black/20 p-3 text-sm text-white/70">
          Você já está em combate contra o Guardião — a arena deveria estar aberta nesta tela.
        </p>
      ) : (
        <button
          type="button"
          onClick={dispararEntrada}
          disabled={!realtimeReady || entrando}
          className="mt-4 rounded-lg bg-[#BC8418] px-6 py-2.5 font-bold text-black transition hover:bg-[#a5710f] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {entrando ? "Entrando..." : !realtimeReady ? "Conectando..." : "Enfrentar o Guardião"}
        </button>
      )}

      {erroGuardiao && (
        <p className="mt-3 text-sm text-red-400">
          {erroGuardiao}{" "}
          <button type="button" onClick={limparErroGuardiao} className="underline">
            ok
          </button>
        </p>
      )}
      {mensagemBloqueio && (
        <p className="mt-3 text-sm text-red-400">
          {mensagemBloqueio}{" "}
          <button type="button" onClick={() => setMensagemBloqueio("")} className="underline">
            ok
          </button>
        </p>
      )}
      {mensagem && <p className="mt-3 text-sm text-red-400">{mensagem}</p>}
    </div>
  );
}
