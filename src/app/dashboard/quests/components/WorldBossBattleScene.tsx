"use client";

// Cena de batalha da Ameaça Mundial — bug relatado ("não tá igual
// aventura"): WorldBossArena.tsx era só um painel de texto/botões
// embutido na aba da Guilda, sem nenhuma semelhança visual com a
// Aventura solo (CombatArena.tsx), que é uma cena cheia com sprite
// animado do personagem, inimigo, barras sobre a cabeça e números de
// dano flutuantes. Esta cena reaproveita o MESMO sistema de sprite/
// animação da Aventura (sprites/spriteForClass, spriteSheets.ts, as
// keyframes .battle-sprite.* de globals.css) só que montada do zero —
// o contrato de API da Ameaça Mundial (join/action, sem contra-ataque
// do boss, fúria/fase/cast assíncronos via socket) é bem diferente do
// turno único "ataque + contra-ataque" que CombatArena.tsx espera, não
// dava pra reaproveitar o componente pronto sem reescrever a lógica de
// turno dele por baixo.
//
// O Boss Global não tem sprite sheet animado (só imagem_url estática,
// ver WorldBossConfig) — por isso aparece como <img> com as mesmas
// classes .battle-sprite (balanço idle, "sacudida" ao levar dano), não
// com quadros de ataque/morte andando feito o personagem.
import { useCallback, useEffect, useRef, useState } from "react";
import { useCharacter } from "@/contexts/CharacterContext";
import { useWorldBossSocket } from "@/contexts/WorldBossSocketContext";
import {
  atacarWorldBoss,
  sairWorldBoss,
  usarPoderWorldBoss,
  mensagemDeErroWorldBoss,
  type WorldBossAcaoResultado,
  type WorldBossCooldownsApi,
  type WorldBossLutadorApi,
  type WorldBossPoderApi,
} from "@/lib/api/worldBoss";
import CombatActionBar from "@/components/combat/CombatActionBar";
import { spriteFolderForClass, spriteForClass } from "@/app/dashboard/adventure/components/sprites/spriteForClass";
import { getSpriteAnimationDurationMs, type EstadoSprite } from "@/app/dashboard/adventure/components/sprites/spriteSheets";
import WorldBossCastCountdown from "./WorldBossCastCountdown";
import WorldBossRankingPanel from "./WorldBossRankingPanel";

type EstadoAnimacao =
  | "idle"
  | "anim-atacando-direita"
  | "anim-atingido"
  | "anim-vitoria"
  | "anim-derrota";

interface FloatingText {
  id: number;
  text: string;
  color: string;
}

const DURACAO_MOVIMENTO_MS = 500;
const DURACAO_CAMINHADA_MS = 420;

function espera(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function duracaoVisual(pasta: string | null, estado: EstadoSprite, minimo = DURACAO_MOVIMENTO_MS) {
  if (!pasta) return minimo;
  return Math.max(minimo, getSpriteAnimationDurationMs(pasta, estado));
}

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
  const percentVida = Math.max(0, Math.min(100, (vidaAtual / Math.max(1, vidaMaxima)) * 100));
  const percentMana = manaMaxima && manaMaxima > 0 ? Math.max(0, Math.min(100, ((manaAtual ?? 0) / manaMaxima) * 100)) : null;

  return (
    <div className="pointer-events-none absolute -top-10 left-1/2 z-10 flex w-max -translate-x-1/2 flex-col items-center gap-0.5">
      <span className="whitespace-nowrap rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white shadow sm:text-xs">{nome}</span>
      <div className="h-1.5 w-20 overflow-hidden rounded-full border border-black/50 bg-black/60 sm:w-24">
        <div className="h-full bg-red-600 transition-[width] duration-300" style={{ width: `${percentVida}%` }} />
      </div>
      <span className="whitespace-nowrap text-[8px] font-bold text-red-300 sm:text-[9px]">
        {Math.max(0, Math.round(vidaAtual)).toLocaleString("pt-BR")}/{Math.round(vidaMaxima).toLocaleString("pt-BR")}
      </span>
      {percentMana !== null && (
        <div className="h-1 w-20 overflow-hidden rounded-full border border-black/50 bg-black/60 sm:w-24">
          <div className="h-full bg-blue-500 transition-[width] duration-300" style={{ width: `${percentMana}%` }} />
        </div>
      )}
    </div>
  );
}

