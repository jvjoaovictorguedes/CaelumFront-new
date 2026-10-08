"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import api from "@/utils/axiosIntance";
import { mensagemDeErroAdmin } from "@/lib/api/admin";
type Change = {
  id: number;
  name: string;
  entity: string;
  release_env: string;
  status: string;
  createdAt: string;
  diff: { field: string; label: string; before: unknown; after: unknown }[];
};
type Delivery = {
  id: number;
  kind: string;
  source_id: number;
  status: string;
  attempts: number;
  message_id: string | null;
  channel_id: string | null;
  last_error: string | null;
  createdAt: string;
  payload: { embeds?: { title?: string }[] };
};
type Dashboard = {
  environment: string;
  configured: boolean;
  enabled: boolean;
  environment_enabled: boolean;
  application_id: string | null;
  guild_id: string | null;
  channel_id: string | null;
  checks: { bot_token: boolean; public_key: boolean; ids: boolean };
  state: { enabled: boolean; auto_patch_notes: boolean; capture_since: string };
  changes: Change[];
  deliveries: Delivery[];
};
const card =
  "rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/95 p-4 shadow-lg";
const button =
  "rounded-lg border border-[#F3B43F]/60 bg-[#49341c] px-3 py-2 text-sm text-[#F3B43F] hover:bg-[#614522] disabled:opacity-40";
const input =
  "w-full rounded-lg border border-[#F3B43F]/40 bg-black/30 p-2 text-white";
