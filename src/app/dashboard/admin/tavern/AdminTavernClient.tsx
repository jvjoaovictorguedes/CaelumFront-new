"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  atualizarTavernGameAdmin,
  atualizarTavernMenuItemAdmin,
  atualizarTavernSettingsAdmin,
  criarTavernGameAdmin,
  criarTavernMenuItemAdmin,
  desativarTavernGameAdmin,
  desativarTavernMenuItemAdmin,
  duplicarTavernGameAdmin,
  duplicarTavernMenuItemAdmin,
  listarTavernGamesAdmin,
  listarTavernMenuAdmin,
  mensagemDeErroAdmin,
  obterTavernMetricasAdmin,
  obterTavernSettingsAdmin,
  reativarTavernGameAdmin,
  reativarTavernMenuItemAdmin,
  type PayloadTavernGameAdmin,
  type PayloadTavernMenuItemAdmin,
  type TavernBuffKey,
  type TavernGameApi,
  type TavernMenuItemApi,
  type TavernMetricsApi,
  type TavernSettingsApi,
} from "@/lib/api/admin";

const BUFF_KEYS: TavernBuffKey[] = [
  "MAX_HP_PCT",
  "MAX_MANA_PCT",
  "PVE_DAMAGE_PCT",
  "PVE_DEFENSE_PCT",
  "ADVENTURE_XP_PCT",
  "EXPEDITION_XP_PCT",
  "FORGE_XP_PCT",
  "ALCHEMY_XP_PCT",
  "FISHING_CONTROL_PCT",
];
const CATEGORIAS = ["Refeicao", "Bebida"] as const;
const PRESENTATIONS = ["COIN", "RUNES", "DICE_PARITY", "CARD_SIDE"] as const;

type Aba = "cardapio" | "jogos" | "config" | "metricas";

function menuFormVazio(): PayloadTavernMenuItemAdmin {
  return { nome: "", descricao: "", categoria: "Refeicao", preco_gold: 40, buff_key: "MAX_HP_PCT", magnitude: 5, duracao_segundos: 3600 };
}
function gameFormVazio(): PayloadTavernGameAdmin {
  return { key: "", nome: "", descricao: "", presentation_key: "COIN", payout_multiplier: 1.9, min_bet: 10, max_bet: 1000 };
}

export default function AdminTavernClient() {
  const [aba, setAba] = useState<Aba>("cardapio");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Taverna</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ["cardapio", "Cardápio"],
          ["jogos", "Jogos"],
          ["config", "Descanso e Configurações"],
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

      {aba === "cardapio" && <AbaCardapio />}
      {aba === "jogos" && <AbaJogos />}
      {aba === "config" && <AbaConfig />}
      {aba === "metricas" && <AbaMetricas />}
    </div>
  );
}

