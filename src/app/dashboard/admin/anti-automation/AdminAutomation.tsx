"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  mensagemDeErroAdmin,
  obterAntiAutomacaoAdmin,
  obterAntiAutomacaoPersonagemAdmin,
  revisarAntiAutomacaoAdmin,
  salvarAntiAutomacaoConfigAdmin,
  type AntiAutomationDetailApi,
  type AntiAutomationPolicyApi,
  type AntiAutomationReviewAction,
  type AntiAutomationSummaryApi,
} from "@/lib/api/admin";

const STATUS_FILTROS = ["", "NORMAL", "OBSERVATION", "CHALLENGE_PENDING", "VERIFIED_WINDOW", "TEMPORARILY_RESTRICTED"] as const;

const STATUS_LABEL: Record<string, string> = {
  NORMAL: "Normal",
  OBSERVATION: "Observação",
  CHALLENGE_PENDING: "Verificação pendente",
  VERIFIED_WINDOW: "Verificado",
  TEMPORARILY_RESTRICTED: "Restrito",
};

const STATUS_BADGE: Record<string, string> = {
  NORMAL: "border-green-500/50 bg-green-500/10 text-green-400",
  OBSERVATION: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400",
  CHALLENGE_PENDING: "border-orange-500/50 bg-orange-500/10 text-orange-400",
  VERIFIED_WINDOW: "border-blue-500/50 bg-blue-500/10 text-blue-400",
  TEMPORARILY_RESTRICTED: "border-red-500/50 bg-red-500/10 text-red-400",
};

