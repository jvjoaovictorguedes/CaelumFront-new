"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FASES_TORNEIO,
  buscarTorneio,
  confirmarProntoTorneio,
  dataCurta,
  inscreverEmTorneio,
  listarTorneios,
  mensagemDeErro,
  partidasDaFase,
  sairDoTorneio,
  type DetalheTorneio,
  type PartidaTorneio,
  type ParticipanteTorneio,
  type ResumoTorneio,
} from "@/lib/api/pvp";

const STATUS_ABERTOS = ["inscricoes", "aguardando", "em_andamento"];

function rotuloStatus(status?: string | null): string {
  switch ((status ?? "").toLowerCase()) {
    case "inscricoes":
      return "Inscrições abertas";
    case "aguardando":
      return "Aguardando início";
    case "em_andamento":
      return "Em andamento";
    case "finalizado":
      return "Finalizado";
    case "cancelado":
      return "Cancelado";
    default:
      return status ?? "—";
  }
}

function corDoStatus(status?: string | null): string {
  switch ((status ?? "").toLowerCase()) {
    case "inscricoes":
      return "bg-green-500/20 text-green-300";
    case "em_andamento":
      return "bg-[#F3B43F]/20 text-[#F3B43F]";
    case "finalizado":
      return "bg-white/10 text-white/60";
    case "cancelado":
      return "bg-red-500/20 text-red-300";
    default:
      return "bg-white/10 text-white/60";
  }
}

