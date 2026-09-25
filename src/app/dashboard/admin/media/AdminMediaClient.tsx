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
  type MediaAssetTipoApi,
} from "@/lib/api/admin";
import { resolveMediaUrl } from "@/utils/media-url";
import { enviarMediaAdmin } from "./uploadMediaAction";

const CATEGORIAS_IMAGEM = ["Item", "Power", "Monster", "EquipmentSet", "Outro"] as const;
const CATEGORIA_AUDIO = "Musica" as const;
const ACCEPT_IMAGEM = "image/png,image/jpeg,image/webp,image/gif";
const ACCEPT_AUDIO = "audio/mpeg,audio/mp3,audio/ogg,audio/wav,audio/x-wav";

function urlDaVersao(grupo: string, versao: number) {
  return resolveMediaUrl(`/api/media/${grupo}?v=${versao}`) ?? "";
}
function urlAtual(grupo: string) {
  return resolveMediaUrl(`/api/media/${grupo}`) ?? "";
}

// Deriva um slug de grupo a partir do nome do arquivo (minúsculas, sem
// acento, só [a-z0-9_-], respeitando REGEX_GRUPO_VALIDO do backend:
// começa/termina com letra ou número, 3-150 caracteres). O admin pode
// editar esse valor sugerido antes de confirmar o envio.
function slugSugerido(nomeArquivo: string): string {
  const semExtensao = nomeArquivo.replace(/\.[^./\\]+$/, "");
  let slug = semExtensao
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) slug = "midia";
  if (slug.length < 3) slug = (slug + "-arquivo").slice(0, Math.max(3, slug.length + 3));
  if (slug.length > 150) slug = slug.slice(0, 150);
  slug = slug.replace(/-+$/g, "");
  if (slug.length < 3) slug = `midia-${Date.now() % 100000}`;
  return slug;
}

function slugUnicoNaLista(base: string, usados: Set<string>): string {
  let slug = base;
  let contador = 2;
  while (usados.has(slug)) {
    const sufixo = `-${contador}`;
    slug = base.length + sufixo.length > 150 ? base.slice(0, 150 - sufixo.length) + sufixo : base + sufixo;
    contador += 1;
  }
  return slug;
}

type StatusEnvio = "pendente" | "enviando" | "ok" | "erro";

interface ArquivoParaEnvio {
  id: string;
  file: File;
  grupo: string;
  status: StatusEnvio;
  mensagem?: string;
}