function AbaCardapio() {
  const [itens, setItens] = useState<TavernMenuItemApi[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<PayloadTavernMenuItemAdmin>(menuFormVazio());
  const [salvando, setSalvando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resultado = await listarTavernMenuAdmin({ porPagina: 50 });
      setItens(resultado.itens);
      setTotal(resultado.total);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar o cardápio."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirCriacao() {
    setEditandoId(null);
    setForm(menuFormVazio());
    setMostrarForm(true);
    setMensagem("");
  }
  function abrirEdicao(item: TavernMenuItemApi) {
    setEditandoId(item.id);
    setForm({
      nome: item.nome,
      descricao: item.descricao,
      categoria: item.categoria,
      preco_gold: item.preco_gold,
      buff_key: item.buff_key,
      magnitude: item.magnitude,
      duracao_segundos: item.duracao_segundos,
      imagem_url: item.imagem_url ?? "",
      ordem: item.ordem,
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
        await atualizarTavernMenuItemAdmin(editandoId, form);
        setMensagem(`Oferta "${form.nome}" atualizada.`);
      } else {
        await criarTavernMenuItemAdmin(form);
        setMensagem(`Oferta "${form.nome}" criada.`);
      }
      setMostrarForm(false);
      await carregar();
    } catch (error) {
      setMensagem(mensagemDeErroAdmin(error, "Não foi possível salvar a oferta."));
    } finally {
      setSalvando(false);
    }
  }

  async function duplicar(item: TavernMenuItemApi) {
    try {
      await duplicarTavernMenuItemAdmin(item.id);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível duplicar a oferta."));
    }
  }
  async function alternarAtivo(item: TavernMenuItemApi) {
    try {
      if (item.ativo) await desativarTavernMenuItemAdmin(item.id);
      else await reativarTavernMenuItemAdmin(item.id);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível mudar o status."));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60">{total} oferta(s)</p>
        <button type="button" onClick={abrirCriacao} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
          + Nova oferta
        </button>
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}

      <div className="overflow-x-auto rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80">
        <table className="w-full text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-white/50">
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Categoria</th>
              <th className="px-3 py-2">Buff</th>
              <th className="px-3 py-2">Preço</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-white/50">Carregando...</td></tr>
            ) : itens.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-white/50">Nenhuma oferta cadastrada.</td></tr>
            ) : (
              itens.map((item) => (
                <tr key={item.id} className="border-b border-white/5">
                  <td className="px-3 py-2 font-bold">{item.nome}</td>
                  <td className="px-3 py-2">{item.categoria}</td>
                  <td className="px-3 py-2 text-xs">{item.buff_key} +{item.magnitude}%</td>
                  <td className="px-3 py-2">{item.preco_gold} Gold</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${item.ativo ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/50"}`}>
                      {item.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => abrirEdicao(item)} className="text-[#F3B43F] hover:underline">Editar</button>
                      <button type="button" onClick={() => duplicar(item)} className="text-white/70 hover:underline">Duplicar</button>
                      <button type="button" onClick={() => alternarAtivo(item)} className="text-white/70 hover:underline">
                        {item.ativo ? "Desativar" : "Reativar"}
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
            className="flex max-h-[85vh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl"
          >
            <p className="font-imFeel text-xl text-[#F3B43F]">{editandoId ? "Editar oferta" : "Nova oferta"}</p>
            {mensagem && <p className="text-sm text-[#F3B43F]">{mensagem}</p>}

            <label className="flex flex-col gap-1 text-xs">
              Nome
              <input required value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Descrição
              <textarea required value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" rows={2} />
            </label>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Categoria
                <select value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value as "Refeicao" | "Bebida" }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{c === "Refeicao" ? "Refeição" : "Bebida"}</option>)}
                </select>
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Preço (Gold)
                <input required type="number" min={0} value={form.preco_gold} onChange={(e) => setForm((f) => ({ ...f, preco_gold: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
            </div>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Buff
                <select value={form.buff_key} onChange={(e) => setForm((f) => ({ ...f, buff_key: e.target.value as TavernBuffKey }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
                  {BUFF_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Magnitude (%)
                <input required type="number" min={0.1} step={0.1} value={form.magnitude} onChange={(e) => setForm((f) => ({ ...f, magnitude: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Duração (s)
                <input required type="number" min={1} value={form.duracao_segundos} onChange={(e) => setForm((f) => ({ ...f, duracao_segundos: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-xs">
              Imagem (URL, opcional)
              <input value={form.imagem_url ?? ""} onChange={(e) => setForm((f) => ({ ...f, imagem_url: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
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

function AbaJogos() {
  const [jogos, setJogos] = useState<TavernGameApi[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<PayloadTavernGameAdmin>(gameFormVazio());
  const [salvando, setSalvando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resultado = await listarTavernGamesAdmin({ porPagina: 50 });
      setJogos(resultado.itens);
      setTotal(resultado.total);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar os jogos."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirCriacao() {
    setEditandoId(null);
    setForm(gameFormVazio());
    setMostrarForm(true);
    setMensagem("");
  }
  function abrirEdicao(jogo: TavernGameApi) {
    setEditandoId(jogo.id);
    setForm({
      key: jogo.key,
      nome: jogo.nome,
      descricao: jogo.descricao,
      presentation_key: jogo.presentation_key,
      payout_multiplier: jogo.payout_multiplier,
      min_bet: jogo.min_bet,
      max_bet: jogo.max_bet,
      ordem: jogo.ordem,
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
        await atualizarTavernGameAdmin(editandoId, form);
        setMensagem(`Jogo "${form.nome}" atualizado.`);
      } else {
        await criarTavernGameAdmin(form);
        setMensagem(`Jogo "${form.nome}" criado.`);
      }
      setMostrarForm(false);
      await carregar();
    } catch (error) {
      setMensagem(mensagemDeErroAdmin(error, "Não foi possível salvar o jogo."));
    } finally {
      setSalvando(false);
    }
  }

  async function duplicar(jogo: TavernGameApi) {
    try {
      await duplicarTavernGameAdmin(jogo.id);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível duplicar o jogo."));
    }
  }
  async function alternarAtivo(jogo: TavernGameApi) {
    try {
      if (jogo.ativo) await desativarTavernGameAdmin(jogo.id);
      else await reativarTavernGameAdmin(jogo.id);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível mudar o status."));
    }
  }

  const alertaPayout = form.payout_multiplier >= 2.0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60">{total} jogo(s) — win_chance_ppm sempre travado em 500000 (50%) na V1</p>
        <button type="button" onClick={abrirCriacao} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
          + Novo jogo
        </button>
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}

      <div className="overflow-x-auto rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80">
        <table className="w-full text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-white/50">
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Apresentação</th>
              <th className="px-3 py-2">Retorno</th>
              <th className="px-3 py-2">Aposta</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-white/50">Carregando...</td></tr>
            ) : jogos.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-white/50">Nenhum jogo cadastrado.</td></tr>
            ) : (
              jogos.map((jogo) => (
                <tr key={jogo.id} className="border-b border-white/5">
                  <td className="px-3 py-2 font-bold">
                    {jogo.nome}
                    {jogo.houseEdgeAlerta && (
                      <span className="ml-2 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-red-300">Alerta</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{jogo.presentation_key}</td>
                  <td className="px-3 py-2">{jogo.payout_multiplier.toFixed(2)}x</td>
                  <td className="px-3 py-2">{jogo.min_bet}–{jogo.max_bet}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${jogo.ativo ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/50"}`}>
                      {jogo.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => abrirEdicao(jogo)} className="text-[#F3B43F] hover:underline">Editar</button>
                      <button type="button" onClick={() => duplicar(jogo)} className="text-white/70 hover:underline">Duplicar</button>
                      <button type="button" onClick={() => alternarAtivo(jogo)} className="text-white/70 hover:underline">
                        {jogo.ativo ? "Desativar" : "Reativar"}
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
            className="flex max-h-[85vh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl"
          >
            <p className="font-imFeel text-xl text-[#F3B43F]">{editandoId ? "Editar jogo" : "Novo jogo"}</p>
            {mensagem && <p className="text-sm text-[#F3B43F]">{mensagem}</p>}

            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Key (estável, única)
                <input required disabled={!!editandoId} value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm disabled:opacity-50" />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Apresentação
                <select value={form.presentation_key} onChange={(e) => setForm((f) => ({ ...f, presentation_key: e.target.value as PayloadTavernGameAdmin["presentation_key"] }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
                  {PRESENTATIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-1 text-xs">
              Nome
              <input required value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Descrição
              <textarea required value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" rows={2} />
            </label>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Retorno (multiplicador)
                <input required type="number" min={0.1} step={0.01} value={form.payout_multiplier} onChange={(e) => setForm((f) => ({ ...f, payout_multiplier: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Aposta mínima
                <input required type="number" min={1} value={form.min_bet} onChange={(e) => setForm((f) => ({ ...f, min_bet: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Aposta máxima
                <input required type="number" min={1} value={form.max_bet} onChange={(e) => setForm((f) => ({ ...f, max_bet: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
            </div>
            {alertaPayout && (
              <p className="rounded-lg bg-red-900/30 px-3 py-2 text-xs text-red-300">
                Retorno ≥ 2.00 — o jogo deixa de ser Gold sink (deixa de dar vantagem pra casa).
              </p>
            )}

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

function AbaConfig() {
  const [config, setConfig] = useState<TavernSettingsApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setConfig(await obterTavernSettingsAdmin());
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
      setConfig(await atualizarTavernSettingsAdmin(config));
      setMensagem("Configurações salvas.");
    } catch (error) {
      setMensagem(mensagemDeErroAdmin(error, "Não foi possível salvar as configurações."));
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <p className="text-sm text-white/60">Carregando...</p>;
  if (!config) return <p className="text-sm text-red-400">{erro}</p>;

  // Preview simples de custo de descanso pra alguns cenários de exemplo.
  const exemplos = [1, 10, 30].map((nivel) => {
    const necessidade = 1; // pior caso: 0% de HP/Mana
    const custo = Math.max(
      config["tavern.rest.minimum_gold"],
      Math.round(config["tavern.rest.base_gold"] + nivel * config["tavern.rest.level_factor"] + necessidade * config["tavern.rest.missing_resource_factor"]),
    );
    return { nivel, custo };
  });

  return (
    <form onSubmit={salvar} className="flex flex-col gap-4">
      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      {mensagem && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-[#F3B43F]">{mensagem}</p>}

      <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-5">
        <div className="flex items-center justify-between">
          <p className="font-imFeel text-xl text-[#F3B43F]">Taverna ativa</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={config["tavern.enabled"]} onChange={(e) => setConfig({ ...config, "tavern.enabled": e.target.checked })} />
            {config["tavern.enabled"] ? "Ativa" : "Fechada (descanso/compras/apostas bloqueados)"}
          </label>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-5">
        <p className="mb-3 font-imFeel text-xl text-[#F3B43F]">Descanso</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs">
            Custo base
            <input type="number" min={0} value={config["tavern.rest.base_gold"]} onChange={(e) => setConfig({ ...config, "tavern.rest.base_gold": Number(e.target.value) })} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Fator por nível
            <input type="number" min={0} value={config["tavern.rest.level_factor"]} onChange={(e) => setConfig({ ...config, "tavern.rest.level_factor": Number(e.target.value) })} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Fator de necessidade
            <input type="number" min={0} value={config["tavern.rest.missing_resource_factor"]} onChange={(e) => setConfig({ ...config, "tavern.rest.missing_resource_factor": Number(e.target.value) })} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Custo mínimo
            <input type="number" min={0} value={config["tavern.rest.minimum_gold"]} onChange={(e) => setConfig({ ...config, "tavern.rest.minimum_gold": Number(e.target.value) })} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
          </label>
        </div>
        <div className="mt-3 flex gap-3 text-xs text-white/60">
          <span>Preview (HP/Mana zerados):</span>
          {exemplos.map((ex) => (
            <span key={ex.nivel} className="rounded bg-black/30 px-2 py-1">Nv.{ex.nivel} → {ex.custo} Gold</span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-5">
        <p className="mb-3 font-imFeel text-xl text-[#F3B43F]">Jogos</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs">
            Teto global de aposta
            <input type="number" min={0} value={config["tavern.games.max_bet_global"]} onChange={(e) => setConfig({ ...config, "tavern.games.max_bet_global": Number(e.target.value) })} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Limite diário de apostas (0 = desativado)
            <input type="number" min={0} value={config["tavern.games.daily_wager_limit"]} onChange={(e) => setConfig({ ...config, "tavern.games.daily_wager_limit": Number(e.target.value) })} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
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
  const [metricas, setMetricas] = useState<TavernMetricsApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    (async () => {
      setCarregando(true);
      setErro("");
      try {
        setMetricas(await obterTavernMetricasAdmin());
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-5">
          <p className="font-imFeel text-lg text-[#F3B43F]">Últimas 24h</p>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            <li>Apostas: {metricas.apostas24h.apostas}</li>
            <li>Gold apostado: {metricas.apostas24h.gold_apostado}</li>
            <li>Gold pago: {metricas.apostas24h.gold_pago}</li>
            <li>Gold líquido removido: {metricas.apostas24h.gold_liquido_removido}</li>
            <li>Taxa de vitória observada: {Math.round(metricas.apostas24h.taxa_vitoria * 100)}%</li>
            <li>Aposta média: {metricas.apostas24h.aposta_media.toFixed(1)}</li>
            <li>Maior aposta: {metricas.apostas24h.maior_aposta}</li>
          </ul>
        </div>
        <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-5">
          <p className="font-imFeel text-lg text-[#F3B43F]">Últimos 7 dias</p>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            <li>Apostas: {metricas.apostas7d.apostas}</li>
            <li>Gold apostado: {metricas.apostas7d.gold_apostado}</li>
            <li>Gold pago: {metricas.apostas7d.gold_pago}</li>
            <li>Gold líquido removido: {metricas.apostas7d.gold_liquido_removido}</li>
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-5">
        <p className="font-imFeel text-lg text-[#F3B43F]">Compras por oferta (total histórico)</p>
        {metricas.comprasPorOferta.length === 0 ? (
          <p className="mt-2 text-sm text-white/50">Nenhuma compra registrada ainda.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            {metricas.comprasPorOferta.map((c) => (
              <li key={c.nome} className="flex justify-between">
                <span>{c.nome}</span>
                <span className="font-bold text-[#F3B43F]">{c.total}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
