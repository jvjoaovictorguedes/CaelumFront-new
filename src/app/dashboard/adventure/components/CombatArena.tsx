"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import axiosInstance from "@/utils/axiosIntance";
import { useCharacter } from "@/contexts/CharacterContext";
import { useMusic } from "@/contexts/MusicContext";
import { MUSIC_PRIORITY, sortearFaixaCombate } from "@/constants/music";
import CombatActionBar, {
  type ConsumivelAcao,
} from "@/components/combat/CombatActionBar";
import {
  StatusIconsRow,
  NOME_POR_STATUS,
  type StatusKey,
} from "@/components/combat/StatusEffectIcons";

import { spriteFolderForClass, spriteForClass } from "./sprites/spriteForClass";
import { resolveMediaUrl } from "@/utils/media-url";
import { bordaPorRaridade } from "@/components/equipment/BonecoDePapel";

import { spriteFolderForEnemy, spriteForEnemy } from "./sprites/spriteForEnemy";

import {
  getSpriteAnimationDurationMs,
  type EstadoSprite,
} from "./sprites/spriteSheets";

import { fundoDeBatalha } from "./battleBackgrounds";

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

// Mesma numeração romana de Maestria Regional usada no Bestiário
// (backend: numeralRomano em bestiaryConfig.js) — só pros níveis com
// bônus (II-V; Maestria I não concede bônus, só a descoberta em si).
const NUMERAL_ROMANO_MAESTRIA: Record<string, string> = { "2": "II", "3": "III", "4": "IV", "5": "V" };

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

  // Expansão Aventura Beta §29 — resolve o sprite por chave, nunca mais
  // por nome; null (monstro sem arte ainda) cai no EnemySprite genérico.
  sprite_key?: string | null;
  // Foto estática do monstro (Bestiário/Mapa) — serve de sprite de
  // combate quando ainda não existe sprite_key dedicado (arte animada
  // ainda não entregue), em vez de cair direto no boneco genérico.
  imagem_url?: string | null;

  // Caçadas §6.2 — badge "ALVO DE CAÇADA" quando este monstro é o alvo
  // fortalecido da Caçada Ativa do personagem (vida/dano já vêm com o
  // modificador aplicado pelo backend; aqui é só identificação visual).
  huntTarget?: boolean;
  huntDifficultyLabel?: string;
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
  zona?: { id: number; nome: string; imagem_url: string | null; battle_background_url?: string | null } | null;
  // Pra onde "← Retornar"/"Sair mesmo assim" navega e o que chama antes
  // (ver confirmarSaida) — default é o comportamento de sempre (encerra
  // a sessão de Área de Caça e volta pra Aventura). Um chamador fora da
  // Aventura (ex.: interrupção de monstro na Expedição, ver
  // ExpeditionClient.tsx) não tem sessão de caça nenhuma pra encerrar,
  // então passa `aoSairEndpoint={null}` e a rota de volta certa.
  aoSairEndpoint?: string | null;
  aoSairRota?: string;
}

interface FloatingText {
  id: number;
  text: string;
  color: string;
}

// Motor de Status/Cooldown (Especificação Consolidada Poder/Status/
// Cooldown/Balanceamento, §24/§37) — mesmo formato que o backend guarda
// em encontro_pve.statusEffects e devolve em toda resposta de turno.
interface StatusInstance {
  key: StatusKey;
  remainingTurns: number;
  stacks: number;
  potency: number;
}

// Hard controls (Evolução do Motor de Status §6) — enquanto ativos, o
// servidor consome a ação do jogador sozinho (nunca gasta mana/
// cooldown/item); o frontend só evita a chamada inútil desabilitando os
// botões, nunca decide isso por conta própria.
const CONTROLES_DUROS: StatusInstance["key"][] = ["FREEZE", "STUN"];

interface StatusEffectsState {
  player: StatusInstance[];
  enemy: StatusInstance[];
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
      // Vida/mana logo após a SUA ação (poder/item/ataque), antes do
      // contra-ataque do inimigo — ausente em respostas antigas
      // (compatibilidade), tratado como igual a vida_atual/mana_atual
      // nesse caso (ver uso em tocarAnimacaoDoTurno).
      vida_apos_sua_acao?: number;
      mana_apos_sua_acao?: number;
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