export default function WorldBossBattleScene({
  lutadorInicial,
  poderesIniciais,
  cooldownsIniciais,
  cooldownAcaoInicialMs,
  onSair,
  onGolpeFinal,
}: {
  lutadorInicial: WorldBossLutadorApi;
  poderesIniciais: WorldBossPoderApi[];
  cooldownsIniciais: WorldBossCooldownsApi;
  cooldownAcaoInicialMs: number;
  onSair: () => void;
  onGolpeFinal: () => void;
}) {
  const { character } = useCharacter();
  const { status, ranking, faseAlerta, impactoEmMim } = useWorldBossSocket();

  const [lutador, setLutador] = useState(lutadorInicial);
  const [poderes] = useState(poderesIniciais);
  const [cooldowns, setCooldowns] = useState(cooldownsIniciais);
  const [agindo, setAgindo] = useState(false);
  const [erro, setErro] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [encerrada, setEncerrada] = useState<"vitoria" | "derrota" | null>(null);
  const [mostrarPainelLateral, setMostrarPainelLateral] = useState(false);

  const [hpBoss, setHpBoss] = useState({
    atual: status?.hp_current ?? 0,
    max: status?.hp_max ?? 1,
    percentual: status?.hp_percentual ?? 0,
  });

  const [avancoJogador, setAvancoJogador] = useState(false);
  const [animJogador, setAnimJogador] = useState<EstadoAnimacao>("idle");
  const [animBoss, setAnimBoss] = useState<EstadoAnimacao>("idle");
  // Mesmo padrão de CombatArena.tsx — poder usado troca o SET de frames
  // (ex.: a Maga ataca com flecha mágica, não com a espada do ataque
  // básico), nunca só a classe CSS .anim-atacando-* (que só cobre a
  // "lunge"/translação, igual pros dois tipos de ação).
  const [poseJogador, setPoseJogador] = useState<{ pose?: "poder"; fogo: boolean }>({ fogo: false });
  const [floatingTextsJogador, setFloatingTextsJogador] = useState<FloatingText[]>([]);
  const [floatingTextsBoss, setFloatingTextsBoss] = useState<FloatingText[]>([]);

  // "Turno" pessoal (mesmo mecanismo de WorldBossArena.tsx) — o servidor
  // sempre devolve o MESMO valor "cheio" a cada ação, por isso não dá pra
  // depender de um hook preso a [msIniciais] (nunca rearmaria pra um
  // valor igual ao anterior).
  const [meuCooldownRestanteMs, setMeuCooldownRestanteMs] = useState(cooldownAcaoInicialMs);
  const meuCooldownLiberaEmRef = useRef(Date.now() + cooldownAcaoInicialMs);
  useEffect(() => {
    const intervalo = setInterval(() => {
      setMeuCooldownRestanteMs(Math.max(0, meuCooldownLiberaEmRef.current - Date.now()));
    }, 150);
    return () => clearInterval(intervalo);
  }, []);
  const armarMeuCooldown = useCallback((ms: number | undefined) => {
    const restante = Math.max(0, ms ?? 0);
    meuCooldownLiberaEmRef.current = Date.now() + restante;
    setMeuCooldownRestanteMs(restante);
  }, []);

  useEffect(() => {
    if (status?.hp_current !== undefined && status?.hp_max !== undefined) {
      setHpBoss({ atual: status.hp_current, max: status.hp_max, percentual: status.hp_percentual ?? 0 });
    }
  }, [status?.hp_current, status?.hp_max, status?.hp_percentual]);

  const adicionarLog = useCallback((texto: string) => {
    setLog((atual) => [texto, ...atual].slice(0, 20));
  }, []);

  function triggerFloatingJogador(text: string, color: string) {
    const id = Date.now() + Math.random();
    setFloatingTextsJogador((atual) => [...atual, { id, text, color }]);
    setTimeout(() => setFloatingTextsJogador((atual) => atual.filter((f) => f.id !== id)), 900);
  }

  function triggerFloatingBoss(text: string, color: string) {
    const id = Date.now() + Math.random();
    setFloatingTextsBoss((atual) => [...atual, { id, text, color }]);
    setTimeout(() => setFloatingTextsBoss((atual) => atual.filter((f) => f.id !== id)), 900);
  }

  // Reação a um golpe do Boss em MIM (fúria/fase/cast — assíncrono,
  // nunca em resposta a uma ação minha) — bug relatado: hoje isso só
  // virava uma linha no feed, nunca uma reação na própria cena. Roda
  // independente da animação de ataque (pode acontecer a qualquer
  // momento, inclusive parado esperando meu cooldown pessoal acabar).
  const ultimoImpactoProcessadoRef = useRef(0);
  useEffect(() => {
    if (!impactoEmMim || impactoEmMim.seq <= ultimoImpactoProcessadoRef.current) return;
    ultimoImpactoProcessadoRef.current = impactoEmMim.seq;

    if (impactoEmMim.esquivou) {
      triggerFloatingJogador("Esquivou!", "#cccccc");
      return;
    }

    triggerFloatingJogador(
      impactoEmMim.critico ? `-${impactoEmMim.dano} CRÍTICO!` : `-${impactoEmMim.dano}`,
      impactoEmMim.critico ? "#ffd23f" : "#ff3333",
    );
    setAnimJogador("anim-atingido");
    setTimeout(() => setAnimJogador((atual) => (atual === "anim-atingido" ? "idle" : atual)), 500);
    setLutador((atual) => {
      const novaVida = Math.max(0, atual.vida_atual - impactoEmMim.dano);
      if (novaVida <= 0 || impactoEmMim.derrotado) {
        setEncerrada("derrota");
        adicionarLog(`${impactoEmMim.origem} te derrotou.`);
      }
      return { ...atual, vida_atual: novaVida };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [impactoEmMim]);

  const nomeClasse = character?.Class?.nome;
  const JogadorSprite = spriteForClass(nomeClasse);
  const pastaSpriteJogador = spriteFolderForClass(nomeClasse);

  const bossImagemUrl = status?.imagem_url ?? null;

  async function executar(acaoFn: () => Promise<WorldBossAcaoResultado>, usouPoder: boolean, usouPoderDeFogo: boolean) {
    if (agindo || meuCooldownRestanteMs > 0 || encerrada) return;
    setAgindo(true);
    setErro("");
    try {
      const resultado = await acaoFn();
      setCooldowns(resultado.cooldowns);
      armarMeuCooldown(resultado.proxima_acao_jogador_em_ms);

      if (resultado.bloqueado) {
        adicionarLog(`Você ficou impedido de agir (${resultado.motivoBloqueio ?? "controle de status"}).`);
        setLutador((atual) => ({ ...atual, ...resultado.lutador }));
        return;
      }

      setAvancoJogador(true);
      await espera(DURACAO_CAMINHADA_MS);

      setPoseJogador({ pose: usouPoder ? "poder" : undefined, fogo: usouPoderDeFogo });
      setAnimJogador("anim-atacando-direita");

      if (resultado.esquivou) {
        triggerFloatingBoss("Esquivou!", "#cccccc");
      } else if (resultado.dano > 0) {
        triggerFloatingBoss(resultado.critico ? `-${resultado.dano} CRÍTICO!` : `-${resultado.dano}`, resultado.critico ? "#ffd23f" : "#ff3333");
        setAnimBoss("anim-atingido");
        setHpBoss({ atual: resultado.boss.hp_current, max: resultado.boss.hp_max, percentual: resultado.boss.hp_percentual });
      }
      if (resultado.cura > 0) triggerFloatingJogador(`+${resultado.cura}`, "#44ff44");

      adicionarLog(
        resultado.esquivou
          ? `${resultado.nomeAcao ?? "Ataque"}: a Ameaça Mundial esquivou.`
          : `${resultado.nomeAcao ?? "Ataque"}: ${resultado.dano.toLocaleString("pt-BR")} de dano.${resultado.critico ? " ACERTO CRÍTICO!" : ""}`,
      );

      await espera(duracaoVisual(pastaSpriteJogador, usouPoder ? "poder" : "attack"));

      setLutador((atual) => ({ ...atual, ...resultado.lutador }));
      setAnimBoss("idle");

      if (resultado.golpeFinal) {
        setPoseJogador({ pose: undefined, fogo: false });
        setAnimJogador("anim-vitoria");
        setEncerrada("vitoria");
        adicionarLog("GOLPE FINAL! A Ameaça Mundial foi derrotada!");
        onGolpeFinal();
        return;
      }

      setPoseJogador({ pose: undefined, fogo: false });
      setAnimJogador("idle");
      setAvancoJogador(false);
      await espera(DURACAO_CAMINHADA_MS);

      if (resultado.morreuAoFimDoTurno) {
        setAnimJogador("anim-derrota");
        setEncerrada("derrota");
        adicionarLog("Efeitos de status (queimadura/sangramento/veneno) te derrotaram ao fim do turno.");
      }
    } catch (error) {
      const mensagem = mensagemDeErroWorldBoss(error, usouPoder ? "Não foi possível usar o poder." : "Não foi possível atacar.");
      setErro(mensagem);
      setAvancoJogador(false);
      setAnimJogador("idle");
      if (mensagem.includes("não está mais ativa") || mensagem.includes("não está numa sessão")) {
        setEncerrada("derrota");
      }
    } finally {
      setAgindo(false);
    }
  }

  async function sair() {
    try {
      await sairWorldBoss();
    } catch {
      // best-effort — mesmo princípio de WorldBossArena.tsx.
    }
    onSair();
  }

  const cooldownsConvertidos: Record<number, number> = {};
  for (const [chave, turnos] of Object.entries(cooldowns)) {
    const id = Number(chave.split(":")[1]);
    if (!Number.isNaN(id)) cooldownsConvertidos[id] = turnos;
  }

  const castPendente = status?.combate?.cast_pendente ?? null;
  const percentualBoss = Math.max(0, Math.min(100, (hpBoss.atual / Math.max(1, hpBoss.max)) * 100));

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
      `}</style>

      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 blur-sm"
        style={bossImagemUrl ? { backgroundImage: `url(${bossImagemUrl})` } : undefined}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#3a1414]/80 to-[#1a1410]" />

      <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 pr-14 sm:p-4 sm:pr-16">
        <button
          type="button"
          onClick={sair}
          className="rounded-full border-2 border-[#F3B43F]/60 bg-black/50 px-3 py-1 font-imFeel text-sm text-[#F3B43F] shadow transition hover:bg-black/70"
        >
          ← Sair
        </button>

        <div className="flex flex-col items-center text-center text-white drop-shadow-lg">
          <p className="text-[10px] uppercase tracking-widest text-red-400 sm:text-xs">
            {status?.fase_atual ? status.fase_atual.nome_fase : "Ameaça Mundial"}
          </p>
          <h1 className="font-imFeel text-xl leading-tight sm:text-2xl">{status?.nome ?? "Ameaça Mundial"}</h1>
          {faseAlerta?.texto_alerta && <p className="mt-1 animate-pulse text-xs italic text-red-300">{faseAlerta.texto_alerta}</p>}
          {status?.combate && (
            <p className="mt-1 text-[10px] text-orange-300">Fúria: {status.combate.furia_atual_pct}%</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMostrarPainelLateral((atual) => !atual)}
          aria-label="Ranking e combate"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-[#F3B43F]/60 bg-black/50 font-imFeel text-base text-[#F3B43F] shadow transition hover:bg-black/70"
        >
          i
        </button>
      </div>

      {castPendente?.power && (
        <div className="absolute left-1/2 top-16 z-20 w-72 -translate-x-1/2 sm:top-20">
          <WorldBossCastCountdown nome={castPendente.power.nome} imagemUrl={castPendente.power.imagem_url} resolvesAt={castPendente.resolves_at} />
        </div>
      )}

      <div className="absolute inset-0 z-10 flex items-center justify-between px-[8%] sm:px-[14%]">
        <div
          className={`relative flex flex-col items-center transition-transform duration-[420ms] ease-in-out ${
            avancoJogador ? "translate-x-[30vw]" : "translate-x-0"
          }`}
        >
          <div className="pointer-events-none absolute -top-20 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center">
            {floatingTextsJogador.map((ft) => (
              <span key={ft.id} className="animate-float-up absolute whitespace-nowrap text-lg font-bold sm:text-2xl" style={{ color: ft.color }}>
                {ft.text}
              </span>
            ))}
          </div>

          <BarraSobreCabeca
            nome={`${character?.nome ?? "Você"} (Nv. ${lutador.nivel ?? character?.nivel ?? "?"})`}
            vidaAtual={lutador.vida_atual}
            vidaMaxima={lutador.vida_max}
            manaAtual={lutador.mana_atual}
            manaMaxima={lutador.mana_max}
          />

          <JogadorSprite
            className={`battle-sprite h-32 w-32 sm:h-48 sm:w-48 ${animJogador !== "idle" ? animJogador : ""}`}
            animState={animJogador}
            poseOverride={poseJogador.pose}
            fireTint={poseJogador.fogo}
          />
        </div>

        <div className="relative flex flex-col items-center">
          <div className="pointer-events-none absolute -top-20 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center">
            {floatingTextsBoss.map((ft) => (
              <span key={ft.id} className="animate-float-up absolute whitespace-nowrap text-lg font-bold sm:text-2xl" style={{ color: ft.color }}>
                {ft.text}
              </span>
            ))}
          </div>

          <BarraSobreCabeca nome={status?.nome ?? "Ameaça Mundial"} vidaAtual={hpBoss.atual} vidaMaxima={hpBoss.max} />

          {bossImagemUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bossImagemUrl}
              alt={status?.nome ?? "Ameaça Mundial"}
              className={`battle-sprite h-40 w-40 rounded-lg object-contain drop-shadow-[0_0_25px_rgba(239,68,68,0.4)] sm:h-56 sm:w-56 ${
                animBoss !== "idle" ? animBoss : ""
              }`}
            />
          ) : (
            <div className="flex h-40 w-40 items-center justify-center rounded-lg border-2 border-red-500/50 bg-black/40 font-imFeel text-3xl text-red-400 sm:h-56 sm:w-56">
              {(status?.nome ?? "?").charAt(0)}
            </div>
          )}
          <p className="mt-1 text-right text-[10px] text-white/50">{percentualBoss.toFixed(1)}%</p>
        </div>
      </div>

      {mostrarPainelLateral && (
        <div className="absolute inset-x-3 top-24 z-30 grid grid-cols-1 gap-3 sm:inset-x-auto sm:right-4 sm:w-80">
          <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-black/70 p-3 text-xs backdrop-blur">
            <p className="mb-1 text-[10px] font-bold uppercase text-white/50">Combate</p>
            {log.length === 0 ? <p className="text-white/40">Nenhuma ação ainda.</p> : log.map((linha, i) => <p key={i} className="text-white/70">{linha}</p>)}
          </div>
          <div className="rounded-xl border border-white/10 bg-black/70 p-3 backdrop-blur">
            <WorldBossRankingPanel ranking={ranking} />
          </div>
        </div>
      )}

      {erro && (
        <p className="absolute left-1/2 top-32 z-30 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/70 px-3 py-1.5 text-sm text-red-400 sm:top-36">
          {erro}
        </p>
      )}

      {!encerrada && (
        <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-3 pb-3 pt-10 sm:px-6">
          {meuCooldownRestanteMs > 0 && !agindo && (
            <p className="mb-1 text-center text-xs text-white/50">Próxima ação em {(meuCooldownRestanteMs / 1000).toFixed(1)}s</p>
          )}
          <CombatActionBar
            podeAgir={!encerrada}
            ocupado={agindo || meuCooldownRestanteMs > 0}
            manaAtual={lutador.mana_atual}
            onAtaqueBasico={() => executar(atacarWorldBoss, false, false)}
            poderes={poderes.map((p) => ({
              id: p.id,
              nome: p.nome,
              imagem_url: p.imagem_url,
              custo_mana: p.custo_mana,
              descricao: "",
              escala_atributo: p.escala_atributo,
              valor_escala: p.valor_escala,
            }))}
            onUsarPoder={(powerId) => {
              const poder = poderes.find((p) => p.id === powerId);
              executar(() => usarPoderWorldBoss(powerId), true, Boolean(poder?.nome.toLowerCase().includes("fogo")));
            }}
            consumiveis={[]}
            onUsarConsumivel={() => {}}
            cooldownsPorPoder={cooldownsConvertidos}
          />
        </div>
      )}

      {encerrada && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-6 text-center text-white shadow-2xl">
            <p className="mb-2 font-imFeel text-3xl">{encerrada === "vitoria" ? "Golpe final!" : "Você foi derrotado..."}</p>
            <p className="mb-4 text-sm text-white/70">
              {encerrada === "vitoria"
                ? "A Ameaça Mundial foi derrotada. As recompensas são processadas em instantes."
                : "Sua contribuição até aqui já foi contabilizada no ranking."}
            </p>
            <button onClick={sair} className="rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black hover:bg-[#a5710f]">
              Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
