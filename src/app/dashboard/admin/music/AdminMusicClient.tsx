"use client";

// Painel Administrativo de Músicas (/dashboard/admin/music) — spec
// completa em "Painel Administrativo de Músicas" (ver PR/README da
// tarefa). Implementação consolidada num client component só (em vez
// dos ~10 arquivos de componente sugeridos em §13) pra caber no prazo
// do beta — a divisão em abas/funções abaixo seguem 1:1 a estrutura da
// spec (Faixas/Páginas/Contextos/Pools/Publicação/Histórico), só sem
// quebrar em arquivos separados.
import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ativarVersaoMusica,
  atualizarAssignmentMusica,
  atualizarTracksDoPoolMusica,
  criarPoolMusica,
  criarTrackMusica,
  desativarTrackMusica,
  descartarDraftMusica,
  enviarVersaoMusica,
  listarHistoricoMusica,
  listarPoolsMusica,
  listarSlotsMusica,
  listarTracksMusica,
  listarVersoesMusica,
  mensagemDeErroAdminMusica,
  obterDraftMusica,
  obterResumoMusica,
  publicarDraftMusica,
  reativarTrackMusica,
  restaurarVersaoMusica,
  validarDraftMusica,
  type MusicAssignmentApi,
  type MusicDraftApi,
  type MusicHistoricoItemApi,
  type MusicPoolApi,
  type MusicPoolMembershipApi,
  type MusicResumoApi,
  type MusicSlotApi,
  type MusicTrackApi,
  type MusicTrackFileVersionApi,
} from "@/lib/api/adminMusic";

type Aba = "faixas" | "paginas" | "contextos" | "pools" | "publicacao" | "historico";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api").replace(/\/$/, "");

function formatarDuracao(ms: number | null) {
  if (!ms) return "—";
  const segundosTotais = Math.round(ms / 1000);
  const min = Math.floor(segundosTotais / 60);
  const seg = segundosTotais % 60;
  return `${min}:${String(seg).padStart(2, "0")}`;
}

function AudioPreview({ src }: { src: string | null }) {
  const ref = useRef<HTMLAudioElement>(null);
  if (!src) return null;
  return (
    <audio
      ref={ref}
      controls
      preload="none"
      src={src}
      className="h-8 w-56"
      onPlay={(e) => {
        // Nunca mais de um preview tocando ao mesmo tempo na tela.
        document.querySelectorAll("audio").forEach((a) => {
          if (a !== e.currentTarget) a.pause();
        });
      }}
    />
  );
}

