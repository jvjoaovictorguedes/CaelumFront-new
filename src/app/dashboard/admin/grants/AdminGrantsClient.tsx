"use client";

import Link from "next/link";
import { useState } from "react";
import {
  buscarPersonagensAdmin,
  concederPremiacaoAdmin,
  mensagemDeErroAdmin,
  type GrantResultApi,
  type GrantSearchResultApi,
} from "@/lib/api/admin";
import { ItemSelect, useItensParaSelecaoAdmin } from "@/components/admin/ItemPicker";

interface LinhaItem {
  id_item: string;
  quantidade: string;
}

export default function AdminGrantsClient() {
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<GrantSearchResultApi[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState("");

  const [selecionado, setSelecionado] = useState<GrantSearchResultApi | null>(null);
  const [ouro, setOuro] = useState("");
  const [xp, setXp] = useState("");
  const [itens, setItens] = useState<LinhaItem[]>([]);
  const [motivo, setMotivo] = useState("");
  const [concedendo, setConcedendo] = useState(false);
  const [erroConcessao, setErroConcessao] = useState("");
  const [resultado, setResultado] = useState<GrantResultApi | null>(null);
  const { itens: itensDisponiveis } = useItensParaSelecaoAdmin();

  async function buscar(evento: React.FormEvent) {
    evento.preventDefault();
    setBuscando(true);
    setErroBusca("");
    setResultados([]);
    try {
      setResultados(await buscarPersonagensAdmin(termo));
    } catch (error) {
      setErroBusca(mensagemDeErroAdmin(error, "Não foi possível buscar."));
    } finally {
      setBuscando(false);
    }
  }

  function selecionar(personagem: GrantSearchResultApi) {
    setSelecionado(personagem);
    setOuro("");
    setXp("");
    setItens([]);
    setMotivo("");
    setResultado(null);
    setErroConcessao("");
  }

  function adicionarLinhaItem() {
    setItens((i) => [...i, { id_item: "", quantidade: "1" }]);
  }
  function atualizarLinhaItem(indice: number, campo: keyof LinhaItem, valor: string) {
    setItens((i) => i.map((linha, idx) => (idx === indice ? { ...linha, [campo]: valor } : linha)));
  }
  function removerLinhaItem(indice: number) {
    setItens((i) => i.filter((_, idx) => idx !== indice));
  }

  async function conceder(evento: React.FormEvent) {
    evento.preventDefault();
    if (!selecionado) return;
    setConcedendo(true);
    setErroConcessao("");
    setResultado(null);
    try {
      const payload = {
        ouro: ouro ? Number(ouro) : undefined,
        xp: xp ? Number(xp) : undefined,
        itens: itens
          .filter((l) => l.id_item && l.quantidade)
          .map((l) => ({ id_item: Number(l.id_item), quantidade: Number(l.quantidade) })),
        motivo,
      };
      const res = await concederPremiacaoAdmin(selecionado.id, payload);
      setResultado(res);
      setOuro("");
      setXp("");
      setItens([]);
      setMotivo("");
      setSelecionado((s) => (s ? { ...s, dinheiro: res.personagem.dinheiro, nivel: res.personagem.nivel } : s));
    } catch (error) {
      setErroConcessao(mensagemDeErroAdmin(error, "Não foi possível conceder a premiação."));
    } finally {
      setConcedendo(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Premiações</h1>
        <p className="mt-1 text-xs text-white/50">Conceda ouro, XP e/ou itens (empilháveis ou equipamentos) diretamente a um jogador. Toda concessão fica na auditoria com o motivo.</p>
      </div>

      <form onSubmit={buscar} className="flex gap-2">
        <input
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Nome do personagem ou username..."
          className="flex-1 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
        />
        <button type="submit" disabled={buscando} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
          {buscando ? "Buscando..." : "Buscar"}
        </button>
      </form>
      {erroBusca && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erroBusca}</p>}

      {resultados.length > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-3">
          {resultados.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selecionar(p)}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-white/10 ${selecionado?.id === p.id ? "bg-[#F3B43F]/10" : "bg-black/20"}`}
            >
              <span>
                <span className="font-bold text-[#F3B43F]">{p.nome}</span> · nível {p.nivel} {p.username && <span className="text-white/50">· @{p.username}</span>}
              </span>
              <span className="text-white/60">{p.dinheiro} ouro</span>
            </button>
          ))}
        </div>
      )}

      {selecionado && (
        <form onSubmit={conceder} className="flex flex-col gap-3 rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-4 text-white">
          <p className="font-imFeel text-lg text-[#F3B43F]">
            Premiar {selecionado.nome} <span className="text-sm text-white/50">(nível {selecionado.nivel} · {selecionado.dinheiro} ouro)</span>
          </p>
          {erroConcessao && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erroConcessao}</p>}
          {resultado && (
            <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-[#F3B43F]">
              Concedido: {resultado.concedido.ouro > 0 && `${resultado.concedido.ouro} ouro `}
              {resultado.concedido.xp > 0 && `${resultado.concedido.xp} XP `}
              {resultado.concedido.niveisGanhos > 0 && `(+${resultado.concedido.niveisGanhos} nível!) `}
              {[...resultado.concedido.itens, ...resultado.concedido.equipamentos].map((i) => `${i.quantidade}x ${i.nome}`).join(", ")}
            </p>
          )}

          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1 text-xs">
              Ouro
              <input type="number" min={1} value={ouro} onChange={(e) => setOuro(e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-xs">
              XP
              <input type="number" min={1} value={xp} onChange={(e) => setXp(e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase text-[#F3B43F]/80">Itens (escolha pelo nome — detecta sozinho se é equipamento ou empilhável)</p>
            {itens.map((linha, i) => (
              <div key={i} className="flex items-center gap-2">
                <ItemSelect
                  itens={itensDisponiveis}
                  value={linha.id_item ? Number(linha.id_item) : ""}
                  onChange={(id) => atualizarLinhaItem(i, "id_item", id === "" ? "" : String(id))}
                  className="w-64 rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                />
                <input type="number" min={1} placeholder="Quantidade" value={linha.quantidade} onChange={(e) => atualizarLinhaItem(i, "quantidade", e.target.value)} className="w-28 rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
                <button type="button" onClick={() => removerLinhaItem(i)} className="text-xs text-red-400 hover:underline">
                  Remover
                </button>
              </div>
            ))}
            <button type="button" onClick={adicionarLinhaItem} className="self-start rounded-lg border border-[#F3B43F]/50 px-3 py-1 text-xs font-bold text-[#F3B43F] hover:bg-[#F3B43F]/10">
              + Item
            </button>
          </div>

          <label className="flex flex-col gap-1 text-xs">
            Motivo (obrigatório — vai pra auditoria)
            <textarea required value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
          </label>

          <button type="submit" disabled={concedendo} className="self-end rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
            {concedendo ? "Concedendo..." : "Conceder"}
          </button>
        </form>
      )}
    </div>
  );
}
