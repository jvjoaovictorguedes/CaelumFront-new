"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  atualizarAparicaoAdmin,
  atualizarLootAdmin,
  atualizarMonstroAdmin,
  atualizarZonaAdmin,
  buscarPersonagensAdmin,
  criarAparicaoAdmin,
  criarLootAdmin,
  criarMonstroAdmin,
  criarZonaAdmin,
  duplicarMonstroAdmin,
  listarAparicoesAdmin,
  listarLootAdmin,
  listarMonstrosAdmin,
  listarRegioesExpedicaoAdmin,
  listarZonasAdmin,
  mensagemDeErroAdmin,
  simularBalanceamentoAdventureAdmin,
  type AdventureMonsterApi,
  type AdventureMonsterLootApi,
  type AdventureZoneApi,
  type AdventureZoneMonsterApi,
  type ExpeditionRegionAdminApi,
  type GrantSearchResultApi,
  type ModoSimulacaoBalanceamento,
  type SimulacaoBalanceamentoResultadoApi,
} from "@/lib/api/admin";
import { ItemSelect, formatarItemComId, useItensParaSelecaoAdmin } from "@/components/admin/ItemPicker";

type Aba = "zonas" | "monstros" | "aparicoes" | "drops" | "simulador";

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
    setForm({
      nome: "",
      descricao: "",
      imagem_url: "",
      nivel: 1,
      vida_maxima: 30,
      dano_min: 1,
      dano_max: 3,
      agilidade: 2,
      velocidade: 2,
      xp_recompensa: 20,
      ouro_recompensa: 10,
      ativo: true,
    });
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
                <p className="font-bold">
                  {monstro.nome} <span className="text-xs text-white/50">(nível {monstro.nivel ?? "?"})</span>
                </p>
                <p className="text-xs text-white/50">
                  Vida {monstro.vida_maxima ?? "?"} · Dano {monstro.dano_min ?? "?"}-{monstro.dano_max ?? "?"} · XP {monstro.xp_recompensa ?? "?"} · Ouro {monstro.ouro_recompensa ?? "?"}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-2 text-sm">
                <button type="button" onClick={() => abrirEdicao(monstro)} className="text-white/70 hover:underline">
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
            <label className="flex flex-col gap-1 text-xs">
              Sprite key (opcional)
              <input value={form.sprite_key ?? ""} onChange={(e) => setForm((f) => ({ ...f, sprite_key: e.target.value || null }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-xs">
                Nível
                <input type="number" min={1} step="1" value={form.nivel ?? 1} onChange={(e) => setForm((f) => ({ ...f, nivel: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Vida máxima
                <input type="number" min={1} step="1" value={form.vida_maxima ?? 30} onChange={(e) => setForm((f) => ({ ...f, vida_maxima: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Dano mínimo
                <input type="number" min={0} step="1" value={form.dano_min ?? 1} onChange={(e) => setForm((f) => ({ ...f, dano_min: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Dano máximo
                <input type="number" min={0} step="1" value={form.dano_max ?? 3} onChange={(e) => setForm((f) => ({ ...f, dano_max: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Agilidade
                <input type="number" min={1} step="1" value={form.agilidade ?? 2} onChange={(e) => setForm((f) => ({ ...f, agilidade: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Velocidade
                <input type="number" min={1} step="1" value={form.velocidade ?? 2} onChange={(e) => setForm((f) => ({ ...f, velocidade: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                XP de recompensa
                <input type="number" min={0} step="1" value={form.xp_recompensa ?? 0} onChange={(e) => setForm((f) => ({ ...f, xp_recompensa: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Ouro de recompensa
                <input type="number" min={0} step="1" value={form.ouro_recompensa ?? 0} onChange={(e) => setForm((f) => ({ ...f, ouro_recompensa: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
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
    setForm({ id_area: zonaFiltro || zonas[0]?.id, id_monstro: monstros[0]?.id, peso_aparicao: 100, tipo_aparicao: "Comum", nivel_jogador_minimo: 1, ativo: true });
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

  async function mudarNivelJogadorMinimo(aparicao: AdventureZoneMonsterApi, nivel: number) {
    try {
      await atualizarAparicaoAdmin(aparicao.id, { nivel_jogador_minimo: nivel });
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível mudar o nível mínimo."));
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
                <label className="flex items-center gap-1 text-xs text-white/60">
                  Nível mín.
                  <input
                    type="number"
                    min={1}
                    defaultValue={aparicao.nivel_jogador_minimo}
                    onBlur={(e) => mudarNivelJogadorMinimo(aparicao, Number(e.target.value))}
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
            <label className="flex flex-col gap-1 text-xs">
              Nível mínimo do jogador (só elegibilidade de aparição)
              <input type="number" min={1} value={form.nivel_jogador_minimo ?? 1} onChange={(e) => setForm((f) => ({ ...f, nivel_jogador_minimo: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
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

const ROTULO_MODO_SIMULACAO: Record<ModoSimulacaoBalanceamento, string> = {
  zona: "Aventura (zona)",
  expedicao: "Expedição",
  grupo: "Aventura em Party",
};

function SimuladorTab() {
  const [modo, setModo] = useState<ModoSimulacaoBalanceamento>("zona");
  const [monstros, setMonstros] = useState<AdventureMonsterApi[]>([]);
  const [regioes, setRegioes] = useState<ExpeditionRegionAdminApi[]>([]);
  const [idMonstro, setIdMonstro] = useState<number | "">("");
  const [idRegiaoExpedicao, setIdRegiaoExpedicao] = useState<number | "">("");
  const [tamanhoGrupo, setTamanhoGrupo] = useState("2");
  const [termoPersonagem, setTermoPersonagem] = useState("");
  const [resultadosBusca, setResultadosBusca] = useState<GrantSearchResultApi[]>([]);
  const [personagemSelecionado, setPersonagemSelecionado] = useState<GrantSearchResultApi | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [quantidade, setQuantidade] = useState("200");
  const [simulando, setSimulando] = useState(false);
  const [resultado, setResultado] = useState<SimulacaoBalanceamentoResultadoApi | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    listarMonstrosAdmin()
      .then(setMonstros)
      .catch(() => {});
    listarRegioesExpedicaoAdmin()
      .then(setRegioes)
      .catch(() => {});
  }, []);

  function trocarModo(novoModo: ModoSimulacaoBalanceamento) {
    setModo(novoModo);
    setResultado(null);
    setErro("");
  }

  async function buscarPersonagem(evento: React.FormEvent) {
    evento.preventDefault();
    setBuscando(true);
    setErro("");
    try {
      setResultadosBusca(await buscarPersonagensAdmin(termoPersonagem));
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível buscar."));
    } finally {
      setBuscando(false);
    }
  }

  const alvoEscolhido = modo === "expedicao" ? idRegiaoExpedicao !== "" : idMonstro !== "";

  async function simular() {
    if (!personagemSelecionado || !alvoEscolhido) return;
    setSimulando(true);
    setErro("");
    setResultado(null);
    try {
      setResultado(
        await simularBalanceamentoAdventureAdmin({
          modo,
          id_personagem: personagemSelecionado.id,
          id_monstro: modo !== "expedicao" ? Number(idMonstro) : undefined,
          id_regiao_expedicao: modo === "expedicao" ? Number(idRegiaoExpedicao) : undefined,
          tamanho_grupo: modo === "grupo" ? Number(tamanhoGrupo) : undefined,
          quantidade: quantidade ? Number(quantidade) : undefined,
        }),
      );
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível simular os combates."));
    } finally {
      setSimulando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-white/50">
        Roda N combates PvE de verdade (mesmas fórmulas e mesmo motor do jogo real) entre um personagem e o alvo
        escolhido, sem afetar o personagem de verdade. Não simula efeitos de status (queimadura, atordoamento etc.),
        cooldown, consumíveis nem buffs de Taverna/Guilda — suficiente pra calibrar vida/dano base.
      </p>

      <div className="flex gap-2">
        {(Object.keys(ROTULO_MODO_SIMULACAO) as ModoSimulacaoBalanceamento[]).map((chave) => (
          <button
            key={chave}
            type="button"
            onClick={() => trocarModo(chave)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${modo === chave ? "bg-[#BC8418] text-black" : "bg-black/20 text-white/70 hover:text-white"}`}
          >
            {ROTULO_MODO_SIMULACAO[chave]}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4">
        <p className="mb-2 text-xs font-bold uppercase text-[#F3B43F]/80">1. Personagem</p>
        <form onSubmit={buscarPersonagem} className="flex gap-2">
          <input
            value={termoPersonagem}
            onChange={(e) => setTermoPersonagem(e.target.value)}
            placeholder="Nome do personagem ou username..."
            className="flex-1 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
          />
          <button type="submit" disabled={buscando} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
            {buscando ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {resultadosBusca.length > 0 && (
          <div className="mt-2 flex flex-col gap-1">
            {resultadosBusca.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPersonagemSelecionado(p);
                  setResultadosBusca([]);
                  setResultado(null);
                }}
                className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2 text-left text-sm text-white hover:bg-white/10"
              >
                <span>
                  <span className="font-bold text-[#F3B43F]">{p.nome}</span> · nível {p.nivel}{" "}
                  {p.username && <span className="text-white/50">· @{p.username}</span>}
                </span>
              </button>
            ))}
          </div>
        )}

        {personagemSelecionado && (
          <p className="mt-2 text-sm text-white/70">
            Selecionado: <span className="font-bold text-[#F3B43F]">{personagemSelecionado.nome}</span> (nível{" "}
            {personagemSelecionado.nivel})
            {modo === "grupo" && (
              <span className="text-white/50"> — representa TODOS os membros do grupo simulado (mesma build, N cópias)</span>
            )}
          </p>
        )}
      </div>

      <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4">
        <p className="mb-2 text-xs font-bold uppercase text-[#F3B43F]/80">
          2. {modo === "expedicao" ? "Região de expedição" : "Monstro"}
          {modo === "grupo" ? ", tamanho do grupo" : ""} e quantidade de combates
        </p>
        <div className="flex flex-wrap gap-2">
          {modo === "expedicao" ? (
            <select
              value={idRegiaoExpedicao}
              onChange={(e) => setIdRegiaoExpedicao(e.target.value ? Number(e.target.value) : "")}
              className="flex-1 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
            >
              <option value="">Escolha uma região...</option>
              {regioes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome} ({r.profissao}, nível mín. {r.nivel_minimo})
                </option>
              ))}
            </select>
          ) : (
            <select
              value={idMonstro}
              onChange={(e) => setIdMonstro(e.target.value ? Number(e.target.value) : "")}
              className="flex-1 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
            >
              <option value="">Escolha um monstro...</option>
              {monstros.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome} (nível {m.nivel ?? "?"})
                </option>
              ))}
            </select>
          )}
          {modo === "grupo" && (
            <select
              value={tamanhoGrupo}
              onChange={(e) => setTamanhoGrupo(e.target.value)}
              className="w-40 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
            >
              <option value="2">2 aventureiros</option>
              <option value="3">3 aventureiros</option>
              <option value="4">4 aventureiros</option>
            </select>
          )}
          <input
            type="number"
            min={1}
            max={1000}
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            placeholder="Combates (padrão 200)"
            className="w-48 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
          />
        </div>

        <button
          type="button"
          onClick={simular}
          disabled={!personagemSelecionado || !alvoEscolhido || simulando}
          className="mt-3 w-full rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50"
        >
          {simulando ? "Simulando..." : "Simular"}
        </button>
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}

      {resultado && <ResultadoSimulacao resultado={resultado} />}
    </div>
  );
}

function ResultadoSimulacao({ resultado }: { resultado: SimulacaoBalanceamentoResultadoApi }) {
  const alvoLabel =
    resultado.modo === "expedicao"
      ? `Expedição — ${resultado.regiao_expedicao?.nome} (monstro nível ${resultado.monstro_gerado?.nivel_forcado})`
      : resultado.modo === "grupo"
        ? `${resultado.tamanho_grupo}x ${resultado.personagem.nome} vs ${resultado.monstro?.nome}`
        : (resultado.monstro?.nome ?? "");

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-4 text-white">
      <p className="font-imFeel text-lg text-[#F3B43F]">
        {resultado.modo !== "grupo" && `${resultado.personagem.nome} vs `}
        {alvoLabel} — {resultado.quantidade_simulacoes} combates
      </p>

      {resultado.modo === "expedicao" && resultado.monstro_gerado && (
        <p className="mt-1 text-xs text-white/50">
          Monstro gerado na hora (como na Expedição de verdade) — vida média ≈{" "}
          {resultado.monstro_gerado.vida_maxima_media}, dano médio ≈ {resultado.monstro_gerado.dano_base_medio} por
          acerto.
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-black/30 p-3 text-center">
          <p className="text-2xl font-bold text-[#F3B43F]">{resultado.taxa_vitoria_pct}%</p>
          <p className="text-[10px] uppercase text-white/50">Taxa de vitória</p>
        </div>
        <div className="rounded-lg bg-black/30 p-3 text-center">
          <p className="text-2xl font-bold text-white">{resultado.vitorias}</p>
          <p className="text-[10px] uppercase text-white/50">Vitórias</p>
        </div>
        <div className="rounded-lg bg-black/30 p-3 text-center">
          <p className="text-2xl font-bold text-white">{resultado.derrotas}</p>
          <p className="text-[10px] uppercase text-white/50">Derrotas</p>
        </div>

        {resultado.modo === "grupo" ? (
          <>
            <div className="rounded-lg bg-black/30 p-3 text-center">
              <p className="text-2xl font-bold text-white">{resultado.rodadas_medias_vitoria}</p>
              <p className="text-[10px] uppercase text-white/50">Rodadas médias (vitória)</p>
            </div>
            <div className="rounded-lg bg-black/30 p-3 text-center">
              <p className="text-2xl font-bold text-white">{resultado.sobreviventes_medios_ao_vencer}</p>
              <p className="text-[10px] uppercase text-white/50">Sobreviventes médios ao vencer</p>
            </div>
            <div className="rounded-lg bg-black/30 p-3 text-center">
              <p className="text-2xl font-bold text-white">{resultado.dano_medio_recebido_pelo_grupo_por_combate}</p>
              <p className="text-[10px] uppercase text-white/50">Dano médio recebido (grupo)</p>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-lg bg-black/30 p-3 text-center">
              <p className="text-2xl font-bold text-white">{resultado.turnos_medios_vitoria}</p>
              <p className="text-[10px] uppercase text-white/50">Turnos médios (vitória)</p>
            </div>
            <div className="rounded-lg bg-black/30 p-3 text-center">
              <p className="text-2xl font-bold text-white">{resultado.dano_medio_recebido_por_combate}</p>
              <p className="text-[10px] uppercase text-white/50">Dano médio recebido</p>
            </div>
          </>
        )}
        <div className="rounded-lg bg-black/30 p-3 text-center">
          <p className="text-2xl font-bold text-white">{resultado.vida_media_restante_ao_vencer_pct}%</p>
          <p className="text-[10px] uppercase text-white/50">Vida restante ao vencer</p>
        </div>
      </div>
      {resultado.combates_sem_vencedor > 0 && (
        <p className="mt-3 text-xs text-yellow-400">
          {resultado.combates_sem_vencedor} combate(s) não terminaram dentro do limite de {resultado.modo === "grupo" ? "rodadas" : "turnos"} de
          segurança — indica um confronto muito equilibrado ou travado (ex.: personagem sem dano ofensivo nenhum).
        </p>
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
            { chave: "simulador", label: "Simulador" },
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
      {aba === "simulador" && <SimuladorTab />}
    </div>
  );
}
