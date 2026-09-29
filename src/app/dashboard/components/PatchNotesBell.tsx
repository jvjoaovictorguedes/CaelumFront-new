"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axiosInstance from "@/utils/axiosIntance";
import { resolveMediaUrl } from "@/utils/media-url";

interface PatchNote {
  id: number;
  feature: string;
  versao: string;
  titulo: string;
  descricao: string;
  resumo: string | null;
  imagem_url: string | null;
  destaque: boolean;
  publicado_em: string;
}

// Ícone por categoria — mapeamento simples por palavra-chave em cima do
// `feature` (texto livre, sem taxonomia fixa no banco — ver
// adminPatchNoteService.js). Cai num símbolo genérico quando nada bate,
// então nunca fica sem ícone nenhum.
const ICONES_POR_PALAVRA: { palavras: string[]; icone: string }[] = [
  { palavras: ["pesca"], icone: "🎣" },
  { palavras: ["marca", "identidade", "visual", "caelum"], icone: "🛡" },
  { palavras: ["guilda", "diário", "diario", "jornal"], icone: "📜" },
  { palavras: ["classe", "evolução", "evolucao"], icone: "⚔" },
  { palavras: ["combate", "monstro", "poder"], icone: "🗡" },
  { palavras: ["mercado", "loja", "economia"], icone: "💰" },
  { palavras: ["cadastro", "registro", "indicação", "indicacao"], icone: "✉" },
  { palavras: ["personagem", "perfil", "progresso", "xp"], icone: "⭐" },
];

function iconePorFeature(feature: string): string {
  const normalizado = feature.toLowerCase();
  return ICONES_POR_PALAVRA.find((entrada) => entrada.palavras.some((p) => normalizado.includes(p)))?.icone ?? "✦";
}

function formatarDataLonga(data: string): string {
  return new Date(data).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

// Pergaminho das Atualizações — fica sempre visível no topo do menu
// (não dentro de uma página que o jogador precisa lembrar de visitar).
// O badge mostra quanto ainda não foi visto; abrir o painel marca tudo
// como visto na hora (POST /mark-seen), então o badge some assim que o
// jogador realmente olhou a lista, não só quando clicou no sino.
//
// A versão mais recente (todas as notas com o mesmo `versao` da nota
// mais nova) ganha um layout de "capa" — uma nota marcada `destaque`
// vira o card de abertura ("O mundo mudou.") e as demais da mesma
// versão viram os blocos por categoria. Notas de versões antigas
// continuam listadas abaixo, no formato compacto de sempre.
export default function PatchNotesBell() {
  const [notas, setNotas] = useState<PatchNote[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [mostrarAviso, setMostrarAviso] = useState(false);
  const [mostrarAntigas, setMostrarAntigas] = useState(false);

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
      console.error("Erro ao buscar o Pergaminho das Atualizações:", error);
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
      console.error("Erro ao marcar o Pergaminho das Atualizações como lido:", error);
    } finally {
      setCarregando(false);
    }
  }

  const versaoAtual = notas[0]?.versao;
  const notasVersaoAtual = versaoAtual ? notas.filter((n) => n.versao === versaoAtual) : [];
  const notasAntigas = versaoAtual ? notas.filter((n) => n.versao !== versaoAtual) : [];
  const capa = notasVersaoAtual.find((n) => n.destaque) ?? notasVersaoAtual[0];
  const blocos = notasVersaoAtual.filter((n) => n.id !== capa?.id);

  // O sino vive dentro do <nav> do menu, que tem `transform` (pra
  // animação de abrir/fechar no mobile) — um ancestral com transform
  // vira o "viewport" de qualquer `position: fixed` dentro dele, então
  // o aviso/modal apareciam presos dentro da sidebar em vez de
  // centralizados na tela. Portal pra body escapa desse problema.
  const overlays = (
    <>
      {mostrarAviso && (
        <div className="fixed left-1/2 top-20 z-[110] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-xl border-2 border-[#F3B43F] bg-[#292018] p-3 text-white shadow-2xl sm:top-4">
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
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#1b140d] text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b-2 border-[#F3B43F]/40 p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#F3B43F]">Caelum</p>
                <h2 className="font-imFeel text-3xl leading-tight text-white">Pergaminho das Atualizações</h2>
                {capa && (
                  <p className="mt-1 text-xs text-white/50">
                    v{capa.versao} · {formatarDataLonga(capa.publicado_em)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="shrink-0 rounded-lg px-2 py-1 text-white/60 hover:bg-white/10 hover:text-white"
              >
                Fechar
              </button>
            </div>

            <div className="p-5">
              {notas.length === 0 ? (
                <p className="text-sm text-white/60">Nenhuma novidade registrada ainda.</p>
              ) : (
                <>
                  {capa && (
                    <div className="mb-4 flex flex-col gap-4 overflow-hidden rounded-2xl border border-[#F3B43F]/30 bg-[#292018] p-4 sm:flex-row">
                      {capa.imagem_url && (
                        <img
                          src={resolveMediaUrl(capa.imagem_url)}
                          alt={capa.titulo}
                          className="h-48 w-full shrink-0 rounded-xl border border-black/30 object-cover sm:h-auto sm:w-72"
                        />
                      )}
                      <div className="flex flex-col justify-center">
                        <p className="font-imFeel text-2xl text-white">{capa.titulo}</p>
                        <p className="mt-2 text-sm leading-relaxed text-white/70">{capa.resumo || capa.descricao}</p>
                      </div>
                    </div>
                  )}

                  {blocos.length > 0 && (
                    <div className="flex flex-col gap-3">
                      {blocos.map((nota) => (
                        <div
                          key={nota.id}
                          className="flex flex-col gap-3 rounded-xl border border-[#F3B43F]/20 bg-[#292018]/80 p-4 sm:flex-row"
                        >
                          {nota.imagem_url && (
                            <img
                              src={resolveMediaUrl(nota.imagem_url)}
                              alt={nota.titulo}
                              className="h-32 w-full shrink-0 rounded-lg border border-black/30 object-cover sm:h-24 sm:w-32"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 font-bold text-[#F3B43F]">
                              <span aria-hidden="true">{iconePorFeature(nota.feature)}</span>
                              {nota.titulo}
                            </p>
                            <p className="mt-1 text-sm text-white/70">{nota.descricao}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {notasAntigas.length > 0 && (
                    <div className="mt-5 border-t border-white/10 pt-4">
                      <button
                        type="button"
                        onClick={() => setMostrarAntigas((v) => !v)}
                        className="text-xs font-bold uppercase tracking-wide text-white/50 hover:text-white"
                      >
                        {mostrarAntigas ? "▲ Ocultar" : "▼ Ver"} atualizações anteriores ({notasAntigas.length})
                      </button>
                      {mostrarAntigas && (
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {notasAntigas.map((nota) => (
                            <div key={nota.id} className="rounded-xl border border-white/10 bg-[#292018]/60 p-4">
                              <div className="mb-1 flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/70">
                                  {nota.feature} v{nota.versao}
                                </span>
                                <span className="text-[10px] text-white/40">
                                  {new Date(nota.publicado_em).toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                              <p className="font-bold text-white/90">{nota.titulo}</p>
                              <p className="mt-1 text-sm text-white/60">{nota.descricao}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
              {carregando && <p className="mt-3 text-xs text-white/40">Marcando como lido...</p>}
            </div>
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
        aria-label="Pergaminho das Atualizações"
        title="Pergaminho das Atualizações"
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
