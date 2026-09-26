"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  atualizarStatusManutencaoAdmin,
  mensagemDeErroAdmin,
  obterStatusManutencaoAdmin,
} from "@/lib/api/admin";

const MENSAGEM_PADRAO = "Estamos em manutenção para melhorar sua experiência. Voltamos em breve — obrigado pela paciência!";

export default function AdminMaintenanceClient() {
  const [carregando, setCarregando] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [mensagem, setMensagem] = useState(MENSAGEM_PADRAO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const status = await obterStatusManutencaoAdmin();
      setEnabled(status.enabled);
      setMensagem(status.message);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar o status do Modo Manutenção."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function alternar() {
    setSalvando(true);
    setErro("");
    setSucesso("");
    const novoValor = !enabled;
    try {
      const status = await atualizarStatusManutencaoAdmin({ enabled: novoValor });
      setEnabled(status.enabled);
      setSucesso(status.enabled ? "Modo Manutenção ATIVADO — só admins conseguem jogar agora." : "Modo Manutenção desativado — o jogo está liberado de novo.");
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível mudar o Modo Manutenção."));
    } finally {
      setSalvando(false);
    }
  }

  async function salvarMensagem(evento: React.FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setErro("");
    setSucesso("");
    try {
      const status = await atualizarStatusManutencaoAdmin({ enabled, message: mensagem });
      setMensagem(status.message);
      setSucesso("Mensagem salva.");
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar a mensagem."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Manutenção</h1>
        <p className="mt-1 text-xs text-white/50">
          Ao ativar, todo jogador (deslogado ou não) vê uma tela de manutenção em vez do jogo — só admins continuam
          conseguindo jogar normalmente.
        </p>
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      {sucesso && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-[#F3B43F]">{sucesso}</p>}

      {carregando ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : (
        <>
          <div
            className={`flex items-center justify-between gap-4 rounded-2xl border-2 p-5 ${
              enabled ? "border-red-500/60 bg-red-950/30" : "border-[#F3B43F]/40 bg-[#292018]/80"
            }`}
          >
            <div>
              <p className={`font-imFeel text-lg ${enabled ? "text-red-400" : "text-[#F3B43F]"}`}>
                {enabled ? "Manutenção ATIVA" : "Jogo liberado normalmente"}
              </p>
              <p className="text-xs text-white/60">
                {enabled ? "Jogadores comuns não conseguem usar o jogo agora." : "Todo mundo consegue jogar normalmente."}
              </p>
            </div>
            <button
              type="button"
              onClick={alternar}
              disabled={salvando}
              className={`shrink-0 rounded-lg px-5 py-2.5 text-sm font-bold disabled:opacity-50 ${
                enabled ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              {salvando ? "Aguarde..." : enabled ? "Desativar manutenção" : "Ativar manutenção"}
            </button>
          </div>

          <form onSubmit={salvarMensagem} className="flex flex-col gap-3 rounded-2xl border-2 border-[#F3B43F]/30 bg-[#292018]/80 p-4 text-white">
            <label className="flex flex-col gap-1 text-xs">
              Mensagem amigável mostrada ao jogador
              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                rows={3}
                className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
              />
            </label>
            <button type="submit" disabled={salvando} className="self-end rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
              {salvando ? "Salvando..." : "Salvar mensagem"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
