"use client";

// Admin Aventura — Editor de Balanceamento de Monstros por Resultado.
// Camada de tradução/preview em cima dos 4 multiplicadores reais
// (vida/dano/agilidade/velocidade) — o backend é a autoridade: todo
// número mostrado aqui (min/média/máx, esquiva, TTK, dificuldade) vem
// de /admin/adventure/monsters/:id/balance-preview, nunca calculado no
// frontend (nenhuma fórmula de combate duplicada aqui).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  listarPresetsBalanceamentoAdmin,
  mensagemDeErroAdmin,
  previewBalanceamentoMonstroAdmin,
  simularBalanceamentoMonstroAdmin,
  type AdventureMonsterApi,
  type MonsterBalanceDesiredInput,
  type MonsterBalanceMultiplicadoresApi,
  type MonsterBalancePerfilApi,
  type MonsterBalancePresetApi,
  type MonsterBalancePreviewApi,
  type MonsterBalanceSimulationApi,
} from "@/lib/api/admin";

const DEBOUNCE_MS = 350;

function multiplicadoresDoMonstro(monstro: AdventureMonsterApi): MonsterBalanceMultiplicadoresApi {
  return {
    vida: monstro.multiplicador_vida ?? 1,
    dano: monstro.multiplicador_dano ?? 1,
    agilidade: monstro.multiplicador_agilidade ?? 1,
    velocidade: monstro.multiplicador_velocidade ?? 1,
  };
}

function multiplicadoresIguais(a: MonsterBalanceMultiplicadoresApi, b: MonsterBalanceMultiplicadoresApi): boolean {
  return a.vida === b.vida && a.dano === b.dano && a.agilidade === b.agilidade && a.velocidade === b.velocidade;
}

function fmt(valor: number | null | undefined, casas = 0): string {
  if (valor == null || !Number.isFinite(valor)) return "—";
  return valor.toFixed(casas);
}

function corDificuldade(chave: string): string {
  switch (chave) {
    case "TRIVIAL":
    case "FACIL":
      return "text-green-400";
    case "NORMAL":
      return "text-[#F3B43F]";
    case "DIFICIL":
      return "text-orange-400";
    case "MUITO_DIFICIL":
    case "EXTREMO":
      return "text-red-400";
    default:
      return "text-white/70";
  }
}

