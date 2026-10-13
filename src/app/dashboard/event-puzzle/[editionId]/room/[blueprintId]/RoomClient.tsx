"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePvpSocket } from "@/contexts/PvpSocketContext";
import { useToast } from "@/contexts/ToastContext";
import {
  listarBlueprintsPublicosEventPuzzle,
  criarOuObterInstanciaEventPuzzle,
  obterInstanciaEventPuzzle,
  executarAcaoEventPuzzle,
  abandonarInstanciaEventPuzzle,
  mensagemDeErroEventPuzzle,
  erroEhPuzzleJaConcluido,
  type PuzzleBlueprintPublicoApi,
  type PuzzleInstanceRuntimeApi,
  type PuzzleAcaoApi,
  type PuzzleObjectivoProgressivoApi,
  type PistaDesbloqueadaApi,
  type ConquistaPioneiraApi,
  type RecompensaConcedidaApi,
} from "@/lib/api/eventPuzzle";
import MechanicalPuzzleScene from "@/components/puzzle/mechanical/MechanicalPuzzleScene";
import type { PuzzleMecanicoConfig, PuzzleMecanicoEstadoPublico } from "@/components/puzzle/mechanical/types";
import OpticalPuzzleScene from "@/components/puzzle/optical/OpticalPuzzleScene";
import type { PuzzleOpticoConfig, PuzzleOpticoEstadoPublico } from "@/components/puzzle/optical/types";
import HydraulicPuzzleScene from "@/components/puzzle/hydraulic/HydraulicPuzzleScene";
import type { PuzzleHidraulicoConfig, PuzzleHidraulicoEstadoPublico } from "@/components/puzzle/hydraulic/types";
import ConvergencePuzzleScene from "@/components/puzzle/convergence/ConvergencePuzzleScene";
import type { PuzzleConvergenciaConfig, PuzzleConvergenciaEstadoPublico } from "@/components/puzzle/convergence/ConvergencePuzzleScene";
import { classificarObjetivoVisual, textoVisivelDoObjetivo } from "@/hooks/eventPuzzleSalaEstado";

const STATUS_TERMINAIS_SUCESSO = new Set(["COMPLETED"]);
const STATUS_TERMINAIS = new Set(["COMPLETED", "FAILED", "ABANDONED", "EXPIRED"]);

interface ResumoFinal {
  pistas: PistaDesbloqueadaApi[];
  conquistas: ConquistaPioneiraApi[];
  recompensas: RecompensaConcedidaApi[];
}

