"use client";

// Chat global flutuante — canto inferior direito, igual pedido do
// jogador: não pode atrapalhar a navegação normal (sidebar, combate,
// etc), então é um botão pequeno que expande um painel só quando
// clicado, nunca ocupa a tela. Mesmo z-[200] do FloatingMusicWidget
// (fica acima de qualquer overlay de combate), mas no canto OPOSTO
// (bottom-right vs top-right) pra nunca os dois se sobreporem.
//
// Pedido do jogador: marcar outro jogador com "@" (autocomplete) e
// responder uma mensagem específica, igual WhatsApp — ver
// nomesConhecidosDe/mencaoEmAndamento/renderizarTextoComMencoes abaixo
// pro mention, e o estado `respondendoA` + o balão de citação pro reply.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useGlobalChatSocket, type MensagemChatGlobal, type RespostaChatGlobal } from "@/contexts/GlobalChatSocketContext";
import { useCharacter } from "@/contexts/CharacterContext";

const LIMITE_SUGESTOES_MENCAO = 6;

// A lista de nomes sugeríveis vem dos participantes já vistos no
// histórico carregado — sem round-trip novo no backend só pra isso.
// Mesma limitação natural do WhatsApp, que só sugere contatos da
// própria conversa, nunca o catálogo inteiro de usuários do app.
function nomesConhecidosDe(mensagens: MensagemChatGlobal[], meuNome?: string): string[] {
  const vistos = new Set<string>();
  for (const mensagem of mensagens) vistos.add(mensagem.nome);
  if (meuNome) vistos.add(meuNome);
  // Mais longo primeiro — sem isso, "Ana" "casaria" antes de "Ana Maria"
  // em qualquer busca por prefixo (abaixo e na renderização de menções).
  return [...vistos].sort((a, b) => b.length - a.length);
}

// Acha o "@" que ainda está "aberto" (sem quebra de linha nem termo
// longo demais entre ele e o cursor) pra decidir se mostra o dropdown de
// sugestão, e qual termo já foi digitado depois dele.
function mencaoEmAndamento(texto: string, cursor: number): { inicio: number; termo: string } | null {
  const antesDoCursor = texto.slice(0, cursor);
  const indiceArroba = antesDoCursor.lastIndexOf("@");
  if (indiceArroba === -1) return null;
  const termo = antesDoCursor.slice(indiceArroba + 1);
  if (termo.includes("\n")) return null;
  // Nomes podem ter espaço, mas uma frase inteira depois do "@" não é
  // mais uma menção em andamento — só um "@" solto na frase.
  if (termo.length > 40) return null;
  return { inicio: indiceArroba, termo };
}

// Destaca "@Nome" no texto já enviado — casa contra a lista de nomes
// conhecidos (não um regex genérico de "palavra"), porque nome de
// personagem pode ter espaço. Quem é mencionado (bate com o PRÓPRIO
// nome de quem está lendo) ganha destaque mais forte, pra chamar atenção
// de verdade, igual qualquer chat com @menção.
function renderizarTextoComMencoes(texto: string, nomesConhecidos: string[], meuNome?: string): ReactNode {
  if (nomesConhecidos.length === 0) return texto;

  const partes: ReactNode[] = [];
  let cursor = 0;
  let chave = 0;

  while (cursor < texto.length) {
    const indiceArroba = texto.indexOf("@", cursor);
    if (indiceArroba === -1) {
      partes.push(texto.slice(cursor));
      break;
    }
    if (indiceArroba > cursor) partes.push(texto.slice(cursor, indiceArroba));

    const resto = texto.slice(indiceArroba + 1);
    const nomeEncontrado = nomesConhecidos.find((nome) => resto.toLowerCase().startsWith(nome.toLowerCase()));

    if (!nomeEncontrado) {
      partes.push("@");
      cursor = indiceArroba + 1;
      continue;
    }

    const souMencionado = meuNome != null && nomeEncontrado.toLowerCase() === meuNome.toLowerCase();
    partes.push(
      <span
        key={`mencao-${chave++}`}
        className={souMencionado ? "rounded bg-[#F3B43F]/30 px-1 font-bold text-[#F3B43F]" : "font-bold text-sky-400"}
      >
        @{nomeEncontrado}
      </span>,
    );
    cursor = indiceArroba + 1 + nomeEncontrado.length;
  }

  return partes;
}

