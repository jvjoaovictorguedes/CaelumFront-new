"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  cancelarEventoTemploAdmin,
  duplicarEventoTemploAdmin,
  listarEventosTemploAdmin,
  mensagemDeErroAdmin,
  type TempleEventoAdminApi,
} from "@/lib/api/admin";
import TempleEditorDrawer from "./components/TempleEditorDrawer";
import TempleAuditTab from "./components/TempleAuditTab";

type Aba = "catalogo" | "auditoria";

const STATUS_LABEL: Record<TempleEventoAdminApi["status"], string> = {
  DRAFT: "Rascunho",
  SCHEDULED: "Agendada",
  ACTIVE: "Ativa",
  RELICARY_ONLY: "Só Relicário",
  ENDED: "Encerrada",
  CANCELLED: "Cancelada",
};

export default function AdminTempleClient() {
  const [aba, setAba] = useState<Aba>("catalogo");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link prefetch={false} href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Templo do Véu Celestial</h1>
        <p className="text-xs text-white/50">
          Catálogo editável só pode ser alterado em Rascunho ou Agendada — a partir de Ativa o snapshot já congelou.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ["catalogo", "Convergências"],
          ["auditoria", "Auditoria"],
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

      {aba === "catalogo" && <AbaCatalogo />}
      {aba === "auditoria" && <TempleAuditTab />}
    </div>
  );
}

function AbaCatalogo() {
  const [itens, setItens] = useState<TempleEventoAdminApi[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [editorAberto, setEditorAberto] = useState(false);
  const [idEventoEditando, setIdEventoEditando] = useState<number | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState<Record<number, string>>({});

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resultado = await listarEventosTemploAdmin({ porPagina: 50 });
      setItens(resultado.eventos);
      setTotal(resultado.total);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar as Convergências."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirCriacao() {
    setIdEventoEditando(null);
    setEditorAberto(true);
  }
  function abrirEdicao(id: number) {
    setIdEventoEditando(id);
    setEditorAberto(true);
  }

  async function duplicar(evento: TempleEventoAdminApi) {
    try {
      await duplicarEventoTemploAdmin(evento.id);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível duplicar."));
    }
  }

  async function cancelar(evento: TempleEventoAdminApi) {
    const motivo = motivoCancelamento[evento.id]?.trim();
    if (!motivo) {
      setErro("Informe um motivo pra cancelar — fica registrado na auditoria.");
      return;
    }
    try {
      await cancelarEventoTemploAdmin(evento.id, motivo);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível cancelar."));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60">{total} Convergência(s) no catálogo</p>
        <button type="button" onClick={abrirCriacao} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
          + Nova Convergência
        </button>
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}

      <div className="overflow-x-auto rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80">
        <table className="w-full text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-white/50">
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Key</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Início</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={5} className="px-3 py-4 text-center text-white/50">Carregando...</td></tr>
            ) : itens.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-4 text-center text-white/50">Nenhuma Convergência cadastrada.</td></tr>
            ) : (
              itens.map((evento) => (
                <tr key={evento.id} className="border-b border-white/5 align-top">
                  <td className="px-3 py-2 font-bold">{evento.nome}</td>
                  <td className="px-3 py-2 text-white/60">{evento.key}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#F3B43F]">
                      {STATUS_LABEL[evento.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-white/60">{evento.starts_at ? new Date(evento.starts_at).toLocaleString("pt-BR") : "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => abrirEdicao(evento.id)} className="text-[#F3B43F] hover:underline">Editar</button>
                      <button type="button" onClick={() => duplicar(evento)} className="text-white/70 hover:underline">Duplicar</button>
                      {(evento.status === "SCHEDULED" || evento.status === "ACTIVE" || evento.status === "RELICARY_ONLY") && (
                        <>
                          <input
                            type="text"
                            placeholder="Motivo..."
                            value={motivoCancelamento[evento.id] ?? ""}
                            onChange={(e) => setMotivoCancelamento((prev) => ({ ...prev, [evento.id]: e.target.value }))}
                            className="w-32 rounded border border-white/20 bg-black/30 px-1.5 py-1 text-xs"
                          />
                          <button type="button" onClick={() => cancelar(evento)} className="text-red-300 hover:underline">Cancelar</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editorAberto && (
        <TempleEditorDrawer
          idEventoInicial={idEventoEditando}
          onFechar={() => setEditorAberto(false)}
          onSalvo={carregar}
        />
      )}
    </div>
  );
}
