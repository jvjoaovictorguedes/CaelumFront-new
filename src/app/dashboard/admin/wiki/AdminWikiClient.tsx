"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { enviarMediaAdmin } from "../media/uploadMediaAction";
import { resolveMediaUrl } from "@/utils/media-url";
import WikiMarkdownContent from "@/components/wiki/WikiMarkdownContent";

function formularioVazio(): PayloadWikiArticleAdmin {
  return { categoria: "", titulo: "", resumo: "", conteudo: "", slug: "", ordem: 0, imagem_url: "", publicado: true };
}

// Deriva um grupo de mídia único pra uma imagem de CORPO de artigo
// (nunca reaproveita um grupo existente — ao contrário da Biblioteca de
// Mídia em si, aqui cada imagem inserida no texto é sempre nova, então
// não faz sentido pedir pro admin escolher/revisar um identificador).
function grupoDeImagemDoCorpo(nomeArquivo: string): string {
  const base = nomeArquivo
    .replace(/\.[^./\\]+$/, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const sufixo = Date.now().toString(36);
  return `wiki-corpo-${base || "imagem"}-${sufixo}`;
}

// Pedido do jogador: "implementar formatação de texto — negrito,
// imagens, fontes se possível" — editor de Markdown com barra de
// atalhos (nunca pede pro admin saber a sintaxe de cor) + upload de
// imagem reaproveitando a MESMA Biblioteca de Mídia (/admin/media) já
// usada por Item/Power/etc, só numa categoria própria ("Outro") e um
// grupo só da imagem (nunca versiona — cada inserção é uma imagem
// nova). Prévia usa o MESMO componente de renderização da Wiki pública
// (WikiMarkdownContent), pra nunca divergir do resultado real.
function WikiConteudoEditor({ valor, onChange }: { valor: string; onChange: (novoValor: string) => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputArquivoRef = useRef<HTMLInputElement>(null);
  const [aba, setAba] = useState<"editar" | "preview">("editar");
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [erroImagem, setErroImagem] = useState("");

  // Envolve a seleção atual do textarea com prefixo/sufixo (negrito,
  // itálico, link...) ou insere um texto de exemplo quando nada está
  // selecionado — mesmo padrão de qualquer editor markdown simples.
  function envolverSelecao(prefixo: string, sufixo: string, placeholder: string) {
    const area = textareaRef.current;
    if (!area) return;
    const inicio = area.selectionStart;
    const fim = area.selectionEnd;
    const selecionado = valor.slice(inicio, fim) || placeholder;
    const novoValor = valor.slice(0, inicio) + prefixo + selecionado + sufixo + valor.slice(fim);
    onChange(novoValor);
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(inicio + prefixo.length, inicio + prefixo.length + selecionado.length);
    });
  }

  // Prefixa cada LINHA selecionada (título/lista/citação precisam ficar
  // no início da linha, nunca no meio do texto selecionado).
  function prefixarLinhas(prefixo: string) {
    const area = textareaRef.current;
    if (!area) return;
    const inicio = area.selectionStart;
    const fim = area.selectionEnd;
    const inicioLinha = valor.lastIndexOf("\n", inicio - 1) + 1;
    const fimLinha = valor.indexOf("\n", fim);
    const fimReal = fimLinha === -1 ? valor.length : fimLinha;
    const trecho = valor.slice(inicioLinha, fimReal);
    const comPrefixo = trecho
      .split("\n")
      .map((linha) => (linha.startsWith(prefixo) ? linha : prefixo + linha))
      .join("\n");
    const novoValor = valor.slice(0, inicioLinha) + comPrefixo + valor.slice(fimReal);
    onChange(novoValor);
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(inicioLinha, inicioLinha + comPrefixo.length);
    });
  }

  function inserirNoCursor(texto: string) {
    const area = textareaRef.current;
    if (!area) {
      onChange(`${valor}\n${texto}\n`);
      return;
    }
    const inicio = area.selectionStart;
    const fim = area.selectionEnd;
    const novoValor = valor.slice(0, inicio) + texto + valor.slice(fim);
    onChange(novoValor);
    requestAnimationFrame(() => {
      area.focus();
      const posicao = inicio + texto.length;
      area.setSelectionRange(posicao, posicao);
    });
  }

  async function enviarImagem(arquivo: File) {
    setEnviandoImagem(true);
    setErroImagem("");
    try {
      const formData = new FormData();
      formData.append("grupo", grupoDeImagemDoCorpo(arquivo.name));
      formData.append("categoria", "Outro");
      formData.append("tipo", "imagem");
      formData.append("arquivo", arquivo);
      const resultado = await enviarMediaAdmin(formData);
      if (!resultado.success || !resultado.asset) {
        setErroImagem(resultado.message || "Não foi possível enviar a imagem.");
        return;
      }
      const url = resolveMediaUrl(`/api/media/${resultado.asset.grupo}`) ?? "";
      inserirNoCursor(`![${arquivo.name.replace(/\.[^./\\]+$/, "")}](${url})`);
    } catch {
      setErroImagem("Não foi possível enviar a imagem agora.");
    } finally {
      setEnviandoImagem(false);
    }
  }

  return (
    <div className="flex flex-col gap-1 text-xs">
      <div className="flex items-center justify-between">
        <span>Conteúdo (Markdown)</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setAba("editar")}
            className={`rounded px-2 py-0.5 text-[11px] font-bold ${aba === "editar" ? "bg-[#BC8418] text-black" : "text-white/60 hover:bg-white/10"}`}
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => setAba("preview")}
            className={`rounded px-2 py-0.5 text-[11px] font-bold ${aba === "preview" ? "bg-[#BC8418] text-black" : "text-white/60 hover:bg-white/10"}`}
          >
            Pré-visualizar
          </button>
        </div>
      </div>

      {aba === "editar" ? (
        <>
          <div className="flex flex-wrap gap-1 rounded-t-lg border border-b-0 border-white/20 bg-black/40 p-1.5">
            <button
              type="button"
              title="Negrito"
              onClick={() => envolverSelecao("**", "**", "texto em negrito")}
              className="rounded px-2 py-1 font-bold text-white hover:bg-white/10"
            >
              N
            </button>
            <button
              type="button"
              title="Itálico"
              onClick={() => envolverSelecao("*", "*", "texto em itálico")}
              className="rounded px-2 py-1 italic text-white hover:bg-white/10"
            >
              I
            </button>
            <button
              type="button"
              title="Título"
              onClick={() => prefixarLinhas("## ")}
              className="rounded px-2 py-1 font-imFeel text-white hover:bg-white/10"
            >
              Título
            </button>
            <button
              type="button"
              title="Lista"
              onClick={() => prefixarLinhas("- ")}
              className="rounded px-2 py-1 text-white hover:bg-white/10"
            >
              • Lista
            </button>
            <button
              type="button"
              title="Citação"
              onClick={() => prefixarLinhas("> ")}
              className="rounded px-2 py-1 text-white hover:bg-white/10"
            >
              &gt; Citação
            </button>
            <button
              type="button"
              title="Link"
              onClick={() => envolverSelecao("[", "](https://)", "texto do link")}
              className="rounded px-2 py-1 text-white underline hover:bg-white/10"
            >
              Link
            </button>
            <button
              type="button"
              title="Inserir imagem"
              disabled={enviandoImagem}
              onClick={() => inputArquivoRef.current?.click()}
              className="rounded px-2 py-1 text-white hover:bg-white/10 disabled:opacity-50"
            >
              {enviandoImagem ? "Enviando..." : "🖼 Imagem"}
            </button>
            <input
              ref={inputArquivoRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const arquivo = e.target.files?.[0];
                e.target.value = "";
                if (arquivo) enviarImagem(arquivo);
              }}
            />
          </div>
          {erroImagem && <p className="text-red-400">{erroImagem}</p>}
          <textarea
            ref={textareaRef}
            required
            value={valor}
            onChange={(e) => onChange(e.target.value)}
            className="rounded-b-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
            rows={12}
          />
          <p className="text-white/40">
            Negrito **assim**, itálico *assim*, título com ##, lista com -, citação com &gt;, link [texto](url) e
            imagem pelo botão acima.
          </p>
        </>
      ) : (
        <div className="min-h-[200px] rounded-lg border border-white/20 bg-[#1b140d] p-3">
          {valor.trim() ? (
            <WikiMarkdownContent conteudo={valor} />
          ) : (
            <p className="text-white/40">Nada pra mostrar ainda — escreva algo na aba Editar.</p>
          )}
        </div>
      )}
    </div>
  );
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

            <WikiConteudoEditor
              valor={form.conteudo}
              onChange={(novoValor) => setForm((f) => ({ ...f, conteudo: novoValor }))}
            />

            <label className="flex flex-col gap-1 text-xs">
              Imagem de destaque (URL, opcional — aparece no topo do artigo; pra imagens DENTRO do texto use o botão
              🖼 Imagem acima)
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