export default function FloatingGlobalChatWidget() {
  const { character } = useCharacter();
  const { pronto, erro, mensagens, naoLidas, limparNaoLidas, enviarMensagem } = useGlobalChatSocket();
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [respondendoA, setRespondendoA] = useState<(RespostaChatGlobal & { nomeOriginal?: string }) | null>(null);
  const [sugestaoAtiva, setSugestaoAtiva] = useState<{ inicio: number; termo: string } | null>(null);
  const [indiceSugestao, setIndiceSugestao] = useState(0);
  const raizRef = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const nomesConhecidos = useMemo(() => nomesConhecidosDe(mensagens, character?.nome), [mensagens, character?.nome]);

  const sugestoes = useMemo(() => {
    if (!sugestaoAtiva) return [];
    const termoBusca = sugestaoAtiva.termo.toLowerCase();
    return nomesConhecidos.filter((nome) => nome.toLowerCase().startsWith(termoBusca)).slice(0, LIMITE_SUGESTOES_MENCAO);
  }, [sugestaoAtiva, nomesConhecidos]);

  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(evento: MouseEvent) {
      if (!raizRef.current?.contains(evento.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight });
  }, [mensagens, aberto]);

  useEffect(() => {
    setIndiceSugestao(0);
  }, [sugestaoAtiva]);

  function alternarAberto() {
    setAberto((atual) => {
      const novoEstado = !atual;
      if (novoEstado) limparNaoLidas();
      return novoEstado;
    });
  }

  function aoDigitar(evento: React.ChangeEvent<HTMLInputElement>) {
    const novoTexto = evento.target.value;
    setTexto(novoTexto);
    setSugestaoAtiva(mencaoEmAndamento(novoTexto, evento.target.selectionStart ?? novoTexto.length));
  }

  function escolherSugestao(nome: string) {
    if (!sugestaoAtiva) return;
    const antes = texto.slice(0, sugestaoAtiva.inicio);
    const depois = texto.slice(sugestaoAtiva.inicio + 1 + sugestaoAtiva.termo.length);
    const novoTexto = `${antes}@${nome} ${depois}`;
    setTexto(novoTexto);
    setSugestaoAtiva(null);
    requestAnimationFrame(() => {
      const posicao = `${antes}@${nome} `.length;
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(posicao, posicao);
    });
  }

  function aoPressionarTecla(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (sugestoes.length === 0) return;
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setIndiceSugestao((atual) => (atual + 1) % sugestoes.length);
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setIndiceSugestao((atual) => (atual - 1 + sugestoes.length) % sugestoes.length);
    } else if (evento.key === "Enter" || evento.key === "Tab") {
      evento.preventDefault();
      escolherSugestao(sugestoes[indiceSugestao]);
    } else if (evento.key === "Escape") {
      setSugestaoAtiva(null);
    }
  }

  function responderMensagem(mensagem: MensagemChatGlobal) {
    setRespondendoA({ id: mensagem.id, nome: mensagem.nome, texto: mensagem.texto });
    inputRef.current?.focus();
  }

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (sugestoes.length > 0) return; // Enter aqui é pra escolher a sugestão, não enviar.
    const mensagem = texto.trim();
    if (!mensagem || !pronto) return;
    enviarMensagem(mensagem, respondendoA?.id);
    setTexto("");
    setRespondendoA(null);
    setSugestaoAtiva(null);
  }

  // right-4/right-7 (em vez de right-3/right-4): a barra de ação da
  // Aventura (CombatArena.tsx) vai até a borda da tela com px-3/sm:px-6
  // de recuo — com right-3/right-4 o balão ficava com o right MENOR que
  // o da barra (3<3 empatava, mas 4<6 no desktop), estourando 8px pra
  // fora da borda dourada. Esses valores deixam uma margem de verdade
  // (4px) pra dentro da borda, nos dois breakpoints.
  return (
    <div ref={raizRef} className="fixed bottom-3 right-4 z-[200] sm:bottom-4 sm:right-7">
      {aberto && (
        <div className="mb-2 flex h-96 w-80 max-w-[90vw] flex-col overflow-hidden rounded-xl border-2 border-[#F3B43F]/70 bg-[#292018]/95 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-widest text-[#F3B43F]">Chat Global</p>
            <span className={`h-2 w-2 rounded-full ${pronto ? "bg-green-400" : "bg-red-400"}`} title={pronto ? "Conectado" : "Conectando..."} />
          </div>

          <div ref={listaRef} className="flex-1 overflow-y-auto px-3 py-2">
            {erro && <p className="mb-2 text-xs text-red-400">{erro}</p>}
            {mensagens.length === 0 ? (
              <p className="text-center text-xs text-white/40">
                Nenhuma mensagem ainda — diga oi, ou anuncie o que tem pra vender.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {mensagens.map((mensagem, indice) => {
                  const souEu = mensagem.idPersonagem === character?.id;
                  return (
                    <div
                      key={`${mensagem.id}-${indice}`}
                      className="group relative text-xs leading-snug"
                      onDoubleClick={() => responderMensagem(mensagem)}
                    >
                      {mensagem.respondendoA && (
                        <div className="mb-0.5 rounded border-l-2 border-[#F3B43F]/60 bg-black/30 px-1.5 py-0.5 text-[10px] text-white/50">
                          <span className="font-bold text-white/70">{mensagem.respondendoA.nome}:</span>{" "}
                          <span className="line-clamp-1 break-words">{mensagem.respondendoA.texto}</span>
                        </div>
                      )}
                      <span className={`font-bold ${souEu ? "text-[#F3B43F]" : "text-white/80"}`}>{mensagem.nome}:</span>{" "}
                      <span className="break-words text-white/90">
                        {renderizarTextoComMencoes(mensagem.texto, nomesConhecidos, character?.nome)}
                      </span>
                      <button
                        type="button"
                        onClick={() => responderMensagem(mensagem)}
                        title="Responder"
                        className="ml-1 hidden text-[10px] text-white/40 hover:text-[#F3B43F] group-hover:inline"
                      >
                        ↩ responder
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {respondendoA && (
            <div className="flex items-center justify-between gap-2 border-t border-white/10 bg-black/30 px-3 py-1.5">
              <div className="min-w-0 border-l-2 border-[#F3B43F] pl-2 text-[11px] text-white/70">
                <p className="truncate">
                  Respondendo <span className="font-bold text-[#F3B43F]">{respondendoA.nome}</span>: {respondendoA.texto}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRespondendoA(null)}
                aria-label="Cancelar resposta"
                className="shrink-0 text-white/50 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={enviar} className="relative flex gap-1.5 border-t border-white/10 p-2">
            {sugestoes.length > 0 && (
              <div className="absolute bottom-full left-2 mb-1 w-56 overflow-hidden rounded-lg border border-[#F3B43F]/50 bg-[#1f1813] shadow-xl">
                {sugestoes.map((nome, indice) => (
                  <button
                    key={nome}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => escolherSugestao(nome)}
                    className={`block w-full px-3 py-1.5 text-left text-xs ${
                      indice === indiceSugestao ? "bg-[#F3B43F]/20 text-[#F3B43F]" : "text-white/80 hover:bg-white/5"
                    }`}
                  >
                    @{nome}
                  </button>
                ))}
              </div>
            )}
            <input
              ref={inputRef}
              value={texto}
              onChange={aoDigitar}
              onKeyDown={aoPressionarTecla}
              maxLength={500}
              placeholder={pronto ? "Escreva uma mensagem... (@ pra marcar alguém)" : "Conectando..."}
              disabled={!pronto}
              className="flex-1 rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-xs text-white placeholder-white/40 outline-none focus:border-[#F3B43F] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!pronto || !texto.trim()}
              className="rounded-lg bg-[#BC8418] px-3 py-1.5 text-xs font-bold text-black transition hover:bg-[#a5710f] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Enviar
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={alternarAberto}
        aria-expanded={aberto}
        aria-label={aberto ? "Fechar chat global" : "Abrir chat global"}
        className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#F3B43F] bg-[#292018]/90 text-xl shadow-lg backdrop-blur-sm transition-colors hover:bg-[#292018]"
      >
        💬
        {!aberto && naoLidas > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {naoLidas > 99 ? "99+" : naoLidas}
          </span>
        )}
      </button>
    </div>
  );
}
