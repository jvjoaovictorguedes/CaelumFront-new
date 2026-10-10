"use client";
import Link from "next/link";
import { useState } from "react";
import { isAxiosError } from "axios";
import axios from "@/utils/axiosIntance";
type Acesso = { id_personagem: number; nome: string; habilitado: boolean };
export default function WorldAccessClient() {
  const [id, setId] = useState("");
  const [acesso, setAcesso] = useState<Acesso | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState("");
  async function consultar() {
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) { setMensagem("Informe um ID de personagem válido."); return; }
    setOcupado(true); setMensagem(""); setAcesso(null);
    try { const response = await axios.get<{ data: Acesso }>(`/admin/world/exploration/${id}/acesso`); setAcesso(response.data.data); }
    catch (erro) { setMensagem(isAxiosError(erro) ? erro.response?.data?.message ?? "Não foi possível consultar." : "Não foi possível consultar."); }
    finally { setOcupado(false); }
  }
  async function alterar() {
    if (!acesso) return;
    setOcupado(true); setMensagem("");
    try { const response = await axios.patch<{ data: Acesso }>(`/admin/world/exploration/${acesso.id_personagem}/acesso`, { habilitado: !acesso.habilitado }); setAcesso(response.data.data); setMensagem("Acesso atualizado e registrado na auditoria."); }
    catch (erro) { setMensagem(isAxiosError(erro) ? erro.response?.data?.message ?? "Não foi possível atualizar." : "Não foi possível atualizar."); }
    finally { setOcupado(false); }
  }
  return <section className="mx-auto max-w-2xl rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/95 p-6 text-white">
    <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]">← Voltar ao painel administrativo</Link>
    <h1 className="mt-4 font-imFeel text-3xl text-[#F3B43F]">Mundo explorável</h1>
    <p className="mt-3 text-sm text-white/80">Fase 0: conferência da Capital e da escala do mapa. Desativado por padrão; liberar este teste não altera combates nem atividades do personagem.</p>
    <form className="mt-5 flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); void consultar(); }}>
      <label className="flex flex-col gap-1 text-sm">ID do personagem<input disabled={ocupado} value={id} onChange={e => { setId(e.target.value); setAcesso(null); }} inputMode="numeric" className="rounded border border-amber-200/40 bg-black/40 px-3 py-2" /></label>
      <button disabled={ocupado} className="rounded border border-[#F3B43F] px-4 py-2 disabled:opacity-50">Consultar</button>
    </form>
    {acesso && <div className="mt-5 rounded-lg bg-black/30 p-4"><p>{acesso.nome} · #{acesso.id_personagem}</p><p className="mt-2">Teste: {acesso.habilitado ? "habilitado" : "desativado"}</p><button onClick={() => void alterar()} disabled={ocupado} className="mt-3 rounded border border-[#F3B43F] px-4 py-2 disabled:opacity-50">{acesso.habilitado ? "Retirar acesso ao mundo" : "Habilitar teste do mundo"}</button></div>}
    <Link prefetch={false} href="/dashboard/mundo" className="mt-4 inline-block text-sm text-[#F3B43F]">Abrir o mundo do meu personagem</Link>
    <p role="status" className="mt-4 text-sm text-amber-100">{mensagem}</p>
  </section>;
}
