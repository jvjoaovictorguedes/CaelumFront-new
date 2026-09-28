"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  atualizarMonstroAdmin,
  criarMonstroAdmin,
  duplicarMonstroAdmin,
  listarAparicoesAdmin,
  listarMonstrosAdmin,
  mensagemDeErroAdmin,
  type AdventureMonsterApi,
  type AdventureZoneMonsterApi,
} from "@/lib/api/admin";
import { MonsterEditor } from "./MonsterEditor";

type CampoOrdenacao = "nivel" | "combat_power" | "vida_maxima" | "defesa" | "xp_recompensa" | "ouro_recompensa";

// Especificação v3 §3.2 — listagem útil pro balanceamento: busca por
// nome, filtro por zona (derivado dos vínculos) e ativo/inativo,
// ordenação por nível/Poder/vida/defesa/XP/Gold. O badge de Raro NÃO
// aparece aqui (tipo de aparição pertence ao vínculo de zona, não ao
// monstro global — ver ZoneEditor).
export function MonstersTab({ onSimular }: { onSimular: (idMonstro: number) => void }) {
  const [monstros, setMonstros] = useState<AdventureMonsterApi[]>([]);
  const [vinculos, setVinculos] = useState<AdventureZoneMonsterApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [zonaFiltro, setZonaFiltro] = useState<number | "">("");
  const [statusFiltro, setStatusFiltro] = useState<"todos" | "ativo" | "inativo">("todos");
  const [ordenacao, setOrdenacao] = useState<CampoOrdenacao>("nivel");
  const [ordemDesc, setOrdemDesc] = useState(false);

  const [mostrarCriacaoRapida, setMostrarCriacaoRapida] = useState(false);
  const [formRapido, setFormRapido] = useState<Partial<AdventureMonsterApi>>({});
  const [salvandoRapido, setSalvandoRapido] = useState(false);
  const [monstroEditando, setMonstroEditando] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [m, v] = await Promise.all([listarMonstrosAdmin(), listarAparicoesAdmin()]);
      setMonstros(m);
      setVinculos(v);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar os monstros."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const zonasPorMonstro = useMemo(() => {
    const mapa = new Map<number, Set<number>>();
    for (const v of vinculos) {
      if (!mapa.has(v.id_monstro)) mapa.set(v.id_monstro, new Set());
      mapa.get(v.id_monstro)!.add(v.id_area);
    }
    return mapa;
  }, [vinculos]);

  const listaFiltrada = useMemo(() => {
    let lista = monstros;
    if (busca.trim()) {
      const termo = busca.trim().toLowerCase();
      lista = lista.filter((m) => m.nome.toLowerCase().includes(termo));
    }
    if (zonaFiltro !== "") {
      lista = lista.filter((m) => zonasPorMonstro.get(m.id)?.has(zonaFiltro));
    }
    if (statusFiltro !== "todos") {
      lista = lista.filter((m) => (statusFiltro === "ativo" ? m.ativo : !m.ativo));
    }
    const sinal = ordemDesc ? -1 : 1;
    return [...lista].sort((a, b) => sinal * ((a[ordenacao] ?? 0) - (b[ordenacao] ?? 0)));
  }, [monstros, busca, zonaFiltro, statusFiltro, ordenacao, ordemDesc, zonasPorMonstro]);

  const zonasDisponiveis = useMemo(() => {
    const mapa = new Map<number, string>();
    for (const v of vinculos) if (v.AdventureZone) mapa.set(v.AdventureZone.id, v.AdventureZone.nome);
    return [...mapa.entries()];
  }, [vinculos]);

  function abrirCriacaoRapida() {
    setFormRapido({
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
      defesa: 0,
      ativo: true,
    });
    setMostrarCriacaoRapida(true);
  }

  async function salvarCriacaoRapida(evento: React.FormEvent) {
    evento.preventDefault();
    setSalvandoRapido(true);
    setErro("");
    try {
      await criarMonstroAdmin(formRapido);
      setMostrarCriacaoRapida(false);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível criar o monstro."));
    } finally {
      setSalvandoRapido(false);
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome..."
            className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white"
          />
          <select value={zonaFiltro} onChange={(e) => setZonaFiltro(e.target.value ? Number(e.target.value) : "")} className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white">
            <option value="">Todas as zonas</option>
            {zonasDisponiveis.map(([id, nome]) => (
              <option key={id} value={id}>
                {nome}
              </option>
            ))}
          </select>
          <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value as typeof statusFiltro)} className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white">
            <option value="todos">Ativos e inativos</option>
            <option value="ativo">Só ativos</option>
            <option value="inativo">Só inativos</option>
          </select>
          <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value as CampoOrdenacao)} className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white">
            <option value="nivel">Ordenar por nível</option>
            <option value="combat_power">Ordenar por Poder</option>
            <option value="vida_maxima">Ordenar por vida</option>
            <option value="defesa">Ordenar por defesa</option>
            <option value="xp_recompensa">Ordenar por XP</option>
            <option value="ouro_recompensa">Ordenar por Gold</option>
          </select>
          <button type="button" onClick={() => setOrdemDesc((v) => !v)} className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/70 hover:text-white">
            {ordemDesc ? "↓ Maior primeiro" : "↑ Menor primeiro"}
          </button>
        </div>
        <button type="button" onClick={abrirCriacaoRapida} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
          + Novo monstro
        </button>
      </div>
      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      {carregando ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {listaFiltrada.map((monstro) => (
            <div key={monstro.id} className={`flex items-center justify-between gap-3 rounded-xl border border-[#F3B43F]/30 bg-[#292018]/80 p-3 text-white ${!monstro.ativo ? "opacity-50" : ""}`}>
              <div className="min-w-0">
                <p className="font-bold">
                  {monstro.nome} <span className="text-xs text-white/50">(nível {monstro.nivel ?? "?"})</span>
                </p>
                <p className="text-xs text-white/50">
                  Vida {monstro.vida_maxima ?? "?"} · Defesa {monstro.defesa ?? 0} · Dano {monstro.dano_min ?? "?"}-{monstro.dano_max ?? "?"} · Poder {monstro.combat_power ?? "?"}
                </p>
                <p className="text-xs text-white/50">
                  XP {monstro.xp_recompensa ?? "?"} · Ouro {monstro.ouro_recompensa ?? "?"}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-2 text-sm">
                <button type="button" onClick={() => setMonstroEditando(monstro.id)} className="text-white/70 hover:underline">
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
          {listaFiltrada.length === 0 && <p className="text-sm text-white/50">Nenhum monstro encontrado.</p>}
        </div>
      )}

      {mostrarCriacaoRapida && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMostrarCriacaoRapida(false)}>
          <form onSubmit={salvarCriacaoRapida} onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-[#F3B43F]">Novo monstro</p>
            <p className="text-xs text-white/50">Criação rápida — combate/recompensas/drops se ajustam depois, em &quot;Editar&quot;.</p>
            <label className="flex flex-col gap-1 text-xs">
              Nome
              <input required value={formRapido.nome ?? ""} onChange={(e) => setFormRapido((f) => ({ ...f, nome: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-xs">
                Nível
                <input type="number" min={1} value={formRapido.nivel ?? 1} onChange={(e) => setFormRapido((f) => ({ ...f, nivel: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Vida máxima
                <input type="number" min={1} value={formRapido.vida_maxima ?? 30} onChange={(e) => setFormRapido((f) => ({ ...f, vida_maxima: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Dano mínimo
                <input type="number" min={0} value={formRapido.dano_min ?? 1} onChange={(e) => setFormRapido((f) => ({ ...f, dano_min: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Dano máximo
                <input type="number" min={0} value={formRapido.dano_max ?? 3} onChange={(e) => setFormRapido((f) => ({ ...f, dano_max: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setMostrarCriacaoRapida(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">
                Cancelar
              </button>
              <button type="submit" disabled={salvandoRapido} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
                {salvandoRapido ? "Salvando..." : "Criar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {monstroEditando != null && (
        <MonsterEditor
          idMonstro={monstroEditando}
          onFechar={() => setMonstroEditando(null)}
          onSalvo={() => {
            setMonstroEditando(null);
            carregar();
          }}
          onSimular={(id) => {
            setMonstroEditando(null);
            onSimular(id);
          }}
        />
      )}
    </div>
  );
}
