"use client";

// Pesca & Navegação — página de gameplay (spec §28, escopo reduzido:
// ver relatório final). Minigame via HTTP síncrono (não socket com tick
// ao vivo — decisão documentada em fishingService.js): o cliente só
// envia intenção (cast/hook/reel ON-OFF/abandon) e mostra exatamente o
// que o servidor devolve, nunca decide espécie/peso/tensão sozinho.
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import {
  fishingApi,
  type FishingZone,
  type IscaPesca,
  type MarineRouteDto,
  type ProgressoPesca,
  type SessaoPesca,
  type VaraPesca,
  type Vessel,
} from "@/lib/api/fishing";
import FishingAlmanaque from "./FishingAlmanaque";
import FishingRanking from "./FishingRanking";
import FishingTorneio, { TorneioBanner } from "./FishingTorneio";

function extrairMensagemErro(error: unknown, padrao: string) {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? padrao;
}

const FASES_TERMINAIS = new Set(["CAUGHT", "ESCAPED", "BROKEN_LINE", "EXPIRED", "ABORTED"]);

type AbaPesca = "PESCAR" | "ALMANAQUE" | "RANKING" | "TORNEIO";
const ABAS_PESCA: { valor: AbaPesca; label: string }[] = [
  { valor: "PESCAR", label: "Pescar" },
  { valor: "ALMANAQUE", label: "Almanaque Marinho" },
  { valor: "RANKING", label: "Ranking" },
  { valor: "TORNEIO", label: "Torneio" },
];

