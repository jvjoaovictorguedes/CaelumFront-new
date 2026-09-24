"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  atualizarPatchNoteAdmin,
  criarPatchNoteAdmin,
  duplicarPatchNoteAdmin,
  listarPatchNotesAdmin,
  mensagemDeErroAdmin,
  type PatchNoteApi,
  type PayloadPatchNoteAdmin,
} from "@/lib/api/admin";

const STATUS_OPCOES = ["Rascunho", "Publicado", "Agendado"] as const;

const CORES_STATUS: Record<string, string> = {
  Rascunho: "bg-white/10 text-white/70",
  Publicado: "bg-green-500/20 text-green-300",
  Agendado: "bg-blue-500/20 text-blue-300",
};

function formularioVazio(): PayloadPatchNoteAdmin {
  return {
    feature: "",
    versao: "",
    titulo: "",
    descricao: "",
    resumo: "",
    imagem_url: "",
    destaque: false,
    status: "Rascunho",
    publicado_em: new Date().toISOString().slice(0, 10),
  };
}

export default function AdminPatchNotesClient() {
  const [notas, setNotas] = useState<PatchNoteApi[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const porPagina = 20;
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroNome, setFiltroNome] = useState("");

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<PayloadPatchNoteAdmin>(formularioVazio());
  const [salvando, setSalvando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resultado = await listarPatchNotesAdmin({
        pagina,
        porPagina,
        status: filtroStatus || undefined,
        nome: filtroNome || undefined,
      });
      setNotas(resultado.itens);
      setTotal(resultado.total);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar os patch notes."));
    } finally {
      setCarregando(false);
    }
  }, [pagina, filtroStatus, filtroNome]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirCriacao() {
    setEditandoId(null);
    setForm(formularioVazio());
    setMostrarForm(true);
    setMensagem("");
  }

  function abrirEdicao(nota: PatchNoteApi) {
    setEditandoId(nota.id);
    setForm({
      feature: nota.feature,
      versao: nota.versao,
      titulo: nota.titulo,
      descricao: nota.descricao,
      resumo: nota.resumo ?? "",
      imagem_url: nota.imagem_url ?? "",
      destaque: nota.destaque,
      status: nota.status,
      publicado_em: nota.publicado_em,
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
        await atualizarPatchNoteAdmin(editandoId, form);
        setMensagem(`Patch note "${form.titulo}" atualizada.`);
      } else {
        await criarPatchNoteAdmin(form);
        setMensagem(`Patch note "${form.titulo}" criada.`);
      }
      setMostrarForm(false);
      await carregar();
    } catch (error) {
      setMensagem(mensagemDeErroAdmin(error, "Não foi possível salvar a patch note."));
    } finally {
      setSalvando(false);
    }
  }

  async function duplicar(nota: PatchNoteApi) {
    try {
      await duplicarPatchNoteAdmin(nota.id);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível duplicar a patch note."));
    }
  }

  async function alternarPublicacao(nota: PatchNoteApi) {
    const novoStatus = nota.status === "Publicado" ? "Rascunho" : "Publicado";
    try {
      await atualizarPatchNoteAdmin(nota.id, { status: novoStatus });
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível mudar o status."));
    }
  }

  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
            ← Painel Administrativo
          </Link>
          <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Patch Notes</h1>
        </div>
        <button
          type="button"
          onClick={abrirCriacao}
          className="rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black hover:bg-[#a5710f]"
        >
          + Nova nota
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Buscar por título..."
          value={filtroNome}
          onChange={(e) => {
            setPagina(1);
            setFiltroNome(e.target.value);
          }}
          className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white"
        />
        <select
          value={filtroStatus}
          onChange={(e) => {
            setPagina(1);
            setFiltroStatus(e.target.value);
          }}
          className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white"
        >
          <option value="">Todos os status</option>
          {STATUS_OPCOES.map((s) => (
            <option key={s} value={s}>
              {s}
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
              <th className="px-3 py-2">Feature</th>
              <th className="px-3 py-2">Versão</th>
              <th className="px-3 py-2">Publicado em</th>
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
            ) : notas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-white/50">
                  Nenhuma patch note encontrada.
                </td>
              </tr>
            ) : (
              notas.map((nota) => (
                <tr key={nota.id} className="border-b border-white/5">
                  <td className="px-3 py-2 font-bold">
                    {nota.titulo}
                    {nota.destaque && (
                      <span className="ml-2 rounded-full bg-[#F3B43F]/20 px-2 py-0.5 text-[10px] font-bold uppercase text-[#F3B43F]">
                        Destaque
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">{nota.feature}</td>
                  <td className="px-3 py-2">{nota.versao}</td>
                  <td className="px-3 py-2">{nota.publicado_em}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        CORES_STATUS[nota.status] ?? "bg-white/10 text-white/70"
                      }`}
                    >
                      {nota.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => abrirEdicao(nota)} className="text-[#F3B43F] hover:underline">
                        Editar
                      </button>
                      <button type="button" onClick={() => alternarPublicacao(nota)} className="text-white/70 hover:underline">
                        {nota.status === "Publicado" ? "Voltar pra rascunho" : "Publicar"}
                      </button>
                      <button type="button" onClick={() => duplicar(nota)} className="text-white/70 hover:underline">
                        Duplicar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-white/60">
        <span>
          {total} nota(s) — página {pagina} de {totalPaginas}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pagina <= 1}
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-white/20 px-3 py-1 disabled:opacity-30"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            className="rounded-lg border border-white/20 px-3 py-1 disabled:opacity-30"
          >
            Próxima
          </button>
        </div>
      </div>

      {mostrarForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setMostrarForm(false)}
        >
          <form
            onSubmit={salvar}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl"
          >
            <p className="font-imFeel text-xl text-[#F3B43F]">{editandoId ? "Editar patch note" : "Nova patch note"}</p>
            {mensagem && <p className="text-sm text-[#F3B43F]">{mensagem}</p>}

            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Feature
                <input
                  required
                  value={form.feature}
                  onChange={(e) => setForm((f) => ({ ...f, feature: e.target.value }))}
                  className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                  placeholder="Ex: Aventura"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Versão
                <input
                  required
                  value={form.versao}
                  onChange={(e) => setForm((f) => ({ ...f, versao: e.target.value }))}
                  className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                  placeholder="Ex: 4.9"
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
              Resumo (opcional, aparece na listagem curta)
              <input
                value={form.resumo ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, resumo: e.target.value }))}
                maxLength={280}
                className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs">
              Conteúdo
              <textarea
                required
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                rows={4}
              />
            </label>

            <label className="flex flex-col gap-1 text-xs">
              Imagem (URL)
              <input
                value={form.imagem_url ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, imagem_url: e.target.value }))}
                className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
              />
            </label>

            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Status
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value as PayloadPatchNoteAdmin["status"] }))
                  }
                  className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                >
                  {STATUS_OPCOES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Publicado em {form.status === "Agendado" ? "(data de agendamento)" : ""}
                <input
                  type="date"
                  value={form.publicado_em}
                  onChange={(e) => setForm((f) => ({ ...f, publicado_em: e.target.value }))}
                  className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={form.destaque ?? false}
                onChange={(e) => setForm((f) => ({ ...f, destaque: e.target.checked }))}
              />
              Destaque (fica marcada na lista de novidades)
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
