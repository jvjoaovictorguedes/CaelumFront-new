"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  FORGE_CATEGORIAS,
  FORGE_QUALIDADES,
  ativarForgeBlueprintAdmin,
  atualizarForgeBalanceAdmin,
  atualizarForgeBlueprintAdmin,
  atualizarForgeScrollAdmin,
  criarForgeBlueprintAdmin,
  criarForgeScrollAdmin,
  desativarForgeBlueprintAdmin,
  desativarForgeScrollAdmin,
  duplicarForgeBlueprintAdmin,
  duplicarForgeScrollAdmin,
  listarForgeBarrasAdmin,
  listarForgeBlueprintsAdmin,
  listarForgeRecursosAdmin,
  listarForgeScrollsAdmin,
  listarItensAdmin,
  mensagemDeErroAdmin,
  obterForgeBalanceAdmin,
  obterForgeBlueprintAdmin,
  obterForgeMetricasAdmin,
  previewForgeBlueprintAdmin,
  previewForgeImpactoProgressaoAdmin,
  previewForgeRefinamentoAdmin,
  reativarForgeScrollAdmin,
  removerForgeBarraAdmin,
  salvarForgeBarraAdmin,
  validarForgeBlueprintAdmin,
  type AdminItemApi,
  type ForgeBalanceCompletoApi,
  type ForgeBarraLinhaApi,
  type ForgeBlueprintApi,
  type ForgeBlueprintLinhaApi,
  type ForgeCategoria,
  type ForgeMetricasApi,
  type ForgeQualidade,
  type ForgeRecursoApi,
  type ForgeRelatorioValidacaoApi,
  type ForgeScrollApi,
  type ForgeSimulacaoRefinamentoApi,
  type PayloadForgeBlueprintAdmin,
} from "@/lib/api/admin";

type Aba = "visao" | "blueprints" | "barras" | "pergaminhos" | "refinamento" | "balanceamento" | "metricas";

const CARD = "rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-5";
const BTN = "rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50";
const BTN_GHOST = "rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10";
const INPUT = "rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm text-white";