// "O Coração da Máquina Celestial" — Fase 16. Página de jogo real de
// UMA sala: cria/retoma a PuzzleInstance (idempotente), monta
// {config, estado} a partir de `layout` (topologia, do blueprint
// público) + `state` (dinâmico, do dtoRuntime) e entrega pro renderer
// certo por domínio — os quatro renderers (MECANICO/OPTICO/HIDRAULICO/
// CONVERGENCIA) já são 100% interativos (Fases 4/5/6/7), então esta
// página só faz a plumbing: POST real em cada clique, stateVersion
// sempre o último conhecido, socket só pra resync/feedback de outros
// espectadores (SOLO hoje).
export default function RoomClient({ editionId, blueprintId }: { editionId: number; blueprintId: number }) {
  const router = useRouter();
  const { mostrarInfo, mostrarSucesso, mostrarErro } = useToast();
  const { estadoSalaPuzzle, erroSalaPuzzle, entrarNaSalaPuzzle, sairDaSalaPuzzle, limparSalaPuzzle, limparErroSalaPuzzle, realtimeReady } =
    usePvpSocket();

  const [blueprint, setBlueprint] = useState<PuzzleBlueprintPublicoApi | null>(null);
  const [instancia, setInstancia] = useState<PuzzleInstanceRuntimeApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [abandonando, setAbandonando] = useState(false);
  const [resumoFinal, setResumoFinal] = useState<ResumoFinal>({ pistas: [], conquistas: [], recompensas: [] });
  // Correção de lifecycle — "sala concluída permanece concluída": se a
  // listagem já diz `concluido: true` ANTES de qualquer tentativa de
  // criar/obter Instance, esta página nunca chama
  // criarOuObterInstanciaEventPuzzle — mostra direto a tela de câmara
  // concluída (histórico), sem risco de 409/efeito colateral nenhum.
  const [reentradaEmSalaConcluida, setReentradaEmSalaConcluida] = useState(false);
  const [proximaSala, setProximaSala] = useState<{ idBlueprint: number; nome: string } | null>(null);

  const stateVersionRef = useRef(0);
  const entrouNaSalaRef = useRef(false);

  const aplicarEstado = useCallback(
    (
      dto: PuzzleInstanceRuntimeApi,
      opcoes: { pistas?: PistaDesbloqueadaApi[]; conquistas?: ConquistaPioneiraApi[]; recompensas?: RecompensaConcedidaApi[]; toast?: boolean } = {},
    ) => {
      const { pistas = [], conquistas = [], recompensas = [], toast = true } = opcoes;
      setInstancia(dto);
      stateVersionRef.current = dto.state_version;
      if (pistas.length || conquistas.length || recompensas.length) {
        setResumoFinal((atual) => ({
          pistas: [...atual.pistas, ...pistas],
          conquistas: [...atual.conquistas, ...conquistas],
          recompensas: [...atual.recompensas, ...recompensas],
        }));
      }
      if (!toast) return;
      for (const pista of pistas) mostrarInfo(`Nova pista no Caderno: ${pista.titulo}`);
      for (const conquista of conquistas) mostrarSucesso(`Você se tornou Pioneiro! #${conquista.posicao} — ${conquista.titulo}`);
      for (const recompensa of recompensas) {
        const partes = [recompensa.ouro > 0 ? `+${recompensa.ouro} ouro` : null, recompensa.xp > 0 ? `+${recompensa.xp} xp` : null].filter(Boolean);
        mostrarSucesso(`${recompensa.titulo}${partes.length ? ` (${partes.join(", ")})` : ""}`);
      }
    },
    [mostrarInfo, mostrarSucesso],
  );

  // Acha a próxima sala (`ordem` imediatamente depois) e devolve só se
  // ela já está desbloqueada — usado tanto na reentrada numa sala já
  // concluída quanto no feedback imediato de conclusão (seção 9/23):
  // nunca inventa isso no cliente, sempre releitura real da listagem
  // autoritativa.
  const buscarProximaSala = useCallback(async () => {
    try {
      const salas = await listarBlueprintsPublicosEventPuzzle(editionId);
      const atual = salas.find((s) => s.id_blueprint === blueprintId);
      if (!atual) return null;
      const proxima = salas.find((s) => s.ordem === atual.ordem + 1);
      if (!proxima || proxima.bloqueado) return null;
      return { idBlueprint: proxima.id_blueprint, nome: proxima.titulo_publico };
    } catch {
      return null; // best-effort — nunca impede "Voltar às câmaras".
    }
  }, [editionId, blueprintId]);

  // Carrega o teaser/layout da sala (pra saber o domínio e desenhar a
  // topologia) e cria/retoma a PuzzleInstance — nessa ordem, porque
  // `layout` só existe na resposta pública quando a sala já está
  // desbloqueada (ver dtoPublicoLayout no backend).
  //
  // Correção de lifecycle (seção 2/6/7 da correção): se a listagem já
  // diz `concluido: true`, esta página NUNCA chama
  // criarOuObterInstanciaEventPuzzle — nunca cria réplica, nunca corre
  // o risco de reabrir nada. O card da lista (EventPuzzleSalasPanel) já
  // não oferece "Entrar" numa sala concluída, mas esta página também
  // não confia só na UI de origem (alguém pode digitar a URL direto,
  // voltar pelo histórico do navegador, ou abrir de um link salvo).
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const salas = await listarBlueprintsPublicosEventPuzzle(editionId);
        const sala = salas.find((s) => s.id_blueprint === blueprintId) ?? null;
        if (!ativo) return;
        setBlueprint(sala);
        if (!sala || sala.bloqueado || !sala.layout) {
          setErroCarregamento(!sala ? "Câmara não encontrada." : "Esta câmara ainda está bloqueada.");
          setCarregando(false);
          return;
        }
        if (sala.concluido) {
          setReentradaEmSalaConcluida(true);
          const proxima = await buscarProximaSala();
          if (!ativo) return;
          setProximaSala(proxima);
          setCarregando(false);
          return;
        }
        const { instancia: dto } = await criarOuObterInstanciaEventPuzzle(editionId, blueprintId);
        if (!ativo) return;
        aplicarEstado(dto, { toast: false });
      } catch (erro) {
        if (!ativo) return;
        // Cliente desatualizado (sala concluída entre a listagem e a
        // tentativa de criar/obter) — nunca quebra a tela, cai na
        // mesma tela de "já concluída" em vez de propagar o 409 cru.
        if (erroEhPuzzleJaConcluido(erro)) {
          setReentradaEmSalaConcluida(true);
          const proxima = await buscarProximaSala();
          if (ativo) setProximaSala(proxima);
        } else {
          setErroCarregamento(mensagemDeErroEventPuzzle(erro, "Não foi possível abrir esta câmara."));
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editionId, blueprintId]);

  // Feedback imediato de conclusão (seção 9/23) — assim que a ação
  // devolve `status: "COMPLETED"`, descobre a próxima sala (se já
  // desbloqueada) pra oferecer "Continuar" sem precisar de F5/sair-e-
  // entrar. `instancia` já reflete a conclusão nesse ponto porque
  // `aplicarEstado` já rodou antes deste efeito disparar.
  useEffect(() => {
    if (instancia?.status !== "COMPLETED" || proximaSala) return;
    let ativo = true;
    (async () => {
      const proxima = await buscarProximaSala();
      if (ativo) setProximaSala(proxima);
    })();
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instancia?.status]);

  // Entra na sala do socket assim que a instância e a conexão em tempo
  // real estiverem prontas — puro feedback/resync (ver comentário de
  // eventPuzzleSocket.js), nunca a autoridade da ação.
  useEffect(() => {
    if (!instancia || !realtimeReady || entrouNaSalaRef.current) return;
    entrouNaSalaRef.current = true;
    entrarNaSalaPuzzle(instancia.id);
  }, [instancia, realtimeReady, entrarNaSalaPuzzle]);

  useEffect(() => {
    return () => {
      sairDaSalaPuzzle();
      limparSalaPuzzle();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resync/feedback via socket — só aplica quando é realmente mais novo
  // que o que já temos (evita re-toastar a resposta da NOSSA própria
  // ação, que chega duas vezes: direto no retorno do POST e de volta
  // pelo broadcast da sala).
  useEffect(() => {
    if (!estadoSalaPuzzle || !instancia) return;
    if (estadoSalaPuzzle.instancia.id !== instancia.id) return;
    if (estadoSalaPuzzle.instancia.state_version <= stateVersionRef.current) return;
    aplicarEstado(estadoSalaPuzzle.instancia, {
      pistas: estadoSalaPuzzle.pistasDesbloqueadas,
      conquistas: estadoSalaPuzzle.conquistasPioneiras,
      recompensas: estadoSalaPuzzle.recompensasConcedidas,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoSalaPuzzle]);

  const onAction = useCallback(
    async (acao: PuzzleAcaoApi) => {
      if (!instancia) return;
      setErroAcao(null);
      try {
        const resultado = await executarAcaoEventPuzzle(instancia.id, acao, stateVersionRef.current);
        aplicarEstado(resultado.instancia, {
          pistas: resultado.pistasDesbloqueadas,
          conquistas: resultado.conquistasPioneiras,
          recompensas: resultado.recompensasConcedidas,
        });
      } catch (erro) {
        const status = (erro as { response?: { status?: number } })?.response?.status;
        setErroAcao(mensagemDeErroEventPuzzle(erro, "Não foi possível executar essa ação."));
        if (status === 409) {
          try {
            const atualizado = await obterInstanciaEventPuzzle(instancia.id);
            aplicarEstado(atualizado, { toast: false });
          } catch {
            /* resync best-effort — o erro já apareceu acima */
          }
        }
      }
    },
    [instancia, aplicarEstado],
  );

  const onAbandonar = useCallback(async () => {
    if (!instancia || abandonando) return;
    setAbandonando(true);
    try {
      const dto = await abandonarInstanciaEventPuzzle(instancia.id, stateVersionRef.current);
      aplicarEstado(dto, { toast: false });
    } catch (erro) {
      mostrarErro(mensagemDeErroEventPuzzle(erro, "Não foi possível abandonar esta câmara."));
    } finally {
      setAbandonando(false);
    }
  }, [instancia, abandonando, aplicarEstado, mostrarErro]);

  const dominio = blueprint?.layout?.dominio ?? null;
  // Fonte dos objectives pro painel de progresso (seção 12 — "não basta
  // esconder só no React"): SEMPRE `instancia.objectivesProgressivos`
  // quando existe uma Instance de verdade (reflete o progresso atual,
  // atualizado a cada ação/resync); só cai pro `blueprint.layout.
  // objectives` (snapshot da listagem) quando ainda não há Instance —
  // nunca o contrário, nunca uma mistura dos dois.
  const objetivos: PuzzleObjectivoProgressivoApi[] = instancia?.objectivesProgressivos ?? blueprint?.layout?.objectives ?? [];

  const { configCena, estadoCena } = useMemo(() => {
    if (!blueprint?.layout || !instancia) return { configCena: null, estadoCena: null };
    const base = { components: blueprint.layout.components, connections: blueprint.layout.connections, objectives: blueprint.layout.objectives };
    const estado = { components: instancia.state.components, objetivosConcluidos: instancia.state.objetivosConcluidos };
    return { configCena: base, estadoCena: estado };
  }, [blueprint, instancia]);

  if (carregando) {
    return <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-white">Abrindo a câmara...</div>;
  }

  // Reentrada numa sala já concluída (seção 2/6/23) — nunca cria
  // Instance nenhuma, nunca mostra "Entrar" de novo. F5 cai exatamente
  // aqui de novo (a listagem que acabamos de reler já confirma
  // `concluido: true` persistido no backend, nunca um estado local
  // perdido). Objectives do `layout` já vêm 100% revelados pro backend
  // (sala concluída = tudo concluído), então o checklist mostra tudo
  // marcado, nunca "???".
  if (reentradaEmSalaConcluida && blueprint) {
    const objetivosConcluidos = blueprint.layout?.objectives ?? [];
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-green-500/50 bg-[#292018]/80 p-8 text-center text-white">
        <h2 className="font-imFeel text-3xl text-green-400">✓ Câmara concluída</h2>
        <p className="text-white/70">
          {blueprint.titulo_publico} já foi restaurada.
          {blueprint.completed_at ? ` Concluída em ${new Date(blueprint.completed_at).toLocaleDateString("pt-BR")}.` : ""}
        </p>
        {objetivosConcluidos.length > 0 && (
          <div className="flex w-full max-w-md flex-col gap-1.5 text-left">
            {objetivosConcluidos.map((o) => (
              <span key={o.id} className="rounded-md border border-green-500/40 bg-green-500/10 px-2.5 py-1 text-xs text-green-300">
                ✓ {textoVisivelDoObjetivo(o)}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {proximaSala && (
            <button
              type="button"
              onClick={() => router.push(`/dashboard/event-puzzle/${editionId}/room/${proximaSala.idBlueprint}`)}
              className="rounded-lg bg-[#F3B43F] px-6 py-2.5 font-bold text-black hover:bg-[#d89f2e]"
            >
              Continuar → {proximaSala.nome}
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push(`/dashboard/event-puzzle/${editionId}`)}
            className="rounded-lg bg-[#BC8418] px-6 py-2.5 font-bold text-black hover:bg-[#a5710f]"
          >
            Voltar às câmaras
          </button>
        </div>
      </div>
    );
  }

  if (erroCarregamento || !blueprint || !configCena || !estadoCena || !instancia) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-center text-red-400">
        <p>{erroCarregamento || "Não foi possível abrir esta câmara."}</p>
        <button
          type="button"
          onClick={() => router.push(`/dashboard/event-puzzle/${editionId}`)}
          className="mx-auto rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black hover:bg-[#a5710f]"
        >
          Voltar às câmaras
        </button>
      </div>
    );
  }

  const concluida = STATUS_TERMINAIS_SUCESSO.has(instancia.status);
  const terminalSemSucesso = STATUS_TERMINAIS.has(instancia.status) && !concluida;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-[#F3B43F]/40 bg-[#292018]/60 p-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#F3B43F]/70">{blueprint.titulo_publico}</p>
            <h1 className="font-imFeel text-2xl text-[#F3B43F]">{blueprint.nome}</h1>
          </div>
          {!STATUS_TERMINAIS.has(instancia.status) && (
            <button
              type="button"
              onClick={onAbandonar}
              disabled={abandonando}
              className="rounded-lg border border-red-400/50 px-3 py-1.5 text-sm text-red-300 transition hover:bg-red-950/40 disabled:opacity-50"
            >
              {abandonando ? "Abandonando..." : "Abandonar câmara"}
            </button>
          )}
        </div>
        {erroSalaPuzzle && (
          <p className="mt-2 text-xs text-red-400">
            {erroSalaPuzzle}{" "}
            <button type="button" onClick={limparErroSalaPuzzle} className="underline">
              ok
            </button>
          </p>
        )}
      </div>

      {/* Apresentação PROGRESSIVA dos objectives (seção 12 da correção)
          — só concluídos + o atual mostram a própria descrição; um
          objective futuro nunca aparece com `descricao` nenhuma (o
          backend já corta isso na origem, ver
          puzzleBlueprintService.projetarObjectivosProgressivos), então
          esta UI NUNCA inventa texto pra ele — só "???". */}
      {dominio !== "CONVERGENCIA" && objetivos.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-lg border border-white/10 bg-black/30 p-3">
          {objetivos.map((o) => {
            const classe = classificarObjetivoVisual(o);
            const texto = textoVisivelDoObjetivo(o);
            return (
              <span
                key={o.id}
                className={`rounded-md border px-2.5 py-1 text-xs ${
                  classe === "CONCLUIDO"
                    ? "border-green-500/50 bg-green-500/10 text-green-300"
                    : classe === "ATUAL"
                      ? "border-[#F3B43F]/50 bg-[#F3B43F]/10 text-[#F3B43F]"
                      : "border-white/15 text-white/35"
                }`}
              >
                {classe === "CONCLUIDO" ? "✓" : classe === "ATUAL" ? "○" : "?"} {texto}
              </span>
            );
          })}
        </div>
      )}

      {!concluida && !terminalSemSucesso && (
        <RendererPorDominio dominio={dominio} config={configCena} estado={estadoCena} onAction={onAction} erro={erroAcao} />
      )}

      {(concluida || terminalSemSucesso) && (
        <div
          className={`flex flex-col items-center gap-4 rounded-2xl border-2 p-8 text-center text-white ${
            concluida ? "border-green-500/60 bg-[#1c2a1c]/80" : "border-[#F3B43F]/60 bg-[#292018]/80"
          }`}
        >
          <h2 className={`font-imFeel text-3xl ${concluida ? "text-green-400" : "text-[#F3B43F]"}`}>
            {concluida ? "✓ Câmara concluída" : instancia.status === "ABANDONED" ? "Câmara abandonada" : "A câmara se fechou"}
          </h2>
          {concluida && <p className="text-white/70">{blueprint.titulo_publico} restaurada.</p>}
          {concluida && (resumoFinal.pistas.length > 0 || resumoFinal.conquistas.length > 0 || resumoFinal.recompensas.length > 0) && (
            <div className="flex w-full max-w-md flex-col gap-2 text-left">
              {resumoFinal.pistas.map((p, i) => (
                <p key={`pista-${i}`} className="rounded-lg border border-white/10 bg-black/20 p-2 text-sm text-white/80">
                  📖 Nova pista: <span className="font-bold">{p.titulo}</span>
                </p>
              ))}
              {resumoFinal.conquistas.map((c, i) => (
                <p key={`conquista-${i}`} className="rounded-lg border border-[#F3B43F]/30 bg-black/20 p-2 text-sm text-white/80">
                  🏆 Pioneiro #{c.posicao}: <span className="font-bold">{c.titulo}</span>
                </p>
              ))}
              {resumoFinal.recompensas.map((r, i) => (
                <p key={`recompensa-${i}`} className="rounded-lg border border-green-500/30 bg-black/20 p-2 text-sm text-white/80">
                  🎁 <span className="font-bold">{r.titulo}</span>
                  {r.ouro > 0 ? ` · +${r.ouro} ouro` : ""}
                  {r.xp > 0 ? ` · +${r.xp} xp` : ""}
                </p>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {concluida && proximaSala && (
              <button
                type="button"
                onClick={() => router.push(`/dashboard/event-puzzle/${editionId}/room/${proximaSala.idBlueprint}`)}
                className="rounded-lg bg-[#F3B43F] px-6 py-2.5 font-bold text-black hover:bg-[#d89f2e]"
              >
                Continuar → {proximaSala.nome}
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push(`/dashboard/event-puzzle/${editionId}`)}
              className="rounded-lg bg-[#BC8418] px-6 py-2.5 font-bold text-black hover:bg-[#a5710f]"
            >
              Voltar às câmaras
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RendererPorDominio({
  dominio,
  config,
  estado,
  onAction,
  erro,
}: {
  dominio: string | null;
  config: { components: unknown[]; connections: unknown[] };
  estado: { components: Record<string, unknown>; objetivosConcluidos: string[] };
  onAction: (acao: PuzzleAcaoApi) => void;
  erro: string | null;
}) {
  if (dominio === "MECANICO") {
    return (
      <MechanicalPuzzleScene
        config={config as unknown as PuzzleMecanicoConfig}
        estado={estado as unknown as PuzzleMecanicoEstadoPublico}
        onAction={onAction}
        erro={erro}
      />
    );
  }
  if (dominio === "OPTICO") {
    return (
      <OpticalPuzzleScene
        config={config as unknown as PuzzleOpticoConfig}
        estado={estado as unknown as PuzzleOpticoEstadoPublico}
        onAction={onAction}
        erro={erro}
      />
    );
  }
  if (dominio === "HIDRAULICO") {
    return (
      <HydraulicPuzzleScene
        config={config as unknown as PuzzleHidraulicoConfig}
        estado={estado as unknown as PuzzleHidraulicoEstadoPublico}
        onAction={onAction}
        erro={erro}
      />
    );
  }
  if (dominio === "CONVERGENCIA") {
    return (
      <ConvergencePuzzleScene
        config={config as unknown as PuzzleConvergenciaConfig}
        estado={estado as unknown as PuzzleConvergenciaEstadoPublico}
        onAction={onAction}
        erro={erro}
      />
    );
  }
  return <div className="rounded-lg border border-white/10 bg-black/30 p-6 text-center text-white/50">Domínio de puzzle desconhecido: {dominio ?? "?"}</div>;
}
