"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axiosInstance from "@/utils/axiosIntance";

interface PatchNote {
  id: number;
  feature: string;
  versao: string;
  titulo: string;
  descricao: string;
  publicado_em: string;
}

// Sino de novidades — fica sempre visível no topo do menu (não dentro
// de uma página que o jogador precisa lembrar de visitar). O badge
// mostra quanto ainda não foi visto; abrir o painel marca tudo como
// visto na hora (POST /mark-seen), então o badge some assim que o
// jogador realmente olhou a lista, não só quando clicou no sino.
export default function PatchNotesBell() {
  const [notas, setNotas] = useState<PatchNote[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [mostrarAviso, setMostrarAviso] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{
        data?: { notas?: PatchNote[]; quantidade_nao_lida?: number };
      }>("/patch-notes");
      const naoLidasAgora = resp.data?.data?.quantidade_nao_lida ?? 0;
      setNotas(resp.data?.data?.notas ?? []);
      setNaoLidas(naoLidasAgora);

      // Aviso automático ao entrar no jogo, 1x por sessão de navegador
      // (sessionStorage) — o sino continua disponível o resto do tempo
      // pra quem fechar o aviso e quiser ver depois.
      if (naoLidasAgora > 0) {
        try {
          if (!sessionStorage.getItem("patchNotesAvisoMostrado")) {
            sessionStorage.setItem("patchNotesAvisoMostrado", "1");
            setMostrarAviso(true);
          }
        } catch {
          // sessionStorage indisponível (aba privada etc.) — sem aviso
          // automático, mas o sino continua funcionando normalmente.
        }
      }
    } catch (error) {
      console.error("Erro ao buscar patch notes:", error);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function abrir() {
    setAberto(true);
    setMostrarAviso(false);
    if (naoLidas === 0) return;
    setCarregando(true);
    try {
      await axiosInstance.post("/patch-notes/mark-seen");
      setNaoLidas(0);
    } catch (error) {
      console.error("Erro ao marcar patch notes como vistas:", error);
    } finally {
      setCarregando(false);
    }
  }

  // O sino vive dentro do <nav> do menu, que tem `transform` (pra
  // animação de abrir/fechar no mobile) — um ancestral com transform
  // vira o "viewport" de qualquer `position: fixed` dentro dele, então
  // o aviso/modal apareciam presos dentro da sidebar em vez de
  // centralizados na tela. Portal pra body escapa desse problema.
  const overlays = (
    <>
      {mostrarAviso && (
        <div className="fixed left-1/2 top-4 z-[110] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-xl border-2 border-[#F3B43F] bg-[#292018] p-3 text-white shadow-2xl">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm">
              <span className="font-bold text-[#F3B43F]">
                {naoLidas} novidade{naoLidas > 1 ? "s" : ""}
              </span>{" "}
              desde sua última visita.
            </p>
            <button
              type="button"
              onClick={() => setMostrarAviso(false)}
              className="shrink-0 text-white/50 hover:text-white"
              aria-label="Fechar aviso"
            >
              ✕
            </button>
          </div>
          <button
            type="button"
            onClick={abrir}
            className="mt-2 rounded-lg bg-[#F3B43F] px-3 py-1 text-xs font-bold text-black transition hover:bg-[#e0a52f]"
          >
            Ver o que mudou
          </button>
        </div>
      )}

      {aberto && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setAberto(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-6 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-imFeel text-3xl">Novidades</h2>
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="rounded-lg px-2 py-1 text-white/60 hover:bg-white/10 hover:text-white"
              >
                Fechar
              </button>
            </div>

            {notas.length === 0 ? (
              <p className="text-sm text-white/60">Nenhuma novidade registrada ainda.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {notas.map((nota) => (
                  <div
                    key={nota.id}
                    className="rounded-xl border border-[#F3B43F]/30 bg-[#3a2f24] p-4"
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#F3B43F] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
                        {nota.feature} v{nota.versao}
                      </span>
                      <span className="text-[10px] text-white/40">
                        {new Date(nota.publicado_em).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <p className="font-bold">{nota.titulo}</p>
                    <p className="mt-1 text-sm text-white/70">{nota.descricao}</p>
                  </div>
                ))}
              </div>
            )}
            {carregando && <p className="mt-3 text-xs text-white/40">Marcando como lido...</p>}
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/30 bg-black/10 text-[#292018] transition hover:bg-black/20"
        aria-label="Novidades do jogo"
        title="Novidades do jogo"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M12 22a2.2 2.2 0 0 0 2.2-2.2h-4.4A2.2 2.2 0 0 0 12 22Zm7-6.2V11a7 7 0 0 0-5.6-6.86V3a1.4 1.4 0 1 0-2.8 0v1.14A7 7 0 0 0 5 11v4.8L3 17.8V19h18v-1.2Z" />
        </svg>
        {naoLidas > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#BC8418] bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </button>

      {typeof document !== "undefined" && createPortal(overlays, document.body)}
    </>
  );
}
