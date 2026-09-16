"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosIntance";
import { spriteForClass } from "./sprites/spriteForClass";
import { spriteForEnemy } from "./sprites/spriteForEnemy";
import MinotauroSprite from "./sprites/MinotauroSprite";

type EstadoAnimacao =
  | "idle"
  | "anim-atacando-direita"
  | "anim-atacando-esquerda"
  | "anim-atingido"
  | "anim-esquivando-direita"
  | "anim-esquivando-esquerda"
  | "anim-vitoria"
  | "anim-derrota";

const DURACAO_ANIMACAO_MS = 550;

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
  vida_maxima?: number;
  mana_atual: number;
  mana_maxima?: number;
  experiencia?: number;
  pontos_distribuir?: number;
  Class?: { nome?: string };
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

interface FloatingText {
  id: number;
  text: string;
  color: string;
}

export default function CombatArena({
  character,
  abilities,
  initialEnemy,
}: CombatArenaProps) {
  const router = useRouter();
  const vidaMaxima = character.vida_maxima ?? 30 + character.vitalidade * 6;
  const manaMaxima = character.mana_maxima ?? 20 + character.inteligencia * 5;
  const PlayerSprite = spriteForClass(character.Class?.nome);

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
  const [animJogador, setAnimJogador] = useState<EstadoAnimacao>("idle");
  const [animInimigo, setAnimInimigo] = useState<EstadoAnimacao>("idle");

  // Estado para efeito visual de escudo/cura arcana no jogador
  const [isShieldActive, setIsShieldActive] = useState(false);

  // Estados para os textos flutuantes
  const [floatingTextsPlayer, setFloatingTextsPlayer] = useState<FloatingText[]>([]);
  const [floatingTextsEnemy, setFloatingTextsEnemy] = useState<FloatingText[]>([]);

  const experienciaNivel = Math.max(100, nivelAtual * 100);

  function espera(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function triggerFloatingText(target: "player" | "enemy", text: string, color: string) {
    const id = Date.now() + Math.random();
    if (target === "player") {
      setFloatingTextsPlayer((prev) => [...prev, { id, text, color }]);
      setTimeout(() => {
        setFloatingTextsPlayer((prev) => prev.filter((item) => item.id !== id));
      }, 900);
    } else {
      setFloatingTextsEnemy((prev) => [...prev, { id, text, color }]);
      setTimeout(() => {
        setFloatingTextsEnemy((prev) => prev.filter((item) => item.id !== id));
      }, 900);
    }
  }

  async function tocarAnimacaoDoTurno({
    inimigoLevouDano,
    jogadorLevouDano,
    acabouNaVitoria,
    acabouNaDerrota,
    danoInimigo,
    variacaoVidaJogador,
    usouCura,
  }: {
    inimigoLevouDano: boolean;
    jogadorLevouDano: boolean;
    acabouNaVitoria: boolean;
    acabouNaDerrota: boolean;
    danoInimigo: number;
    variacaoVidaJogador: number;
    usouCura: boolean;
  }) {
    if (usouCura) {
      setIsShieldActive(true);
      triggerFloatingText("player", "✨ ESCUDO ARCANO!", "#00ffff");
      await espera(400);
    }

    // Fase 1: Ação do Jogador
    setAnimJogador(usouCura ? "idle" : "anim-atacando-direita");
    setAnimInimigo(inimigoLevouDano ? "anim-atingido" : "anim-esquivando-direita");

    if (danoInimigo > 0) {
      triggerFloatingText("enemy", `-${danoInimigo}`, "#ff3333");
    }

    await espera(DURACAO_ANIMACAO_MS);

    if (acabouNaVitoria) {
      setIsShieldActive(false);
      setAnimJogador("anim-vitoria");
      setAnimInimigo("anim-derrota");
      return;
    }

    // Fase 2: Inimigo revida / Turno do Inimigo
    setAnimJogador("idle");
    setAnimInimigo("anim-atacando-esquerda");
    await espera(50); // <--- Corrigido aqui!

    if (usouCura) {
      triggerFloatingText("player", "🛡️ IMUNE!", "#00ffff");
      setAnimJogador("anim-esquivando-esquerda");
    } else {
      setAnimJogador(jogadorLevouDano ? "anim-atingido" : "anim-esquivando-esquerda");
    }

    if (variacaoVidaJogador > 0) {
      triggerFloatingText("player", `+${variacaoVidaJogador} CURA`, "#44ff44");
    } else if (variacaoVidaJogador < 0 && !usouCura) {
      triggerFloatingText("player", `-${Math.abs(variacaoVidaJogador)}`, "#ff3333");
    }

    await espera(DURACAO_ANIMACAO_MS);

    setIsShieldActive(false);
    setAnimInimigo("idle");
    setAnimJogador(acabouNaDerrota ? "anim-derrota" : "idle");
  }

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

    const poderUsado = action.type === "power"
      ? abilities.find((h) => h.Power.id === action.powerId)?.Power
      : null;
    
    const usouCura = Boolean(
      poderUsado && (poderUsado.cura_base > 0 || poderUsado.nome.toLowerCase().includes("cura"))
    );

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

      const danoInimigo = enemy.vida_atual - data.enemy.vida_atual;
      const variacaoVidaJogador = data.character.vida_atual - vidaAtual;

      const inimigoLevouDano = danoInimigo > 0;
      const jogadorLevouDano = data.character.vida_atual < vidaAtual;
      const acabouNaVitoria = data.done && data.victory;
      const acabouNaDerrota = data.done && !data.victory;

      setLog((atual) => [...atual, ...data.log]);
      setEnemy(data.enemy);
      setVidaAtual(data.character.vida_atual);
      setManaAtual(data.character.mana_atual);
      setNivelAtual(data.character.nivel);
      setExperienciaAtual(data.character.experiencia);
      setPontosDistribuir(data.character.pontos_distribuir);

      await tocarAnimacaoDoTurno({
        inimigoLevouDano,
        jogadorLevouDano,
        acabouNaVitoria,
        acabouNaDerrota,
        danoInimigo,
        variacaoVidaJogador,
        usouCura,
      });

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
      <style jsx>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-25px) scale(1.15);
          }
          100% {
            opacity: 0;
            transform: translateY(-50px) scale(1);
          }
        }
        .animate-float-up {
          animation: floatUp 0.9s ease-out forwards;
        }

        @keyframes pulseShield {
          0% {
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.4);
          }
          50% {
            box-shadow: 0 0 25px rgba(0, 255, 255, 0.8), inset 0 0 15px rgba(0, 255, 255, 0.5);
          }
          100% {
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.4);
          }
        }
        .shield-active {
          animation: pulseShield 1s infinite ease-in-out;
          border-radius: 1rem;
          background: rgba(0, 200, 255, 0.1);
        }
      `}</style>

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

      <div className="flex items-center justify-between gap-4 rounded-2xl border-2 border-[#F3B43F]/60 bg-gradient-to-b from-[#3a2f24] to-[#1f1813] p-6 shadow-xl overflow-hidden">
        <div className={`relative flex flex-col items-center p-2 transition-all duration-300 ${isShieldActive ? "shield-active border border-cyan-400/50" : ""}`}>
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 pointer-events-none z-20 flex flex-col items-center">
            {floatingTextsPlayer.map((ft) => (
              <span
                key={ft.id}
                className="animate-float-up absolute font-bold text-lg sm:text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] whitespace-nowrap"
                style={{ color: ft.color }}
              >
                {ft.text}
              </span>
            ))}
          </div>
          <PlayerSprite
            className={`battle-sprite h-28 w-28 sm:h-36 sm:w-36 ${animJogador !== "idle" ? animJogador : ""}`}
          />
        </div>

        <p className="font-imFeel text-2xl text-[#F3B43F]/70 select-none">VS</p>

        <div className="relative flex flex-col items-center p-2">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 pointer-events-none z-20 flex flex-col items-center">
            {floatingTextsEnemy.map((ft) => (
              <span
                key={ft.id}
                className="animate-float-up absolute font-bold text-lg sm:text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] whitespace-nowrap"
                style={{ color: ft.color }}
              >
                {ft.text}
              </span>
            ))}
          </div>
          <MinotauroSprite
            className={`battle-sprite h-28 w-28 sm:h-36 sm:w-36 ${animInimigo !== "idle" ? animInimigo : ""}`}
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
            onClick={() =>
              resultado === "vitoria"
                ? router.refresh()
                : router.push("/dashboard")
            }
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