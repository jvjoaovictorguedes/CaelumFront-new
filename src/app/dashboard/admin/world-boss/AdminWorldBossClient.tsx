"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  atualizarWorldBossConfigAdmin,
  atualizarWorldBossSettingsAdmin,
  cancelarCicloWorldBossAdmin,
  criarWorldBossConfigAdmin,
  desativarWorldBossConfigAdmin,
  despertarWorldBossAdmin,
  duplicarWorldBossConfigAdmin,
  forcarDescobertaWorldBossAdmin,
  listarWorldBossConfigsAdmin,
  mensagemDeErroAdmin,
  obterWorldBossConfigAdmin,
  obterWorldBossMetricasAdmin,
  obterWorldBossSettingsAdmin,
  obterWorldBossStatusOperacionalAdmin,
  reativarWorldBossConfigAdmin,
  type PayloadWorldBossConfigAdmin,
  type WorldBossConfigListItemApi,
  type WorldBossMetricsApi,
  type WorldBossPhaseApi,
  type WorldBossSettingsApi,
  type WorldBossStatusOperacionalApi,
} from "@/lib/api/admin";
import { ItemSelect, useItensParaSelecaoAdmin } from "@/components/admin/ItemPicker";

type Aba = "catalogo" | "ciclo" | "config" | "metricas";

