"use client";

import Link from "next/link";
import { useState } from "react";
import {
  buscarJogadoresAdmin,
  mensagemDeErroAdmin,
  obterJogadorAdmin,
  type PlayerDetailApi,
  type PlayerSearchResultApi,
} from "@/lib/api/admin";

export default function AdminPlayersClient() {
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<PlayerSearchResultApi[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState("");

  const [detalhe, setDetalhe] = useState<PlayerDetailApi | null>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    setBuscando(true);
    setErro("");
    setDetalhe(null);
    try {
      setResultados(await buscarJogadoresAdmin(termo));
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível buscar."));
    } finally {
      setBuscando(false);
    }
  }

  async function verDetalhe(id: number) {
    setCarregandoDetalhe(true);
    setErro("");
    try {
      setDetalhe(await obterJogadorAdmin(id));
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar o jogador."));
    } finally {
      setCarregandoDetalhe(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Busca de Jogador</h1>
        <p className="mt-1 text-sm text-white/60">Consulte um jogador por nome de personagem, username da conta ou ID.</p>
      </div>

      <form onSubmit={buscar} className="flex gap-2">
        <input
          type="text"
          required
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Nome, username ou ID..."
          className="flex-1 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
        />
        <button
          type="submit"
          disabled={buscando}
          className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50"
        >
          {buscando ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}

      {resultados && (
        <div className="overflow-x-auto rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80">
          <table className="w-full text-left text-sm text-white">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-white/50">
                <th className="px-3 py-2">Personagem</th>
                <th className="px-3 py-2">Conta</th>
                <th className="px-3 py-2">Classe/Raça</th>
                <th className="px-3 py-2">Nível</th>
                <th className="px-3 py-2">Ouro</th>
                <th className="px-3 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {resultados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-white/50">
                    Nenhum jogador encontrado.
                  </td>
                </tr>
              ) : (
                resultados.map((p) => (
                  <tr key={p.id} className="border-b border-white/5">
                    <td className="px-3 py-2 font-bold">{p.nome} <span className="text-white/40">#{p.id}</span></td>
                    <td className="px-3 py-2 text-white/60">{p.username ?? "—"}</td>
                    <td className="px-3 py-2 text-white/60">{p.classe ?? "—"} / {p.raca ?? "—"}</td>
                    <td className="px-3 py-2">{p.nivel}</td>
                    <td className="px-3 py-2">{p.dinheiro.toLocaleString("pt-BR")}</td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => verDetalhe(p.id)} className="text-[#F3B43F] hover:underline">
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {carregandoDetalhe && <p className="text-sm text-white/60">Carregando...</p>}

      {detalhe && (
        <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
          <p className="font-imFeel text-xl text-[#F3B43F]">{detalhe.nome} <span className="text-sm text-white/40">#{detalhe.id}</span></p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div><p className="text-xs text-white/50">Nível</p><p>{detalhe.nivel}</p></div>
            <div><p className="text-xs text-white/50">Experiência</p><p>{detalhe.experiencia.toLocaleString("pt-BR")}</p></div>
            <div><p className="text-xs text-white/50">Ouro</p><p>{detalhe.dinheiro.toLocaleString("pt-BR")}</p></div>
            <div><p className="text-xs text-white/50">Vida atual</p><p>{detalhe.vida_atual}</p></div>
            <div><p className="text-xs text-white/50">Mana atual</p><p>{detalhe.mana_atual}</p></div>
            <div><p className="text-xs text-white/50">Classe / Raça</p><p>{detalhe.classe ?? "—"} / {detalhe.raca ?? "—"}</p></div>
            <div>
              <p className="text-xs text-white/50">Guilda</p>
              <p>{detalhe.guilda ? `${detalhe.guilda.nome} [${detalhe.guilda.sigla}]` : "Sem guilda"}</p>
            </div>
            <div>
              <p className="text-xs text-white/50">Conta</p>
              <p>{detalhe.usuario?.username ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-white/50">E-mail</p>
              <p>{detalhe.usuario?.email ?? "—"}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href={`/dashboard/admin/inventory?id=${detalhe.id}`} className="text-[#F3B43F] hover:underline">
              Ver/corrigir inventário →
            </Link>
            <Link href="/dashboard/admin/grants" className="text-[#F3B43F] hover:underline">
              Conceder premiação →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
