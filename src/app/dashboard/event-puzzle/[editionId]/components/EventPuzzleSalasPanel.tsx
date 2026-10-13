"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  listarBlueprintsPublicosEventPuzzle,
  mensagemDeErroEventPuzzle,
  type PuzzleBlueprintPublicoApi,
} from "@/lib/api/eventPuzzle";
import { decidirEstadoVisualDaSala } from "@/hooks/eventPuzzleSalaEstado";

const ROTULO_DOMINIO: Record<string, string> = {
  MECANICO: "Câmara Mecânica",
  OPTICO: "Câmara Óptica",
  HIDRAULICO: "Câmara Hidráulica",
  CONVERGENCIA: "Núcleo da Convergência",
};

// "O Coração da Máquina Celestial" — Fase 12/16. Lista as salas
// (blueprints) da edição, na ordem da progressão. Bloqueadas nunca
// trazem `layout` (allowlist já aplicada pelo backend —
// dtoPublicoLayout) — aqui elas só aparecem com cadeado + título/
// descrição/dificuldade (teaser), nunca clicáveis.
export default function EventPuzzleSalasPanel({ editionId }: { editionId: number }) {
  const router = useRouter();
  const [salas, setSalas] = useState<PuzzleBlueprintPublicoApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    try {
      const resposta = await listarBlueprintsPublicosEventPuzzle(editionId);
      setSalas(resposta);
    } catch (erroOriginal) {
      setErro(mensagemDeErroEventPuzzle(erroOriginal, "Não foi possível carregar as câmaras do autômato."));
    } finally {
      setCarregando(false);
    }
  }, [editionId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (carregando) {
    return <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-white">Mapeando as câmaras do autômato...</div>;
  }

  if (erro) {
    return <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-red-400">{erro}</div>;
  }

  if (salas.length === 0) {
    return <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-white/60">Nenhuma câmara publicada ainda.</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {salas.map((sala) => (
        <SalaCard key={sala.id_blueprint} sala={sala} editionId={editionId} router={router} />
      ))}
    </div>
  );
}

// Correção de lifecycle/UX — os QUATRO estados visuais da sala,
// prioridade sempre: bloqueada → concluída → em andamento →
// disponível (nunca ambíguo, nunca inferido tentando criar uma
// instância — o backend já manda `bloqueado`/`concluido`/
// `em_andamento` prontos em listarBlueprintsPublicosEventPuzzle).
// Uma sala CONCLUÍDA nunca mostra o botão "Entrar" normal nem cria
// nova tentativa ao clicar no card — o clique principal só NAVEGA pra
// ver a câmara (RoomClient decide sozinho, pela mesma `sala.concluido`,
// nunca chamar criarOuObterInstancia). Se `replayable` vier true no
// futuro, uma ação SECUNDÁRIA explícita ("Refazer") aparece — nunca
// reinício automático.
function SalaCard({
  sala,
  editionId,
  router,
}: {
  sala: PuzzleBlueprintPublicoApi;
  editionId: number;
  router: ReturnType<typeof useRouter>;
}) {
  const dominio = sala.layout?.dominio ?? null;
  const rotulo = dominio ? ROTULO_DOMINIO[dominio] ?? dominio : `Câmara ${sala.ordem + 1}`;
  const navegar = () => router.push(`/dashboard/event-puzzle/${editionId}/room/${sala.id_blueprint}`);

  const decisao = decidirEstadoVisualDaSala(sala);

  if (decisao.estado === "BLOQUEADA") {
    return (
      <div className="flex cursor-not-allowed flex-col items-start gap-1 rounded-xl border border-white/10 bg-black/30 p-4 text-left text-white/40">
        <span className="flex w-full items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-[#F3B43F]/70">{rotulo}</span>
          <span aria-hidden>🔒</span>
        </span>
        <span className="font-imFeel text-xl">{sala.titulo_publico}</span>
        <span className="rounded border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-widest text-white/50">{decisao.rotulo}</span>
        <span className="text-xs text-white/40">Conclua a câmara anterior para desbloquear.</span>
      </div>
    );
  }

  const concluida = decisao.estado === "CONCLUIDA";
  const emAndamento = decisao.estado === "EM_ANDAMENTO";

  return (
    <button
      type="button"
      onClick={decisao.clicavel ? navegar : undefined}
      disabled={!decisao.clicavel}
      className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition ${
        concluida
          ? "border-green-500/40 bg-[#1c2a1c]/60 text-white hover:border-green-400 hover:bg-[#1c2a1c]"
          : "border-[#F3B43F]/40 bg-[#292018]/60 text-white hover:border-[#F3B43F] hover:bg-[#292018]"
      }`}
    >
      <span className="flex w-full items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-[#F3B43F]/70">{rotulo}</span>
        <span
          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
            concluida ? "bg-green-500/20 text-green-300" : emAndamento ? "bg-[#F3B43F]/20 text-[#F3B43F]" : "text-white/50"
          }`}
        >
          {decisao.rotulo}
        </span>
      </span>
      <span className="font-imFeel text-xl">{sala.titulo_publico}</span>
      {sala.descricao_publica && <span className="text-sm text-white/60">{sala.descricao_publica}</span>}
      <span className="mt-1 flex flex-wrap items-center gap-2">
        {sala.dificuldade && (
          <span className="rounded border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-widest text-white/50">
            {sala.dificuldade}
          </span>
        )}
        {concluida && sala.completed_at && (
          <span className="text-[10px] text-white/40">Concluída em {new Date(sala.completed_at).toLocaleDateString("pt-BR")}</span>
        )}
      </span>
      {decisao.mostrarRefazer && (
        <span
          role="button"
          tabIndex={0}
          onClick={(evento) => {
            evento.stopPropagation();
            navegar();
          }}
          className="mt-1 rounded-lg border border-white/20 px-3 py-1 text-xs text-white/70 hover:border-[#F3B43F] hover:text-[#F3B43F]"
        >
          Refazer
        </span>
      )}
    </button>
  );
}
