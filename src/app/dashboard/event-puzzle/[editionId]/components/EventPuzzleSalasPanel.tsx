"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  listarBlueprintsPublicosEventPuzzle,
  mensagemDeErroEventPuzzle,
  type PuzzleBlueprintPublicoApi,
} from "@/lib/api/eventPuzzle";

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
      {salas.map((sala) => {
        const dominio = sala.layout?.dominio ?? null;
        return (
          <button
            key={sala.id_blueprint}
            type="button"
            disabled={sala.bloqueado}
            onClick={() => router.push(`/dashboard/event-puzzle/${editionId}/room/${sala.id_blueprint}`)}
            className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition ${
              sala.bloqueado
                ? "cursor-not-allowed border-white/10 bg-black/30 text-white/40"
                : "border-[#F3B43F]/40 bg-[#292018]/60 text-white hover:border-[#F3B43F] hover:bg-[#292018]"
            }`}
          >
            <span className="flex w-full items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-[#F3B43F]/70">
                {dominio ? ROTULO_DOMINIO[dominio] ?? dominio : `Câmara ${sala.ordem + 1}`}
              </span>
              {sala.bloqueado && <span aria-hidden>🔒</span>}
            </span>
            <span className="font-imFeel text-xl">{sala.titulo_publico}</span>
            {sala.bloqueado ? (
              <span className="text-xs text-white/40">Conclua a câmara anterior para desbloquear.</span>
            ) : (
              <>
                {sala.descricao_publica && <span className="text-sm text-white/60">{sala.descricao_publica}</span>}
                {sala.dificuldade && (
                  <span className="mt-1 rounded border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-widest text-white/50">
                    {sala.dificuldade}
                  </span>
                )}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
