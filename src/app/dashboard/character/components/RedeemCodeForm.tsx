"use client";

import axios from "axios";
import { useState, type FormEvent } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { useToast } from "@/contexts/ToastContext";

interface ConcedidoApi {
  ouro: number;
  xp: number;
  niveisGanhos: number;
  itens: { nome: string; quantidade: number }[];
  equipamentos: { nome: string; quantidade: number }[];
}

function descreverConcessao(concedido: ConcedidoApi): string {
  const partes: string[] = [];
  if (concedido.ouro > 0) partes.push(`${concedido.ouro} ouro`);
  if (concedido.xp > 0) partes.push(`${concedido.xp} XP${concedido.niveisGanhos > 0 ? ` (+${concedido.niveisGanhos} nível!)` : ""}`);
  for (const item of [...concedido.itens, ...concedido.equipamentos]) {
    partes.push(`${item.quantidade}x ${item.nome}`);
  }
  return partes.length > 0 ? `Você recebeu: ${partes.join(", ")}.` : "Código resgatado!";
}

export default function RedeemCodeForm({ characterId }: { characterId: number }) {
  const [codigo, setCodigo] = useState("");
  const [resgatando, setResgatando] = useState(false);
  const { mostrarErro, mostrarSucesso } = useToast();

  async function resgatar(e: FormEvent) {
    e.preventDefault();
    if (!codigo.trim()) return;
    setResgatando(true);
    try {
      const resposta = await axiosInstance.post<{ data: { concedido: ConcedidoApi } }>(
        `/characters/${characterId}/redemption-codes/resgatar`,
        { codigo },
      );
      mostrarSucesso(descreverConcessao(resposta.data.data.concedido));
      setCodigo("");
    } catch (error: unknown) {
      const mensagem = axios.isAxiosError<{ message?: string }>(error)
        ? (error.response?.data?.message ?? "Não foi possível resgatar o código.")
        : "Não foi possível resgatar o código.";
      mostrarErro(mensagem);
    } finally {
      setResgatando(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-[#3a2f24] p-5 text-white shadow-lg">
      <p className="font-imFeel text-xl text-[#F3B43F]">Código de Resgate</p>
      <p className="text-xs text-white/60">Recebeu um código promocional? Digite abaixo para resgatar suas recompensas.</p>

      <form onSubmit={resgatar} className="flex gap-2">
        <input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="Digite o código..."
          className="flex-1 rounded-lg border border-white/20 bg-[#292018] px-3 py-2 uppercase text-white outline-none focus:border-[#F3B43F]"
        />
        <button
          type="submit"
          disabled={resgatando || !codigo.trim()}
          className="rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black transition hover:bg-[#a5710f] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {resgatando ? "Resgatando..." : "Resgatar"}
        </button>
      </form>
    </div>
  );
}