const states: Record<string, string> = {
  Pending: "Aguardando",
  Approved: "Aprovada",
  Rejected: "Rejeitada",
  Sending: "Enviando",
  Sent: "Enviada",
  Review: "Conferir no Discord",
  Failed: "Falha confirmada",
  Canceled: "Cancelada",
};
function value(v: unknown) {
  return v === null || v === undefined
    ? "—"
    : typeof v === "object"
      ? JSON.stringify(v)
      : String(v);
}
export default function AdminDiscordNews() {
  const [data, setData] = useState<Dashboard | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [reason, setReason] = useState(""),
    [patchId, setPatchId] = useState(""),
    [messageId, setMessageId] = useState("");
  const load = useCallback(async () => {
    try {
      const r = await api.get("/admin/discord-news");
      setData(r.data.data);
      setError("");
    } catch (e) {
      setError(
        mensagemDeErroAdmin(e, "Não foi possível carregar News Caelum."),
      );
    }
  }, []);
  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 15000);
    return () => clearInterval(timer);
  }, [load]);
  async function action(
    path: string,
    body: Record<string, unknown>,
    method: "post" | "patch" = "post",
  ) {
    if (reason.trim().length < 5) {
      setError("Informe um motivo com pelo menos 5 caracteres.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api[method](`/admin/discord-news${path}`, { ...body, reason });
      setNotice(
        "Operação registrada. A fila será processada quando a integração estiver habilitada.",
      );
      await load();
    } catch (e) {
      setError(mensagemDeErroAdmin(e, "Não foi possível concluir a operação."));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-col gap-5 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-imFeel text-4xl text-[#F3B43F]">
            News Caelum · Discord
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Notícias oficiais, histórico de balanceamento e consultas aos dados
            do jogo.
          </p>
        </div>
        <Link href="/dashboard/admin" className={button}>
          ← Voltar ao Admin
        </Link>
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-red-950/70 p-3 text-red-200">
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-lg bg-green-950/70 p-3 text-green-200"
        >
          {notice}
        </p>
      )}
      {!data ? (
        <p>Carregando integração…</p>
      ) : (
        <>
          <section className={card}>
            <h2 className="font-imFeel text-2xl text-[#F3B43F]">Integração</h2>
            <p className="mt-2">
              Ambiente: <strong>{data.environment}</strong> ·{" "}
              {data.enabled ? "Habilitada" : "Desativada"} ·{" "}
              {data.configured
                ? "Segredos configurados"
                : "Configuração pendente"}
            </p>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              <p>Token: {data.checks.bot_token ? "Configurado" : "Pendente"}</p>
              <p>
                Chave pública:{" "}
                {data.checks.public_key ? "Configurada" : "Pendente"}
              </p>
              <p>
                IDs do Discord: {data.checks.ids ? "Configurados" : "Pendentes"}
              </p>
            </div>
            <p className="mt-2 text-sm text-white/60">
              Servidor: {data.guild_id || "—"} · Canal: {data.channel_id || "—"}
            </p>
            {!data.environment_enabled && (
              <p className="mt-2 text-sm text-amber-200">
                A habilitação pelo ambiente ainda está pendente. Conclua a
                instalação antes de ativar.
              </p>
            )}
            <label className="mt-4 block text-sm">
              Motivo da operação
              <input
                className={`${input} mt-1`}
                value={reason}
                maxLength={500}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex.: publicação do balanceamento aprovado"
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                className={button}
                disabled={
                  busy ||
                  (!data.state.enabled &&
                    (!data.configured || !data.environment_enabled))
                }
                onClick={() =>
                  void action(
                    "/settings",
                    {
                      enabled: !data.state.enabled,
                      auto_patch_notes: data.state.auto_patch_notes,
                    },
                    "patch",
                  )
                }
              >
                {data.state.enabled
                  ? "Desativar integração"
                  : "Habilitar integração"}
              </button>
              <button
                className={button}
                disabled={busy}
                onClick={() =>
                  void action(
                    "/settings",
                    {
                      enabled: data.state.enabled,
                      auto_patch_notes: !data.state.auto_patch_notes,
                    },
                    "patch",
                  )
                }
              >
                {data.state.auto_patch_notes
                  ? "Pausar patch notes automáticos"
                  : "Ativar patch notes automáticos"}
              </button>
            </div>
            <p className="mt-3 text-sm text-white/60">
              Notas novas já publicadas ou cujo agendamento chegou entram na
              fila. Notas antigas podem ser incluídas manualmente. Cada nota tem
              um único envio; edições posteriores exigem uma nova nota de
              correção.
            </p>
          </section>
          <section className={card}>
            <h2 className="font-imFeel text-2xl text-[#F3B43F]">
              Publicar patch note existente
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                aria-label="ID do patch note"
                type="number"
                min="1"
                value={patchId}
                onChange={(e) => setPatchId(e.target.value)}
                className={`${input} max-w-48`}
                placeholder="ID do patch note"
              />
              <button
                className={button}
                disabled={
                  busy ||
                  !Number.isSafeInteger(Number(patchId)) ||
                  Number(patchId) < 1
                }
                onClick={() => void action(`/patches/${patchId}/queue`, {})}
              >
                Adicionar à fila
              </button>
              <Link href="/dashboard/admin/patch-notes" className={button}>
                Editar patch notes
              </Link>
            </div>
          </section>
          <section className={card}>
            <h2 className="font-imFeel text-2xl text-[#F3B43F]">
              Alterações de balanceamento
            </h2>
            <p className="mt-1 text-sm text-white/60">
              A alteração já aconteceu neste ambiente. Aprovar libera seu
              histórico para o bot e agenda a notícia; rejeitar só impede a
              divulgação.
            </p>
            <div className="mt-4 flex flex-col gap-4">
              {data.changes.length === 0 ? (
                <p>Nenhuma alteração registrada após a instalação.</p>
              ) : (
                data.changes.map((c) => (
                  <article
                    key={c.id}
                    className="rounded-lg border border-[#F3B43F]/20 bg-black/20 p-3"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <h3 className="font-bold text-[#F3B43F]">{c.name}</h3>
                      <span className="text-sm">
                        {states[c.status] || c.status} · {c.release_env}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/60">
                      #{c.id} · {new Date(c.createdAt).toLocaleString("pt-BR")}
                    </p>
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="text-white/60">
                            <th className="p-2">Campo</th>
                            <th className="p-2">Antes</th>
                            <th className="p-2">Depois</th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.diff.map((d) => (
                            <tr
                              key={d.field}
                              className="border-t border-white/10"
                            >
                              <td className="p-2">{d.label}</td>
                              <td className="max-w-xs break-words p-2">
                                {value(d.before)}
                              </td>
                              <td className="max-w-xs break-words p-2">
                                {value(d.after)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {c.status === "Pending" && (
                      <div className="mt-3 flex gap-3">
                        <button
                          disabled={busy || c.release_env !== data.environment}
                          className={button}
                          onClick={() =>
                            void action(`/changes/${c.id}/review`, {
                              action: "approve",
                            })
                          }
                        >
                          Aprovar publicação
                        </button>
                        <button
                          disabled={busy || c.release_env !== data.environment}
                          className={button}
                          onClick={() =>
                            void action(`/changes/${c.id}/review`, {
                              action: "reject",
                            })
                          }
                        >
                          Não publicar
                        </button>
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>
          <section className={card}>
            <h2 className="font-imFeel text-2xl text-[#F3B43F]">
              Envios recentes
            </h2>
            <p className="mt-1 text-sm text-white/60">
              Envios sem confirmação ficam para conferência, evitando duplicação
              automática.
            </p>
            <label className="mt-3 block text-sm">
              ID da mensagem encontrada no Discord
              <input
                className={`${input} mt-1 max-w-sm`}
                value={messageId}
                onChange={(e) => setMessageId(e.target.value)}
                placeholder="Para conciliar um envio incerto"
              />
            </label>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th className="p-2">Notícia</th>
                    <th className="p-2">Estado</th>
                    <th className="p-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {data.deliveries.map((d) => (
                    <tr key={d.id} className="border-t border-white/10">
                      <td className="p-2">
                        {d.payload.embeds?.[0]?.title ||
                          `${d.kind} #${d.source_id}`}
                        <p className="text-xs text-white/50">
                          Envio #{d.id} · tentativas {d.attempts}
                        </p>
                      </td>
                      <td className="p-2">
                        {states[d.status] || d.status}
                        {d.last_error && (
                          <p className="mt-1 text-xs text-red-200">
                            {d.last_error}
                          </p>
                        )}
                      </td>
                      <td className="p-2">
                        {d.status === "Failed" && (
                          <button
                            className={button}
                            disabled={busy}
                            onClick={() =>
                              void action(`/deliveries/${d.id}/retry`, {})
                            }
                          >
                            Reenviar
                          </button>
                        )}
                        {d.status === "Review" && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              className={button}
                              disabled={busy || !/^\d{17,20}$/.test(messageId)}
                              onClick={() =>
                                void action(`/deliveries/${d.id}/reconcile`, {
                                  action: "found",
                                  message_id: messageId,
                                })
                              }
                            >
                              Confirmar mensagem
                            </button>
                            <button
                              className={button}
                              disabled={busy}
                              onClick={() =>
                                void action(`/deliveries/${d.id}/reconcile`, {
                                  action: "absent",
                                })
                              }
                            >
                              Conferi: não foi enviada
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!data.deliveries.length && (
              <p className="mt-3">Nenhum envio na fila.</p>
            )}
          </section>
          <section className={card}>
            <h2 className="font-imFeel text-2xl text-[#F3B43F]">
              Instalação e comandos
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
              <li>
                Crie News Caelum no Discord Developer Portal e instale no
                servidor com acesso ao canal de notícias.
              </li>
              <li>
                Configure os segredos no backend. O token nunca deve ser salvo
                no frontend.
              </li>
              <li>
                Configure o endereço de interações no Discord e registre os
                comandos conforme o guia de instalação do projeto.
              </li>
              <li>
                Volte aqui para habilitar a integração e aprovar a primeira
                notícia.
              </li>
            </ol>
            <p className="mt-4 text-sm text-[#F3B43F]">
              /caelum-ajuda · /caelum-habilidade · /caelum-mudancas ·
              /caelum-noticias · /caelum-guia
            </p>
            <p className="mt-2 text-sm text-white/60">
              O bot consulta os dados oficiais. Ele não altera o jogo nem
              aprende regras a partir das conversas. As respostas dos comandos
              ficam visíveis somente para quem perguntou.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
