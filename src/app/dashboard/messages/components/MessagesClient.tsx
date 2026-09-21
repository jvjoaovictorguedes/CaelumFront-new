"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { useMessagesSocket, type Mensagem } from "@/contexts/MessagesSocketContext";

interface UsuarioBasico {
  id: number;
  username: string;
}

const LIMITE_PAGINA = 50;
const TYPING_DEBOUNCE_MS = 2000;

export default function MessagesClient({ currentUserId }: { currentUserId: number }) {
  const {
    conectado,
    onlineUserIds,
    inbox,
    mensagensNovas,
    acks,
    leituras,
    usuariosDigitando,
    reconectadoEm,
    enviar,
    marcarComoLida,
    iniciarDigitacao,
    pararDigitacao,
  } = useMessagesSocket();

  const [usuarios, setUsuarios] = useState<UsuarioBasico[]>([]);
  const [busca, setBusca] = useState("");
  const [conversaAtualId, setConversaAtualId] = useState<number | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [temMaisAntigas, setTemMaisAntigas] = useState(false);
  const [textoMensagem, setTextoMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const fimDaListaRef = useRef<HTMLDivElement>(null);
  const inputMensagemRef = useRef<HTMLInputElement>(null);
  const conversaAtualRef = useRef<number | null>(null);

  const cursorNovasRef = useRef(0);
  const cursorAcksRef = useRef(0);
  const cursorLeiturasRef = useRef(0);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const digitandoAtivoRef = useRef(false);

  useEffect(() => {
    conversaAtualRef.current = conversaAtualId;
  }, [conversaAtualId]);

  const carregarUsuarios = useCallback(async () => {
    try {
      const resposta = await axiosInstance.get<{ data?: { users?: UsuarioBasico[] } }>("/users");
      setUsuarios((resposta.data?.data?.users ?? []).filter((usuario) => usuario.id !== currentUserId));
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    }
  }, [currentUserId]);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  // REST continua sendo a fonte pra carga inicial/paginação de
  // histórico (spec §3/§10) — `before` pagina "mais antigas que esta".
  const carregarConversa = useCallback(
    async (outroUsuarioId: number, before?: string) => {
      try {
        const params = new URLSearchParams({ limit: String(LIMITE_PAGINA) });
        if (before) params.set("before", before);
        const resposta = await axiosInstance.get<{ data?: { mensagens?: Mensagem[] } }>(
          `/messages/conversation/${currentUserId}/${outroUsuarioId}?${params.toString()}`,
        );
        const pagina = resposta.data?.data?.mensagens ?? [];
        setTemMaisAntigas(pagina.length === LIMITE_PAGINA);
        setMensagens((atual) => (before ? [...pagina, ...atual] : pagina));
      } catch (error) {
        console.error("Erro ao carregar conversa:", error);
      }
    },
    [currentUserId],
  );

  useEffect(() => {
    if (conversaAtualId === null) {
      setMensagens([]);
      setTemMaisAntigas(false);
      return;
    }
    setMensagens([]);
    carregarConversa(conversaAtualId);
  }, [conversaAtualId, carregarConversa]);

  // Reconexão do socket: resincroniza a conversa aberta com o que
  // possa ter sido perdido enquanto estava caído (spec §16).
  useEffect(() => {
    if (reconectadoEm === 0 || conversaAtualId === null) return;
    carregarConversa(conversaAtualId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reconectadoEm]);

  // Mensagens novas ao vivo (message:new) — só injeta na tela as que
  // pertencem à conversa aberta NESTA aba; o cursor sempre avança até o
  // fim do array pra nunca reprocessar a mesma entrada.
  useEffect(() => {
    if (cursorNovasRef.current >= mensagensNovas.length) return;
    const relevantes: Mensagem[] = [];
    for (let i = cursorNovasRef.current; i < mensagensNovas.length; i += 1) {
      const mensagem = mensagensNovas[i];
      if (
        conversaAtualRef.current !== null &&
        (mensagem.id_remetente === conversaAtualRef.current || mensagem.id_destinatario === conversaAtualRef.current)
      ) {
        relevantes.push(mensagem);
      }
    }
    cursorNovasRef.current = mensagensNovas.length;
    if (relevantes.length === 0) return;

    setMensagens((atual) => {
      const idsExistentes = new Set(atual.map((m) => m.id));
      return [...atual, ...relevantes.filter((m) => !idsExistentes.has(m.id))];
    });
    // Conversa já está aberta quando a mensagem chega -> já confirma
    // leitura em tempo real (spec §9), sem esperar reabrir a tela.
    if (conversaAtualRef.current !== null) marcarComoLida(conversaAtualRef.current);
  }, [mensagensNovas, marcarComoLida]);

  // ACKs (§6/§7) — reconcilia o placeholder otimista (client_message_id,
  // id negativo temporário) com a mensagem definitiva; se esta aba não
  // tinha placeholder nenhum (outra aba do mesmo usuário enviou), só
  // adiciona, sempre filtrando pela conversa aberta AQUI.
  useEffect(() => {
    if (cursorAcksRef.current >= acks.length) return;
    for (let i = cursorAcksRef.current; i < acks.length; i += 1) {
      const ack = acks[i];
      if (conversaAtualRef.current === null || ack.mensagem.id_destinatario !== conversaAtualRef.current) continue;

      setMensagens((atual) => {
        const semPlaceholder = atual.filter(
          (m) => !(m.id < 0 && m.client_message_id && m.client_message_id === ack.clientMessageId),
        );
        if (semPlaceholder.some((m) => m.id === ack.mensagem.id)) return semPlaceholder;
        return [...semPlaceholder, ack.mensagem];
      });
    }
    cursorAcksRef.current = acks.length;
  }, [acks]);

  // Confirmação de leitura (§9) — marca como lidas as mensagens que EU
  // mandei, quando o outro lado confirma ter lido.
  useEffect(() => {
    if (cursorLeiturasRef.current >= leituras.length) return;
    for (let i = cursorLeiturasRef.current; i < leituras.length; i += 1) {
      const leitura = leituras[i];
      setMensagens((atual) =>
        atual.map((m) =>
          m.id_remetente === currentUserId && m.id_destinatario === leitura.porUsuario ? { ...m, lida: true } : m,
        ),
      );
    }
    cursorLeiturasRef.current = leituras.length;
  }, [leituras, currentUserId]);

  useEffect(() => {
    fimDaListaRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens.length]);

  // Para de sinalizar "digitando" pro outro lado ao trocar de conversa
  // ou desmontar — nunca deixa o indicador do outro lado preso.
  useEffect(() => {
    const idDaConversa = conversaAtualId;
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (digitandoAtivoRef.current && idDaConversa !== null) {
        pararDigitacao(idDaConversa);
        digitandoAtivoRef.current = false;
      }
    };
  }, [conversaAtualId, pararDigitacao]);

  function abrirConversa(id: number) {
    setConversaAtualId(id);
    setBusca("");
    marcarComoLida(id);
  }

  async function carregarMaisAntigas() {
    if (conversaAtualId === null || mensagens.length === 0 || carregandoMais) return;
    setCarregandoMais(true);
    try {
      await carregarConversa(conversaAtualId, mensagens[0].createdAt);
    } finally {
      setCarregandoMais(false);
    }
  }

  function onMudarTexto(valor: string) {
    setTextoMensagem(valor);
    if (conversaAtualId === null) return;

    if (valor.trim()) {
      if (!digitandoAtivoRef.current) {
        digitandoAtivoRef.current = true;
        iniciarDigitacao(conversaAtualId);
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        digitandoAtivoRef.current = false;
        pararDigitacao(conversaAtualId);
      }, TYPING_DEBOUNCE_MS);
    } else if (digitandoAtivoRef.current) {
      digitandoAtivoRef.current = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      pararDigitacao(conversaAtualId);
    }
  }

  async function handleEnviar(event: React.FormEvent) {
    event.preventDefault();
    if (!conversaAtualId || !textoMensagem.trim() || enviando) return;

    const conteudo = textoMensagem.trim();
    const clientMessageId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setTextoMensagem("");
    if (digitandoAtivoRef.current) {
      digitandoAtivoRef.current = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      pararDigitacao(conversaAtualId);
    }

    // Envio otimista: mostra na hora com id negativo temporário — o ACK
    // (socket) ou a resposta do POST (fallback REST) substitui pelo
    // registro definitivo.
    const placeholder: Mensagem = {
      id: -Date.now(),
      id_remetente: currentUserId,
      id_destinatario: conversaAtualId,
      conteudo,
      lida: false,
      createdAt: new Date().toISOString(),
      client_message_id: clientMessageId,
    };
    setMensagens((atual) => [...atual, placeholder]);

    if (conectado) {
      enviar(conversaAtualId, conteudo, clientMessageId);
      requestAnimationFrame(() => inputMensagemRef.current?.focus());
      return;
    }

    // Sem socket (spec §2/§8): fallback REST — persiste igual, só não
    // entrega em tempo real; o outro lado vê ao reabrir/recarregar.
    setEnviando(true);
    setErro("");
    try {
      const resposta = await axiosInstance.post<{ data?: { mensagem?: Mensagem } }>("/messages", {
        id_destinatario: conversaAtualId,
        conteudo,
        client_message_id: clientMessageId,
      });
      const mensagemReal = resposta.data?.data?.mensagem;
      if (mensagemReal) {
        setMensagens((atual) => atual.map((m) => (m.id === placeholder.id ? mensagemReal : m)));
      }
    } catch (error: unknown) {
      setMensagens((atual) => atual.filter((m) => m.id !== placeholder.id));
      const mensagemErro =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Não foi possível enviar a mensagem.";
      setErro(mensagemErro);
      setTextoMensagem(conteudo);
    } finally {
      setEnviando(false);
      requestAnimationFrame(() => inputMensagemRef.current?.focus());
    }
  }

  const idsComConversa = new Set(inbox.map((conversa) => conversa.usuario.id));
  const usuariosFiltrados = busca.trim()
    ? usuarios.filter(
        (usuario) =>
          !idsComConversa.has(usuario.id) &&
          usuario.username.toLowerCase().includes(busca.trim().toLowerCase()),
      )
    : [];

  const usuarioSelecionado =
    inbox.find((conversa) => conversa.usuario.id === conversaAtualId)?.usuario ??
    usuarios.find((usuario) => usuario.id === conversaAtualId);

  const outroDigitando = conversaAtualId !== null && usuariosDigitando.has(conversaAtualId);

  return (
    <div className="mx-auto flex h-[calc(100vh-6rem)] w-full max-w-5xl flex-col gap-4 p-2 sm:p-4">
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-4 text-white shadow-xl">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">Correspondência</p>
        <h1 className="font-imFeel text-3xl sm:text-4xl">Mensagens</h1>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
        {/* Lista de conversas */}
        <div
          className={`flex min-h-0 flex-col rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-3 text-white shadow-lg ${
            conversaAtualId !== null ? "hidden md:flex" : "flex"
          }`}
        >
          <input
            type="text"
            placeholder="Buscar jogador..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="mb-2 w-full rounded-lg bg-[#DFC492] px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#F3B43F]"
          />

          <div className="min-h-0 flex-1 overflow-y-auto">
            {busca.trim() && (
              <div className="mb-2 border-b border-white/10 pb-2">
                <p className="mb-1 text-[10px] uppercase tracking-wide text-white/40">Resultados</p>
                {usuariosFiltrados.length === 0 ? (
                  <p className="px-2 py-1 text-xs text-white/50">Nenhum jogador encontrado.</p>
                ) : (
                  usuariosFiltrados.map((usuario) => (
                    <button
                      key={usuario.id}
                      onClick={() => abrirConversa(usuario.id)}
                      className="block w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white/10"
                    >
                      {usuario.username}
                    </button>
                  ))
                )}
              </div>
            )}

            {inbox.length === 0 && !busca.trim() && (
              <p className="px-2 py-4 text-center text-sm text-white/50">
                Nenhuma conversa ainda. Busque um jogador acima pra começar.
              </p>
            )}

            {inbox.map((conversa) => {
              const online = onlineUserIds.has(conversa.usuario.id);
              return (
                <button
                  key={conversa.usuario.id}
                  onClick={() => abrirConversa(conversa.usuario.id)}
                  className={`mb-1 flex w-full items-center justify-between rounded-lg px-2 py-2 text-left transition ${
                    conversaAtualId === conversa.usuario.id ? "bg-[#3a2f24]" : "hover:bg-white/5"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#F3B43F]">
                      {conversa.usuario.username}{" "}
                      <span
                        className={`ml-1 inline-block h-2 w-2 rounded-full align-middle ${
                          online ? "bg-green-400" : "bg-white/20"
                        }`}
                        title={online ? "Online" : "Offline"}
                      />
                    </p>
                    <p className="truncate text-xs text-white/60">{conversa.ultimaMensagem}</p>
                  </div>
                  {conversa.naoLidas > 0 && (
                    <span className="ml-2 shrink-0 rounded-full bg-[#F3B43F] px-2 py-0.5 text-[10px] font-bold text-black">
                      {conversa.naoLidas}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Thread da conversa */}
        <div
          className={`flex min-h-0 flex-col rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 shadow-lg ${
            conversaAtualId === null ? "hidden md:flex" : "flex"
          }`}
        >
          {conversaAtualId === null ? (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-white/50">
              Selecione uma conversa ou busque um jogador pra começar a conversar.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-white/10 p-3">
                <button
                  onClick={() => setConversaAtualId(null)}
                  className="rounded-lg px-2 py-1 text-sm text-white/60 hover:bg-white/10 md:hidden"
                >
                  ← Voltar
                </button>
                <p className="font-imFeel text-xl text-[#F3B43F]">
                  {usuarioSelecionado?.username ?? "Jogador"}{" "}
                  <span
                    className={`ml-1 inline-block h-2 w-2 rounded-full align-middle ${
                      onlineUserIds.has(conversaAtualId) ? "bg-green-400" : "bg-white/20"
                    }`}
                  />
                </p>
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                {temMaisAntigas && (
                  <div className="flex justify-center pb-2">
                    <button
                      onClick={carregarMaisAntigas}
                      disabled={carregandoMais}
                      className="rounded-lg border border-white/20 px-3 py-1 text-xs text-white/70 hover:bg-white/10 disabled:opacity-50"
                    >
                      {carregandoMais ? "Carregando..." : "Carregar mensagens anteriores"}
                    </button>
                  </div>
                )}

                {mensagens.map((mensagem) => {
                  const souEu = mensagem.id_remetente === currentUserId;
                  return (
                    <div key={mensagem.id} className={`flex ${souEu ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                          souEu ? "bg-[#F3B43F] text-black" : "bg-[#3a2f24] text-white"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{mensagem.conteudo}</p>
                        <p className={`mt-1 text-[10px] ${souEu ? "text-black/60" : "text-white/40"}`}>
                          {new Date(mensagem.createdAt).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {souEu && mensagem.id > 0 && (mensagem.lida ? " · lida" : " · enviada")}
                          {souEu && mensagem.id < 0 && " · enviando..."}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {outroDigitando && (
                  <p className="px-1 text-xs italic text-white/40">
                    {usuarioSelecionado?.username ?? "Jogador"} está digitando...
                  </p>
                )}

                <div ref={fimDaListaRef} />
              </div>

              {erro && <p className="px-3 text-xs text-red-400">{erro}</p>}

              <form onSubmit={handleEnviar} className="flex items-center gap-2 border-t border-white/10 p-3">
                <input
                  ref={inputMensagemRef}
                  type="text"
                  value={textoMensagem}
                  onChange={(e) => onMudarTexto(e.target.value)}
                  placeholder="Escreva uma mensagem..."
                  maxLength={2000}
                  disabled={enviando}
                  className="min-w-0 flex-1 rounded-lg bg-[#DFC492] px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#F3B43F] disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={enviando || !textoMensagem.trim()}
                  className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black transition hover:bg-[#a5710f] disabled:opacity-50"
                >
                  {enviando ? "Enviando..." : "Enviar"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