function DetalheGrupo({ grupo, onFechar, onMudou }: { grupo: string; onFechar: () => void; onMudou: () => void }) {
  const [versoes, setVersoes] = useState<MediaAssetApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [categoria, setCategoria] = useState<string>("Outro");
  const [descricao, setDescricao] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);

  const tipoGrupo: MediaAssetTipoApi = versoes[0]?.tipo ?? "imagem";
  const categoriasDisponiveis: readonly string[] = tipoGrupo === "audio" ? [CATEGORIA_AUDIO] : CATEGORIAS_IMAGEM;

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
      formData.append("tipo", tipoGrupo);
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
    setMensagem("URL copiada — cole no campo Imagem (URL) de Item/Power/etc.");
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

        {tipoGrupo === "audio" && !carregando && (
          <audio controls src={urlAtual(grupo)} className="w-full" />
        )}

        <div className="flex flex-col gap-2 rounded-xl border border-white/10 p-3">
          <p className="text-xs font-bold uppercase text-[#F3B43F]/80">Enviar nova versão</p>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-[10px] text-white/60">
              Categoria
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)} disabled={tipoGrupo === "audio"} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm disabled:opacity-60">
                {categoriasDisponiveis.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-1 flex-col gap-1 text-[10px] text-white/60">
              Arquivo
              <input type="file" accept={tipoGrupo === "audio" ? ACCEPT_AUDIO : ACCEPT_IMAGEM} onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-xs" />
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
                {v.tipo === "audio" ? (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-lg">🎵</div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- thumbnail de mídia enviada pelo admin, nunca passa por next/image
                  <img src={urlDaVersao(grupo, v.versao)} alt={`v${v.versao}`} className="h-10 w-10 shrink-0 rounded-lg border border-white/10 bg-black/30 object-contain" />
                )}
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

function ModalEnviarMidia({
  tipoInicial,
  onFechar,
  onConcluido,
}: {
  tipoInicial: MediaAssetTipoApi;
  onFechar: () => void;
  onConcluido: () => void;
}) {
  const [tipo, setTipo] = useState<MediaAssetTipoApi>(tipoInicial);
  const [categoria, setCategoria] = useState<string>(tipoInicial === "audio" ? CATEGORIA_AUDIO : "Item");
  const [descricao, setDescricao] = useState("");
  const [arquivos, setArquivos] = useState<ArquivoParaEnvio[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erroGeral, setErroGeral] = useState("");

  const categoriasDisponiveis: readonly string[] = tipo === "audio" ? [CATEGORIA_AUDIO] : CATEGORIAS_IMAGEM;

  function mudarTipo(novoTipo: MediaAssetTipoApi) {
    setTipo(novoTipo);
    setCategoria(novoTipo === "audio" ? CATEGORIA_AUDIO : "Item");
    setArquivos([]);
  }

  function selecionarArquivos(lista: FileList | null) {
    if (!lista || lista.length === 0) return;
    const usados = new Set<string>();
    const novos: ArquivoParaEnvio[] = Array.from(lista).map((file, i) => {
      const base = slugSugerido(file.name);
      const grupo = slugUnicoNaLista(base, usados);
      usados.add(grupo);
      return { id: `${Date.now()}-${i}-${file.name}`, file, grupo, status: "pendente" as StatusEnvio };
    });
    setArquivos(novos);
    setErroGeral("");
  }

  function editarGrupo(id: string, novoGrupo: string) {
    setArquivos((atual) => atual.map((a) => (a.id === id ? { ...a, grupo: novoGrupo } : a)));
  }

  function removerArquivo(id: string) {
    setArquivos((atual) => atual.filter((a) => a.id !== id));
  }

  async function enviarTodos() {
    if (arquivos.length === 0) {
      setErroGeral("Escolha ao menos um arquivo.");
      return;
    }
    const grupos = arquivos.map((a) => a.grupo.trim());
    if (grupos.some((g) => !g)) {
      setErroGeral("Todo arquivo precisa de um identificador de grupo preenchido.");
      return;
    }
    if (new Set(grupos).size !== grupos.length) {
      setErroGeral("Dois arquivos não podem usar o mesmo identificador de grupo — ajuste antes de enviar.");
      return;
    }

    setEnviando(true);
    setErroGeral("");

    // Envio sequencial: mais lento que em paralelo, mas mantém o
    // feedback por arquivo simples e evita sobrecarregar o servidor
    // com vários uploads simultâneos vindos do mesmo admin.
    for (const item of arquivos) {
      setArquivos((atual) => atual.map((a) => (a.id === item.id ? { ...a, status: "enviando", mensagem: undefined } : a)));
      try {
        const formData = new FormData();
        formData.append("grupo", item.grupo.trim());
        formData.append("categoria", categoria);
        formData.append("tipo", tipo);
        if (descricao) formData.append("descricao", descricao);
        formData.append("arquivo", item.file);
        const resultado = await enviarMediaAdmin(formData);
        if (!resultado.success) {
          setArquivos((atual) =>
            atual.map((a) => (a.id === item.id ? { ...a, status: "erro", mensagem: resultado.message || "Falha ao enviar." } : a)),
          );
        } else {
          setArquivos((atual) => atual.map((a) => (a.id === item.id ? { ...a, status: "ok", mensagem: `v${resultado.asset?.versao} enviada` } : a)));
        }
      } catch {
        setArquivos((atual) => atual.map((a) => (a.id === item.id ? { ...a, status: "erro", mensagem: "Não foi possível enviar." } : a)));
      }
    }

    setEnviando(false);
    onConcluido();
  }

  const total = arquivos.length;
  const ok = arquivos.filter((a) => a.status === "ok").length;
  const comErro = arquivos.filter((a) => a.status === "erro").length;
  const terminou = total > 0 && ok + comErro === total;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => !enviando && onFechar()}>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
        <p className="font-imFeel text-xl text-[#F3B43F]">Enviar mídia</p>
        {erroGeral && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erroGeral}</p>}

        <div className="flex gap-2">
          <button type="button" onClick={() => mudarTipo("imagem")} disabled={enviando} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${tipo === "imagem" ? "bg-[#BC8418] text-black" : "border border-white/20 text-white/70"}`}>
            Imagens
          </button>
          <button type="button" onClick={() => mudarTipo("audio")} disabled={enviando} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${tipo === "audio" ? "bg-[#BC8418] text-black" : "border border-white/20 text-white/70"}`}>
            Músicas
          </button>
        </div>

        <label className="flex flex-col gap-1 text-xs">
          Categoria
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} disabled={enviando || tipo === "audio"} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm disabled:opacity-60">
            {categoriasDisponiveis.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          Descrição (opcional, aplicada a todos os arquivos deste envio)
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} disabled={enviando} rows={2} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          {tipo === "audio" ? "Arquivos de áudio (MP3, OGG ou WAV — até 20MB cada)" : "Arquivos de imagem (PNG, JPEG, WEBP ou GIF — até 5MB cada)"}
          <input
            required
            type="file"
            multiple
            disabled={enviando}
            accept={tipo === "audio" ? ACCEPT_AUDIO : ACCEPT_IMAGEM}
            onChange={(e) => selecionarArquivos(e.target.files)}
            className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
          />
        </label>
        <p className="text-[10px] text-white/50">
          Cada arquivo vira um grupo próprio — revise/ajuste o identificador sugerido de cada um antes de enviar. Minúsculas,
          números, hífen ou underscore, começando e terminando com letra ou número.
        </p>

        {arquivos.length > 0 && (
          <div className="flex flex-col gap-2 rounded-xl border border-white/10 p-2">
            {arquivos.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-black/20 px-2 py-1.5 text-xs">
                <span className="w-28 shrink-0 truncate text-white/60" title={item.file.name}>
                  {item.file.name}
                </span>
                <input
                  value={item.grupo}
                  onChange={(e) => editarGrupo(item.id, e.target.value)}
                  disabled={enviando || item.status === "ok"}
                  className="min-w-0 flex-1 rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-xs disabled:opacity-60"
                />
                <span
                  className={
                    item.status === "ok"
                      ? "font-bold text-green-400"
                      : item.status === "erro"
                        ? "font-bold text-red-400"
                        : item.status === "enviando"
                          ? "text-[#F3B43F]"
                          : "text-white/40"
                  }
                >
                  {item.status === "pendente" && "aguardando"}
                  {item.status === "enviando" && "enviando..."}
                  {item.status === "ok" && `✓ ${item.mensagem}`}
                  {item.status === "erro" && `✕ ${item.mensagem}`}
                </span>
                {item.status !== "enviando" && item.status !== "ok" && (
                  <button type="button" onClick={() => removerArquivo(item.id)} className="shrink-0 text-white/50 hover:text-red-400">
                    remover
                  </button>
                )}
              </div>
            ))}
            {terminou && (
              <p className="text-xs font-bold text-[#F3B43F]">
                Concluído: {ok} de {total} enviado(s) com sucesso{comErro > 0 ? `, ${comErro} com erro` : ""}.
              </p>
            )}
          </div>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onFechar} disabled={enviando} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10 disabled:opacity-50">
            {terminou ? "Fechar" : "Cancelar"}
          </button>
          {!terminou && (
            <button type="button" onClick={enviarTodos} disabled={enviando || arquivos.length === 0} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
              {enviando ? "Enviando..." : `Enviar ${arquivos.length || ""}`.trim()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminMediaClient() {
  const [aba, setAba] = useState<MediaAssetTipoApi>("imagem");
  const [itens, setItens] = useState<MediaAssetApi[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroNome, setFiltroNome] = useState("");
  const [grupoDetalhe, setGrupoDetalhe] = useState<string | null>(null);
  const [mostrarUpload, setMostrarUpload] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resultado = await listarMediaGruposAdmin({
        categoria: aba === "imagem" ? filtroCategoria || undefined : undefined,
        tipo: aba,
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
  }, [aba, filtroCategoria, filtroNome]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function mudarAba(nova: MediaAssetTipoApi) {
    setAba(nova);
    setFiltroCategoria("");
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
        anteriores. Copie a URL de um grupo e cole no campo Imagem (URL) de Itens, Habilidades, Conjuntos etc. Dá pra enviar
        várias imagens de uma vez — cada uma vira um grupo próprio.
      </p>

      <div className="flex gap-2">
        <button type="button" onClick={() => mudarAba("imagem")} className={`rounded-lg px-3 py-1.5 text-sm font-bold ${aba === "imagem" ? "bg-[#BC8418] text-black" : "border border-white/20 text-white/70"}`}>
          Imagens
        </button>
        <button type="button" onClick={() => mudarAba("audio")} className={`rounded-lg px-3 py-1.5 text-sm font-bold ${aba === "audio" ? "bg-[#BC8418] text-black" : "border border-white/20 text-white/70"}`}>
          Músicas
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Buscar por grupo..."
          value={filtroNome}
          onChange={(e) => setFiltroNome(e.target.value)}
          className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white"
        />
        {aba === "imagem" && (
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white">
            <option value="">Todas as categorias</option>
            {CATEGORIAS_IMAGEM.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {itens.map((item) => (
            // div (não button) porque o card de áudio precisa embutir um
            // <audio controls> — elemento interativo, que HTML não deixa
            // aninhar dentro de outro elemento interativo (<button>).
            <div
              key={item.grupo}
              role="button"
              tabIndex={0}
              onClick={() => setGrupoDetalhe(item.grupo)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setGrupoDetalhe(item.grupo);
              }}
              className="flex cursor-pointer flex-col gap-1 rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-3 text-left text-white hover:bg-[#3a2c14]"
            >
              {item.tipo === "audio" ? (
                <div className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-lg border border-white/10 bg-black/30 text-3xl">
                  🎵
                  <audio
                    controls
                    src={urlDaVersao(item.grupo, item.versao)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-6 w-full px-1"
                  />
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- thumbnail de mídia enviada pelo admin, nunca passa por next/image
                <img src={urlDaVersao(item.grupo, item.versao)} alt={item.grupo} className="h-24 w-full rounded-lg border border-white/10 bg-black/30 object-contain" />
              )}
              <p className="truncate text-xs font-bold text-[#F3B43F]" title={item.grupo}>
                {item.grupo}
              </p>
              <p className="text-[10px] text-white/50">
                {item.categoria} · v{item.versao}
              </p>
            </div>
          ))}
          {itens.length === 0 && <p className="col-span-full text-sm text-white/50">Nenhuma mídia enviada ainda.</p>}
        </div>
      )}
      {total > itens.length && <p className="text-xs text-white/40">Mostrando {itens.length} de {total} — refine a busca pra ver mais.</p>}

      {mostrarUpload && (
        <ModalEnviarMidia
          tipoInicial={aba}
          onFechar={() => setMostrarUpload(false)}
          onConcluido={carregar}
        />
      )}

      {grupoDetalhe && <DetalheGrupo grupo={grupoDetalhe} onFechar={() => setGrupoDetalhe(null)} onMudou={carregar} />}
    </div>
  );
}
