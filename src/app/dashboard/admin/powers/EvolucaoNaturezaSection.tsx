"use client";

import { useCallback, useEffect, useState } from "react";
import { atualizarEvolutionAdmin, criarEvolutionAdmin, excluirEvolutionAdmin, listarEvolutionsAdmin, mensagemDeErroAdmin, NATUREZAS_MAGICAS, type ClassPublicaApi, type EvolutionAdminApi, type NaturezaMagica, type PayloadEvolutionAdmin } from "@/lib/api/admin";
import { PowerSelect, usePowersParaSelecaoAdmin } from "@/components/admin/PowerPicker";

const LABEL_NATUREZA: Record<NaturezaMagica, string> = {
  Fogo: "Fogo",
  Agua: "Água",
  Terra: "Terra",
  Ar: "Ar",
  Luz: "Luz",
  Escuridao: "Escuridão",
  "Yin&Yang": "Yin & Yang",
  Raio: "Raio",
};

function evolutionFormVazio(idClassePadrao: number | ""): PayloadEvolutionAdmin {
  return {
    nome: "",
    descricao: "",
    id_classe: idClassePadrao === "" ? 0 : idClassePadrao,
    natureza_magica: "Fogo",
    nivel_necessario: 1,
    custo: 0,
    bonus_forca: 0,
    bonus_vitalidade: 0,
    bonus_agilidade: 0,
    bonus_inteligencia: 0,
    bonus_velocidade: 0,
    id_power_concedido: null,
    id_evolucao_pre_requisito: null,
    ordem: 0,
    imagem_url: null,
  };
}