export default function FishingClient() {
  const { mostrarErro, mostrarSucesso, mostrarInfo } = useToast();
  const searchParams = useSearchParams();
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState<AbaPesca>("PESCAR");

  const [progresso, setProgresso] = useState<ProgressoPesca | null>(null);
  const [zonas, setZonas] = useState<FishingZone[]>([]);
  const [varas, setVaras] = useState<VaraPesca[]>([]);
  const [iscas, setIscas] = useState<IscaPesca[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [rotas, setRotas] = useState<MarineRouteDto[]>([]);
  const [zonaAtualId, setZonaAtualId] = useState<number | null>(null);

  const [zonaSelecionada, setZonaSelecionada] = useState<number | null>(null);
  const [varaSelecionada, setVaraSelecionada] = useState<number | null>(null);
  const [iscaSelecionada, setIscaSelecionada] = useState<number | null>(null);

  const [sessao, setSessao] = useState<SessaoPesca | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const carregarTudo = useCallback(async () => {
    try {
      const [p, z, v, i, vs, rs, nav, ativa] = await Promise.all([
        fishingApi.getProgresso(),
        fishingApi.getZonas(),
        fishingApi.getRods(),
        fishingApi.getBaits(),
        fishingApi.getVessels(),
        fishingApi.getRoutes(),
        fishingApi.getNavigationState(),
        fishingApi.getSessaoAtiva(),
      ]);
      setProgresso(p);
      setZonas(z);
      setVaras(v);
      setIscas(i);
      setVessels(vs);
      setRotas(rs);
      setZonaAtualId(nav.id_zone_atual);
      setSessao(ativa);
      // Deep-link opcional a partir do Mapa de Caelum (?zona=<id>) — só
      // pré-seleciona no seletor, nunca navega/viaja sozinho (a viagem
      // continua exigindo uma rota marítima real, spec §18.3).
      const zonaQuery = Number(searchParams.get("zona"));
      if (zonaQuery && z.some((zona) => zona.id === zonaQuery)) {
        setZonaSelecionada(zonaQuery);
      } else if (nav.id_zone_atual) {
        setZonaSelecionada(nav.id_zone_atual);
      }
    } catch (error) {
      mostrarErro(extrairMensagemErro(error, "Não foi possível carregar a tela de Pesca."));
    } finally {
      setCarregando(false);
    }
  }, [mostrarErro, searchParams]);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  async function viajar(routeId: number) {
    setOcupado(true);
    try {
      const estado = await fishingApi.travel(routeId);
      setZonaAtualId(estado.id_zone_atual);
      setZonaSelecionada(estado.id_zone_atual);
      mostrarSucesso("Você chegou à zona de pesca!");
    } catch (error) {
      mostrarErro(extrairMensagemErro(error, "Não foi possível viajar por essa rota."));
    } finally {
      setOcupado(false);
    }
  }

  async function adquirirVessel(vesselId: number) {
    setOcupado(true);
    try {
      await fishingApi.acquireVessel(vesselId);
      mostrarSucesso("Embarcação adquirida!");
      const vs = await fishingApi.getVessels();
      setVessels(vs);
    } catch (error) {
      mostrarErro(extrairMensagemErro(error, "Não foi possível adquirir essa embarcação."));
    } finally {
      setOcupado(false);
    }
  }

  async function iniciarPesca() {
    if (!zonaSelecionada) {
      mostrarInfo("Escolha uma zona de pesca primeiro.");
      return;
    }
    if (!varaSelecionada) {
      mostrarInfo("Você precisa de uma vara de pesca no inventário para pescar.");
      return;
    }
    setOcupado(true);
    try {
      const nova = await fishingApi.startSession(zonaSelecionada, varaSelecionada, iscaSelecionada);
      setSessao(nova);
    } catch (error) {
      mostrarErro(extrairMensagemErro(error, "Não foi possível iniciar a sessão de pesca."));
    } finally {
      setOcupado(false);
    }
  }

  async function acao(fn: () => Promise<SessaoPesca>) {
    setOcupado(true);
    try {
      const atualizada = await fn();
      setSessao(atualizada);
      if (atualizada.fase === "CAUGHT" && atualizada.resultado) {
        const r = atualizada.resultado;
        mostrarSucesso(`Capturou um peixe de ${r.weight_g}g! +${r.xp} XP de Pesca.${r.primeira_descoberta ? " Nova espécie descoberta!" : ""}`);
      } else if (FASES_TERMINAIS.has(atualizada.fase) && atualizada.fase !== "CAUGHT") {
        mostrarInfo(`Sessão encerrada: ${atualizada.resultado?.motivo ?? atualizada.fase}.`);
      }
      if (FASES_TERMINAIS.has(atualizada.fase)) {
        const p = await fishingApi.getProgresso();
        setProgresso(p);
      }
    } catch (error) {
      mostrarErro(extrairMensagemErro(error, "Ação de pesca falhou."));
    } finally {
      setOcupado(false);
    }
  }

  if (carregando) {
    return <p className="text-white/70">Carregando Pesca…</p>;
  }

  const emSessaoAtiva = sessao != null && !FASES_TERMINAIS.has(sessao.fase);

  return (
    <div className="flex flex-col gap-6">
      {/* Banner do Torneio da Pesca — sempre visível, qualquer aba */}
      <TorneioBanner onVerTorneio={() => setAba("TORNEIO")} />

      {/* Abas */}
      <div className="flex flex-wrap gap-2">
        {ABAS_PESCA.map(({ valor, label }) => (
          <button
            key={valor}
            type="button"
            onClick={() => setAba(valor)}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
              aba === valor
                ? "border-sky-400 bg-sky-500 text-[#0b1b2b]"
                : "border-sky-500/40 bg-black/30 text-sky-300 hover:bg-black/50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {aba === "ALMANAQUE" && <FishingAlmanaque />}
      {aba === "RANKING" && <FishingRanking />}
      {aba === "TORNEIO" && <FishingTorneio />}

      {aba === "PESCAR" && (
        <>
      {/* Progresso */}
      <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-white">
        <p className="text-sm uppercase tracking-widest text-sky-300">Nível de Pesca</p>
        <p className="text-2xl font-imFeel">
          {progresso?.nivel ?? 1} / {progresso?.nivel_maximo ?? 25}
        </p>
        <p className="text-sm text-white/60">
          XP: {progresso?.experiencia ?? 0}
          {progresso?.xp_proximo_nivel != null ? ` (próximo nível em ${progresso.xp_proximo_nivel})` : " (nível máximo)"}
        </p>
        <p className="text-sm text-white/60">Total capturado: {progresso?.total_capturado ?? 0}</p>
      </div>

      {/* Navegação */}
      {!emSessaoAtiva && (
        <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-white">
          <h2 className="mb-2 text-lg font-imFeel text-sky-300">Navegação</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {vessels.map((v) => (
              <div key={v.id} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                <p className="font-semibold">{v.nome} (tier {v.tier})</p>
                {v.possuida ? (
                  <p className="text-green-400">Possuída</p>
                ) : (
                  <button
                    className="mt-1 rounded bg-sky-700 px-2 py-1 text-xs hover:bg-sky-600 disabled:opacity-50"
                    disabled={ocupado}
                    onClick={() => adquirirVessel(v.id)}
                  >
                    Adquirir {v.preco > 0 ? `(${v.preco} ouro)` : "(grátis)"}
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {rotas.map((r) => (
              <button
                key={r.id}
                className="rounded-lg border border-sky-500/40 bg-sky-950/40 px-3 py-2 text-sm hover:bg-sky-900/60 disabled:opacity-50"
                disabled={ocupado}
                onClick={() => viajar(r.id)}
              >
                Viajar: {r.portoOrigem?.nome} → {r.zonaDestino?.nome} (tier mín. {r.min_vessel_tier})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Seleção de zona/vara/isca + iniciar */}
      {!emSessaoAtiva && (
        <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-white">
          <h2 className="mb-2 text-lg font-imFeel text-sky-300">Preparar Pescaria</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="mb-1 text-xs uppercase text-white/50">Zona</p>
              <select
                className="w-full rounded bg-white/10 p-2 text-sm text-white [color-scheme:dark]"
                value={zonaSelecionada ?? ""}
                onChange={(e) => setZonaSelecionada(Number(e.target.value) || null)}
              >
                <option value="" className="bg-[#1a1410] text-white">Selecione…</option>
                {zonas.map((z) => (
                  <option key={z.id} value={z.id} className="bg-[#1a1410] text-white">
                    {z.nome} (Nv. {z.nivel_pesca_minimo}+)
                  </option>
                ))}
              </select>
              {zonaSelecionada != null && zonaAtualId !== zonaSelecionada && (
                <p className="mt-1 text-xs text-amber-400">Você precisa navegar até essa zona primeiro.</p>
              )}
            </div>
            <div>
              <p className="mb-1 text-xs uppercase text-white/50">Vara</p>
              <select
                className="w-full rounded bg-white/10 p-2 text-sm text-white [color-scheme:dark]"
                value={varaSelecionada ?? ""}
                onChange={(e) => setVaraSelecionada(Number(e.target.value) || null)}
              >
                <option value="" className="bg-[#1a1410] text-white">Selecione uma vara…</option>
                {varas.map((v) => (
                  <option key={v.id_instancia} value={v.id_instancia} className="bg-[#1a1410] text-white">
                    {v.nome} +{v.refinamento}
                  </option>
                ))}
              </select>
              {varas.length === 0 && (
                <p className="mt-1 text-xs text-amber-400">
                  Você não tem nenhuma vara de pesca. Consegue uma na Forja.
                </p>
              )}
            </div>
            <div>
              <p className="mb-1 text-xs uppercase text-white/50">Isca</p>
              <select
                className="w-full rounded bg-white/10 p-2 text-sm text-white [color-scheme:dark]"
                value={iscaSelecionada ?? ""}
                onChange={(e) => setIscaSelecionada(Number(e.target.value) || null)}
              >
                <option value="" className="bg-[#1a1410] text-white">Sem isca</option>
                {iscas.map((i) => (
                  <option
                    key={i.id_item}
                    value={i.id_item}
                    disabled={i.quantidade_disponivel <= 0}
                    className="bg-[#1a1410] text-white"
                  >
                    {i.nome} ({i.quantidade_disponivel})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            className="mt-4 rounded-lg bg-sky-700 px-4 py-2 font-semibold hover:bg-sky-600 disabled:opacity-50"
            disabled={ocupado || !zonaSelecionada || zonaAtualId !== zonaSelecionada || !varaSelecionada}
            onClick={iniciarPesca}
          >
            Lançar sessão de pesca
          </button>
        </div>
      )}

      {/* Minigame */}
      {sessao && (
        <FishingArena
          sessao={sessao}
          ocupado={ocupado}
          onCast={() => acao(() => fishingApi.cast(sessao.id))}
          onHook={() => acao(() => fishingApi.hook(sessao.id))}
          onReel={(active) => acao(() => fishingApi.reel(sessao.id, active))}
          onAbandon={() => acao(() => fishingApi.abandon(sessao.id))}
          onNovaSessao={() => setSessao(null)}
        />
      )}
        </>
      )}
    </div>
  );
}

function FishingArena({
  sessao,
  ocupado,
  onCast,
  onHook,
  onReel,
  onAbandon,
  onNovaSessao,
}: {
  sessao: SessaoPesca;
  ocupado: boolean;
  onCast: () => void;
  onHook: () => void;
  onReel: (active: boolean) => void;
  onAbandon: () => void;
  onNovaSessao: () => void;
}) {
  const terminal = FASES_TERMINAIS.has(sessao.fase);
  const tensaoPct = Math.min(100, (sessao.tensao / 1000) * 100);
  const progressoPct = Math.min(100, (sessao.progresso / 1000) * 100);

  return (
    <div className="rounded-xl border border-sky-500/30 bg-sky-950/30 p-4 text-white">
      <h2 className="mb-3 text-lg font-imFeel text-sky-300">Minigame de Pesca — {sessao.fase}</h2>

      {!terminal && (
        <>
          <div className="mb-3">
            <p className="mb-1 text-xs uppercase text-white/50">Tensão da linha</p>
            <div className="h-4 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full transition-all ${tensaoPct > 80 ? "bg-red-500" : tensaoPct > 50 ? "bg-amber-400" : "bg-sky-400"}`}
                style={{ width: `${tensaoPct}%` }}
              />
            </div>
          </div>
          <div className="mb-4">
            <p className="mb-1 text-xs uppercase text-white/50">Progresso de captura</p>
            <div className="h-4 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-green-500 transition-all" style={{ width: `${progressoPct}%` }} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {sessao.fase === "CASTING" && (
              <button className="rounded bg-sky-700 px-4 py-2 disabled:opacity-50" disabled={ocupado} onClick={onCast}>
                Lançar a linha
              </button>
            )}
            {sessao.fase === "WAITING_BITE" && (
              <button className="rounded bg-amber-600 px-4 py-2 disabled:opacity-50" disabled={ocupado} onClick={onHook}>
                Fisgar!
              </button>
            )}
            {sessao.fase === "FIGHTING" && (
              <>
                <button
                  className="rounded bg-green-700 px-4 py-2 disabled:opacity-50"
                  disabled={ocupado}
                  onMouseDown={() => onReel(true)}
                >
                  Recolher (ON)
                </button>
                <button
                  className="rounded bg-white/10 px-4 py-2 disabled:opacity-50"
                  disabled={ocupado}
                  onClick={() => onReel(false)}
                >
                  Soltar (OFF)
                </button>
              </>
            )}
            <button className="rounded bg-red-900/60 px-4 py-2 disabled:opacity-50" disabled={ocupado} onClick={onAbandon}>
              Abandonar
            </button>
          </div>
        </>
      )}

      {terminal && (
        <div>
          {sessao.fase === "CAUGHT" ? (
            <p className="text-green-400">
              Peixe capturado! Peso: {sessao.resultado?.weight_g}g · Qualidade:{" "}
              {sessao.resultado?.quality != null ? `${Math.round(sessao.resultado.quality * 100)}%` : "-"} · +{sessao.resultado?.xp} XP
            </p>
          ) : (
            <p className="text-amber-400">Sessão encerrada: {sessao.resultado?.motivo ?? sessao.fase}.</p>
          )}
          <button className="mt-3 rounded bg-sky-700 px-4 py-2" onClick={onNovaSessao}>
            Pescar de novo
          </button>
        </div>
      )}
    </div>
  );
}