export default function AdminMusicClient() {
  const [aba, setAba] = useState<Aba>("faixas");
  const [resumo, setResumo] = useState<MusicResumoApi | null>(null);
  const [slots, setSlots] = useState<MusicSlotApi[]>([]);
  const [tracks, setTracks] = useState<MusicTrackApi[]>([]);
  const [pools, setPools] = useState<MusicPoolApi[]>([]);
  const [draft, setDraft] = useState<MusicDraftApi | null>(null);
  const [historico, setHistorico] = useState<MusicHistoricoItemApi[]>([]);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const carregarTudo = useCallback(async () => {
    setCarregando(true);
    try {
      const [r, s, t, p, d, h] = await Promise.all([
        obterResumoMusica(),
        listarSlotsMusica(),
        listarTracksMusica(),
        listarPoolsMusica(),
        obterDraftMusica(),
        listarHistoricoMusica(),
      ]);
      setResumo(r);
      setSlots(s);
      setTracks(t);
      setPools(p);
      setDraft(d);
      setHistorico(h);
    } catch (e) {
      setErro(mensagemDeErroAdminMusica(e, "Erro ao carregar o Painel de Músicas."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  function avisar(texto: string) {
    setMensagem(texto);
    setErro(null);
    setTimeout(() => setMensagem(null), 4000);
  }
  function reclamar(e: unknown, padrao: string) {
    setErro(mensagemDeErroAdminMusica(e, padrao));
    setMensagem(null);
  }

  async function descartar() {
    if (!confirm("Descartar o rascunho atual? Todas as alterações não publicadas serão perdidas.")) return;
    try {
      await descartarDraftMusica();
      avisar("Rascunho descartado.");
      await carregarTudo();
    } catch (e) {
      reclamar(e, "Erro ao descartar rascunho.");
    }
  }

  const assignmentPorSlot = useMemo(() => {
    const mapa = new Map<string, MusicAssignmentApi>();
    for (const a of draft?.assignments ?? []) mapa.set(a.slot_key, a);
    return mapa;
  }, [draft]);

  const membershipsPorPool = useMemo(() => {
    const mapa = new Map<number, MusicPoolMembershipApi[]>();
    for (const m of draft?.memberships ?? []) {
      if (!mapa.has(m.id_pool)) mapa.set(m.id_pool, []);
      mapa.get(m.id_pool)!.push(m);
    }
    return mapa;
  }, [draft]);

  if (carregando) return <div className="text-white/60">Carregando…</div>;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Músicas</h1>
      </div>

      {mensagem && <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm text-green-300">{mensagem}</div>}
      {erro && <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">{erro}</div>}

      {/* §5.2 — cabeçalho do módulo */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/15 bg-white/5 p-4">
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <span className="text-white/50">Publicada:</span>{" "}
            <span className="font-bold text-white">
              {resumo?.publicadaVersionNumber != null ? `v${resumo.publicadaVersionNumber}` : "nenhuma"}
            </span>
          </div>
          <div>
            <span className="text-white/50">Rascunho:</span>{" "}
            <span className="font-bold text-white">v{resumo?.draftVersionNumber}</span>
          </div>
          <div>
            <span className="text-white/50">Alterações pendentes:</span>{" "}
            <span className={`font-bold ${resumo?.alteracoesPendentes ? "text-[#F3B43F]" : "text-white/60"}`}>
              {resumo?.alteracoesPendentes ?? 0}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={descartar}
            className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white/70 hover:bg-white/10"
          >
            Descartar rascunho
          </button>
          <button
            type="button"
            onClick={() => setAba("publicacao")}
            className="rounded-lg bg-[#BC8418] px-3 py-2 text-sm font-bold text-black hover:brightness-110"
          >
            Ir para Publicação
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["faixas", "Faixas"],
            ["paginas", "Páginas"],
            ["contextos", "Contextos"],
            ["pools", "Pools"],
            ["publicacao", "Publicação"],
            ["historico", "Histórico"],
          ] as [Aba, string][]
        ).map(([id, rotulo]) => (
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

      {aba === "faixas" && (
        <AbaFaixas tracks={tracks} onMudou={carregarTudo} avisar={avisar} reclamar={reclamar} />
      )}
      {(aba === "paginas" || aba === "contextos") && (
        <AbaSlots
          kind={aba === "paginas" ? "PAGE" : "CONTEXT"}
          slots={slots.filter((s) => s.kind === (aba === "paginas" ? "PAGE" : "CONTEXT"))}
          assignmentPorSlot={assignmentPorSlot}
          tracks={tracks.filter((t) => t.ativo)}
          pools={pools.filter((p) => p.ativo)}
          onMudou={carregarTudo}
          avisar={avisar}
          reclamar={reclamar}
        />
      )}
      {aba === "pools" && (
        <AbaPools
          pools={pools}
          tracks={tracks}
          membershipsPorPool={membershipsPorPool}
          onMudou={carregarTudo}
          avisar={avisar}
          reclamar={reclamar}
        />
      )}
      {aba === "publicacao" && (
        <AbaPublicacao
          resumo={resumo}
          draft={draft}
          onPublicado={carregarTudo}
          avisar={avisar}
          reclamar={reclamar}
        />
      )}
      {aba === "historico" && <AbaHistorico historico={historico} onRestaurado={carregarTudo} avisar={avisar} reclamar={reclamar} />}
    </div>
  );
}

// --- Faixas ---

function AbaFaixas({
  tracks,
  onMudou,
  avisar,
  reclamar,
}: {
  tracks: MusicTrackApi[];
  onMudou: () => Promise<void>;
  avisar: (t: string) => void;
  reclamar: (e: unknown, p: string) => void;
}) {
  const [filtro, setFiltro] = useState("");
  const [mostrarCriar, setMostrarCriar] = useState(false);
  const [novaKey, setNovaKey] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [expandido, setExpandido] = useState<number | null>(null);
  const [versoes, setVersoes] = useState<MusicTrackFileVersionApi[]>([]);

  const filtradas = tracks.filter(
    (t) => !filtro || t.nome.toLowerCase().includes(filtro.toLowerCase()) || t.key.includes(filtro.toLowerCase()),
  );

  async function criar() {
    try {
      await criarTrackMusica({ key: novaKey.trim(), nome: novoNome.trim() });
      setNovaKey("");
      setNovoNome("");
      setMostrarCriar(false);
      avisar("Faixa criada.");
      await onMudou();
    } catch (e) {
      reclamar(e, "Erro ao criar faixa.");
    }
  }

  async function expandir(track: MusicTrackApi) {
    if (expandido === track.id) {
      setExpandido(null);
      return;
    }
    try {
      const v = await listarVersoesMusica(track.id);
      setVersoes(v);
      setExpandido(track.id);
    } catch (e) {
      reclamar(e, "Erro ao listar versões.");
    }
  }

  async function enviarArquivo(track: MusicTrackApi, arquivo: File) {
    try {
      await enviarVersaoMusica(track.id, arquivo);
      avisar(`Nova versão enviada pra "${track.nome}" — ative-a na lista de versões.`);
      const v = await listarVersoesMusica(track.id);
      setVersoes(v);
      await onMudou();
    } catch (e) {
      reclamar(e, "Erro ao enviar arquivo.");
    }
  }

  async function ativar(track: MusicTrackApi, versao: number) {
    try {
      await ativarVersaoMusica(track.id, versao);
      avisar(`Versão ${versao} ativada.`);
      const v = await listarVersoesMusica(track.id);
      setVersoes(v);
      await onMudou();
    } catch (e) {
      reclamar(e, "Erro ao ativar versão (precisa de music.publish).");
    }
  }

  async function alternarAtivo(track: MusicTrackApi) {
    try {
      if (track.ativo) await desativarTrackMusica(track.id);
      else await reativarTrackMusica(track.id);
      await onMudou();
    } catch (e) {
      reclamar(e, "Essa faixa está em uso na configuração publicada — troque os vínculos antes de desativar.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar por nome/key…"
          className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
        />
        <button
          type="button"
          onClick={() => setMostrarCriar((v) => !v)}
          className="rounded-lg bg-[#BC8418] px-3 py-2 text-sm font-bold text-black"
        >
          + Nova faixa
        </button>
      </div>

      {mostrarCriar && (
        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-white/15 bg-white/5 p-3">
          <div>
            <label className="block text-xs text-white/50">key (estável)</label>
            <input
              value={novaKey}
              onChange={(e) => setNovaKey(e.target.value)}
              placeholder="ex: taverna-noturna"
              className="rounded border border-white/20 bg-black/30 px-2 py-1 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50">Nome</label>
            <input
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              className="rounded border border-white/20 bg-black/30 px-2 py-1 text-sm text-white"
            />
          </div>
          <button type="button" onClick={criar} className="rounded bg-green-600 px-3 py-1.5 text-sm font-bold text-white">
            Criar
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-white/15">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/10 text-white/60">
            <tr>
              <th className="px-3 py-2">Faixa</th>
              <th className="px-3 py-2">Key</th>
              <th className="px-3 py-2">Versão</th>
              <th className="px-3 py-2">Duração</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((t) => (
              <Fragment key={t.id}>
                <tr className="border-t border-white/10">
                  <td className="px-3 py-2 text-white">{t.nome}</td>
                  <td className="px-3 py-2 font-mono text-xs text-white/50">{t.key}</td>
                  <td className="px-3 py-2 text-white/70">{t.versaoAtual?.versao ?? "—"}</td>
                  <td className="px-3 py-2 text-white/70">{formatarDuracao(t.versaoAtual?.duracao_ms ?? null)}</td>
                  <td className="px-3 py-2">
                    <span className={t.ativo ? "text-green-400" : "text-white/40"}>{t.ativo ? "Ativa" : "Inativa"}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <AudioPreview src={t.versaoAtual ? `${API_BASE_URL}/music/tracks/${t.key}/audio` : null} />
                      <button type="button" onClick={() => expandir(t)} className="text-xs text-[#F3B43F] hover:underline">
                        Versões
                      </button>
                      <button type="button" onClick={() => alternarAtivo(t)} className="text-xs text-white/60 hover:underline">
                        {t.ativo ? "Desativar" : "Reativar"}
                      </button>
                    </div>
                  </td>
                </tr>
                {expandido === t.id && (
                  <tr key={`${t.id}-versoes`} className="border-t border-white/5 bg-black/20">
                    <td colSpan={6} className="px-3 py-3">
                      <div className="flex flex-col gap-2">
                        <label className="w-fit cursor-pointer rounded bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20">
                          Enviar nova versão (MP3, até 30MB)
                          <input
                            type="file"
                            accept="audio/mpeg,audio/mp3,.mp3"
                            className="hidden"
                            onChange={(e) => {
                              const arquivo = e.target.files?.[0];
                              if (arquivo) enviarArquivo(t, arquivo);
                              e.target.value = "";
                            }}
                          />
                        </label>
                        <table className="w-full text-xs">
                          <thead className="text-white/40">
                            <tr>
                              <th className="py-1 text-left">Versão</th>
                              <th className="py-1 text-left">Arquivo</th>
                              <th className="py-1 text-left">Duração</th>
                              <th className="py-1 text-left">Status</th>
                              <th className="py-1 text-left">Ação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {versoes.map((v) => (
                              <tr key={v.id} className="border-t border-white/5">
                                <td className="py-1">{v.versao}</td>
                                <td className="py-1 text-white/60">{v.nome_arquivo_original}</td>
                                <td className="py-1">{formatarDuracao(v.duracao_ms)}</td>
                                <td className="py-1">{v.ativo ? <span className="text-green-400">ativa</span> : "—"}</td>
                                <td className="py-1">
                                  {!v.ativo && (
                                    <button type="button" onClick={() => ativar(t, v.versao)} className="text-[#F3B43F] hover:underline">
                                      Ativar
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Páginas / Contextos ---

function AbaSlots({
  kind,
  slots,
  assignmentPorSlot,
  tracks,
  pools,
  onMudou,
  avisar,
  reclamar,
}: {
  kind: "PAGE" | "CONTEXT";
  slots: MusicSlotApi[];
  assignmentPorSlot: Map<string, MusicAssignmentApi>;
  tracks: MusicTrackApi[];
  pools: MusicPoolApi[];
  onMudou: () => Promise<void>;
  avisar: (t: string) => void;
  reclamar: (e: unknown, p: string) => void;
}) {
  async function salvar(slotKey: string, tipo: "TRACK" | "POOL" | "SILENCE", idAlvo: number | null, fadeMs: number | null) {
    try {
      await atualizarAssignmentMusica(slotKey, {
        assignment_type: tipo,
        id_track: tipo === "TRACK" ? idAlvo : null,
        id_pool: tipo === "POOL" ? idAlvo : null,
        fade_ms: fadeMs,
      });
      avisar(`"${slotKey}" atualizado no rascunho.`);
      await onMudou();
    } catch (e) {
      reclamar(e, "Erro ao salvar atribuição.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-white/50">
        {kind === "CONTEXT"
          ? "Prioridade técnica fixa — nunca editável pelo Admin. Um contexto sempre sobrepõe a página enquanto estiver ativo."
          : "Alterações aqui afetam só o RASCUNHO — jogadores só veem a mudança depois de Publicar."}
      </p>
      {slots.map((slot) => {
        const atual = assignmentPorSlot.get(slot.slot_key);
        return (
          <LinhaSlot
            key={slot.slot_key}
            slot={slot}
            atual={atual}
            tracks={tracks}
            pools={pools}
            onSalvar={salvar}
          />
        );
      })}
    </div>
  );
}

function LinhaSlot({
  slot,
  atual,
  tracks,
  pools,
  onSalvar,
}: {
  slot: MusicSlotApi;
  atual: MusicAssignmentApi | undefined;
  tracks: MusicTrackApi[];
  pools: MusicPoolApi[];
  onSalvar: (slotKey: string, tipo: "TRACK" | "POOL" | "SILENCE", idAlvo: number | null, fadeMs: number | null) => void;
}) {
  const [tipo, setTipo] = useState<"TRACK" | "POOL" | "SILENCE">(atual?.assignment_type ?? "SILENCE");
  const [idAlvo, setIdAlvo] = useState<number | null>(atual?.id_track ?? atual?.id_pool ?? null);
  const [fadeMs, setFadeMs] = useState<number | "">(atual?.fade_ms ?? "");

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="w-48">
        <div className="font-bold text-white">{slot.label}</div>
        <div className="text-xs text-white/40">
          {slot.slot_key} · prioridade {slot.priority}
        </div>
      </div>
      <select
        value={tipo}
        onChange={(e) => {
          setTipo(e.target.value as typeof tipo);
          setIdAlvo(null);
        }}
        className="rounded border border-white/20 bg-black/30 px-2 py-1 text-sm text-white"
      >
        <option value="SILENCE">Silêncio</option>
        <option value="TRACK">Faixa fixa</option>
        <option value="POOL">Pool aleatório</option>
      </select>
      {tipo === "TRACK" && (
        <select
          value={idAlvo ?? ""}
          onChange={(e) => setIdAlvo(e.target.value ? Number(e.target.value) : null)}
          className="rounded border border-white/20 bg-black/30 px-2 py-1 text-sm text-white"
        >
          <option value="">Escolha a faixa…</option>
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>
      )}
      {tipo === "POOL" && (
        <select
          value={idAlvo ?? ""}
          onChange={(e) => setIdAlvo(e.target.value ? Number(e.target.value) : null)}
          className="rounded border border-white/20 bg-black/30 px-2 py-1 text-sm text-white"
        >
          <option value="">Escolha o pool…</option>
          {pools.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      )}
      <input
        type="number"
        min={0}
        max={10000}
        placeholder="fade ms (opcional)"
        value={fadeMs}
        onChange={(e) => setFadeMs(e.target.value === "" ? "" : Number(e.target.value))}
        className="w-36 rounded border border-white/20 bg-black/30 px-2 py-1 text-sm text-white"
      />
      <button
        type="button"
        onClick={() => onSalvar(slot.slot_key, tipo, idAlvo, fadeMs === "" ? null : fadeMs)}
        disabled={tipo !== "SILENCE" && !idAlvo}
        className="rounded bg-[#BC8418] px-3 py-1.5 text-sm font-bold text-black disabled:opacity-40"
      >
        Salvar
      </button>
    </div>
  );
}

// --- Pools ---

function AbaPools({
  pools,
  tracks,
  membershipsPorPool,
  onMudou,
  avisar,
  reclamar,
}: {
  pools: MusicPoolApi[];
  tracks: MusicTrackApi[];
  membershipsPorPool: Map<number, MusicPoolMembershipApi[]>;
  onMudou: () => Promise<void>;
  avisar: (t: string) => void;
  reclamar: (e: unknown, p: string) => void;
}) {
  const [poolSelecionado, setPoolSelecionado] = useState<number | null>(pools[0]?.id ?? null);
  const [mostrarCriar, setMostrarCriar] = useState(false);
  const [novaKey, setNovaKey] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [pesos, setPesos] = useState<Record<number, number>>({});
  const [selecionadas, setSelecionadas] = useState<Set<number>>(new Set());
  const [sorteioTeste, setSorteioTeste] = useState<string | null>(null);

  const poolAtual = pools.find((p) => p.id === poolSelecionado) ?? null;
  const membrosAtuais = poolAtual ? membershipsPorPool.get(poolAtual.id) ?? [] : [];

  useEffect(() => {
    const novosPesos: Record<number, number> = {};
    const novasSelecionadas = new Set<number>();
    for (const m of membrosAtuais) {
      novosPesos[m.id_track] = m.peso;
      novasSelecionadas.add(m.id_track);
    }
    setPesos(novosPesos);
    setSelecionadas(novasSelecionadas);
    setSorteioTeste(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolSelecionado]);

  const somaPesos = [...selecionadas].reduce((soma, id) => soma + (pesos[id] || 1), 0);

  async function criarPool() {
    try {
      const pool = await criarPoolMusica({ key: novaKey.trim(), nome: novoNome.trim() });
      setNovaKey("");
      setNovoNome("");
      setMostrarCriar(false);
      avisar("Pool criado.");
      await onMudou();
      setPoolSelecionado(pool.id);
    } catch (e) {
      reclamar(e, "Erro ao criar pool.");
    }
  }

  async function salvarMembership() {
    if (!poolAtual) return;
    const itens = [...selecionadas].map((idTrack, i) => ({ id_track: idTrack, peso: Math.max(1, pesos[idTrack] || 1), ordem: i + 1 }));
    try {
      await atualizarTracksDoPoolMusica(poolAtual.id, itens);
      avisar(`Faixas do pool "${poolAtual.nome}" atualizadas no rascunho.`);
      await onMudou();
    } catch (e) {
      reclamar(e, "Erro ao salvar faixas do pool.");
    }
  }

  function sortearTeste() {
    const candidatos = [...selecionadas].map((id) => ({ id, peso: Math.max(1, pesos[id] || 1) }));
    const soma = candidatos.reduce((s, c) => s + c.peso, 0);
    if (soma <= 0) return;
    let alvo = Math.random() * soma;
    for (const c of candidatos) {
      alvo -= c.peso;
      if (alvo <= 0) {
        const track = tracks.find((t) => t.id === c.id);
        setSorteioTeste(track?.nome ?? null);
        return;
      }
    }
  }

  return (
    <div className="flex gap-4">
      <div className="w-64 flex-shrink-0">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-bold text-white/70">Pools</span>
          <button type="button" onClick={() => setMostrarCriar((v) => !v)} className="text-xs text-[#F3B43F] hover:underline">
            + novo
          </button>
        </div>
        {mostrarCriar && (
          <div className="mb-3 flex flex-col gap-1 rounded border border-white/15 bg-white/5 p-2">
            <input value={novaKey} onChange={(e) => setNovaKey(e.target.value)} placeholder="key" className="rounded border border-white/20 bg-black/30 px-2 py-1 text-xs text-white" />
            <input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Nome" className="rounded border border-white/20 bg-black/30 px-2 py-1 text-xs text-white" />
            <button type="button" onClick={criarPool} className="rounded bg-green-600 px-2 py-1 text-xs font-bold text-white">
              Criar
            </button>
          </div>
        )}
        <ul className="flex flex-col gap-1">
          {pools.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setPoolSelecionado(p.id)}
                className={`w-full rounded px-3 py-2 text-left text-sm ${
                  poolSelecionado === p.id ? "bg-[#BC8418] text-black" : "text-white/70 hover:bg-white/10"
                }`}
              >
                {p.nome} {!p.ativo && "(inativo)"}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {poolAtual && (
        <div className="flex-1">
          <h3 className="mb-2 text-lg font-bold text-white">{poolAtual.nome}</h3>
          <div className="overflow-x-auto rounded-lg border border-white/15">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/10 text-white/60">
                <tr>
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2">Faixa</th>
                  <th className="px-3 py-2">Peso</th>
                  <th className="px-3 py-2">Probabilidade</th>
                </tr>
              </thead>
              <tbody>
                {tracks
                  .filter((t) => t.ativo)
                  .map((t) => {
                    const marcado = selecionadas.has(t.id);
                    const peso = pesos[t.id] || 1;
                    const pct = marcado && somaPesos > 0 ? ((peso / somaPesos) * 100).toFixed(1) : "0.0";
                    return (
                      <tr key={t.id} className="border-t border-white/10">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={marcado}
                            onChange={(e) => {
                              const novas = new Set(selecionadas);
                              if (e.target.checked) novas.add(t.id);
                              else novas.delete(t.id);
                              setSelecionadas(novas);
                            }}
                          />
                        </td>
                        <td className="px-3 py-2 text-white">{t.nome}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={1}
                            disabled={!marcado}
                            value={peso}
                            onChange={(e) => setPesos({ ...pesos, [t.id]: Math.max(1, Number(e.target.value) || 1) })}
                            className="w-20 rounded border border-white/20 bg-black/30 px-2 py-1 text-sm text-white disabled:opacity-30"
                          />
                        </td>
                        <td className="px-3 py-2 text-white/60">{pct}%</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" onClick={salvarMembership} className="rounded bg-[#BC8418] px-3 py-1.5 text-sm font-bold text-black">
              Salvar faixas do pool (rascunho)
            </button>
            <button type="button" onClick={sortearTeste} className="rounded border border-white/20 px-3 py-1.5 text-sm text-white/70 hover:bg-white/10">
              Sortear teste
            </button>
            {sorteioTeste && <span className="text-sm text-[#F3B43F]">Sorteada: {sorteioTeste}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Publicação ---

function AbaPublicacao({
  resumo,
  draft,
  onPublicado,
  avisar,
  reclamar,
}: {
  resumo: MusicResumoApi | null;
  draft: MusicDraftApi | null;
  onPublicado: () => Promise<void>;
  avisar: (t: string) => void;
  reclamar: (e: unknown, p: string) => void;
}) {
  const [validacao, setValidacao] = useState<{ valido: boolean; erros: string[] } | null>(null);
  const [notas, setNotas] = useState("");
  const [publicando, setPublicando] = useState(false);

  async function validar() {
    try {
      const r = await validarDraftMusica();
      setValidacao(r);
    } catch (e) {
      reclamar(e, "Erro ao validar rascunho.");
    }
  }

  async function publicar() {
    if (publicando) return; // trava clique duplo já no client; backend também é idempotente/atômico.
    setPublicando(true);
    try {
      const r = await publicarDraftMusica(notas || undefined);
      avisar(`Configuração v${r.version_number} publicada! Clientes conectados vão atualizar automaticamente.`);
      setValidacao(null);
      setNotas("");
      await onPublicado();
    } catch (e) {
      reclamar(e, "Erro ao publicar — corrija os erros de validação e tente de novo.");
    } finally {
      setPublicando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-white/15 bg-white/5 p-4">
        <p className="text-sm text-white/70">
          Rascunho <strong>v{resumo?.draftVersionNumber}</strong> tem{" "}
          <strong>{resumo?.alteracoesPendentes ?? 0}</strong> alteração(ões) em relação à versão publicada.
        </p>
        <div className="mt-2 max-h-64 overflow-y-auto rounded border border-white/10 bg-black/20 p-2 text-xs text-white/60">
          {draft?.assignments.map((a) => (
            <div key={a.slot_key}>
              <span className="font-mono">{a.slot_key}</span>: {a.assignment_type}
              {a.assignment_type === "TRACK" && a.track ? ` → ${a.track.nome}` : ""}
              {a.assignment_type === "POOL" && a.pool ? ` → pool ${a.pool.nome}` : ""}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={validar} className="rounded border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/10">
          Validar
        </button>
        <input
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Notas da publicação (opcional)"
          className="flex-1 rounded border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
        />
        <button
          type="button"
          onClick={publicar}
          disabled={publicando}
          className="rounded bg-[#BC8418] px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
        >
          {publicando ? "Publicando…" : `Publicar v${resumo?.draftVersionNumber ?? ""}`}
        </button>
      </div>

      {validacao && (
        <div className={`rounded-lg border p-3 text-sm ${validacao.valido ? "border-green-500/40 bg-green-500/10 text-green-300" : "border-red-500/40 bg-red-500/10 text-red-300"}`}>
          {validacao.valido ? (
            "Rascunho válido — pronto pra publicar."
          ) : (
            <ul className="list-disc pl-5">
              {validacao.erros.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// --- Histórico ---

function AbaHistorico({
  historico,
  onRestaurado,
  avisar,
  reclamar,
}: {
  historico: MusicHistoricoItemApi[];
  onRestaurado: () => Promise<void>;
  avisar: (t: string) => void;
  reclamar: (e: unknown, p: string) => void;
}) {
  async function restaurar(versionNumber: number) {
    if (!confirm(`Restaurar a v${versionNumber} como um NOVO rascunho? Isso substitui o rascunho atual (se houver).`)) return;
    try {
      const novoDraft = await restaurarVersaoMusica(versionNumber);
      avisar(`Criado o rascunho v${novoDraft.version_number} a partir da v${versionNumber} — revise e publique.`);
      await onRestaurado();
    } catch (e) {
      reclamar(e, "Erro ao restaurar versão.");
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/15">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/10 text-white/60">
          <tr>
            <th className="px-3 py-2">Versão</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Publicada em</th>
            <th className="px-3 py-2">Notas</th>
            <th className="px-3 py-2">Ação</th>
          </tr>
        </thead>
        <tbody>
          {historico.map((h) => (
            <tr key={h.id} className="border-t border-white/10">
              <td className="px-3 py-2 text-white">v{h.version_number}</td>
              <td className="px-3 py-2">
                <span className={h.status === "PUBLISHED" ? "text-green-400" : "text-white/40"}>{h.status}</span>
              </td>
              <td className="px-3 py-2 text-white/60">{h.published_at ? new Date(h.published_at).toLocaleString("pt-BR") : "—"}</td>
              <td className="px-3 py-2 text-white/50">{h.notes ?? "—"}</td>
              <td className="px-3 py-2">
                <button type="button" onClick={() => restaurar(h.version_number)} className="text-xs text-[#F3B43F] hover:underline">
                  Restaurar como rascunho
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
