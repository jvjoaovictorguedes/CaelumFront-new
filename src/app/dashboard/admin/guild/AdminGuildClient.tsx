"use client";
import TypingEditor from "@/components/combat-typing/TypingEditor";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  atualizarGuildBalanceAdmin,
  atualizarGuildBossAdmin,
  criarGuildBossAdmin,
  listarGuildBossesAdmin,
  listarGuildLevelsAdmin,
  mensagemDeErroAdmin,
  obterGuildBalanceAdmin,
  salvarGuildLevelAdmin,
  type GuildBalanceCompletoApi,
  type GuildBossConfigAdminApi,
  type GuildLevelConfigApi,
  type PayloadGuildBossConfigAdmin,
} from "@/lib/api/admin";

type Aba = "balanceamento" | "niveis" | "boss";

const CARD = "rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-5";
const BTN = "rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50";
const INPUT = "rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm text-white";
const RANKS_GUILDA = ["F", "E", "D", "C", "B", "A", "S"] as const;
const RANKS_PROMOVEM = ["F", "E", "D", "C", "B", "A"] as const;
const BUFF_TIPOS = ["XP", "GOLD", "FORJA"] as const;
const NIVEIS_BUFF = ["1", "2", "3", "4", "5"];

export default function AdminGuildClient() {
  const [aba, setAba] = useState<Aba>("balanceamento");

  const abas: [Aba, string][] = [
    ["balanceamento", "Balanceamento"],
    ["niveis", "Níveis"],
    ["boss", "Boss por Rank"],
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link prefetch={false} href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Guilda</h1>
        <p className="mt-1 text-sm text-white/60">
          Requisitos de promoção de Rank, carência anti-exploit, Buffs (XP/Gold/Forja), pontuação de Contribuição, o
          Boss ao vivo (frações de recompensa + tamanho/turno/escalada de dano) e a capacidade do Armazém do Tesouro,
          além dos catálogos de Nível e Boss por Rank. Missões de Guilda ficam em{" "}
          <Link prefetch={false} href="/dashboard/admin/missions" className="text-[#F3B43F] hover:underline">
            Conteúdo → Missões
          </Link>{" "}
          (aba &quot;Missões de Guilda&quot;), e Permissões por cargo (quem pode convidar/expulsar/etc.) são
          configuradas pelos próprios oficiais dentro de cada guilda, não aqui.
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

      {aba === "balanceamento" && <AbaBalanceamento />}
      {aba === "niveis" && <AbaNiveis />}
      {aba === "boss" && <AbaBoss />}
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
// Balanceamento — Ranks / Carência / Buffs / Contribuição / Boss
// ---------------------------------------------------------------------
function AbaBalanceamento() {
  const [dados, setDados] = useState<GuildBalanceCompletoApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setDados(await obterGuildBalanceAdmin());
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar o balanceamento."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (carregando) return <p className="text-sm text-white/60">Carregando...</p>;
  if (!dados) return <p className="text-sm text-red-400">{erro}</p>;

  return (
    <div className="flex flex-col gap-4">
      <CardRanks atual={dados["guild.ranks"].atual} onSalvo={carregar} />
      <CardCarencia atual={dados["guild.carencia"].atual} onSalvo={carregar} />
      <CardBuffs atual={dados["guild.buffs"].atual} onSalvo={carregar} />
      <CardContribuicao atual={dados["guild.contribuicao"].atual} onSalvo={carregar} />
      <CardBossBalance atual={dados["guild.boss"].atual} onSalvo={carregar} />
      <CardTesouro atual={dados["guild.tesouro"].atual} onSalvo={carregar} />
    </div>
  );
}

function CardRanks({ atual, onSalvo }: { atual: Record<string, number>; onSalvo: () => void }) {
  const [form, setForm] = useState(atual);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function salvar() {
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      await atualizarGuildBalanceAdmin("guild.ranks", form);
      setMensagem("Requisitos de Rank salvos.");
      onSalvo();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={CARD}>
      <p className="mb-1 font-imFeel text-xl text-[#F3B43F]">Requisitos de promoção de Rank</p>
      <p className="mb-3 text-xs text-white/50">
        Missões de Rank concluídas necessárias pra promover de cada rank pro próximo (F→E→D→C→B→A→S). Rank S é o topo
        e nunca promove.
      </p>
      <CardMensagem erro={erro} mensagem={mensagem} />
      <div className="flex flex-wrap gap-3">
        {RANKS_PROMOVEM.map((rank) => (
          <label key={rank} className="flex flex-col gap-1 text-xs text-white/70">
            Rank {rank}
            <input
              type="number"
              min={1}
              className={`${INPUT} w-24`}
              value={form[rank] ?? 0}
              onChange={(e) => setForm((f) => ({ ...f, [rank]: Number(e.target.value) }))}
            />
          </label>
        ))}
      </div>
      <button type="button" disabled={salvando} onClick={salvar} className={`${BTN} mt-3`}>
        {salvando ? "Salvando..." : "Salvar"}
      </button>
    </div>
  );
}

function CardCarencia({ atual, onSalvo }: { atual: { CARENCIA_NOVO_MEMBRO_MS: number }; onSalvo: () => void }) {
  const [valor, setValor] = useState(atual.CARENCIA_NOVO_MEMBRO_MS);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function salvar() {
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      await atualizarGuildBalanceAdmin("guild.carencia", { CARENCIA_NOVO_MEMBRO_MS: valor });
      setMensagem("Carência salva.");
      onSalvo();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={CARD}>
      <p className="mb-1 font-imFeel text-xl text-[#F3B43F]">Carência de membro novo</p>
      <p className="mb-3 text-xs text-white/50">
        Tempo (anti-exploit) que um membro recém-entrado fica sem gerar XP de Missão, contar pra progresso de Rank ou
        receber recompensa do Boss/Buffs. O Fundador nunca entra em carência.
      </p>
      <CardMensagem erro={erro} mensagem={mensagem} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-white/70">
          Carência (ms)
          <input type="number" min={0} className={`${INPUT} w-36`} value={valor} onChange={(e) => setValor(Number(e.target.value))} />
        </label>
        <p className="pb-2 text-xs text-white/50">≈ {(valor / 3_600_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}h</p>
        <button type="button" disabled={salvando} onClick={salvar} className={BTN}>
          {salvando ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}

function CardBuffs({
  atual,
  onSalvo,
}: {
  atual: GuildBalanceCompletoApi["guild.buffs"]["atual"];
  onSalvo: () => void;
}) {
  const [form, setForm] = useState(atual);
  const [salvando, setSalvando] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function salvarTipo(tipo: (typeof BUFF_TIPOS)[number]) {
    setSalvando(tipo);
    setErro("");
    setMensagem("");
    try {
      await atualizarGuildBalanceAdmin("guild.buffs", { [tipo]: form[tipo] });
      setMensagem(`Buff de ${tipo} salvo.`);
      onSalvo();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar."));
    } finally {
      setSalvando(null);
    }
  }

  function campo(tipo: (typeof BUFF_TIPOS)[number], nivel: string, chave: "custo" | "nivelGuildaMinimo" | "bonus", valor: number) {
    setForm((f) => {
      const tabelaNivel = { ...f[tipo][nivel] };
      if (chave === "bonus") {
        if (tipo === "FORJA") tabelaNivel.bonusPontosPercentuais = valor;
        else tabelaNivel.bonusPercentual = valor;
      } else {
        tabelaNivel[chave] = valor;
      }
      return { ...f, [tipo]: { ...f[tipo], [nivel]: tabelaNivel } };
    });
  }

  return (
    <div className={CARD}>
      <p className="mb-1 font-imFeel text-xl text-[#F3B43F]">Buffs de Guilda</p>
      <p className="mb-3 text-xs text-white/50">
        3 tipos (XP/Gold/Forja), níveis 1-5 — bônus TOTAL por nível (não cumulativo), custo pago pelo Tesouro e Nível
        de Guilda mínimo pra desbloquear. Forja é em pontos percentuais (transfere resultado &quot;mesma
        qualidade&quot; pra &quot;+1 qualidade&quot;).
      </p>
      <CardMensagem erro={erro} mensagem={mensagem} />
      {BUFF_TIPOS.map((tipo) => (
        <div key={tipo} className="mb-4 last:mb-0">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-white/60">{tipo}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white">
              <thead>
                <tr className="text-white/50">
                  <th className="px-2 py-1">Nv.</th>
                  <th className="px-2 py-1">{tipo === "FORJA" ? "Bônus (p.p.)" : "Bônus (%)"}</th>
                  <th className="px-2 py-1">Custo (Gold)</th>
                  <th className="px-2 py-1">Nível Guilda mín.</th>
                </tr>
              </thead>
              <tbody>
                {NIVEIS_BUFF.map((nivel) => {
                  const tabela = form[tipo][nivel];
                  if (!tabela) return null;
                  const bonus = tipo === "FORJA" ? tabela.bonusPontosPercentuais ?? 0 : tabela.bonusPercentual ?? 0;
                  return (
                    <tr key={nivel} className="border-b border-white/5">
                      <td className="px-2 py-1 font-bold">{nivel}</td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          min={0}
                          step={0.1}
                          className="w-20 rounded border border-white/20 bg-black/30 px-1 py-0.5 text-xs text-white"
                          value={bonus}
                          onChange={(e) => campo(tipo, nivel, "bonus", Number(e.target.value))}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          min={1}
                          className="w-28 rounded border border-white/20 bg-black/30 px-1 py-0.5 text-xs text-white"
                          value={tabela.custo}
                          onChange={(e) => campo(tipo, nivel, "custo", Number(e.target.value))}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          min={1}
                          className="w-20 rounded border border-white/20 bg-black/30 px-1 py-0.5 text-xs text-white"
                          value={tabela.nivelGuildaMinimo}
                          onChange={(e) => campo(tipo, nivel, "nivelGuildaMinimo", Number(e.target.value))}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button type="button" disabled={salvando === tipo} onClick={() => salvarTipo(tipo)} className={`${BTN} mt-2`}>
            {salvando === tipo ? "Salvando..." : `Salvar ${tipo}`}
          </button>
        </div>
      ))}
    </div>
  );
}

function CardContribuicao({
  atual,
  onSalvo,
}: {
  atual: GuildBalanceCompletoApi["guild.contribuicao"]["atual"];
  onSalvo: () => void;
}) {
  const [pontos, setPontos] = useState(atual.PONTOS_CONTRIBUICAO);
  const [xpMin, setXpMin] = useState(atual.XP_GUILDA_MISSAO_RANK_MIN);
  const [xpMax, setXpMax] = useState(atual.XP_GUILDA_MISSAO_RANK_MAX);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function salvar() {
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      await atualizarGuildBalanceAdmin("guild.contribuicao", {
        PONTOS_CONTRIBUICAO: pontos,
        XP_GUILDA_MISSAO_RANK_MIN: xpMin,
        XP_GUILDA_MISSAO_RANK_MAX: xpMax,
      });
      setMensagem("Contribuição salva.");
      onSalvo();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={CARD}>
      <p className="mb-1 font-imFeel text-xl text-[#F3B43F]">Contribuição e XP de Missão de Rank</p>
      <p className="mb-3 text-xs text-white/50">
        Pontuação de Contribuição por fonte (Missões, Boss, Doação) e a faixa de XP de Guilda ganho ao completar uma
        Missão de Rank (interpolado pela posição do rank F..S).
      </p>
      <CardMensagem erro={erro} mensagem={mensagem} />
      <div className="mb-3 flex flex-wrap gap-3">
        {Object.entries(pontos).map(([chave, valor]) => (
          <label key={chave} className="flex flex-col gap-1 text-xs text-white/70">
            {chave}
            <input
              type="number"
              min={0}
              step={chave === "DoacaoPorOuro" ? 0.0001 : 1}
              className={`${INPUT} w-28`}
              value={valor}
              onChange={(e) => setPontos((p) => ({ ...p, [chave]: Number(e.target.value) }))}
            />
          </label>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-xs text-white/70">
          XP Missão Rank — mínimo (rank F)
          <input type="number" min={1} className={`${INPUT} w-32`} value={xpMin} onChange={(e) => setXpMin(Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/70">
          XP Missão Rank — máximo (rank S)
          <input type="number" min={xpMin} className={`${INPUT} w-32`} value={xpMax} onChange={(e) => setXpMax(Number(e.target.value))} />
        </label>
      </div>
      <button type="button" disabled={salvando} onClick={salvar} className={`${BTN} mt-3`}>
        {salvando ? "Salvando..." : "Salvar"}
      </button>
    </div>
  );
}

function CardTesouro({
  atual,
  onSalvo,
}: {
  atual: GuildBalanceCompletoApi["guild.tesouro"]["atual"];
  onSalvo: () => void;
}) {
  const [marcos, setMarcos] = useState(atual.CAPACIDADE_TESOURO_POR_NIVEL);
  const [novoNivel, setNovoNivel] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const niveisOrdenados = Object.keys(marcos)
    .map(Number)
    .sort((a, b) => a - b);

  function removerMarco(nivel: number) {
    setMarcos((m) => {
      const copia = { ...m };
      delete copia[nivel];
      return copia;
    });
  }

  function adicionarMarco() {
    const nivel = Number(novoNivel);
    if (!Number.isInteger(nivel) || nivel < 1 || marcos[nivel] !== undefined) return;
    setMarcos((m) => ({ ...m, [nivel]: 30 }));
    setNovoNivel("");
  }

  async function salvar() {
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      await atualizarGuildBalanceAdmin("guild.tesouro", { CAPACIDADE_TESOURO_POR_NIVEL: marcos });
      setMensagem("Capacidade do Tesouro salva.");
      onSalvo();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={CARD}>
      <p className="mb-1 font-imFeel text-xl text-[#F3B43F]">Capacidade do Armazém (Tesouro)</p>
      <p className="mb-3 text-xs text-white/50">
        Quantidade de slots do Armazém de itens/equipamentos por marco de nível da guilda — vale o maior marco com
        nível ≤ nível atual. A capacidade deve crescer (ou manter) conforme o nível sobe.
      </p>
      <CardMensagem erro={erro} mensagem={mensagem} />
      <div className="mb-3 flex flex-wrap gap-3">
        {niveisOrdenados.map((nivel) => (
          <label key={nivel} className="flex flex-col gap-1 text-xs text-white/70">
            Nível {nivel}
            <span className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                className={`${INPUT} w-24`}
                value={marcos[nivel]}
                onChange={(e) => setMarcos((m) => ({ ...m, [nivel]: Number(e.target.value) }))}
              />
              {niveisOrdenados.length > 1 && (
                <button
                  type="button"
                  onClick={() => removerMarco(nivel)}
                  className="text-red-400 hover:text-red-300"
                  title="Remover marco"
                >
                  ✕
                </button>
              )}
            </span>
          </label>
        ))}
        <label className="flex flex-col gap-1 text-xs text-white/70">
          Novo marco (nível)
          <span className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              className={`${INPUT} w-24`}
              value={novoNivel}
              onChange={(e) => setNovoNivel(e.target.value)}
            />
            <button type="button" onClick={adicionarMarco} className="text-[#F3B43F] hover:text-[#ffd27a]">
              + add
            </button>
          </span>
        </label>
      </div>
      <button type="button" disabled={salvando} onClick={salvar} className={`${BTN} mt-3`}>
        {salvando ? "Salvando..." : "Salvar"}
      </button>
    </div>
  );
}

function CardBossBalance({
  atual,
  onSalvo,
}: {
  atual: GuildBalanceCompletoApi["guild.boss"]["atual"];
  onSalvo: () => void;
}) {
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
      await atualizarGuildBalanceAdmin("guild.boss", form);
      setMensagem("Boss da Guilda salvo.");
      onSalvo();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar — a fração igualitária + proporcional precisa somar 1."));
    } finally {
      setSalvando(false);
    }
  }

  const somaFracoes = form.BOSS_FRACAO_IGUALITARIA + form.BOSS_FRACAO_PROPORCIONAL;

  return (
    <div className={CARD}>
      <p className="mb-1 font-imFeel text-xl text-[#F3B43F]">Boss da Guilda (ao vivo)</p>
      <p className="mb-3 text-xs text-white/50">
        Divisão da recompensa por dano (igualitária + proporcional precisam somar 1) e os parâmetros da batalha em
        tempo real: tamanho de sala, prazo de turno, escalada de dano por rodada e teto de rodadas.
      </p>
      <CardMensagem erro={erro} mensagem={mensagem} />
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-xs text-white/70">
          Fração igualitária (0-1)
          <input
            type="number"
            min={0}
            max={1}
            step={0.05}
            className={`${INPUT} w-28`}
            value={form.BOSS_FRACAO_IGUALITARIA}
            onChange={(e) => campo("BOSS_FRACAO_IGUALITARIA", Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/70">
          Fração proporcional (0-1)
          <input
            type="number"
            min={0}
            max={1}
            step={0.05}
            className={`${INPUT} w-28`}
            value={form.BOSS_FRACAO_PROPORCIONAL}
            onChange={(e) => campo("BOSS_FRACAO_PROPORCIONAL", Number(e.target.value))}
          />
        </label>
        <p className={`self-end pb-2 text-xs ${Math.abs(somaFracoes - 1) > 1e-9 ? "text-red-400" : "text-white/50"}`}>
          soma = {somaFracoes.toFixed(2)}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-xs text-white/70">
          Tamanho máx. da sala
          <input
            type="number"
            min={1}
            className={`${INPUT} w-28`}
            value={form.BOSS_AO_VIVO_TAMANHO_MAXIMO}
            onChange={(e) => campo("BOSS_AO_VIVO_TAMANHO_MAXIMO", Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/70">
          Tamanho mín. da sala
          <input
            type="number"
            min={1}
            className={`${INPUT} w-28`}
            value={form.BOSS_AO_VIVO_TAMANHO_MINIMO}
            onChange={(e) => campo("BOSS_AO_VIVO_TAMANHO_MINIMO", Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/70">
          Prazo de turno (ms)
          <input
            type="number"
            min={1000}
            className={`${INPUT} w-32`}
            value={form.BOSS_AO_VIVO_PRAZO_TURNO_MS}
            onChange={(e) => campo("BOSS_AO_VIVO_PRAZO_TURNO_MS", Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/70">
          Escalada de dano por rodada (fração)
          <input
            type="number"
            min={0}
            step={0.01}
            className={`${INPUT} w-36`}
            value={form.BOSS_AO_VIVO_FATOR_ESCALADA_DANO}
            onChange={(e) => campo("BOSS_AO_VIVO_FATOR_ESCALADA_DANO", Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/70">
          Máx. de rodadas
          <input
            type="number"
            min={1}
            className={`${INPUT} w-28`}
            value={form.BOSS_AO_VIVO_MAX_RODADAS}
            onChange={(e) => campo("BOSS_AO_VIVO_MAX_RODADAS", Number(e.target.value))}
          />
        </label>
      </div>
      <button type="button" disabled={salvando} onClick={salvar} className={`${BTN} mt-3`}>
        {salvando ? "Salvando..." : "Salvar"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------
// Níveis — GuildLevelConfig
// ---------------------------------------------------------------------
function AbaNiveis() {
  const [niveis, setNiveis] = useState<GuildLevelConfigApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [salvandoNivel, setSalvandoNivel] = useState<number | null>(null);
  const [novo, setNovo] = useState<GuildLevelConfigApi>({ nivel: 1, xp_para_proximo_nivel: 0, limite_membros: 10 });

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setNiveis(await listarGuildLevelsAdmin());
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar os níveis."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function salvarLinha(linha: GuildLevelConfigApi) {
    setSalvandoNivel(linha.nivel);
    setErro("");
    setMensagem("");
    try {
      await salvarGuildLevelAdmin(linha);
      setMensagem(`Nível ${linha.nivel} salvo.`);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar."));
    } finally {
      setSalvandoNivel(null);
    }
  }

  function editarCampo(nivel: number, chave: "xp_para_proximo_nivel" | "limite_membros", valor: number) {
    setNiveis((atual) => atual.map((n) => (n.nivel === nivel ? { ...n, [chave]: valor } : n)));
  }

  async function criarNovo() {
    await salvarLinha(novo);
    setNovo({ nivel: novo.nivel + 1, xp_para_proximo_nivel: 0, limite_membros: 10 });
  }

  return (
    <div className={CARD}>
      <p className="mb-1 font-imFeel text-xl text-[#F3B43F]">Níveis da Guilda</p>
      <p className="mb-3 text-xs text-white/50">
        Progressão em tabela (não fórmula fixa): XP total necessário pra alcançar o próximo nível (vazio/0 no último
        nível, que não avança mais) e o limite de membros liberado nesse nível.
      </p>
      <CardMensagem erro={erro} mensagem={mensagem} />
      {carregando ? (
        <p className="text-sm text-white/60">Carregando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white">
            <thead>
              <tr className="text-white/50">
                <th className="px-2 py-1">Nível</th>
                <th className="px-2 py-1">XP pro próximo</th>
                <th className="px-2 py-1">Limite de membros</th>
                <th className="px-2 py-1"></th>
              </tr>
            </thead>
            <tbody>
              {niveis.map((linha) => (
                <tr key={linha.nivel} className="border-b border-white/5">
                  <td className="px-2 py-1 font-bold">{linha.nivel}</td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min={0}
                      className="w-28 rounded border border-white/20 bg-black/30 px-1 py-0.5 text-xs text-white"
                      value={linha.xp_para_proximo_nivel ?? 0}
                      onChange={(e) => editarCampo(linha.nivel, "xp_para_proximo_nivel", Number(e.target.value))}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min={1}
                      className="w-20 rounded border border-white/20 bg-black/30 px-1 py-0.5 text-xs text-white"
                      value={linha.limite_membros}
                      onChange={(e) => editarCampo(linha.nivel, "limite_membros", Number(e.target.value))}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <button
                      type="button"
                      disabled={salvandoNivel === linha.nivel}
                      onClick={() => salvarLinha(linha)}
                      className="text-[#F3B43F] hover:underline disabled:opacity-40"
                    >
                      {salvandoNivel === linha.nivel ? "Salvando..." : "Salvar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mb-1 mt-4 text-xs font-bold uppercase tracking-wide text-white/60">Adicionar novo nível</p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-white/70">
          Nível
          <input type="number" min={1} className={`${INPUT} w-24`} value={novo.nivel} onChange={(e) => setNovo((n) => ({ ...n, nivel: Number(e.target.value) }))} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/70">
          XP pro próximo
          <input
            type="number"
            min={0}
            className={`${INPUT} w-28`}
            value={novo.xp_para_proximo_nivel ?? 0}
            onChange={(e) => setNovo((n) => ({ ...n, xp_para_proximo_nivel: Number(e.target.value) }))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/70">
          Limite de membros
          <input
            type="number"
            min={1}
            className={`${INPUT} w-24`}
            value={novo.limite_membros}
            onChange={(e) => setNovo((n) => ({ ...n, limite_membros: Number(e.target.value) }))}
          />
        </label>
        <button type="button" disabled={salvandoNivel !== null} onClick={criarNovo} className={BTN}>
          Adicionar
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Boss por Rank — GuildBossConfig
// ---------------------------------------------------------------------
const CAMPOS_BOSS_NUMERICOS: (keyof PayloadGuildBossConfigAdmin)[] = [
  "vida_total",
  "defesa",
  "janela_horas",
  "custo_liberacao",
  "xp_guilda_concedido",
  "pool_dinheiro_total",
  "pool_xp_total",
  "dano_base_ataque",
  "premio_maior_dano",
];

function formBossVazio(): PayloadGuildBossConfigAdmin {
  return {
    rank: "F",
    nome_chefe: "",
    descricao: "",
    vida_total: 100000,
    defesa: 0,
    janela_horas: 168,
    custo_liberacao: 0,
    xp_guilda_concedido: 0,
    pool_dinheiro_total: 0,
    pool_xp_total: 0,
    dano_base_ataque: 0,
    premio_maior_dano: 0,
    imagem_url: "",
  };
}

function AbaBoss() {
  const [bosses, setBosses] = useState<GuildBossConfigAdminApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<PayloadGuildBossConfigAdmin>(formBossVazio());
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setBosses(await listarGuildBossesAdmin());
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar os bosses."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function iniciarEdicao(boss: GuildBossConfigAdminApi) {
    setEditandoId(boss.id);
    setForm({ ...boss });
    setMensagem("");
    setErro("");
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm(formBossVazio());
  }

  function campoTexto(chave: "rank" | "nome_chefe" | "descricao" | "imagem_url", valor: string) {
    setForm((f) => ({ ...f, [chave]: valor }));
  }

  function campoNumero(chave: (typeof CAMPOS_BOSS_NUMERICOS)[number], valor: number) {
    setForm((f) => ({ ...f, [chave]: valor }));
  }

  async function salvar() {
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      if (editandoId) {
        await atualizarGuildBossAdmin(editandoId, form);
        setMensagem("Boss atualizado.");
      } else {
        await criarGuildBossAdmin(form);
        setMensagem("Boss criado.");
      }
      cancelarEdicao();
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar."));
    } finally {
      setSalvando(false);
    }
  }

  const ranksJaCadastrados = new Set(bosses.map((b) => b.rank));

  return (
    <div className="flex flex-col gap-4">
      <div className={CARD}>
        <p className="mb-1 font-imFeel text-xl text-[#F3B43F]">Bosses cadastrados</p>
        <CardMensagem erro={carregando ? "" : ""} mensagem="" />
        {carregando ? (
          <p className="text-sm text-white/60">Carregando...</p>
        ) : bosses.length === 0 ? (
          <p className="text-sm text-white/50">Nenhum Boss de Guilda cadastrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white">
              <thead>
                <tr className="text-white/50">
                  <th className="px-2 py-1">Rank</th>
                  <th className="px-2 py-1">Nome</th>
                  <th className="px-2 py-1">Vida</th>
                  <th className="px-2 py-1">Janela (h)</th>
                  <th className="px-2 py-1">Custo liberação</th>
                  <th className="px-2 py-1">XP Guilda</th>
                  <th className="px-2 py-1"></th>
                </tr>
              </thead>
              <tbody>
                {bosses.map((boss) => (
                  <tr key={boss.id} className="border-b border-white/5">
                    <td className="px-2 py-1 font-bold">{boss.rank}</td>
                    <td className="px-2 py-1">{boss.nome_chefe}</td>
                    <td className="px-2 py-1">{Number(boss.vida_total).toLocaleString("pt-BR")}</td>
                    <td className="px-2 py-1">{boss.janela_horas}</td>
                    <td className="px-2 py-1">{boss.custo_liberacao.toLocaleString("pt-BR")}</td>
                    <td className="px-2 py-1">{boss.xp_guilda_concedido.toLocaleString("pt-BR")}</td>
                    <td className="px-2 py-1">
                      <button type="button" onClick={() => iniciarEdicao(boss)} className="text-[#F3B43F] hover:underline">
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={CARD}>
        {editandoId&&<TypingEditor kind="guild-bosses" id={editandoId}/>}
        <p className="mb-1 font-imFeel text-xl text-[#F3B43F]">{editandoId ? `Editando Boss (rank ${form.rank})` : "Novo Boss"}</p>
        <p className="mb-3 text-xs text-white/50">Um Boss por Rank (F..S) — não promove mais Rank, só concede XP de Guilda fixo + recompensa individual.</p>
        <CardMensagem erro={erro} mensagem={mensagem} />
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-xs text-white/70">
            Rank
            <select
              className={`${INPUT} w-24`}
              value={form.rank}
              disabled={Boolean(editandoId)}
              onChange={(e) => campoTexto("rank", e.target.value)}
            >
              {RANKS_GUILDA.map((r) => (
                <option key={r} value={r} disabled={!editandoId && ranksJaCadastrados.has(r)}>
                  {r}
                  {!editandoId && ranksJaCadastrados.has(r) ? " (já existe)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[16rem] flex-1 flex-col gap-1 text-xs text-white/70">
            Nome do chefe
            <input className={INPUT} value={form.nome_chefe} onChange={(e) => campoTexto("nome_chefe", e.target.value)} />
          </label>
        </div>
        <label className="mt-3 flex flex-col gap-1 text-xs text-white/70">
          Descrição
          <textarea className={`${INPUT} min-h-16`} value={form.descricao} onChange={(e) => campoTexto("descricao", e.target.value)} />
        </label>
        <label className="mt-3 flex flex-col gap-1 text-xs text-white/70">
          Imagem (URL)
          <input className={INPUT} value={form.imagem_url ?? ""} onChange={(e) => campoTexto("imagem_url", e.target.value)} />
        </label>
        <div className="mt-3 flex flex-wrap gap-3">
          {CAMPOS_BOSS_NUMERICOS.map((campo) => (
            <label key={campo} className="flex flex-col gap-1 text-xs text-white/70">
              {campo}
              <input
                type="number"
                min={0}
                className={`${INPUT} w-32`}
                value={(form[campo] as number) ?? 0}
                onChange={(e) => campoNumero(campo, Number(e.target.value))}
              />
            </label>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <button type="button" disabled={salvando} onClick={salvar} className={BTN}>
            {salvando ? "Salvando..." : editandoId ? "Salvar alterações" : "Criar Boss"}
          </button>
          {editandoId && (
            <button type="button" onClick={cancelarEdicao} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