function BadgeStatus({ status }: { status: string }) {
  const classe = STATUS_BADGE[status] ?? "border-white/20 bg-white/5 text-white/70";
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-bold ${classe}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function formatarData(iso: string | null | undefined): string {
  return iso ? new Date(iso).toLocaleString("pt-BR") : "—";
}

const ACOES: { action: AntiAutomationReviewAction; label: string }[] = [
  { action: "reviewed", label: "Marcar revisado" },
  { action: "reset", label: "Resetar score" },
  { action: "release", label: "Liberar restrição" },
  { action: "challenge", label: "Solicitar verificação" },
  { action: "exempt", label: "Isentar por 1 hora" },
];

const CAMPOS_FLAG: { campo: keyof AntiAutomationPolicyApi; label: string }[] = [
  { campo: "enabled", label: "Sistema ativo" },
  { campo: "shadow_mode", label: "Shadow mode (nunca bloqueia, só registra)" },
  { campo: "risk_enabled", label: "Pontuação de risco ativa" },
  { campo: "rate_limit_enabled", label: "Rate limit ativo" },
  { campo: "challenge_enabled", label: "Desafio (Turnstile) ativo" },
  { campo: "restriction_enabled", label: "Restrição automática ativa" },
  { campo: "turnstile_fail_open", label: "Falha do Turnstile libera (fail-open)" },
];

const CAMPOS_LIMIAR: { campo: keyof AntiAutomationPolicyApi; label: string }[] = [
  { campo: "observation_threshold", label: "Limiar de observação" },
  { campo: "challenge_threshold", label: "Limiar de desafio" },
  { campo: "restriction_threshold", label: "Limiar de restrição" },
];

const CAMPOS_JANELA: { campo: keyof AntiAutomationPolicyApi; label: string }[] = [
  { campo: "decay_per_hour", label: "Decaimento de score por hora" },
  { campo: "verified_minutes", label: "Minutos de verificação válida" },
  { campo: "restriction_minutes", label: "Minutos de restrição" },
];

const CAMPOS_RETENCAO: { campo: keyof AntiAutomationPolicyApi; label: string }[] = [
  { campo: "event_retention_days", label: "Retenção de eventos (dias)" },
  { campo: "challenge_retention_days", label: "Retenção de desafios (dias)" },
];

export default function AdminAutomation() {
  const [summary, setSummary] = useState<AntiAutomationSummaryApi | null>(null);
  const [detail, setDetail] = useState<AntiAutomationDetailApi | null>(null);
  const [personagemSelecionado, setPersonagemSelecionado] = useState<number | null>(null);
  const [config, setConfig] = useState<AntiAutomationPolicyApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [reason, setReason] = useState("");
  const [page, setPage] = useState(1);
  const [statusFiltro, setStatusFiltro] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const dados = await obterAntiAutomacaoAdmin(page, statusFiltro || undefined);
      setSummary(dados);
      setConfig(dados.policy);
      setErro("");
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível consultar os dados. Verifique sua permissão."));
    } finally {
      setCarregando(false);
    }
  }, [page, statusFiltro]);

  useEffect(() => {
    void load();
  }, [load]);

  const selecionar = useCallback(async (id: number) => {
    setPersonagemSelecionado(id);
    try {
      const dados = await obterAntiAutomacaoPersonagemAdmin(id);
      setDetail(dados);
      setErro("");
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Falha ao consultar personagem."));
    }
  }, []);

  const revisar = async (action: AntiAutomationReviewAction) => {
    if (!detail?.state) return;
    setBusy(true);
    setErro("");
    setMensagem("");
    try {
      await revisarAntiAutomacaoAdmin(detail.state.id_personagem, action, reason);
      await selecionar(detail.state.id_personagem);
      await load();
      setReason("");
      setMensagem("Revisão aplicada.");
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Revisão recusada. Verifique a justificativa e a permissão de gerenciamento."));
    } finally {
      setBusy(false);
    }
  };

  const salvarConfig = async () => {
    if (!config) return;
    setBusy(true);
    setErro("");
    setMensagem("");
    try {
      const atualizado = await salvarAntiAutomacaoConfigAdmin(config, reason);
      setConfig(atualizado);
      setReason("");
      setMensagem("Configuração salva.");
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Configuração recusada. Verifique valores, justificativa e permissão."));
    } finally {
      setBusy(false);
    }
  };

  function atualizarCampo<K extends keyof AntiAutomationPolicyApi>(campo: K, valor: AntiAutomationPolicyApi[K]) {
    setConfig((c) => (c ? { ...c, [campo]: valor } : c));
  }

  const totalPaginas = summary ? Math.max(1, Math.ceil(summary.total / 50)) : 1;

  if (carregando) {
    return (
      <div className="flex flex-col gap-4 text-white">
        <Link prefetch={false} href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <p role="status" className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4 text-sm text-white/50">
          Carregando...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link prefetch={false} href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Anti-automação</h1>
        <p className="mt-1 text-xs text-white/50">
          O score auxilia a revisão; não comprova automação por si só. Shadow mode registra decisões sem bloquear
          jogadores.
        </p>
      </div>

      {erro && (
        <p role="alert" className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">
          {erro}
        </p>
      )}
      {mensagem && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-[#F3B43F]">{mensagem}</p>}

      {summary && (
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-imFeel text-lg text-[#F3B43F]">
              {summary.total} personagem{summary.total === 1 ? "" : "s"} com sinais registrados
            </p>
            <label className="flex items-center gap-2 text-xs text-white/70">
              Filtrar por estado
              <select
                value={statusFiltro}
                onChange={(e) => {
                  setStatusFiltro(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-xs text-white"
              >
                {STATUS_FILTROS.map((s) => (
                  <option key={s} value={s}>
                    {s ? STATUS_LABEL[s] ?? s : "Todos"}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {summary.signalsLastDay.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {summary.signalsLastDay.map((s) => (
                <span key={s.event_type} className="rounded-full bg-black/30 px-2.5 py-1 text-xs text-white/70">
                  <span className="text-white/50">{s.event_type}:</span>{" "}
                  <span className="font-bold text-[#F3B43F]">{s.count}</span>
                </span>
              ))}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white">
              <thead>
                <tr className="text-white/50">
                  <th className="px-2 py-1">Personagem</th>
                  <th className="px-2 py-1">Score</th>
                  <th className="px-2 py-1">Estado</th>
                  <th className="px-2 py-1">Restrito até</th>
                  <th className="px-2 py-1">Último sinal</th>
                </tr>
              </thead>
              <tbody>
                {summary.items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-2 py-3 text-center text-white/40">
                      Nenhum personagem encontrado.
                    </td>
                  </tr>
                )}
                {summary.items.map((s) => (
                  <tr key={s.id_personagem} className="border-t border-white/10 hover:bg-white/5">
                    <td className="px-2 py-1">
                      <button
                        type="button"
                        onClick={() => selecionar(s.id_personagem)}
                        className={`font-bold hover:underline ${
                          personagemSelecionado === s.id_personagem ? "text-[#F3B43F]" : "text-white"
                        }`}
                      >
                        {s.personagem?.nome ? (
                          <>
                            {s.personagem.nome}
                            <span className="ml-1 font-normal text-white/40">#{s.id_personagem}</span>
                          </>
                        ) : (
                          `#${s.id_personagem}`
                        )}
                      </button>
                    </td>
                    <td className="px-2 py-1">{Math.round(s.score)}</td>
                    <td className="px-2 py-1">
                      <BadgeStatus status={s.status} />
                    </td>
                    <td className="px-2 py-1 text-white/60">{formatarData(s.restricted_until)}</td>
                    <td className="px-2 py-1 text-white/60">{formatarData(s.last_signal_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-white/70">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-[#F3B43F]/50 px-3 py-1.5 font-bold text-[#F3B43F] hover:bg-[#F3B43F]/10 disabled:opacity-40"
            >
              ← Anterior
            </button>
            <span>
              Página {page} de {totalPaginas}
            </span>
            <button
              type="button"
              disabled={page >= totalPaginas}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-[#F3B43F]/50 px-3 py-1.5 font-bold text-[#F3B43F] hover:bg-[#F3B43F]/10 disabled:opacity-40"
            >
              Próxima →
            </button>
          </div>
        </div>
      )}

      {detail && (
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4">
          <div className="flex items-center justify-between">
            <p className="font-imFeel text-lg text-[#F3B43F]">
              {detail.state?.personagem?.nome ?? "Personagem"} <span className="text-white/40">#{personagemSelecionado}</span>
            </p>
            {detail.state && <BadgeStatus status={detail.state.status} />}
          </div>

          {!detail.state && (
            <p className="text-xs text-white/50">Esse personagem nunca teve sinais de anti-automação registrados.</p>
          )}

          {detail.state && (
            <dl className="grid grid-cols-2 gap-2 text-xs text-white/70 sm:grid-cols-4">
              <div>
                <dt className="text-white/40">Score</dt>
                <dd className="font-bold text-white">{Math.round(detail.state.score)}</dd>
              </div>
              <div>
                <dt className="text-white/40">Verificado até</dt>
                <dd>{formatarData(detail.state.verified_until)}</dd>
              </div>
              <div>
                <dt className="text-white/40">Restrito até</dt>
                <dd>{formatarData(detail.state.restricted_until)}</dd>
              </div>
              <div>
                <dt className="text-white/40">Isento até</dt>
                <dd>{formatarData(detail.state.exempt_until)}</dd>
              </div>
            </dl>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-white/40">Eventos recentes</p>
              <div className="max-h-56 overflow-y-auto rounded-lg border border-white/10 bg-black/20">
                {detail.events.length === 0 && <p className="p-2 text-xs text-white/40">Nenhum evento registrado.</p>}
                <ul className="divide-y divide-white/10 text-xs text-white/70">
                  {detail.events.map((e) => (
                    <li key={e.id} className="px-2 py-1.5">
                      <span className="text-white/40">{formatarData(e.createdAt)}</span> — {e.event_type} /{" "}
                      {e.action_type}{" "}
                      <span className={e.risk_delta >= 0 ? "text-red-400" : "text-green-400"}>
                        ({e.risk_delta >= 0 ? "+" : ""}
                        {e.risk_delta.toFixed(1)})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-white/40">Desafios (Turnstile)</p>
              <div className="max-h-56 overflow-y-auto rounded-lg border border-white/10 bg-black/20">
                {detail.challenges.length === 0 && (
                  <p className="p-2 text-xs text-white/40">Nenhum desafio registrado.</p>
                )}
                <ul className="divide-y divide-white/10 text-xs text-white/70">
                  {detail.challenges.map((c) => (
                    <li key={c.id} className="px-2 py-1.5">
                      {c.status} — {c.attempts} tentativa{c.attempts === 1 ? "" : "s"}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {detail.state && (
            <div className="flex flex-wrap gap-2">
              {ACOES.map(({ action, label }) => (
                <button
                  key={action}
                  type="button"
                  disabled={busy || reason.trim().length < 5}
                  onClick={() => revisar(action)}
                  className="rounded-lg border border-[#F3B43F]/50 px-3 py-1.5 text-xs font-bold text-[#F3B43F] hover:bg-[#F3B43F]/10 disabled:opacity-40"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <label className="flex flex-col gap-1 text-xs text-white/70">
        Justificativa (5–500 caracteres — exigida pra qualquer revisão ou mudança de configuração)
        <input
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm text-white focus:border-[#F3B43F]/60 focus:outline-none"
        />
      </label>

      {config && (
        <details className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4">
          <summary className="cursor-pointer font-imFeel text-lg text-[#F3B43F]">Configuração e rollout</summary>
          <div className="mt-3 flex flex-col gap-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/40">Interruptores</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {CAMPOS_FLAG.map(({ campo, label }) => (
                  <label key={campo} className="flex items-center gap-2 rounded-lg bg-black/20 p-2 text-xs text-white">
                    <input
                      type="checkbox"
                      checked={Boolean(config[campo])}
                      onChange={(e) => atualizarCampo(campo, e.target.checked)}
                      className="h-4 w-4 accent-[#BC8418]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/40">
                Limiares de risco (0–100, crescentes)
              </p>
              <div className="flex flex-wrap gap-3">
                {CAMPOS_LIMIAR.map(({ campo, label }) => (
                  <label key={campo} className="flex flex-col gap-1 text-xs text-white">
                    {label}
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={Number(config[campo])}
                      onChange={(e) => atualizarCampo(campo, Number(e.target.value))}
                      className="w-24 rounded-lg border border-white/20 bg-black/30 px-2 py-1.5"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/40">Janelas e decaimento</p>
              <div className="flex flex-wrap gap-3">
                {CAMPOS_JANELA.map(({ campo, label }) => (
                  <label key={campo} className="flex flex-col gap-1 text-xs text-white">
                    {label}
                    <input
                      type="number"
                      min={1}
                      value={Number(config[campo])}
                      onChange={(e) => atualizarCampo(campo, Number(e.target.value))}
                      className="w-28 rounded-lg border border-white/20 bg-black/30 px-2 py-1.5"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/40">Retenção de dados</p>
              <div className="flex flex-wrap gap-3">
                {CAMPOS_RETENCAO.map(({ campo, label }) => (
                  <label key={campo} className="flex flex-col gap-1 text-xs text-white">
                    {label}
                    <input
                      type="number"
                      min={1}
                      value={Number(config[campo])}
                      onChange={(e) => atualizarCampo(campo, Number(e.target.value))}
                      className="w-28 rounded-lg border border-white/20 bg-black/30 px-2 py-1.5"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <button
                type="button"
                disabled={busy || reason.trim().length < 5}
                onClick={salvarConfig}
                className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50"
              >
                {busy ? "Salvando..." : "Salvar configuração"}
              </button>
            </div>
          </div>
        </details>
      )}
    </div>
  );
}
