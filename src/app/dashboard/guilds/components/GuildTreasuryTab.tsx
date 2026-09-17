"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import type { GuildResumo, Permissao, TransacaoTesouro } from "./types";

function mensagemDeErro(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data
      ?.message ?? fallback
  );
}

export default function GuildTreasuryTab({
  guild,
  characterId,
  pode,
  onMudou,
}: {
  guild: GuildResumo;
  characterId: number;
  pode: Partial<Record<Permissao, boolean>>;
  onMudou: () => void;
}) {
  const [valorDoacao, setValorDoacao] = useState("");
  const [resultadoDoacao, setResultadoDoacao] = useState("");
  const [erroDoacao, setErroDoacao] = useState("");
  const [enviandoDoacao, setEnviandoDoacao] = useState(false);

  const [valorGasto, setValorGasto] = useState("");
  const [motivoGasto, setMotivoGasto] = useState("");
  const [erroGasto, setErroGasto] = useState("");

  const [transacoes, setTransacoes] = useState<TransacaoTesouro[]>([]);

  useEffect(() => {
    if (!pode.autorizar_gastos) return;
    axiosInstance
      .get<{ data?: { transacoes?: TransacaoTesouro[] } }>(`/guilds/${guild.id}/treasury/transactions`)
      .then((resp) => setTransacoes(resp.data?.data?.transacoes ?? []))
      .catch((error) => console.error("Erro ao buscar extrato:", error));
  }, [guild.id, pode.autorizar_gastos]);

  async function doar(event: React.FormEvent) {
    event.preventDefault();
    setErroDoacao("");
    setResultadoDoacao("");
    setEnviandoDoacao(true);
    try {
      const resp = await axiosInstance.post<{
        data?: { tesouro: number; xpConcedido: number; subiuNivel: boolean; niveisGanhos: number };
      }>(`/guilds/${guild.id}/donations`, { idPersonagem: characterId, valor: Number(valorDoacao) });
      const dados = resp.data?.data;
      setResultadoDoacao(
        dados?.subiuNivel
          ? `Doação registrada! A guilda subiu ${dados.niveisGanhos} nível(is)!`
          : "Doação registrada, obrigado pela contribuição!",
      );
      setValorDoacao("");
      onMudou();
    } catch (error) {
      setErroDoacao(mensagemDeErro(error, "Não foi possível processar a doação."));
    } finally {
      setEnviandoDoacao(false);
    }
  }

  async function registrarGasto(event: React.FormEvent) {
    event.preventDefault();
    setErroGasto("");
    try {
      await axiosInstance.post(`/guilds/${guild.id}/treasury/expenses`, {
        idResponsavel: characterId,
        valor: Number(valorGasto),
        motivo: motivoGasto,
      });
      setValorGasto("");
      setMotivoGasto("");
      onMudou();
      const resp = await axiosInstance.get<{ data?: { transacoes?: TransacaoTesouro[] } }>(
        `/guilds/${guild.id}/treasury/transactions`,
      );
      setTransacoes(resp.data?.data?.transacoes ?? []);
    } catch (error) {
      setErroGasto(mensagemDeErro(error, "Não foi possível registrar o gasto."));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        <p className="mb-1 text-sm uppercase tracking-widest text-[#F3B43F]">Tesouro da guilda</p>
        <p className="mb-4 text-3xl font-bold text-[#F3B43F]">
          {guild.tesouro !== undefined ? guild.tesouro : "—"} <span className="text-base text-white/50">ouro</span>
        </p>

        <form onSubmit={doar} className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col">
            <label className="mb-1 text-xs text-white/60">Doar ouro</label>
            <input
              value={valorDoacao}
              onChange={(e) => setValorDoacao(e.target.value)}
              type="number"
              min={1}
              required
              placeholder="Valor"
              className="w-40 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-[#F3B43F]"
            />
          </div>
          <button
            type="submit"
            disabled={enviandoDoacao}
            className="rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black hover:bg-[#a5710f] disabled:opacity-50"
          >
            {enviandoDoacao ? "Doando..." : "Doar"}
          </button>
        </form>
        {resultadoDoacao && <p className="mt-2 text-sm text-green-400">{resultadoDoacao}</p>}
        {erroDoacao && <p className="mt-2 text-sm text-red-400">{erroDoacao}</p>}
      </div>

      {pode.autorizar_gastos && (
        <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
          <p className="mb-3 text-sm uppercase tracking-widest text-[#F3B43F]">Registrar gasto</p>
          <form onSubmit={registrarGasto} className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col">
              <label className="mb-1 text-xs text-white/60">Valor</label>
              <input
                value={valorGasto}
                onChange={(e) => setValorGasto(e.target.value)}
                type="number"
                min={1}
                required
                className="w-32 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white outline-none focus:border-[#F3B43F]"
              />
            </div>
            <div className="flex flex-1 flex-col">
              <label className="mb-1 text-xs text-white/60">Motivo</label>
              <input
                value={motivoGasto}
                onChange={(e) => setMotivoGasto(e.target.value)}
                required
                placeholder="Ex: reserva pro próximo boss"
                className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-[#F3B43F]"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg border-2 border-red-400/60 px-4 py-2 font-bold text-red-300 hover:bg-red-950/40"
            >
              Registrar gasto
            </button>
          </form>
          {erroGasto && <p className="mt-2 text-sm text-red-400">{erroGasto}</p>}

          <p className="mb-2 mt-5 text-sm uppercase tracking-widest text-[#F3B43F]">Extrato</p>
          <div className="flex flex-col gap-1">
            {transacoes.length === 0 ? (
              <p className="text-sm text-white/50">Nenhuma movimentação ainda.</p>
            ) : (
              transacoes.map((transacao) => (
                <div
                  key={transacao.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                >
                  <span>
                    <span
                      className={
                        transacao.tipo === "Gasto" ? "text-red-300" : "text-green-300"
                      }
                    >
                      {transacao.tipo === "Gasto" ? "-" : "+"}
                      {transacao.valor}
                    </span>{" "}
                    · {transacao.Character?.nome ?? "sistema"}
                    {transacao.motivo ? ` · ${transacao.motivo}` : ""}
                  </span>
                  <span className="text-xs text-white/40">
                    {new Date(transacao.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
