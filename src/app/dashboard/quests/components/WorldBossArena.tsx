"use client";

// Boss Global — confronto individual (§9/§13/§31): cada personagem
// ataca por conta própria via REST (join/action/leave), sempre contra
// o MESMO HP compartilhado por todo mundo. Sem contra-ataque do boss
// (decisão de arquitetura do backend — worldBossCombatService.js) —
// nunca arrisca vida entrando na luta.
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
  type WorldBossLutadorApi,
  type WorldBossPoderApi,
} from "@/lib/api/worldBoss";

interface LinhaDeLog {
  id: number;
  texto: string;
  dano: boolean;
}

export default function WorldBossArena() {
  const { status, recarregar } = useWorldBossSocket();
  const { refreshCharacter } = useCharacter();

  const [emSessao, setEmSessao] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [agindo, setAgindo] = useState(false);
  const [erro, setErro] = useState("");
  const [lutador, setLutador] = useState<WorldBossLutadorApi | null>(null);
  const [poderes, setPoderes] = useState<WorldBossPoderApi[]>([]);
  const [log, setLog] = useState<LinhaDeLog[]>([]);
  const proximoLogId = useRef(1);
  const [hpAoVivo, setHpAoVivo] = useState<{ atual: number; max: number; percentual: number } | null>(null);

  const adicionarLog = useCallback((texto: string, dano = false) => {
    const id = proximoLogId.current++;
    setLog((linhas) => [{ id, texto, dano }, ...linhas].slice(0, 30));
  }, []);

  useEffect(() => {
    if (status?.hp_current !== undefined && status?.hp_max !== undefined) {
      setHpAoVivo({ atual: status.hp_current, max: status.hp_max, percentual: status.hp_percentual ?? 0 });
    }
  }, [status?.hp_current, status?.hp_max, status?.hp_percentual]);

  async function entrar() {
    setEntrando(true);
    setErro("");
    try {
      const resultado = await entrarWorldBoss();
      setLutador(resultado.lutador);
      setPoderes(resultado.poderes);
      setEmSessao(true);
      adicionarLog("Você entrou na luta contra a Ameaça Mundial.");
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
    setLog([]);
  }

  function aplicarResultado(resultado: WorldBossAcaoResultado) {
    setLutador((atual) => (atual ? { ...atual, ...resultado.lutador } : atual));
    setHpAoVivo({ atual: resultado.boss.hp_current, max: resultado.boss.hp_max, percentual: resultado.boss.hp_percentual });
    if (resultado.esquivou) {
      adicionarLog(`${resultado.nomeAcao}: a Ameaça Mundial esquivou.`);
    } else {
      adicionarLog(`${resultado.nomeAcao}: ${resultado.dano.toLocaleString("pt-BR")} de dano.`, true);
    }
    if (resultado.golpeFinal) {
      adicionarLog("GOLPE FINAL! A Ameaça Mundial foi derrotada!");
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
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-center text-white shadow-xl">
        <h2 className="font-imFeel text-2xl text-[#F3B43F]">{status.nome} foi derrotada!</h2>
        {status.mensagem_derrota && <p className="mt-2 text-white/80">{status.mensagem_derrota}</p>}
        {status.golpe_final_por && <p className="mt-2 text-sm text-white/60">Golpe final de {status.golpe_final_por.nome}.</p>}
      </div>
    );
  }

  // status === "ACTIVE"
  const hp = hpAoVivo ?? { atual: status.hp_current ?? 0, max: status.hp_max ?? 1, percentual: status.hp_percentual ?? 0 };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border-2 border-red-500/70 bg-[#292018]/90 p-5 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-imFeel text-2xl text-red-400">{status.nome}</h2>
          {status.fase_atual && (
            <span className="rounded-full bg-red-900/60 px-3 py-1 text-xs font-bold uppercase text-red-200">{status.fase_atual.nome_fase}</span>
          )}
        </div>
        <div className="mt-3 h-4 w-full overflow-hidden rounded-full border border-black/50 bg-black/40">
          <div className="h-full bg-red-600 transition-[width] duration-300" style={{ width: `${hp.percentual}%` }} />
        </div>
        <p className="mt-1 text-right text-xs text-white/60">
          {hp.atual.toLocaleString("pt-BR")} / {hp.max.toLocaleString("pt-BR")} ({hp.percentual.toFixed(1)}%)
        </p>
        {status.fase_atual?.texto_alerta && <p className="mt-2 text-sm italic text-red-300">{status.fase_atual.texto_alerta}</p>}
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

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={agindo}
              onClick={atacar}
              className="rounded-lg bg-[#F3B43F] px-4 py-2 text-sm font-bold text-black transition hover:bg-[#e0a52f] disabled:opacity-50"
            >
              Ataque básico
            </button>
            {poderes.map((poder) => (
              <button
                key={poder.id}
                type="button"
                disabled={agindo || (lutador ? lutador.mana_atual < poder.custo_mana : false)}
                onClick={() => usarPoder(poder)}
                className="rounded-lg border border-[#F3B43F]/60 px-4 py-2 text-sm font-bold text-[#F3B43F] transition hover:bg-[#F3B43F]/10 disabled:opacity-50"
                title={`Custo: ${poder.custo_mana} mana`}
              >
                {poder.nome} ({poder.custo_mana} mana)
              </button>
            ))}
            <button
              type="button"
              onClick={sair}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
            >
              Sair da luta
            </button>
          </div>

          <div className="max-h-40 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-3 text-xs">
            {log.length === 0 ? (
              <p className="text-white/40">Nenhuma ação ainda.</p>
            ) : (
              log.map((linha) => (
                <p key={linha.id} className={linha.dano ? "text-red-300" : "text-white/60"}>
                  {linha.texto}
                </p>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
