"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import axiosInstance from "@/utils/axiosIntance";

export interface LutadorDuelo {
  id: number;
  nome: string;
  genero: string;
  classe?: string;
  chave: "A" | "B";
}

export interface PoderDuelo {
  id: number;
  nome: string;
  imagem_url?: string | null;
  custo_mana: number;
  dano_base: number;
  cura_base: number;
  escala_atributo?: string;
  valor_escala?: number;
}

export interface ConsumivelDuelo {
  id_item: number;
  nome: string;
  imagem_url?: string | null;
  quantidade: number;
  efeito_vida?: number;
  efeito_mana?: number;
}

export interface DueloIniciadoPayload {
  duelId: number;
  arena: string;
  ranked?: boolean;
  // Partida de torneio: é um duelo ao vivo como qualquer outro (mesma
  // tela), só marcado pra a UI saber que faz parte de uma série. O
  // backend manda um objeto (nunca `true`) — {serieId, round, formato}.
  torneio?: { serieId: number; round: string; formato: string } | boolean;
  ratingA?: number;
  ratingB?: number;
  ligaA?: string;
  ligaB?: string;
  a: LutadorDuelo;
  b: LutadorDuelo;
  vidaMaxA: number;
  vidaMaxB: number;
  manaMaxA: number;
  manaMaxB: number;
  vidaA: number;
  vidaB: number;
  manaA: number;
  manaB: number;
  poderesA: PoderDuelo[];
  poderesB: PoderDuelo[];
  consumiveisA: ConsumivelDuelo[];
  consumiveisB: ConsumivelDuelo[];
  turnoDe: "A" | "B";
  prazoSegundos: number;
}

// Arena Ranqueada (PvP Competitivo v1) — eventos próprios do socket, além
// dos "pvp:*" já existentes (que continuam servindo o Duelo casual sem
// nenhuma mudança de comportamento).
export interface RankedQueueUpdatePayload {
  emFila: boolean;
  tempoNaFilaMs?: number;
}

export interface RankedMatchFoundPayload {
  duelId: number;
  a: { id: number; nome: string; rating: number };
  b: { id: number; nome: string; rating: number };
}

export interface ResumoTierPayload {
  rating: number;
  tier: string;
  divisao: string | null;
  tierLabel: string;
  tierAsset: string;
}

/**
 * Sempre sobre o DESAFIANTE (eu) — o defensor é controlado por IA e nunca
 * tem rating alterado (PvP v2 §8), então o backend não manda um par
 * jogadorA/jogadorB como na v1: é sempre "antes → depois" do meu lado.
 */
export interface RankedRatingUpdatePayload {
  duelId: number;
  ratingAntes: number;
  ratingDepois: number;
  delta: number;
  tierAntes: ResumoTierPayload;
  tierDepois: ResumoTierPayload;
  defensorControladoPorIA: boolean;
  ratingDefensorInalterado: number;
}

export interface RankedOponenteDesconectadoPayload {
  characterId: number;
  prazoSegundos: number;
}

// Motor de Status (mesmo formato de src/config/statusEffectConfig.js no
// backend) — `stacks` só é > 1 pra BLEED/POISON (STACK_CAP), o resto
// fica sempre em 1.
export interface StatusInstanceDuelo {
  key: "BURN" | "BLEED" | "POISON" | "SILENCE" | "WEAKEN" | "FREEZE" | "STUN" | "PARALYZE" | "BLIND";
  remainingTurns: number;
  stacks: number;
}

export interface TurnoResultadoPayload {
  duelId: number;
  atacante: "A" | "B";
  nomeAcao: string;
  dano: number;
  cura: number;
  manaCurada?: number;
  esquivou: boolean;
  // Precisão/Crítico (Velocidade) — ausente em respostas antigas
  // (compatibilidade), tratado como false nesse caso.
  critico?: boolean;
  bloqueado?: boolean;
  logStatus?: string[];
  statusA?: StatusInstanceDuelo[];
  statusB?: StatusInstanceDuelo[];
  vidaA: number;
  vidaB: number;
  manaA: number;
  manaB: number;
  turnoDe: "A" | "B" | null;
  prazoSegundos?: number;
}

export interface DueloFimPayload {
  duelId: number;
  vencedorChave: "A" | "B" | null;
  vencedor: { id: number; nome: string } | null;
  perdedor: { id: number; nome: string } | null;
  // Ranked não concede recompensa de Duelo casual nem nível — só rating
  // (ver ranked:rating:update). "FalhaServidor"/"Abandono" só existem
  // pra partidas ranked; casual continua só com "combate"/"desistencia".
  recompensa?: { dinheiro: number; experiencia: number };
  nivelAposVitoria?: number;
  motivo: "combate" | "desistencia" | "Vitoria" | "Abandono" | "FalhaServidor";
  ranked?: boolean;
}

// Torneio — atualização ao vivo de uma série (ready-check e placar),
// recebida depois de "torneio:entrar-sala". O REST (GET /pvp/tournaments/:id)
// não traz quem já confirmou presença — só o socket sabe.
export interface TorneioSerieAtualizadaPayload {
  serieId: number;
  status?: string;
  placar?: { a?: number; b?: number };
  formato?: string;
  prazoReadyCheckSegundos?: number;
  readyA?: boolean;
  readyB?: boolean;
  vencedorSerie?: number | null;
}

