"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  usePvpSocket,
  type ConsumivelDuelo,
  type RankedRatingUpdatePayload,
  type StatusInstanceDuelo,
} from "@/contexts/PvpSocketContext";
import { spriteForClass } from "../../adventure/components/sprites/spriteForClass";
import CombatActionBar from "@/components/combat/CombatActionBar";
import { StatusIconsRow } from "@/components/combat/StatusEffectIcons";
import { fundoDeBatalhaPorSemente } from "@/utils/battleBackground";

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function LiveDuelArena({ meuCharacterId }: { meuCharacterId: number }) {
  const {
    duelo,
    turnos,
    resultadoFinal,
    agir,
    limparDuelo,
    erro,
    limparErro,
    ratingUpdate,
    oponenteDesconectadoRanked,
  } = usePvpSocket();

  const [vidaA, setVidaA] = useState(0);
  const [vidaB, setVidaB] = useState(0);
  const [manaA, setManaA] = useState(0);
  const [manaB, setManaB] = useState(0);
  const [animA, setAnimA] = useState("");
  const [animB, setAnimB] = useState("");
  const [turnoAtual, setTurnoAtual] = useState<"A" | "B" | null>(null);
  const [prazo, setPrazo] = useState(5);
  const [segundosVisuais, setSegundosVisuais] = useState(5);
  const [log, setLog] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [consumiveis, setConsumiveis] = useState<ConsumivelDuelo[]>([]);
  const [statusA, setStatusA] = useState<StatusInstanceDuelo[]>([]);
  const [statusB, setStatusB] = useState<StatusInstanceDuelo[]>([]);

  const processadosRef = useRef(0);
  const processandoRef = useRef(false);

  useEffect(() => {
    if (!duelo) return;
    processadosRef.current = 0;
    setVidaA(duelo.vidaA);
    setVidaB(duelo.vidaB);
    setManaA(duelo.manaA);
    setManaB(duelo.manaB);
    setStatusA([]);
    setStatusB([]);
    setTurnoAtual(duelo.turnoDe);
    setPrazo(duelo.prazoSegundos);
    setLog([`Duelo começou na ${duelo.arena}! Vez de ${duelo.turnoDe === "A" ? duelo.a.nome : duelo.b.nome}.`]);
    setEnviando(false);
    setConsumiveis(duelo.a.id === meuCharacterId ? duelo.consumiveisA : duelo.consumiveisB);
    // Bug real: uma mensagem de erro de ANTES desse duelo (desafio
    // recusado, ação rejeitada do duelo anterior, um clique perdido na
    // transição...) ficava presa em `erro` e aparecia em cima da tela
    // de combate já ativa e saudável — `erro` é estado compartilhado
    // entre lobby/torneio/duelo em PvpSocketContext, então só o
    // socket.io limpar no "duelo-iniciado" não basta pra cobrir todo
    // caminho de entrada nesta tela (ex.: reload em cima de um duelo
    // já em andamento).
    limparErro();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duelo?.duelId]);

  useEffect(() => {
    if (!duelo) return;

    async function processar() {
      if (processandoRef.current) return;
      processandoRef.current = true;
      while (duelo && processadosRef.current < turnos.length) {
        const turno = turnos[processadosRef.current];
        const nomeAtacante = turno.atacante === "A" ? duelo.a.nome : duelo.b.nome;
        const nomeDefensor = turno.atacante === "A" ? duelo.b.nome : duelo.a.nome;

        setAnimA(
          turno.atacante === "A"
            ? "anim-atacando-direita"
            : turno.esquivou
              ? "anim-esquivando-esquerda"
              : "anim-atingido",
        );
        setAnimB(
          turno.atacante === "B"
            ? "anim-atacando-esquerda"
            : turno.esquivou
              ? "anim-esquivando-direita"
              : "anim-atingido",
        );

        await esperar(500);

        setVidaA(turno.vidaA);
        setVidaB(turno.vidaB);
        setManaA(turno.manaA);
        setManaB(turno.manaB);
        if (turno.statusA) setStatusA(turno.statusA);
        if (turno.statusB) setStatusB(turno.statusB);
        setAnimA("");
        setAnimB("");

        let linha: string;
        if (turno.bloqueado) {
          linha = `${nomeAtacante} não conseguiu agir neste turno.`;
        } else if (turno.esquivou) {
          linha = `${nomeDefensor} esquivou de ${turno.nomeAcao} de ${nomeAtacante}!`;
        } else if (turno.dano > 0) {
          linha = `${nomeAtacante} usou ${turno.nomeAcao} e causou ${turno.dano} de dano em ${nomeDefensor}.`;
        } else if (turno.cura > 0 && (turno.manaCurada ?? 0) > 0) {
          linha = `${nomeAtacante} usou ${turno.nomeAcao} e recuperou ${turno.cura} de vida e ${turno.manaCurada} de mana.`;
        } else if (turno.cura > 0) {
          linha = `${nomeAtacante} usou ${turno.nomeAcao} e recuperou ${turno.cura} de vida.`;
        } else if ((turno.manaCurada ?? 0) > 0) {
          linha = `${nomeAtacante} usou ${turno.nomeAcao} e recuperou ${turno.manaCurada} de mana.`;
        } else {
          linha = `${nomeAtacante} usou ${turno.nomeAcao}.`;
        }
        setLog((atual) => [...atual, linha, ...(turno.logStatus ?? [])]);

        if (turno.turnoDe) {
          setTurnoAtual(turno.turnoDe);
          setPrazo(turno.prazoSegundos ?? 5);
          setEnviando(false);
        }

        processadosRef.current += 1;
        await esperar(150);
      }
      processandoRef.current = false;
    }

    processar();
  }, [turnos, duelo]);

  useEffect(() => {
    setSegundosVisuais(prazo);
  }, [turnoAtual, prazo]);

  useEffect(() => {
    if (resultadoFinal) return;
    const intervalo = setInterval(() => setSegundosVisuais((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(intervalo);
  }, [turnoAtual, resultadoFinal]);

  // Fundo da arena: igual à Aventura de hoje (CombatArena.tsx), mas
  // sorteado — PvP não tem monstro nem zona pra amarrar um cenário. O
  // useMemo é chaveado pelo duelId, então o cenário é escolhido UMA vez
  // por duelo e não troca a cada turno/re-render. Vale pra casual,
  // ranqueada e torneio, já que todos renderizam por aqui.
  const fundoArena = useMemo(
    () => fundoDeBatalhaPorSemente(duelo?.duelId),
    [duelo?.duelId],
  );

  if (!duelo) return null;

  const minhaChave = duelo.a.id === meuCharacterId ? "A" : "B";
  const oponente = minhaChave === "A" ? duelo.b : duelo.a;
  const minhaMana = minhaChave === "A" ? manaA : manaB;
  const meusPoderes = minhaChave === "A" ? duelo.poderesA : duelo.poderesB;
  const minhaVez = turnoAtual === minhaChave && !resultadoFinal;

  const SpriteA = spriteForClass(duelo.a.classe);
  const SpriteB = spriteForClass(duelo.b.classe);

  function agirEDesabilitar(tipo: "attack" | "power" | "item", id?: number) {
    if (!minhaVez || enviando) return;
    setEnviando(true);
    agir(tipo, id);
    // Otimista: o servidor não devolve um "ack" separado pra ação de
    // item (só o broadcast de turno, igual pra qualquer ação) — decrementa
    // aqui na hora do clique, já que a única forma de esse envio falhar é
    // um "pvp:erro" (item sem estoque, o que o botão já bloqueia por
    // `disabled` de qualquer forma).
    if (tipo === "item" && id !== undefined) {
      setConsumiveis((atual) =>
        atual.map((consumivel) =>
          consumivel.id_item === id
            ? { ...consumivel, quantidade: Math.max(0, consumivel.quantidade - 1) }
            : consumivel,
        ),
      );
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border-2 border-[#F3B43F]/40 shadow-2xl">
      {/* Camada de fundo — mesmo tratamento do combate da Aventura
          (CombatArena.tsx): imagem em bg-cover/bg-center, gradiente de
          fallback quando não há imagem, e um véu preto por cima pra
          manter texto e barras legíveis. */}
      <div
        className={`absolute inset-0 bg-cover bg-center ${
          fundoArena ? "" : "bg-gradient-to-b from-[#3a2f24] to-[#1f1813]"
        }`}
        style={fundoArena ? { backgroundImage: `url(${fundoArena})` } : undefined}
      />
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 flex w-full flex-col gap-4 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-4 rounded-2xl border-2 border-[#F3B43F]/60 bg-black/25 p-6 shadow-xl">
        <div className="flex flex-col items-center gap-2">
          <SpriteA className={`battle-sprite h-24 w-24 sm:h-32 sm:w-32 ${animA}`} animState={animA} stroke="#F3B43F" />
          <p className="text-sm font-bold text-[#F3B43F]">
            {duelo.a.nome} {duelo.a.id === meuCharacterId && "(Você)"}
          </p>
        </div>
        <div className="flex flex-col items-center">
          <p className="font-imFeel text-2xl text-[#F3B43F]/70 select-none">VS</p>
          {!resultadoFinal && (
            <p className="mt-1 text-xs uppercase tracking-widest text-white/60">
              Vez de {turnoAtual === "A" ? duelo.a.nome : duelo.b.nome}
              <span className="ml-2 rounded bg-black/40 px-2 py-0.5 font-bold text-[#F3B43F]">
                {segundosVisuais}s
              </span>
            </p>
          )}
        </div>
        <div className="flex flex-col items-center gap-2">
          <SpriteB className={`battle-sprite h-24 w-24 sm:h-32 sm:w-32 ${animB}`} animState={animB} stroke="#e05252" flip />
          <p className="text-sm font-bold text-[#e05252]">
            {duelo.b.nome} {duelo.b.id === meuCharacterId && "(Você)"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <BarraDeVida label={duelo.a.nome} atual={vidaA} maxima={duelo.vidaMaxA} mana={manaA} manaMax={duelo.manaMaxA} status={statusA} />
        <BarraDeVida label={duelo.b.nome} atual={vidaB} maxima={duelo.vidaMaxB} mana={manaB} manaMax={duelo.manaMaxB} status={statusB} />
      </div>

      <div className="flex h-40 w-full flex-col-reverse overflow-y-auto rounded-2xl bg-black/85 p-4 text-sm text-white shadow-inner">
        <div>
          {log.map((linha, i) => (
            <p key={i} className="mb-1">
              {linha}
            </p>
          ))}
        </div>
      </div>

      {erro && <p className="text-sm text-red-400">{erro}</p>}

      {duelo.ranked && oponenteDesconectadoRanked && !resultadoFinal && (
        <p className="text-center text-sm text-yellow-400">
          Seu oponente desconectou. Aguardando reconexão ({oponenteDesconectadoRanked.prazoSegundos}s) antes de
          declarar vitória por abandono...
        </p>
      )}

      {!resultadoFinal && (
        <>
          {minhaVez ? (
            <CombatActionBar
              podeAgir={minhaVez}
              ocupado={enviando}
              manaAtual={minhaMana}
              onAtaqueBasico={() => agirEDesabilitar("attack")}
              poderes={meusPoderes.map((poder) => ({
                id: poder.id,
                nome: poder.nome,
                imagem_url: poder.imagem_url,
                custo_mana: poder.custo_mana,
              }))}
              onUsarPoder={(id) => agirEDesabilitar("power", id)}
              consumiveis={consumiveis}
              onUsarConsumivel={(idItem) => agirEDesabilitar("item", idItem)}
            />
          ) : (
            <div className="rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-4 text-white shadow-lg">
              <p className="text-center text-sm text-white/60">
                Aguardando {oponente.nome} agir...
              </p>
            </div>
          )}
        </>
      )}

      {resultadoFinal && (
        <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-center text-white shadow-xl">
          <p className="font-imFeel text-3xl mb-2">
            {resultadoFinal.motivo === "FalhaServidor"
              ? "Partida encerrada"
              : resultadoFinal.vencedorChave === minhaChave
                ? "Vitória!"
                : "Derrota..."}
          </p>
          {resultadoFinal.motivo === "desistencia" && (
            <p className="mb-2 text-sm text-white/60">
              {resultadoFinal.vencedorChave === minhaChave
                ? "Seu oponente saiu do duelo."
                : "Você saiu do duelo."}
            </p>
          )}
          {resultadoFinal.motivo === "Abandono" && (
            <p className="mb-2 text-sm text-white/60">
              {resultadoFinal.vencedorChave === minhaChave
                ? "Seu oponente não reconectou a tempo — vitória por abandono."
                : "Você não reconectou a tempo — derrota por abandono."}
            </p>
          )}
          {resultadoFinal.motivo === "FalhaServidor" && (
            <p className="mb-2 text-sm text-white/60">
              Uma falha interna encerrou a partida. Seu rating não foi alterado.
            </p>
          )}
          {resultadoFinal.recompensa && resultadoFinal.vencedorChave === minhaChave && (
            <p className="mb-3">
              +{resultadoFinal.recompensa.experiencia} de experiência · +{resultadoFinal.recompensa.dinheiro} moedas
            </p>
          )}
          {duelo.ranked && ratingUpdate && (
            <RatingDelta ratingUpdate={ratingUpdate} />
          )}
          <button
            onClick={limparDuelo}
            className="rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black hover:bg-[#a5710f]"
          >
            Voltar pra arena
          </button>
        </div>
      )}
      </div>
    </div>
  );
}

function RatingDelta({ ratingUpdate }: { ratingUpdate: RankedRatingUpdatePayload }) {
  // Sempre sobre o desafiante (eu) — o defensor é IA e nunca tem rating
  // alterado, então o backend não manda um valor por jogador (ver §8).
  const { ratingAntes, ratingDepois, delta, tierDepois } = ratingUpdate;
  return (
    <p className="mb-3 text-sm">
      Rating: {ratingAntes} →{" "}
      <span className={delta >= 0 ? "text-green-400" : "text-red-400"}>
        {ratingDepois} ({delta >= 0 ? "+" : ""}
        {delta})
      </span>{" "}
      · Elo: {tierDepois.tierLabel}
    </p>
  );
}

function BarraDeVida({
  label,
  atual,
  maxima,
  mana,
  manaMax,
  status,
}: {
  label: string;
  atual: number;
  maxima: number;
  mana: number;
  manaMax: number;
  status?: StatusInstanceDuelo[];
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#292018]/90 p-3">
      <div className="mb-1 flex justify-between text-xs font-bold text-white">
        <span>{label}</span>
        <span>
          {Math.max(0, atual)} / {maxima}
        </span>
      </div>
      <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-black/30">
        <div
          className="h-full bg-red-600 transition-all duration-500"
          style={{ width: `${Math.max(0, Math.min(100, (atual / maxima) * 100))}%` }}
        />
      </div>
      <div className="mb-1 flex justify-between text-[10px] font-bold text-blue-300">
        <span>Mana</span>
        <span>
          {Math.max(0, mana)} / {manaMax}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-black/30">
        <div
          className="h-full bg-blue-500 transition-all duration-500"
          style={{ width: `${Math.max(0, Math.min(100, (mana / manaMax) * 100))}%` }}
        />
      </div>
      {status && status.length > 0 && (
        <div className="mt-2">
          <StatusIconsRow instancias={status} />
        </div>
      )}
    </div>
  );
}
