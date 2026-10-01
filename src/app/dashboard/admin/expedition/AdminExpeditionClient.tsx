"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  atualizarExpeditionBalanceAdmin,
  mensagemDeErroAdmin,
  obterExpeditionBalanceAdmin,
  type ExpeditionBalanceCompletoApi,
} from "@/lib/api/admin";
import { SimuladorBalanceamento } from "@/components/admin/SimuladorBalanceamento";

type Aba = "expedicao" | "aventura" | "grupo" | "simulador";

const CARD = "rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-5";
const BTN = "rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50";
const INPUT = "rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm text-white";
const QUALIDADES = ["Comum", "Incomum", "Raro", "Epico", "Lendario", "Mitico"] as const;

export default function AdminExpeditionClient() {
  const [aba, setAba] = useState<Aba>("expedicao");
  const [dados, setDados] = useState<ExpeditionBalanceCompletoApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setDados(await obterExpeditionBalanceAdmin());
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar o balanceamento."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const abas: [Aba, string][] = [
    ["expedicao", "Expedição"],
    ["aventura", "Aventura"],
    ["grupo", "Aventura em Grupo"],
    ["simulador", "Simulador"],
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">PVE</h1>
        <p className="mt-1 text-sm text-white/60">
          Tudo que envolve monstro numa tela só: ajuste de Expedição (tempo/drops/progressão/emboscada), perigo de
          Aventura e escala de Aventura em Grupo — e o Simulador pra testar o resultado desses ajustes em N combates
          reais antes de assumir que funcionou.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {abas.map(([id, rotulo]) => (
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

      {aba === "simulador" ? (
        <SimuladorBalanceamento />
      ) : carregando ? (
        <p className="text-sm text-white/60">Carregando...</p>
      ) : !dados ? (
        <p className="text-sm text-red-400">{erro}</p>
      ) : (
        <>
          {aba === "expedicao" && <AbaExpedicao dados={dados} onSalvo={carregar} />}
          {aba === "aventura" && <AbaAventura dados={dados} onSalvo={carregar} />}
          {aba === "grupo" && <AbaGrupo dados={dados} onSalvo={carregar} />}
        </>
      )}
    </div>
  );
}

function CardMensagem({ erro, mensagem }: { erro: string; mensagem: string }) {
  return (
    <>
      {erro && <p className="mb-2 rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      {mensagem && <p className="mb-2 rounded-lg bg-black/50 px-3 py-2 text-sm text-[#F3B43F]">{mensagem}</p>}
    </>
  );
}

// ---------------------------------------------------------------------
// Expedição — cooldown / progressão / drops / emboscada
// ---------------------------------------------------------------------
function AbaExpedicao({ dados, onSalvo }: { dados: ExpeditionBalanceCompletoApi; onSalvo: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <CardCooldown atual={dados["expedition.cooldown"].atual} onSalvo={onSalvo} />
      <CardProgressao atual={dados["expedition.progression"].atual} onSalvo={onSalvo} />
      <CardDrops atual={dados["expedition.drops"].atual} onSalvo={onSalvo} />
      <CardEmboscada atual={dados["expedition.ambush"].atual} onSalvo={onSalvo} />
    </div>
  );
}

function CardCooldown({ atual, onSalvo }: { atual: { TEMPO_COLETA_MS: number }; onSalvo: () => void }) {
  const [valor, setValor] = useState(atual.TEMPO_COLETA_MS);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function salvar() {
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      await atualizarExpeditionBalanceAdmin("expedition.cooldown", { TEMPO_COLETA_MS: valor });
      setMensagem("Tempo de coleta salvo.");
      onSalvo();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={CARD}>
      <p className="mb-1 font-imFeel text-xl text-[#F3B43F]">Tempo de coleta (cooldown)</p>
      <p className="mb-3 text-xs text-white/50">
        Tempo mínimo entre duas coletas — global entre Mineração/Silvicultura/Exploração (coletar em uma bloqueia as
        outras duas pelo mesmo tempo).
      </p>
      <CardMensagem erro={erro} mensagem={mensagem} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-white/70">
          Tempo (ms)
          <input type="number" min={1} className={`${INPUT} w-32`} value={valor} onChange={(e) => setValor(Number(e.target.value))} />
        </label>
        <p className="pb-2 text-xs text-white/50">≈ {(valor / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}s</p>
        <button type="button" disabled={salvando} onClick={salvar} className={BTN}>
          {salvando ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}

function CardProgressao({
  atual,
  onSalvo,
}: {
  atual: { XP_NECESSARIO_POR_ETAPA: Record<string, number>; XP_POR_RESULTADO: Record<string, number> };
  onSalvo: () => void;
}) {
  const [etapas, setEtapas] = useState(atual.XP_NECESSARIO_POR_ETAPA);
  const [resultados, setResultados] = useState(atual.XP_POR_RESULTADO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function salvar() {
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      await atualizarExpeditionBalanceAdmin("expedition.progression", {
        XP_NECESSARIO_POR_ETAPA: etapas,
        XP_POR_RESULTADO: resultados,
      });
      setMensagem("Progressão salva.");
      onSalvo();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={CARD}>
      <p className="mb-1 font-imFeel text-xl text-[#F3B43F]">Progressão</p>
      <p className="mb-3 text-xs text-white/50">
        Custo de XP pra avançar de cada nível (1→2, 2→3...) e XP base ganho por resultado da coleta.
      </p>
      <CardMensagem erro={erro} mensagem={mensagem} />

      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-white/60">Custo por etapa</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(etapas).map(([etapa, xp]) => (
          <label key={etapa} className="flex flex-col gap-1 text-xs text-white/70">
            Nv.{etapa}→{Number(etapa) + 1}
            <input
              type="number"
              min={1}
              className={`${INPUT} w-24`}
              value={xp}
              onChange={(e) => setEtapas((t) => ({ ...t, [etapa]: Number(e.target.value) }))}
            />
          </label>
        ))}
      </div>

      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-white/60">XP por resultado da coleta</p>
      <div className="mb-3 flex flex-wrap gap-2">
        {Object.entries(resultados).map(([resultado, xp]) => (
          <label key={resultado} className="flex flex-col gap-1 text-xs text-white/70">
            {resultado}
            <input
              type="number"
              min={0}
              className={`${INPUT} w-24`}
              value={xp}
              onChange={(e) => setResultados((t) => ({ ...t, [resultado]: Number(e.target.value) }))}
            />
          </label>
        ))}
      </div>

      <button type="button" disabled={salvando} onClick={salvar} className={BTN}>
        {salvando ? "Salvando..." : "Salvar progressão"}
      </button>
    </div>
  );
}

function CardDrops({
  atual,
  onSalvo,
}: {
  atual: { CHANCE_POR_NIVEL_PPM: Record<string, Record<string, number>>; QUANTIDADE_POR_NIVEL: Record<string, [number, number]> };
  onSalvo: () => void;
}) {
  const [chances, setChances] = useState(atual.CHANCE_POR_NIVEL_PPM);
  const [quantidades, setQuantidades] = useState(atual.QUANTIDADE_POR_NIVEL);
  const [salvando, setSalvando] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function salvarNivel(nivel: string) {
    setSalvando(nivel);
    setErro("");
    setMensagem("");
    try {
      await atualizarExpeditionBalanceAdmin("expedition.drops", {
        CHANCE_POR_NIVEL_PPM: { [nivel]: chances[nivel] },
        QUANTIDADE_POR_NIVEL: { [nivel]: quantidades[nivel] },
      });
      setMensagem(`Nível ${nivel} salvo.`);
      onSalvo();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Falha ao salvar — confira se a soma não passa de 1.000.000 PPM."));
    } finally {
      setSalvando(null);
    }
  }

  return (
    <div className={CARD}>
      <p className="mb-1 font-imFeel text-xl text-[#F3B43F]">Drops por nível</p>
      <p className="mb-3 text-xs text-white/50">
        Chance (em partes por milhão, de 0 a 1.000.000) de cada qualidade por nível de profissão — o que sobrar até
        1.000.000 é a chance de &quot;nada encontrado&quot;. Quantidade é a faixa [mín, máx] sorteada antes do teto
        por qualidade (Mítico sempre 1, Lendário no máx. 2...).
      </p>
      <CardMensagem erro={erro} mensagem={mensagem} />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-white">
          <thead>
            <tr className="text-white/50">
              <th className="px-2 py-1">Nv.</th>
              {QUALIDADES.map((q) => (
                <th key={q} className="px-2 py-1">
                  {q}
                </th>
              ))}
              <th className="px-2 py-1">Soma</th>
              <th className="px-2 py-1">Qtd. mín</th>
              <th className="px-2 py-1">Qtd. máx</th>
              <th className="px-2 py-1"></th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(chances).map(([nivel, tabela]) => {
              const soma = QUALIDADES.reduce((s, q) => s + (tabela[q] ?? 0), 0);
              const [minimo, maximo] = quantidades[nivel] ?? [1, 1];
              return (
                <tr key={nivel} className={`border-b border-white/5 ${soma > 1_000_000 ? "bg-red-900/20" : ""}`}>
                  <td className="px-2 py-1 font-bold">{nivel}</td>
                  {QUALIDADES.map((q) => (
                    <td key={q} className="px-2 py-1">
                      <input
                        type="number"
                        min={0}
                        className="w-20 rounded border border-white/20 bg-black/30 px-1 py-0.5 text-xs text-white"
                        value={tabela[q] ?? 0}
                        onChange={(e) =>
                          setChances((atual2) => ({ ...atual2, [nivel]: { ...atual2[nivel], [q]: Number(e.target.value) } }))
                        }
                      />
                    </td>
                  ))}
                  <td className={`px-2 py-1 font-bold ${soma > 1_000_000 ? "text-red-400" : "text-green-300"}`}>
                    {soma.toLocaleString("pt-BR")}
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min={1}
                      className="w-16 rounded border border-white/20 bg-black/30 px-1 py-0.5 text-xs text-white"
                      value={minimo}
                      onChange={(e) => setQuantidades((atual2) => ({ ...atual2, [nivel]: [Number(e.target.value), maximo] }))}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min={minimo}
                      className="w-16 rounded border border-white/20 bg-black/30 px-1 py-0.5 text-xs text-white"
                      value={maximo}
                      onChange={(e) => setQuantidades((atual2) => ({ ...atual2, [nivel]: [minimo, Number(e.target.value)] }))}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <button
                      type="button"
                      disabled={salvando === nivel || soma > 1_000_000}
                      onClick={() => salvarNivel(nivel)}
                      className="text-[#F3B43F] hover:underline disabled:opacity-40"
                    >
                      {salvando === nivel ? "Salvando..." : "Salvar"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CardEmboscada({ atual, onSalvo }: { atual: { CHANCE_MONSTRO_PPM: number }; onSalvo: () => void }) {
  const [valor, setValor] = useState(atual.CHANCE_MONSTRO_PPM);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function salvar() {
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      await atualizarExpeditionBalanceAdmin("expedition.ambush", { CHANCE_MONSTRO_PPM: valor });
      setMensagem("Chance de emboscada salva.");
      onSalvo();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={CARD}>
      <p className="mb-1 font-imFeel text-xl text-[#F3B43F]">Emboscada</p>
      <p className="mb-3 text-xs text-white/50">
        Chance de uma coleta virar um combate contra monstro em vez do sorteio normal de recurso — independe da
        profissão/região, só do azar do sorteio.
      </p>
      <CardMensagem erro={erro} mensagem={mensagem} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-white/70">
          Chance (PPM, de 0 a 1.000.000)
          <input type="number" min={0} max={1_000_000} className={`${INPUT} w-32`} value={valor} onChange={(e) => setValor(Number(e.target.value))} />
        </label>
        <p className="pb-2 text-xs text-white/50">≈ {(valor / 10_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%</p>
        <button type="button" disabled={salvando} onClick={salvar} className={BTN}>
          {salvando ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Aventura — perigo
// ---------------------------------------------------------------------
function AbaAventura({ dados, onSalvo }: { dados: ExpeditionBalanceCompletoApi; onSalvo: () => void }) {
  const atual = dados["adventure.danger"].atual;
  const [medio, setMedio] = useState(atual.MEDIO);
  const [alto, setAlto] = useState(atual.ALTO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function salvar() {
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      await atualizarExpeditionBalanceAdmin("adventure.danger", { MEDIO: medio, ALTO: alto });
      setMensagem("Limiares de perigo salvos.");
      onSalvo();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={CARD}>
      <p className="mb-1 font-imFeel text-xl text-[#F3B43F]">Perigo</p>
      <p className="mb-3 text-xs text-white/50">
        Quantos níveis abaixo do mínimo da zona já contam como perigo Médio/Alto (acima de Alto vira Extremo) — só
        informativo, nunca bloqueia entrada na zona.
      </p>
      <CardMensagem erro={erro} mensagem={mensagem} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-white/70">
          Médio (até N níveis abaixo)
          <input type="number" min={0} className={`${INPUT} w-24`} value={medio} onChange={(e) => setMedio(Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/70">
          Alto (até N níveis abaixo)
          <input type="number" min={0} className={`${INPUT} w-24`} value={alto} onChange={(e) => setAlto(Number(e.target.value))} />
        </label>
        <button type="button" disabled={salvando} onClick={salvar} className={BTN}>
          {salvando ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Aventura em Grupo — limites/tempos/escala
// ---------------------------------------------------------------------
function AbaGrupo({ dados, onSalvo }: { dados: ExpeditionBalanceCompletoApi; onSalvo: () => void }) {
  const atual = dados["party.balance"].atual;
  const [form, setForm] = useState(atual);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  function campo<K extends keyof typeof form>(chave: K, valor: number) {
    setForm((f) => ({ ...f, [chave]: valor }));
  }

  async function salvar() {
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      await atualizarExpeditionBalanceAdmin("party.balance", form);
      setMensagem("Aventura em Grupo salva.");
      onSalvo();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={CARD}>
      <p className="mb-1 font-imFeel text-xl text-[#F3B43F]">Aventura em Grupo</p>
      <p className="mb-3 text-xs text-white/50">
        Limites de grupo, prazos de convite/turno e a escala de dificuldade do monstro por aventureiro extra além do
        mínimo — a Aventura em Grupo reaproveita as MESMAS zonas/monstros da Aventura solo, só escalados por isso.
      </p>
      <CardMensagem erro={erro} mensagem={mensagem} />
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-xs text-white/70">
          Tamanho mínimo do grupo
          <input type="number" min={2} className={`${INPUT} w-28`} value={form.TAMANHO_MINIMO_GRUPO} onChange={(e) => campo("TAMANHO_MINIMO_GRUPO", Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/70">
          Tamanho máximo do grupo
          <input type="number" min={form.TAMANHO_MINIMO_GRUPO} className={`${INPUT} w-28`} value={form.TAMANHO_MAXIMO_GRUPO} onChange={(e) => campo("TAMANHO_MAXIMO_GRUPO", Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/70">
          Prazo de convite (ms)
          <input type="number" min={1} className={`${INPUT} w-32`} value={form.PRAZO_CONVITE_MS} onChange={(e) => campo("PRAZO_CONVITE_MS", Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/70">
          Prazo de turno (ms)
          <input type="number" min={1} className={`${INPUT} w-32`} value={form.PRAZO_TURNO_MS} onChange={(e) => campo("PRAZO_TURNO_MS", Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/70">
          Máx. de rodadas
          <input type="number" min={1} className={`${INPUT} w-28`} value={form.MAX_RODADAS} onChange={(e) => campo("MAX_RODADAS", Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/70">
          +Vida por aventureiro extra (fração, ex.: 0.12 = +12%)
          <input type="number" min={0} step={0.01} className={`${INPUT} w-40`} value={form.FATOR_DIFICULDADE_VIDA_POR_EXTRA} onChange={(e) => campo("FATOR_DIFICULDADE_VIDA_POR_EXTRA", Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/70">
          +Dano por aventureiro extra (fração, ex.: 0.08 = +8%)
          <input type="number" min={0} step={0.01} className={`${INPUT} w-40`} value={form.FATOR_DIFICULDADE_DANO_POR_EXTRA} onChange={(e) => campo("FATOR_DIFICULDADE_DANO_POR_EXTRA", Number(e.target.value))} />
        </label>
      </div>

      <p className="mb-1 mt-4 font-imFeel text-lg text-[#F3B43F]">Penalidade anti power-leveling</p>
      <p className="mb-3 text-xs text-white/50">
        Quando o personagem de MAIOR nível do grupo está muito acima do teto de nível da zona (ex.: nível 100 numa
        área desenhada pra nível 5), a recompensa de XP e ouro cai pro GRUPO INTEIRO — desincentiva carregar um
        personagem fraco numa área fácil demais pra farmar nível rápido. Não afeta grupos de nível parecido.
      </p>
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-xs text-white/70">
          Tolerância acima do teto da zona (níveis)
          <input
            type="number"
            min={0}
            className={`${INPUT} w-40`}
            value={form.LIMIAR_NIVEL_ACIMA_DA_ZONA}
            onChange={(e) => campo("LIMIAR_NIVEL_ACIMA_DA_ZONA", Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/70">
          Redução por nível excedente (fração, ex.: 0.05 = -5%)
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            className={`${INPUT} w-48`}
            value={form.REDUCAO_RECOMPENSA_POR_NIVEL_EXCEDENTE}
            onChange={(e) => campo("REDUCAO_RECOMPENSA_POR_NIVEL_EXCEDENTE", Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/70">
          Piso da recompensa (fração, ex.: 0.2 = nunca abaixo de 20%)
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            className={`${INPUT} w-48`}
            value={form.PISO_MULTIPLICADOR_RECOMPENSA}
            onChange={(e) => campo("PISO_MULTIPLICADOR_RECOMPENSA", Number(e.target.value))}
          />
        </label>
      </div>
      <button type="button" disabled={salvando} onClick={salvar} className={`${BTN} mt-3`}>
        {salvando ? "Salvando..." : "Salvar"}
      </button>
    </div>
  );
}