export default function TournamentsPanel({ meuCharacterId }: { meuCharacterId: number }) {
  const [torneios, setTorneios] = useState<ResumoTorneio[] | null>(null);
  const [idSelecionado, setIdSelecionado] = useState<number | null>(null);
  const [detalhe, setDetalhe] = useState<DetalheTorneio | null>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const carregarLista = useCallback(async () => {
    setTorneios(await listarTorneios());
  }, []);

  useEffect(() => {
    carregarLista();
  }, [carregarLista]);

  const carregarDetalhe = useCallback(async (id: number) => {
    setCarregandoDetalhe(true);
    setDetalhe(await buscarTorneio(id));
    setCarregandoDetalhe(false);
  }, []);

  useEffect(() => {
    if (idSelecionado === null) {
      setDetalhe(null);
      return;
    }
    carregarDetalhe(idSelecionado);
    // Enquanto o detalhe está aberto, faz polling leve — o bracket e o
    // ready-check mudam do lado do servidor. Se o backend expuser
    // eventos de socket pra torneio, dá pra trocar isso por listeners.
    const intervalo = setInterval(() => carregarDetalhe(idSelecionado), 5000);
    return () => clearInterval(intervalo);
  }, [idSelecionado, carregarDetalhe]);

  const { abertos, historicos } = useMemo(() => {
    const lista = torneios ?? [];
    return {
      abertos: lista.filter((t) => STATUS_ABERTOS.includes((t.status ?? "").toLowerCase())),
      historicos: lista.filter((t) => !STATUS_ABERTOS.includes((t.status ?? "").toLowerCase())),
    };
  }, [torneios]);

  async function acaoInscricao(torneio: ResumoTorneio | DetalheTorneio, entrar: boolean) {
    setOcupado(true);
    setErro("");
    try {
      if (entrar) await inscreverEmTorneio(torneio.id);
      else await sairDoTorneio(torneio.id);
      await carregarLista();
      if (idSelecionado !== null) await carregarDetalhe(idSelecionado);
    } catch (error: unknown) {
      setErro(
        mensagemDeErro(
          error,
          entrar ? "Não foi possível se inscrever no torneio." : "Não foi possível sair do torneio.",
        ),
      );
    } finally {
      setOcupado(false);
    }
  }

  async function confirmarPronto(partida: PartidaTorneio) {
    if (idSelecionado === null) return;
    setOcupado(true);
    setErro("");
    try {
      await confirmarProntoTorneio(idSelecionado, partida.id);
      await carregarDetalhe(idSelecionado);
    } catch (error: unknown) {
      setErro(mensagemDeErro(error, "Não foi possível confirmar que você está pronto."));
    } finally {
      setOcupado(false);
    }
  }

  if (idSelecionado !== null) {
    return (
      <DetalheTorneioView
        detalhe={detalhe}
        carregando={carregandoDetalhe}
        meuCharacterId={meuCharacterId}
        ocupado={ocupado}
        erro={erro}
        aoVoltar={() => setIdSelecionado(null)}
        aoInscrever={(entrar) => detalhe && acaoInscricao(detalhe, entrar)}
        aoConfirmarPronto={confirmarPronto}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-5 text-white shadow-lg">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="font-imFeel text-2xl text-[#F3B43F]">Torneios</p>
          <button
            type="button"
            onClick={() => setMostrarHistorico((v) => !v)}
            className="rounded-lg border border-[#F3B43F]/50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#F3B43F] hover:bg-[#F3B43F]/10"
          >
            {mostrarHistorico ? "Ver em cartaz" : "Ver histórico"}
          </button>
        </div>
        <p className="text-xs text-white/55">
          Torneios têm no máximo 8 participantes e são disputados em séries ao vivo (MD3/MD5) até a
          final, com disputa de 3º lugar.
        </p>
      </div>

      {erro && <p className="text-sm text-red-400">{erro}</p>}

      {torneios === null ? (
        <PainelVazio texto="Carregando torneios..." />
      ) : (mostrarHistorico ? historicos : abertos).length === 0 ? (
        <PainelVazio
          texto={
            mostrarHistorico
              ? "Nenhum torneio finalizado ainda."
              : "Nenhum torneio aberto no momento. Fique de olho — novas chaves aparecem por aqui."
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {(mostrarHistorico ? historicos : abertos).map((torneio) => (
            <CardTorneio
              key={torneio.id}
              torneio={torneio}
              ocupado={ocupado}
              historico={mostrarHistorico}
              aoAbrir={() => setIdSelecionado(torneio.id)}
              aoInscrever={(entrar) => acaoInscricao(torneio, entrar)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PainelVazio({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-8 text-center text-sm text-white/60">
      {texto}
    </div>
  );
}

function CardTorneio({
  torneio,
  ocupado,
  historico,
  aoAbrir,
  aoInscrever,
}: {
  torneio: ResumoTorneio;
  ocupado: boolean;
  historico: boolean;
  aoAbrir: () => void;
  aoInscrever: (entrar: boolean) => void;
}) {
  const inscricoesAbertas = (torneio.status ?? "").toLowerCase() === "inscricoes";
  const lotado =
    (torneio.participantes ?? 0) >= (torneio.maxParticipantes ?? 8) && !torneio.inscrito;

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F]/50 bg-[#292018]/90 p-4 text-white shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-imFeel text-xl text-[#F3B43F]">{torneio.nome}</p>
          <p className="mt-0.5 text-xs text-white/60">
            {torneio.nivelMinimo || torneio.nivelMaximo
              ? `Nível ${torneio.nivelMinimo ?? "?"}–${torneio.nivelMaximo ?? "?"} · `
              : ""}
            {torneio.participantes ?? 0}/{torneio.maxParticipantes ?? 8} participantes
            {torneio.comecaEm ? ` · Início: ${dataCurta(torneio.comecaEm)}` : ""}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${corDoStatus(torneio.status)}`}
        >
          {rotuloStatus(torneio.status)}
        </span>
      </div>

      {torneio.premio && (
        <p className="mt-2 text-sm text-white/75">
          <span className="text-[#F3B43F]">Prêmio:</span> {torneio.premio}
        </p>
      )}

      {historico && (torneio.campeao || torneio.vice || torneio.terceiro) && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <Podio posicao="1º" nome={torneio.campeao?.nome} cor="#F3B43F" />
          <Podio posicao="2º" nome={torneio.vice?.nome} cor="#d7dde3" />
          <Podio posicao="3º" nome={torneio.terceiro?.nome} cor="#c08a4a" />
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={aoAbrir}
          className="rounded-lg border-2 border-[#F3B43F]/60 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-[#F3B43F] hover:bg-[#F3B43F]/10"
        >
          {historico ? "Ver chave" : "Abrir torneio"}
        </button>
        {inscricoesAbertas && (
          <button
            type="button"
            disabled={ocupado || lotado}
            onClick={() => aoInscrever(!torneio.inscrito)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition disabled:opacity-50 ${
              torneio.inscrito
                ? "border-2 border-white/30 text-white hover:bg-white/10"
                : "border-2 border-[#F3B43F] bg-[#BC8418] text-black hover:bg-[#a5710f]"
            }`}
          >
            {torneio.inscrito ? "Sair do torneio" : lotado ? "Lotado" : "Inscrever-se"}
          </button>
        )}
      </div>
    </div>
  );
}

function Podio({ posicao, nome, cor }: { posicao: string; nome?: string | null; cor: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-2">
      <p className="font-imFeel text-base" style={{ color: cor }}>
        {posicao}
      </p>
      <p className="truncate text-white/80">{nome ?? "—"}</p>
    </div>
  );
}

function DetalheTorneioView({
  detalhe,
  carregando,
  meuCharacterId,
  ocupado,
  erro,
  aoVoltar,
  aoInscrever,
  aoConfirmarPronto,
}: {
  detalhe: DetalheTorneio | null;
  carregando: boolean;
  meuCharacterId: number;
  ocupado: boolean;
  erro: string;
  aoVoltar: () => void;
  aoInscrever: (entrar: boolean) => void;
  aoConfirmarPronto: (partida: PartidaTorneio) => void;
}) {
  if (carregando && !detalhe) {
    return (
      <div className="flex flex-col gap-4">
        <BotaoVoltar aoVoltar={aoVoltar} />
        <PainelVazio texto="Carregando torneio..." />
      </div>
    );
  }

  if (!detalhe) {
    return (
      <div className="flex flex-col gap-4">
        <BotaoVoltar aoVoltar={aoVoltar} />
        <PainelVazio texto="Não foi possível carregar este torneio." />
      </div>
    );
  }

  const inscricoesAbertas = (detalhe.status ?? "").toLowerCase() === "inscricoes";
  const terceiroLugar = partidasDaFase(detalhe, "terceiro");

  // Ready-check: a série do jogador que ainda não começou e está
  // esperando as duas confirmações.
  const minhaPartidaPendente = (detalhe.partidas ?? []).find(
    (partida) =>
      (partida.participanteA?.id === meuCharacterId || partida.participanteB?.id === meuCharacterId) &&
      !!partida.readyCheckTerminaEm &&
      (partida.status ?? "").toLowerCase() !== "finalizada",
  );

  return (
    <div className="flex flex-col gap-4">
      <BotaoVoltar aoVoltar={aoVoltar} />

      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-imFeel text-3xl text-[#F3B43F]">{detalhe.nome}</p>
            <p className="mt-1 text-xs text-white/60">
              {detalhe.participantes ?? detalhe.participantesLista?.length ?? 0}/
              {detalhe.maxParticipantes ?? 8} participantes
              {detalhe.comecaEm ? ` · Início: ${dataCurta(detalhe.comecaEm)}` : ""}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${corDoStatus(detalhe.status)}`}
          >
            {rotuloStatus(detalhe.status)}
          </span>
        </div>

        {detalhe.premio && (
          <p className="mt-2 text-sm text-white/75">
            <span className="text-[#F3B43F]">Prêmio:</span> {detalhe.premio}
          </p>
        )}

        {erro && <p className="mt-3 text-sm text-red-400">{erro}</p>}

        {inscricoesAbertas && (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => aoInscrever(!detalhe.inscrito)}
            className={`mt-4 rounded-lg px-4 py-2 text-sm font-bold uppercase tracking-widest transition disabled:opacity-50 ${
              detalhe.inscrito
                ? "border-2 border-white/30 text-white hover:bg-white/10"
                : "border-2 border-[#F3B43F] bg-[#BC8418] text-black hover:bg-[#a5710f]"
            }`}
          >
            {detalhe.inscrito ? "Sair do torneio" : "Inscrever-se"}
          </button>
        )}
      </div>

      {minhaPartidaPendente && (
        <ReadyCheck
          partida={minhaPartidaPendente}
          meuCharacterId={meuCharacterId}
          ocupado={ocupado}
          aoConfirmar={() => aoConfirmarPronto(minhaPartidaPendente)}
        />
      )}

      <Chave detalhe={detalhe} meuCharacterId={meuCharacterId} />

      {terceiroLugar.length > 0 && (
        <div className="rounded-2xl border-2 border-[#c08a4a]/60 bg-[#292018]/90 p-4 text-white shadow-lg">
          <p className="mb-2 text-xs uppercase tracking-widest text-[#c08a4a]">Disputa de 3º lugar</p>
          {terceiroLugar.map((partida) => (
            <CardPartida key={partida.id} partida={partida} meuCharacterId={meuCharacterId} />
          ))}
        </div>
      )}

      {detalhe.participantesLista && detalhe.participantesLista.length > 0 && (
        <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/90 p-4 text-white shadow-lg">
          <p className="mb-2 text-xs uppercase tracking-widest text-[#F3B43F]">Participantes</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {detalhe.participantesLista.map((participante) => (
              <div
                key={participante.id}
                className={`flex items-center justify-between rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm ${
                  participante.eliminado ? "opacity-50" : ""
                }`}
              >
                <span
                  className={
                    participante.id === meuCharacterId ? "font-bold text-[#F3B43F]" : "text-white/85"
                  }
                >
                  {participante.nome ?? `#${participante.id}`}
                </span>
                <span className="text-xs text-white/50">
                  {participante.eliminado
                    ? "Eliminado"
                    : (participante.nivel ? `Nv. ${participante.nivel}` : "")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BotaoVoltar({ aoVoltar }: { aoVoltar: () => void }) {
  return (
    <button
      type="button"
      onClick={aoVoltar}
      className="self-start rounded-full border-2 border-[#F3B43F]/60 bg-black/30 px-3 py-1 font-imFeel text-sm text-[#F3B43F] hover:bg-black/50"
    >
      ← Voltar aos torneios
    </button>
  );
}

function ReadyCheck({
  partida,
  meuCharacterId,
  ocupado,
  aoConfirmar,
}: {
  partida: PartidaTorneio;
  meuCharacterId: number;
  ocupado: boolean;
  aoConfirmar: () => void;
}) {
  const souA = partida.participanteA?.id === meuCharacterId;
  const euEstouPronto = souA ? partida.prontoA : partida.prontoB;
  const oponente = souA ? partida.participanteB : partida.participanteA;
  const oponentePronto = souA ? partida.prontoB : partida.prontoA;

  const [restante, setRestante] = useState<number | null>(null);
  useEffect(() => {
    if (!partida.readyCheckTerminaEm) {
      setRestante(null);
      return;
    }
    const fim = new Date(partida.readyCheckTerminaEm).getTime();
    const atualizar = () => setRestante(Math.max(0, Math.ceil((fim - Date.now()) / 1000)));
    atualizar();
    const intervalo = setInterval(atualizar, 500);
    return () => clearInterval(intervalo);
  }, [partida.readyCheckTerminaEm]);

  return (
    <div className="rounded-2xl border-2 border-green-400/70 bg-[#1e2a1e]/90 p-5 text-center text-white shadow-xl">
      <p className="text-xs uppercase tracking-widest text-green-300">Sua série vai começar</p>
      <p className="mt-1 font-imFeel text-2xl">
        {partida.formato ?? "MD3"} contra {oponente?.nome ?? "adversário"}
      </p>
      {restante !== null && (
        <p className="mt-2 text-3xl font-bold text-green-300">{restante}s</p>
      )}
      <p className="mt-2 text-xs text-white/60">
        Adversário: {oponentePronto ? "pronto ✓" : "aguardando confirmação..."}
      </p>
      <button
        type="button"
        disabled={ocupado || !!euEstouPronto}
        onClick={aoConfirmar}
        className="mt-4 rounded-lg bg-green-500 px-5 py-2 font-bold text-black transition hover:bg-green-400 disabled:opacity-50"
      >
        {euEstouPronto ? "Pronto ✓" : "Estou pronto"}
      </button>
    </div>
  );
}

/**
 * Chave visual — colunas Quartas → Semifinal → Final da esquerda pra
 * direita. Em telas pequenas as colunas empilham (ainda legível), no
 * desktop ficam lado a lado como uma chave de verdade.
 */
function Chave({ detalhe, meuCharacterId }: { detalhe: DetalheTorneio; meuCharacterId: number }) {
  const colunas = FASES_TORNEIO.map((fase) => ({
    ...fase,
    partidas: partidasDaFase(detalhe, fase.chave),
  })).filter((coluna) => coluna.partidas.length > 0);

  if (colunas.length === 0) {
    return (
      <PainelVazio texto="A chave ainda não foi sorteada. Ela aparece aqui quando o torneio começar." />
    );
  }

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-4 text-white shadow-lg">
      <p className="mb-3 text-xs uppercase tracking-widest text-[#F3B43F]">Chave</p>
      <div className="overflow-x-auto">
        <div className="flex min-w-full flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-3">
          {colunas.map((coluna) => (
            <div key={coluna.chave} className="flex-1 sm:min-w-[13rem]">
              <p className="mb-2 text-center font-imFeel text-sm text-[#F3B43F]/80">
                {coluna.label}
              </p>
              <div className="flex h-full flex-col justify-around gap-3">
                {coluna.partidas.map((partida) => (
                  <CardPartida
                    key={partida.id}
                    partida={partida}
                    meuCharacterId={meuCharacterId}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CardPartida({
  partida,
  meuCharacterId,
}: {
  partida: PartidaTorneio;
  meuCharacterId: number;
}) {
  return (
    <div className="rounded-xl border-2 border-white/10 bg-black/30 p-2">
      <LadoDaPartida
        participante={partida.participanteA}
        placar={partida.placarA}
        vencedor={
          partida.vencedorId != null && partida.vencedorId === partida.participanteA?.id
        }
        eu={partida.participanteA?.id === meuCharacterId}
      />
      <div className="my-1 flex items-center gap-2">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-[10px] uppercase tracking-widest text-white/35">
          {partida.formato ?? "MD3"}
        </span>
        <span className="h-px flex-1 bg-white/10" />
      </div>
      <LadoDaPartida
        participante={partida.participanteB}
        placar={partida.placarB}
        vencedor={
          partida.vencedorId != null && partida.vencedorId === partida.participanteB?.id
        }
        eu={partida.participanteB?.id === meuCharacterId}
      />
    </div>
  );
}

function LadoDaPartida({
  participante,
  placar,
  vencedor,
  eu,
}: {
  participante?: ParticipanteTorneio | null;
  placar?: number | null;
  vencedor?: boolean;
  eu?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-sm ${
        vencedor ? "bg-[#F3B43F]/15" : ""
      }`}
    >
      <span
        className={`min-w-0 truncate ${
          eu ? "font-bold text-[#F3B43F]" : vencedor ? "text-white" : "text-white/70"
        }`}
      >
        {participante?.nome ?? "A definir"}
      </span>
      <span className="ml-2 shrink-0 font-bold text-white/85">{placar ?? 0}</span>
    </div>
  );
}
