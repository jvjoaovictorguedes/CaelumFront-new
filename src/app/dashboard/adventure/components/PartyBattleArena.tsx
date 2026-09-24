"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { usePvpSocket, type TurnoGrupoPayload } from "@/contexts/PvpSocketContext";
import { useCharacter } from "@/contexts/CharacterContext";
import { useMusic } from "@/contexts/MusicContext";
import { MUSIC_PRIORITY, sortearFaixaCombate } from "@/constants/music";
import CombatActionBar from "@/components/combat/CombatActionBar";
import { spriteForClass, spriteFolderForClass } from "./sprites/spriteForClass";
import { spriteForEnemy, spriteFolderForEnemy } from "./sprites/spriteForEnemy";
import { getSpriteAnimationDurationMs, type EstadoSprite } from "./sprites/spriteSheets";
import { fundoDeBatalha } from "./battleBackgrounds";
import { resolveMediaUrl } from "@/utils/media-url";

interface FloatingText {
  id: number;
  text: string;
  color: string;
}

type EstadoAnimacao =
  | "idle"
  | "anim-atacando-direita"
  | "anim-atacando-esquerda"
  | "anim-atingido"
  | "anim-esquivando-direita"
  | "anim-esquivando-esquerda";

const DURACAO_MOVIMENTO_MS = 500;
const DURACAO_CAMINHADA_MS = 420;

