"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  mensagemDeErroAdmin,
  obterSpoilConfigAdmin,
  salvarSpoilConfigAdmin,
  type SpoilConfigApi,
  type SpoilReputationLevelApi,
} from "@/lib/api/admin";

const RARIDADES = ["Comum", "Incomum", "Raro", "Epico", "Lendario", "Mitico"] as const;

export default function AdminSpoilConfigClient() {
  const [config, setConfig] = useState<SpoilConfigApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState<string | null>(null);

  useEffect(() => {
    obterSpoilConfigAdmin()
      .then(setConfig)
      .catch((error) => setErro(mensagemDeErroAdmin(error, "Não foi possível carregar a configuração.")))
      .finally(() => setCarregando(false));
  }, []);

  function atualizarNivel(indice: number, campo: keyof SpoilReputationLevelApi, valor: unknown) {
    setConfig((c) => {
      if (!c) return c;
      const niveis = c.reputationLevels.map((n, i) => (i === indice ? { ...n, [campo]: valor } : n));
      return { ...c, reputationLevels: niveis };
    });
  }
  function atualizarBonusFaixa(indice: number, posicao: 0 | 1, valor: number) {
    setConfig((c) => {
      if (!c) return c;
      const niveis = c.reputationLevels.map((n, i) => {
        if (i !== indice) return n;
        const faixa: [number, number] = [...n.bonusFaixa];
        faixa[posicao] = valor;
        return { ...n, bonusFaixa: faixa };
      });
      return { ...c, reputationLevels: niveis };
    });
  }
  function atualizarFaixaQuantidade(raridade: string, posicao: 0 | 1, valor: number) {
    setConfig((c) => {
      if (!c) return c;
      const faixaAtual = c.orderQuantityRanges[raridade] ?? [1, 1];
      const faixa: [number, number] = [...faixaAtual];
      faixa[posicao] = valor;
      return { ...c, orderQuantityRanges: { ...c.orderQuantityRanges, [raridade]: faixa } };
    });
  }

  async function salvar(campo: "reputationLevels" | "orderQuantityRanges" | "scalars") {
    if (!config) return;
    setSalvando(campo);
    setErro("");
    setMensagem("");
    try {
      let payload: Partial<SpoilConfigApi> = {};
      if (campo === "reputationLevels") payload = { reputationLevels: config.reputationLevels };
      else if (campo === "orderQuantityRanges") payload = { orderQuantityRanges: config.orderQuantityRanges };
      else payload = { orderReputationReward: config.orderReputationReward, setBonusReputationReward: config.setBonusReputationReward };
      const atualizado = await salvarSpoilConfigAdmin(payload);
      setConfig(atualizado);
      setMensagem("Salvo.");
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar."));
    } finally {
      setSalvando(null);
    }
  }

  if (carregando) return <p className="text-sm text-white/50">Carregando...</p>;
  if (!config) return <p className="text-sm text-red-400">{erro || "Configuração indisponível."}</p>;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Balcão de Espólios</h1>
        <p className="mt-1 text-xs text-white/50">
          Não existe catálogo de encomenda pra editar — o conteúdo é sorteado em cima dos Itens de Espólio já
          cadastrados. O que dá pra configurar aqui é a Reputação Comercial e as faixas de quantidade por raridade.
        </p>
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      {mensagem && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-[#F3B43F]">{mensagem}</p>}

      <div className="flex flex-col gap-2 rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4">
        <div className="flex items-center justify-between">
          <p className="font-imFeel text-lg text-[#F3B43F]">Níveis de Reputação Comercial</p>
          <button type="button" onClick={() => salvar("reputationLevels")} disabled={salvando === "reputationLevels"} className="rounded-lg bg-[#BC8418] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
            {salvando === "reputationLevels" ? "Salvando..." : "Salvar níveis"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white">
            <thead>
              <tr className="text-white/50">
                <th className="px-2 py-1">Nível</th>
                <th className="px-2 py-1">Nome</th>
                <th className="px-2 py-1">Pontos mínimos</th>
                <th className="px-2 py-1">Multiplicador de ouro</th>
                <th className="px-2 py-1">Bônus mín.</th>
                <th className="px-2 py-1">Bônus máx.</th>
              </tr>
            </thead>
            <tbody>
              {config.reputationLevels.map((nivel, i) => (
                <tr key={nivel.nivel} className="border-t border-white/10">
                  <td className="px-2 py-1">{nivel.roman}</td>
                  <td className="px-2 py-1">
                    <input value={nivel.nome} onChange={(e) => atualizarNivel(i, "nome", e.target.value)} className="w-28 rounded border border-white/20 bg-black/30 px-1.5 py-1" />
                  </td>
                  <td className="px-2 py-1">
                    <input type="number" min={0} value={nivel.minimo} onChange={(e) => atualizarNivel(i, "minimo", Number(e.target.value))} className="w-24 rounded border border-white/20 bg-black/30 px-1.5 py-1" />
                  </td>
                  <td className="px-2 py-1">
                    <input type="number" step="0.01" min={0} value={nivel.multiplicador} onChange={(e) => atualizarNivel(i, "multiplicador", Number(e.target.value))} className="w-20 rounded border border-white/20 bg-black/30 px-1.5 py-1" />
                  </td>
                  <td className="px-2 py-1">
                    <input type="number" step="0.01" min={0} max={1} value={nivel.bonusFaixa[0]} onChange={(e) => atualizarBonusFaixa(i, 0, Number(e.target.value))} className="w-16 rounded border border-white/20 bg-black/30 px-1.5 py-1" />
                  </td>
                  <td className="px-2 py-1">
                    <input type="number" step="0.01" min={0} max={1} value={nivel.bonusFaixa[1]} onChange={(e) => atualizarBonusFaixa(i, 1, Number(e.target.value))} className="w-16 rounded border border-white/20 bg-black/30 px-1.5 py-1" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4">
        <div className="flex items-center justify-between">
          <p className="font-imFeel text-lg text-[#F3B43F]">Quantidade exigida por encomenda (por raridade)</p>
          <button type="button" onClick={() => salvar("orderQuantityRanges")} disabled={salvando === "orderQuantityRanges"} className="rounded-lg bg-[#BC8418] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
            {salvando === "orderQuantityRanges" ? "Salvando..." : "Salvar faixas"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {RARIDADES.map((raridade) => {
            const faixa = config.orderQuantityRanges[raridade] ?? [1, 1];
            return (
              <div key={raridade} className="flex flex-col gap-1 rounded-lg bg-black/20 p-2 text-xs text-white">
                <span className="font-bold text-[#F3B43F]/80">{raridade}</span>
                <div className="flex items-center gap-1">
                  <input type="number" min={1} value={faixa[0]} onChange={(e) => atualizarFaixaQuantidade(raridade, 0, Number(e.target.value))} className="w-16 rounded border border-white/20 bg-black/30 px-1.5 py-1" />
                  <span>a</span>
                  <input type="number" min={1} value={faixa[1]} onChange={(e) => atualizarFaixaQuantidade(raridade, 1, Number(e.target.value))} className="w-16 rounded border border-white/20 bg-black/30 px-1.5 py-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4">
        <div className="flex items-center justify-between">
          <p className="font-imFeel text-lg text-[#F3B43F]">Reputação concedida</p>
          <button type="button" onClick={() => salvar("scalars")} disabled={salvando === "scalars"} className="rounded-lg bg-[#BC8418] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
            {salvando === "scalars" ? "Salvando..." : "Salvar"}
          </button>
        </div>
        <div className="flex gap-4">
          <label className="flex flex-col gap-1 text-xs text-white">
            Por encomenda entregue
            <input type="number" min={1} value={config.orderReputationReward} onChange={(e) => setConfig((c) => (c ? { ...c, orderReputationReward: Number(e.target.value) } : c))} className="w-28 rounded-lg border border-white/20 bg-black/30 px-2 py-1.5" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-white">
            Bônus do lote 5/5
            <input type="number" min={1} value={config.setBonusReputationReward} onChange={(e) => setConfig((c) => (c ? { ...c, setBonusReputationReward: Number(e.target.value) } : c))} className="w-28 rounded-lg border border-white/20 bg-black/30 px-2 py-1.5" />
          </label>
        </div>
      </div>
    </div>
  );
}
