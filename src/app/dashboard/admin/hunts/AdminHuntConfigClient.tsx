"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  mensagemDeErroAdmin,
  obterHuntConfigAdmin,
  salvarHuntConfigAdmin,
  type HuntConfigApi,
  type HuntDifficultyApi,
} from "@/lib/api/admin";

export default function AdminHuntConfigClient() {
  const [config, setConfig] = useState<HuntConfigApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState<string | null>(null);

  useEffect(() => {
    obterHuntConfigAdmin()
      .then(setConfig)
      .catch((error) => setErro(mensagemDeErroAdmin(error, "Não foi possível carregar a configuração.")))
      .finally(() => setCarregando(false));
  }, []);

  function atualizarDificuldade(chave: string, campo: keyof HuntDifficultyApi, valor: unknown) {
    setConfig((c) => {
      if (!c) return c;
      return { ...c, difficulties: { ...c.difficulties, [chave]: { ...c.difficulties[chave], [campo]: valor } } };
    });
  }
  function atualizarFaixaQuantidade(chave: string, posicao: 0 | 1, valor: number) {
    setConfig((c) => {
      if (!c) return c;
      const faixa: [number, number] = [...c.difficulties[chave].quantityRange];
      faixa[posicao] = valor;
      return { ...c, difficulties: { ...c.difficulties, [chave]: { ...c.difficulties[chave], quantityRange: faixa } } };
    });
  }
  function atualizarNivel(indice: number, campo: "roman" | "titulo" | "minimo", valor: unknown) {
    setConfig((c) => {
      if (!c) return c;
      const niveis = c.reputationLevels.map((n, i) => (i === indice ? { ...n, [campo]: valor } : n));
      return { ...c, reputationLevels: niveis };
    });
  }
  function alternarPool(indice: number, dificuldade: string) {
    setConfig((c) => {
      if (!c) return c;
      const niveis = c.reputationLevels.map((n, i) => {
        if (i !== indice) return n;
        const pool = n.pool.includes(dificuldade) ? n.pool.filter((d) => d !== dificuldade) : [...n.pool, dificuldade];
        return { ...n, pool };
      });
      return { ...c, reputationLevels: niveis };
    });
  }
  function atualizarPeso(nivel: number, dificuldade: string, valor: number) {
    setConfig((c) => {
      if (!c) return c;
      return {
        ...c,
        difficultyWeightsByReputation: {
          ...c.difficultyWeightsByReputation,
          [nivel]: { ...c.difficultyWeightsByReputation[nivel], [dificuldade]: valor },
        },
      };
    });
  }

  async function salvar(campo: "difficulties" | "reputationLevels" | "difficultyWeightsByReputation") {
    if (!config) return;
    setSalvando(campo);
    setErro("");
    setMensagem("");
    try {
      const atualizado = await salvarHuntConfigAdmin({ [campo]: config[campo] });
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

  const chavesDificuldade = Object.keys(config.difficulties).sort((a, b) => config.difficulties[a].ordem - config.difficulties[b].ordem);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Caçadas</h1>
        <p className="mt-1 text-xs text-white/50">
          Não existe catálogo de caçada pra editar — o alvo é sorteado em cima das Zonas/Monstros do Modo Aventura já
          cadastrados. O que dá pra configurar aqui é a dificuldade e a Reputação de Caçador.
        </p>
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      {mensagem && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-[#F3B43F]">{mensagem}</p>}

      <div className="flex flex-col gap-2 rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4">
        <div className="flex items-center justify-between">
          <p className="font-imFeel text-lg text-[#F3B43F]">Tiers de dificuldade</p>
          <button type="button" onClick={() => salvar("difficulties")} disabled={salvando === "difficulties"} className="rounded-lg bg-[#BC8418] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
            {salvando === "difficulties" ? "Salvando..." : "Salvar dificuldades"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white">
            <thead>
              <tr className="text-white/50">
                <th className="px-2 py-1">Chave</th>
                <th className="px-2 py-1">Nome</th>
                <th className="px-2 py-1">Vida +%</th>
                <th className="px-2 py-1">Dano +%</th>
                <th className="px-2 py-1">Qtd. mín.</th>
                <th className="px-2 py-1">Qtd. máx.</th>
                <th className="px-2 py-1">Recompensa ×</th>
                <th className="px-2 py-1">Reputação</th>
              </tr>
            </thead>
            <tbody>
              {chavesDificuldade.map((chave) => {
                const d = config.difficulties[chave];
                return (
                  <tr key={chave} className="border-t border-white/10">
                    <td className="px-2 py-1 text-white/50">{chave}</td>
                    <td className="px-2 py-1">
                      <input value={d.nome} onChange={(e) => atualizarDificuldade(chave, "nome", e.target.value)} className="w-24 rounded border border-white/20 bg-black/30 px-1.5 py-1" />
                    </td>
                    <td className="px-2 py-1">
                      <input type="number" step="0.01" min={0} value={d.hpMultiplier} onChange={(e) => atualizarDificuldade(chave, "hpMultiplier", Number(e.target.value))} className="w-16 rounded border border-white/20 bg-black/30 px-1.5 py-1" />
                    </td>
                    <td className="px-2 py-1">
                      <input type="number" step="0.01" min={0} value={d.damageMultiplier} onChange={(e) => atualizarDificuldade(chave, "damageMultiplier", Number(e.target.value))} className="w-16 rounded border border-white/20 bg-black/30 px-1.5 py-1" />
                    </td>
                    <td className="px-2 py-1">
                      <input type="number" min={1} value={d.quantityRange[0]} onChange={(e) => atualizarFaixaQuantidade(chave, 0, Number(e.target.value))} className="w-14 rounded border border-white/20 bg-black/30 px-1.5 py-1" />
                    </td>
                    <td className="px-2 py-1">
                      <input type="number" min={1} value={d.quantityRange[1]} onChange={(e) => atualizarFaixaQuantidade(chave, 1, Number(e.target.value))} className="w-14 rounded border border-white/20 bg-black/30 px-1.5 py-1" />
                    </td>
                    <td className="px-2 py-1">
                      <input type="number" step="0.01" min={0.01} value={d.rewardMultiplier} onChange={(e) => atualizarDificuldade(chave, "rewardMultiplier", Number(e.target.value))} className="w-16 rounded border border-white/20 bg-black/30 px-1.5 py-1" />
                    </td>
                    <td className="px-2 py-1">
                      <input type="number" min={0} value={d.reputationReward} onChange={(e) => atualizarDificuldade(chave, "reputationReward", Number(e.target.value))} className="w-16 rounded border border-white/20 bg-black/30 px-1.5 py-1" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4">
        <div className="flex items-center justify-between">
          <p className="font-imFeel text-lg text-[#F3B43F]">Níveis de Reputação de Caçador</p>
          <button type="button" onClick={() => salvar("reputationLevels")} disabled={salvando === "reputationLevels"} className="rounded-lg bg-[#BC8418] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
            {salvando === "reputationLevels" ? "Salvando..." : "Salvar níveis"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white">
            <thead>
              <tr className="text-white/50">
                <th className="px-2 py-1">Título</th>
                <th className="px-2 py-1">Pontos mínimos</th>
                <th className="px-2 py-1">Pool de dificuldades liberadas</th>
              </tr>
            </thead>
            <tbody>
              {config.reputationLevels.map((nivel, i) => (
                <tr key={nivel.nivel} className="border-t border-white/10">
                  <td className="px-2 py-1">
                    <input value={nivel.titulo} onChange={(e) => atualizarNivel(i, "titulo", e.target.value)} className="w-40 rounded border border-white/20 bg-black/30 px-1.5 py-1" />
                  </td>
                  <td className="px-2 py-1">
                    <input type="number" min={0} value={nivel.minimo} onChange={(e) => atualizarNivel(i, "minimo", Number(e.target.value))} className="w-24 rounded border border-white/20 bg-black/30 px-1.5 py-1" />
                  </td>
                  <td className="px-2 py-1">
                    <div className="flex flex-wrap gap-2">
                      {chavesDificuldade.map((chave) => (
                        <label key={chave} className="flex items-center gap-1">
                          <input type="checkbox" checked={nivel.pool.includes(chave)} onChange={() => alternarPool(i, chave)} />
                          {config.difficulties[chave].nome}
                        </label>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4">
        <div className="flex items-center justify-between">
          <p className="font-imFeel text-lg text-[#F3B43F]">Pesos de sorteio por nível de Reputação</p>
          <button type="button" onClick={() => salvar("difficultyWeightsByReputation")} disabled={salvando === "difficultyWeightsByReputation"} className="rounded-lg bg-[#BC8418] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
            {salvando === "difficultyWeightsByReputation" ? "Salvando..." : "Salvar pesos"}
          </button>
        </div>
        <p className="text-[11px] text-white/50">Só cabe peso pra dificuldade que está no pool daquele nível (marcado na tabela acima).</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white">
            <thead>
              <tr className="text-white/50">
                <th className="px-2 py-1">Nível</th>
                {chavesDificuldade.map((chave) => (
                  <th key={chave} className="px-2 py-1">
                    {config.difficulties[chave].nome}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {config.reputationLevels.map((nivel) => (
                <tr key={nivel.nivel} className="border-t border-white/10">
                  <td className="px-2 py-1 font-bold">{nivel.titulo}</td>
                  {chavesDificuldade.map((chave) => {
                    const habilitado = nivel.pool.includes(chave);
                    return (
                      <td key={chave} className="px-2 py-1">
                        {habilitado ? (
                          <input
                            type="number"
                            min={0}
                            value={config.difficultyWeightsByReputation[nivel.nivel]?.[chave] ?? 0}
                            onChange={(e) => atualizarPeso(nivel.nivel, chave, Number(e.target.value))}
                            className="w-16 rounded border border-white/20 bg-black/30 px-1.5 py-1"
                          />
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