    // Espólios de encontro de ZONA (Modo Aventura) — sempre um array
    // (pode ter mais de um por vitória, ou nenhum); diferente de `drop`,
    // que é o pool genérico antigo e vem sempre null nesses encontros.
    espolios?: {
      id_item: number;
      nome: string;
      quantidade: number;
      imagem_url?: string | null;
      raridade?: string;
    }[];

    // Ausentes em respostas antigas (compatibilidade) — tratado como
    // vazio nesse caso, ver useState abaixo.
    statusEffects?: StatusEffectsState;
    cooldowns?: { player?: Record<string, number> };

    // Presente só na vitória que derrota o ÚLTIMO monstro que faltava
    // descobrir na área (Bestiário) — null em qualquer outra vitória.
    bestiarioCompletoAgora?: {
      zona: { id: number; nome: string | null };
      beneficiosPorNivel: Record<string, { xp: number; ouro: number; espolio: number }>;
    } | null;

    // Boss Global (§5.1) — presente só na vitória que faz o encontro
    // elegível bater o threshold secreto (nunca revelado aqui nem em
    // nenhum outro lugar do cliente); null em qualquer outra vitória.
    worldBoss?: {
      descoberto: boolean;
      event_id: number;
      nome: string | null;
      mensagem_descoberta: string | null;
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
  aoSairEndpoint = "/adventure/leave",
  aoSairRota = "/dashboard/adventure",
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

  // Sorteia uma das 4 faixas de combate só na primeira renderização
  // deste encontro (§ escolha do usuário: alternar aleatoriamente a
  // cada combate novo) — CombatArena só existe montado enquanto o
  // encontro está ativo, então um novo mount = um combate novo.
  const { requestMusic, releaseMusic } = useMusic();
  const [faixaCombate] = useState(sortearFaixaCombate);
  useEffect(() => {
    const ownerId = "combat-solo";
    requestMusic({ ownerId, track: faixaCombate, priority: MUSIC_PRIORITY.COMBAT });
    return () => releaseMusic(ownerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faixaCombate.key]);

  const vidaMaxima = character.vida_maxima ?? 30 + character.vitalidade * 6;

  const manaMaxima = character.mana_maxima ?? 20 + character.inteligencia * 5;

  const PlayerSprite = spriteForClass(character.Class?.nome);

  const pastaSpriteJogador = spriteFolderForClass(character.Class?.nome);

  const [vidaAtual, setVidaAtual] = useState(character.vida_atual);

  const [manaAtual, setManaAtual] = useState(character.mana_atual);

  // Motor de Status/Cooldown (§41/§42) — atualizado a cada resposta de
  // /combat/action; vazio até o primeiro turno (ou pra sempre, num
  // combate sem nenhum status/cooldown envolvido).
  const [statusEffects, setStatusEffects] = useState<StatusEffectsState>({ player: [], enemy: [] });
  // Hard control ativo no jogador — só pra evitar a chamada inútil
  // desabilitando os botões; quem decide de verdade que o turno foi
  // perdido é sempre o servidor (statusEffects vem da resposta dele).
  const statusControleDuro = statusEffects.player.find((s) => CONTROLES_DUROS.includes(s.key))?.key ?? null;

  const [cooldownsPorPoder, setCooldownsPorPoder] = useState<Record<number, number>>({});

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

  const [espolios, setEspolios] = useState<
    { id_item: number; nome: string; quantidade: number; imagem_url?: string | null; raridade?: string }[]
  >([]);

  const [worldBossDescoberto, setWorldBossDescoberto] = useState<
    RespostaCombate["data"]["worldBoss"]
  >(null);
  const [bestiarioCompletoAgora, setBestiarioCompletoAgora] = useState<
    RespostaCombate["data"]["bestiarioCompletoAgora"]
  >(null);

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
  // Efeito visual separado da cura de vida — poção de mana também deve
  // ficar parada no lugar em vez de avançar e atacar (ver comentário em
  // tocarAnimacaoDoTurno), mas com cor/borda próprias pra não parecer
  // que curou vida quando só recarregou mana.
  const [isManaGlowActive, setIsManaGlowActive] = useState(false);

  // Controlam a "caminhada" até a distância de combate corpo-a-corpo —
  // true desloca a coluna (via translateX no wrapper) em direção ao
  // centro da arena, false volta pra posição de origem. Não mexe no
  // sprite em si, só na div que o envolve.
  const [avancoJogador, setAvancoJogador] = useState(false);
  const [avancoInimigo, setAvancoInimigo] = useState(false);

  // Log de combate deixou de ficar sempre visível (poluía a tela) — agora
  // só abre como popup ao clicar no ícone "i".
  const [mostrarLog, setMostrarLog] = useState(false);

  // Aventura ocupa a tela inteira (sem o menu do dashboard) e, uma vez
  // dentro do combate, não dá pra sair clicando em outro lugar — só pelo
  // botão "Retornar", que avisa antes: a vida já tomada nesta luta fica
  // perdida (cada turno já persiste no personagem, ver combatController),
  // mas XP/moedas só são concedidos quando a luta termina de verdade.
  const [mostrarConfirmarSaida, setMostrarConfirmarSaida] = useState(false);
  const [saindoDaAventura, setSaindoDaAventura] = useState(false);

  // Encerra a sessão de caça no servidor (quando existe) antes de sair —
  // usado tanto pelo "Sair mesmo assim" (durante o combate) quanto pelo
  // "Sair para a página principal" da tela de vitória. Sem isso a sessão
  // continuava ativa no servidor e o jogador caía direto de novo no
  // mesmo monstro (já morto) ao voltar pra Aventura, em vez de ir pra
  // seleção de área — bug reportado tanto durante o combate quanto logo
  // depois de matar o monstro, quando o botão de vitória pulava direto
  // pro router.push sem chamar aoSairEndpoint.
  async function encerrarSessaoEIrPara(rota: string) {
    if (saindoDaAventura) return;
    setSaindoDaAventura(true);
    try {
      // Chamador fora da Aventura (aoSairEndpoint=null, ver
      // ExpeditionClient.tsx) não tem sessão nenhuma pra encerrar.
      if (aoSairEndpoint) {
        await axiosInstance.post(aoSairEndpoint);
      }
    } catch (error) {
      console.error("Erro ao sair da área de caça:", error);
    } finally {
      router.push(rota);
    }
  }

  async function confirmarSaida() {
    await encerrarSessaoEIrPara(aoSairRota);
  }

  const [floatingTextsPlayer, setFloatingTextsPlayer] = useState<
    FloatingText[]
  >([]);

  const [floatingTextsEnemy, setFloatingTextsEnemy] = useState<FloatingText[]>(
    [],
  );

  const experienciaNivel = Math.max(100, nivelAtual * 100);

  const EnemySprite = spriteForEnemy(enemy.sprite_key, enemy.nome);

  const pastaSpriteInimigo = spriteFolderForEnemy(enemy.sprite_key, enemy.nome);

  // Sem sprite animado dedicado (pastaSpriteInimigo null), usa a foto
  // estática do monstro como sprite de combate — só cai no boneco
  // genérico (EnemySprite) se nem isso existir ainda.
  const fotoInimigoCombate = !pastaSpriteInimigo ? resolveMediaUrl(enemy.imagem_url) : undefined;

  // battle_background_url é o fundo de ARENA (Expansão Aventura Beta
  // §31) — imagem_url continua sendo só card/mapa. Hoje ainda sempre
  // null pra toda área (nenhuma arte enviada ainda), então isso só entra
  // em uso assim que o Painel Administrativo de Mídia preencher o campo.
  const fundoZona = fundoDeBatalha({
    nomeMonstro: enemy.nome,
    nomeZona: zona?.nome,
    imagemUrlZona: zona?.battle_background_url ?? zona?.imagem_url,
  });

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

    acabouNaVitoria,
    acabouNaDerrota,

    danoInimigo,
    vidaAposAcaoJogador,

    usouCura,
    usouManaPotion,
    manaRecebida,
    usouPoder,
    usouPoderDeFogo,

    novoEnemy,
    novaVidaJogador,
  }: {
    inimigoLevouDano: boolean;

    acabouNaVitoria: boolean;
    acabouNaDerrota: boolean;

    danoInimigo: number;
    // Vida do jogador logo após A PRÓPRIA ação (cura de poder/item ou
    // nenhuma, se foi ataque), ainda sem o contra-ataque do inimigo —
    // ver combatController.js (vida_apos_sua_acao). Usado pra separar
    // visualmente "quanto eu curei" de "quanto o inimigo me tirou",
    // em vez de só mostrar o saldo líquido do turno inteiro.
    vidaAposAcaoJogador: number;

    usouCura: boolean;
    // Poção de mana também não avança pra golpear (é um efeito sobre si
    // mesmo, igual cura de vida), mas usa cor/texto próprios — nunca
    // deve parecer que curou vida quando só recarregou mana.
    usouManaPotion: boolean;
    manaRecebida: number;
    usouPoder: boolean;
    usouPoderDeFogo: boolean;

    novoEnemy: EnemyState;
    novaVidaJogador: number;
  }) {
    // Qualquer ação "sobre si mesmo" (cura ou mana) fica parada no
    // lugar — só ações que atingem o inimigo (ataque, poder ofensivo)
    // avançam até a distância de combate.
    const ficaParado = usouCura || usouManaPotion;

    // Cura de verdade (poder ou item) desse turno — independente do que
    // o inimigo faz em seguida. Antes disso, a cura só aparecia na tela
    // quando o SALDO do turno inteiro (cura menos o contra-ataque) desse
    // positivo — se o inimigo batesse mais forte que a cura, a poção
    // "sumia" da tela mesmo tendo funcionado (log dizia que curou, a
    // vida não subia visivelmente nunca).
    const curaRecebida = Math.max(0, vidaAposAcaoJogador - vidaAtual);
    // Dano real do contra-ataque do inimigo NESTE turno — não mais
    // inferido do saldo líquido (que confundia "esquivei" com "curei
    // mais do que apanhei"). "usouCura" nunca mais implica imunidade: o
    // servidor sempre deixa o inimigo contra-atacar depois de um
    // item/poder (só um ataque básico "gasta o turno" igual), então a
    // animação agora mostra o que de fato aconteceu.
    const danoRecebidoDoContraAtaque = Math.max(0, vidaAposAcaoJogador - novaVidaJogador);
    const jogadorLevouDano = danoRecebidoDoContraAtaque > 0;
    if (curaRecebida > 0) {
      // Borda ciano só de indicação visual de "acabou de se curar" —
      // NUNCA implica imunidade ao contra-ataque do inimigo, que
      // continua valendo normalmente (ver comentário mais abaixo sobre
      // jogadorLevouDano/danoRecebidoDoContraAtaque).
      setIsShieldActive(true);
      triggerFloatingText("player", `+${curaRecebida} CURA`, "#44ff44");
      // Sobe a vida na hora, na própria cura — sem isso a barra só
      // refletia o saldo do turno inteiro lá no final (depois do
      // contra-ataque), e uma cura real podia nunca aparecer visível
      // na tela quando o inimigo batia mais forte que ela em seguida.
      setVidaAtual(vidaAposAcaoJogador);
      await espera(400);
    }

    if (usouManaPotion && manaRecebida > 0) {
      // Mesma ideia da cura de vida acima, mas azul e com texto/valor
      // próprios — poção de mana não é cura, não pode parecer uma.
      setIsManaGlowActive(true);
      triggerFloatingText("player", `+${manaRecebida} MANA`, "#3fa9f5");
      await espera(400);
    }

    const estadoAcaoJogador: EstadoSprite = ficaParado
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

    // Cura/poção de mana ficam paradas no lugar (são efeitos sobre si
    // mesmo, não faz sentido andar até o inimigo pra isso) — qualquer
    // outra ação anda até a distância de combate antes de golpear.
    if (!ficaParado) {
      setAvancoJogador(true);
      await espera(DURACAO_CAMINHADA_MS);
    }

    setAnimJogador(ficaParado ? "idle" : "anim-atacando-direita");

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
      setIsManaGlowActive(false);

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
    // inimigo (só quando de fato avançou — cura/mana nunca avançam).
    if (!ficaParado) {
      setAvancoJogador(false);
      await espera(DURACAO_CAMINHADA_MS);
    }

    // Agora é o inimigo que anda até o jogador pra golpear.
    setAvancoInimigo(true);
    await espera(DURACAO_CAMINHADA_MS);

    setAnimInimigo("anim-atacando-esquerda");

    await espera(INTERVALO_ENTRE_FASES_MS);

    // Usar item/poder NUNCA torna o jogador imune ao contra-ataque —
    // o servidor sempre deixa o inimigo golpear depois (só o ataque
    // básico "usa o turno" de um jeito diferente), então a animação
    // reflete o que realmente aconteceu (esquivou de verdade ou
    // apanhou de verdade), nunca mais assume imunidade só por ter se
    // curado.
    setAnimJogador(
      jogadorLevouDano ? "anim-atingido" : "anim-esquivando-esquerda",
    );

    if (jogadorLevouDano) {
      triggerFloatingText("player", `-${danoRecebidoDoContraAtaque}`, "#ff3333");
    }

    // Vida final do turno (depois do contra-ataque, se houve) — a cura
    // já foi mostrada e aplicada antes, no início desta função.
    setVidaAtual(novaVidaJogador);

    const duracaoAtaqueInimigo = duracaoVisual(pastaSpriteInimigo, "attack");

    const duracaoReacaoJogador = jogadorLevouDano
      ? duracaoVisual(pastaSpriteJogador, "hurt")
      : DURACAO_MOVIMENTO_MS;

    await espera(Math.max(duracaoAtaqueInimigo, duracaoReacaoJogador));

    setIsShieldActive(false);
    setIsManaGlowActive(false);

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

    // Poção de mana pura (sem efeito de vida) — nunca deve avançar e
    // atacar como um golpe: é um efeito sobre si mesmo, igual cura.
    const usouManaPotion = Boolean(itemUsado && itemUsado.efeito_mana && !itemUsado.efeito_vida);
    const manaAntesDaAcao = manaAtual;

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

      const inimigoLevouDano = danoInimigo > 0;

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

      setStatusEffects(data.statusEffects ?? { player: [], enemy: [] });
      const cooldownsBrutos = data.cooldowns?.player ?? {};
      const cooldownsMapeados: Record<number, number> = {};
      for (const [chave, turnos] of Object.entries(cooldownsBrutos)) {
        // Chave vem como "power:<id>" (ver cooldownService.js).
        const id = Number(chave.split(":")[1]);
        if (!Number.isNaN(id)) cooldownsMapeados[id] = turnos;
      }
      setCooldownsPorPoder(cooldownsMapeados);

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

        acabouNaVitoria,
        acabouNaDerrota,

        danoInimigo,
        // Ausente em respostas antigas (compatibilidade) — sem contra-
        // ataque separado pra mostrar, cai direto pro valor final.
        vidaAposAcaoJogador: data.character.vida_apos_sua_acao ?? data.character.vida_atual,

        usouCura,
        usouManaPotion,
        manaRecebida: Math.max(0, data.character.mana_atual - manaAntesDaAcao),
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
        setEspolios(data.espolios ?? []);
        setBestiarioCompletoAgora(data.bestiarioCompletoAgora ?? null);
        setWorldBossDescoberto(data.worldBoss?.descoberto ? data.worldBoss : null);
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
    <div className="fixed inset-0 z-[70] overflow-hidden bg-[#1a1410]">
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

      {/* O fundo cobre a tela inteira — a arena não é mais um box
          centralizado, ela É a tela toda, do jeito que um RPG de turnos
          moderno faz (cada aliado, quando existir mais de um jogador,
          vai ocupar seu próprio ponto nessa mesma área cheia). */}
      <div
        className={`absolute inset-0 bg-cover bg-center ${
          fundoZona ? "" : "bg-gradient-to-b from-[#3a2f24] to-[#1f1813]"
        }`}
        style={fundoZona ? { backgroundImage: `url(${fundoZona})` } : undefined}
      />
      <div className="absolute inset-0 bg-black/30" />

      {/* Barra superior flutuando sobre o fundo — some com XP e o botão
          de sair, mas não interrompe a leitura da tela como campo de
          batalha único. */}
      {/* pr-14/pr-16 reserva o espaço do FloatingMusicWidget (fixed
          right-3/4 top-3/4, z-[200]) — sem isso o botão "i" de registro
          de combate ficava embaixo do ícone de volume, impossível de
          clicar. */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 pr-14 sm:p-4 sm:pr-16">
        {!resultado ? (
          <button
            type="button"
            onClick={() => setMostrarConfirmarSaida(true)}
            className="rounded-full border-2 border-[#F3B43F]/60 bg-black/50 px-3 py-1 font-imFeel text-sm text-[#F3B43F] shadow transition hover:bg-black/70"
          >
            ← Retornar
          </button>
        ) : (
          <span />
        )}

        <div className="flex flex-col items-center text-center text-white drop-shadow-lg">
          <p className="text-[10px] uppercase tracking-widest text-[#F3B43F] sm:text-xs">
            {tituloZona}
          </p>
          <h1 className="font-imFeel text-2xl leading-tight sm:text-3xl">
            {tituloArena}
          </h1>
          <div className="mt-1 h-1.5 w-36 overflow-hidden rounded-full bg-black/50 sm:w-52">
            <div
              className="h-full bg-[#F3B43F]"
              style={{
                width: `${Math.min(100, (experienciaAtual / experienciaNivel) * 100)}%`,
              }}
            />
          </div>
          <p className="mt-0.5 text-[10px] text-white/70">
            XP: {experienciaAtual} / {experienciaNivel}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMostrarLog(true)}
          aria-label="Ver registro de combate"
          title="Registro de combate"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-[#F3B43F]/60 bg-black/50 font-imFeel text-base text-[#F3B43F] shadow transition hover:bg-black/70"
        >
          i
        </button>
      </div>

      {/* Campo de batalha: cada combatente fica no seu ponto na tela
          inteira. Hoje só jogador x inimigo, mas essa mesma faixa é
          onde cada aliado vai aparecer (em cima/do lado) quando o modo
          em grupo existir — nenhum combatente depende de um box menor
          pra caber. */}
      <div className="absolute inset-0 z-10 flex items-center justify-between px-[8%] sm:px-[14%]">
        <div
          className={`relative flex flex-col items-center transition-transform duration-[420ms] ease-in-out ${
            avancoJogador ? "translate-x-[30vw]" : "translate-x-0"
          } ${isShieldActive ? "shield-active border border-cyan-400/50" : ""} ${
            isManaGlowActive ? "shield-active border border-blue-400/50" : ""
          }`}
        >
          <div className="pointer-events-none absolute -top-20 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center">
            {floatingTextsPlayer.map((ft) => (
              <span
                key={ft.id}
                className="animate-float-up absolute whitespace-nowrap text-lg font-bold sm:text-2xl"
                style={{ color: ft.color }}
              >
                {ft.text}
              </span>
            ))}
          </div>

          <BarraSobreCabeca
            nome={`${character.nome} (Nv. ${nivelAtual})`}
            vidaAtual={vidaAtual}
            vidaMaxima={vidaMaxima}
            manaAtual={manaAtual}
            manaMaxima={manaMaxima}
          />
          <div className="pointer-events-none absolute -top-5 left-1/2 z-10 flex -translate-x-1/2 gap-1">
            <StatusIconsRow instancias={statusEffects.player} />
          </div>

          <PlayerSprite
            className={`battle-sprite h-32 w-32 sm:h-48 sm:w-48 ${
              animJogador !== "idle" ? animJogador : ""
            }`}
            animState={animJogador}
            poseOverride={poseJogador.pose}
            fireTint={poseJogador.fogo}
          />
        </div>

        <div
          className={`relative flex flex-col items-center transition-transform duration-[420ms] ease-in-out ${
            avancoInimigo ? "-translate-x-[30vw]" : "translate-x-0"
          }`}
        >
          <div className="pointer-events-none absolute -top-20 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center">
            {floatingTextsEnemy.map((ft) => (
              <span
                key={ft.id}
                className="animate-float-up absolute whitespace-nowrap text-lg font-bold sm:text-2xl"
                style={{ color: ft.color }}
              >
                {ft.text}
              </span>
            ))}
          </div>

          {enemy.huntTarget && (
            <span className="mb-1 rounded-full border border-red-500 bg-red-900/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-200 shadow">
              Alvo de Caçada{enemy.huntDifficultyLabel ? ` · ${enemy.huntDifficultyLabel}` : ""}
            </span>
          )}
          <BarraSobreCabeca
            nome={`${enemy.nome} (Nv. ${enemy.nivel})`}
            vidaAtual={enemy.vida_atual}
            vidaMaxima={enemy.vida_maxima}
          />
          <div className="pointer-events-none absolute -top-5 left-1/2 z-10 flex -translate-x-1/2 gap-1">
            <StatusIconsRow instancias={statusEffects.enemy} />
          </div>

          {fotoInimigoCombate ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fotoInimigoCombate}
              alt={enemy.nome}
              className={`battle-sprite h-32 w-32 rounded-lg object-contain sm:h-48 sm:w-48 ${
                animInimigo !== "idle" ? animInimigo : ""
              }`}
            />
          ) : (
            <EnemySprite
              className={`battle-sprite h-32 w-32 sm:h-48 sm:w-48 ${
                animInimigo !== "idle" ? animInimigo : ""
              }`}
              animState={animInimigo}
            />
          )}
        </div>
      </div>

