"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  atualizarWikiArtigoAdmin,
  criarWikiArtigoAdmin,
  duplicarWikiArtigoAdmin,
  excluirWikiArtigoAdmin,
  listarWikiArtigosAdmin,
  listarWikiCategoriasAdmin,
  mensagemDeErroAdmin,
  type PayloadWikiArticleAdmin,
  type WikiArticleAdminApi,
} from "@/lib/api/admin";

function formularioVazio(): PayloadWikiArticleAdmin {
  return { categoria: "", titulo: "", resumo: "", conteudo: "", slug: "", ordem: 0, imagem_url: "", publicado: true };
}

export default function AdminWikiClient() {
  const [artigos, setArtigos] = useState<WikiArticleAdminApi[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroNome, setFiltroNome] = useState("");

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<PayloadWikiArticleAdmin>(formularioVazio());
  const [salvando, setSalvando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [listaArtigos, listaCategorias] = await Promise.all([
        listarWikiArtigosAdmin({ categoria: filtroCategoria || undefined, nome: filtroNome || undefined }),
        listarWikiCategoriasAdmin(),
      ]);
      setArtigos(listaArtigos);
      setCategorias(listaCategorias);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar os artigos da Wiki."));
    } finally {
      setCarregando(false);
    }
  }, [filtroCategoria, filtroNome]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirCriacao() {
    setEditandoId(null);
    setForm(formularioVazio());
    setMostrarForm(true);
    setMensagem("");
  }

  function abrirEdicao(artigo: WikiArticleAdminApi) {
    setEditandoId(artigo.id);
    setForm({
      categoria: artigo.categoria,
      slug: artigo.slug,
      titulo: artigo.titulo,
      resumo: artigo.resumo ?? "",
      conteudo: artigo.conteudo,
      ordem: artigo.ordem,
      imagem_url: artigo.imagem_url ?? "",
      publicado: artigo.publicado,
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
        await atualizarWikiArtigoAdmin(editandoId, form);
        setMensagem(`Artigo "${form.titulo}" atualizado.`);
      } else {
        await criarWikiArtigoAdmin(form);
        setMensagem(`Artigo "${form.titulo}" criado.`);
      }
      setMostrarForm(false);
      await carregar();
    } catch (error) {
      setMensagem(mensagemDeErroAdmin(error, "Não foi possível salvar o artigo."));
    } finally {
      setSalvando(false);
    }
  }

  async function alternarPublicacao(artigo: WikiArticleAdminApi) {
    try {
      await atualizarWikiArtigoAdmin(artigo.id, { publicado: !artigo.publicado });
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível mudar a publicação."));
    }
  }

  async function duplicar(artigo: WikiArticleAdminApi) {
    try {
      await duplicarWikiArtigoAdmin(artigo.id);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível duplicar o artigo."));
    }
  }

  async function excluir(artigo: WikiArticleAdminApi) {
    if (!window.confirm(`Excluir "${artigo.titulo}" de vez? Essa ação não pode ser desfeita.`)) return;
    try {
      await excluirWikiArtigoAdmin(artigo.id);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível excluir o artigo."));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
            ← Painel Administrativo
          </Link>
          <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Wiki do Jogo</h1>
          <p className="mt-1 text-sm text-white/60">
            Artigos de referência pro jogador (/dashboard/wiki) — categoria é texto livre, cria uma nova categoria só
            escrevendo o nome. Rascunho nunca aparece pro jogador.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirCriacao}
          className="rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black hover:bg-[#a5710f]"
        >
          + Novo artigo
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Buscar por título..."
          value={filtroNome}
          onChange={(e) => setFiltroNome(e.target.value)}
          className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white"
        />
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white"
        >
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}

      <div className="overflow-x-auto rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80">
        <table className="w-full text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-white/50">
              <th className="px-3 py-2">Título</th>
              <th className="px-3 py-2">Categoria</th>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2">Ordem</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-white/50">
                  Carregando...
                </td>
              </tr>
            ) : artigos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-white/50">
                  Nenhum artigo encontrado.
                </td>
              </tr>
            ) : (
              artigos.map((artigo) => (
                <tr key={artigo.id} className="border-b border-white/5">
                  <td className="px-3 py-2 font-bold">{artigo.titulo}</td>
                  <td className="px-3 py-2">{artigo.categoria}</td>
                  <td className="px-3 py-2 text-white/50">{artigo.slug}</td>
                  <td className="px-3 py-2">{artigo.ordem}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        artigo.publicado ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/70"
                      }`}
                    >
                      {artigo.publicado ? "Publicado" : "Rascunho"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => abrirEdicao(artigo)} className="text-[#F3B43F] hover:underline">
                        Editar
                      </button>
                      <button type="button" onClick={() => alternarPublicacao(artigo)} className="text-white/70 hover:underline">
                        {artigo.publicado ? "Despublicar" : "Publicar"}
                      </button>
                      <button type="button" onClick={() => duplicar(artigo)} className="text-white/70 hover:underline">
                        Duplicar
                      </button>
                      <button type="button" onClick={() => excluir(artigo)} className="text-red-400 hover:underline">
                        Excluir
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setMostrarForm(false)}
        >
          <form
            onSubmit={salvar}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-2xl flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl"
          >
            <p className="font-imFeel text-xl text-[#F3B43F]">{editandoId ? "Editar artigo" : "Novo artigo"}</p>
            {mensagem && <p className="text-sm text-[#F3B43F]">{mensagem}</p>}

            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Categoria
                <input
                  required
                  list="categorias-wiki"
                  value={form.categoria}
                  onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                  className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                  placeholder="Ex: Aventura, Forja, Guildas..."
                />
                <datalist id="categorias-wiki">
                  {categorias.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </label>
              <label className="flex w-24 flex-col gap-1 text-xs">
                Ordem
                <input
                  type="number"
                  value={form.ordem ?? 0}
                  onChange={(e) => setForm((f) => ({ ...f, ordem: Number(e.target.value) }))}
                  className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1 text-xs">
              Título
              <input
                required
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs">
              Slug (URL — deixe em branco pra gerar a partir do título)
              <input
                value={form.slug ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                placeholder="como-funciona-a-forja"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs">
              Resumo (opcional, aparece na listagem/sidebar)
              <input
                value={form.resumo ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, resumo: e.target.value }))}
                maxLength={300}
                className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs">
              Conteúdo (texto plano — separe parágrafos com uma linha em branco)
              <textarea
                required
                value={form.conteudo}
                onChange={(e) => setForm((f) => ({ ...f, conteudo: e.target.value }))}
                className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                rows={12}
              />
            </label>

            <label className="flex flex-col gap-1 text-xs">
              Imagem (URL, opcional)
              <input
                value={form.imagem_url ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, imagem_url: e.target.value }))}
                className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
              />
            </label>

            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={form.publicado ?? true}
                onChange={(e) => setForm((f) => ({ ...f, publicado: e.target.checked }))}
              />
              Publicado (visível pro jogador)
            </label>

            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMostrarForm(false)}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50"
              >
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
