"use client";

// Boss Global — confronto individual (§9/§13/§31): cada personagem
// ataca por conta própria via REST (join/action/leave), sempre contra
// o MESMO HP compartilhado por todo mundo. Sem contra-ataque do boss
// (decisão de arquitetura do backend — worldBossCombatService.js) —
// nunca arrisca vida entrando na luta. Ameaça Mundial V2 (§18) acopla
// aqui o relógio de combate ao vivo (Furia/fase/cast), cooldowns reais
// de Powers, o feed de ações de TODO MUNDO (via WorldBossSocketContext)
// e a tela de resultado final.
//
// Bug relatado ("não tá igual aventura") — a luta em si (depois de
// "Entrar na luta") virou uma cena cheia (WorldBossBattleScene.tsx),
// com o mesmo sprite animado/fundo/barras da Aventura solo, em vez de
// ficar presa dentro desta aba pequena de "Guilda dos Aventureiros".
// Este componente agora só cuida de: status público (nenhum/descoberto/
// derrotado), o convite "Entrar na luta" e o feed+ranking de QUEM NÃO
// está lutando — a luta propriamente dita é outro componente.
import { useEffect, useState } from "react";
import { useCharacter } from "@/contexts/CharacterContext";
import { useWorldBossSocket } from "@/contexts/WorldBossSocketContext";
import {
  entrarWorldBoss,
  mensagemDeErroWorldBoss,
  type WorldBossCooldownsApi,
  type WorldBossLutadorApi,
  type WorldBossPoderApi,
} from "@/lib/api/worldBoss";
import WorldBossCastCountdown from "./WorldBossCastCountdown";
import WorldBossRankingPanel from "./WorldBossRankingPanel";
import WorldBossResultScreen from "./WorldBossResultScreen";
import WorldBossBattleScene from "./WorldBossBattleScene";

// Próxima ação do Boss em contagem regressiva local, a partir de um ms
// autoritativo do servidor (proxima_acao_em_ms) — só anima a diferença
// de tempo, nunca decide quando a ação de fato acontece.
function useContagemRegressiva(msIniciais: number | null | undefined) {
  const [restante, setRestante] = useState(msIniciais ?? null);

  useEffect(() => {
    const base = { valor: msIniciais ?? null, marcadoEm: Date.now() };
    setRestante(msIniciais ?? null);
    const intervalo = setInterval(() => {
      if (base.valor === null) return;
      setRestante(Math.max(0, base.valor - (Date.now() - base.marcadoEm)));
    }, 200);
    return () => clearInterval(intervalo);
  }, [msIniciais]);

  return restante;
}

interface SessaoAtiva {
  lutador: WorldBossLutadorApi;
  poderes: WorldBossPoderApi[];
  cooldowns: WorldBossCooldownsApi;
  cooldownAcaoMs: number;
}

export default function WorldBossArena() {
  const { status, ranking, feed, faseAlerta, recarregar } = useWorldBossSocket();
  const { refreshCharacter } = useCharacter();

  const [sessao, setSessao] = useState<SessaoAtiva | null>(null);
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState("");

  const proximaAcaoRestante = useContagemRegressiva(status?.combate?.proxima_acao_em_ms);

  async function entrar() {
    setEntrando(true);
    setErro("");
    try {
      const resultado = await entrarWorldBoss();
      setSessao({
        lutador: resultado.lutador,
        poderes: resultado.poderes,
        cooldowns: resultado.cooldowns,
        cooldownAcaoMs: resultado.proxima_acao_jogador_em_ms ?? 0,
      });
    } catch (error) {
      setErro(mensagemDeErroWorldBoss(error, "Não foi possível entrar na luta."));
    } finally {
      setEntrando(false);
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
  if (sessao) {
    return (
      <WorldBossBattleScene
        lutadorInicial={sessao.lutador}
        poderesIniciais={sessao.poderes}
        cooldownsIniciais={sessao.cooldowns}
        cooldownAcaoInicialMs={sessao.cooldownAcaoMs}
        onSair={() => setSessao(null)}
        onGolpeFinal={() => {
          recarregar();
          refreshCharacter();
        }}
      />
    );
  }

  const hp = { atual: status.hp_current ?? 0, max: status.hp_max ?? 1, percentual: status.hp_percentual ?? 0 };
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

      <button
        type="button"
        disabled={entrando}
        onClick={entrar}
        className="rounded-lg bg-[#F3B43F] px-4 py-3 text-sm font-bold text-black transition hover:bg-[#e0a52f] disabled:opacity-50"
      >
        {entrando ? "Entrando..." : "Entrar na luta"}
      </button>

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
