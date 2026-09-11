"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosIntance";

interface Power {
  id: number;
  nome: string;
  descricao: string;
  tipo_poder: string;
  custo_mana: number;
  dano_base: number;
  cura_base: number;
}

interface Ability {
  id: number;
  Power: Power;
}

interface CharacterState {
  id: number;
  nome: string;
  nivel: number;
  vitalidade: number;
  inteligencia: number;
  vida_atual: number;
  mana_atual: number;
  experiencia?: number;
  pontos_distribuir?: number;
}

interface EnemyState {
  nome: string;
  nivel: number;
  vida_atual: number;
  vida_maxima: number;
  forca: number;
  vitalidade: number;
  agilidade: number;
  velocidade: number;
  dano_base: number;
}

interface CombatArenaProps {
  character: CharacterState;
  abilities: Ability[];
  initialEnemy: EnemyState;
}

export default function CombatArena({
  character,
  abilities,
  initialEnemy,
}: CombatArenaProps) {
  const router = useRouter();
  const vidaMaxima = 30 + character.vitalidade * 6;
  const manaMaxima = 20 + character.inteligencia * 5;

  const [vidaAtual, setVidaAtual] = useState(character.vida_atual);
  const [manaAtual, setManaAtual] = useState(character.mana_atual);
  const [nivelAtual, setNivelAtual] = useState(character.nivel);
const [experienciaAtual, setExperienciaAtual] = useState(
  character.experiencia ?? 0,
);
const [pontosDistribuir, setPontosDistribuir] = useState(
  character.pontos_distribuir ?? 0,
);
  const [enemy, setEnemy] = useState<EnemyState>(initialEnemy);
  const [log, setLog] = useState<string[]>([
    `Um(a) ${initialEnemy.nome} apareceu!`,
  ]);
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<"vitoria" | "derrota" | null>(
    null,
  );
  const [recompensa, setRecompensa] = useState<{
    experiencia: number;
    dinheiro: number;
  } | null>(null);
const experienciaNivel = Math.max(100, nivelAtual * 100);

  interface RespostaCombate {
    data: {
      log: string[];
      enemy: EnemyState;
      done: boolean;
      victory: boolean;
      character: {
  vida_atual: number;
  mana_atual: number;
  nivel: number;
  experiencia: number;
  pontos_distribuir: number;
};
      rewards?: { experiencia: number; dinheiro: number };
    };
  }

  async function executarAcao(
    action: { type: "attack" } | { type: "power"; powerId: number },
  ) {
    if (carregando || resultado) return;
    setCarregando(true);
    try {
      const response = await axiosInstance.post<RespostaCombate>(
        "/combat/action",
        {
          characterId: character.id,
          enemy,
          action,
        },
      );

      const data = response.data.data;
      setLog((atual) => [...atual, ...data.log]);
      setEnemy(data.enemy);
setVidaAtual(data.character.vida_atual);
setManaAtual(data.character.mana_atual);
setNivelAtual(data.character.nivel);
setExperienciaAtual(data.character.experiencia);
setPontosDistribuir(data.character.pontos_distribuir);

      if (data.done) {
        setResultado(data.victory ? "vitoria" : "derrota");
        if (data.rewards) setRecompensa(data.rewards);
      }
    } catch (error: unknown) {
      const mensagem =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Erro ao processar o combate.";
      setLog((atual) => [...atual, mensagem]);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-2 sm:p-4">
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">
          Zona de combate
        </p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-imFeel text-4xl sm:text-5xl">Aventura</h1>
          <p className="text-sm text-white/70">
            XP: {experienciaAtual} / {experienciaNivel}
          </p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/50">
          <div
            className="h-full bg-[#F3B43F]"
            style={{
              width: `${Math.min(100, (experienciaAtual / experienciaNivel) * 100)}%`,
            }}
          />
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-green-900/20 bg-[#292018]/90 p-4 shadow-lg">
          <p className="font-imFeel text-xl mb-1">
            {character.nome} (Nv. {nivelAtual}) (<span className="text-sm text-white/70">Pontos à distribuir: {pontosDistribuir}</span>)
          </p>
          <BarraDeStatus
            label="Vida"
            atual={vidaAtual}
            maxima={vidaMaxima}
            cor="bg-red-600"
          />
          <BarraDeStatus
            label="Mana"
            atual={manaAtual}
            maxima={manaMaxima}
            cor="bg-blue-600"
          />
        </div>

        <div className="rounded-2xl border border-red-900/20 bg-[#292018]/90 p-4 shadow-lg">
          <p className="font-imFeel text-xl mb-1">
            {enemy.nome} (Nv. {enemy.nivel})
          </p>
          <BarraDeStatus
            label="Vida"
            atual={enemy.vida_atual}
            maxima={enemy.vida_maxima}
            cor="bg-red-600"
          />
        </div>
      </div>

      {!resultado && (
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => executarAcao({ type: "attack" })}
            disabled={carregando}
            className="rounded-lg border-2 border-[#F3B43F] bg-[#BC8418] px-4 py-2 font-bold text-black shadow-md transition hover:bg-[#a5710f] disabled:opacity-50"
          >
            Ataque básico
          </button>
          {abilities.map((habilidade) => (
            <button
              key={habilidade.id}
              onClick={() =>
                executarAcao({ type: "power", powerId: habilidade.Power.id })
              }
              disabled={carregando || manaAtual < habilidade.Power.custo_mana}
              title={habilidade.Power.descricao}
              className="rounded-lg border-2 border-[#F3B43F]/60 bg-[#3a2f24] px-4 py-2 font-bold text-white shadow-md transition hover:bg-[#2a2018] disabled:opacity-50"
            >
              {habilidade.Power.nome} ({habilidade.Power.custo_mana} mana)
            </button>
          ))}
        </div>
      )}

      {resultado && (
        <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-center text-white shadow-xl">
          <p className="font-imFeel text-3xl mb-2">
            {resultado === "vitoria" ? "Vitória!" : "Derrota..."}
          </p>
          {recompensa && (
            <p className="mb-3">
              +{recompensa.experiencia} de experiência · +{recompensa.dinheiro}{" "}
              moedas
            </p>
          )}
          <button
            onClick={() => router.refresh()}
            className="rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black hover:bg-[#a5710f]"
          >
            {resultado === "vitoria" ? "Buscar outro inimigo" : "Voltar"}
          </button>
        </div>
      )}

      <div className="flex h-48 w-full flex-col-reverse overflow-y-auto rounded-2xl bg-black/85 p-4 text-sm text-white shadow-inner">
        <div>
          {log.map((linha, indice) => (
            <p key={indice} className="mb-1">
              {linha}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function BarraDeStatus({
  label,
  atual,
  maxima,
  cor,
}: {
  label: string;
  atual: number;
  maxima: number;
  cor: string;
}) {
  return (
    <div className="mb-1">
      <div className="flex justify-between text-xs font-bold mb-1">
        <span>{label}</span>
        <span>
          {atual} / {maxima}
        </span>
      </div>
      <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden">
        <div
          className={`h-full ${cor}`}
          style={{
            width: `${Math.max(0, Math.min(100, (atual / maxima) * 100))}%`,
          }}
        />
      </div>
    </div>
  );
}
