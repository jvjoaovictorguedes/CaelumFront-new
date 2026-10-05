"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { listarWikiCategorias, obterWikiArtigo, type WikiArtigoApi, type WikiCategoriaApi } from "@/lib/api/wiki";
import WikiMarkdownContent from "@/components/wiki/WikiMarkdownContent";

export default function WikiClient({ slugInicial }: { slugInicial?: string }) {
  const [categorias, setCategorias] = useState<WikiCategoriaApi[] | null>(null);
  const [erroLista, setErroLista] = useState("");
  const [categoriaAberta, setCategoriaAberta] = useState<string | null>(null);
  const [artigo, setArtigo] = useState<WikiArtigoApi | null>(null);
  const [carregandoArtigo, setCarregandoArtigo] = useState(Boolean(slugInicial));
  const [erroArtigo, setErroArtigo] = useState("");
  const [buscaTexto, setBuscaTexto] = useState("");

  const carregarLista = useCallback(async () => {
    try {
      setErroLista("");
      const dados = await listarWikiCategorias();
      setCategorias(dados);
      setCategoriaAberta((atual) => atual ?? dados[0]?.categoria ?? null);
    } catch {
      setErroLista("Não foi possível carregar a Wiki agora. Tente novamente em instantes.");
    }
  }, []);

  useEffect(() => {
    carregarLista();
  }, [carregarLista]);

  const carregarArtigo = useCallback(async (slug: string) => {
    setCarregandoArtigo(true);
    setErroArtigo("");
    try {
      const dados = await obterWikiArtigo(slug);
      setArtigo(dados);
      setCategoriaAberta(dados.categoria);
    } catch {
      setErroArtigo("Não foi possível carregar esse artigo agora.");
      setArtigo(null);
    } finally {
      setCarregandoArtigo(false);
    }
  }, []);

  useEffect(() => {
    if (slugInicial) carregarArtigo(slugInicial);
  }, [slugInicial, carregarArtigo]);

  const termoBusca = buscaTexto.trim().toLowerCase();
  const categoriasFiltradas =
    categorias?.map((c) => ({
      ...c,
      artigos: termoBusca
        ? c.artigos.filter(
            (a) =>
              a.titulo.toLowerCase().includes(termoBusca) ||
              (a.resumo ?? "").toLowerCase().includes(termoBusca),
          )
        : c.artigos,
    })) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-imFeel text-3xl text-[#F3B43F]">Wiki do Jogo</h1>
        <p className="mt-1 text-sm text-white/60">
          Referência de sistemas e mecânicas de Caelum — como cada coisa funciona, sem precisar caçar em fórum ou
          Discord.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <input
            type="text"
            value={buscaTexto}
            onChange={(e) => setBuscaTexto(e.target.value)}
            placeholder="Buscar na Wiki..."
            className="mb-3 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white placeholder:text-white/40"
          />
          {erroLista && <p className="text-sm text-red-400">{erroLista}</p>}
          {!categoriasFiltradas && !erroLista && <p className="text-sm text-white/50">Carregando...</p>}
          {categoriasFiltradas?.length === 0 && <p className="text-sm text-white/50">Nenhum artigo publicado ainda.</p>}
          <nav className="flex flex-col gap-1">
            {categoriasFiltradas
              ?.filter((c) => c.artigos.length > 0)
              .map((cat) => {
                const aberta = categoriaAberta === cat.categoria || Boolean(termoBusca);
                return (
                  <div key={cat.categoria}>
                    <button
                      type="button"
                      onClick={() => setCategoriaAberta((atual) => (atual === cat.categoria ? null : cat.categoria))}
                      className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs font-bold uppercase tracking-wide text-[#F3B43F] hover:bg-white/5"
                    >
                      <span>{cat.categoria}</span>
                      <span className="text-white/40">{aberta ? "▾" : "▸"}</span>
                    </button>
                    {aberta && (
                      <ul className="mb-2 ml-2 flex flex-col gap-0.5 border-l border-white/10 pl-2">
                        {cat.artigos.map((a) => (
                          <li key={a.slug}>
                            <Link
                              href={`/dashboard/wiki/${a.slug}`}
                              prefetch={false}
                              className={`block rounded-md px-2 py-1 text-sm transition ${
                                artigo?.slug === a.slug
                                  ? "bg-[#BC8418] font-bold text-black"
                                  : "text-white/70 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              {a.titulo}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
          </nav>
        </aside>

        <main className="min-w-0 rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-5">
          {!slugInicial ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-white/60">
              <p className="text-lg font-bold text-[#F3B43F]">Escolha um artigo ao lado</p>
              <p className="max-w-md text-sm">
                A Wiki está organizada por sistema do jogo — Aventura, Expedição, Forja, Guildas, e por aí vai. Use a
                busca se já souber o que procura.
              </p>
            </div>
          ) : carregandoArtigo ? (
            <p className="text-sm text-white/60">Carregando artigo...</p>
          ) : erroArtigo ? (
            <p className="text-sm text-red-400">{erroArtigo}</p>
          ) : artigo ? (
            <article>
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#F3B43F]/70">{artigo.categoria}</p>
              <h2 className="mb-3 font-imFeel text-2xl text-[#F3B43F]">{artigo.titulo}</h2>
              {artigo.imagem_url && (
                <img
                  src={artigo.imagem_url}
                  alt={artigo.titulo}
                  className="mb-4 max-h-72 w-full rounded-xl border border-black/30 object-cover"
                />
              )}
              <WikiMarkdownContent conteudo={artigo.conteudo} />
            </article>
          ) : (
            <p className="text-sm text-white/60">Artigo não encontrado.</p>
          )}
        </main>
      </div>
    </div>
  );
}