function espera(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function duracaoVisual(pasta: string | null, estado: EstadoSprite, minimo = DURACAO_MOVIMENTO_MS) {
  if (!pasta) return minimo;
  return Math.max(minimo, getSpriteAnimationDurationMs(pasta, estado));
}

// Batalha em grupo (N aliados vs 1 monstro escalado) — a MESMA ideia de
// campo de batalha em tela cheia da Aventura solo (fundo cobrindo a
// tela inteira, nome+vida flutuando acima da cabeça de cada um), só que
// generalizada pra N combatentes em vez de 2. Fica montada globalmente
// (ver DashboardLayout) e só renderiza algo quando o servidor manda
// "party:batalha-iniciada" — não depende de qual página o navegador
// está tecnicamente em cima.
export default function PartyBattleArena() {
  const router = useRouter();
  const { character } = useCharacter();
  const {
    batalhaGrupo,
    turnosGrupo,
    turnoAtualGrupo,
    rodadaAtualGrupo,
    resultadoGrupo,
    agirGrupo,
    limparBatalhaGrupo,
  } = usePvpSocket();

  // Sorteia uma das 4 faixas de combate a cada BATALHA nova (não só no
  // mount do componente — diferente de CombatArena.tsx/combate solo,
  // este componente continua montado entre uma batalha em grupo e
  // outra, só alternando o que renderiza; battleId muda a cada
  // batalha nova, então é o gatilho certo).
  const { requestMusic, releaseMusic } = useMusic();
  useEffect(() => {
    if (!batalhaGrupo) return undefined;
    const ownerId = "combat-grupo";
    requestMusic({ ownerId, track: sortearFaixaCombate(), priority: MUSIC_PRIORITY.COMBAT });
    return () => releaseMusic(ownerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batalhaGrupo?.battleId]);

  const [vidaInimigo, setVidaInimigo] = useState(0);
  const [vidaMaxInimigo, setVidaMaxInimigo] = useState(1);
  const [vidasAliados, setVidasAliados] = useState<Record<number, number>>({});
  const [manasAliados, setManasAliados] = useState<Record<number, number>>({});
  const [floatingInimigo, setFloatingInimigo] = useState<FloatingText[]>([]);
  const [floatingAliados, setFloatingAliados] = useState<Record<number, FloatingText[]>>({});

  // Animação: cada aliado tem seu próprio estado de sprite + se está
  // "avançado" (caminhando até o monstro pra golpear) — igual ao motor
  // de CombatArena.tsx, só generalizado pra um Record por id em vez de
  // uma única variável de jogador.
  const [animAliados, setAnimAliados] = useState<Record<number, EstadoAnimacao>>({});
  const [avancoAliados, setAvancoAliados] = useState<Record<number, boolean>>({});
  const [animInimigo, setAnimInimigo] = useState<EstadoAnimacao>("idle");
  const [avancoInimigo, setAvancoInimigo] = useState(false);
  const [processandoTurnos, setProcessandoTurnos] = useState(false);

  // Fila de turnos processados um de cada vez, cada um com sua própria
  // sequência de "caminhar até o alvo > golpear > voltar" (ver
  // tocarAnimacaoDoTurno) — sem isso, os turnos que chegam em rajada do
  // servidor aplicavam vida/dano tudo de uma vez, sem o personagem se
  // mexer (bug reportado: "não está indo pra frente pra atacar").
  const ultimoIndexEnfileiradoRef = useRef(0);
  const filaTurnosRef = useRef<TurnoGrupoPayload[]>([]);
  const processandoRef = useRef(false);

  useEffect(() => {
    if (!batalhaGrupo) return;
    setVidaInimigo(batalhaGrupo.inimigo.vida_atual);
    setVidaMaxInimigo(batalhaGrupo.inimigo.vida_maxima);
    setVidasAliados(Object.fromEntries(batalhaGrupo.membros.map((m) => [m.id, m.vida])));
    setManasAliados(Object.fromEntries(batalhaGrupo.membros.map((m) => [m.id, m.mana])));
    setAnimAliados({});
    setAvancoAliados({});
    setAnimInimigo("idle");
    setAvancoInimigo(false);
    ultimoIndexEnfileiradoRef.current = 0;
    filaTurnosRef.current = [];
    processandoRef.current = false;
    setProcessandoTurnos(false);
  }, [batalhaGrupo]);

  useEffect(() => {
    if (turnosGrupo.length <= ultimoIndexEnfileiradoRef.current) return;
    const novos = turnosGrupo.slice(ultimoIndexEnfileiradoRef.current);
    ultimoIndexEnfileiradoRef.current = turnosGrupo.length;
    filaTurnosRef.current.push(...novos);
    processarFila();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnosGrupo]);

  const pastaSpriteInimigo = spriteFolderForEnemy(batalhaGrupo?.inimigo.sprite_key, batalhaGrupo?.inimigo.nome);

  // Mesmo critério do combate solo (CombatArena.tsx): sem sprite
  // dedicado, usa a foto estática do monstro antes de cair no boneco
  // genérico.
  const fotoInimigoCombate = !pastaSpriteInimigo ? resolveMediaUrl(batalhaGrupo?.inimigo.imagem_url) : undefined;

  async function processarFila() {
    if (processandoRef.current) return;
    processandoRef.current = true;
    setProcessandoTurnos(true);
    while (filaTurnosRef.current.length > 0) {
      const turno = filaTurnosRef.current.shift()!;
      await tocarAnimacaoDoTurno(turno);
    }
    processandoRef.current = false;
    setProcessandoTurnos(false);
  }

  async function tocarAnimacaoDoTurno(turno: TurnoGrupoPayload) {
    if (turno.origem === "aliado") {
      const idAtor = turno.idAtor ? Number(turno.idAtor) : undefined;
      if (!idAtor) return;
      const pastaAtor = spriteFolderForClass(
        batalhaGrupo?.membros.find((m) => m.id === idAtor)?.classe,
      );

      setAvancoAliados((atual) => ({ ...atual, [idAtor]: true }));
      await espera(DURACAO_CAMINHADA_MS);

      setAnimAliados((atual) => ({ ...atual, [idAtor]: "anim-atacando-direita" }));
      setAnimInimigo(turno.dano > 0 ? "anim-atingido" : turno.esquivou ? "anim-esquivando-direita" : "idle");

      if (turno.dano > 0) {
        dispararFloatingInimigo(`-${turno.dano}`, "#ff3333");
      } else if (turno.esquivou) {
        dispararFloatingInimigo("Esquivou!", "#cccccc");
      }
      if (typeof turno.vidaInimigo === "number") setVidaInimigo(turno.vidaInimigo);
      if (typeof turno.vidaAliado === "number") {
        setVidasAliados((atual) => ({ ...atual, [idAtor]: turno.vidaAliado! }));
      }
      if (typeof turno.manaAliado === "number") {
        setManasAliados((atual) => ({ ...atual, [idAtor]: turno.manaAliado! }));
      }
      if (turno.cura && turno.cura > 0) {
        dispararFloatingAliado(idAtor, `+${turno.cura}`, "#44ff44");
      }

      const duracaoAcao = duracaoVisual(pastaAtor, "attack");
      const duracaoReacaoInimigo = turno.dano > 0 ? duracaoVisual(pastaSpriteInimigo, "hurt") : DURACAO_MOVIMENTO_MS;
      await espera(Math.max(duracaoAcao, duracaoReacaoInimigo));

      setAnimAliados((atual) => ({ ...atual, [idAtor]: "idle" }));
      setAnimInimigo("idle");

      setAvancoAliados((atual) => ({ ...atual, [idAtor]: false }));
      await espera(DURACAO_CAMINHADA_MS);
    } else {
      setAvancoInimigo(true);
      await espera(DURACAO_CAMINHADA_MS);

      setAnimInimigo("anim-atacando-esquerda");

      const idAlvo = turno.idAlvo;
      if (idAlvo) {
        setAnimAliados((atual) => ({
          ...atual,
          [idAlvo]: turno.dano > 0 ? "anim-atingido" : turno.esquivou ? "anim-esquivando-esquerda" : "idle",
        }));
        if (turno.dano > 0) {
          dispararFloatingAliado(idAlvo, `-${turno.dano}`, "#ff3333");
        } else if (turno.esquivou) {
          dispararFloatingAliado(idAlvo, "Esquivou!", "#cccccc");
        }
        if (typeof turno.vidaAliado === "number") {
          setVidasAliados((atual) => ({ ...atual, [idAlvo]: turno.vidaAliado! }));
        }
      }

      const pastaAlvo = idAlvo
        ? spriteFolderForClass(batalhaGrupo?.membros.find((m) => m.id === idAlvo)?.classe)
        : null;
      const duracaoAtaque = duracaoVisual(pastaSpriteInimigo, "attack");
      const duracaoReacaoAliado = turno.dano > 0 ? duracaoVisual(pastaAlvo, "hurt") : DURACAO_MOVIMENTO_MS;
      await espera(Math.max(duracaoAtaque, duracaoReacaoAliado));

      if (idAlvo) {
        setAnimAliados((atual) => ({ ...atual, [idAlvo]: "idle" }));
      }
      setAnimInimigo("idle");

      setAvancoInimigo(false);
      await espera(DURACAO_CAMINHADA_MS);
    }
  }

  function dispararFloatingInimigo(text: string, color: string) {
    const id = Date.now() + Math.random();
    setFloatingInimigo((atual) => [...atual, { id, text, color }]);
    setTimeout(() => setFloatingInimigo((atual) => atual.filter((f) => f.id !== id)), 900);
  }

  function dispararFloatingAliado(idAliado: number, text: string, color: string) {
    const id = Date.now() + Math.random();
    setFloatingAliados((atual) => ({
      ...atual,
      [idAliado]: [...(atual[idAliado] ?? []), { id, text, color }],
    }));
    setTimeout(() => {
      setFloatingAliados((atual) => ({
        ...atual,
        [idAliado]: (atual[idAliado] ?? []).filter((f) => f.id !== id),
      }));
    }, 900);
  }

  const meuId = character?.id;
  const meuTurno = batalhaGrupo ? turnoAtualGrupo === String(meuId) : false;
  const meuMembro = useMemo(
    () => batalhaGrupo?.membros.find((m) => m.id === meuId),
    [batalhaGrupo, meuId],
  );

  if (!batalhaGrupo) return null;

  const EnemySprite = spriteForEnemy(batalhaGrupo.inimigo.sprite_key, batalhaGrupo.inimigo.nome);

  const fundoBatalha = fundoDeBatalha({
    nomeMonstro: batalhaGrupo.inimigo.nome,
    nomeZona: batalhaGrupo.zona.nome,
  });

  // Só mostra o popup de fim de batalha depois que a última animação em
  // fila terminar de tocar — senão o resultado corta a cena no meio do
  // golpe final.
  const mostrarResultado = Boolean(resultadoGrupo) && !processandoTurnos;

  return (
    <div className="fixed inset-0 z-[90] overflow-hidden bg-[#1a1410]">
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
        @keyframes turnoPulse {
          0%,
          100% {
            box-shadow: 0 0 0 rgba(243, 180, 63, 0.6);
          }
          50% {
            box-shadow: 0 0 22px rgba(243, 180, 63, 0.9);
          }
        }
        .turno-ativo {
          animation: turnoPulse 1.4s infinite ease-in-out;
          border-radius: 9999px;
        }
      `}</style>

      <div
        className={`absolute inset-0 bg-cover bg-center ${
          fundoBatalha ? "" : "bg-gradient-to-b from-[#3a2f24] to-[#1f1813]"
        }`}
        style={fundoBatalha ? { backgroundImage: `url(${fundoBatalha})` } : undefined}
      />
      <div className="absolute inset-0 bg-black/30" />

      <div className="absolute inset-x-0 top-0 z-20 flex flex-col items-center p-3 text-center text-white drop-shadow-lg sm:p-4">
        <p className="text-[10px] uppercase tracking-widest text-[#F3B43F] sm:text-xs">
          {batalhaGrupo.zona.nome} — Aventura em grupo
        </p>
        <h1 className="font-imFeel text-xl leading-tight sm:text-2xl">
          {batalhaGrupo.inimigo.nome} (Nv. {batalhaGrupo.inimigo.nivel}) — Rodada {rodadaAtualGrupo}
        </h1>
      </div>

      {/* Aliados: empilhados à esquerda, cada um com nome+vida+mana acima
          da cabeça — mesmo critério do combate solo, só que N vezes. O
          aliado da vez ganha um glow pulsante em volta do sprite, e quem
          agir nesse turno anda até o monstro pra golpear (avancoAliados). */}
      <div className="absolute inset-y-0 left-0 z-10 flex w-[45%] flex-col items-center justify-center gap-16 py-24 sm:w-[38%] sm:gap-20">
        {batalhaGrupo.membros.map((membro) => {
          const PlayerSprite = spriteForClass(membro.classe);
          const vida = vidasAliados[membro.id] ?? membro.vida;
          const mana = manasAliados[membro.id] ?? membro.mana;
          const vivo = vida > 0;
          const daVez = turnoAtualGrupo === String(membro.id);
          const anim = animAliados[membro.id] ?? "idle";
          const avancado = avancoAliados[membro.id] ?? false;
          return (
            <div
              key={membro.id}
              className={`relative flex flex-col items-center transition-transform duration-[420ms] ease-in-out ${
                avancado ? "translate-x-[20vw]" : "translate-x-0"
              } ${vivo ? "" : "opacity-40 grayscale"}`}
            >
              <div className="pointer-events-none absolute -top-16 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center">
                {(floatingAliados[membro.id] ?? []).map((ft) => (
                  <span
                    key={ft.id}
                    className="animate-float-up absolute whitespace-nowrap text-base font-bold sm:text-lg"
                    style={{ color: ft.color }}
                  >
                    {ft.text}
                  </span>
                ))}
              </div>

              <div className="pointer-events-none absolute -top-9 left-1/2 z-10 flex w-max -translate-x-1/2 flex-col items-center gap-0.5">
                <span className="whitespace-nowrap rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                  {membro.nome}
                  {daVez && vivo ? " ⚔" : ""}
                </span>
                <div className="h-1.5 w-16 overflow-hidden rounded-full border border-black/50 bg-black/60 sm:w-20">
                  <div className="h-full bg-red-600 transition-[width] duration-300" style={{ width: `${Math.max(0, Math.min(100, (vida / membro.vidaMax) * 100))}%` }} />
                </div>
                <span className="whitespace-nowrap text-[8px] font-bold text-red-300">
                  {Math.max(0, Math.round(vida))}/{membro.vidaMax}
                </span>
                <div className="h-1 w-16 overflow-hidden rounded-full border border-black/50 bg-black/60 sm:w-20">
                  <div className="h-full bg-blue-500 transition-[width] duration-300" style={{ width: `${Math.max(0, Math.min(100, (mana / membro.manaMax) * 100))}%` }} />
                </div>
                <span className="whitespace-nowrap text-[8px] font-bold text-blue-300">
                  {Math.max(0, Math.round(mana))}/{membro.manaMax}
                </span>
              </div>

              <div className={daVez && vivo ? "turno-ativo" : ""}>
                <PlayerSprite
                  className={`battle-sprite h-20 w-20 sm:h-28 sm:w-28 ${anim !== "idle" ? anim : ""}`}
                  animState={anim}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Monstro à direita — anda até o centro (avancoInimigo) quando é
          quem está golpeando. */}
      <div className="absolute inset-y-0 right-0 z-10 flex w-[45%] flex-col items-center justify-center sm:w-[38%]">
        <div
          className={`relative flex flex-col items-center transition-transform duration-[420ms] ease-in-out ${
            avancoInimigo ? "-translate-x-[20vw]" : "translate-x-0"
          }`}
        >
          <div className="pointer-events-none absolute -top-16 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center">
            {floatingInimigo.map((ft) => (
              <span
                key={ft.id}
                className="animate-float-up absolute whitespace-nowrap text-lg font-bold sm:text-2xl"
                style={{ color: ft.color }}
              >
                {ft.text}
              </span>
            ))}
          </div>

          <div className="pointer-events-none absolute -top-10 left-1/2 z-10 flex w-max -translate-x-1/2 flex-col items-center gap-0.5">
            <span className="whitespace-nowrap rounded bg-black/60 px-1.5 py-0.5 text-xs font-bold text-white shadow">
              {batalhaGrupo.inimigo.nome}
            </span>
            <div className="h-1.5 w-24 overflow-hidden rounded-full border border-black/50 bg-black/60 sm:w-32">
              <div className="h-full bg-red-600 transition-[width] duration-300" style={{ width: `${Math.max(0, Math.min(100, (vidaInimigo / vidaMaxInimigo) * 100))}%` }} />
            </div>
            <span className="whitespace-nowrap text-[9px] font-bold text-red-300">
              {Math.max(0, Math.round(vidaInimigo))}/{vidaMaxInimigo}
            </span>
          </div>

          {fotoInimigoCombate ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fotoInimigoCombate}
              alt={batalhaGrupo.inimigo.nome}
              className={`battle-sprite h-32 w-32 rounded-lg object-contain sm:h-48 sm:w-48 ${animInimigo !== "idle" ? animInimigo : ""}`}
            />
          ) : (
            <EnemySprite
              className={`battle-sprite h-32 w-32 sm:h-48 sm:w-48 ${animInimigo !== "idle" ? animInimigo : ""}`}
              animState={animInimigo}
            />
          )}
        </div>
      </div>

      {!mostrarResultado && (
        <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-3 pb-3 pt-10 sm:px-6">
          {meuTurno ? (
            <CombatActionBar
              podeAgir={meuTurno}
              ocupado={processandoTurnos}
              manaAtual={manasAliados[meuId ?? -1] ?? meuMembro?.mana ?? 0}
              onAtaqueBasico={() => agirGrupo("attack")}
              poderes={(meuMembro?.poderes ?? []).map((p) => ({
                id: p.id,
                nome: p.nome,
                imagem_url: p.imagem_url,
                custo_mana: p.custo_mana,
                descricao: "",
              }))}
              onUsarPoder={(powerId) => agirGrupo("power", powerId)}
              consumiveis={meuMembro?.consumiveis ?? []}
              onUsarConsumivel={(itemId) => agirGrupo("item", itemId)}
            />
          ) : (
            <p className="pb-4 text-center text-sm text-white/70">
              Aguardando o turno de {batalhaGrupo.membros.find((m) => String(m.id) === turnoAtualGrupo)?.nome ?? "..."}
            </p>
          )}
        </div>
      )}

      {mostrarResultado && resultadoGrupo && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-6 text-center text-white shadow-2xl">
            <p className="mb-2 font-imFeel text-3xl">
              {resultadoGrupo.vitoria ? "Vitória em grupo!" : "O grupo caiu..."}
            </p>
            {resultadoGrupo.vitoria && meuId && resultadoGrupo.recompensas[meuId] && (
              <p className="mb-3">
                +{resultadoGrupo.recompensas[meuId].experiencia} de experiência
                {" · +"}
                {resultadoGrupo.recompensas[meuId].dinheiro} moedas
              </p>
            )}
            {resultadoGrupo.vitoria && meuId && resultadoGrupo.drops[meuId] && (
              <p className="mb-3 font-bold text-[#F3B43F]">
                {resultadoGrupo.drops[meuId].tipo === "item" && resultadoGrupo.drops[meuId].item
                  ? `Você encontrou: ${resultadoGrupo.drops[meuId].item!.nome}!`
                  : `+${resultadoGrupo.drops[meuId].dinheiro} moedas extras encontradas!`}
              </p>
            )}
            <button
              onClick={() => {
                limparBatalhaGrupo();
                router.push("/dashboard/adventure");
              }}
              className="rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black hover:bg-[#a5710f]"
            >
              Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
