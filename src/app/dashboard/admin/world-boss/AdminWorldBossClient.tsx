"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  cancelarCicloWorldBossAdmin,
  desativarWorldBossConfigAdmin,
  despertarWorldBossAdmin,
  duplicarWorldBossConfigAdmin,
  forcarDescobertaWorldBossAdmin,
  listarWorldBossConfigsAdmin,
  mensagemDeErroAdmin,
  obterWorldBossMetricasAdmin,
  obterWorldBossSettingsAdmin,
  obterWorldBossStatusOperacionalAdmin,
  atualizarWorldBossSettingsAdmin,
  reativarWorldBossConfigAdmin,
  type WorldBossConfigListItemApi,
  type WorldBossMetricsApi,
  type WorldBossSettingsApi,
  type WorldBossStatusOperacionalApi,
} from "@/lib/api/admin";
import WorldBossEditorDrawer from "./components/WorldBossEditorDrawer";
import WorldBossLiveMonitor from "./components/WorldBossLiveMonitor";

type Aba = "catalogo" | "ciclo" | "config" | "metricas";

export default function AdminWorldBossClient() {
  const [aba, setAba] = useState<Aba>("catalogo");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Ameaça Mundial</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ["catalogo", "Catálogo"],
          ["ciclo", "Ciclo Atual"],
          ["config", "Configurações"],
          ["metricas", "Métricas"],
        ] as [Aba, string][]).map(([id, rotulo]) => (
          <button
            key={id}
            type="button"
            onClick={() => setAba(id)}
            className={`rounded-lg px-4 py-2 text-sm font-bold uppercase tracking-widest transition ${
              aba === id ? "bg-[#BC8418] text-black" : "border border-white/20 text-white/70 hover:bg-white/10"
            }`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {aba === "catalogo" && <AbaCatalogo />}
      {aba === "ciclo" && <AbaCiclo />}
      {aba === "config" && <AbaConfig />}
      {aba === "metricas" && <AbaMetricas />}
    </div>
  );
}

function AbaCatalogo() {
  const [itens, setItens] = useState<WorldBossConfigListItemApi[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [editorAberto, setEditorAberto] = useState(false);
  const [idConfigEditando, setIdConfigEditando] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resultado = await listarWorldBossConfigsAdmin({ porPagina: 50 });
      setItens(resultado.itens);
      setTotal(resultado.total);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar o catálogo."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirCriacao() {
    setIdConfigEditando(null);
    setEditorAberto(true);
  }
  function abrirEdicao(idConfig: number) {
    setIdConfigEditando(idConfig);
    setEditorAberto(true);
  }

  async function duplicar(config: WorldBossConfigListItemApi) {
    try {
      await duplicarWorldBossConfigAdmin(config.id);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível duplicar."));
    }
  }
  async function alternarAtivo(config: WorldBossConfigListItemApi) {
    try {
      if (config.ativo) await desativarWorldBossConfigAdmin(config.id);
      else await reativarWorldBossConfigAdmin(config.id);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível mudar o status."));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60">{total} ameaça(s) no catálogo</p>
        <button type="button" onClick={abrirCriacao} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
          + Nova Ameaça Mundial
        </button>
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}

      <div className="overflow-x-auto rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80">
        <table className="w-full text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-white/50">
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Vida base</th>
              <th className="px-3 py-2">Fases</th>
              <th className="px-3 py-2">Zonas</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-white/50">Carregando...</td></tr>
            ) : itens.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-white/50">Nenhuma Ameaça Mundial cadastrada.</td></tr>
            ) : (
              itens.map((config) => (
                <tr key={config.id} className="border-b border-white/5">
                  <td className="px-3 py-2 font-bold">{config.nome}</td>
                  <td className="px-3 py-2">{Number(config.vida_base).toLocaleString("pt-BR")}</td>
                  <td className="px-3 py-2">{config.fases_count}</td>
                  <td className="px-3 py-2">{config.zonas_count === 0 ? "Todas" : config.zonas_count}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${config.ativo ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/50"}`}>
                      {config.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => abrirEdicao(config.id)} className="text-[#F3B43F] hover:underline">Editar</button>
                      <button type="button" onClick={() => duplicar(config)} className="text-white/70 hover:underline">Duplicar</button>
                      <button type="button" onClick={() => alternarAtivo(config)} className="text-white/70 hover:underline">
                        {config.ativo ? "Desativar" : "Reativar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editorAberto && (
        <WorldBossEditorDrawer
          idConfigInicial={idConfigEditando}
          onFechar={() => setEditorAberto(false)}
          onSalvo={carregar}
        />
      )}
    </div>
  );
}

function AbaCiclo() {
  const [status, setStatus] = useState<WorldBossStatusOperacionalApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [motivo, setMotivo] = useState("");
  const [characterId, setCharacterId] = useState("");
  const [executando, setExecutando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setStatus(await obterWorldBossStatusOperacionalAdmin());
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar o status operacional."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
    // §13.7 — monitor "ao vivo": repolling simples enquanto a aba está
    // aberta (sem socket dedicado no admin, que já teria complexidade
    // própria de reconexão só pra isso).
    const intervalo = setInterval(carregar, 4000);
    return () => clearInterval(intervalo);
  }, [carregar]);

  async function executar(acao: "descoberta" | "despertar" | "cancelar") {
    if (!motivo.trim()) {
      setMensagem("Informe um motivo — toda ação sobre o ciclo atual fica registrada na auditoria.");
      return;
    }
    setExecutando(true);
    setMensagem("");
    try {
      if (acao === "descoberta") {
        await forcarDescobertaWorldBossAdmin({ motivo, characterId: characterId ? Number(characterId) : undefined });
      } else if (acao === "despertar") {
        await despertarWorldBossAdmin({ motivo });
      } else {
        await cancelarCicloWorldBossAdmin({ motivo });
      }
      setMensagem("Ação aplicada.");
      setMotivo("");
      await carregar();
    } catch (error) {
      setMensagem(mensagemDeErroAdmin(error, "Não foi possível aplicar a ação."));
    } finally {
      setExecutando(false);
    }
  }

  if (carregando) return <p className="text-sm text-white/60">Carregando...</p>;
  if (erro) return <p className="text-sm text-red-400">{erro}</p>;

  const nenhum = !status || status.status === "Nenhum";

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-5">
        <p className="font-imFeel text-xl text-[#F3B43F]">Status operacional</p>
        {nenhum ? (
          <p className="mt-2 text-sm text-white/60">Nenhum ciclo aberto ou em espera no momento.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            <li>Status: <span className="font-bold text-[#F3B43F]">{status!.status}</span></li>
            <li>Config: {status!.nome} (#{status!.id_world_boss_config})</li>
            {status!.hp_max !== undefined && <li>HP: {status!.hp_current?.toLocaleString("pt-BR")} / {status!.hp_max?.toLocaleString("pt-BR")}</li>}
            <li>Threshold de descoberta (SEGREDO): {status!.discovery_threshold ?? "—"}</li>
            <li>Progresso de descoberta: {status!.discovery_progress ?? 0}</li>
            {status!.discoverer_character_id && <li>Descobridor: {status!.descobridor?.nome ?? `personagem #${status!.discoverer_character_id}`}</li>}
            {status!.final_blow_character_id && <li>Golpe final: {status!.golpe_final_por?.nome ?? `personagem #${status!.final_blow_character_id}`}</li>}
            {status!.next_eligible_at && <li>Próximo elegível em: {new Date(status!.next_eligible_at).toLocaleString("pt-BR")}</li>}
            {status!.auto_awaken_at && <li>Auto-despertar em: {new Date(status!.auto_awaken_at).toLocaleString("pt-BR")}</li>}
            <li>Recompensas de participação: {status!.participation_rewards_status}</li>
          </ul>
        )}
        <button type="button" onClick={carregar} className="mt-3 text-xs text-white/60 hover:underline">Atualizar</button>
      </div>

      {status?.runtime_v2 && <WorldBossLiveMonitor runtime={status.runtime_v2} />}

      <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-5">
        <p className="font-imFeel text-xl text-[#F3B43F]">Ações (exigem motivo)</p>
        {mensagem && <p className="mt-2 text-sm text-[#F3B43F]">{mensagem}</p>}

        <label className="mt-3 flex flex-col gap-1 text-xs">
          Motivo (obrigatório, vai pra auditoria)
          <input value={motivo} onChange={(e) => setMotivo(e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
        </label>
        <label className="mt-2 flex flex-col gap-1 text-xs">
          ID do personagem descobridor (opcional, só pra &quot;Forçar descoberta&quot;)
          <input type="number" value={characterId} onChange={(e) => setCharacterId(e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={executando} onClick={() => executar("descoberta")} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
            Forçar descoberta (DORMANT → DISCOVERED)
          </button>
          <button type="button" disabled={executando} onClick={() => executar("despertar")} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
            Despertar agora (DISCOVERED → ACTIVE)
          </button>
          <button type="button" disabled={executando} onClick={() => executar("cancelar")} className="rounded-lg border border-red-400/60 px-4 py-2 text-sm font-bold text-red-300 hover:bg-red-500/10 disabled:opacity-50">
            Cancelar ciclo atual
          </button>
        </div>
      </div>
    </div>
  );
}

function AbaConfig() {
  const [config, setConfig] = useState<WorldBossSettingsApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setConfig(await obterWorldBossSettingsAdmin());
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar as configurações."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!config) return;
    setSalvando(true);
    setMensagem("");
    try {
      setConfig(await atualizarWorldBossSettingsAdmin(config));
      setMensagem("Configurações salvas.");
    } catch (error) {
      setMensagem(mensagemDeErroAdmin(error, "Não foi possível salvar as configurações."));
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <p className="text-sm text-white/60">Carregando...</p>;
  if (!config) return <p className="text-sm text-red-400">{erro}</p>;

  return (
    <form onSubmit={salvar} className="flex flex-col gap-4">
      {mensagem && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-[#F3B43F]">{mensagem}</p>}

      <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-5">
        <div className="flex items-center justify-between">
          <p className="font-imFeel text-xl text-[#F3B43F]">Sistema ativo</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={config["worldboss.enabled"]} onChange={(e) => setConfig({ ...config, "worldboss.enabled": e.target.checked })} />
            {config["worldboss.enabled"] ? "Ativo" : "Desligado (nenhuma descoberta é registrada)"}
          </label>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-5">
        <p className="mb-3 font-imFeel text-xl text-[#F3B43F]">Ciclo e descoberta</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs">
            Cooldown entre ciclos (horas)
            <input type="number" min={0} value={config["worldboss.cooldown_hours"]} onChange={(e) => setConfig({ ...config, "worldboss.cooldown_hours": Number(e.target.value) })} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Threshold mínimo (vitórias)
            <input type="number" min={1} value={config["worldboss.discovery_threshold_min"]} onChange={(e) => setConfig({ ...config, "worldboss.discovery_threshold_min": Number(e.target.value) })} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Threshold máximo (vitórias)
            <input type="number" min={1} value={config["worldboss.discovery_threshold_max"]} onChange={(e) => setConfig({ ...config, "worldboss.discovery_threshold_max": Number(e.target.value) })} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Auto-despertar após descoberta (segundos)
            <input type="number" min={0} value={config["worldboss.discovery_auto_awaken_seconds"]} onChange={(e) => setConfig({ ...config, "worldboss.discovery_auto_awaken_seconds": Number(e.target.value) })} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Intervalo de broadcast de HP (ms)
            <input type="number" min={0} value={config["worldboss.hp_broadcast_interval_ms"]} onChange={(e) => setConfig({ ...config, "worldboss.hp_broadcast_interval_ms": Number(e.target.value) })} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Tamanho do ranking (leaderboard)
            <input type="number" min={1} value={config["worldboss.leaderboard_limit"]} onChange={(e) => setConfig({ ...config, "worldboss.leaderboard_limit": Number(e.target.value) })} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-5">
        <div className="flex items-center justify-between">
          <p className="font-imFeel text-xl text-[#F3B43F]">Recompensas de participação</p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config["worldboss.participation_rewards_enabled"]}
              onChange={(e) => setConfig({ ...config, "worldboss.participation_rewards_enabled": e.target.checked })}
            />
            {config["worldboss.participation_rewards_enabled"] ? "Ativas" : "Desativadas"}
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={salvando} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
          {salvando ? "Salvando..." : "Salvar configurações"}
        </button>
      </div>
    </form>
  );
}

function AbaMetricas() {
  const [metricas, setMetricas] = useState<WorldBossMetricsApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    (async () => {
      setCarregando(true);
      setErro("");
      try {
        setMetricas(await obterWorldBossMetricasAdmin());
      } catch (error) {
        setErro(mensagemDeErroAdmin(error, "Não foi possível carregar as métricas."));
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  if (carregando) return <p className="text-sm text-white/60">Carregando...</p>;
  if (!metricas) return <p className="text-sm text-red-400">{erro}</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-5">
        <p className="font-imFeel text-lg text-[#F3B43F]">Encontros elegíveis por hora (últimas {metricas.encontrosElegiveisPorHora.length}h)</p>
        {metricas.encontrosElegiveisPorHora.length === 0 ? (
          <p className="mt-2 text-sm text-white/50">Nenhum dado registrado ainda.</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2 text-xs text-white/70">
            {metricas.encontrosElegiveisPorHora.map((m) => (
              <li key={m.window_start} className="rounded bg-black/30 px-2 py-1">
                {new Date(m.window_start).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit" })}: {m.encontros_elegiveis}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-5">
        <p className="font-imFeel text-lg text-[#F3B43F]">Histórico de ciclos (últimos 20)</p>
        {metricas.historico.length === 0 ? (
          <p className="mt-2 text-sm text-white/50">Nenhum ciclo concluído ainda.</p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-xs text-white/80">
              <thead>
                <tr className="border-b border-white/10 uppercase text-white/50">
                  <th className="px-2 py-1">Nome</th>
                  <th className="px-2 py-1">Status</th>
                  <th className="px-2 py-1">Descoberto</th>
                  <th className="px-2 py-1">Derrotado</th>
                  <th className="px-2 py-1">Recompensas</th>
                </tr>
              </thead>
              <tbody>
                {metricas.historico.map((h) => (
                  <tr key={h.id} className="border-b border-white/5">
                    <td className="px-2 py-1 font-bold">{h.nome ?? "—"}</td>
                    <td className="px-2 py-1">{h.status}</td>
                    <td className="px-2 py-1">{h.discovered_at ? new Date(h.discovered_at).toLocaleString("pt-BR") : "—"}</td>
                    <td className="px-2 py-1">{h.defeated_at ? new Date(h.defeated_at).toLocaleString("pt-BR") : "—"}</td>
                    <td className="px-2 py-1">{h.participation_rewards_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
