"use client";

// Boss Global — confronto individual (§9/§13/§31): cada personagem
// ataca por conta própria via REST (join/action/leave), sempre contra
// o MESMO HP compartilhado por todo mundo. Sem contra-ataque do boss
// (decisão de arquitetura do backend — worldBossCombatService.js) —
// nunca arrisca vida entrando na luta. Ameaça Mundial V2 (§18) acopla
// aqui o relógio de combate ao vivo (Furia/fase/cast), cooldowns reais
// de Powers, o feed de ações de TODO MUNDO (via WorldBossSocketContext)
// e a tela de resultado final.
import { useCallback, useEffect, useRef, useState } from "react";
import { useCharacter } from "@/contexts/CharacterContext";
import { useWorldBossSocket } from "@/contexts/WorldBossSocketContext";
import {
  atacarWorldBoss,
  entrarWorldBoss,
  mensagemDeErroWorldBoss,
  sairWorldBoss,
  usarPoderWorldBoss,
  type WorldBossAcaoResultado,
  type WorldBossCooldownsApi,
  type WorldBossLutadorApi,
  type WorldBossPoderApi,
} from "@/lib/api/worldBoss";
import WorldBossCastCountdown from "./WorldBossCastCountdown";
import WorldBossRankingPanel from "./WorldBossRankingPanel";
import WorldBossResultScreen from "./WorldBossResultScreen";

function turnosRestantes(cooldowns: WorldBossCooldownsApi, idPoder: number): number {
  return Math.max(0, cooldowns[`power:${idPoder}`] ?? 0);
}

// Próxima ação do Boss em contagem regressiva local, a partir de um ms
// autoritativo do servidor (proxima_acao_em_ms) — só anima a diferença
// de tempo, nunca decide quando a ação de fato acontece.
function useContagemRegressiva(msIniciais: number | null | undefined) {
  const [restante, setRestante] = useState(msIniciais ?? null);
  const baseRef = useRef({ valor: msIniciais ?? null, marcadoEm: Date.now() });

  useEffect(() => {
    baseRef.current = { valor: msIniciais ?? null, marcadoEm: Date.now() };
    setRestante(msIniciais ?? null);
  }, [msIniciais]);

  useEffect(() => {
    const intervalo = setInterval(() => {
      const { valor, marcadoEm } = baseRef.current;
      if (valor === null) return;
      setRestante(Math.max(0, valor - (Date.now() - marcadoEm)));
    }, 200);
    return () => clearInterval(intervalo);
  }, []);

  return restante;
}

