"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  atualizarItemAdmin,
  criarItemAdmin,
  desativarItemAdmin,
  listarItensAdmin,
  mensagemDeErroAdmin,
  type AdminItemApi,
  type PayloadItemAdmin,
} from "@/lib/api/admin";

const TIPOS_ITEM = [
  "Consumivel",
  "Armadura",
  "Capacete",
  "Escudo",
  "Arma",
  "Acessorio1",
  "Acessorio2",
  "Material",
  "QuestItem",
  "Currencia",
  "Espolio",
];
const RARIDADES = ["Comum", "Incomum", "Raro", "Epico", "Lendario", "Mitico"];
const TIPOS_DANO = ["Fisico", "Magico"];
const TIPOS_ARMA = ["Espada", "Machado", "Cajado", "Adaga", "Lança", "Orbe"];
const ATRIBUTOS = ["Forca", "Vitalidade", "Inteligencia", "Agilidade", "Velocidade"];
const SLOTS_ARMADURA = ["Cabeca", "Torso", "Pes", "Acessorio1", "Acessorio2"];

const TIPOS_COM_ARMA = ["Arma"];
const TIPOS_COM_ARMADURA = ["Armadura", "Capacete", "Escudo", "Acessorio1", "Acessorio2"];
const TIPOS_COM_CONSUMIVEL = ["Consumivel"];

function formularioVazio(): PayloadItemAdmin {
  return {
    item: {
      nome: "",
      descricao: "",
      tipo_item: "Material",
      raridade: "Comum",
      valor_compra: 0,
      valor_venda: 0,
      peso: 0,
      imagem_url: "",
      disponivel_loja: false,
      negociavel_mercado: true,
      tier_equipamento: null,
    },
    weapon: { dano_min: 0, dano_max: 0, tipo_dano: "Fisico", tipo_arma: "Espada", bonus_atributo: "Forca", valor_bonus_atributo: 0 },
    armor: { slot_equipamento: "Cabeca", defesa: 0, bonus_forca: 0, bonus_vitalidade: 0, bonus_inteligencia: 0, bonus_agilidade: 0, bonus_velocidade: 0 },
    consumable: { efeito_vida: 0, efeito_mana: 0, efeito_atributo: "", valor_atributo: 0, duracao_efeito: null },
  };
}

