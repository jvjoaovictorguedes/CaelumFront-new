"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  atualizarAlchemyEfeitoAdmin,
  atualizarAlchemyRecipeAdmin,
  criarAlchemyEfeitoAdmin,
  criarAlchemyRecipeAdmin,
  excluirAlchemyEfeitoAdmin,
  listarAlchemyEffectTypesAdmin,
  listarAlchemyEfeitosDoItemAdmin,
  listarAlchemyRecipesAdmin,
  mensagemDeErroAdmin,
  preverAlchemyEfeitosAdmin,
  type AlchemyCategoriaReceita,
  type AlchemyEffectKey,
  type AlchemyModoDesbloqueio,
  type AlchemyPreviewApi,
  type AlchemyRaridadeReceita,
  type AlchemyRecipeAdminApi,
  type ConsumableEffectAdminApi,
  type EffectTypeMetadataApi,
  type PayloadAlchemyRecipeAdmin,
  type PayloadAlchemyRecipeIngredienteAdmin,
  type PayloadConsumableEffectAdmin,
} from "@/lib/api/admin";
import { listarItensParaSelecaoAdmin, type AdminItemSelecionavelApi } from "@/lib/api/admin";
import { ItemSelect, formatarItemComId, useItensParaSelecaoAdmin } from "@/components/admin/ItemPicker";

const CATEGORIAS: AlchemyCategoriaReceita[] = ["POCAO", "ANTIDOTO", "TONICO", "ELIXIR", "PREPARADO"];
const ROTULO_CATEGORIA: Record<AlchemyCategoriaReceita, string> = {
  POCAO: "Poção",
  ANTIDOTO: "Antídoto",
  TONICO: "Tônico",
  ELIXIR: "Elixir",
  PREPARADO: "Preparado",
};
const MODOS_DESBLOQUEIO: AlchemyModoDesbloqueio[] = ["NIVEL", "DESCOBERTA"];
const ROTULO_MODO: Record<AlchemyModoDesbloqueio, string> = {
  NIVEL: "Por nível de Alquimia",
  DESCOBERTA: "Por descoberta",
};
const RARIDADES_RECEITA: AlchemyRaridadeReceita[] = ["Comum", "Raro", "Lendario"];