export default function WorldBossArena() {
  const { status, ranking, feed, faseAlerta, recarregar } = useWorldBossSocket();
  const { refreshCharacter } = useCharacter();

  const [emSessao, setEmSessao] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [agindo, setAgindo] = useState(false);
  const [erro, setErro] = useState("");
  const [lutador, setLutador] = useState<WorldBossLutadorApi | null>(null);
  const [poderes, setPoderes] = useState<WorldBossPoderApi[]>([]);
  const [cooldowns, setCooldowns] = useState<WorldBossCooldownsApi>({});
  const [meuLog, setMeuLog] = useState<string[]>([]);
  const [hpAoVivo, setHpAoVivo] = useState<{ atual: number; max: number; percentual: number } | null>(null);

  const proximaAcaoRestante = useContagemRegressiva(status?.combate?.proxima_acao_em_ms);

  // Bug relatado: sem contra-ataque do boss nem fila de turnos entre
  // jogadores (isso aqui é 1 pra 1 contra o HP compartilhado), nada
  // travava o botão entre um clique e outro — dava pra apertar ataque/
  // poder em sequência imediata. O servidor agora recusa (429) ações
  // mais rápidas que proxima_acao_jogador_em_ms; isto aqui só desenha
  // essa espera ANTES do clique falhar, igual proximaAcaoRestante faz
  // pro relógio do boss. Não usa useContagemRegressiva porque o
  // servidor sempre devolve o MESMO valor "cheio" (ex.: 3000) a cada
  // ação — um hook preso a [msIniciais] nunca rearmaria de novo pra um
  // valor igual ao anterior.
  const [meuCooldownRestanteMs, setMeuCooldownRestanteMs] = useState(0);
  const meuCooldownLiberaEmRef = useRef(0);

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
      setHpAoVivo({ atual: status.hp_current, max: status.hp_max, percentual: status.hp_percentual ?? 0 });
    }
  }, [status?.hp_current, status?.hp_max, status?.hp_percentual]);

  const adicionarMeuLog = useCallback((texto: string) => {
    setMeuLog((linhas) => [texto, ...linhas].slice(0, 15));
  }, []);

  async function entrar() {
    setEntrando(true);
    setErro("");
    try {
      const resultado = await entrarWorldBoss();
      setLutador(resultado.lutador);
      setPoderes(resultado.poderes);
      setCooldowns(resultado.cooldowns);
      armarMeuCooldown(resultado.proxima_acao_jogador_em_ms);
      setEmSessao(true);
      adicionarMeuLog("Você entrou na luta contra a Ameaça Mundial.");
    } catch (error) {
      setErro(mensagemDeErroWorldBoss(error, "Não foi possível entrar na luta."));
    } finally {
      setEntrando(false);
    }
  }

  async function sair() {
    try {
      await sairWorldBoss();
    } catch {
      // sair é best-effort — mesmo se a chamada falhar, a UI já limpa o
      // estado local (a sessão do servidor expira/encerra sozinha na
      // próxima ação inválida).
    }
    setEmSessao(false);
    setLutador(null);
    setPoderes([]);
    setCooldowns({});
    setMeuLog([]);
    armarMeuCooldown(0);
  }

  function aplicarResultado(resultado: WorldBossAcaoResultado) {
    setLutador((atual) => (atual ? { ...atual, ...resultado.lutador } : atual));
    setCooldowns(resultado.cooldowns);
    armarMeuCooldown(resultado.proxima_acao_jogador_em_ms);
    setHpAoVivo({ atual: resultado.boss.hp_current, max: resultado.boss.hp_max, percentual: resultado.boss.hp_percentual });
    if (resultado.bloqueado) {
      adicionarMeuLog(`Você ficou impedido de agir (${resultado.motivoBloqueio ?? "controle de status"}).`);
    } else if (resultado.esquivou) {
      adicionarMeuLog(`${resultado.nomeAcao ?? "Ataque"}: a Ameaça Mundial esquivou.`);
    } else {
      adicionarMeuLog(
        `${resultado.nomeAcao ?? "Ataque"}: ${resultado.dano.toLocaleString("pt-BR")} de dano.${resultado.critico ? " ACERTO CRÍTICO!" : ""}`,
      );
    }
    if (resultado.morreuAoFimDoTurno) {
      adicionarMeuLog("Efeitos de status (queimadura/sangramento/veneno) te derrotaram ao fim do turno.");
    }
    if (resultado.golpeFinal) {
      adicionarMeuLog("GOLPE FINAL! A Ameaça Mundial foi derrotada!");
      setEmSessao(false);
      refreshCharacter();
    }
  }

  async function atacar() {
    if (agindo) return;
    setAgindo(true);
    setErro("");
    try {
      const resultado = await atacarWorldBoss();
      aplicarResultado(resultado);
    } catch (error) {
      const mensagem = mensagemDeErroWorldBoss(error, "Não foi possível atacar.");
      setErro(mensagem);
      if (mensagem.includes("não está mais ativa") || mensagem.includes("não está numa sessão")) {
        setEmSessao(false);
        recarregar();
      }
    } finally {
      setAgindo(false);
    }
  }

  async function usarPoder(poder: WorldBossPoderApi) {
    if (agindo) return;
    setAgindo(true);
    setErro("");
    try {
      const resultado = await usarPoderWorldBoss(poder.id);
      aplicarResultado(resultado);
    } catch (error) {
      setErro(mensagemDeErroWorldBoss(error, "Não foi possível usar o poder."));
    } finally {
      setAgindo(false);
    }
  }

  if (!status || status.status === "Nenhum") {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-center text-white shadow-xl">
        <p className="text-white/70">Nenhuma Ameaça Mundial foi descoberta ainda. Continue explorando a Aventura — talvez seja você quem a encontra.</p>
      </div>
    );
  }

  if (status.status === "DISCOVERED") {
    return (
      <div className="rounded-2xl border-2 border-red-500/70 bg-[#292018]/90 p-5 text-center text-white shadow-xl">
        <h2 className="font-imFeel text-2xl text-red-400">{status.nome}</h2>
        <p className="mt-2 text-white/80">{status.mensagem_convocacao}</p>
        {status.descobridor && (
          <p className="mt-2 text-sm text-[#F3B43F]">Descoberta por {status.descobridor.nome}!</p>
        )}
        <p className="mt-3 text-xs text-white/50">Ela despertará em instantes — fique de prontidão.</p>
      </div>
    );
  }

  if (status.status === "DEFEATED") {
    return <WorldBossResultScreen status={status} ranking={ranking} />;
  }

  // status === "ACTIVE"
  const hp = hpAoVivo ?? { atual: status.hp_current ?? 0, max: status.hp_max ?? 1, percentual: status.hp_percentual ?? 0 };
  const castPendente = status.combate?.cast_pendente ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border-2 border-red-500/70 bg-[#292018]/90 p-5 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-imFeel text-2xl text-red-400">{status.nome}</h2>
          {status.fase_atual && (
            <span className={`rounded-full bg-red-900/60 px-3 py-1 text-xs font-bold uppercase text-red-200 ${faseAlerta ? "animate-pulse" : ""}`}>
              {status.fase_atual.nome_fase}
            </span>
          )}
        </div>
        <div className="mt-3 h-4 w-full overflow-hidden rounded-full border border-black/50 bg-black/40">
          <div className="h-full bg-red-600 transition-[width] duration-300" style={{ width: `${hp.percentual}%` }} />
        </div>
        <p className="mt-1 text-right text-xs text-white/60">
          {hp.atual.toLocaleString("pt-BR")} / {hp.max.toLocaleString("pt-BR")} ({hp.percentual.toFixed(1)}%)
        </p>
        {faseAlerta?.texto_alerta && <p className="mt-2 animate-pulse text-sm italic text-red-300">{faseAlerta.texto_alerta}</p>}
        {!faseAlerta && status.fase_atual?.texto_alerta && <p className="mt-2 text-sm italic text-red-300">{status.fase_atual.texto_alerta}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-white/70">
          {status.combate && (
            <span>
              Fúria: <span className="font-bold text-orange-300">{status.combate.furia_atual_pct}%</span>
            </span>
          )}
          {status.combate && (
            <span>
              Ação nº <span className="font-bold">{status.combate.boss_action_seq}</span>
            </span>
          )}
        </div>

        {castPendente?.power && (
          <div className="mt-3">
            <WorldBossCastCountdown nome={castPendente.power.nome} imagemUrl={castPendente.power.imagem_url} resolvesAt={castPendente.resolves_at} />
          </div>
        )}
        {!castPendente && proximaAcaoRestante !== null && (
          <p className="mt-2 text-xs text-white/50">Próxima ação do Boss em {(proximaAcaoRestante / 1000).toFixed(1)}s</p>
        )}
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}

      {!emSessao ? (
        <button
          type="button"
          disabled={entrando}
          onClick={entrar}
          className="rounded-lg bg-[#F3B43F] px-4 py-3 text-sm font-bold text-black transition hover:bg-[#e0a52f] disabled:opacity-50"
        >
          {entrando ? "Entrando..." : "Entrar na luta"}
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          {lutador && (
            <div className="rounded-xl border border-[#F3B43F]/30 bg-black/30 p-3">
              <p className="text-xs text-white/60">Sua vida / mana</p>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/40">
                <div className="h-full bg-green-500" style={{ width: `${(lutador.vida_atual / lutador.vida_max) * 100}%` }} />
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/40">
                <div className="h-full bg-blue-500" style={{ width: `${(lutador.mana_atual / lutador.mana_max) * 100}%` }} />
              </div>
              <p className="mt-1 text-[10px] text-white/50">
                {lutador.vida_atual}/{lutador.vida_max} HP · {lutador.mana_atual}/{lutador.mana_max} Mana
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={agindo || meuCooldownRestanteMs > 0}
              onClick={atacar}
              className="rounded-lg bg-[#F3B43F] px-4 py-2 text-sm font-bold text-black transition hover:bg-[#e0a52f] disabled:opacity-50"
            >
              Ataque básico
            </button>
            {poderes.map((poder) => {
              const restante = turnosRestantes(cooldowns, poder.id);
              const semMana = lutador ? lutador.mana_atual < poder.custo_mana : false;
              const bloqueado = restante > 0 || semMana;
              const infoEscala = poder.escala_atributo
                ? ` · Escala com ${poder.escala_atributo}${poder.valor_escala ? ` (x${poder.valor_escala})` : ""}`
                : "";
              return (
                <button
                  key={poder.id}
                  type="button"
                  disabled={agindo || bloqueado || meuCooldownRestanteMs > 0}
                  onClick={() => usarPoder(poder)}
                  className="relative rounded-lg border border-[#F3B43F]/60 px-4 py-2 text-sm font-bold text-[#F3B43F] transition hover:bg-[#F3B43F]/10 disabled:opacity-50"
                  title={restante > 0 ? `Em cooldown: ${restante} turno(s)` : `Custo: ${poder.custo_mana} mana${infoEscala}`}
                >
                  {poder.nome} ({poder.custo_mana} mana)
                  {restante > 0 && (
                    <span className="ml-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white/70">{restante}</span>
                  )}
                </button>
              );
            })}
            <button
              type="button"
              onClick={sair}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
            >
              Sair da luta
            </button>
            {meuCooldownRestanteMs > 0 && (
              <span className="text-xs text-white/50">Próxima ação em {(meuCooldownRestanteMs / 1000).toFixed(1)}s</span>
            )}
          </div>

          {meuLog.length > 0 && (
            <div className="rounded-xl border border-[#F3B43F]/20 bg-black/20 p-2 text-xs text-[#F3B43F]/80">
              {meuLog.map((linha, i) => (
                <p key={i} className={linha.includes("ACERTO CRÍTICO") ? "font-bold text-[#ffd23f]" : undefined}>
                  {linha}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-3 text-xs">
          <p className="mb-1 text-[10px] font-bold uppercase text-white/50">Combate</p>
          {feed.length === 0 ? (
            <p className="text-white/40">Nenhuma ação ainda.</p>
          ) : (
            feed.map((linha) => (
              <p
                key={linha.id}
                className={
                  linha.texto.includes("ACERTO CRÍTICO")
                    ? "font-bold text-[#ffd23f]"
                    : linha.tipo === "dano"
                      ? "text-red-300"
                      : linha.tipo === "derrota"
                        ? "text-red-400 font-bold"
                        : linha.tipo === "cast"
                          ? "text-orange-300"
                          : linha.tipo === "fase"
                            ? "text-[#F3B43F] font-bold"
                            : "text-white/60"
                }
              >
                {linha.texto}
              </p>
            ))
          )}
        </div>
        <WorldBossRankingPanel ranking={ranking} />
      </div>
    </div>
  );
}
