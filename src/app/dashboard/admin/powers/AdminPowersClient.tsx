"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { catalogoStatusAdmin, criarPowerAdmin, duplicarPowerAdmin, listarClassesPublicas, listarPowersAdmin, listarRacasPublicas, mensagemDeErroAdmin, type ClassPublicaApi, type PayloadPowerAdmin, type PowerApi, type RacePublicaApi, type StatusCatalogEntryApi, USAGE_SCOPES, NOME_USAGE_SCOPE } from "@/lib/api/admin";
import DetalhePower from "./DetalhePower";
import EvolucaoNaturezaSection from "./EvolucaoNaturezaSection";
import { formularioPowerVazio, TIPOS_PODER, ATRIBUTOS } from "./powerForm";

export default function AdminPowersClient() {
  const [powers, setPowers] = useState<PowerApi[]>([]);
  const [classes, setClasses] = useState<ClassPublicaApi[]>([]);
  const [racas, setRacas] = useState<RacePublicaApi[]>([]);
  const [catalogo, setCatalogo] = useState<StatusCatalogEntryApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [filtroNome, setFiltroNome] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroEscala, setFiltroEscala] = useState("");

  const [detalheId, setDetalheId] = useState<number | null>(null);
  const [mostrarCriacao, setMostrarCriacao] = useState(false);
  const [novoForm, setNovoForm] = useState<PayloadPowerAdmin>(formularioPowerVazio());
  const [criando, setCriando] = useState(false);
  const [aba, setAba] = useState<"poderes" | "natureza">("poderes");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const lista = await listarPowersAdmin({
        nome: filtroNome || undefined,
        tipo_poder: filtroTipo || undefined,
        escala_atributo: filtroEscala || undefined,
      });
      setPowers(lista);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar as habilidades."));
    } finally {
      setCarregando(false);
    }
  }, [filtroNome, filtroTipo, filtroEscala]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    Promise.all([listarClassesPublicas(), listarRacasPublicas(), catalogoStatusAdmin()])
      .then(([c, r, cat]) => {
        setClasses(c);
        setRacas(r);
        setCatalogo(cat);
      })
      .catch(() => {});
  }, []);

  async function criar(evento: React.FormEvent) {
    evento.preventDefault();
    setCriando(true);
    setErro("");
    try {
      const novo = await criarPowerAdmin(novoForm);
      setMostrarCriacao(false);
      setNovoForm(formularioPowerVazio());
      await carregar();
      setDetalheId(novo.id);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível criar a habilidade."));
    } finally {
      setCriando(false);
    }
  }

  async function duplicar(id: number) {
    setErro("");
    try {
      await duplicarPowerAdmin(id);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível duplicar a habilidade."));
    }
  }

  const detalhe = powers.find((p) => p.id === detalheId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Link prefetch={false} href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
            ← Painel Administrativo
          </Link>
          <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Habilidades</h1>
        </div>
        {aba === "poderes" && (
          <button type="button" onClick={() => setMostrarCriacao(true)} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
            + Nova habilidade
          </button>
        )}
      </div>

      <div className="flex gap-2 border-b border-white/10">
        <button
          type="button"
          onClick={() => setAba("poderes")}
          className={`px-4 py-2 text-sm font-bold ${aba === "poderes" ? "border-b-2 border-[#F3B43F] text-[#F3B43F]" : "text-white/50 hover:text-white/80"}`}
        >
          Poderes
        </button>
        <button
          type="button"
          onClick={() => setAba("natureza")}
          className={`px-4 py-2 text-sm font-bold ${aba === "natureza" ? "border-b-2 border-[#F3B43F] text-[#F3B43F]" : "text-white/50 hover:text-white/80"}`}
        >
          Evolução de Natureza
        </button>
      </div>

      {aba === "natureza" && <EvolucaoNaturezaSection classes={classes} />}

      {aba === "poderes" && (
        <>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={filtroNome}
              onChange={(e) => setFiltroNome(e.target.value)}
              className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white"
            />
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white">
              <option value="">Todos os tipos</option>
              {TIPOS_PODER.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select value={filtroEscala} onChange={(e) => setFiltroEscala(e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white">
              <option value="">Toda escala</option>
              {ATRIBUTOS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}

          {carregando ? (
            <p className="text-sm text-white/50">Carregando...</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {powers.map((power) => (
                <div key={power.id} className="flex flex-col gap-1 rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <p className="font-imFeel text-lg text-[#F3B43F]">{power.nome}</p>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-white/60">{power.tipo_poder}</span>
                  </div>
                  <p className="text-xs text-white/50">Escala: {power.escala_atributo} · {power.efeitosDeStatus?.length ?? 0} efeito(s) de status</p>
                  <div className="mt-2 flex gap-2 text-sm">
                    <button type="button" onClick={() => setDetalheId(power.id)} className="text-[#F3B43F] hover:underline">
                      Gerenciar
                    </button>
                    <button type="button" onClick={() => duplicar(power.id)} className="text-white/70 hover:underline">
                      Duplicar
                    </button>
                  </div>
                </div>
              ))}
              {powers.length === 0 && <p className="text-sm text-white/50">Nenhuma habilidade cadastrada ainda.</p>}
            </div>
          )}
        </>
      )}

      {aba === "poderes" && mostrarCriacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMostrarCriacao(false)}>
          <form onSubmit={criar} onClick={(e) => e.stopPropagation()} className="flex w-full max-w-md flex-col gap-3 rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-[#F3B43F]">Nova habilidade</p>
            <label className="flex flex-col gap-1 text-xs">
              Nome
              <input required value={novoForm.nome} onChange={(e) => setNovoForm((f) => ({ ...f, nome: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Descrição
              <textarea required value={novoForm.descricao} onChange={(e) => setNovoForm((f) => ({ ...f, descricao: e.target.value }))} rows={2} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Tipo
                <select value={novoForm.tipo_poder} onChange={(e) => setNovoForm((f) => ({ ...f, tipo_poder: e.target.value as "Ativo" | "Passivo" }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
                  {TIPOS_PODER.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Escala
                <select value={novoForm.escala_atributo} onChange={(e) => setNovoForm((f) => ({ ...f, escala_atributo: e.target.value as PayloadPowerAdmin["escala_atributo"] }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
                  {ATRIBUTOS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-1 text-xs">
              Quem pode usar
              <select value={novoForm.usage_scope ?? "CHARACTER"} onChange={(e) => setNovoForm((f) => ({ ...f, usage_scope: e.target.value as PayloadPowerAdmin["usage_scope"] }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
                {USAGE_SCOPES.map((u) => (
                  <option key={u} value={u}>
                    {NOME_USAGE_SCOPE[u]}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-[11px] text-white/50">Depois de criada, use &quot;Gerenciar&quot; pra ajustar números, vincular Classe/Raça e configurar efeitos de status.</p>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setMostrarCriacao(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">
                Cancelar
              </button>
              <button type="submit" disabled={criando} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
                {criando ? "Criando..." : "Criar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {detalhe && (
        <DetalhePower
          power={detalhe}
          classes={classes}
          racas={racas}
          catalogo={catalogo}
          onFechar={() => setDetalheId(null)}
          onMudou={carregar}
        />
      )}
    </div>
  );
}
