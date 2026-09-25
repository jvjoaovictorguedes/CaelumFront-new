"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  desativarMediaGrupoAdmin,
  listarMediaGruposAdmin,
  listarMediaVersoesAdmin,
  mensagemDeErroAdmin,
  reverterMediaVersaoAdmin,
  type MediaAssetApi,
} from "@/lib/api/admin";
import { resolveMediaUrl } from "@/utils/media-url";
import { enviarMediaAdmin } from "./uploadMediaAction";

const CATEGORIAS = ["Item", "Power", "Monster", "EquipmentSet", "Outro"] as const;

function urlDaVersao(grupo: string, versao: number) {
  return resolveMediaUrl(`/api/media/${grupo}?v=${versao}`) ?? "";
}
function urlAtual(grupo: string) {
  return resolveMediaUrl(`/api/media/${grupo}`) ?? "";
}

function DetalheGrupo({ grupo, onFechar, onMudou }: { grupo: string; onFechar: () => void; onMudou: () => void }) {
  const [versoes, setVersoes] = useState<MediaAssetApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [categoria, setCategoria] = useState<(typeof CATEGORIAS)[number]>("Outro");
  const [descricao, setDescricao] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const lista = await listarMediaVersoesAdmin(grupo);
      setVersoes(lista);
      if (lista[0]) setCategoria(lista[0].categoria);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar as versões."));
    } finally {
      setCarregando(false);
    }
  }, [grupo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function enviarNovaVersao() {
    if (!arquivo) {
      setErro("Escolha um arquivo primeiro.");
      return;
    }
    setEnviando(true);
    setErro("");
    setMensagem("");
    try {
      const formData = new FormData();
      formData.append("grupo", grupo);
      formData.append("categoria", categoria);
      if (descricao) formData.append("descricao", descricao);
      formData.append("arquivo", arquivo);
      const resultado = await enviarMediaAdmin(formData);
      if (!resultado.success) {
        setErro(resultado.message || "Não foi possível enviar o arquivo.");
        return;
      }
      setMensagem(`Nova versão (v${resultado.asset?.versao}) enviada.`);
      setArquivo(null);
      await carregar();
      onMudou();
    } finally {
      setEnviando(false);
    }
  }

  async function reverter(versao: number) {
    setErro("");
    try {
      await reverterMediaVersaoAdmin(grupo, versao);
      setMensagem(`Revertido pra versão v${versao} (criou uma nova versão com os mesmos bytes).`);
      await carregar();
      onMudou();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível reverter."));
    }
  }

  async function desativar() {
    if (!window.confirm(`Desativar o grupo "${grupo}"? Qualquer imagem_url que aponte pra ele vai parar de carregar.`)) return;
    setErro("");
    try {
      await desativarMediaGrupoAdmin(grupo);
      onMudou();
      onFechar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível desativar o grupo."));
    }
  }

  function copiarUrl() {
    navigator.clipboard?.writeText(urlAtual(grupo));
    setMensagem("URL copiada — cole no campo Imagem (URL) de Item/Habilidade/etc.");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onFechar}>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-4 overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <p className="font-imFeel text-2xl text-[#F3B43F] break-all">{grupo}</p>
          <button type="button" onClick={onFechar} className="text-white/60 hover:text-white shrink-0 pl-2">
            ✕
          </button>
        </div>
        {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
        {mensagem && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-[#F3B43F]">{mensagem}</p>}

        <div className="flex items-center gap-3 rounded-xl border border-white/10 p-3">
          <code className="flex-1 overflow-x-auto whitespace-nowrap text-xs text-white/70">{urlAtual(grupo)}</code>
          <button type="button" onClick={copiarUrl} className="shrink-0 rounded-lg border border-[#F3B43F]/50 px-3 py-1.5 text-xs font-bold text-[#F3B43F] hover:bg-[#F3B43F]/10">
            Copiar URL
          </button>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-white/10 p-3">
          <p className="text-xs font-bold uppercase text-[#F3B43F]/80">Enviar nova versão</p>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-[10px] text-white/60">
              Categoria
              <select value={categoria} onChange={(e) => setCategoria(e.target.value as (typeof CATEGORIAS)[number])} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-1 flex-col gap-1 text-[10px] text-white/60">
              Arquivo
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-xs" />
            </label>
            <button type="button" onClick={enviarNovaVersao} disabled={enviando} className="rounded-lg bg-[#BC8418] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
              {enviando ? "Enviando..." : "+ Versão"}
            </button>
          </div>
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição (opcional)" rows={2} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-white/10 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase text-[#F3B43F]/80">Histórico de versões</p>
            <button type="button" onClick={desativar} className="text-xs font-bold text-red-400 hover:underline">
              Desativar grupo
            </button>
          </div>
          {carregando ? (
            <p className="text-xs text-white/50">Carregando...</p>
          ) : (
            versoes.map((v) => (
              <div key={v.id} className={`flex items-center gap-3 rounded-lg px-2 py-1.5 text-xs ${v.ativo ? "bg-[#F3B43F]/10" : "bg-black/20"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail de mídia enviada pelo admin, nunca passa por next/image */}
                <img src={urlDaVersao(grupo, v.versao)} alt={`v${v.versao}`} className="h-10 w-10 shrink-0 rounded-lg border border-white/10 bg-black/30 object-contain" />
                <div className="flex-1">
                  <p className={v.ativo ? "font-bold text-[#F3B43F]" : "text-white/70"}>
                    v{v.versao} {v.ativo && "(atual)"} · {v.categoria} · {(v.tamanho_bytes / 1024).toFixed(0)}KB
                  </p>
                  {v.descricao && <p className="text-white/50">{v.descricao}</p>}
                </div>
                {!v.ativo && (
                  <button type="button" onClick={() => reverter(v.versao)} className="shrink-0 text-[#F3B43F] hover:underline">
                    Reverter
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminMediaClient() {
  const [itens, setItens] = useState<MediaAssetApi[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroNome, setFiltroNome] = useState("");
  const [grupoDetalhe, setGrupoDetalhe] = useState<string | null>(null);

  const [mostrarUpload, setMostrarUpload] = useState(false);
  const [novoGrupo, setNovoGrupo] = useState("");
  const [novaCategoria, setNovaCategoria] = useState<(typeof CATEGORIAS)[number]>("Item");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novoArquivo, setNovoArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erroUpload, setErroUpload] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resultado = await listarMediaGruposAdmin({
        categoria: filtroCategoria || undefined,
        nome: filtroNome || undefined,
        porPagina: 60,
      });
      setItens(resultado.itens);
      setTotal(resultado.total);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar a mídia."));
    } finally {
      setCarregando(false);
    }
  }, [filtroCategoria, filtroNome]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function enviar() {
    if (!novoGrupo.trim() || !novoArquivo) {
      setErroUpload("Preencha o grupo e escolha um arquivo.");
      return;
    }
    setEnviando(true);
    setErroUpload("");
    try {
      const formData = new FormData();
      formData.append("grupo", novoGrupo.trim());
      formData.append("categoria", novaCategoria);
      if (novaDescricao) formData.append("descricao", novaDescricao);
      formData.append("arquivo", novoArquivo);
      const resultado = await enviarMediaAdmin(formData);
      if (!resultado.success) {
        setErroUpload(resultado.message || "Não foi possível enviar o arquivo.");
        return;
      }
      setMostrarUpload(false);
      setNovoGrupo("");
      setNovaDescricao("");
      setNovoArquivo(null);
      await carregar();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
            ← Painel Administrativo
          </Link>
          <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Biblioteca de Mídia</h1>
        </div>
        <button type="button" onClick={() => setMostrarUpload(true)} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
          + Enviar mídia
        </button>
      </div>
      <p className="text-xs text-white/50">
        Cada envio pertence a um &quot;grupo&quot; — suba de novo pro mesmo grupo pra criar uma nova versão sem perder as
        anteriores. Copie a URL de um grupo e cole no campo Imagem (URL) de Itens, Habilidades, Conjuntos etc.
      </p>

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Buscar por grupo..."
          value={filtroNome}
          onChange={(e) => setFiltroNome(e.target.value)}
          className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white"
        />
        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white">
          <option value="">Todas as categorias</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {itens.map((item) => (
            <button
              key={item.grupo}
              type="button"
              onClick={() => setGrupoDetalhe(item.grupo)}
              className="flex flex-col gap-1 rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-3 text-left text-white hover:bg-[#3a2c14]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail de mídia enviada pelo admin, nunca passa por next/image */}
              <img src={urlDaVersao(item.grupo, item.versao)} alt={item.grupo} className="h-24 w-full rounded-lg border border-white/10 bg-black/30 object-contain" />
              <p className="truncate text-xs font-bold text-[#F3B43F]" title={item.grupo}>
                {item.grupo}
              </p>
              <p className="text-[10px] text-white/50">
                {item.categoria} · v{item.versao}
              </p>
            </button>
          ))}
          {itens.length === 0 && <p className="col-span-full text-sm text-white/50">Nenhuma mídia enviada ainda.</p>}
        </div>
      )}
      {total > itens.length && <p className="text-xs text-white/40">Mostrando {itens.length} de {total} — refine a busca pra ver mais.</p>}

      {mostrarUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMostrarUpload(false)}>
          <div onClick={(e) => e.stopPropagation()} className="flex w-full max-w-md flex-col gap-3 rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-[#F3B43F]">Enviar mídia</p>
            {erroUpload && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erroUpload}</p>}
            <label className="flex flex-col gap-1 text-xs">
              Grupo (identificador único, ex: espada-flamejante-icone)
              <input
                required
                value={novoGrupo}
                onChange={(e) => setNovoGrupo(e.target.value)}
                placeholder="minusculo-com-hifen"
                className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Categoria
              <select value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value as (typeof CATEGORIAS)[number])} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Descrição (opcional)
              <textarea value={novaDescricao} onChange={(e) => setNovaDescricao(e.target.value)} rows={2} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Arquivo (PNG, JPEG, WEBP ou GIF — até 5MB)
              <input required type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => setNovoArquivo(e.target.files?.[0] ?? null)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setMostrarUpload(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">
                Cancelar
              </button>
              <button type="button" onClick={enviar} disabled={enviando} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
                {enviando ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {grupoDetalhe && <DetalheGrupo grupo={grupoDetalhe} onFechar={() => setGrupoDetalhe(null)} onMudou={carregar} />}
    </div>
  );
}
