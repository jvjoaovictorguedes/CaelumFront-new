"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  atualizarAparicaoAdmin,
  atualizarLootAdmin,
  atualizarMonstroAdmin,
  atualizarZonaAdmin,
  criarAparicaoAdmin,
  criarLootAdmin,
  criarMonstroAdmin,
  criarZonaAdmin,
  duplicarMonstroAdmin,
  listarAparicoesAdmin,
  listarLootAdmin,
  listarMonstrosAdmin,
  listarZonasAdmin,
  mensagemDeErroAdmin,
  type AdventureMonsterApi,
  type AdventureMonsterLootApi,
  type AdventureZoneApi,
  type AdventureZoneMonsterApi,
} from "@/lib/api/admin";
import { ItemSelect, formatarItemComId, useItensParaSelecaoAdmin } from "@/components/admin/ItemPicker";

type Aba = "zonas" | "monstros" | "aparicoes" | "drops";

const CATEGORIAS_LOOT = ["Principal", "Secundario", "Especial"] as const;

function ZonasTab() {
  const [zonas, setZonas] = useState<AdventureZoneApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<AdventureZoneApi>>({});
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setZonas(await listarZonasAdmin());
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar as zonas."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirCriacao() {
    setEditandoId(null);
    setForm({ nome: "", descricao: "", nivel_monstro_min: 1, nivel_monstro_max: 5, imagem_url: "", ordem: zonas.length + 1, ativa: true });
    setMostrarForm(true);
  }

  function abrirEdicao(zona: AdventureZoneApi) {
    setEditandoId(zona.id);
    setForm(zona);
    setMostrarForm(true);
  }

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      if (editandoId) await atualizarZonaAdmin(editandoId, form);
      else await criarZonaAdmin(form);
      setMostrarForm(false);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar a zona."));
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtiva(zona: AdventureZoneApi) {
    try {
      await atualizarZonaAdmin(zona.id, { ativa: !zona.ativa });
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível mudar o status da zona."));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <button type="button" onClick={abrirCriacao} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
          + Nova zona
        </button>
      </div>
      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      {carregando ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : (
        <div className="flex flex-col gap-2">
          {zonas.map((zona) => (
            <div key={zona.id} className={`flex items-center justify-between gap-3 rounded-xl border border-[#F3B43F]/30 bg-[#292018]/80 p-3 text-white ${!zona.ativa ? "opacity-50" : ""}`}>
              <div className="min-w-0">
                <p className="font-bold">
                  {zona.ordem}. {zona.nome}{" "}
                  <span className="text-xs text-white/50">
                    (nível {zona.nivel_monstro_min}-{zona.nivel_monstro_max})
                  </span>
                </p>
                <p className="truncate text-xs text-white/50">{zona.descricao}</p>
              </div>
              <div className="flex shrink-0 gap-2 text-sm">
                <button type="button" onClick={() => abrirEdicao(zona)} className="text-[#F3B43F] hover:underline">
                  Editar
                </button>
                <button type="button" onClick={() => alternarAtiva(zona)} className="text-white/70 hover:underline">
                  {zona.ativa ? "Desativar" : "Ativar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMostrarForm(false)}>
          <form onSubmit={salvar} onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-[#F3B43F]">{editandoId ? "Editar zona" : "Nova zona"}</p>
            <label className="flex flex-col gap-1 text-xs">
              Nome
              <input required value={form.nome ?? ""} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Descrição
              <textarea value={form.descricao ?? ""} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} rows={2} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Nível mín.
                <input type="number" required value={form.nivel_monstro_min ?? 1} onChange={(e) => setForm((f) => ({ ...f, nivel_monstro_min: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Nível máx.
                <input type="number" required value={form.nivel_monstro_max ?? 5} onChange={(e) => setForm((f) => ({ ...f, nivel_monstro_max: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Ordem
                <input type="number" value={form.ordem ?? 0} onChange={(e) => setForm((f) => ({ ...f, ordem: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-xs">
              Imagem (URL)
              <input value={form.imagem_url ?? ""} onChange={(e) => setForm((f) => ({ ...f, imagem_url: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setMostrarForm(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">
                Cancelar
              </button>
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

function MonstrosTab() {
  const [monstros, setMonstros] = useState<AdventureMonsterApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<AdventureMonsterApi>>({});
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setMonstros(await listarMonstrosAdmin());
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar os monstros."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirCriacao() {
    setEditandoId(null);
    setForm({ nome: "", descricao: "", imagem_url: "", multiplicador_vida: 1, multiplicador_dano: 1, multiplicador_agilidade: 1, multiplicador_velocidade: 1, ativo: true });
    setMostrarForm(true);
  }

  function abrirEdicao(monstro: AdventureMonsterApi) {
    setEditandoId(monstro.id);
    setForm(monstro);
    setMostrarForm(true);
  }

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      if (editandoId) await atualizarMonstroAdmin(editandoId, form);
      else await criarMonstroAdmin(form);
      setMostrarForm(false);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar o monstro."));
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivo(monstro: AdventureMonsterApi) {
    try {
      await atualizarMonstroAdmin(monstro.id, { ativo: !monstro.ativo });
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível mudar o status do monstro."));
    }
  }

  async function duplicar(monstro: AdventureMonsterApi) {
    try {
      await duplicarMonstroAdmin(monstro.id);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível duplicar o monstro."));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <button type="button" onClick={abrirCriacao} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
          + Novo monstro
        </button>
      </div>
      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      {carregando ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {monstros.map((monstro) => (
            <div key={monstro.id} className={`flex items-center justify-between gap-3 rounded-xl border border-[#F3B43F]/30 bg-[#292018]/80 p-3 text-white ${!monstro.ativo ? "opacity-50" : ""}`}>
              <div className="min-w-0">
                <p className="font-bold">{monstro.nome}</p>
                <p className="text-xs text-white/50">
                  Vida x{monstro.multiplicador_vida} · Dano x{monstro.multiplicador_dano}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-2 text-sm">
                <button type="button" onClick={() => abrirEdicao(monstro)} className="text-[#F3B43F] hover:underline">
                  Editar
                </button>
                <button type="button" onClick={() => duplicar(monstro)} className="text-white/70 hover:underline">
                  Duplicar
                </button>
                <button type="button" onClick={() => alternarAtivo(monstro)} className="text-white/70 hover:underline">
                  {monstro.ativo ? "Desativar" : "Ativar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMostrarForm(false)}>
          <form onSubmit={salvar} onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-[#F3B43F]">{editandoId ? "Editar monstro" : "Novo monstro"}</p>
            <label className="flex flex-col gap-1 text-xs">
              Nome
              <input required value={form.nome ?? ""} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Descrição
              <textarea value={form.descricao ?? ""} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} rows={2} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Imagem (URL)
              <input value={form.imagem_url ?? ""} onChange={(e) => setForm((f) => ({ ...f, imagem_url: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-xs">
                Mult. vida
                <input type="number" step="0.01" value={form.multiplicador_vida ?? 1} onChange={(e) => setForm((f) => ({ ...f, multiplicador_vida: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Mult. dano
                <input type="number" step="0.01" value={form.multiplicador_dano ?? 1} onChange={(e) => setForm((f) => ({ ...f, multiplicador_dano: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Mult. agilidade
                <input type="number" step="0.01" value={form.multiplicador_agilidade ?? 1} onChange={(e) => setForm((f) => ({ ...f, multiplicador_agilidade: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Mult. velocidade
                <input type="number" step="0.01" value={form.multiplicador_velocidade ?? 1} onChange={(e) => setForm((f) => ({ ...f, multiplicador_velocidade: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setMostrarForm(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">
                Cancelar
              </button>
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

function AparicoesTab() {
  const [zonas, setZonas] = useState<AdventureZoneApi[]>([]);
  const [monstros, setMonstros] = useState<AdventureMonsterApi[]>([]);
  const [zonaFiltro, setZonaFiltro] = useState<number | "">("");
  const [aparicoes, setAparicoes] = useState<AdventureZoneMonsterApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState<Partial<AdventureZoneMonsterApi>>({});
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [z, m, a] = await Promise.all([
        zonas.length ? Promise.resolve(zonas) : listarZonasAdmin(),
        monstros.length ? Promise.resolve(monstros) : listarMonstrosAdmin(),
        listarAparicoesAdmin(zonaFiltro || undefined),
      ]);
      setZonas(z);
      setMonstros(m);
      setAparicoes(a);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar as aparições."));
    } finally {
      setCarregando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zonaFiltro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirCriacao() {
    setForm({ id_area: zonaFiltro || zonas[0]?.id, id_monstro: monstros[0]?.id, peso_aparicao: 100, tipo_aparicao: "Comum", ativo: true });
    setMostrarForm(true);
  }

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      await criarAparicaoAdmin(form);
      setMostrarForm(false);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível criar a aparição."));
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivo(aparicao: AdventureZoneMonsterApi) {
    try {
      await atualizarAparicaoAdmin(aparicao.id, { ativo: !aparicao.ativo });
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível mudar o status da aparição."));
    }
  }

  async function mudarPeso(aparicao: AdventureZoneMonsterApi, peso: number) {
    try {
      await atualizarAparicaoAdmin(aparicao.id, { peso_aparicao: peso });
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível mudar o peso."));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <select value={zonaFiltro} onChange={(e) => setZonaFiltro(e.target.value ? Number(e.target.value) : "")} className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white">
          <option value="">Todas as zonas</option>
          {zonas.map((z) => (
            <option key={z.id} value={z.id}>
              {z.nome}
            </option>
          ))}
        </select>
        <button type="button" onClick={abrirCriacao} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
          + Vincular monstro
        </button>
      </div>
      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      {carregando ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : (
        <div className="flex flex-col gap-2">
          {aparicoes.map((aparicao) => (
            <div key={aparicao.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#F3B43F]/30 bg-[#292018]/80 p-3 text-white ${!aparicao.ativo ? "opacity-50" : ""}`}>
              <div className="min-w-0">
                <p className="font-bold">
                  {aparicao.monstro?.nome} <span className="text-xs text-white/50">em {aparicao.AdventureZone?.nome}</span>
                </p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${aparicao.tipo_aparicao === "Raro" ? "bg-purple-500/20 text-purple-300" : "bg-white/10 text-white/70"}`}>
                  {aparicao.tipo_aparicao}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-sm">
                <label className="flex items-center gap-1 text-xs text-white/60">
                  Peso
                  <input
                    type="number"
                    defaultValue={aparicao.peso_aparicao}
                    onBlur={(e) => mudarPeso(aparicao, Number(e.target.value))}
                    className="w-16 rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-white"
                  />
                </label>
                <button type="button" onClick={() => alternarAtivo(aparicao)} className="text-white/70 hover:underline">
                  {aparicao.ativo ? "Desativar" : "Ativar"}
                </button>
              </div>
            </div>
          ))}
          {aparicoes.length === 0 && <p className="text-sm text-white/50">Nenhuma aparição encontrada.</p>}
        </div>
      )}

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMostrarForm(false)}>
          <form onSubmit={salvar} onClick={(e) => e.stopPropagation()} className="flex w-full max-w-md flex-col gap-3 rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-[#F3B43F]">Vincular monstro à zona</p>
            <label className="flex flex-col gap-1 text-xs">
              Zona
              <select value={form.id_area ?? ""} onChange={(e) => setForm((f) => ({ ...f, id_area: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
                {zonas.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Monstro
              <select value={form.id_monstro ?? ""} onChange={(e) => setForm((f) => ({ ...f, id_monstro: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
                {monstros.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Tipo
                <select value={form.tipo_aparicao ?? "Comum"} onChange={(e) => setForm((f) => ({ ...f, tipo_aparicao: e.target.value as "Comum" | "Raro" }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
                  <option value="Comum">Comum</option>
                  <option value="Raro">Raro</option>
                </select>
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Peso
                <input type="number" value={form.peso_aparicao ?? 100} onChange={(e) => setForm((f) => ({ ...f, peso_aparicao: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setMostrarForm(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">
                Cancelar
              </button>
              <button type="submit" disabled={salvando} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
                {salvando ? "Salvando..." : "Vincular"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function DropsTab() {
  const [monstros, setMonstros] = useState<AdventureMonsterApi[]>([]);
  const [monstroFiltro, setMonstroFiltro] = useState<number | "">("");
  const [loot, setLoot] = useState<AdventureMonsterLootApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState<Partial<AdventureMonsterLootApi> & { chance_percentual?: number }>({});
  const [salvando, setSalvando] = useState(false);
  const { itens: itensDisponiveis } = useItensParaSelecaoAdmin();

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [m, l] = await Promise.all([monstros.length ? Promise.resolve(monstros) : listarMonstrosAdmin(), listarLootAdmin(monstroFiltro || undefined)]);
      setMonstros(m);
      setLoot(l);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar os drops."));
    } finally {
      setCarregando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monstroFiltro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirCriacao() {
    setForm({ id_monstro: monstroFiltro || monstros[0]?.id, id_item: undefined, chance_percentual: 50, quantidade_min: 1, quantidade_max: 1, categoria: "Principal", ativo: true });
    setMostrarForm(true);
  }

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      const chance_ppm = Math.round((form.chance_percentual ?? 0) * 10000);
      await criarLootAdmin({ ...form, chance_ppm });
      setMostrarForm(false);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível criar o drop."));
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivo(entrada: AdventureMonsterLootApi) {
    try {
      await atualizarLootAdmin(entrada.id, { ativo: !entrada.ativo });
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível mudar o status do drop."));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <select value={monstroFiltro} onChange={(e) => setMonstroFiltro(e.target.value ? Number(e.target.value) : "")} className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white">
          <option value="">Todos os monstros</option>
          {monstros.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </select>
        <button type="button" onClick={abrirCriacao} disabled={!monstros.length} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
          + Novo drop
        </button>
      </div>
      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      {carregando ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : (
        <div className="flex flex-col gap-2">
          {loot.map((entrada) => (
            <div key={entrada.id} className={`flex items-center justify-between gap-3 rounded-xl border border-[#F3B43F]/30 bg-[#292018]/80 p-3 text-white ${!entrada.ativo ? "opacity-50" : ""}`}>
              <div className="min-w-0">
                <p className="font-bold">
                  {entrada.item ? formatarItemComId(entrada.item.nome, entrada.id_item) : `Item #${entrada.id_item}`} <span className="text-xs text-white/50">de {entrada.AdventureMonster?.nome}</span>
                </p>
                <p className="text-xs text-[#F3B43F]">
                  {(entrada.chance_ppm / 10000).toFixed(2)}% · x{entrada.quantidade_min}-{entrada.quantidade_max} · {entrada.categoria}
                </p>
              </div>
              <button type="button" onClick={() => alternarAtivo(entrada)} className="shrink-0 text-sm text-white/70 hover:underline">
                {entrada.ativo ? "Desativar" : "Ativar"}
              </button>
            </div>
          ))}
          {loot.length === 0 && <p className="text-sm text-white/50">Nenhum drop encontrado.</p>}
        </div>
      )}

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMostrarForm(false)}>
          <form onSubmit={salvar} onClick={(e) => e.stopPropagation()} className="flex w-full max-w-md flex-col gap-3 rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-[#F3B43F]">Novo drop</p>
            <label className="flex flex-col gap-1 text-xs">
              Monstro
              <select value={form.id_monstro ?? ""} onChange={(e) => setForm((f) => ({ ...f, id_monstro: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
                {monstros.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Item
              <ItemSelect
                itens={itensDisponiveis}
                value={form.id_item ?? ""}
                onChange={(id) => setForm((f) => ({ ...f, id_item: id === "" ? undefined : id }))}
              />
            </label>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Chance (%)
                <input type="number" step="0.01" min={0.01} max={100} required value={form.chance_percentual ?? 50} onChange={(e) => setForm((f) => ({ ...f, chance_percentual: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Categoria
                <select value={form.categoria ?? "Principal"} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value as AdventureMonsterLootApi["categoria"] }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
                  {CATEGORIAS_LOOT.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Qtd. mín.
                <input type="number" min={1} value={form.quantidade_min ?? 1} onChange={(e) => setForm((f) => ({ ...f, quantidade_min: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Qtd. máx.
                <input type="number" min={1} value={form.quantidade_max ?? 1} onChange={(e) => setForm((f) => ({ ...f, quantidade_max: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setMostrarForm(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">
                Cancelar
              </button>
              <button type="submit" disabled={salvando} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
                {salvando ? "Salvando..." : "Criar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function AdminAdventureClient() {
  const [aba, setAba] = useState<Aba>("zonas");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Aventura</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {(
          [
            { chave: "zonas", label: "Zonas" },
            { chave: "monstros", label: "Monstros" },
            { chave: "aparicoes", label: "Aparições" },
            { chave: "drops", label: "Drops" },
          ] as const
        ).map(({ chave, label }) => (
          <button
            key={chave}
            type="button"
            onClick={() => setAba(chave)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition ${aba === chave ? "bg-[#BC8418] text-black" : "bg-black/20 text-white/70 hover:text-white"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {aba === "zonas" && <ZonasTab />}
      {aba === "monstros" && <MonstrosTab />}
      {aba === "aparicoes" && <AparicoesTab />}
      {aba === "drops" && <DropsTab />}
    </div>
  );
}