function configFormVazio(): PayloadWorldBossConfigAdmin {
  return {
    nome: "",
    descricao: "",
    vida_base: 1000000,
    defesa: 0,
    mensagem_descoberta: "",
    mensagem_convocacao: "",
    id_item_golpe_final: 0,
    gold_descoberta: 0,
    gold_participacao: 0,
    xp_participacao: 0,
    fases: [{ ordem: 1, nome_fase: "Fase 1", hp_percentual_max: 100 }],
    zonas: [],
  };
}

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
  const [mensagem, setMensagem] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<PayloadWorldBossConfigAdmin>(configFormVazio());
  const { itens: itensDisponiveis } = useItensParaSelecaoAdmin();
  const [salvando, setSalvando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [carregandoEdicao, setCarregandoEdicao] = useState(false);

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
    setEditandoId(null);
    setForm(configFormVazio());
    setMostrarForm(true);
    setMensagem("");
  }
  // A linha da tabela (WorldBossConfigListItemApi) só tem CONTAGEM de
  // fases/zonas (evita N+1 no backend) — editar precisa do conteúdo de
  // verdade, então busca o GET /configs/:id completo antes de abrir o
  // formulário.
  async function abrirEdicao(idConfig: number) {
    setCarregandoEdicao(true);
    setErro("");
    try {
      const config = await obterWorldBossConfigAdmin(idConfig);
      setEditandoId(config.id);
      setForm({
        nome: config.nome,
        descricao: config.descricao,
        lore: config.lore ?? "",
        imagem_url: config.imagem_url ?? "",
        peso_selecao: config.peso_selecao,
        vida_base: Number(config.vida_base),
        defesa: config.defesa,
        mensagem_descoberta: config.mensagem_descoberta,
        mensagem_convocacao: config.mensagem_convocacao,
        mensagem_fase_final: config.mensagem_fase_final ?? "",
        mensagem_derrota: config.mensagem_derrota ?? "",
        id_item_golpe_final: config.id_item_golpe_final,
        gold_descoberta: config.gold_descoberta,
        gold_participacao: config.gold_participacao,
        xp_participacao: config.xp_participacao,
        min_dano_participacao: config.min_dano_participacao,
        fases: config.fases.map((f) => ({ ...f })),
        zonas: [...config.zonas],
      });
      setMostrarForm(true);
      setMensagem("");
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar os detalhes."));
    } finally {
      setCarregandoEdicao(false);
    }
  }

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setMensagem("");
    try {
      if (editandoId) {
        await atualizarWorldBossConfigAdmin(editandoId, form);
        setMensagem(`"${form.nome}" atualizada.`);
      } else {
        await criarWorldBossConfigAdmin(form);
        setMensagem(`"${form.nome}" criada.`);
      }
      setMostrarForm(false);
      await carregar();
    } catch (error) {
      setMensagem(mensagemDeErroAdmin(error, "Não foi possível salvar."));
    } finally {
      setSalvando(false);
    }
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

  function atualizarFase(index: number, patch: Partial<WorldBossPhaseApi>) {
    setForm((f) => ({
      ...f,
      fases: (f.fases ?? []).map((fase, i) => (i === index ? { ...fase, ...patch } : fase)),
    }));
  }
  function adicionarFase() {
    setForm((f) => ({
      ...f,
      fases: [...(f.fases ?? []), { ordem: (f.fases?.length ?? 0) + 1, nome_fase: "", hp_percentual_max: 50 }],
    }));
  }
  function removerFase(index: number) {
    setForm((f) => ({ ...f, fases: (f.fases ?? []).filter((_, i) => i !== index) }));
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
                      <button type="button" disabled={carregandoEdicao} onClick={() => abrirEdicao(config.id)} className="text-[#F3B43F] hover:underline disabled:opacity-50">Editar</button>
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

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMostrarForm(false)}>
          <form
            onSubmit={salvar}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-xl flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl"
          >
            <p className="font-imFeel text-xl text-[#F3B43F]">{editandoId ? "Editar Ameaça Mundial" : "Nova Ameaça Mundial"}</p>
            {mensagem && <p className="text-sm text-[#F3B43F]">{mensagem}</p>}

            <label className="flex flex-col gap-1 text-xs">
              Nome
              <input required value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Descrição
              <textarea required value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" rows={2} />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Lore (opcional)
              <textarea value={form.lore ?? ""} onChange={(e) => setForm((f) => ({ ...f, lore: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" rows={2} />
            </label>

            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Vida base
                <input required type="number" min={1} value={form.vida_base} onChange={(e) => setForm((f) => ({ ...f, vida_base: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Defesa
                <input type="number" min={0} value={form.defesa ?? 0} onChange={(e) => setForm((f) => ({ ...f, defesa: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Peso de seleção
                <input type="number" min={1} value={form.peso_selecao ?? 1} onChange={(e) => setForm((f) => ({ ...f, peso_selecao: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
            </div>

            <label className="flex flex-col gap-1 text-xs">
              Mensagem de descoberta
              <input required value={form.mensagem_descoberta} onChange={(e) => setForm((f) => ({ ...f, mensagem_descoberta: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Mensagem de convocação
              <input required value={form.mensagem_convocacao} onChange={(e) => setForm((f) => ({ ...f, mensagem_convocacao: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Mensagem de fase final (opcional)
                <input value={form.mensagem_fase_final ?? ""} onChange={(e) => setForm((f) => ({ ...f, mensagem_fase_final: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Mensagem de derrota (opcional)
                <input value={form.mensagem_derrota ?? ""} onChange={(e) => setForm((f) => ({ ...f, mensagem_derrota: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
            </div>

            <label className="flex flex-col gap-1 text-xs">
              Item de Golpe Final
              <ItemSelect
                itens={itensDisponiveis}
                value={form.id_item_golpe_final || ""}
                onChange={(id) => setForm((f) => ({ ...f, id_item_golpe_final: id === "" ? 0 : id }))}
                permitirVazio={false}
              />
            </label>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <label className="flex flex-col gap-1 text-xs">
                Gold descoberta
                <input type="number" min={0} value={form.gold_descoberta ?? 0} onChange={(e) => setForm((f) => ({ ...f, gold_descoberta: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Gold participação
                <input type="number" min={0} value={form.gold_participacao ?? 0} onChange={(e) => setForm((f) => ({ ...f, gold_participacao: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                XP participação
                <input type="number" min={0} value={form.xp_participacao ?? 0} onChange={(e) => setForm((f) => ({ ...f, xp_participacao: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Dano mín. p/ participação
                <input
                  type="number"
                  min={0}
                  placeholder="Qualquer dano"
                  value={form.min_dano_participacao ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, min_dano_participacao: e.target.value === "" ? null : Number(e.target.value) }))}
                  className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                />
              </label>
            </div>

            <div className="flex flex-col gap-2 rounded-lg border border-white/10 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase text-white/60">Fases (por % de HP restante)</p>
                <button type="button" onClick={adicionarFase} className="text-xs text-[#F3B43F] hover:underline">+ Adicionar fase</button>
              </div>
              {(form.fases ?? []).map((fase, i) => (
                <div key={i} className="flex items-end gap-2">
                  <label className="flex w-14 flex-col gap-1 text-[10px]">
                    Ordem
                    <input type="number" min={1} value={fase.ordem} onChange={(e) => atualizarFase(i, { ordem: Number(e.target.value) })} className="rounded border border-white/20 bg-black/30 px-1.5 py-1 text-xs" />
                  </label>
                  <label className="flex flex-1 flex-col gap-1 text-[10px]">
                    Nome
                    <input value={fase.nome_fase} onChange={(e) => atualizarFase(i, { nome_fase: e.target.value })} className="rounded border border-white/20 bg-black/30 px-1.5 py-1 text-xs" />
                  </label>
                  <label className="flex w-20 flex-col gap-1 text-[10px]">
                    HP% até
                    <input type="number" min={1} max={100} value={fase.hp_percentual_max} onChange={(e) => atualizarFase(i, { hp_percentual_max: Number(e.target.value) })} className="rounded border border-white/20 bg-black/30 px-1.5 py-1 text-xs" />
                  </label>
                  <label className="flex w-20 flex-col gap-1 text-[10px]">
                    Dano%
                    <input type="number" min={0} value={fase.modificador_dano_percentual ?? 0} onChange={(e) => atualizarFase(i, { modificador_dano_percentual: Number(e.target.value) })} className="rounded border border-white/20 bg-black/30 px-1.5 py-1 text-xs" />
                  </label>
                  <button type="button" onClick={() => removerFase(i)} className="pb-1.5 text-xs text-red-400 hover:underline">Remover</button>
                </div>
              ))}
            </div>

            <label className="flex flex-col gap-1 text-xs">
              IDs das zonas elegíveis pra descoberta (separados por vírgula — vazio = qualquer zona)
              <input
                value={(form.zonas ?? []).join(", ")}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    zonas: e.target.value
                      .split(",")
                      .map((v) => Number(v.trim()))
                      .filter((v) => Number.isInteger(v) && v > 0),
                  }))
                }
                className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
              />
            </label>

            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setMostrarForm(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">Cancelar</button>
              <button type="submit" disabled={salvando} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
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
            {status!.discoverer_character_id && <li>Descobridor: personagem #{status!.discoverer_character_id}</li>}
            {status!.final_blow_character_id && <li>Golpe final: personagem #{status!.final_blow_character_id}</li>}
            {status!.next_eligible_at && <li>Próximo elegível em: {new Date(status!.next_eligible_at).toLocaleString("pt-BR")}</li>}
            {status!.auto_awaken_at && <li>Auto-despertar em: {new Date(status!.auto_awaken_at).toLocaleString("pt-BR")}</li>}
            <li>Recompensas de participação: {status!.participation_rewards_status}</li>
          </ul>
        )}
        <button type="button" onClick={carregar} className="mt-3 text-xs text-white/60 hover:underline">Atualizar</button>
      </div>

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
