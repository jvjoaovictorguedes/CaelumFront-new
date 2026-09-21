"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import axiosInstance from "@/utils/axiosIntance";
import { useCharacter } from "@/contexts/CharacterContext";
import CombatActionBar, {
  type ConsumivelAcao,
} from "@/components/combat/CombatActionBar";

import { spriteFolderForClass, spriteForClass } from "./sprites/spriteForClass";

import { spriteFolderForEnemy, spriteForEnemy } from "./sprites/spriteForEnemy";

import {
  getSpriteAnimationDurationMs,
  type EstadoSprite,
} from "./sprites/spriteSheets";

type EstadoAnimacao =
  | "idle"
  | "anim-atacando-direita"
  | "anim-atacando-esquerda"
  | "anim-atingido"
  | "anim-esquivando-direita"
  | "anim-esquivando-esquerda"
  | "anim-vitoria"
  | "anim-derrota";

const DURACAO_MOVIMENTO_MS = 500;
const INTERVALO_ENTRE_FASES_MS = 50;

const DURACAO_CAMINHADA_MS = 420;

const FUNDO_POR_ZONA: Record<string, string> = {
  "Bosque de Sussurros": "/images/backgrounds/selva-teste.jpg",
  "Terras Devastadas": "/images/backgrounds/terras-devastadas.jpg",
};

const FUNDO_POR_MONSTRO: Record<string, string> = {
  "Espectro Sussurrante": "/images/backgrounds/cripta-espectral.jpg",
  "Bandido Errante": "/images/backgrounds/acampamento-bandido.jpg",
  "Golem de Pedra": "/images/backgrounds/templo-ancestral-golem.jpg",
  Minotauro: "/images/backgrounds/covil-minotauro.jpg",
  "Aranha Venenosa": "/images/backgrounds/ninho-aranhas.jpg",
  "Cultista Renegado": "/images/backgrounds/altar-cultos.jpg",
};

interface Power {
  id: number;
  nome: string;
  descricao: string;
  tipo_poder: string;
  custo_mana: number;
  dano_base: number;
  cura_base: number;
  imagem_url?: string | null;
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

  slots_consumiveis_combate?: (number | null)[] | null;

  Class?: {
    nome?: string;
  };
}

interface ItemInventarioApi {
  id_item: number;
  quantidade: number;
  Item: {
    nome: string;
    imagem_url?: string | null;
    consumableProperties?: {
      efeito_vida?: number;
      efeito_mana?: number;
    } | null;
  };
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
  // Reaproveitado pelo Portal de Ranque (ver PortalArena.tsx) — o motor
  // de combate (turnos, animações, sprites) é o mesmo, só muda pra onde
  // a ação é mandada e o que acontece quando o combate termina.
  actionEndpoint?: string;
  onVitoria?: () => void;
  onDerrota?: () => void;
  labelBotaoVitoria?: string;
  tituloZona?: string;
  tituloArena?: string;
  // Área de caça ativa (ver HuntingSessionHeader.tsx / sessao.area) — só
  // usada pra escolher o fundo da arena por nome/imagem_url, não afeta a
  // lógica de combate.
  zona?: { id: number; nome: string; imagem_url: string | null } | null;
}

interface FloatingText {
  id: number;
  text: string;
  color: string;
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

    rewards?: {
      experiencia: number;
      dinheiro: number;
    };

    drop?: {
      tipo: "item" | "ouro";
      item?: { id: number; nome: string; raridade: string };
      dinheiro?: number;
    } | null;
  };
}