      {pontosDistribuir > 0 && (
        <p className="absolute left-1/2 top-24 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/50 px-3 py-1 text-xs text-[#F3B43F] shadow sm:top-28">
          Pontos à distribuir: {pontosDistribuir}
        </p>
      )}

      {!resultado && (
        <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-3 pb-3 pt-10 sm:px-6">
          {statusControleDuro && (
            <p className="mb-2 text-center text-xs font-bold text-[#F3B43F]">
              Você está {NOME_POR_STATUS[statusControleDuro]} — sua ação será perdida neste turno.
            </p>
          )}
          {!statusControleDuro && statusEffects.player.some((s) => s.key === "PARALYZE") && (
            <p className="mb-2 text-center text-xs text-[#F3B43F]/80">
              Você está Paralisado — há chance de perder a ação neste turno.
            </p>
          )}
          <CombatActionBar
            podeAgir={!resultado && !statusControleDuro}
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
            cooldownsPorPoder={cooldownsPorPoder}
          />
        </div>
      )}

      {resultado && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-6 text-center text-white shadow-2xl">
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

            {espolios.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
                {espolios.map((espolio, indice) => {
                  const imagem = resolveMediaUrl(espolio.imagem_url);
                  return (
                    <div
                      key={`${espolio.id_item}-${indice}`}
                      title={`${espolio.nome} x${espolio.quantidade}`}
                      className={`flex items-center gap-2 rounded-lg border-2 bg-black/30 px-2 py-1 ${bordaPorRaridade(espolio.raridade)}`}
                    >
                      {imagem ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imagem}
                          alt={espolio.nome}
                          className="h-8 w-8 object-contain transition-transform duration-150 hover:scale-125"
                        />
                      ) : (
                        <span className="text-lg" aria-hidden="true">
                          📦
                        </span>
                      )}
                      <span className="text-xs font-bold text-white">
                        {espolio.nome} <span className="text-[#F3B43F]">x{espolio.quantidade}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {worldBossDescoberto && (
              <div className="mb-4 rounded-xl border-2 border-red-500/70 bg-black/40 p-3 text-left">
                <p className="mb-1 text-center font-imFeel text-xl text-red-400">
                  ⚠ Ameaça Mundial descoberta! ⚠
                </p>
                <p className="text-center text-sm font-bold text-white">{worldBossDescoberto.nome}</p>
                {worldBossDescoberto.mensagem_descoberta && (
                  <p className="mt-2 text-center text-xs italic text-white/70">
                    {worldBossDescoberto.mensagem_descoberta}
                  </p>
                )}
                <p className="mt-2 text-center text-xs text-red-300">
                  Foi você quem a encontrou! Acompanhe a Guilda dos Aventureiros — ela despertará
                  em instantes.
                </p>
              </div>
            )}

            {bestiarioCompletoAgora && (
              <div className="mb-4 rounded-xl border border-[#F3B43F]/60 bg-black/30 p-3 text-left">
                <p className="mb-1 text-center font-imFeel text-lg text-[#F3B43F]">
                  Bestiário completo: {bestiarioCompletoAgora.zona.nome}!
                </p>
                <p className="mb-2 text-center text-xs text-white/70">
                  Você descobriu todos os monstros desta área — a Maestria Regional começa
                  agora. Continue caçando aqui pra desbloquear os bônus de cada nível:
                </p>
                <ul className="flex flex-col gap-1 text-xs text-white/80">
                  {Object.entries(bestiarioCompletoAgora.beneficiosPorNivel)
                    .filter(([nivel]) => Number(nivel) >= 2)
                    .map(([nivel, beneficio]) => (
                      <li key={nivel} className="flex justify-between gap-2">
                        <span className="font-bold text-[#F3B43F]">Maestria {NUMERAL_ROMANO_MAESTRIA[nivel] ?? nivel}</span>
                        <span>
                          +{Math.round(beneficio.xp * 100)}% XP · +{Math.round(beneficio.ouro * 100)}% Ouro · +
                          {Math.round(beneficio.espolio * 100)}% Espólio
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => {
                  if (resultado === "vitoria") {
                    if (onVitoria) onVitoria();
                    else router.refresh();
                  } else if (onDerrota) {
                    onDerrota();
                  } else {
                    // Mesmo bug do botão de vitória (ver encerrarSessaoEIrPara
                    // acima): sem encerrar a sessão no servidor, a próxima
                    // vez que o jogador entrasse em Aventura caía direto no
                    // mesmo encontro (já derrotado) em vez da seleção de zona.
                    encerrarSessaoEIrPara("/dashboard");
                  }
                }}
                className="rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black hover:bg-[#a5710f]"
              >
                {resultado === "vitoria" ? labelBotaoVitoria : "Voltar"}
              </button>

              {resultado === "vitoria" && (
                <button
                  onClick={() => encerrarSessaoEIrPara("/dashboard")}
                  disabled={saindoDaAventura}
                  className="rounded-lg border border-white/30 px-4 py-2 font-bold text-white/80 transition hover:bg-white/10 disabled:opacity-50"
                >
                  Sair para a página principal
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {mostrarConfirmarSaida && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setMostrarConfirmarSaida(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl"
            onClick={(evento) => evento.stopPropagation()}
          >
            <p className="mb-2 font-imFeel text-xl text-[#F3B43F]">
              Sair da Aventura?
            </p>

            <p className="mb-4 text-sm text-white/80">
              Você ainda está em combate. Se sair agora, o dano que você já
              tomou nesta luta é mantido — você não vai receber a experiência
              nem as moedas desta batalha, já que ela não foi concluída.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMostrarConfirmarSaida(false)}
                className="rounded-lg border border-white/30 px-4 py-2 font-bold text-white/80 transition hover:bg-white/10"
              >
                Continuar lutando
              </button>

              <button
                type="button"
                disabled={saindoDaAventura}
                onClick={confirmarSaida}
                className="rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black hover:bg-[#a5710f] disabled:opacity-60"
              >
                {saindoDaAventura ? "Saindo..." : "Sair mesmo assim"}
              </button>
            </div>
          </div>
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

// Nome + vida (e mana, quando informada) flutuando acima da cabeça da
// unidade, dentro da própria arena — em vez de um card de status
// separado embaixo da cena. Vale tanto pro jogador quanto pro inimigo
// hoje, e é a mesma peça que vai renderizar cada aliado quando o modo
// em grupo existir (várias unidades, cada uma com sua barra em cima).
function BarraSobreCabeca({
  nome,
  vidaAtual,
  vidaMaxima,
  manaAtual,
  manaMaxima,
}: {
  nome: string;
  vidaAtual: number;
  vidaMaxima: number;
  manaAtual?: number;
  manaMaxima?: number;
}) {
  const percentVida = Math.max(0, Math.min(100, (vidaAtual / vidaMaxima) * 100));

  const percentMana =
    manaMaxima && manaMaxima > 0
      ? Math.max(0, Math.min(100, ((manaAtual ?? 0) / manaMaxima) * 100))
      : null;

  return (
    <div className="pointer-events-none absolute -top-10 left-1/2 z-10 flex w-max -translate-x-1/2 flex-col items-center gap-0.5">
      <span className="whitespace-nowrap rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white shadow sm:text-xs">
        {nome}
      </span>

      <div className="h-1.5 w-20 overflow-hidden rounded-full border border-black/50 bg-black/60 sm:w-24">
        <div
          className="h-full bg-red-600 transition-[width] duration-300"
          style={{ width: `${percentVida}%` }}
        />
      </div>
      <span className="whitespace-nowrap text-[8px] font-bold text-red-300 sm:text-[9px]">
        {Math.max(0, Math.round(vidaAtual))}/{vidaMaxima}
      </span>

      {percentMana !== null && (
        <>
          <div className="h-1 w-20 overflow-hidden rounded-full border border-black/50 bg-black/60 sm:w-24">
            <div
              className="h-full bg-blue-500 transition-[width] duration-300"
              style={{ width: `${percentMana}%` }}
            />
          </div>
          <span className="whitespace-nowrap text-[8px] font-bold text-blue-300 sm:text-[9px]">
            {Math.max(0, Math.round(manaAtual ?? 0))}/{manaMaxima}
          </span>
        </>
      )}
    </div>
  );
}

