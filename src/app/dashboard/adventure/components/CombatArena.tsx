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
  const [enemy, setEnemy] = useState<EnemyState>(initialEnemy);
  const [log, setLog] = useState<string[]>([
    `Um(a) ${initialEnemy.nome} apareceu!`,
  ]);
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<
    "vitoria" | "derrota" | null
  >(null);
  const [recompensa, setRecompensa] = useState<{
    experiencia: number;
    dinheiro: number;
  } | null>(null);

  interface RespostaCombate {
    data: {
      log: string[];
      enemy: EnemyState;
      done: boolean;
      victory: boolean;
      character: { vida_atual: number; mana_atual: number };
      rewards?: { experiencia: number; dinheiro: number };
    };
  }

  async function executarAcao(action: { type: "attack" } | { type: "power"; powerId: number }) {
    if (carregando || resultado) return;
    setCarregando(true);
    try {
      const response = await axiosInstance.post<RespostaCombate>(
        "/combat/action",
        {
          characterId: character.id,
          enemy,
          action,
        }
      );

      const data = response.data.data;
      setLog((atual) => [...atual, ...data.log]);
      setEnemy(data.enemy);
      setVidaAtual(data.character.vida_atual);
      setManaAtual(data.character.mana_atual);

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
    <div className="flex flex-col items-center h-full p-4 w-full">
      <h1 className="font-imFeel text-5xl mb-4">Aventura</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl mb-4">
        <div className="bg-black/10 rounded-lg p-4">
          <p className="font-imFeel text-xl mb-1">
            {character.nome} (Nv. {character.nivel})
          </p>
          <BarraDeStatus label="Vida" atual={vidaAtual} maxima={vidaMaxima} cor="bg-red-600" />
          <BarraDeStatus label="Mana" atual={manaAtual} maxima={manaMaxima} cor="bg-blue-600" />
        </div>

        <div className="bg-black/10 rounded-lg p-4">
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
        <div className="flex flex-wrap gap-3 justify-center mb-4">
          <button
            onClick={() => executarAcao({ type: "attack" })}
            disabled={carregando}
            className="bg-[#BC8418] hover:bg-[#a5710f] text-black font-bold py-2 px-4 rounded-lg disabled:opacity-50"
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
              className="bg-[#3a2f24] hover:bg-[#2a2018] text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
            >
              {habilidade.Power.nome} ({habilidade.Power.custo_mana} mana)
            </button>
          ))}
        </div>
      )}

      {resultado && (
        <div className="text-center mb-4">
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
            className="bg-[#BC8418] hover:bg-[#a5710f] text-black font-bold py-2 px-4 rounded-lg"
          >
            {resultado === "vitoria" ? "Buscar outro inimigo" : "Voltar"}
          </button>
        </div>
      )}

      <div className="bg-black/80 text-white text-sm rounded-lg p-3 w-full max-w-2xl h-40 overflow-y-auto flex flex-col-reverse">
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
          style={{ width: `${Math.max(0, Math.min(100, (atual / maxima) * 100))}%` }}
        />
      </div>
    </div>
  );
}