function espera(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function duracaoVisual(
  pasta: string | null,
  estado: EstadoSprite,
  minimo = DURACAO_MOVIMENTO_MS,
) {
  if (!pasta) {
    return minimo;
  }

  return Math.max(
    minimo,

    getSpriteAnimationDurationMs(pasta, estado),
  );
}

export default function CombatArena({
  character,
  abilities,
  initialEnemy,
  actionEndpoint = "/combat/action",
  onVitoria,
  onDerrota,
  labelBotaoVitoria = "Buscar outro inimigo",
  tituloZona = "Zona de combate",
  tituloArena = "Aventura",
  zona = null,
}: CombatArenaProps) {
  const router = useRouter();

  // Sem propagar pro contexto compartilhado, o resto do app (NavMenu,
  // "Meu Personagem", etc.) continuava mostrando a vida/mana de ANTES da
  // luta começar — cada turno já vinha certo aqui dentro (estado local),
  // mas só entrava no contexto se algo ativado por outra tela (equipar,
  // usar item) chamasse refreshCharacter. Resultado: sair da Aventura no
  // meio de um combate mostrava vida errada em qualquer outro lugar até
  // dar F5.
  const { atualizarCharacter } = useCharacter();

  const vidaMaxima = character.vida_maxima ?? 30 + character.vitalidade * 6;

  const manaMaxima = character.mana_maxima ?? 20 + character.inteligencia * 5;

  const PlayerSprite = spriteForClass(character.Class?.nome);

  const pastaSpriteJogador = spriteFolderForClass(character.Class?.nome);

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

  const [drop, setDrop] = useState<{
    tipo: "item" | "ouro";
    item?: { id: number; nome: string; raridade: string };
    dinheiro?: number;
  } | null>(null);

  const [consumiveis, setConsumiveis] = useState<ConsumivelAcao[]>([]);

  // Consumíveis "equipados" no loadout de combate (definidos fora daqui,
  // em CombatLoadoutPanel) — busca uma vez ao entrar na tela, cruzando
  // os slots do personagem com a quantidade real no inventário.
  useEffect(() => {
    let cancelado = false;

    async function carregarConsumiveis() {
      const idsUnicos = Array.from(
        new Set(
          (character.slots_consumiveis_combate ?? []).filter(
            (id): id is number => typeof id === "number",
          ),
        ),
      );
      if (idsUnicos.length === 0) {
        if (!cancelado) setConsumiveis([]);
        return;
      }

      try {
        const resp = await axiosInstance.get<{
          data?: { inventory?: ItemInventarioApi[] };
        }>("/character-inventory", { params: { characterId: character.id } });
        const inventario = resp.data?.data?.inventory ?? [];
        const lista: ConsumivelAcao[] = idsUnicos.map((idItem) => {
          const entrada = inventario.find((item) => item.id_item === idItem);
          return {
            id_item: idItem,
            nome: entrada?.Item.nome ?? "Item",
            imagem_url: entrada?.Item.imagem_url,
            quantidade: entrada?.quantidade ?? 0,
            efeito_vida: entrada?.Item.consumableProperties?.efeito_vida,
            efeito_mana: entrada?.Item.consumableProperties?.efeito_mana,
          };
        });
        if (!cancelado) setConsumiveis(lista);
      } catch (error) {
        console.error("Erro ao carregar consumíveis de combate:", error);
      }
    }

    carregarConsumiveis();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.id]);

  const [animJogador, setAnimJogador] = useState<EstadoAnimacao>("idle");

  const [animInimigo, setAnimInimigo] = useState<EstadoAnimacao>("idle");

  const [poseJogador, setPoseJogador] = useState<{
    pose: EstadoSprite | undefined;

    fogo: boolean;
  }>({
    pose: undefined,
    fogo: false,
  });

  const [isShieldActive, setIsShieldActive] = useState(false);

  // Controlam a "caminhada" até a distância de combate corpo-a-corpo —
  // true desloca a coluna (via translateX no wrapper) em direção ao
  // centro da arena, false volta pra posição de origem. Não mexe no
  // sprite em si, só na div que o envolve.
  const [avancoJogador, setAvancoJogador] = useState(false);
  const [avancoInimigo, setAvancoInimigo] = useState(false);

  // Log de combate deixou de ficar sempre visível (poluía a tela) — agora
  // só abre como popup ao clicar no ícone "i".
  const [mostrarLog, setMostrarLog] = useState(false);

  const [floatingTextsPlayer, setFloatingTextsPlayer] = useState<
    FloatingText[]
  >([]);

  const [floatingTextsEnemy, setFloatingTextsEnemy] = useState<FloatingText[]>(
    [],
  );

  const experienciaNivel = Math.max(100, nivelAtual * 100);

  const EnemySprite = spriteForEnemy(enemy.nome);

  const pastaSpriteInimigo = spriteFolderForEnemy(enemy.nome);

  // Prioridade: fundo específico do monstro atual > imagem_url vinda do
  // servidor (hoje sempre null — ver AdventureZone.js) > fundo padrão da
  // zona > gradiente padrão (null).
  const fundoZona =
    FUNDO_POR_MONSTRO[enemy.nome] ||
    zona?.imagem_url ||
    (zona?.nome ? FUNDO_POR_ZONA[zona.nome] : undefined) ||
    null;

  function triggerFloatingText(
    target: "player" | "enemy",

    text: string,

    color: string,
  ) {
    const id = Date.now() + Math.random();

    if (target === "player") {
      setFloatingTextsPlayer((prev) => [
        ...prev,
        {
          id,
          text,
          color,
        },
      ]);

      setTimeout(() => {
        setFloatingTextsPlayer((prev) => prev.filter((item) => item.id !== id));
      }, 900);

      return;
    }

    setFloatingTextsEnemy((prev) => [
      ...prev,
      {
        id,
        text,
        color,
      },
    ]);

    setTimeout(() => {
      setFloatingTextsEnemy((prev) => prev.filter((item) => item.id !== id));
    }, 900);
  }

  async function tocarAnimacaoDoTurno({
    inimigoLevouDano,
    jogadorLevouDano,

    acabouNaVitoria,
    acabouNaDerrota,

    danoInimigo,
    variacaoVidaJogador,

    usouCura,
    usouPoder,
    usouPoderDeFogo,

    novoEnemy,
    novaVidaJogador,
  }: {
    inimigoLevouDano: boolean;
    jogadorLevouDano: boolean;

    acabouNaVitoria: boolean;
    acabouNaDerrota: boolean;

    danoInimigo: number;
    variacaoVidaJogador: number;

    usouCura: boolean;
    usouPoder: boolean;
    usouPoderDeFogo: boolean;

    novoEnemy: EnemyState;
    novaVidaJogador: number;
  }) {
    if (usouCura) {
      setIsShieldActive(true);

      triggerFloatingText("player", "✨ ESCUDO ARCANO!", "#00ffff");

      await espera(400);
    }

    const estadoAcaoJogador: EstadoSprite = usouCura
      ? "idle"
      : usouPoder
        ? "poder"
        : "attack";

    if (usouPoder && !usouCura) {
      setPoseJogador({
        pose: "poder",
        fogo: usouPoderDeFogo,
      });
    }

    // Cura fica parado no lugar (é um efeito sobre si mesmo, não faz
    // sentido andar até o inimigo pra isso) — qualquer outra ação anda
    // até a distância de combate antes de golpear.
    if (!usouCura) {
      setAvancoJogador(true);
      await espera(DURACAO_CAMINHADA_MS);
    }

    setAnimJogador(usouCura ? "idle" : "anim-atacando-direita");

    setAnimInimigo(
      inimigoLevouDano ? "anim-atingido" : "anim-esquivando-direita",
    );

    if (danoInimigo > 0) {
      triggerFloatingText("enemy", `-${danoInimigo}`, "#ff3333");
    }

    // A barra de vida do inimigo só reflete o novo valor aqui, no
    // instante em que o golpe visualmente chega (depois da caminhada) —
    // ver comentário no cabeçalho da função.
    setEnemy(novoEnemy);

    const duracaoAcaoJogador = duracaoVisual(
      pastaSpriteJogador,
      estadoAcaoJogador,
    );

    const duracaoReacaoInimigo = inimigoLevouDano
      ? duracaoVisual(pastaSpriteInimigo, "hurt")
      : DURACAO_MOVIMENTO_MS;

    await espera(Math.max(duracaoAcaoJogador, duracaoReacaoInimigo));

    if (acabouNaVitoria) {
      setIsShieldActive(false);

      setPoseJogador({
        pose: undefined,
        fogo: false,
      });

      setAnimJogador("anim-vitoria");

      setAnimInimigo("anim-derrota");

      // Fica avançado ao lado do inimigo derrotado em vez de voltar pra
      // posição de origem — reforça a leitura de "golpe final", e o
      // remount do componente na próxima luta (key em page.tsx) já reseta
      // a posição sozinho.
      return;
    }

    setPoseJogador({
      pose: undefined,
      fogo: false,
    });

    setAnimJogador("idle");

    // Volta caminhando pra posição de origem antes do contra-ataque do
    // inimigo (só quando de fato avançou — cura nunca avançou).
    if (!usouCura) {
      setAvancoJogador(false);
      await espera(DURACAO_CAMINHADA_MS);
    }

    // Agora é o inimigo que anda até o jogador pra golpear.
    setAvancoInimigo(true);
    await espera(DURACAO_CAMINHADA_MS);

    setAnimInimigo("anim-atacando-esquerda");

    await espera(INTERVALO_ENTRE_FASES_MS);

    if (usouCura) {
      triggerFloatingText("player", "🛡️ IMUNE!", "#00ffff");

      setAnimJogador("anim-esquivando-esquerda");
    } else {
      setAnimJogador(
        jogadorLevouDano ? "anim-atingido" : "anim-esquivando-esquerda",
      );
    }

    if (variacaoVidaJogador > 0) {
      triggerFloatingText(
        "player",

        `+${variacaoVidaJogador} CURA`,

        "#44ff44",
      );
    } else if (variacaoVidaJogador < 0 && !usouCura) {
      triggerFloatingText(
        "player",

        `-${Math.abs(variacaoVidaJogador)}`,

        "#ff3333",
      );
    }

    // Mesma lógica do inimigo: a vida do jogador só é commitada quando o
    // golpe (ou a cura) chega visualmente.
    setVidaAtual(novaVidaJogador);

    const duracaoAtaqueInimigo = duracaoVisual(pastaSpriteInimigo, "attack");

    const duracaoReacaoJogador = jogadorLevouDano
      ? duracaoVisual(pastaSpriteJogador, "hurt")
      : DURACAO_MOVIMENTO_MS;

    await espera(Math.max(duracaoAtaqueInimigo, duracaoReacaoJogador));

    setIsShieldActive(false);

    setAnimInimigo("idle");

    setAnimJogador(acabouNaDerrota ? "anim-derrota" : "idle");

    // Espelha a decisão da vitória: se o jogador caiu, o inimigo fica
    // parado avançado (golpe final) em vez de voltar pra posição de
    // origem.
    if (!acabouNaDerrota) {
      setAvancoInimigo(false);
      await espera(DURACAO_CAMINHADA_MS);
    }
  }

  async function executarAcao(
    action:
      | {
          type: "attack";
        }
      | {
          type: "power";
          powerId: number;
        }
      | {
          type: "item";
          itemId: number;
        },
  ) {
    if (carregando || resultado) {
      return;
    }

    setCarregando(true);

    const poderUsado =
      action.type === "power"
        ? abilities.find((habilidade) => habilidade.Power.id === action.powerId)
            ?.Power
        : null;

    const itemUsado =
      action.type === "item"
        ? consumiveis.find((consumivel) => consumivel.id_item === action.itemId)
        : null;

    const usouCura = Boolean(
      (poderUsado &&
        (poderUsado.cura_base > 0 ||
          poderUsado.nome.toLowerCase().includes("cura"))) ||
      (itemUsado && itemUsado.efeito_vida),
    );

    const usouPoder = action.type === "power";

    const usouPoderDeFogo = Boolean(
      poderUsado && poderUsado.nome.toLowerCase().includes("fogo"),
    );

    try {
      const response = await axiosInstance.post<RespostaCombate>(
        actionEndpoint,
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

      // setEnemy/setVidaAtual NÃO são commitados aqui — ficam pra
      // tocarAnimacaoDoTurno, disparados no instante em que o golpe chega
      // visualmente (ver comentário lá). O resto do personagem (mana,
      // nível, XP, pontos) não afeta as barras da arena em si, então
      // segue commitado imediatamente como antes.
      setManaAtual(data.character.mana_atual);

      setNivelAtual(data.character.nivel);

      setExperienciaAtual(data.character.experiencia);

      setPontosDistribuir(data.character.pontos_distribuir);

      atualizarCharacter({
        vida_atual: data.character.vida_atual,
        mana_atual: data.character.mana_atual,
        nivel: data.character.nivel,
        experiencia: data.character.experiencia,
        pontos_distribuir: data.character.pontos_distribuir,
      });

      // A requisição só chega até aqui se o servidor de fato aceitou e
      // consumiu o item (ver combatController.js) — decremento otimista
      // em vez de recarregar o inventário inteiro de novo.
      if (action.type === "item") {
        setConsumiveis((atual) =>
          atual.map((consumivel) =>
            consumivel.id_item === action.itemId
              ? {
                  ...consumivel,
                  quantidade: Math.max(0, consumivel.quantidade - 1),
                }
              : consumivel,
          ),
        );
      }

      await tocarAnimacaoDoTurno({
        inimigoLevouDano,
        jogadorLevouDano,

        acabouNaVitoria,
        acabouNaDerrota,

        danoInimigo,
        variacaoVidaJogador,

        usouCura,
        usouPoder,
        usouPoderDeFogo,

        novoEnemy: data.enemy,
        novaVidaJogador: data.character.vida_atual,
      });

      if (data.done) {
        setResultado(data.victory ? "vitoria" : "derrota");

        if (data.rewards) {
          setRecompensa(data.rewards);
        }
        setDrop(data.drop ?? null);
      }
    } catch (error: unknown) {
      const mensagem =
        (
          error as {
            response?: {
              data?: {
                message?: string;
              };
            };
          }
        )?.response?.data?.message ?? "Erro ao processar o combate.";

      // O servidor não reconhece mais este combate (ex.: a tela ficou
      // com um inimigo desatualizado por algum motivo) — sem uma saída
      // daqui, os botões de ação continuavam vivos na tela, mas todo
      // clique só empilhava esse mesmo erro no log pra sempre, sem
      // nenhum jeito de continuar jogando a não ser recarregar a página
      // manualmente. Busca uma luta nova sozinho em vez de deixar o
      // jogador preso.
      if (mensagem.includes("Nenhum combate ativo")) {
        setLog((atual) => [
          ...atual,
          "Esse combate não é mais válido — buscando um novo desafio...",
        ]);
        router.refresh();
        return;
      }

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
            box-shadow:
              0 0 25px rgba(0, 255, 255, 0.8),
              inset 0 0 15px rgba(0, 255, 255, 0.5);
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

      <div className="relative rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        <button
          type="button"
          onClick={() => setMostrarLog(true)}
          aria-label="Ver registro de combate"
          title="Registro de combate"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#F3B43F]/60 bg-black/40 font-imFeel text-base text-[#F3B43F] transition hover:bg-black/60"
        >
          i
        </button>

        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">
          {tituloZona}
        </p>

        <div className="flex flex-wrap items-end justify-between gap-3 pr-10">
          <h1 className="font-imFeel text-4xl sm:text-5xl">{tituloArena}</h1>

          <p className="text-sm text-white/70">
            XP: {experienciaAtual}
            {" / "}
            {experienciaNivel}
          </p>
        </div>

        <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/50">
          <div
            className="h-full bg-[#F3B43F]"
            style={{
              width: `${Math.min(
                100,
                (experienciaAtual / experienciaNivel) * 100,
              )}%`,
            }}
          />
        </div>
      </div>

      <div className="">
        <div
          className={`absolute inset-0 rounded-2xl bg-cover bg-center ${
            fundoZona ? "" : "bg-gradient-to-b from-[#3a2f24] to-[#1f1813]"
          }`}
          style={
            fundoZona ? { backgroundImage: `url(${fundoZona})` } : undefined
          }
        />
        <div className="absolute inset-0 rounded-2xl bg-black/35" />
        {/* Sugestão de "chão" — reforça a leitura de plataforma em que os
            dois lados caminham um em direção ao outro. */}

        <div className="relative z-10 flex w-full items-center justify-between gap-4">
          <div
            className={`relative flex flex-col items-center p-2 transition-transform duration-[420ms] ease-in-out ${
              avancoJogador
                ? "translate-x-[1000px] sm:translate-x-[120px]"
                : "translate-x-0"
            } ${
              isShieldActive ? "shield-active border border-cyan-400/50" : ""
            }`}
          >
            <div className="pointer-events-none absolute -top-12 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center">
              {floatingTextsPlayer.map((ft) => (
                <span
                  key={ft.id}
                  className="animate-float-up absolute whitespace-nowrap text-lg font-bold sm:text-xl"
                  style={{
                    color: ft.color,
                  }}
                >
                  {ft.text}
                </span>
              ))}
            </div>

            <PlayerSprite
              className={`battle-sprite h-28 w-28 sm:h-36 sm:w-36 ${
                animJogador !== "idle" ? animJogador : ""
              }`}
              animState={animJogador}
              poseOverride={poseJogador.pose}
              fireTint={poseJogador.fogo}
            />
          </div>

          <div
            className={`relative flex flex-col items-center p-2 transition-transform duration-[420ms] ease-in-out ${
              avancoInimigo
                ? "-translate-x-[1000px] sm:-translate-x-[120px]"
                : "translate-x-0"
            }`}
          >
            <div className="pointer-events-none absolute -top-12 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center">
              {floatingTextsEnemy.map((ft) => (
                <span
                  key={ft.id}
                  className="animate-float-up absolute whitespace-nowrap text-lg font-bold sm:text-xl"
                  style={{
                    color: ft.color,
                  }}
                >
                  {ft.text}
                </span>
              ))}
            </div>

            <EnemySprite
              className={`battle-sprite h-28 w-28 sm:h-36 sm:w-36 ${
                animInimigo !== "idle" ? animInimigo : ""
              }`}
              animState={animInimigo}
            />
          </div>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-green-900/20 bg-[#292018]/90 p-4 shadow-lg">
          <p className="mb-1 font-imFeel text-xl">
            {character.nome} (Nv. {nivelAtual}) (
            <span className="text-sm text-white/70">
              Pontos à distribuir: {pontosDistribuir}
            </span>
            )
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
          <p className="mb-1 font-imFeel text-xl">
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
        // sticky bottom-0: barra de ações fica fixa embaixo da tela
        // (estilo RPG normal) em vez de flutuar solta no meio do layout.
        <div className="sticky bottom-0 z-30 -mx-2 bg-gradient-to-t from-[#1a1410] via-[#1a1410]/95 to-transparent px-2 pb-2 pt-4 sm:-mx-4 sm:px-4">
          <CombatActionBar
            podeAgir={!resultado}
            ocupado={carregando}
            manaAtual={manaAtual}
            onAtaqueBasico={() => executarAcao({ type: "attack" })}
            poderes={abilities.map((habilidade) => ({
              id: habilidade.Power.id,
              nome: habilidade.Power.nome,
              imagem_url: habilidade.Power.imagem_url,
              custo_mana: habilidade.Power.custo_mana,
              descricao: habilidade.Power.descricao,
            }))}
            onUsarPoder={(powerId) => executarAcao({ type: "power", powerId })}
            consumiveis={consumiveis}
            onUsarConsumivel={(itemId) =>
              executarAcao({ type: "item", itemId })
            }
          />
        </div>
      )}

      {resultado && (
        <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-center text-white shadow-xl">
          <p className="mb-2 font-imFeel text-3xl">
            {resultado === "vitoria" ? "Vitória!" : "Derrota..."}
          </p>

          {recompensa && (
            <p className="mb-3">
              +{recompensa.experiencia} de experiência
              {" · +"}
              {recompensa.dinheiro} moedas
            </p>
          )}

          {drop && (
            <p className="mb-3 font-bold text-[#F3B43F]">
              {drop.tipo === "item" && drop.item
                ? `Você encontrou: ${drop.item.nome}!`
                : `+${drop.dinheiro} moedas extras encontradas!`}
            </p>
          )}

          <button
            onClick={() => {
              if (resultado === "vitoria") {
                if (onVitoria) onVitoria();
                else router.refresh();
              } else if (onDerrota) {
                onDerrota();
              } else {
                router.push("/dashboard");
              }
            }}
            className="rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black hover:bg-[#a5710f]"
          >
            {resultado === "vitoria" ? labelBotaoVitoria : "Voltar"}
          </button>
        </div>
      )}

      {mostrarLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setMostrarLog(false)}
        >
          <div
            className="flex max-h-[70vh] w-full max-w-lg flex-col rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-4 text-white shadow-2xl"
            onClick={(evento) => evento.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="font-imFeel text-xl text-[#F3B43F]">
                Registro de combate
              </p>
              <button
                type="button"
                onClick={() => setMostrarLog(false)}
                aria-label="Fechar registro de combate"
                className="rounded-full px-2 py-1 text-white/60 transition hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-1 flex-col-reverse overflow-y-auto rounded-xl bg-black/85 p-4 text-sm shadow-inner">
              <div>
                {log.map((linha, indice) => (
                  <p key={indice} className="mb-1">
                    {linha}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
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
      <div className="mb-1 flex justify-between text-xs font-bold">
        <span>{label}</span>

        <span>
          {atual} / {maxima}
        </span>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-black/20">
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