interface DesafioRecebido {
  idDesafiante: number;
  nomeDesafiante: string;
  prazoSegundos: number;
  recebidoEm: number;
}

// Aventura em grupo (party) — convite reaproveita a MESMA conexão/
// presença online do Duelo ao vivo (ver comentário no topo de
// partySocket.js sobre não precisar de "identificar" próprio).
export interface MembroGrupo {
  id: number;
  nome: string;
  classe: string | null;
  pronto: boolean;
}

export interface GrupoAtualizadoPayload {
  partyId: number;
  hostId: string;
  membros: MembroGrupo[];
}

interface ConvitePartyRecebido {
  idConvidante: number;
  nomeConvidante: string;
  partyId: number;
  membros: MembroGrupo[];
  prazoSegundos: number;
  recebidoEm: number;
}

export interface PoderGrupo {
  id: number;
  nome: string;
  imagem_url?: string | null;
  custo_mana: number;
  dano_base: number;
  cura_base: number;
  escala_atributo?: string;
  valor_escala?: number;
}

export interface ConsumivelGrupo {
  id_item: number;
  nome: string;
  imagem_url?: string | null;
  quantidade: number;
  efeito_vida?: number;
  efeito_mana?: number;
}

export interface AliadoBatalhaGrupo {
  id: number;
  nome: string;
  genero: string;
  classe?: string;
  vidaMax: number;
  manaMax: number;
  vida: number;
  mana: number;
  poderes: PoderGrupo[];
  consumiveis: ConsumivelGrupo[];
}

export interface BatalhaGrupoIniciadaPayload {
  battleId: number;
  zona: { id: number; nome: string };
  inimigo: {
    nome: string;
    nivel: number;
    vida_atual: number;
    vida_maxima: number;
    // Expansão Aventura Beta §29/§39 — Party resolve sprite igual ao
    // combate solo, por sprite_key (null = EnemySprite genérico).
    sprite_key?: string | null;
    // Foto estática do monstro — sprite de combate quando ainda não
    // existe sprite_key dedicado (mesmo critério do combate solo).
    imagem_url?: string | null;
  };
  membros: AliadoBatalhaGrupo[];
  ordem: string[];
  turnoDe: string;
  rodada: number;
  prazoSegundos: number;
  // Pedido do jogador — aviso de power-leveling: presente (não-null)
  // quando a diferença de nível DENTRO do grupo (maior - menor) é grande
  // demais, e por isso a recompensa de XP/ouro do grupo INTEIRO vai sair
  // reduzida nesta aventura.
  penalidadeDiferencaNivel?: { multiplicador: number; diferencaNivel: number } | null;
}

export interface TurnoGrupoPayload {
  battleId: number;
  origem: "aliado" | "monstro";
  idAtor?: string;
  idAlvo?: number;
  nomeAcao: string;
  dano: number;
  cura?: number;
  manaCurada?: number;
  esquivou: boolean;
  // Precisão/Crítico (Velocidade) — ausente em respostas antigas
  // (compatibilidade), tratado como false nesse caso.
  critico?: boolean;
  // Motor de Status (mesmo formato do Duelo ao vivo/PvP assíncrono) —
  // agora também na Aventura em Grupo: monstro pode causar status
  // configurado no admin, DoT tica no fim do turno de quem tá com ele
  // (nunca na hora do golpe que aplicou), e hard control pode bloquear a
  // ação de quem estiver agindo (aliado OU monstro).
  bloqueado?: boolean;
  logStatus?: string[];
  statusInimigo?: StatusInstanceDuelo[];
  statusAliados?: Record<string, StatusInstanceDuelo[]>;
  vidaInimigo?: number;
  vidaAliado?: number;
  manaAliado?: number;
  rodada: number;
}

export interface ProximoTurnoGrupoPayload {
  battleId: number;
  turnoDe: string;
  prazoSegundos: number;
  rodada: number;
}

export interface BatalhaGrupoFimPayload {
  battleId: number;
  vitoria: boolean;
  motivo: string;
  recompensas: Record<string, { experiencia: number; dinheiro: number; nivel: number; pontos_distribuir: number }>;
  drops: Record<string, { tipo: "item" | "ouro"; item?: { id: number; nome: string; raridade: string }; dinheiro?: number }>;
  penalidadeDiferencaNivel?: { multiplicador: number; diferencaNivel: number } | null;
}

// Boss da Guilda V2.0 (batalha em tempo real) — mesmo modelo de payload
// da Aventura em grupo acima, só trocando "inimigo"/"zona" por "chefe"
// e sem consumíveis (o boss da guilda não aceita ação tipo "item").
// Sem sala de espera (pedido do jogador: "entrar tipo aventura") —
// "guildboss:entrar" já entrega o personagem dentro da luta.
export interface AliadoBossGuilda {
  id: number;
  nome: string;
  genero: string;
  classe?: string;
  vidaMax: number;
  manaMax: number;
  vida: number;
  mana: number;
  poderes: PoderGrupo[];
}

