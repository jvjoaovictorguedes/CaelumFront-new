"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  atualizarAlchemyRecipeAdmin,
  criarAlchemyRecipeAdmin,
  listarAlchemyRecipesAdmin,
  mensagemDeErroAdmin,
  type AlchemyCategoriaReceita,
  type AlchemyModoDesbloqueio,
  type AlchemyRecipeAdminApi,
  type PayloadAlchemyRecipeAdmin,
  type PayloadAlchemyRecipeIngredienteAdmin,
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
};

export default function AdminAlchemyClient() {
  const [receitas, setReceitas] = useState<AlchemyRecipeAdminApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<AlchemyRecipeAdminApi | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<PayloadAlchemyRecipeAdmin>(FORM_VAZIO);

  // Itens Consumível pro resultado da receita, e catálogo geral (qualquer
  // tipo) pros ingredientes — uma receita pode consumir Material, Item de
  // Pesca etc.
  const [itensConsumiveis, setItensConsumiveis] = useState<AdminItemSelecionavelApi[]>([]);
  const { itens: itensGerais } = useItensParaSelecaoAdmin();

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [lista, consumiveis] = await Promise.all([
        listarAlchemyRecipesAdmin(),
        listarItensParaSelecaoAdmin({ tipo_item: "Consumivel" }),
      ]);
      setReceitas(lista);
      setItensConsumiveis(consumiveis);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar as receitas de Alquimia."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirCriacao() {
    setEditando(null);
    setForm(FORM_VAZIO);
    setMostrarForm(true);
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
    });
    setMostrarForm(true);
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
        <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
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
            className="flex w-full max-w-lg flex-col gap-3 rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl"
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
