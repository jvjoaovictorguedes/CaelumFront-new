"use client";

import { useEffect, useState } from "react";
import { spriteForClass } from "../../adventure/components/sprites/spriteForClass";

export interface Turno {
  atacante: "A" | "B";
  nomeAcao: string;
  dano: number;
  cura: number;
  esquivou: boolean;
  vidaA: number;
  vidaB: number;
  manaA: number;
  manaB: number;
  vidaMaxA: number;
  vidaMaxB: number;
}

export interface Lutador {
  id: number;
  nome: string;
  genero: string;
  classe?: string;
  chave: "A" | "B";
}

export interface ResultadoDuelo {
  log: string[];
  turnos: Turno[];
  desafiante: Lutador;
  desafiado: Lutador;
  vencedorChave: "A" | "B";
  recompensa: { dinheiro: number; experiencia: number };
}

const DURACAO_ANIMACAO_MS = 500;

export default function PvpArena({
  resultado,
  aoFechar,
}: {
  resultado: ResultadoDuelo;
  aoFechar: () => void;
}) {
  const { turnos, desafiante, desafiado, vencedorChave, recompensa, log } = resultado;

  const vidaMaxA = turnos[0]?.vidaMaxA ?? 1;
  const vidaMaxB = turnos[0]?.vidaMaxB ?? 1;

  const [indice, setIndice] = useState(-1); // -1 = ainda não começou
  const [vidaA, setVidaA] = useState(vidaMaxA);
  const [vidaB, setVidaB] = useState(vidaMaxB);
  const [animA, setAnimA] = useState("");
  const [animB, setAnimB] = useState("");
  const [terminou, setTerminou] = useState(false);
  const [linhasLog, setLinhasLog] = useState<string[]>([log[0]]);

  const SpriteA = spriteForClass(desafiante.classe);
  const SpriteB = spriteForClass(desafiado.classe);

  useEffect(() => {
    let cancelado = false;

    async function reproduzir() {
      for (let i = 0; i < turnos.length; i++) {
        if (cancelado) return;
        const turno = turnos[i];
        const ehA = turno.atacante === "A";

        setAnimA(ehA ? "anim-atacando-direita" : turno.esquivou ? "anim-esquivando-esquerda" : "anim-atingido");
        setAnimB(!ehA ? "anim-atacando-esquerda" : turno.esquivou ? "anim-esquivando-direita" : "anim-atingido");

        await new Promise((r) => setTimeout(r, DURACAO_ANIMACAO_MS));
        if (cancelado) return;

        setVidaA(turno.vidaA);
        setVidaB(turno.vidaB);
        setLinhasLog((atual) => [...atual, log[i + 1]].filter(Boolean));
        setAnimA("");
        setAnimB("");

        await new Promise((r) => setTimeout(r, 150));
      }

      if (cancelado) return;
      setAnimA(vencedorChave === "A" ? "anim-vitoria" : "anim-derrota");
      setAnimB(vencedorChave === "B" ? "anim-vitoria" : "anim-derrota");
      setLinhasLog((atual) => [...atual, log[log.length - 1]]);
      setTerminou(true);
    }

    setIndice(0);
    reproduzir();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between gap-4 rounded-2xl border-2 border-[#F3B43F]/60 bg-gradient-to-b from-[#3a2f24] to-[#1f1813] p-6 shadow-xl">
        <div className="flex flex-col items-center gap-2">
          <SpriteA
            className={`battle-sprite h-24 w-24 sm:h-32 sm:w-32 ${animA}`}
            animState={animA}
            stroke="#F3B43F"
          />
          <p className="text-sm font-bold text-[#F3B43F]">{desafiante.nome}</p>
        </div>
        <p className="font-imFeel text-2xl text-[#F3B43F]/70 select-none">VS</p>
        <div className="flex flex-col items-center gap-2">
          <SpriteB
            className={`battle-sprite h-24 w-24 sm:h-32 sm:w-32 ${animB}`}
            animState={animB}
            stroke="#e05252"
            flip
          />
          <p className="text-sm font-bold text-[#e05252]">{desafiado.nome}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <BarraDeVida label={desafiante.nome} atual={vidaA} maxima={vidaMaxA} />
        <BarraDeVida label={desafiado.nome} atual={vidaB} maxima={vidaMaxB} />
      </div>

      <div className="flex h-40 w-full flex-col-reverse overflow-y-auto rounded-2xl bg-black/85 p-4 text-sm text-white shadow-inner">
        <div>
          {linhasLog.map((linha, i) => (
            <p key={i} className="mb-1">
              {linha}
            </p>
          ))}
        </div>
      </div>

      {terminou && (
        <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-center text-white shadow-xl">
          <p className="font-imFeel text-3xl mb-2">
            {vencedorChave === "A" ? "Vitória!" : "Derrota..."}
          </p>
          {vencedorChave === "A" && (
            <p className="mb-3">
              +{recompensa.experiencia} de experiência · +{recompensa.dinheiro} moedas
            </p>
          )}
          <button
            onClick={aoFechar}
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
}: {
  label: string;
  atual: number;
  maxima: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#292018]/90 p-3">
      <div className="mb-1 flex justify-between text-xs font-bold text-white">
        <span>{label}</span>
        <span>
          {Math.max(0, atual)} / {maxima}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-black/30">
        <div
          className="h-full bg-red-600 transition-all duration-500"
          style={{ width: `${Math.max(0, Math.min(100, (atual / maxima) * 100))}%` }}
        />
      </div>
    </div>
  );
}