const ROTULO_EFFECT_KEY: Record<AlchemyEffectKey, string> = {
  CLEANSE_STATUS: "Remover status específico",
  CLEANSE_CATEGORY: "Remover categoria de status (DoT/Controle)",
  HEAL_HP_FLAT: "Curar Vida (valor fixo)",
  HEAL_HP_PERCENT: "Curar Vida (% do máximo)",
  RESTORE_MANA_FLAT: "Restaurar Mana (valor fixo)",
  RESTORE_MANA_PERCENT: "Restaurar Mana (% do máximo)",
  APPLY_COMBAT_BUFF: "Conceder buff de combate",
  GRANT_SHIELD: "Conceder escudo",
};
const ROTULO_ATRIBUTO_BUFF: Record<string, string> = {
  DANO_SAIDA_PCT: "Dano de saída (%)",
  DEFESA_FLAT: "Defesa (valor fixo)",
  REGEN_HP_FLAT: "Regen. de Vida por turno (valor fixo)",
  REGEN_HP_PERCENT: "Regen. de Vida por turno (% do máximo)",
  REGEN_MANA_FLAT: "Regen. de Mana por turno (valor fixo)",
  REGEN_MANA_PERCENT: "Regen. de Mana por turno (% do máximo)",
  STATUS_RESISTANCE_PCT: "Resistência a status (%)",
};
const ROTULO_CATEGORIA_CLEANSE: Record<string, string> = { DOT: "Dano ao longo do tempo", CONTROLE: "Controle" };

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#F3B43F]/80">{titulo}</p>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm text-white ${props.className ?? ""}`} />;
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm text-white ${props.className ?? ""}`} />;
}

// Construtor de Efeitos (spec Caldeirão §12) — um ConsumableEffect por vez,
// linha editável inline (mesmo padrão da lista de ingredientes acima).
// `config` muda de forma conforme effect_key — nunca monta um JSON livre no
// admin, sempre os campos que listEffectTypes() diz que aquela chave exige.
function EfeitoForm({
  tipos,
  efeitoInicial,
  onSalvar,
  onCancelar,
  salvando,
}: {
  tipos: EffectTypeMetadataApi[];
  efeitoInicial: ConsumableEffectAdminApi | null;
  onSalvar: (payload: PayloadConsumableEffectAdmin) => void;
  onCancelar: () => void;
  salvando: boolean;
}) {
  const configInicial = (efeitoInicial?.config ?? {}) as Record<string, string | undefined>;
  const [effectKey, setEffectKey] = useState<AlchemyEffectKey>(efeitoInicial?.effect_key ?? tipos[0]?.effect_key ?? "HEAL_HP_FLAT");
  const meta = tipos.find((t) => t.effect_key === effectKey);
  const [magnitude, setMagnitude] = useState<number>(efeitoInicial?.magnitude ?? 10);
  const [duracao, setDuracao] = useState<number>(efeitoInicial?.duration_turns ?? 1);
  const [atributo, setAtributo] = useState<string>(configInicial.atributo ?? meta?.atributos_buff?.[0] ?? "");
  const [statusKey, setStatusKey] = useState<string>(configInicial.status_key ?? meta?.status_keys?.[0] ?? "");
  const [categoria, setCategoria] = useState<string>(configInicial.category ?? meta?.categorias?.[0] ?? "");
  const [ativo, setAtivo] = useState<boolean>(efeitoInicial?.ativo ?? true);

  function trocarEffectKey(novaChave: AlchemyEffectKey) {
    setEffectKey(novaChave);
    const novoMeta = tipos.find((t) => t.effect_key === novaChave);
    setAtributo(novoMeta?.atributos_buff?.[0] ?? "");
    setStatusKey(novoMeta?.status_keys?.[0] ?? "");
    setCategoria(novoMeta?.categorias?.[0] ?? "");
  }

  function montarConfig(): Record<string, unknown> | null {
    if (!meta) return null;
    if (meta.exige_atributo_buff) return { atributo };
    if (meta.exige_status_key) return { status_key: statusKey };
    if (meta.exige_category) return { category: categoria };
    return null;
  }

  function submeter(e: React.FormEvent) {
    e.preventDefault();
    onSalvar({
      effect_key: effectKey,
      magnitude: meta?.exige_magnitude ? magnitude : 0,
      duration_turns: meta?.exige_duracao ? duracao : null,
      config: montarConfig(),
      ativo,
    });
  }

  return (
    <form onSubmit={submeter} className="flex flex-col gap-2 rounded-lg border border-[#F3B43F]/40 bg-black/20 p-3">
      <label className="flex flex-col gap-1 text-xs">Efeito
        <Select value={effectKey} onChange={(e) => trocarEffectKey(e.target.value as AlchemyEffectKey)}>
          {tipos.map((t) => <option key={t.effect_key} value={t.effect_key}>{ROTULO_EFFECT_KEY[t.effect_key]}</option>)}
        </Select>
      </label>

      {meta?.exige_magnitude && (
        <label className="flex flex-col gap-1 text-xs">Magnitude
          <Input type="number" step="any" value={magnitude} onChange={(e) => setMagnitude(Number(e.target.value))} />
        </label>
      )}

      {meta?.exige_duracao && (
        <label className="flex flex-col gap-1 text-xs">Duração (turnos)
          <Input type="number" min={1} value={duracao} onChange={(e) => setDuracao(Number(e.target.value))} />
        </label>
      )}

      {meta?.exige_atributo_buff && (
        <label className="flex flex-col gap-1 text-xs">Atributo do buff
          <Select value={atributo} onChange={(e) => setAtributo(e.target.value)}>
            {(meta.atributos_buff ?? []).map((a) => <option key={a} value={a}>{ROTULO_ATRIBUTO_BUFF[a] ?? a}</option>)}
          </Select>
        </label>
      )}

      {meta?.exige_status_key && (
        <label className="flex flex-col gap-1 text-xs">Status a remover
          <Select value={statusKey} onChange={(e) => setStatusKey(e.target.value)}>
            {(meta.status_keys ?? []).map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </label>
      )}

      {meta?.exige_category && (
        <label className="flex flex-col gap-1 text-xs">Categoria a remover
          <Select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {(meta.categorias ?? []).map((c) => <option key={c} value={c}>{ROTULO_CATEGORIA_CLEANSE[c] ?? c}</option>)}
          </Select>
        </label>
      )}

      {efeitoInicial && (
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
          Ativo
        </label>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancelar} className="rounded-lg border border-white/20 px-3 py-1 text-xs text-white/70 hover:bg-white/10">Cancelar</button>
        <button type="submit" disabled={salvando} className="rounded-lg bg-[#BC8418] px-3 py-1 text-xs font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
          {salvando ? "Salvando..." : efeitoInicial ? "Salvar efeito" : "Adicionar efeito"}
        </button>
      </div>
    </form>
  );
}

function resumoEfeito(efeito: ConsumableEffectAdminApi): string {
  const config = (efeito.config ?? {}) as Record<string, string | undefined>;
  switch (efeito.effect_key) {
    case "APPLY_COMBAT_BUFF":
      return `${ROTULO_ATRIBUTO_BUFF[config.atributo ?? ""] ?? config.atributo} ${efeito.magnitude} por ${efeito.duration_turns} turno(s)`;
    case "GRANT_SHIELD":
      return `${efeito.magnitude} de escudo por ${efeito.duration_turns} turno(s)`;
    case "CLEANSE_STATUS":
      return `Remove ${config.status_key}`;
    case "CLEANSE_CATEGORY":
      return `Remove categoria ${ROTULO_CATEGORIA_CLEANSE[config.category ?? ""] ?? config.category}`;
    default:
      return `${efeito.magnitude}`;
  }
}

// Preview server-side (spec Caldeirão §19) — simula o uso do item com
// vida/mana HIPOTÉTICAS informadas pelo admin, nunca lendo/gravando
// nenhum Character real. Mostra antes/depois lado a lado, consolidando
// todos os efeitos do item numa visão só (cura, buffs, escudo, resistência).
function PreviewPanel({ idItem }: { idItem: number }) {
  const [vidaMaxima, setVidaMaxima] = useState(100);
  const [vidaAtual, setVidaAtual] = useState(100);
  const [manaMaxima, setManaMaxima] = useState(100);
  const [manaAtual, setManaAtual] = useState(100);
  const [resultado, setResultado] = useState<AlchemyPreviewApi | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function simular() {
    setCarregando(true);
    setErro("");
    try {
      const preview = await preverAlchemyEfeitosAdmin(idItem, { vidaAtual, vidaMaxima, manaAtual, manaMaxima });
      setResultado(preview);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível simular os efeitos do item."));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-black/10 p-2">
      <p className="text-xs font-bold uppercase text-white/60">Preview (hipotético — não afeta nenhum personagem real)</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-[11px]">Vida máxima
          <Input type="number" min={1} value={vidaMaxima} onChange={(e) => setVidaMaxima(Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1 text-[11px]">Vida atual
          <Input type="number" min={0} value={vidaAtual} onChange={(e) => setVidaAtual(Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1 text-[11px]">Mana máxima
          <Input type="number" min={1} value={manaMaxima} onChange={(e) => setManaMaxima(Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1 text-[11px]">Mana atual
          <Input type="number" min={0} value={manaAtual} onChange={(e) => setManaAtual(Number(e.target.value))} />
        </label>
      </div>
      <button
        type="button"
        onClick={simular}
        disabled={carregando}
        className="self-start rounded-lg border border-white/20 px-3 py-1 text-xs text-white/70 hover:bg-white/10 disabled:opacity-50"
      >
        {carregando ? "Simulando..." : "Simular uso"}
      </button>
      {erro && <p className="text-xs text-red-400">{erro}</p>}
      {resultado && (
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-white/10 p-2 text-xs">
          <div className="flex flex-col gap-0.5">
            <p className="font-bold text-white/70">Antes</p>
            <p>Vida: {resultado.antes.vidaAtual}</p>
            <p>Mana: {resultado.antes.manaAtual}</p>
            <p>Escudo: {resultado.antes.escudo ? `${resultado.antes.escudo.valor} (${resultado.antes.escudo.remainingTurns}t)` : "—"}</p>
            <p>Dano de saída: x{resultado.antes.resumo.dano_saida_multiplicador}</p>
            <p>Defesa bônus: +{resultado.antes.resumo.defesa_bonus}</p>
            <p>Regen. Vida/turno: {resultado.antes.resumo.regen_vida_por_turno}</p>
            <p>Regen. Mana/turno: {resultado.antes.resumo.regen_mana_por_turno}</p>
            <p>Resist. a status: {resultado.antes.resumo.status_resistance_chance}%</p>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="font-bold text-[#F3B43F]">Depois de usar</p>
            <p>Vida: {resultado.depois.vidaAtual} <span className="text-green-400">(+{resultado.curaVida})</span></p>
            <p>Mana: {resultado.depois.manaAtual} <span className="text-green-400">(+{resultado.curaMana})</span></p>
            <p>Escudo: {resultado.depois.escudo ? `${resultado.depois.escudo.valor} (${resultado.depois.escudo.remainingTurns}t)` : "—"}</p>
            <p>Dano de saída: x{resultado.depois.resumo.dano_saida_multiplicador}</p>
            <p>Defesa bônus: +{resultado.depois.resumo.defesa_bonus}</p>
            <p>Regen. Vida/turno: {resultado.depois.resumo.regen_vida_por_turno}</p>
            <p>Regen. Mana/turno: {resultado.depois.resumo.regen_mana_por_turno}</p>
            <p>Resist. a status: {resultado.depois.resumo.status_resistance_chance}%</p>
          </div>
          {resultado.log.length > 0 && (
            <div className="col-span-2 border-t border-white/10 pt-2">
              <p className="font-bold text-white/70">Log</p>
              <ul className="list-disc pl-4 text-white/60">
                {resultado.log.map((linha, indice) => <li key={indice}>{linha}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BotaoSalvar({ disabled }: { disabled: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="rounded-lg bg-[#BC8418] px-4 py-1.5 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50"
    >
      {disabled ? "Salvando..." : "Salvar"}
    </button>
  );
}

const FORM_VAZIO: PayloadAlchemyRecipeAdmin = {
  key: "",
  nome: "",
  descricao: "",
  categoria: "POCAO",
  id_item_resultado: undefined,
  quantidade_resultado: 1,
  nivel_alquimia_minimo: 1,
  xp_alquimia: 10,
  custo_ouro: 0,
  modo_desbloqueio: "NIVEL",
  ativo: true,
  ordem: 0,
  ingredientes: [],
  id_item_receita: null,
  raridade_receita: null,
  negociavel_receita: false,
  consome_ao_aprender: true,
  pista_publica: "",
};

export default function AdminAlchemyClient() {
  const [receitas, setReceitas] = useState<AlchemyRecipeAdminApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<AlchemyRecipeAdminApi | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<PayloadAlchemyRecipeAdmin>(FORM_VAZIO);

  // Itens Consumível pro resultado da receita, catálogo geral (qualquer
  // tipo) pros ingredientes, e itens tipo Receita pra fórmula física
  // (spec §8.1/§11.1 — o "pergaminho" em si é um Item separado).
  const [itensConsumiveis, setItensConsumiveis] = useState<AdminItemSelecionavelApi[]>([]);
  const [itensReceita, setItensReceita] = useState<AdminItemSelecionavelApi[]>([]);
  const { itens: itensGerais } = useItensParaSelecaoAdmin();

  // Construtor de Efeitos (spec Caldeirão §12) — metadados de effect_key
  // carregados uma vez (não dependem do item), lista de efeitos vivendo
  // junto do form (igual ingredientes), já que ambos só existem de fato
  // depois que a receita tem um id_item_resultado salvo.
  const [tiposDeEfeito, setTiposDeEfeito] = useState<EffectTypeMetadataApi[]>([]);
  const [efeitos, setEfeitos] = useState<ConsumableEffectAdminApi[]>([]);
  const [salvandoEfeito, setSalvandoEfeito] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [lista, consumiveis, receitasItens, tipos] = await Promise.all([
        listarAlchemyRecipesAdmin(),
        listarItensParaSelecaoAdmin({ tipo_item: "Consumivel" }),
        listarItensParaSelecaoAdmin({ tipo_item: "Receita" }),
        listarAlchemyEffectTypesAdmin(),
      ]);
      setReceitas(lista);
      setItensConsumiveis(consumiveis);
      setItensReceita(receitasItens);
      setTiposDeEfeito(tipos);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar as receitas de Alquimia."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Recarrega os efeitos sempre que o item de resultado selecionado no form
  // muda (inclui trocar pra um item diferente já existente, que pode já ter
  // efeitos configurados de outra tela/receita) — nunca fica com a lista do
  // item anterior.
  useEffect(() => {
    if (!mostrarForm || !form.id_item_resultado) {
      setEfeitos([]);
      return;
    }
    let cancelado = false;
    listarAlchemyEfeitosDoItemAdmin(form.id_item_resultado)
      .then((lista) => {
        if (!cancelado) setEfeitos(lista);
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [mostrarForm, form.id_item_resultado]);

  const [mostrarFormEfeito, setMostrarFormEfeito] = useState(false);
  const [efeitoEditando, setEfeitoEditando] = useState<ConsumableEffectAdminApi | null>(null);

  async function salvarEfeito(payload: PayloadConsumableEffectAdmin) {
    if (!form.id_item_resultado) return;
    setSalvandoEfeito(true);
    try {
      if (efeitoEditando) {
        await atualizarAlchemyEfeitoAdmin(efeitoEditando.id, payload);
      } else {
        await criarAlchemyEfeitoAdmin(form.id_item_resultado, payload);
      }
      const lista = await listarAlchemyEfeitosDoItemAdmin(form.id_item_resultado);
      setEfeitos(lista);
      setMostrarFormEfeito(false);
      setEfeitoEditando(null);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar o efeito."));
    } finally {
      setSalvandoEfeito(false);
    }
  }

  async function excluirEfeito(efeito: ConsumableEffectAdminApi) {
    if (!form.id_item_resultado) return;
    try {
      await excluirAlchemyEfeitoAdmin(efeito.id);
      const lista = await listarAlchemyEfeitosDoItemAdmin(form.id_item_resultado);
      setEfeitos(lista);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível excluir o efeito."));
    }
  }

  function abrirCriacao() {
    setEditando(null);
    setForm(FORM_VAZIO);
    setMostrarForm(true);
    setMostrarFormEfeito(false);
    setEfeitoEditando(null);
    setErro("");
  }

  function abrirEdicao(receita: AlchemyRecipeAdminApi) {
    setEditando(receita);
    setForm({
      nome: receita.nome,
      descricao: receita.descricao ?? "",
      categoria: receita.categoria,
      id_item_resultado: receita.id_item_resultado,
      quantidade_resultado: receita.quantidade_resultado,
      nivel_alquimia_minimo: receita.nivel_alquimia_minimo,
      xp_alquimia: receita.xp_alquimia,
      custo_ouro: receita.custo_ouro,
      modo_desbloqueio: receita.modo_desbloqueio,
      ativo: receita.ativo,
      ordem: receita.ordem,
      ingredientes: receita.ingredientes.map((i) => ({ id_item: i.id_item, quantidade: i.quantidade })),
      id_item_receita: receita.id_item_receita,
      raridade_receita: receita.raridade_receita,
      negociavel_receita: receita.negociavel_receita,
      consome_ao_aprender: receita.consome_ao_aprender,
      pista_publica: receita.pista_publica ?? "",
    });
    setMostrarForm(true);
    setMostrarFormEfeito(false);
    setEfeitoEditando(null);
    setErro("");
  }

  function adicionarIngrediente() {
    setForm((f) => ({ ...f, ingredientes: [...(f.ingredientes ?? []), { id_item: 0, quantidade: 1 }] }));
  }

  function removerIngrediente(indice: number) {
    setForm((f) => ({ ...f, ingredientes: (f.ingredientes ?? []).filter((_, i) => i !== indice) }));
  }

  function atualizarIngrediente(indice: number, patch: Partial<PayloadAlchemyRecipeIngredienteAdmin>) {
    setForm((f) => ({
      ...f,
      ingredientes: (f.ingredientes ?? []).map((ing, i) => (i === indice ? { ...ing, ...patch } : ing)),
    }));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      const ingredientesValidos = (form.ingredientes ?? []).filter((i) => i.id_item > 0);
      if (editando) {
        await atualizarAlchemyRecipeAdmin(editando.id, { ...form, ingredientes: ingredientesValidos });
      } else {
        if (!form.id_item_resultado) throw new Error("Escolha o item de resultado.");
        const key = form.key?.trim() || `receita_${Date.now()}`;
        await criarAlchemyRecipeAdmin({ ...form, key, ingredientes: ingredientesValidos });
      }
      setMostrarForm(false);
      setEditando(null);
      await carregar();
    } catch (error) {
      setErro(
        error instanceof Error && !("response" in error)
          ? error.message
          : mensagemDeErroAdmin(error, editando ? "Não foi possível salvar a receita." : "Não foi possível criar a receita."),
      );
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivo(receita: AlchemyRecipeAdminApi) {
    try {
      await atualizarAlchemyRecipeAdmin(receita.id, { ativo: !receita.ativo });
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível mudar o status da receita."));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link prefetch={false} href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Alquimia (Caldeirão)</h1>
        <p className="mt-1 text-sm text-white/60">Receitas do Caldeirão: item de resultado, ingredientes, custo e desbloqueio.</p>
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}

      <Secao titulo="Receitas">
        <button type="button" onClick={abrirCriacao} className="mb-3 rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
          + Nova receita
        </button>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm text-white">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-white/50">
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2">Categoria</th>
                <th className="px-3 py-2">Resultado</th>
                <th className="px-3 py-2">Ingredientes</th>
                <th className="px-3 py-2">Nv. mínimo</th>
                <th className="px-3 py-2">Desbloqueio</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr><td colSpan={8} className="px-3 py-4 text-center text-white/50">Carregando...</td></tr>
              ) : receitas.length === 0 ? (
                <tr><td colSpan={8} className="px-3 py-4 text-center text-white/50">Nenhuma receita cadastrada.</td></tr>
              ) : (
                receitas.map((r) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="px-3 py-2 font-bold">{r.nome}</td>
                    <td className="px-3 py-2">{ROTULO_CATEGORIA[r.categoria]}</td>
                    <td className="px-3 py-2">{r.item_resultado ? formatarItemComId(r.item_resultado.nome, r.item_resultado.id) : `#${r.id_item_resultado}`}</td>
                    <td className="px-3 py-2">
                      {r.ingredientes.length === 0
                        ? "—"
                        : r.ingredientes.map((i) => `${i.quantidade}x ${i.item?.nome ?? `#${i.id_item}`}`).join(", ")}
                    </td>
                    <td className="px-3 py-2">{r.nivel_alquimia_minimo}</td>
                    <td className="px-3 py-2">{ROTULO_MODO[r.modo_desbloqueio]}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${r.ativo ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/60"}`}>
                        {r.ativo ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td className="px-3 py-2 flex gap-3">
                      <button type="button" onClick={() => abrirEdicao(r)} className="text-[#F3B43F] hover:underline">Editar</button>
                      <button type="button" onClick={() => alternarAtivo(r)} className="text-white/70 hover:underline">{r.ativo ? "Desativar" : "Ativar"}</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Secao>

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4" onClick={() => { setMostrarForm(false); setEditando(null); }}>
          <form
            onSubmit={salvar}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-xl flex-col gap-3 rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl"
          >
            <p className="font-imFeel text-xl text-[#F3B43F]">{editando ? "Editar receita" : "Nova receita"}</p>

            {!editando && (
              <label className="flex flex-col gap-1 text-xs">Key (identificador único, opcional — gerado automaticamente se vazio)
                <Input value={form.key ?? ""} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))} />
              </label>
            )}
            <label className="flex flex-col gap-1 text-xs">Nome
              <Input required value={form.nome ?? ""} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1 text-xs">Descrição
              <Input value={form.descricao ?? ""} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1 text-xs">Categoria
              <Select value={form.categoria ?? "POCAO"} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value as AlchemyCategoriaReceita }))}>
                {CATEGORIAS.map((c) => <option key={c} value={c}>{ROTULO_CATEGORIA[c]}</option>)}
              </Select>
            </label>
            <label className="flex flex-col gap-1 text-xs">Item de resultado (precisa ser Consumível)
              <ItemSelect
                itens={itensConsumiveis}
                value={form.id_item_resultado ?? ""}
                onChange={(id) => setForm((f) => ({ ...f, id_item_resultado: id === "" ? undefined : id }))}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">Quantidade produzida
              <Input type="number" min={1} value={form.quantidade_resultado ?? 1} onChange={(e) => setForm((f) => ({ ...f, quantidade_resultado: Number(e.target.value) }))} />
            </label>
            <label className="flex flex-col gap-1 text-xs">Nível de Alquimia mínimo
              <Input type="number" min={1} value={form.nivel_alquimia_minimo ?? 1} onChange={(e) => setForm((f) => ({ ...f, nivel_alquimia_minimo: Number(e.target.value) }))} />
            </label>
            <label className="flex flex-col gap-1 text-xs">XP de Alquimia ao preparar
              <Input type="number" min={0} value={form.xp_alquimia ?? 0} onChange={(e) => setForm((f) => ({ ...f, xp_alquimia: Number(e.target.value) }))} />
            </label>
            <label className="flex flex-col gap-1 text-xs">Custo em ouro
              <Input type="number" min={0} value={form.custo_ouro ?? 0} onChange={(e) => setForm((f) => ({ ...f, custo_ouro: Number(e.target.value) }))} />
            </label>
            <label className="flex flex-col gap-1 text-xs">Modo de desbloqueio
              <Select value={form.modo_desbloqueio ?? "NIVEL"} onChange={(e) => setForm((f) => ({ ...f, modo_desbloqueio: e.target.value as AlchemyModoDesbloqueio }))}>
                {MODOS_DESBLOQUEIO.map((m) => <option key={m} value={m}>{ROTULO_MODO[m]}</option>)}
              </Select>
            </label>
            <label className="flex flex-col gap-1 text-xs">Ordem de exibição
              <Input type="number" value={form.ordem ?? 0} onChange={(e) => setForm((f) => ({ ...f, ordem: Number(e.target.value) }))} />
            </label>

            {form.modo_desbloqueio === "DESCOBERTA" && (
              <div className="flex flex-col gap-2 rounded-lg border border-white/10 p-2">
                <p className="text-xs font-bold uppercase text-white/60">Fórmula física (opcional)</p>
                <p className="text-[11px] text-white/50">
                  Vincula um Item do tipo Receita como pergaminho físico que ensina esta receita (Livro de Fórmulas). Deixe
                  em branco se esta receita só é concedida por outra via (Proeza, evento etc.).
                </p>
                <label className="flex flex-col gap-1 text-xs">Item da fórmula física (precisa ser do tipo Receita)
                  <ItemSelect
                    itens={itensReceita}
                    value={form.id_item_receita ?? ""}
                    onChange={(id) => setForm((f) => ({ ...f, id_item_receita: id === "" ? null : id }))}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs">Raridade da fórmula
                  <Select
                    value={form.raridade_receita ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, raridade_receita: (e.target.value || null) as AlchemyRaridadeReceita | null }))}
                  >
                    <option value="">—</option>
                    {RARIDADES_RECEITA.map((r) => <option key={r} value={r}>{r}</option>)}
                  </Select>
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={form.negociavel_receita ?? false}
                    onChange={(e) => setForm((f) => ({ ...f, negociavel_receita: e.target.checked }))}
                  />
                  Negociável (pode ser vendida/trocada entre jogadores)
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={form.consome_ao_aprender ?? true}
                    onChange={(e) => setForm((f) => ({ ...f, consome_ao_aprender: e.target.checked }))}
                  />
                  Consome o pergaminho ao aprender
                </label>
                <label className="flex flex-col gap-1 text-xs">Pista pública (exibida antes de descobrir a receita)
                  <Input value={form.pista_publica ?? ""} onChange={(e) => setForm((f) => ({ ...f, pista_publica: e.target.value }))} />
                </label>
              </div>
            )}

            <div className="flex flex-col gap-2 rounded-lg border border-white/10 p-2">
              <p className="text-xs font-bold uppercase text-white/60">Ingredientes</p>
              {(form.ingredientes ?? []).map((ing, indice) => (
                <div key={indice} className="flex items-center gap-2">
                  <div className="flex-1">
                    <ItemSelect
                      itens={itensGerais}
                      value={ing.id_item || ""}
                      onChange={(id) => atualizarIngrediente(indice, { id_item: id === "" ? 0 : id })}
                    />
                  </div>
                  <Input
                    type="number"
                    min={1}
                    className="w-20"
                    value={ing.quantidade}
                    onChange={(e) => atualizarIngrediente(indice, { quantidade: Number(e.target.value) })}
                  />
                  <button type="button" onClick={() => removerIngrediente(indice)} className="text-red-400 hover:underline">Remover</button>
                </div>
              ))}
              <button type="button" onClick={adicionarIngrediente} className="self-start rounded-lg border border-white/20 px-3 py-1 text-xs text-white/70 hover:bg-white/10">
                + Adicionar ingrediente
              </button>
            </div>

            {form.id_item_resultado ? (
              <div className="flex flex-col gap-2 rounded-lg border border-white/10 p-2">
                <p className="text-xs font-bold uppercase text-white/60">Construtor de Efeitos (do item de resultado)</p>
                <p className="text-[11px] text-white/50">
                  Efeitos modernos (ConsumableEffect) do Item selecionado acima — é o que o motor de combate de fato executa
                  quando o jogador usa o consumível. Existem independente desta receita (pertencem ao Item, não à receita).
                </p>
                {efeitos.length === 0 && !mostrarFormEfeito && (
                  <p className="text-xs text-white/50">Nenhum efeito configurado pra este item ainda.</p>
                )}
                {efeitos.map((efeito) => (
                  <div key={efeito.id} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs">
                    <div>
                      <span className="font-bold">{ROTULO_EFFECT_KEY[efeito.effect_key]}</span>
                      <span className="ml-2 text-white/60">{resumoEfeito(efeito)}</span>
                      {!efeito.ativo && <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase text-white/50">Inativo</span>}
                    </div>
                    <div className="flex shrink-0 gap-3">
                      <button
                        type="button"
                        onClick={() => { setEfeitoEditando(efeito); setMostrarFormEfeito(true); }}
                        className="text-[#F3B43F] hover:underline"
                      >
                        Editar
                      </button>
                      <button type="button" onClick={() => excluirEfeito(efeito)} className="text-red-400 hover:underline">Excluir</button>
                    </div>
                  </div>
                ))}

                {mostrarFormEfeito ? (
                  <EfeitoForm
                    tipos={tiposDeEfeito}
                    efeitoInicial={efeitoEditando}
                    salvando={salvandoEfeito}
                    onSalvar={salvarEfeito}
                    onCancelar={() => { setMostrarFormEfeito(false); setEfeitoEditando(null); }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => { setEfeitoEditando(null); setMostrarFormEfeito(true); }}
                    className="self-start rounded-lg border border-white/20 px-3 py-1 text-xs text-white/70 hover:bg-white/10"
                  >
                    + Adicionar efeito
                  </button>
                )}

                <PreviewPanel idItem={form.id_item_resultado} />
              </div>
            ) : (
              <p className="text-[11px] text-white/40">Escolha um item de resultado acima pra configurar os efeitos do consumível.</p>
            )}

            {editando && (
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={form.ativo ?? true} onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))} />
                Ativa (disponível no jogo)
              </label>
            )}

            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => { setMostrarForm(false); setEditando(null); }} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">Cancelar</button>
              <BotaoSalvar disabled={salvando} />
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