export default function AdminItemsClient() {
  const [itens, setItens] = useState<AdminItemApi[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const porPagina = 20;
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [filtroNome, setFiltroNome] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<PayloadItemAdmin>(formularioVazio());
  const [salvando, setSalvando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resultado = await listarItensAdmin({
        pagina,
        porPagina,
        nome: filtroNome || undefined,
        tipo_item: filtroTipo || undefined,
      });
      setItens(resultado.itens);
      setTotal(resultado.total);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar os itens."));
    } finally {
      setCarregando(false);
    }
  }, [pagina, filtroNome, filtroTipo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirCriacao() {
    setEditandoId(null);
    setForm(formularioVazio());
    setMostrarForm(true);
    setMensagem("");
  }

  function abrirEdicao(item: AdminItemApi) {
    setEditandoId(item.id);
    setForm({
      item: {
        nome: item.nome,
        descricao: item.descricao,
        tipo_item: item.tipo_item,
        raridade: item.raridade,
        valor_compra: item.valor_compra,
        valor_venda: item.valor_venda,
        peso: item.peso,
        imagem_url: item.imagem_url ?? "",
        disponivel_loja: item.disponivel_loja,
        negociavel_mercado: item.negociavel_mercado,
        tier_equipamento: item.tier_equipamento,
      },
      weapon: item.weaponProperties ?? formularioVazio().weapon,
      armor: item.armorProperties ?? formularioVazio().armor,
      consumable: item.consumableProperties ?? formularioVazio().consumable,
    });
    setMostrarForm(true);
    setMensagem("");
  }

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setMensagem("");
    try {
      if (editandoId) {
        await atualizarItemAdmin(editandoId, form);
        setMensagem(`Item "${form.item.nome}" atualizado.`);
      } else {
        await criarItemAdmin(form);
        setMensagem(`Item "${form.item.nome}" criado.`);
      }
      setMostrarForm(false);
      await carregar();
    } catch (error) {
      setMensagem(mensagemDeErroAdmin(error, "Não foi possível salvar o item."));
    } finally {
      setSalvando(false);
    }
  }

  async function desativar(item: AdminItemApi) {
    const motivo = window.prompt(`Motivo pra desativar "${item.nome}" (obrigatório):`);
    if (!motivo || !motivo.trim()) return;
    try {
      await desativarItemAdmin(item.id, motivo.trim());
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível desativar o item."));
    }
  }

  const tipoAtual = form.item.tipo_item;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
            ← Painel Administrativo
          </Link>
          <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Itens</h1>
        </div>
        <button
          type="button"
          onClick={abrirCriacao}
          className="rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black hover:bg-[#a5710f]"
        >
          + Novo item
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={filtroNome}
          onChange={(e) => {
            setPagina(1);
            setFiltroNome(e.target.value);
          }}
          className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white"
        />
        <select
          value={filtroTipo}
          onChange={(e) => {
            setPagina(1);
            setFiltroTipo(e.target.value);
          }}
          className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white"
        >
          <option value="">Todos os tipos</option>
          {TIPOS_ITEM.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>
      </div>

      {erro && <p className="text-sm text-red-400">{erro}</p>}

      <div className="overflow-x-auto rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80">
        <table className="w-full text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-white/50">
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Raridade</th>
              <th className="px-3 py-2">Loja</th>
              <th className="px-3 py-2">Mercado</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-white/50">
                  Carregando...
                </td>
              </tr>
            ) : itens.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-white/50">
                  Nenhum item encontrado.
                </td>
              </tr>
            ) : (
              itens.map((item) => (
                <tr key={item.id} className={`border-b border-white/5 ${!item.ativo ? "opacity-50" : ""}`}>
                  <td className="px-3 py-2 font-bold">{item.nome}</td>
                  <td className="px-3 py-2">{item.tipo_item}</td>
                  <td className="px-3 py-2">{item.raridade}</td>
                  <td className="px-3 py-2">{item.disponivel_loja ? "Sim" : "Não"}</td>
                  <td className="px-3 py-2">{item.negociavel_mercado ? "Sim" : "Não"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        item.ativo ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {item.ativo ? "Ativo" : "Desativado"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => abrirEdicao(item)} className="text-[#F3B43F] hover:underline">
                        Editar
                      </button>
                      {item.ativo && (
                        <button type="button" onClick={() => desativar(item)} className="text-red-400 hover:underline">
                          Desativar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-white/60">
        <span>
          {total} item(ns) — página {pagina} de {totalPaginas}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pagina <= 1}
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-white/20 px-3 py-1 disabled:opacity-30"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            className="rounded-lg border border-white/20 px-3 py-1 disabled:opacity-30"
          >
            Próxima
          </button>
        </div>
      </div>

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMostrarForm(false)}>
          <form
            onSubmit={salvar}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl"
          >
            <p className="font-imFeel text-xl text-[#F3B43F]">{editandoId ? "Editar item" : "Novo item"}</p>
            {mensagem && <p className="text-sm text-[#F3B43F]">{mensagem}</p>}

            <label className="flex flex-col gap-1 text-xs">
              Nome
              <input
                required
                value={form.item.nome}
                onChange={(e) => setForm((f) => ({ ...f, item: { ...f.item, nome: e.target.value } }))}
                className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs">
              Descrição
              <textarea
                required
                value={form.item.descricao}
                onChange={(e) => setForm((f) => ({ ...f, item: { ...f.item, descricao: e.target.value } }))}
                className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                rows={2}
              />
            </label>

            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Tipo
                <select
                  disabled={Boolean(editandoId)}
                  value={form.item.tipo_item}
                  onChange={(e) => setForm((f) => ({ ...f, item: { ...f.item, tipo_item: e.target.value } }))}
                  className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm disabled:opacity-50"
                >
                  {TIPOS_ITEM.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Raridade
                <select
                  value={form.item.raridade}
                  onChange={(e) => setForm((f) => ({ ...f, item: { ...f.item, raridade: e.target.value } }))}
                  className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                >
                  {RARIDADES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Preço compra
                <input
                  type="number"
                  min={0}
                  value={form.item.valor_compra}
                  onChange={(e) => setForm((f) => ({ ...f, item: { ...f.item, valor_compra: Number(e.target.value) } }))}
                  className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Preço venda
                <input
                  type="number"
                  min={0}
                  value={form.item.valor_venda}
                  onChange={(e) => setForm((f) => ({ ...f, item: { ...f.item, valor_venda: Number(e.target.value) } }))}
                  className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Peso
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={form.item.peso}
                  onChange={(e) => setForm((f) => ({ ...f, item: { ...f.item, peso: Number(e.target.value) } }))}
                  className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1 text-xs">
              Imagem (URL)
              <input
                value={form.item.imagem_url ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, item: { ...f.item, imagem_url: e.target.value } }))}
                className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
              />
            </label>

            <div className="flex gap-4 text-xs">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.item.disponivel_loja ?? false}
                  onChange={(e) => setForm((f) => ({ ...f, item: { ...f.item, disponivel_loja: e.target.checked } }))}
                />
                Disponível na Loja
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.item.negociavel_mercado ?? true}
                  onChange={(e) => setForm((f) => ({ ...f, item: { ...f.item, negociavel_mercado: e.target.checked } }))}
                />
                Negociável no Mercado
              </label>
            </div>

            {TIPOS_COM_ARMA.includes(tipoAtual) && (
              <fieldset className="flex flex-col gap-2 rounded-lg border border-white/10 p-3">
                <legend className="px-1 text-xs font-bold uppercase text-[#F3B43F]">Propriedades de arma</legend>
                <div className="flex gap-2">
                  <label className="flex flex-1 flex-col gap-1 text-xs">
                    Dano mín.
                    <input
                      type="number"
                      min={0}
                      value={form.weapon?.dano_min ?? 0}
                      onChange={(e) => setForm((f) => ({ ...f, weapon: { ...f.weapon!, dano_min: Number(e.target.value) } }))}
                      className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="flex flex-1 flex-col gap-1 text-xs">
                    Dano máx.
                    <input
                      type="number"
                      min={0}
                      value={form.weapon?.dano_max ?? 0}
                      onChange={(e) => setForm((f) => ({ ...f, weapon: { ...f.weapon!, dano_max: Number(e.target.value) } }))}
                      className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                    />
                  </label>
                </div>
                <div className="flex gap-2">
                  <label className="flex flex-1 flex-col gap-1 text-xs">
                    Tipo de dano
                    <select
                      value={form.weapon?.tipo_dano ?? "Fisico"}
                      onChange={(e) => setForm((f) => ({ ...f, weapon: { ...f.weapon!, tipo_dano: e.target.value as "Fisico" | "Magico" } }))}
                      className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                    >
                      {TIPOS_DANO.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-1 flex-col gap-1 text-xs">
                    Tipo de arma
                    <select
                      value={form.weapon?.tipo_arma ?? "Espada"}
                      onChange={(e) => setForm((f) => ({ ...f, weapon: { ...f.weapon!, tipo_arma: e.target.value as WeaponPropertiesTipo } }))}
                      className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                    >
                      {TIPOS_ARMA.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex gap-2">
                  <label className="flex flex-1 flex-col gap-1 text-xs">
                    Atributo bônus
                    <select
                      value={form.weapon?.bonus_atributo ?? "Forca"}
                      onChange={(e) => setForm((f) => ({ ...f, weapon: { ...f.weapon!, bonus_atributo: e.target.value as WeaponPropertiesAtributo } }))}
                      className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                    >
                      {ATRIBUTOS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-1 flex-col gap-1 text-xs">
                    Valor do bônus
                    <input
                      type="number"
                      step="0.1"
                      value={form.weapon?.valor_bonus_atributo ?? 0}
                      onChange={(e) => setForm((f) => ({ ...f, weapon: { ...f.weapon!, valor_bonus_atributo: Number(e.target.value) } }))}
                      className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                    />
                  </label>
                </div>
              </fieldset>
            )}

            {TIPOS_COM_ARMADURA.includes(tipoAtual) && (
              <fieldset className="flex flex-col gap-2 rounded-lg border border-white/10 p-3">
                <legend className="px-1 text-xs font-bold uppercase text-[#F3B43F]">Propriedades de armadura</legend>
                <div className="flex gap-2">
                  <label className="flex flex-1 flex-col gap-1 text-xs">
                    Slot
                    <select
                      value={form.armor?.slot_equipamento ?? "Cabeca"}
                      onChange={(e) => setForm((f) => ({ ...f, armor: { ...f.armor!, slot_equipamento: e.target.value as ArmorPropertiesSlot } }))}
                      className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                    >
                      {SLOTS_ARMADURA.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-1 flex-col gap-1 text-xs">
                    Defesa
                    <input
                      type="number"
                      min={0}
                      value={form.armor?.defesa ?? 0}
                      onChange={(e) => setForm((f) => ({ ...f, armor: { ...f.armor!, defesa: Number(e.target.value) } }))}
                      className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {(["bonus_forca", "bonus_vitalidade", "bonus_inteligencia", "bonus_agilidade", "bonus_velocidade"] as const).map((campo) => (
                    <label key={campo} className="flex flex-col gap-1 text-xs">
                      {campo.replace("bonus_", "")}
                      <input
                        type="number"
                        value={form.armor?.[campo] ?? 0}
                        onChange={(e) => setForm((f) => ({ ...f, armor: { ...f.armor!, [campo]: Number(e.target.value) } }))}
                        className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {TIPOS_COM_CONSUMIVEL.includes(tipoAtual) && (
              <fieldset className="flex flex-col gap-2 rounded-lg border border-white/10 p-3">
                <legend className="px-1 text-xs font-bold uppercase text-[#F3B43F]">Efeito do consumível</legend>
                <div className="flex gap-2">
                  <label className="flex flex-1 flex-col gap-1 text-xs">
                    Efeito vida
                    <input
                      type="number"
                      value={form.consumable?.efeito_vida ?? 0}
                      onChange={(e) => setForm((f) => ({ ...f, consumable: { ...f.consumable!, efeito_vida: Number(e.target.value) } }))}
                      className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="flex flex-1 flex-col gap-1 text-xs">
                    Efeito mana
                    <input
                      type="number"
                      value={form.consumable?.efeito_mana ?? 0}
                      onChange={(e) => setForm((f) => ({ ...f, consumable: { ...f.consumable!, efeito_mana: Number(e.target.value) } }))}
                      className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                    />
                  </label>
                </div>
              </fieldset>
            )}

            <div className="mt-2 flex justify-end gap-3">
              <button type="button" onClick={() => setMostrarForm(false)} className="rounded-lg border border-white/30 px-4 py-2 text-white/80 hover:bg-white/10">
                Cancelar
              </button>
              <button type="submit" disabled={salvando} className="rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black hover:bg-[#a5710f] disabled:opacity-60">
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

type WeaponPropertiesTipo = "Espada" | "Machado" | "Cajado" | "Adaga" | "Lança" | "Orbe";
type WeaponPropertiesAtributo = "Forca" | "Vitalidade" | "Inteligencia" | "Agilidade" | "Velocidade";
type ArmorPropertiesSlot = "Cabeca" | "Torso" | "Maos" | "Pes" | "Acessorio1" | "Acessorio2";
