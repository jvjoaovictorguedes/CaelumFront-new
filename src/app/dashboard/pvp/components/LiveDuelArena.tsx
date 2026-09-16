"use client";

import { useEffect, useRef, useState } from "react";
import { usePvpSocket } from "@/contexts/PvpSocketContext";
import { spriteForClass } from "../../adventure/components/sprites/spriteForClass";

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function LiveDuelArena({ meuCharacterId }: { meuCharacterId: number }) {
  const { duelo, turnos, resultadoFinal, agir, limparDuelo, erro } = usePvpSocket();

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

  const processadosRef = useRef(0);
  const processandoRef = useRef(false);

  useEffect(() => {
    if (!duelo) return;
    processadosRef.current = 0;
    setVidaA(duelo.vidaA);
    setVidaB(duelo.vidaB);
    setManaA(duelo.manaA);
    setManaB(duelo.manaB);
    setTurnoAtual(duelo.turnoDe);
    setPrazo(duelo.prazoSegundos);
    setLog([`Duelo começou na ${duelo.arena}! Vez de ${duelo.turnoDe === "A" ? duelo.a.nome : duelo.b.nome}.`]);
    setEnviando(false);
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
        setAnimA("");
        setAnimB("");

        let linha: string;
        if (turno.esquivou) {
          linha = `${nomeDefensor} esquivou de ${turno.nomeAcao} de ${nomeAtacante}!`;
        } else if (turno.dano > 0) {
          linha = `${nomeAtacante} usou ${turno.nomeAcao} e causou ${turno.dano} de dano em ${nomeDefensor}.`;
        } else if (turno.cura > 0) {
          linha = `${nomeAtacante} usou ${turno.nomeAcao} e recuperou ${turno.cura} de vida.`;
        } else {
          linha = `${nomeAtacante} usou ${turno.nomeAcao}.`;
        }
        setLog((atual) => [...atual, linha]);

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

  if (!duelo) return null;

  const minhaChave = duelo.a.id === meuCharacterId ? "A" : "B";
  const oponente = minhaChave === "A" ? duelo.b : duelo.a;
  const minhaMana = minhaChave === "A" ? manaA : manaB;
  const meusPoderes = minhaChave === "A" ? duelo.poderesA : duelo.poderesB;
  const minhaVez = turnoAtual === minhaChave && !resultadoFinal;

  const SpriteA = spriteForClass(duelo.a.classe);
  const SpriteB = spriteForClass(duelo.b.classe);

  function agirEDesabilitar(tipo: "attack" | "power", idPoder?: number) {
    if (!minhaVez || enviando) return;
    setEnviando(true);
    agir(tipo, idPoder);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between gap-4 rounded-2xl border-2 border-[#F3B43F]/60 bg-gradient-to-b from-[#3a2f24] to-[#1f1813] p-6 shadow-xl">
        <div className="flex flex-col items-center gap-2">
          <SpriteA className={`battle-sprite h-24 w-24 sm:h-32 sm:w-32 ${animA}`} stroke="#F3B43F" />
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
          <SpriteB className={`battle-sprite h-24 w-24 sm:h-32 sm:w-32 ${animB}`} stroke="#e05252" />
          <p className="text-sm font-bold text-[#e05252]">
            {duelo.b.nome} {duelo.b.id === meuCharacterId && "(Você)"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <BarraDeVida label={duelo.a.nome} atual={vidaA} maxima={duelo.vidaMaxA} mana={manaA} manaMax={duelo.manaMaxA} />
        <BarraDeVida label={duelo.b.nome} atual={vidaB} maxima={duelo.vidaMaxB} mana={manaB} manaMax={duelo.manaMaxB} />
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

      {!resultadoFinal && (
        <div className="rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-4 text-white shadow-lg">
          {minhaVez ? (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => agirEDesabilitar("attack")}
                disabled={enviando}
                className="rounded-lg border-2 border-[#F3B43F] bg-[#BC8418] px-4 py-2 font-bold text-black transition hover:bg-[#a5710f] disabled:opacity-50"
              >
                Ataque básico
              </button>
              {meusPoderes.map((poder) => (
                <button
                  key={poder.id}
                  onClick={() => agirEDesabilitar("power", poder.id)}
                  disabled={enviando || poder.custo_mana > minhaMana}
                  className="rounded-lg border-2 border-[#F3B43F]/60 bg-[#3a2f24] px-4 py-2 font-bold text-[#F3B43F] transition hover:bg-[#4a3c2e] disabled:opacity-40"
                  title={`Custa ${poder.custo_mana} de mana`}
                >
                  {poder.nome} <span className="text-xs text-white/60">({poder.custo_mana} mana)</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-white/60">
              Aguardando {oponente.nome} agir...
            </p>
          )}
        </div>
      )}

      {resultadoFinal && (
        <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-center text-white shadow-xl">
          <p className="font-imFeel text-3xl mb-2">
            {resultadoFinal.vencedorChave === minhaChave ? "Vitória!" : "Derrota..."}
          </p>
          {resultadoFinal.motivo === "desistencia" && (
            <p className="mb-2 text-sm text-white/60">
              {resultadoFinal.vencedorChave === minhaChave
                ? "Seu oponente saiu do duelo."
                : "Você saiu do duelo."}
            </p>
          )}
          {resultadoFinal.vencedorChave === minhaChave && (
            <p className="mb-3">
              +{resultadoFinal.recompensa.experiencia} de experiência · +{resultadoFinal.recompensa.dinheiro} moedas
            </p>
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
  );
}

function BarraDeVida({
  label,
  atual,
  maxima,
  mana,
  manaMax,
}: {
  label: string;
  atual: number;
  maxima: number;
  mana: number;
  manaMax: number;
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
      <div className="h-2 w-full overflow-hidden rounded-full bg-black/30">
        <div
          className="h-full bg-blue-500 transition-all duration-500"
          style={{ width: `${Math.max(0, Math.min(100, (mana / manaMax) * 100))}%` }}
        />
      </div>
    </div>
  );
}