// Mesmo formato tanto pra "batalha-iniciada" (acabou de abrir, só com
// quem entrou primeiro) quanto pra "estado" (reconexão/resync, ou
// entrando numa luta já em andamento) — nunca duas formas diferentes
// de descrever a mesma luta. `turnoDe` null = fase "chefe" (telegraph
// ou resolução do contra-ataque em andamento, ninguém pode agir).
export interface BatalhaBossGuildaIniciadaPayload {
  battleId: number;
  nomeChefe: string;
  vidaAtual: number;
  vidaTotal: number;
  membros: AliadoBossGuilda[];
  ordem: string[];
  turnoDe: string | null;
  fase?: "aliados" | "chefe";
  rodada: number;
  prazoSegundos: number;
}

export interface MembroEntrouBossGuildaPayload {
  battleId: number;
  membro: AliadoBossGuilda;
  ordem: string[];
}

// Telegraph do turno do chefe (ver executarTurnoChefe no backend) —
// SEMPRE emitido antes do contra-ataque resolver, mesmo sem nenhuma
// habilidade (nomePoder/imagemUrl null nesse caso): é o "ritmo de
// turno" pedido igual à Ameaça Mundial, nunca resolve instantâneo.
export interface CastStartBossGuildaPayload {
  battleId: number;
  nomePoder: string | null;
  imagemUrl: string | null;
  tempoConjuracaoMs: number;
  rodada: number;
}

export interface TurnoBossGuildaPayload {
  battleId: number;
  origem: "aliado" | "chefe";
  idAtor?: string;
  idAlvo?: number;
  nomeAcao: string;
  dano: number;
  cura?: number;
  manaCurada?: number;
  esquivou: boolean;
  // Precisão/Crítico (Velocidade) — ausente em respostas antigas
  // (compatibilidade), tratado como false nesse caso.
  critico?: boolean;
  vidaChefe?: number;
  vidaAliado?: number;
  manaAliado?: number;
  rodada: number;
  // Cooldowns ATUAIS do ator (só em origem "aliado") — formato
  // "power:<id>" -> turnos restantes, mesmo cooldownService.js do Boss
  // Mundial (ver WorldBossCooldownsApi em lib/api/worldBoss.ts).
  cooldowns?: Record<string, number>;
}

export interface ProximoTurnoBossGuildaPayload {
  battleId: number;
  turnoDe: string;
  prazoSegundos: number;
  rodada: number;
}

export interface RecompensasBossGuilda {
  xpGuilda: number;
  subiuNivel: boolean;
  niveisGanhos: number;
  participantes: { idPersonagem: number; dinheiro: number; xp: number; nivel?: number }[];
  premioMaiorDano: { idPersonagem: number; ouro: number } | null;
}

export interface BatalhaBossGuildaFimPayload {
  battleId: number;
  vitoria: boolean;
  motivo: string;
  vidaChefe: number;
  recompensas: RecompensasBossGuilda | null;
}

interface PvpSocketContextValue {
  conectado: boolean;
  onlineIds: Set<number>;
  desafioRecebido: DesafioRecebido | null;
  desafioEnviadoPara: number | null;
  erro: string;
  duelo: DueloIniciadoPayload | null;
  turnos: TurnoResultadoPayload[];
  resultadoFinal: DueloFimPayload | null;
  desafiar: (idDesafiado: number) => void;
  responderDesafio: (aceitar: boolean) => void;
  agir: (tipo: "attack" | "power" | "item", id?: number) => void;
  limparDuelo: () => void;
  limparErro: () => void;
  // Arena Ranqueada
  filaRanked: RankedQueueUpdatePayload | null;
  matchEncontradoRanked: RankedMatchFoundPayload | null;
  ratingUpdate: RankedRatingUpdatePayload | null;
  oponenteDesconectadoRanked: RankedOponenteDesconectadoPayload | null;
  // Torneio — ready-check ao vivo
  serieTorneio: TorneioSerieAtualizadaPayload | null;
  entrarSalaTorneio: (serieId: number) => void;
  confirmarProntoTorneio: (serieId: number) => void;
  // Aventura em grupo (party)
  grupoAtual: GrupoAtualizadoPayload | null;
  convitePartyRecebido: ConvitePartyRecebido | null;
  convitePartyEnviadoPara: number | null;
  erroParty: string;
  batalhaGrupo: BatalhaGrupoIniciadaPayload | null;
  turnosGrupo: TurnoGrupoPayload[];
  turnoAtualGrupo: string | null;
  rodadaAtualGrupo: number;
  resultadoGrupo: BatalhaGrupoFimPayload | null;
  criarGrupo: () => void;
  listarJogadoresOnline: () => Promise<{ id: number; nome: string }[]>;
  convidarParaGrupo: (idConvidado: number) => void;
  responderConvitePartyFn: (aceitar: boolean) => void;
  marcarPronto: (pronto: boolean) => void;
  sairDoGrupo: () => void;
  expulsarDoGrupo: (idAlvo: number) => void;
  iniciarAventuraEmGrupo: (idZona: number) => void;
  agirGrupo: (tipo: "attack" | "power" | "item", id?: number) => void;
  limparBatalhaGrupo: () => void;
  limparErroParty: () => void;
  // Boss da Guilda V2.0 (batalha em tempo real) — sem sala de espera,
  // "entrarNoBossGuilda" já entrega dentro da luta (ver comentário em
  // BatalhaBossGuildaIniciadaPayload).
  erroBossGuilda: string;
  batalhaBossGuilda: BatalhaBossGuildaIniciadaPayload | null;
  turnosBossGuilda: TurnoBossGuildaPayload[];
  turnoAtualBossGuilda: string | null;
  rodadaAtualBossGuilda: number;
  castBossGuilda: CastStartBossGuildaPayload | null;
  resultadoBossGuilda: BatalhaBossGuildaFimPayload | null;
  entrarNoBossGuilda: () => void;
  sairDoBossGuilda: () => void;
  agirBossGuilda: (tipo: "attack" | "power", idPoder?: number) => void;
  limparBatalhaBossGuilda: () => void;
  limparErroBossGuilda: () => void;
}