export default function MonsterBalanceEditor({
  monstro,
  onSalvar,
  onCancelar,
  salvando,
}: {
  monstro: AdventureMonsterApi;
  onSalvar: (multiplicadores: MonsterBalanceMultiplicadoresApi, balanceContext: Record<string, unknown>) => void;
  onCancelar: () => void;
  salvando: boolean;
}) {
  const multiplicadoresSalvos = useMemo(() => multiplicadoresDoMonstro(monstro), [monstro]);

  const [modo, setModo] = useState<"simples" | "avancado">("simples");
  const [nivelReferencia, setNivelReferencia] = useState(20);
  const [multiplicadoresAvancado, setMultiplicadoresAvancado] = useState<MonsterBalanceMultiplicadoresApi>(multiplicadoresSalvos);
  const [desired, setDesired] = useState<MonsterBalanceDesiredInput | null>(null);
  const [presetSelecionado, setPresetSelecionado] = useState<string>("PERSONALIZADO");

  const [preview, setPreview] = useState<MonsterBalancePreviewApi | null>(null);
  const [carregandoPreview, setCarregandoPreview] = useState(false);
  const [erroPreview, setErroPreview] = useState("");

  const [presets, setPresets] = useState<MonsterBalancePresetApi[]>([]);
  const [perfis, setPerfis] = useState<MonsterBalancePerfilApi[]>([]);

  const [simulacao, setSimulacao] = useState<MonsterBalanceSimulationApi | null>(null);
  const [simulando, setSimulando] = useState(false);
  const [erroSimulacao, setErroSimulacao] = useState("");

  const requestIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    listarPresetsBalanceamentoAdmin()
      .then(({ presets: p, perfis: pf }) => {
        setPresets(p);
        setPerfis(pf);
      })
      .catch(() => {
        /* presets são só conveniência — falha aqui não bloqueia o editor */
      });
  }, []);

  const dirty = !multiplicadoresIguais(multiplicadoresAvancado, multiplicadoresSalvos);

  const executarPreview = useCallback(
    async (params: { nivel: number; modoPreview: "desired" | "multipliers"; desiredValores?: MonsterBalanceDesiredInput; mult?: MonsterBalanceMultiplicadoresApi }) => {
      const meuId = ++requestIdRef.current;
      setCarregandoPreview(true);
      setErroPreview("");
      try {
        const resposta = await previewBalanceamentoMonstroAdmin(monstro.id, {
          referenceLevel: params.nivel,
          mode: params.modoPreview,
          desired: params.desiredValores,
          multiplicadores: params.mult,
        });
        if (meuId !== requestIdRef.current) return; // requisição antiga — descartada (§11 "cancelar request anterior")
        setPreview(resposta);
        setMultiplicadoresAvancado(resposta.multiplicadores);
        if (params.modoPreview === "multipliers") {
          setDesired({
            hpMean: Math.round(resposta.statsFinais.vida.media),
            damageMean: Math.round(resposta.statsFinais.dano.media),
            dodgeVsAveragePct: resposta.esquivaContraPerfis.MEDIO ?? 5,
            speedMean: Math.round(resposta.statsFinais.velocidade.media),
          });
        }
      } catch (erro) {
        if (meuId !== requestIdRef.current) return;
        setErroPreview(mensagemDeErroAdmin(erro, "Não foi possível calcular o preview de balanceamento."));
      } finally {
        if (meuId === requestIdRef.current) setCarregandoPreview(false);
      }
    },
    [monstro.id],
  );

  // Carga inicial — preview a partir dos multiplicadores JÁ salvos, pra
  // popular "desired" (Modo Simples) e o preview antes de qualquer
  // edição do admin.
  useEffect(() => {
    executarPreview({ nivel: nivelReferencia, modoPreview: "multipliers", mult: multiplicadoresSalvos });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce — dispara um novo preview 350ms depois da última edição,
  // cancelando o timer anterior (nunca a request em voo em si, mas a
  // guarda de requestId acima já garante que uma resposta atrasada
  // nunca sobrescreve uma mais nova).
  function agendarPreview(params: { nivel: number; modoPreview: "desired" | "multipliers"; desiredValores?: MonsterBalanceDesiredInput; mult?: MonsterBalanceMultiplicadoresApi }) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => executarPreview(params), DEBOUNCE_MS);
  }

  function mudarNivel(novoNivel: number) {
    setNivelReferencia(novoNivel);
    if (modo === "simples" && desired) {
      agendarPreview({ nivel: novoNivel, modoPreview: "desired", desiredValores: desired });
    } else {
      agendarPreview({ nivel: novoNivel, modoPreview: "multipliers", mult: multiplicadoresAvancado });
    }
  }

  function mudarDesired(campo: keyof MonsterBalanceDesiredInput, valor: number) {
    const novo = { ...(desired ?? { hpMean: 0, damageMean: 0, dodgeVsAveragePct: 5, speedMean: 0 }), [campo]: valor };
    setDesired(novo);
    setPresetSelecionado("PERSONALIZADO");
    agendarPreview({ nivel: nivelReferencia, modoPreview: "desired", desiredValores: novo });
  }

  function mudarMultiplicador(campo: keyof MonsterBalanceMultiplicadoresApi, valor: number) {
    const novo = { ...multiplicadoresAvancado, [campo]: valor };
    setMultiplicadoresAvancado(novo);
    setPresetSelecionado("PERSONALIZADO");
    agendarPreview({ nivel: nivelReferencia, modoPreview: "multipliers", mult: novo });
  }

  function aplicarPreset(chave: string) {
    setPresetSelecionado(chave);
    if (chave === "PERSONALIZADO") return;
    const preset = presets.find((p) => p.chave === chave);
    if (!preset) return;
    setModo("avancado");
    setMultiplicadoresAvancado(preset.multiplicadores);
    agendarPreview({ nivel: nivelReferencia, modoPreview: "multipliers", mult: preset.multiplicadores });
  }

  async function simular() {
    setSimulando(true);
    setErroSimulacao("");
    setSimulacao(null);
    try {
      const resultado = await simularBalanceamentoMonstroAdmin(monstro.id, {
        referenceLevel: nivelReferencia,
        multiplicadores: multiplicadoresAvancado,
        profile: "MEDIO",
        iterations: 1000,
      });
      setSimulacao(resultado);
    } catch (erro) {
      setErroSimulacao(mensagemDeErroAdmin(erro, "Não foi possível simular os combates."));
    } finally {
      setSimulando(false);
    }
  }

  function salvar() {
    onSalvar(multiplicadoresAvancado, {
      referenceLevel: nivelReferencia,
      mode: modo === "simples" ? "desired" : "multipliers",
      desired: modo === "simples" ? desired : undefined,
    });
  }

  return (
    <div className="flex max-h-[85vh] w-full max-w-2xl flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
      <div className="flex items-center justify-between">
        <p className="font-imFeel text-xl text-[#F3B43F]">Balanceamento — {monstro.nome}</p>
        {dirty && <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-red-300">valor não salvo</span>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg bg-black/30 p-1">
          <button type="button" onClick={() => setModo("simples")} className={`rounded-md px-3 py-1 text-xs font-bold ${modo === "simples" ? "bg-[#BC8418] text-black" : "text-white/60"}`}>
            Modo Simples
          </button>
          <button type="button" onClick={() => setModo("avancado")} className={`rounded-md px-3 py-1 text-xs font-bold ${modo === "avancado" ? "bg-[#BC8418] text-black" : "text-white/60"}`}>
            Modo Avançado
          </button>
        </div>

        <label className="flex items-center gap-1 text-xs text-white/60">
          Nível de referência
          <input
            type="number"
            min={1}
            value={nivelReferencia}
            onChange={(e) => mudarNivel(Math.max(1, Number(e.target.value) || 1))}
            className="w-16 rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-white"
          />
        </label>

        <select
          value={presetSelecionado}
          onChange={(e) => aplicarPreset(e.target.value)}
          className="rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-xs text-white"
        >
          <option value="PERSONALIZADO">Preset...</option>
          {presets.map((p) => (
            <option key={p.chave} value={p.chave}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {modo === "simples" ? (
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
          <label className="flex flex-col gap-1 text-xs">
            Vida média (HP)
            <input type="number" value={desired?.hpMean ?? ""} onChange={(e) => mudarDesired("hpMean", Number(e.target.value))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Dano médio
            <input type="number" value={desired?.damageMean ?? ""} onChange={(e) => mudarDesired("damageMean", Number(e.target.value))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Esquiva vs perfil médio (%)
            <input type="number" value={desired?.dodgeVsAveragePct ?? ""} onChange={(e) => mudarDesired("dodgeVsAveragePct", Number(e.target.value))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Velocidade final
            <input type="number" value={desired?.speedMean ?? ""} onChange={(e) => mudarDesired("speedMean", Number(e.target.value))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
          </label>
        </div>
      ) : (
        <details open className="rounded-xl border border-white/10 bg-black/20 p-3">
          <summary className="cursor-pointer text-xs font-bold text-white/70">
            Multiplicadores (fatores relativos à base do nível — 1.00 = média exata do nível)
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["vida", "dano", "agilidade", "velocidade"] as const).map((campo) => (
              <label key={campo} className="flex flex-col gap-1 text-xs capitalize">
                {campo}
                <input
                  type="number"
                  step="0.01"
                  value={multiplicadoresAvancado[campo]}
                  onChange={(e) => mudarMultiplicador(campo, Number(e.target.value))}
                  className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                />
              </label>
            ))}
          </div>
        </details>
      )}

      {erroPreview && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erroPreview}</p>}

      {preview && (
        <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
          <p className="font-bold text-[#F3B43F]">Preview em nível {preview.nivelReferencia} {carregandoPreview && <span className="text-white/40">(recalculando...)</span>}</p>
          <table className="w-full text-left">
            <thead className="text-white/50">
              <tr>
                <th className="pr-2">Stat</th>
                <th className="pr-2">Mín.</th>
                <th className="pr-2">Média</th>
                <th>Máx.</th>
              </tr>
            </thead>
            <tbody>
              {(["vida", "dano", "agilidade", "velocidade"] as const).map((campo) => (
                <tr key={campo}>
                  <td className="pr-2 capitalize text-white/70">{campo}</td>
                  <td className="pr-2">{fmt(preview.statsFinais[campo].min)}</td>
                  <td className="pr-2 font-bold text-white">{fmt(preview.statsFinais[campo].media)}</td>
                  <td>{fmt(preview.statsFinais[campo].max)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mt-1 text-white/70">
            Esquiva vs perfis —{" "}
            {(perfis.length > 0 ? perfis : [{ chave: "FRACO", label: "Fraco" }, { chave: "MEDIO", label: "Médio" }, { chave: "FORTE", label: "Forte" }])
              .map((perfil) => `${perfil.label}: ${fmt(preview.esquivaContraPerfis[perfil.chave], 1)}%`)
              .join(" · ")}
          </p>
          <p className="text-white/70">
            TTK jogador médio: mata em ~<b>{preview.ttk.turnosParaMatar}</b> turno(s) · morre em ~<b>{preview.ttk.turnosParaMorrer}</b> turno(s)
          </p>
          <p>
            Dificuldade estimada: <span className={`font-bold ${corDificuldade(preview.dificuldadeEstimada.chave)}`}>{preview.dificuldadeEstimada.label}</span>{" "}
            <span className="text-white/40">({preview.dificuldadeEstimada.origem === "heuristica" ? "estimativa, sem simulação" : "de simulação"})</span>
          </p>

          {preview.faixaPorNivel && (
            <div className="mt-1">
              <p className="font-bold text-white/70">Faixa de nível vinculada</p>
              <table className="w-full text-left">
                <thead className="text-white/50">
                  <tr>
                    <th className="pr-2">Nível</th>
                    <th className="pr-2">Vida</th>
                    <th className="pr-2">Dano</th>
                    <th className="pr-2">Esquiva</th>
                    <th>Velocidade</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.faixaPorNivel.map((linha) => (
                    <tr key={linha.nivel}>
                      <td className="pr-2">{linha.nivel}</td>
                      <td className="pr-2">{fmt(linha.vidaMedia)}</td>
                      <td className="pr-2">{fmt(linha.danoMedio)}</td>
                      <td className="pr-2">{fmt(linha.esquivaVsMedio, 1)}%</td>
                      <td>{fmt(linha.velocidadeMedia)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {preview.avisos.length > 0 && (
            <ul className="mt-1 list-inside list-disc text-amber-300/80">
              {preview.avisos.map((aviso) => (
                <li key={aviso}>{aviso}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-white/70">Simulação estatística (isolada — não afeta jogadores/economia)</p>
          <button type="button" onClick={simular} disabled={simulando} className="rounded-lg bg-[#BC8418] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
            {simulando ? "Simulando..." : "Simular 1.000 combates"}
          </button>
        </div>
        {erroSimulacao && <p className="text-xs text-red-400">{erroSimulacao}</p>}
        {simulacao && (
          <div className="grid grid-cols-2 gap-2 text-xs text-white/80">
            <p>
              Vitórias do jogador: <b>{simulacao.vitoriasJogador}</b> / {simulacao.totalCombates} ({fmt(simulacao.taxaVitoriaJogadorPct, 1)}%)
            </p>
            <p>
              Vitórias do monstro: <b>{simulacao.vitoriasMonstro}</b> / {simulacao.totalCombates}
            </p>
            <p>Turnos médios: {fmt(simulacao.turnosMedios, 1)}</p>
            <p>Vida restante média do vencedor: {fmt(simulacao.vidaRestanteMediaVencedor)}</p>
            <p>Dano total médio do monstro: {fmt(simulacao.danoTotalMonstroMedio, 1)}</p>
            <p>Esquiva observada: {fmt(simulacao.esquivaObservadaPct, 1)}%</p>
            <p className="col-span-2">
              Dificuldade (simulada): <span className={`font-bold ${corDificuldade(simulacao.dificuldade.chave)}`}>{simulacao.dificuldade.label}</span>
            </p>
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-end gap-2">
        <button type="button" onClick={onCancelar} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">
          Cancelar
        </button>
        <button type="button" onClick={salvar} disabled={salvando} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
          {salvando ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}