export default function EvolucaoNaturezaSection({ classes }: { classes: ClassPublicaApi[] }) {
  const [evolucoes, setEvolucoes] = useState<EvolutionAdminApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [filtroClasse, setFiltroClasse] = useState<number | "">("");
  const [filtroNatureza, setFiltroNatureza] = useState<NaturezaMagica | "">("");

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState<PayloadEvolutionAdmin>(evolutionFormVazio(""));
  const [salvando, setSalvando] = useState(false);

  const { powers } = usePowersParaSelecaoAdmin();

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setEvolucoes(
        await listarEvolutionsAdmin({
          id_classe: filtroClasse === "" ? undefined : filtroClasse,
          natureza_magica: filtroNatureza || undefined,
        }),
      );
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar as habilidades de natureza."));
    } finally {
      setCarregando(false);
    }
  }, [filtroClasse, filtroNatureza]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirCriacao() {
    setEditandoId(null);
    setForm(evolutionFormVazio(filtroClasse));
    setMostrarForm(true);
    setMensagem("");
  }
  function abrirEdicao(evolucao: EvolutionAdminApi) {
    setEditandoId(evolucao.id);
    setForm({
      nome: evolucao.nome,
      descricao: evolucao.descricao,
      id_classe: evolucao.id_classe,
      natureza_magica: evolucao.natureza_magica,
      nivel_necessario: evolucao.nivel_necessario,
      custo: evolucao.custo,
      bonus_forca: evolucao.bonus_forca,
      bonus_vitalidade: evolucao.bonus_vitalidade,
      bonus_agilidade: evolucao.bonus_agilidade,
      bonus_inteligencia: evolucao.bonus_inteligencia,
      bonus_velocidade: evolucao.bonus_velocidade,
      id_power_concedido: evolucao.id_power_concedido,
      id_evolucao_pre_requisito: evolucao.id_evolucao_pre_requisito,
      ordem: evolucao.ordem,
      imagem_url: evolucao.imagem_url,
    });
    setMostrarForm(true);
    setMensagem("");
  }

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!form.nome.trim()) { setMensagem("Nome é obrigatório."); return; }
    if (!form.id_classe) { setMensagem("Selecione uma classe."); return; }
    setSalvando(true);
    setMensagem("");
    try {
      if (editandoId) {
        await atualizarEvolutionAdmin(editandoId, form);
        setMensagem("Habilidade de natureza atualizada.");
      } else {
        await criarEvolutionAdmin(form);
        setMensagem("Habilidade de natureza criada.");
      }
      setMostrarForm(false);
      await carregar();
    } catch (error) {
      setMensagem(mensagemDeErroAdmin(error, "Não foi possível salvar."));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(evolucao: EvolutionAdminApi) {
    if (!window.confirm(`Excluir "${evolucao.nome}" permanentemente? Personagens que já compraram perdem o registro de compra (o bônus/poder concedido não é revertido automaticamente).`)) return;
    setErro("");
    try {
      await excluirEvolutionAdmin(evolucao.id);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível excluir — provavelmente outra evolução usa esta como pré-requisito."));
    }
  }

  const nomeDaClasse = (id: number) => classes.find((c) => c.id === id)?.nome ?? `Classe #${id}`;
  const nomeDoPoder = (id: number | null) => (id ? (powers.find((p) => p.id === id)?.nome ?? `Power #${id}`) : null);
  // Pré-requisito só pode ser outra evolução da MESMA classe+natureza —
  // senão a árvore de compra (comprarEvolucao valida id_evolucao_pre_requisito)
  // nunca seria satisfazível pra ninguém.
  const opcoesPreRequisito = evolucoes.filter(
    (e) => e.id !== editandoId && e.id_classe === form.id_classe && e.natureza_magica === form.natureza_magica,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-white/60">{evolucoes.length} habilidade(s) de natureza</p>
        <button type="button" onClick={abrirCriacao} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
          + Nova habilidade de natureza
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={filtroClasse}
          onChange={(e) => setFiltroClasse(e.target.value ? Number(e.target.value) : "")}
          className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white"
        >
          <option value="">Todas as classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        <select
          value={filtroNatureza}
          onChange={(e) => setFiltroNatureza(e.target.value as NaturezaMagica | "")}
          className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white"
        >
          <option value="">Toda natureza</option>
          {NATUREZAS_MAGICAS.map((n) => (
            <option key={n} value={n}>{LABEL_NATUREZA[n]}</option>
          ))}
        </select>
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      {mensagem && !mostrarForm && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-[#F3B43F]">{mensagem}</p>}

      {carregando ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80">
          <table className="w-full text-left text-sm text-white">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-white/50">
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2">Classe</th>
                <th className="px-3 py-2">Natureza</th>
                <th className="px-3 py-2">Nv.</th>
                <th className="px-3 py-2">Custo</th>
                <th className="px-3 py-2">Poder concedido</th>
                <th className="px-3 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {evolucoes.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-4 text-center text-white/50">Nenhuma habilidade de natureza cadastrada.</td></tr>
              ) : (
                evolucoes.map((e) => (
                  <tr key={e.id} className="border-b border-white/5">
                    <td className="px-3 py-2 font-bold">{e.nome} <span className="font-normal text-white/40">#{e.id}</span></td>
                    <td className="px-3 py-2">{nomeDaClasse(e.id_classe)}</td>
                    <td className="px-3 py-2">{LABEL_NATUREZA[e.natureza_magica]}</td>
                    <td className="px-3 py-2">{e.nivel_necessario}</td>
                    <td className="px-3 py-2">{e.custo}</td>
                    <td className="px-3 py-2">{nomeDoPoder(e.id_power_concedido) ?? "—"}</td>
                    <td className="px-3 py-2 flex gap-3">
                      <button type="button" onClick={() => abrirEdicao(e)} className="text-[#F3B43F] hover:underline">Editar</button>
                      <button type="button" onClick={() => excluir(e)} className="text-red-400 hover:underline">Excluir</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMostrarForm(false)}>
          <form onSubmit={salvar} onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-[#F3B43F]">{editandoId ? "Editar habilidade de natureza" : "Nova habilidade de natureza"}</p>
            {mensagem && <p className="text-sm text-[#F3B43F]">{mensagem}</p>}

            <label className="flex flex-col gap-1 text-xs">
              Nome
              <input required value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Descrição
              <textarea required rows={2} value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>

            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Classe
                <select
                  required
                  value={form.id_classe || ""}
                  onChange={(e) => setForm((f) => ({ ...f, id_classe: Number(e.target.value), id_evolucao_pre_requisito: null }))}
                  className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                >
                  <option value="" disabled>Selecione...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Natureza mágica
                <select
                  value={form.natureza_magica}
                  onChange={(e) => setForm((f) => ({ ...f, natureza_magica: e.target.value as NaturezaMagica, id_evolucao_pre_requisito: null }))}
                  className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                >
                  {NATUREZAS_MAGICAS.map((n) => (
                    <option key={n} value={n}>{LABEL_NATUREZA[n]}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Nível necessário
                <input type="number" min={1} value={form.nivel_necessario} onChange={(e) => setForm((f) => ({ ...f, nivel_necessario: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Custo (ouro)
                <input type="number" min={0} value={form.custo} onChange={(e) => setForm((f) => ({ ...f, custo: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Ordem
                <input type="number" value={form.ordem} onChange={(e) => setForm((f) => ({ ...f, ordem: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
            </div>

            <p className="text-[11px] font-bold uppercase tracking-wide text-white/50">Bônus de atributo</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                ["bonus_forca", "Força"],
                ["bonus_vitalidade", "Vitalidade"],
                ["bonus_agilidade", "Agilidade"],
                ["bonus_inteligencia", "Inteligência"],
                ["bonus_velocidade", "Velocidade"],
              ] as const).map(([campo, label]) => (
                <label key={campo} className="flex flex-col gap-1 text-xs">
                  {label}
                  <input type="number" value={form[campo]} onChange={(e) => setForm((f) => ({ ...f, [campo]: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
                </label>
              ))}
            </div>

            <label className="flex flex-col gap-1 text-xs">
              Poder concedido (opcional)
              <PowerSelect
                powers={powers}
                value={form.id_power_concedido ?? ""}
                onChange={(id) => setForm((f) => ({ ...f, id_power_concedido: id === "" ? null : id }))}
              />
            </label>

            <label className="flex flex-col gap-1 text-xs">
              Pré-requisito (opcional — mesma classe + natureza)
              <select
                value={form.id_evolucao_pre_requisito ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, id_evolucao_pre_requisito: e.target.value ? Number(e.target.value) : null }))}
                className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
              >
                <option value="">Nenhum</option>
                {opcoesPreRequisito.map((e) => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs">
              URL da imagem (opcional)
              <input value={form.imagem_url ?? ""} onChange={(e) => setForm((f) => ({ ...f, imagem_url: e.target.value || null }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>

            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setMostrarForm(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">Cancelar</button>
              <button type="submit" disabled={salvando} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">{salvando ? "Salvando..." : "Salvar"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