const PvpSocketContext = createContext<PvpSocketContextValue | null>(null);

function socketUrlFromApiUrl(apiUrl: string) {
  return apiUrl.replace(/\/api\/?$/, "");
}

export function PvpSocketProvider({
  characterId,
  children,
}: {
  characterId?: number;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  const [conectado, setConectado] = useState(false);
  const [onlineIds, setOnlineIds] = useState<Set<number>>(new Set());
  const [desafioRecebido, setDesafioRecebido] = useState<DesafioRecebido | null>(null);
  const [desafioEnviadoPara, setDesafioEnviadoPara] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [duelo, setDuelo] = useState<DueloIniciadoPayload | null>(null);
  const [turnos, setTurnos] = useState<TurnoResultadoPayload[]>([]);
  const [resultadoFinal, setResultadoFinal] = useState<DueloFimPayload | null>(null);
  const [filaRanked, setFilaRanked] = useState<RankedQueueUpdatePayload | null>(null);
  const [matchEncontradoRanked, setMatchEncontradoRanked] = useState<RankedMatchFoundPayload | null>(null);
  const [ratingUpdate, setRatingUpdate] = useState<RankedRatingUpdatePayload | null>(null);
  const [oponenteDesconectadoRanked, setOponenteDesconectadoRanked] =
    useState<RankedOponenteDesconectadoPayload | null>(null);
  const [serieTorneio, setSerieTorneio] = useState<TorneioSerieAtualizadaPayload | null>(null);
  const [grupoAtual, setGrupoAtual] = useState<GrupoAtualizadoPayload | null>(null);
  const [convitePartyRecebido, setConvitePartyRecebido] = useState<ConvitePartyRecebido | null>(null);
  const [convitePartyEnviadoPara, setConvitePartyEnviadoPara] = useState<number | null>(null);
  const [erroParty, setErroParty] = useState("");
  const [batalhaGrupo, setBatalhaGrupo] = useState<BatalhaGrupoIniciadaPayload | null>(null);
  const [turnosGrupo, setTurnosGrupo] = useState<TurnoGrupoPayload[]>([]);
  const [turnoAtualGrupo, setTurnoAtualGrupo] = useState<string | null>(null);
  const [rodadaAtualGrupo, setRodadaAtualGrupo] = useState(1);
  const [resultadoGrupo, setResultadoGrupo] = useState<BatalhaGrupoFimPayload | null>(null);
  const [erroBossGuilda, setErroBossGuilda] = useState("");
  const [batalhaBossGuilda, setBatalhaBossGuilda] = useState<BatalhaBossGuildaIniciadaPayload | null>(null);
  const [turnosBossGuilda, setTurnosBossGuilda] = useState<TurnoBossGuildaPayload[]>([]);
  const [turnoAtualBossGuilda, setTurnoAtualBossGuilda] = useState<string | null>(null);
  const [rodadaAtualBossGuilda, setRodadaAtualBossGuilda] = useState(1);
  const [castBossGuilda, setCastBossGuilda] = useState<CastStartBossGuildaPayload | null>(null);
  const [resultadoBossGuilda, setResultadoBossGuilda] = useState<BatalhaBossGuildaFimPayload | null>(null);

  useEffect(() => {
    if (!characterId) return;

    const baseUrl = socketUrlFromApiUrl(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
    );
    const socket = io(baseUrl, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConectado(true);
      // O JWT é httpOnly (o browser não tem acesso), então o socket não
      // consegue mandar um Bearer no identificar — busca um ticket de
      // curtíssima duração via HTTP (que passa pelo proxy same-origin e
      // carrega o cookie) e manda ele, nunca o characterId cru.
      axiosInstance
        .get<{ data?: { ticket?: string } }>("/users/socket-ticket")
        .then((resp) => {
          const ticket = resp.data?.data?.ticket;
          if (!ticket) return;
          // Callback de ack: o handler de "identificar" é assíncrono no
          // servidor, então emitir os resyncs abaixo sem esperar essa
          // confirmação corria o risco de chegar ANTES do servidor setar
          // socket.characterId (resync silenciosamente ignorado). Só
          // depois do ack é garantido que o personagem já está
          // identificado pra qualquer evento seguinte.
          socket.emit("identificar", { ticket }, () => {
            socket.emit("pvp:listar-online", {}, (resposta: { online?: string[] }) => {
              setOnlineIds(new Set((resposta?.online ?? []).map(Number)));
            });
            // Resync após F5/reconexão (bug reportado): se o personagem já
            // estava numa batalha em grupo em andamento, o servidor
            // reenvia o estado ATUAL — sem isso a tela nunca repovoava
            // sozinha, só o processo do servidor continuava rodando a
            // luta.
            socket.emit("party:entrar-batalha");
          });
        })
        .catch(() => {
          setErro("Não foi possível autenticar a conexão em tempo real.");
        });
    });

    socket.on("disconnect", () => setConectado(false));

    socket.on("pvp:ficou-online", ({ characterId: id }: { characterId: string }) => {
      setOnlineIds((atual) => new Set(atual).add(Number(id)));
    });

    socket.on("pvp:ficou-offline", ({ characterId: id }: { characterId: string }) => {
      setOnlineIds((atual) => {
        const novo = new Set(atual);
        novo.delete(Number(id));
        return novo;
      });
    });

    socket.on(
      "pvp:desafio-recebido",
      (payload: { idDesafiante: number; nomeDesafiante: string; prazoSegundos: number }) => {
        setDesafioRecebido({ ...payload, recebidoEm: Date.now() });
      },
    );

    socket.on("pvp:desafio-enviado", ({ idDesafiado }: { idDesafiado: number }) => {
      setDesafioEnviadoPara(idDesafiado);
    });

    socket.on("pvp:desafio-recusado", () => {
      setDesafioEnviadoPara(null);
      setErro("O jogador recusou seu desafio.");
    });

    socket.on("pvp:desafio-expirado", () => {
      setDesafioEnviadoPara(null);
      setErro("O jogador não respondeu a tempo.");
    });

    socket.on("pvp:desafio-cancelado", () => {
      setDesafioRecebido(null);
    });

    socket.on("pvp:duelo-iniciado", (payload: DueloIniciadoPayload) => {
      setDesafioRecebido(null);
      setDesafioEnviadoPara(null);
      setResultadoFinal(null);
      setTurnos([]);
      setDuelo(payload);
      // Bug real: uma mensagem de erro de ANTES desse duelo começar
      // (desafio recusado, ação rejeitada do duelo anterior...) ficava
      // presa em `erro` e continuava aparecendo em cima da tela de
      // combate já ativa e saudável, porque nada aqui limpava esse
      // estado — LiveDuelArena só lê `erro`, não sabe se é antigo.
      setErro("");
      router.push("/dashboard/pvp");
    });

    socket.on("pvp:turno-resultado", (payload: TurnoResultadoPayload) => {
      setTurnos((atual) => [...atual, payload]);
    });

    socket.on("pvp:duelo-fim", (payload: DueloFimPayload) => {
      setResultadoFinal(payload);
    });

    socket.on("pvp:erro", ({ mensagem }: { mensagem: string }) => {
      setErro(mensagem);
    });

    // Arena Ranqueada — reaproveita "pvp:duelo-iniciado"'s equivalente
    // (ranked:match:start), com o MESMO shape de payload, então o duelo
    // vira o mesmo estado `duelo` que LiveDuelArena já sabe renderizar.
    socket.on("ranked:queue:update", (payload: RankedQueueUpdatePayload) => {
      setFilaRanked(payload);
    });

    socket.on("ranked:match:found", (payload: RankedMatchFoundPayload) => {
      setMatchEncontradoRanked(payload);
    });

    socket.on("ranked:match:start", (payload: DueloIniciadoPayload) => {
      setDesafioRecebido(null);
      setDesafioEnviadoPara(null);
      setResultadoFinal(null);
      setRatingUpdate(null);
      setOponenteDesconectadoRanked(null);
      setFilaRanked(null);
      setTurnos([]);
      setDuelo(payload);
      setErro(""); // mesmo motivo do handler pvp:duelo-iniciado acima.
      router.push("/dashboard/pvp");
    });

    // Torneio — cada jogo de uma série (MD3/MD5) é um duelo ao vivo
    // normal emitido pelo MESMO evento "pvp:duelo-iniciado" (tratado
    // acima), só com `payload.torneio = {serieId, round, formato}`. Não
    // existe um evento "torneio:duelo-iniciado" separado no backend.
    //
    // Ready-check da série: entra na sala com "torneio:entrar-sala" e
    // ouve as atualizações — é o único jeito de saber quem já confirmou
    // presença (o REST não expõe readyA/readyB).
    socket.on("torneio:serie:atualizada", (payload: TorneioSerieAtualizadaPayload) => {
      setSerieTorneio(payload);
    });

    socket.on("torneio:serie:placar", (payload: TorneioSerieAtualizadaPayload) => {
      setSerieTorneio((atual) =>
        atual && atual.serieId === payload.serieId ? { ...atual, ...payload } : payload,
      );
    });

    socket.on("torneio:erro", ({ mensagem }: { mensagem: string }) => {
      setErro(mensagem);
    });

    socket.on("ranked:rating:update", (payload: RankedRatingUpdatePayload) => {
      setRatingUpdate(payload);
    });

    socket.on("ranked:oponente-desconectado", (payload: RankedOponenteDesconectadoPayload) => {
      setOponenteDesconectadoRanked(payload);
    });

    socket.on("ranked:oponente-reconectado", () => {
      setOponenteDesconectadoRanked(null);
    });

    // Aventura em grupo (party)
    socket.on("party:convite-recebido", (payload: Omit<ConvitePartyRecebido, "recebidoEm">) => {
      setConvitePartyRecebido({ ...payload, recebidoEm: Date.now() });
    });

    socket.on("party:convite-enviado", ({ idConvidado }: { idConvidado: number }) => {
      setConvitePartyEnviadoPara(idConvidado);
    });

    socket.on("party:convite-recusado", () => {
      setConvitePartyEnviadoPara(null);
      setErroParty("O jogador recusou o convite.");
    });

    socket.on("party:convite-expirado", () => {
      setConvitePartyEnviadoPara(null);
      setErroParty("O jogador não respondeu a tempo.");
    });

    socket.on("party:convite-cancelado", () => {
      setConvitePartyRecebido(null);
    });

    socket.on("party:grupo-atualizado", (payload: GrupoAtualizadoPayload) => {
      setConvitePartyRecebido(null);
      setConvitePartyEnviadoPara(null);
      setGrupoAtual(payload);
    });

    socket.on("party:grupo-desfeito", () => {
      setGrupoAtual(null);
    });

    socket.on("party:expulso", () => {
      setGrupoAtual(null);
      setErroParty("Você foi removido do grupo pelo anfitrião.");
    });

    socket.on("party:batalha-iniciada", (payload: BatalhaGrupoIniciadaPayload) => {
      setGrupoAtual(null);
      setResultadoGrupo(null);
      setTurnosGrupo([]);
      setBatalhaGrupo(payload);
      setTurnoAtualGrupo(payload.turnoDe);
      setRodadaAtualGrupo(payload.rodada);
      router.push("/dashboard/adventure");
    });

    // Resync após F5/reconexão (bug reportado: a tela de batalha em
    // grupo nunca repovoava sozinha, só o INÍCIO da luta disparava
    // "party:batalha-iniciada") — MESMO formato de payload (ver
    // montarPayloadBatalha no backend), com os valores ATUAIS da luta.
    socket.on("party:batalha-estado", (payload: BatalhaGrupoIniciadaPayload) => {
      setResultadoGrupo(null);
      setTurnosGrupo([]);
      setBatalhaGrupo(payload);
      setTurnoAtualGrupo(payload.turnoDe);
      setRodadaAtualGrupo(payload.rodada);
      router.push("/dashboard/adventure");
    });

    socket.on("party:turno-resultado", (payload: TurnoGrupoPayload) => {
      setTurnosGrupo((atual) => [...atual, payload]);
    });

    socket.on("party:proximo-turno", (payload: ProximoTurnoGrupoPayload) => {
      setTurnoAtualGrupo(payload.turnoDe);
      setRodadaAtualGrupo(payload.rodada);
    });

    socket.on("party:batalha-fim", (payload: BatalhaGrupoFimPayload) => {
      setResultadoGrupo(payload);
    });

    socket.on("party:erro", ({ mensagem }: { mensagem: string }) => {
      setErroParty(mensagem);
    });

    // Boss da Guilda V2.0 (batalha em tempo real) — sem sala de espera,
    // "entrar" já devolve direto dentro da luta (ver comentário em
    // BatalhaBossGuildaIniciadaPayload).
    socket.on("guildboss:batalha-iniciada", (payload: BatalhaBossGuildaIniciadaPayload) => {
      setResultadoBossGuilda(null);
      setTurnosBossGuilda([]);
      setCastBossGuilda(null);
      setBatalhaBossGuilda(payload);
      setTurnoAtualBossGuilda(payload.turnoDe);
      setRodadaAtualBossGuilda(payload.rodada);
    });

    // Reconexão/F5/segunda aba OU entrando numa luta já em andamento —
    // MESMO formato de "batalha-iniciada" (ver montarEstadoBatalha no
    // backend), nunca um shape próprio.
    socket.on("guildboss:estado", (payload: BatalhaBossGuildaIniciadaPayload) => {
      setResultadoBossGuilda(null);
      setTurnosBossGuilda([]);
      setCastBossGuilda(null);
      setBatalhaBossGuilda(payload);
      setTurnoAtualBossGuilda(payload.turnoDe);
      setRodadaAtualBossGuilda(payload.rodada);
    });

    // Outro membro da guilda entrou no meio da luta — soma na lista de
    // aliados em vez de substituir o estado inteiro.
    socket.on("guildboss:membro-entrou", (payload: MembroEntrouBossGuildaPayload) => {
      setBatalhaBossGuilda((atual) => {
        if (!atual || atual.battleId !== payload.battleId) return atual;
        if (atual.membros.some((m) => m.id === payload.membro.id)) return atual;
        return { ...atual, membros: [...atual.membros, payload.membro], ordem: payload.ordem };
      });
    });

    socket.on("guildboss:turno-resultado", (payload: TurnoBossGuildaPayload) => {
      setTurnosBossGuilda((atual) => [...atual, payload]);
      setCastBossGuilda(null);
    });

    socket.on("guildboss:proximo-turno", (payload: ProximoTurnoBossGuildaPayload) => {
      setTurnoAtualBossGuilda(payload.turnoDe);
      setRodadaAtualBossGuilda(payload.rodada);
    });

    // Telegraph do contra-ataque do chefe (ver executarTurnoChefe no
    // backend) — SEMPRE chega antes do "turno-resultado" de origem
    // "chefe", mesmo sem nenhuma habilidade (ritmo de turno igual à
    // Ameaça Mundial).
    socket.on("guildboss:cast-start", (payload: CastStartBossGuildaPayload) => {
      setCastBossGuilda(payload);
    });

    socket.on("guildboss:batalha-fim", (payload: BatalhaBossGuildaFimPayload) => {
      setResultadoBossGuilda(payload);
      setCastBossGuilda(null);
    });

    socket.on("guildboss:erro", ({ mensagem }: { mensagem: string }) => {
      setErroBossGuilda(mensagem);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId]);

  const desafiar = useCallback((idDesafiado: number) => {
    socketRef.current?.emit("pvp:desafiar", { idDesafiado });
  }, []);

  const responderDesafio = useCallback((aceitar: boolean) => {
    socketRef.current?.emit("pvp:responder-desafio", { aceitar });
    if (!aceitar) setDesafioRecebido(null);
  }, []);

  const agir = useCallback((tipo: "attack" | "power" | "item", id?: number) => {
    socketRef.current?.emit("pvp:acao", {
      tipo,
      idPoder: tipo === "power" ? id : undefined,
      idItem: tipo === "item" ? id : undefined,
    });
  }, []);

  const limparDuelo = useCallback(() => {
    setDuelo(null);
    setTurnos([]);
    setResultadoFinal(null);
    setRatingUpdate(null);
    setOponenteDesconectadoRanked(null);
  }, []);

  const entrarSalaTorneio = useCallback((serieId: number) => {
    socketRef.current?.emit("torneio:entrar-sala", { serieId });
  }, []);

  const confirmarProntoTorneio = useCallback((serieId: number) => {
    socketRef.current?.emit("torneio:pronto", { serieId });
  }, []);

  const limparErro = useCallback(() => setErro(""), []);

  const criarGrupo = useCallback(() => {
    socketRef.current?.emit("party:criar");
  }, []);

  const listarJogadoresOnline = useCallback((): Promise<{ id: number; nome: string }[]> => {
    return new Promise((resolve) => {
      const socket = socketRef.current;
      if (!socket) {
        resolve([]);
        return;
      }
      socket.emit(
        "party:listar-online",
        {},
        (resposta: { jogadores?: { id: number; nome: string }[] }) => {
          resolve(resposta?.jogadores ?? []);
        },
      );
    });
  }, []);

  const convidarParaGrupo = useCallback((idConvidado: number) => {
    socketRef.current?.emit("party:convidar", { idConvidado });
  }, []);

  const responderConvitePartyFn = useCallback(
    (aceitar: boolean) => {
      socketRef.current?.emit("party:responder-convite", { aceitar });
      if (!aceitar) {
        setConvitePartyRecebido(null);
        return;
      }
      // O convidado pode estar em qualquer tela do dashboard quando aceita
      // — sem isso, ele ficava parado onde estava, sem ver o lobby do
      // grupo que acabou de entrar.
      router.push("/dashboard/adventure");
    },
    [router],
  );

  const marcarPronto = useCallback((pronto: boolean) => {
    socketRef.current?.emit("party:pronto", { pronto });
  }, []);

  const sairDoGrupo = useCallback(() => {
    socketRef.current?.emit("party:sair");
    setGrupoAtual(null);
  }, []);

  const expulsarDoGrupo = useCallback((idAlvo: number) => {
    socketRef.current?.emit("party:expulsar", { idAlvo });
  }, []);

  const iniciarAventuraEmGrupo = useCallback((idZona: number) => {
    socketRef.current?.emit("party:iniciar", { idZona });
  }, []);

  const agirGrupo = useCallback((tipo: "attack" | "power" | "item", id?: number) => {
    socketRef.current?.emit("party:acao", {
      tipo,
      idPoder: tipo === "power" ? id : undefined,
      idItem: tipo === "item" ? id : undefined,
    });
  }, []);

  const limparBatalhaGrupo = useCallback(() => {
    setBatalhaGrupo(null);
    setTurnosGrupo([]);
    setTurnoAtualGrupo(null);
    setResultadoGrupo(null);
  }, []);

  const limparErroParty = useCallback(() => setErroParty(""), []);

  const entrarNoBossGuilda = useCallback(() => {
    socketRef.current?.emit("guildboss:entrar");
  }, []);

  const sairDoBossGuilda = useCallback(() => {
    socketRef.current?.emit("guildboss:sair");
  }, []);

  const agirBossGuilda = useCallback((tipo: "attack" | "power", idPoder?: number) => {
    socketRef.current?.emit("guildboss:acao", { tipo, idPoder: tipo === "power" ? idPoder : undefined });
  }, []);

  const limparBatalhaBossGuilda = useCallback(() => {
    setBatalhaBossGuilda(null);
    setTurnosBossGuilda([]);
    setTurnoAtualBossGuilda(null);
    setCastBossGuilda(null);
    setResultadoBossGuilda(null);
  }, []);

  const limparErroBossGuilda = useCallback(() => setErroBossGuilda(""), []);

  return (
    <PvpSocketContext.Provider
      value={{
        conectado,
        onlineIds,
        desafioRecebido,
        desafioEnviadoPara,
        erro,
        duelo,
        turnos,
        resultadoFinal,
        desafiar,
        responderDesafio,
        agir,
        limparDuelo,
        limparErro,
        filaRanked,
        matchEncontradoRanked,
        ratingUpdate,
        oponenteDesconectadoRanked,
        serieTorneio,
        entrarSalaTorneio,
        confirmarProntoTorneio,
        grupoAtual,
        convitePartyRecebido,
        convitePartyEnviadoPara,
        erroParty,
        batalhaGrupo,
        turnosGrupo,
        turnoAtualGrupo,
        rodadaAtualGrupo,
        resultadoGrupo,
        convidarParaGrupo,
        responderConvitePartyFn,
        criarGrupo,
        listarJogadoresOnline,
        marcarPronto,
        sairDoGrupo,
        expulsarDoGrupo,
        iniciarAventuraEmGrupo,
        agirGrupo,
        limparBatalhaGrupo,
        limparErroParty,
        erroBossGuilda,
        batalhaBossGuilda,
        turnosBossGuilda,
        turnoAtualBossGuilda,
        rodadaAtualBossGuilda,
        castBossGuilda,
        resultadoBossGuilda,
        entrarNoBossGuilda,
        sairDoBossGuilda,
        agirBossGuilda,
        limparBatalhaBossGuilda,
        limparErroBossGuilda,
      }}
    >
      {children}
      {desafioRecebido && (
        <DesafioModal
          desafio={desafioRecebido}
          onResponder={responderDesafio}
        />
      )}
      {convitePartyRecebido && (
        <ConvitePartyModal
          convite={convitePartyRecebido}
          onResponder={responderConvitePartyFn}
        />
      )}
    </PvpSocketContext.Provider>
  );
}

function ConvitePartyModal({
  convite,
  onResponder,
}: {
  convite: ConvitePartyRecebido;
  onResponder: (aceitar: boolean) => void;
}) {
  const [restante, setRestante] = useState(convite.prazoSegundos);

  useEffect(() => {
    const intervalo = setInterval(() => {
      const passado = (Date.now() - convite.recebidoEm) / 1000;
      setRestante(Math.max(0, Math.ceil(convite.prazoSegundos - passado)));
    }, 250);
    return () => clearInterval(intervalo);
  }, [convite]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-6 text-center text-white shadow-2xl">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">
          Convite pra Aventura em grupo
        </p>
        <h2 className="mb-1 font-imFeel text-2xl">{convite.nomeConvidante}</h2>
        <p className="mb-2 text-sm text-white/70">te chamou pra um grupo!</p>
        {convite.membros.length > 1 && (
          <p className="mb-3 text-xs text-white/50">
            Grupo: {convite.membros.map((m) => m.nome).join(", ")}
          </p>
        )}
        <p className="mb-4 text-3xl font-bold text-[#F3B43F]">{restante}s</p>
        <div className="flex gap-3">
          <button
            onClick={() => onResponder(false)}
            className="flex-1 rounded-lg border-2 border-white/30 bg-transparent px-3 py-2 font-bold text-white hover:bg-white/10"
          >
            Recusar
          </button>
          <button
            onClick={() => onResponder(true)}
            className="flex-1 rounded-lg bg-[#BC8418] px-3 py-2 font-bold text-black hover:bg-[#a5710f]"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}

function DesafioModal({
  desafio,
  onResponder,
}: {
  desafio: DesafioRecebido;
  onResponder: (aceitar: boolean) => void;
}) {
  const [restante, setRestante] = useState(desafio.prazoSegundos);

  useEffect(() => {
    const intervalo = setInterval(() => {
      const passado = (Date.now() - desafio.recebidoEm) / 1000;
      setRestante(Math.max(0, Math.ceil(desafio.prazoSegundos - passado)));
    }, 250);
    return () => clearInterval(intervalo);
  }, [desafio]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-6 text-center text-white shadow-2xl">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">
          Desafio de duelo ao vivo
        </p>
        <h2 className="font-imFeel text-2xl mb-1">{desafio.nomeDesafiante}</h2>
        <p className="mb-4 text-sm text-white/70">te desafiou pra um duelo!</p>
        <p className="mb-4 text-3xl font-bold text-[#F3B43F]">{restante}s</p>
        <div className="flex gap-3">
          <button
            onClick={() => onResponder(false)}
            className="flex-1 rounded-lg border-2 border-white/30 bg-transparent px-3 py-2 font-bold text-white hover:bg-white/10"
          >
            Recusar
          </button>
          <button
            onClick={() => onResponder(true)}
            className="flex-1 rounded-lg bg-[#BC8418] px-3 py-2 font-bold text-black hover:bg-[#a5710f]"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}

export function usePvpSocket() {
  const ctx = useContext(PvpSocketContext);
  if (!ctx) {
    throw new Error("usePvpSocket precisa ser usado dentro de PvpSocketProvider");
  }
  return ctx;
}