export default function AdminForgeClient({ podeBalancear }: { podeBalancear: boolean }) {
  const [aba, setAba] = useState<Aba>("visao");

  const abas: [Aba, string, boolean][] = [
    ["visao", "Visão Geral", true],
    ["blueprints", "Blueprints", true],
    ["barras", "Fundição/Barras", true],
    ["pergaminhos", "Pergaminhos", true],
    ["refinamento", "Refinamento", podeBalancear],
    ["balanceamento", "Progressão & Tempos", podeBalancear],
    ["metricas", "Métricas", podeBalancear],
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Forja</h1>
        <p className="mt-1 text-sm text-white/60">
          Administra conteúdo e balanceamento da Forja — as regras de jogo continuam nos services existentes; nada aqui é uma segunda Forja.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {abas.map(([id, rotulo, disponivel]) => (
          <button
            key={id}
            type="button"
            disabled={!disponivel}
            onClick={() => disponivel && setAba(id)}
            title={disponivel ? undefined : "Requer a permissão forge.balance"}
            className={`rounded-lg px-4 py-2 text-sm font-bold uppercase tracking-widest transition ${
              !disponivel ? "cursor-not-allowed border border-white/10 text-white/25" : aba === id ? "bg-[#BC8418] text-black" : "border border-white/20 text-white/70 hover:bg-white/10"
            }`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {aba === "visao" && <AbaVisaoGeral />}
      {aba === "blueprints" && <AbaBlueprints />}
      {aba === "barras" && <AbaBarras />}
      {aba === "pergaminhos" && <AbaPergaminhos />}
      {aba === "refinamento" && podeBalancear && <AbaRefinamento />}
      {aba === "balanceamento" && podeBalancear && <AbaBalanceamento />}
      {aba === "metricas" && podeBalancear && <AbaMetricas />}
    </div>
  );
}

// ---------------------------------------------------------------------
// Seletor de Item (busca por nome, com imagem/ID) — reusado no editor de
// resultados/ingredientes de pergaminho/barras (§16 — "busca, imagem e
// identificação por ID pra evitar ambiguidade de nome").
// ---------------------------------------------------------------------
function SeletorItem({ aberto, onFechar, onSelecionar, tipoItem, raridade }: { aberto: boolean; onFechar: () => void; onSelecionar: (item: AdminItemApi) => void; tipoItem?: string; raridade?: string }) {
  const [busca, setBusca] = useState("");
  const [itens, setItens] = useState<AdminItemApi[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setCarregando(true);
    listarItensAdmin({ nome: busca || undefined, tipo_item: tipoItem, raridade, porPagina: 30 })
      .then((r) => setItens(r.itens))
      .catch(() => setItens([]))
      .finally(() => setCarregando(false));
  }, [aberto, busca, tipoItem, raridade]);

  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={onFechar}>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[80vh] w-full max-w-lg flex-col gap-2 overflow-hidden rounded-2xl border-2 border-[#F3B43F] bg-[#20180f] p-4">
        <p className="font-imFeel text-lg text-[#F3B43F]">Selecionar Item{raridade ? ` (${raridade})` : ""}</p>
        <input autoFocus value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome..." className={INPUT} />
        <div className="flex-1 overflow-y-auto">
          {carregando ? (
            <p className="p-2 text-sm text-white/50">Carregando...</p>
          ) : itens.length === 0 ? (
            <p className="p-2 text-sm text-white/50">Nenhum item encontrado.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {itens.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => { onSelecionar(item); onFechar(); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-white hover:bg-white/10">
                    {item.imagem_url ? <img src={item.imagem_url} alt="" className="h-8 w-8 rounded object-cover" /> : <span className="h-8 w-8 rounded bg-white/10" />}
                    <span className="flex-1">{item.nome}</span>
                    <span className="text-xs text-white/40">#{item.id} · {item.raridade}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" onClick={onFechar} className={BTN_GHOST}>Cancelar</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Visão Geral
// ---------------------------------------------------------------------
function AbaVisaoGeral() {
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [resumo, setResumo] = useState<{ total: number; ativos: number; incompletos: number; naoResolviveis: number } | null>(null);
  const [barrasLacunas, setBarrasLacunas] = useState(0);

  useEffect(() => {
    (async () => {
      setCarregando(true);
      setErro("");
      try {
        const [todos, incompletos, naoResolviveis, barras] = await Promise.all([
          listarForgeBlueprintsAdmin({ porPagina: 100 }),
          listarForgeBlueprintsAdmin({ porPagina: 100, incompletos: true }),
          listarForgeBlueprintsAdmin({ porPagina: 100, ingredienteNaoResolvivel: true }),
          listarForgeBarrasAdmin(),
        ]);
        setResumo({
          total: todos.total,
          ativos: todos.itens.filter((i) => i.ativo).length,
          incompletos: incompletos.total,
          naoResolviveis: naoResolviveis.total,
        });
        setBarrasLacunas(barras.reduce((soma, r) => soma + r.qualidades.filter((q) => !q.item).length, 0));
      } catch (error) {
        setErro(mensagemDeErroAdmin(error, "Não foi possível carregar a visão geral."));
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  if (carregando) return <p className="text-sm text-white/60">Carregando...</p>;
  if (erro) return <p className="text-sm text-red-400">{erro}</p>;
  if (!resumo) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div className={CARD}><p className="text-xs uppercase text-white/50">Blueprints</p><p className="font-imFeel text-3xl text-[#F3B43F]">{resumo.total}</p><p className="text-xs text-white/60">{resumo.ativos} ativos</p></div>
      <div className={CARD}><p className="text-xs uppercase text-white/50">Resultados incompletos</p><p className={`font-imFeel text-3xl ${resumo.incompletos > 0 ? "text-red-400" : "text-[#F3B43F]"}`}>{resumo.incompletos}</p><p className="text-xs text-white/60">blueprints sem 6/6 mapeados</p></div>
      <div className={CARD}><p className="text-xs uppercase text-white/50">Ingrediente não resolvível</p><p className={`font-imFeel text-3xl ${resumo.naoResolviveis > 0 ? "text-red-400" : "text-[#F3B43F]"}`}>{resumo.naoResolviveis}</p><p className="text-xs text-white/60">precisam de mapeamento de Barra</p></div>
      <div className={CARD}><p className="text-xs uppercase text-white/50">Lacunas na matriz de Barras</p><p className={`font-imFeel text-3xl ${barrasLacunas > 0 ? "text-yellow-400" : "text-[#F3B43F]"}`}>{barrasLacunas}</p><p className="text-xs text-white/60">célula Recurso×Qualidade sem Item</p></div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Blueprints
// ---------------------------------------------------------------------
function blueprintFormVazio(): PayloadForgeBlueprintAdmin {
  return { nome: "", categoria_equipamento: "Arma", tier_equipamento: 3, multiplicador_tempo: 1, nivel_forja_minimo: 1, ingredientes: [], resultados: {} };
}

function AbaBlueprints() {
  const [itens, setItens] = useState<ForgeBlueprintLinhaApi[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mostrarEditor, setMostrarEditor] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resultado = await listarForgeBlueprintsAdmin({ porPagina: 100, categoria: filtroCategoria || undefined, ativo: filtroAtivo === "" ? undefined : filtroAtivo === "true" });
      setItens(resultado.itens);
      setTotal(resultado.total);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar os blueprints."));
    } finally {
      setCarregando(false);
    }
  }, [filtroCategoria, filtroAtivo]);

  useEffect(() => { carregar(); }, [carregar]);

  async function duplicar(id: number) {
    try { await duplicarForgeBlueprintAdmin(id); await carregar(); } catch (error) { setErro(mensagemDeErroAdmin(error, "Não foi possível duplicar.")); }
  }
  async function alternarAtivo(linha: ForgeBlueprintLinhaApi) {
    try {
      if (linha.ativo) await desativarForgeBlueprintAdmin(linha.id, "Desativado pelo Painel Administrativo.");
      else await ativarForgeBlueprintAdmin(linha.id);
      await carregar();
    } catch (error) { setErro(mensagemDeErroAdmin(error, "Não foi possível mudar o status.")); }
  }

  if (mostrarEditor) {
    return <EditorBlueprint id={editandoId} onFechar={() => { setMostrarEditor(false); carregar(); }} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className={INPUT}>
            <option value="">Todas categorias</option>
            {FORGE_CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filtroAtivo} onChange={(e) => setFiltroAtivo(e.target.value)} className={INPUT}>
            <option value="">Ativo/Inativo</option>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
        </div>
        <button type="button" onClick={() => { setEditandoId(null); setMostrarEditor(true); }} className={BTN}>+ Novo blueprint</button>
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      <p className="text-sm text-white/60">{total} blueprint(s)</p>

      <div className="overflow-x-auto rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80">
        <table className="w-full text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-white/50">
              <th className="px-3 py-2">Nome</th><th className="px-3 py-2">Categoria</th><th className="px-3 py-2">Tier</th>
              <th className="px-3 py-2">Nv. Forja</th><th className="px-3 py-2">Resultados</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={7} className="px-3 py-4 text-center text-white/50">Carregando...</td></tr>
            ) : itens.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-4 text-center text-white/50">Nenhum blueprint cadastrado.</td></tr>
            ) : (
              itens.map((bp) => (
                <tr key={bp.id} className="border-b border-white/5">
                  <td className="px-3 py-2 font-bold">{bp.nome}</td>
                  <td className="px-3 py-2">{bp.categoria_equipamento}</td>
                  <td className="px-3 py-2">{bp.tier_equipamento ?? "—"}</td>
                  <td className="px-3 py-2">{bp.nivel_forja_minimo}</td>
                  <td className="px-3 py-2">
                    <span className={bp.resultados_completos ? "text-green-300" : "text-red-400"}>{bp.resultados_count}/6</span>
                    {!bp.ingredientes_ok && <span className="ml-2 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-red-300">Ingrediente ausente</span>}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${bp.ativo ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/50"}`}>{bp.ativo ? "Ativo" : "Inativo"}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => { setEditandoId(bp.id); setMostrarEditor(true); }} className="text-[#F3B43F] hover:underline">Editar</button>
                      <button type="button" onClick={() => duplicar(bp.id)} className="text-white/70 hover:underline">Duplicar</button>
                      <button type="button" onClick={() => alternarAtivo(bp)} className="text-white/70 hover:underline">{bp.ativo ? "Desativar" : "Ativar"}</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function categoriaParaTipoItem(categoria: ForgeCategoria): string | undefined {
  return categoria; // ForgeCategoria e Item.tipo_item usam o mesmo ENUM de nomes.
}

function EditorBlueprint({ id, onFechar }: { id: number | null; onFechar: () => void }) {
  const [form, setForm] = useState<PayloadForgeBlueprintAdmin>(blueprintFormVazio());
  const [blueprint, setBlueprint] = useState<ForgeBlueprintApi | null>(null);
  const [relatorio, setRelatorio] = useState<ForgeRelatorioValidacaoApi | null>(null);
  const [carregando, setCarregando] = useState(Boolean(id));
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [seletorAberto, setSeletorAberto] = useState<string | null>(null); // qualidade sendo escolhida, ou "novo-ingrediente"
  const [recursos, setRecursos] = useState<ForgeRecursoApi[]>([]);
  const [previewDados, setPreviewDados] = useState<Awaited<ReturnType<typeof previewForgeBlueprintAdmin>> | null>(null);

  const carregar = useCallback(async () => {
    if (!id) { setCarregando(false); return; }
    setCarregando(true);
    try {
      const resultado = await obterForgeBlueprintAdmin(id);
      setBlueprint(resultado.blueprint);
      setRelatorio(resultado);
      setForm({
        nome: resultado.blueprint.nome,
        categoria_equipamento: resultado.blueprint.categoria_equipamento,
        tier_equipamento: resultado.blueprint.tier_equipamento ?? 3,
        multiplicador_tempo: resultado.blueprint.multiplicador_tempo,
        nivel_forja_minimo: resultado.blueprint.nivel_forja_minimo,
        ingredientes: resultado.blueprint.ingredientes.map((i) => ({ tipo_insumo: i.tipo_insumo, id_recurso: i.id_recurso, quantidade_base: i.quantidade_base })),
        resultados: Object.fromEntries(resultado.blueprint.resultados.map((r) => [r.qualidade, r.id_item])),
      });
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar o blueprint."));
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { listarForgeRecursosAdmin("Mineracao").then(setRecursos).catch(() => setRecursos([])); }, []);

  async function salvarCamposBasicos() {
    setSalvando(true); setErro(""); setMensagem("");
    try {
      if (id) {
        await atualizarForgeBlueprintAdmin(id, { nome: form.nome, categoria_equipamento: form.categoria_equipamento, tier_equipamento: form.tier_equipamento, multiplicador_tempo: form.multiplicador_tempo, nivel_forja_minimo: form.nivel_forja_minimo });
        setMensagem("Campos básicos salvos.");
        await carregar();
      } else {
        const criado = await criarForgeBlueprintAdmin(form);
        setMensagem(`Blueprint "${criado.nome}" criado (inativo) — continue configurando ingredientes e resultados.`);
        // Mantém o editor aberto no blueprint recém-criado (sem re-montar
        // o componente) pra próximas ações (ingredientes/resultados)
        // usarem PUT direto — idAtual abaixo passa a apontar pro novo id
        // assim que blueprint muda de null pro objeto criado.
        const resultado = await obterForgeBlueprintAdmin(criado.id);
        setBlueprint(resultado.blueprint);
        setRelatorio(resultado);
      }
    } catch (error) { setErro(mensagemDeErroAdmin(error, "Não foi possível salvar.")); } finally { setSalvando(false); }
  }

  const idAtual = blueprint?.id ?? id;

  async function salvarIngredientes() {
    if (!idAtual) { setErro("Salve os campos básicos primeiro."); return; }
    setSalvando(true); setErro("");
    try {
      await atualizarForgeBlueprintAdmin(idAtual, { ingredientes: form.ingredientes });
      setMensagem("Ingredientes salvos.");
      await carregar();
    } catch (error) { setErro(mensagemDeErroAdmin(error, "Não foi possível salvar os ingredientes.")); } finally { setSalvando(false); }
  }

  async function salvarResultado(qualidade: ForgeQualidade, item: AdminItemApi) {
    if (!idAtual) { setErro("Salve os campos básicos primeiro."); return; }
    setSalvando(true); setErro("");
    try {
      await atualizarForgeBlueprintAdmin(idAtual, { resultados: { [qualidade]: item.id } });
      setMensagem(`Resultado ${qualidade} definido como "${item.nome}".`);
      await carregar();
    } catch (error) { setErro(mensagemDeErroAdmin(error, "Não foi possível salvar o resultado.")); } finally { setSalvando(false); }
  }

  async function validar() {
    if (!idAtual) return;
    try { setRelatorio(await validarForgeBlueprintAdmin(idAtual)); setMensagem("Validação atualizada."); } catch (error) { setErro(mensagemDeErroAdmin(error, "Falha ao validar.")); }
  }

  async function ativar() {
    if (!idAtual) return;
    setSalvando(true); setErro("");
    try { await ativarForgeBlueprintAdmin(idAtual); setMensagem("Blueprint ATIVADO."); await carregar(); } catch (error) { setErro(mensagemDeErroAdmin(error, "Não foi possível ativar.")); } finally { setSalvando(false); }
  }
  async function desativar() {
    if (!idAtual) return;
    setSalvando(true); setErro("");
    try { await desativarForgeBlueprintAdmin(idAtual, "Desativado pelo editor do Painel Administrativo."); setMensagem("Blueprint desativado."); await carregar(); } catch (error) { setErro(mensagemDeErroAdmin(error, "Não foi possível desativar.")); } finally { setSalvando(false); }
  }

  async function carregarPreview(nivel: number, qualidade: string) {
    if (!idAtual) return;
    try { setPreviewDados(await previewForgeBlueprintAdmin(idAtual, { nivelForja: nivel, qualidadeBase: qualidade })); } catch (error) { setErro(mensagemDeErroAdmin(error, "Não foi possível montar o preview.")); }
  }

  if (carregando) return <p className="text-sm text-white/60">Carregando...</p>;

  const resultadosPorQualidade = new Map((blueprint?.resultados ?? []).map((r) => [r.qualidade, r]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onFechar} className="text-sm text-[#F3B43F]/80 hover:underline">← Voltar pra listagem</button>
        {blueprint && (
          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${blueprint.ativo ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/50"}`}>{blueprint.ativo ? "Ativo" : "Inativo"}</span>
        )}
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      {mensagem && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-[#F3B43F]">{mensagem}</p>}

      <div className={CARD}>
        <p className="mb-3 font-imFeel text-xl text-[#F3B43F]">Campos básicos</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs">Nome<input className={INPUT} value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} /></label>
          <label className="flex flex-col gap-1 text-xs">Categoria<select className={INPUT} value={form.categoria_equipamento} onChange={(e) => setForm((f) => ({ ...f, categoria_equipamento: e.target.value as ForgeCategoria }))}>{FORGE_CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
          <label className="flex flex-col gap-1 text-xs">Tier (1-5)<input type="number" min={1} max={5} className={INPUT} value={form.tier_equipamento} onChange={(e) => setForm((f) => ({ ...f, tier_equipamento: Number(e.target.value) }))} /></label>
          <label className="flex flex-col gap-1 text-xs">Nível Forja mínimo<input type="number" min={1} max={10} className={INPUT} value={form.nivel_forja_minimo} onChange={(e) => setForm((f) => ({ ...f, nivel_forja_minimo: Number(e.target.value) }))} /></label>
          <label className="flex flex-col gap-1 text-xs">Multiplicador de tempo<input type="number" min={0.1} step={0.1} className={INPUT} value={form.multiplicador_tempo} onChange={(e) => setForm((f) => ({ ...f, multiplicador_tempo: Number(e.target.value) }))} /></label>
        </div>
        <div className="mt-3 flex justify-end"><button type="button" disabled={salvando} onClick={salvarCamposBasicos} className={BTN}>{id ? "Salvar campos básicos" : "Criar blueprint (inativo)"}</button></div>
      </div>

      {idAtual && (
        <>
          <div className={CARD}>
            <p className="mb-3 font-imFeel text-xl text-[#F3B43F]">Ingredientes lógicos</p>
            <p className="mb-2 text-xs text-white/50">O Admin escolhe o recurso lógico (Barra de Mineração) — o backend resolve o Item correto nas 6 qualidades.</p>
            {(form.ingredientes ?? []).map((ing, idx) => (
              <div key={idx} className="mb-2 flex flex-wrap items-center gap-2">
                <select className={INPUT} value={ing.id_recurso} onChange={(e) => setForm((f) => ({ ...f, ingredientes: f.ingredientes!.map((x, i) => (i === idx ? { ...x, id_recurso: Number(e.target.value) } : x)) }))}>
                  {recursos.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
                </select>
                <input type="number" min={1} className={`${INPUT} w-20`} value={ing.quantidade_base} onChange={(e) => setForm((f) => ({ ...f, ingredientes: f.ingredientes!.map((x, i) => (i === idx ? { ...x, quantidade_base: Number(e.target.value) } : x)) }))} />
                <button type="button" onClick={() => setForm((f) => ({ ...f, ingredientes: f.ingredientes!.filter((_, i) => i !== idx) }))} className="text-xs text-red-400 hover:underline">Remover</button>
              </div>
            ))}
            <button type="button" onClick={() => setForm((f) => ({ ...f, ingredientes: [...(f.ingredientes ?? []), { tipo_insumo: "Barra", id_recurso: recursos[0]?.id ?? 0, quantidade_base: 1 }] }))} className={BTN_GHOST}>+ Ingrediente</button>
            <div className="mt-3 flex justify-end"><button type="button" disabled={salvando} onClick={salvarIngredientes} className={BTN}>Salvar ingredientes</button></div>

            {relatorio && (
              <div className="mt-4 overflow-x-auto">
                <p className="mb-1 text-xs uppercase text-white/50">Matriz de resolução</p>
                <table className="w-full text-left text-xs text-white">
                  <thead><tr className="text-white/50">{FORGE_QUALIDADES.map((q) => <th key={q} className="px-2 py-1">{q}</th>)}</tr></thead>
                  <tbody>
                    {relatorio.matrizIngredientes.map((linha, idx) => (
                      <tr key={idx}>
                        {FORGE_QUALIDADES.map((q) => (
                          <td key={q} className={`px-2 py-1 ${linha.resolucao[q]?.status === "OK" ? "text-green-300" : "text-red-400"}`}>{linha.resolucao[q]?.status === "OK" ? (linha.resolucao[q]?.nome ?? "OK") : "Ausente"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className={CARD}>
            <p className="mb-3 font-imFeel text-xl text-[#F3B43F]">Resultados por qualidade (6/6)</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {FORGE_QUALIDADES.map((qualidade) => {
                const atual = resultadosPorQualidade.get(qualidade);
                return (
                  <div key={qualidade} className="rounded-lg border border-white/10 p-2">
                    <p className="text-xs uppercase text-white/50">{qualidade}</p>
                    {atual?.item ? (
                      <div className="mt-1 flex items-center gap-2">
                        {atual.item.imagem_url ? <img src={atual.item.imagem_url} alt="" className="h-8 w-8 rounded object-cover" /> : <span className="h-8 w-8 rounded bg-white/10" />}
                        <span className="text-xs text-white">{atual.item.nome}</span>
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-red-400">Sem item</p>
                    )}
                    <button type="button" onClick={() => setSeletorAberto(qualidade)} className="mt-2 text-xs text-[#F3B43F] hover:underline">Selecionar item</button>
                  </div>
                );
              })}
            </div>
            {relatorio && relatorio.resultadosValidacao.alertas.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs">
                {relatorio.resultadosValidacao.alertas.map((a, i) => (
                  <li key={i} className={a.nivel === "ERRO" ? "text-red-400" : a.nivel === "AVISO" ? "text-yellow-400" : "text-white/50"}>[{a.nivel}] {a.qualidade ? `${a.qualidade}: ` : ""}{a.mensagem}</li>
                ))}
              </ul>
            )}
          </div>

          <div className={CARD}>
            <p className="mb-3 font-imFeel text-xl text-[#F3B43F]">Validação e ativação</p>
            <p className={`text-sm ${relatorio?.podeAtivar ? "text-green-300" : "text-red-400"}`}>{relatorio?.podeAtivar ? "Pronto pra ativar." : (relatorio?.motivos ?? []).join(" ") || "Ainda não validado."}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={validar} className={BTN_GHOST}>Revalidar</button>
              {blueprint?.ativo ? (
                <button type="button" disabled={salvando} onClick={desativar} className={BTN_GHOST}>Desativar</button>
              ) : (
                <button type="button" disabled={salvando || !relatorio?.podeAtivar} onClick={ativar} className={BTN}>Ativar</button>
              )}
            </div>
          </div>

          <div className={CARD}>
            <p className="mb-3 font-imFeel text-xl text-[#F3B43F]">Preview — &quot;como o jogador vê&quot;</p>
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1 text-xs">Nível de Forja simulado (1-10)<input type="number" min={1} max={10} defaultValue={1} id="preview-nivel" className={`${INPUT} w-28`} /></label>
              <label className="flex flex-col gap-1 text-xs">Qualidade-base<select id="preview-qualidade" defaultValue="Comum" className={INPUT}>{FORGE_QUALIDADES.map((q) => <option key={q} value={q}>{q}</option>)}</select></label>
              <button
                type="button"
                onClick={() => {
                  const nivel = Number((document.getElementById("preview-nivel") as HTMLInputElement)?.value ?? 1);
                  const qualidade = (document.getElementById("preview-qualidade") as HTMLSelectElement)?.value ?? "Comum";
                  carregarPreview(nivel, qualidade);
                }}
                className={BTN}
              >
                Ver preview
              </button>
            </div>
            {previewDados && (
              <div className="mt-3 text-sm text-white/80">
                <p>Tempo estimado: {Math.round(previewDados.tempo_segundos / 60)} min</p>
                <p className="mt-1 text-xs uppercase text-white/50">Chances por qualidade final</p>
                <ul className="flex flex-wrap gap-2">
                  {Object.entries(previewDados.chances_percentual_por_qualidade_final).map(([q, pct]) => (
                    <li key={q} className="rounded bg-black/30 px-2 py-1 text-xs">{q}: {pct.toFixed(2)}%</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs uppercase text-white/50">Ingredientes nessa qualidade</p>
                <ul className="text-xs">
                  {previewDados.ingredientes.map((ing, i) => (
                    <li key={i}>{ing.nome_item ?? "(sem item resolvido)"} x{ing.quantidade_necessaria}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}

      <SeletorItem
        aberto={Boolean(seletorAberto)}
        onFechar={() => setSeletorAberto(null)}
        tipoItem={form.categoria_equipamento ? categoriaParaTipoItem(form.categoria_equipamento) : undefined}
        raridade={seletorAberto ?? undefined}
        onSelecionar={(item) => seletorAberto && salvarResultado(seletorAberto as ForgeQualidade, item)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------
// Fundição / Barras
// ---------------------------------------------------------------------
function AbaBarras() {
  const [linhas, setLinhas] = useState<ForgeBarraLinhaApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [celulaAberta, setCelulaAberta] = useState<{ idRecurso: number; qualidade: string } | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true); setErro("");
    try { setLinhas(await listarForgeBarrasAdmin()); } catch (error) { setErro(mensagemDeErroAdmin(error, "Não foi possível carregar as barras.")); } finally { setCarregando(false); }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  async function salvar(item: AdminItemApi) {
    if (!celulaAberta) return;
    try { await salvarForgeBarraAdmin(celulaAberta.idRecurso, celulaAberta.qualidade, item.id); await carregar(); } catch (error) { setErro(mensagemDeErroAdmin(error, "Não foi possível salvar o mapeamento.")); }
  }
  async function remover(idRecurso: number, qualidade: string) {
    if (!window.confirm("Remover esse mapeamento pode quebrar blueprints existentes que dependem dele. Continuar?")) return;
    try { await removerForgeBarraAdmin(idRecurso, qualidade); await carregar(); } catch (error) { setErro(mensagemDeErroAdmin(error, "Não foi possível remover.")); }
  }

  if (carregando) return <p className="text-sm text-white/60">Carregando...</p>;

  return (
    <div className="flex flex-col gap-3">
      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      <p className="text-sm text-white/60">Recurso de Mineração × Qualidade → Item Barra. Células vazias (destacadas) impedem blueprints de resolver aquele ingrediente.</p>
      <div className="overflow-x-auto rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80">
        <table className="w-full text-left text-xs text-white">
          <thead><tr className="border-b border-white/10 text-white/50"><th className="px-2 py-2">Recurso</th>{FORGE_QUALIDADES.map((q) => <th key={q} className="px-2 py-2">{q}</th>)}</tr></thead>
          <tbody>
            {linhas.map((linha) => (
              <tr key={linha.id_recurso} className="border-b border-white/5">
                <td className="px-2 py-2 font-bold">{linha.nome_recurso}</td>
                {linha.qualidades.map(({ qualidade, item }) => (
                  <td key={qualidade} className={`px-2 py-2 ${!item ? "bg-red-900/20" : ""}`}>
                    {item ? (
                      <div className="flex items-center gap-1">
                        <span>{item.nome}</span>
                        <button type="button" onClick={() => remover(linha.id_recurso, qualidade)} className="text-red-400 hover:underline">×</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setCelulaAberta({ idRecurso: linha.id_recurso, qualidade })} className="text-[#F3B43F] hover:underline">+ definir</button>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SeletorItem aberto={Boolean(celulaAberta)} onFechar={() => setCelulaAberta(null)} raridade={celulaAberta?.qualidade} onSelecionar={salvar} />
    </div>
  );
}

// ---------------------------------------------------------------------
// Pergaminhos
// ---------------------------------------------------------------------
function scrollFormVazio(): { bonus_percentual: number; nivel_forja_minimo: number; tempo_segundos: number } {
  return { bonus_percentual: 5, nivel_forja_minimo: 1, tempo_segundos: 60 };
}

function AbaPergaminhos() {
  const [itens, setItens] = useState<ForgeScrollApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState(scrollFormVazio());
  const [itemNovo, setItemNovo] = useState<AdminItemApi | null>(null);
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true); setErro("");
    try { setItens(await listarForgeScrollsAdmin()); } catch (error) { setErro(mensagemDeErroAdmin(error, "Não foi possível carregar os pergaminhos.")); } finally { setCarregando(false); }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  function abrirCriacao() { setEditandoId(null); setForm(scrollFormVazio()); setItemNovo(null); setMostrarForm(true); setMensagem(""); }
  function abrirEdicao(s: ForgeScrollApi) { setEditandoId(s.id_item); setForm({ bonus_percentual: s.bonus_percentual, nivel_forja_minimo: s.nivel_forja_minimo, tempo_segundos: s.tempo_segundos }); setMostrarForm(true); setMensagem(""); }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true); setMensagem("");
    try {
      if (editandoId) {
        await atualizarForgeScrollAdmin(editandoId, form);
        setMensagem("Pergaminho atualizado.");
      } else {
        if (!itemNovo) { setMensagem("Selecione o Item do pergaminho."); setSalvando(false); return; }
        await criarForgeScrollAdmin({ id_item: itemNovo.id, ...form });
        setMensagem("Pergaminho criado.");
      }
      setMostrarForm(false);
      await carregar();
    } catch (error) { setMensagem(mensagemDeErroAdmin(error, "Não foi possível salvar.")); } finally { setSalvando(false); }
  }

  async function alternarAtivo(s: ForgeScrollApi) {
    try { if (s.ativo) await desativarForgeScrollAdmin(s.id_item); else await reativarForgeScrollAdmin(s.id_item); await carregar(); } catch (error) { setErro(mensagemDeErroAdmin(error, "Não foi possível mudar o status.")); }
  }
  async function duplicar(s: ForgeScrollApi) {
    const idStr = window.prompt("ID do Item que vai receber a cópia deste pergaminho (precisa existir e ainda não ser um pergaminho):");
    const novoId = Number(idStr);
    if (!idStr || !Number.isInteger(novoId)) return;
    try { await duplicarForgeScrollAdmin(s.id_item, novoId); await carregar(); } catch (error) { setErro(mensagemDeErroAdmin(error, "Não foi possível duplicar.")); }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60">{itens.length} pergaminho(s)</p>
        <button type="button" onClick={abrirCriacao} className={BTN}>+ Novo pergaminho</button>
      </div>
      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}

      <div className="overflow-x-auto rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80">
        <table className="w-full text-left text-sm text-white">
          <thead><tr className="border-b border-white/10 text-xs uppercase text-white/50"><th className="px-3 py-2">Item</th><th className="px-3 py-2">Bônus</th><th className="px-3 py-2">Nv. mín.</th><th className="px-3 py-2">Tempo</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Ações</th></tr></thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-white/50">Carregando...</td></tr>
            ) : itens.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-white/50">Nenhum pergaminho cadastrado.</td></tr>
            ) : (
              itens.map((s) => (
                <tr key={s.id_item} className="border-b border-white/5">
                  <td className="px-3 py-2 font-bold">{s.item?.nome ?? `Item #${s.id_item}`}</td>
                  <td className="px-3 py-2">+{s.bonus_percentual}%{s.excede_cap_sozinho && <span className="ml-2 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-red-300">Excede cap</span>}</td>
                  <td className="px-3 py-2">{s.nivel_forja_minimo}</td>
                  <td className="px-3 py-2">{s.tempo_segundos}s</td>
                  <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${s.ativo ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/50"}`}>{s.ativo ? "Ativo" : "Inativo"}</span></td>
                  <td className="px-3 py-2"><div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => abrirEdicao(s)} className="text-[#F3B43F] hover:underline">Editar</button>
                    <button type="button" onClick={() => duplicar(s)} className="text-white/70 hover:underline">Duplicar</button>
                    <button type="button" onClick={() => alternarAtivo(s)} className="text-white/70 hover:underline">{s.ativo ? "Desativar" : "Reativar"}</button>
                  </div></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMostrarForm(false)}>
          <form onSubmit={salvar} onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-[#F3B43F]">{editandoId ? "Editar pergaminho" : "Novo pergaminho"}</p>
            {mensagem && <p className="text-sm text-[#F3B43F]">{mensagem}</p>}
            {!editandoId && (
              <div>
                <p className="mb-1 text-xs">Item do pergaminho</p>
                {itemNovo ? <p className="text-sm">{itemNovo.nome} (#{itemNovo.id})</p> : <p className="text-xs text-white/50">Nenhum selecionado</p>}
                <button type="button" onClick={() => setSeletorAberto(true)} className="text-xs text-[#F3B43F] hover:underline">Selecionar Item</button>
              </div>
            )}
            <label className="flex flex-col gap-1 text-xs">Bônus de chance (%)<input type="number" min={0} className={INPUT} value={form.bonus_percentual} onChange={(e) => setForm((f) => ({ ...f, bonus_percentual: Number(e.target.value) }))} /></label>
            <label className="flex flex-col gap-1 text-xs">Nível Forja mínimo<input type="number" min={1} max={10} className={INPUT} value={form.nivel_forja_minimo} onChange={(e) => setForm((f) => ({ ...f, nivel_forja_minimo: Number(e.target.value) }))} /></label>
            <label className="flex flex-col gap-1 text-xs">Tempo de fabricação (s)<input type="number" min={1} className={INPUT} value={form.tempo_segundos} onChange={(e) => setForm((f) => ({ ...f, tempo_segundos: Number(e.target.value) }))} /></label>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setMostrarForm(false)} className={BTN_GHOST}>Cancelar</button>
              <button type="submit" disabled={salvando} className={BTN}>{salvando ? "Salvando..." : "Salvar"}</button>
            </div>
          </form>
        </div>
      )}
      <SeletorItem aberto={seletorAberto} onFechar={() => setSeletorAberto(false)} onSelecionar={setItemNovo} />
    </div>
  );
}

// ---------------------------------------------------------------------
// Refinamento — Simulador obrigatório (§9.1), backend real
// ---------------------------------------------------------------------
function AbaRefinamento() {
  const [categoria, setCategoria] = useState<ForgeCategoria>("Arma");
  const [qualidade, setQualidade] = useState<ForgeQualidade>("Raro");
  const [refinamentoAtual, setRefinamentoAtual] = useState(0);
  const [nivelForja, setNivelForja] = useState(5);
  const [resultado, setResultado] = useState<ForgeSimulacaoRefinamentoApi | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function simular() {
    setCarregando(true); setErro("");
    try { setResultado(await previewForgeRefinamentoAdmin({ categoria, qualidade, refinamentoAtual, nivelForja })); } catch (error) { setErro(mensagemDeErroAdmin(error, "Não foi possível simular.")); } finally { setCarregando(false); }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className={CARD}>
        <p className="mb-3 font-imFeel text-xl text-[#F3B43F]">Simulador de Refinamento</p>
        <p className="mb-3 text-xs text-white/50">Chama as MESMAS funções do gameplay real — nenhuma fórmula é reimplementada no frontend.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs">Categoria<select className={INPUT} value={categoria} onChange={(e) => setCategoria(e.target.value as ForgeCategoria)}>{FORGE_CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
          <label className="flex flex-col gap-1 text-xs">Qualidade<select className={INPUT} value={qualidade} onChange={(e) => setQualidade(e.target.value as ForgeQualidade)}>{FORGE_QUALIDADES.map((q) => <option key={q} value={q}>{q}</option>)}</select></label>
          <label className="flex flex-col gap-1 text-xs">Refino atual (0-9)<input type="number" min={0} max={9} className={INPUT} value={refinamentoAtual} onChange={(e) => setRefinamentoAtual(Number(e.target.value))} /></label>
          <label className="flex flex-col gap-1 text-xs">Nível de Forja (1-10)<input type="number" min={1} max={10} className={INPUT} value={nivelForja} onChange={(e) => setNivelForja(Number(e.target.value))} /></label>
        </div>
        <div className="mt-3"><button type="button" onClick={simular} disabled={carregando} className={BTN}>{carregando ? "Calculando..." : "Simular"}</button></div>
        {erro && <p className="mt-2 text-sm text-red-400">{erro}</p>}
      </div>

      {resultado && (
        <div className={CARD}>
          <p className="mb-2 font-imFeel text-lg text-[#F3B43F]">Resultado — alvo +{resultado.alvo}{resultado.garantido && " (garantido)"}</p>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            <p>Chance base: {resultado.chance_base_percentual.toFixed(2)}%</p>
            <p>Bônus Forja: +{resultado.bonus_forja_percentual.toFixed(2)}%</p>
            <p>Bônus pergaminho: +{resultado.bonus_pergaminho_percentual.toFixed(2)}%</p>
            <p className="font-bold text-[#F3B43F]">Chance final: {resultado.chance_final_percentual.toFixed(2)}%</p>
            <p>Cap vigente: {resultado.cap_percentual.toFixed(2)}%</p>
            <p>Custo: {resultado.custo_gold} Gold</p>
            <p>XP sucesso/falha: {resultado.xp_sucesso} / {resultado.xp_falha}</p>
            {resultado.bonus_atributo_apos_sucesso_percentual != null && <p>Bônus de atributo após sucesso: +{resultado.bonus_atributo_apos_sucesso_percentual}%</p>}
          </div>
          {resultado.materiais.length > 0 && (
            <div className="mt-2">
              <p className="text-xs uppercase text-white/50">Materiais</p>
              <ul className="text-sm">{resultado.materiais.map((m, i) => <li key={i}>{m.nome ?? m.papel} x{m.quantidade}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Balanceamento (Fundição/Fabricação/Refinamento/Progressão) — §9/§10/§11
// ---------------------------------------------------------------------
function AbaBalanceamento() {
  const [dados, setDados] = useState<ForgeBalanceCompletoApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [impacto, setImpacto] = useState<Awaited<ReturnType<typeof previewForgeImpactoProgressaoAdmin>> | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true); setErro("");
    try { setDados(await obterForgeBalanceAdmin()); } catch (error) { setErro(mensagemDeErroAdmin(error, "Não foi possível carregar o balanceamento.")); } finally { setCarregando(false); }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  if (carregando) return <p className="text-sm text-white/60">Carregando...</p>;
  if (!dados) return <p className="text-sm text-red-400">{erro}</p>;

  const fabricacao = dados["forge.crafting"].atual as { CHANCE_QUALIDADE_SUPERIOR_FABRICACAO_PPM_POR_NIVEL: Record<string, Record<string, number>> };

  async function salvarTabelaFabricacao(nivel: string, tabela: Record<string, number>) {
    setSalvando(true); setMensagem(""); setErro("");
    try {
      await atualizarForgeBalanceAdmin("forge.crafting", { CHANCE_QUALIDADE_SUPERIOR_FABRICACAO_PPM_POR_NIVEL: { [nivel]: tabela } });
      setMensagem(`Nível ${nivel} de fabricação salvo.`);
      await carregar();
    } catch (error) { setErro(mensagemDeErroAdmin(error, "Falha ao salvar — confira se a soma fecha 1.000.000 PPM.")); } finally { setSalvando(false); }
  }

  return (
    <div className="flex flex-col gap-4">
      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      {mensagem && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-[#F3B43F]">{mensagem}</p>}

      <div className={CARD}>
        <p className="mb-2 font-imFeel text-xl text-[#F3B43F]">RNG de Fabricação — soma por nível precisa fechar 1.000.000 PPM</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white">
            <thead><tr className="text-white/50"><th className="px-2 py-1">Nv.</th><th className="px-2 py-1">Mesma</th><th className="px-2 py-1">+1</th><th className="px-2 py-1">+2</th><th className="px-2 py-1">+3</th><th className="px-2 py-1">+4</th><th className="px-2 py-1">+5</th><th className="px-2 py-1">Soma</th><th className="px-2 py-1"></th></tr></thead>
            <tbody>
              {Object.entries(fabricacao.CHANCE_QUALIDADE_SUPERIOR_FABRICACAO_PPM_POR_NIVEL).map(([nivel, tabela]) => (
                <LinhaFabricacao key={nivel} nivel={nivel} tabelaInicial={tabela} onSalvar={salvarTabelaFabricacao} salvando={salvando} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={CARD}>
        <p className="mb-2 font-imFeel text-xl text-[#F3B43F]">Progressão — Curva de XP da Forja</p>
        <p className="mb-2 text-xs text-white/50">NIVEL_MAXIMO não é editável na V1. Editar XP por etapa exige preview de impacto + confirmação.</p>
        <PainelProgressao onImpacto={setImpacto} impacto={impacto} />
      </div>
    </div>
  );
}

function LinhaFabricacao({ nivel, tabelaInicial, onSalvar, salvando }: { nivel: string; tabelaInicial: Record<string, number>; onSalvar: (nivel: string, tabela: Record<string, number>) => void; salvando: boolean }) {
  const [tabela, setTabela] = useState(tabelaInicial);
  const chaves = ["mesma", "mais1", "mais2", "mais3", "mais4", "mais5"];
  const soma = chaves.reduce((s, k) => s + (tabela[k] ?? 0), 0);
  return (
    <tr className={`border-b border-white/5 ${soma !== 1_000_000 ? "bg-red-900/20" : ""}`}>
      <td className="px-2 py-1 font-bold">{nivel}</td>
      {chaves.map((k) => (
        <td key={k} className="px-2 py-1"><input type="number" min={0} className="w-20 rounded border border-white/20 bg-black/30 px-1 py-0.5 text-xs text-white" value={tabela[k] ?? 0} onChange={(e) => setTabela((t) => ({ ...t, [k]: Number(e.target.value) }))} /></td>
      ))}
      <td className={`px-2 py-1 font-bold ${soma === 1_000_000 ? "text-green-300" : "text-red-400"}`}>{soma.toLocaleString("pt-BR")}</td>
      <td className="px-2 py-1"><button type="button" disabled={salvando || soma !== 1_000_000} onClick={() => onSalvar(nivel, tabela)} className="text-[#F3B43F] hover:underline disabled:opacity-40">Salvar</button></td>
    </tr>
  );
}

function PainelProgressao({ onImpacto, impacto }: { onImpacto: (i: Awaited<ReturnType<typeof previewForgeImpactoProgressaoAdmin>>) => void; impacto: Awaited<ReturnType<typeof previewForgeImpactoProgressaoAdmin>> | null }) {
  const [etapas, setEtapas] = useState<Record<string, number>>({});
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    obterForgeBalanceAdmin().then((d) => setEtapas((d["forge.progression"].atual as { XP_NECESSARIO_POR_ETAPA: Record<string, number> }).XP_NECESSARIO_POR_ETAPA)).catch(() => {});
  }, []);

  async function verImpacto() {
    setCarregando(true); setErro("");
    try { onImpacto(await previewForgeImpactoProgressaoAdmin(etapas)); } catch (error) { setErro(mensagemDeErroAdmin(error, "Não foi possível calcular o impacto.")); } finally { setCarregando(false); }
  }

  async function salvar() {
    setSalvando(true); setErro(""); setMensagem("");
    try {
      await atualizarForgeBalanceAdmin("forge.progression", { XP_NECESSARIO_POR_ETAPA: etapas, confirmado: true });
      setMensagem("Curva de XP salva.");
    } catch (error) { setErro(mensagemDeErroAdmin(error, "Não foi possível salvar.")); } finally { setSalvando(false); }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(etapas).map(([etapa, xp]) => (
          <label key={etapa} className="flex flex-col gap-1 text-xs">Nv.{etapa}→{Number(etapa) + 1}<input type="number" min={1} className={`${INPUT} w-24`} value={xp} onChange={(e) => setEtapas((t) => ({ ...t, [etapa]: Number(e.target.value) }))} /></label>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={verImpacto} disabled={carregando} className={BTN_GHOST}>Ver preview de impacto</button>
      </div>
      {erro && <p className="mt-2 text-sm text-red-400">{erro}</p>}
      {mensagem && <p className="mt-2 text-sm text-[#F3B43F]">{mensagem}</p>}

      {impacto && (
        <div className="mt-3 rounded-lg bg-black/30 p-3 text-sm text-white/80">
          <p>{impacto.total_personagens} personagem(ns) com progresso de Forja.</p>
          <p className="text-green-300">{impacto.personagens_sobem} sobem de nível</p>
          <p className="text-red-400">{impacto.personagens_descem} descem de nível</p>
          {impacto.blueprints_potencialmente_afetados.length > 0 && (
            <p className="mt-1 text-xs text-white/50">{impacto.blueprints_potencialmente_afetados.length} blueprint(s) com requisito de nível &gt; 1 podem mudar de elegibilidade.</p>
          )}
          <label className="mt-3 flex items-center gap-2 text-xs">
            <input type="checkbox" checked={confirmar} onChange={(e) => setConfirmar(e.target.checked)} />
            Revisei o impacto acima e confirmo a mudança da curva de XP.
          </label>
          <button type="button" disabled={!confirmar || salvando} onClick={salvar} className={`${BTN} mt-2`}>{salvando ? "Salvando..." : "Salvar nova curva"}</button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Métricas
// ---------------------------------------------------------------------
function AbaMetricas() {
  const [dados, setDados] = useState<ForgeMetricasApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    obterForgeMetricasAdmin().then(setDados).catch((error) => setErro(mensagemDeErroAdmin(error, "Não foi possível carregar as métricas."))).finally(() => setCarregando(false));
  }, []);

  if (carregando) return <p className="text-sm text-white/60">Carregando...</p>;
  if (!dados) return <p className="text-sm text-red-400">{erro}</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className={CARD}>
          <p className="font-imFeel text-lg text-[#F3B43F]">Operações (24h)</p>
          <ul className="mt-2 space-y-1 text-sm text-white/80">{dados.porTipo24h.map((l) => <li key={l.tipo_acao}>{l.tipo_acao}: {l.total}</li>)}</ul>
        </div>
        <div className={CARD}>
          <p className="font-imFeel text-lg text-[#F3B43F]">Gold removido (Refinamento)</p>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            <li>24h: {dados.goldRemovido.gold_removido_24h}</li>
            <li>7 dias: {dados.goldRemovido.gold_removido_7d}</li>
            <li>Total: {dados.goldRemovido.gold_removido_total}</li>
          </ul>
        </div>
      </div>
      <div className={CARD}>
        <p className="font-imFeel text-lg text-[#F3B43F]">Fabricações por blueprint</p>
        {dados.fabricacoesPorBlueprint.length === 0 ? <p className="mt-2 text-sm text-white/50">Sem dados ainda.</p> : (
          <ul className="mt-2 space-y-1 text-sm text-white/80">{dados.fabricacoesPorBlueprint.map((f) => <li key={f.id_blueprint ?? "null"} className="flex justify-between"><span>{f.nome ?? `#${f.id_blueprint}`}</span><span>{f.total} ({f.com_upgrade_qualidade} c/ upgrade)</span></li>)}</ul>
        )}
      </div>
      <div className={CARD}>
        <p className="font-imFeel text-lg text-[#F3B43F]">Refino por alvo — sucesso observado</p>
        {dados.refinoPorAlvo.length === 0 ? <p className="mt-2 text-sm text-white/50">Sem dados ainda.</p> : (
          <ul className="mt-2 space-y-1 text-sm text-white/80">{dados.refinoPorAlvo.map((r) => <li key={r.alvo} className="flex justify-between"><span>+{r.alvo}</span><span>{r.tentativas} tentativas · {(r.taxa_sucesso_observada * 100).toFixed(1)}% sucesso</span></li>)}</ul>
        )}
      </div>
      <p className="text-xs text-white/40">
        Escopo reduzido nesta V1: &quot;materiais consumidos&quot; linha-a-linha e &quot;tempo médio até coleta&quot; não são instrumentados (ver relatório de entrega).
      </p>
    </div>
  );
}
