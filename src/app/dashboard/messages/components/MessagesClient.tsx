"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";

interface Conversa {
usuario: { id: number; username: string };
ultimaMensagem: string;
ultimaMensagemEm: string;
naoLidas: number;
}

interface Mensagem {
id: number;
id_remetente: number;
id_destinatario: number;
conteudo: string;
lida: boolean;
createdAt: string;
}

interface UsuarioBasico {
id: number;
username: string;
}

const INTERVALO_POLL_INBOX_MS = 6000;
const INTERVALO_POLL_CONVERSA_MS = 3000;

export default function MessagesClient({
currentUserId,
}: {
currentUserId: number;
}) {
const [conversas, setConversas] = useState<Conversa[]>([]);
const [usuarios, setUsuarios] = useState<UsuarioBasico[]>([]);
const [busca, setBusca] = useState("");
const [conversaAtualId, setConversaAtualId] = useState<number | null>(null);
const [mensagens, setMensagens] = useState<Mensagem[]>([]);
const [textoMensagem, setTextoMensagem] = useState("");
const [enviando, setEnviando] = useState(false);
const [erro, setErro] = useState("");

const fimDaListaRef = useRef<HTMLDivElement>(null);
const inputMensagemRef = useRef<HTMLInputElement>(null);

// Guarda os IDs das mensagens que já foram exibidas.
const idsMensagensRef = useRef<Set<number>>(new Set());

// Controla o áudio da notificação.
const audioMensagemRef = useRef<HTMLAudioElement | null>(null);

// Evita tocar som no primeiro carregamento da conversa.
const conversaInicializadaRef = useRef(false);

/**

* Cria o áudio uma única vez.
  */
  useEffect(() => {
  audioMensagemRef.current = new Audio("/sounds/message.mp3");
  audioMensagemRef.current.volume = 0.5;
  audioMensagemRef.current.preload = "auto";


return () => {

  audioMensagemRef.current?.pause();
  audioMensagemRef.current = null;
};

}, []);

/**

* Toca o som da nova mensagem.
  */
  const tocarSomMensagem = useCallback(() => {
  const audio = audioMensagemRef.current;

if (!audio) return;

audio.currentTime = 0;

audio.play().catch(() => {
  // O navegador pode bloquear áudio automático.
});

}, []);

const carregarInbox = useCallback(async () => {
try {
const resposta = await axiosInstance.get<{
data?: { conversas?: Conversa[] };
}>(`/messages/inbox/${currentUserId}`);

  setConversas(resposta.data?.data?.conversas ?? []);
} catch (error) {
  console.error("Erro ao carregar caixa de entrada:", error);
}


}, [currentUserId]);

const carregarUsuarios = useCallback(async () => {
try {
const resposta = await axiosInstance.get<{
data?: { users?: UsuarioBasico[] };
}>("/users");

  setUsuarios(
    (resposta.data?.data?.users ?? []).filter(
      (usuario) => usuario.id !== currentUserId,
    ),
  );
} catch (error) {
  console.error("Erro ao carregar usuários:", error);
}

}, [currentUserId]);

const carregarConversa = useCallback(
async (outroUsuarioId: number) => {
try {
const resposta = await axiosInstance.get<{
data?: { mensagens?: Mensagem[] };
}>(
`/messages/conversation/${currentUserId}/${outroUsuarioId}`,
);

    const novasMensagens =
      resposta.data?.data?.mensagens ?? [];

    /*
     * No primeiro carregamento não tocamos som.
     * O usuário só deve ouvir som quando uma mensagem
     * realmente chegar depois que a conversa já foi carregada.
     */
    if (!conversaInicializadaRef.current) {
      idsMensagensRef.current = new Set(
        novasMensagens.map((mensagem) => mensagem.id),
      );

      conversaInicializadaRef.current = true;
    } else {
      const mensagemNovaRecebida = novasMensagens.some(
        (mensagem) =>
          !idsMensagensRef.current.has(mensagem.id) &&
          mensagem.id_remetente !== currentUserId,
      );

      if (mensagemNovaRecebida) {
        tocarSomMensagem();
      }

      idsMensagensRef.current = new Set(
        novasMensagens.map((mensagem) => mensagem.id),
      );
    }

    setMensagens(novasMensagens);
  } catch (error) {
    console.error("Erro ao carregar conversa:", error);
  }
},
[currentUserId, tocarSomMensagem],
);

useEffect(() => {
carregarInbox();
carregarUsuarios();

const intervalo = setInterval(
  carregarInbox,
  INTERVALO_POLL_INBOX_MS,
);

return () => clearInterval(intervalo);

}, [carregarInbox, carregarUsuarios]);

useEffect(() => {
if (conversaAtualId === null) {
conversaInicializadaRef.current = false;
idsMensagensRef.current = new Set();
setMensagens([]);
return;
}

// Toda vez que troca de conversa, começamos uma nova referência.
conversaInicializadaRef.current = false;
idsMensagensRef.current = new Set();

carregarConversa(conversaAtualId);

const intervalo = setInterval(
  () => carregarConversa(conversaAtualId),
  INTERVALO_POLL_CONVERSA_MS,
);

return () => clearInterval(intervalo);

}, [conversaAtualId, carregarConversa]);

useEffect(() => {
fimDaListaRef.current?.scrollIntoView({
behavior: "smooth",
});
}, [mensagens]);

async function enviarMensagem(event: React.FormEvent) {
event.preventDefault();

if (!conversaAtualId || !textoMensagem.trim() || enviando) {
  return;
}

setEnviando(true);
setErro("");

try {
  await axiosInstance.post("/messages", {
    id_remetente: currentUserId,
    id_destinatario: conversaAtualId,
    conteudo: textoMensagem.trim(),
  });

  setTextoMensagem("");

  await Promise.all([
    carregarConversa(conversaAtualId),
    carregarInbox(),
  ]);

  /*
   * Depois de enviar, devolvemos o foco para o input.
   * requestAnimationFrame garante que isso aconteça
   * depois da atualização do React.
   */
  requestAnimationFrame(() => {
    inputMensagemRef.current?.focus();
  });
} catch (error: unknown) {
  const mensagem =
    (error as {
      response?: {
        data?: {
          message?: string;
        };
      };
    })?.response?.data?.message ??
    "Não foi possível enviar a mensagem.";

  setErro(mensagem);

  requestAnimationFrame(() => {
    inputMensagemRef.current?.focus();
  });
} finally {
  setEnviando(false);
}

}

const idsComConversa = new Set(
conversas.map((conversa) => conversa.usuario.id),
);

const usuariosFiltrados = busca.trim()
? usuarios.filter(
(usuario) =>
!idsComConversa.has(usuario.id) &&
usuario.username
.toLowerCase()
.includes(busca.trim().toLowerCase()),
)
: [];

const usuarioSelecionado =
conversas.find(
(conversa) => conversa.usuario.id === conversaAtualId,
)?.usuario ??
usuarios.find(
(usuario) => usuario.id === conversaAtualId,
);

return ( <div className="mx-auto flex h-[calc(100vh-6rem)] w-full max-w-5xl flex-col gap-4 p-2 sm:p-4"> <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-4 text-white shadow-xl"> <p className="text-sm uppercase tracking-widest text-[#F3B43F]">
Correspondência </p>

    <h1 className="font-imFeel text-3xl sm:text-4xl">
      Mensagens
    </h1>
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
            <p className="mb-1 text-[10px] uppercase tracking-wide text-white/40">
              Resultados
            </p>

            {usuariosFiltrados.length === 0 ? (
              <p className="px-2 py-1 text-xs text-white/50">
                Nenhum jogador encontrado.
              </p>
            ) : (
              usuariosFiltrados.map((usuario) => (
                <button
                  key={usuario.id}
                  onClick={() => {
                    setConversaAtualId(usuario.id);
                    setBusca("");
                  }}
                  className="block w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white/10"
                >
                  {usuario.username}
                </button>
              ))
            )}
          </div>
        )}

        {conversas.length === 0 && !busca.trim() && (
          <p className="px-2 py-4 text-center text-sm text-white/50">
            Nenhuma conversa ainda. Busque um jogador acima pra começar.
          </p>
        )}

        {conversas.map((conversa) => (
          <button
            key={conversa.usuario.id}
            onClick={() => setConversaAtualId(conversa.usuario.id)}
            className={`mb-1 flex w-full items-center justify-between rounded-lg px-2 py-2 text-left transition ${
              conversaAtualId === conversa.usuario.id
                ? "bg-[#3a2f24]"
                : "hover:bg-white/5"
            }`}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#F3B43F]">
                {conversa.usuario.username}
              </p>

              <p className="truncate text-xs text-white/60">
                {conversa.ultimaMensagem}
              </p>
            </div>

            {conversa.naoLidas > 0 && (
              <span className="ml-2 shrink-0 rounded-full bg-[#F3B43F] px-2 py-0.5 text-[10px] font-bold text-black">
                {conversa.naoLidas}
              </span>
            )}
          </button>
        ))}
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
          Selecione uma conversa ou busque um jogador pra começar a
          conversar.
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
              {usuarioSelecionado?.username ?? "Jogador"}
            </p>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {mensagens.map((mensagem) => {
              const souEu =
                mensagem.id_remetente === currentUserId;

              return (
                <div
                  key={mensagem.id}
                  className={`flex ${
                    souEu ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                      souEu
                        ? "bg-[#F3B43F] text-black"
                        : "bg-[#3a2f24] text-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {mensagem.conteudo}
                    </p>

                    <p
                      className={`mt-1 text-[10px] ${
                        souEu
                          ? "text-black/60"
                          : "text-white/40"
                      }`}
                    >
                      {new Date(
                        mensagem.createdAt,
                      ).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}

            <div ref={fimDaListaRef} />
          </div>

          {erro && (
            <p className="px-3 text-xs text-red-400">
              {erro}
            </p>
          )}

          <form
            onSubmit={enviarMensagem}
            className="flex items-center gap-2 border-t border-white/10 p-3"
          >
            <input
              ref={inputMensagemRef}
              type="text"
              value={textoMensagem}
              onChange={(e) => setTextoMensagem(e.target.value)}
              placeholder="Escreva uma mensagem..."
              maxLength={2000}
              disabled={enviando}
              className="flex-1 rounded-lg bg-[#DFC492] px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#F3B43F] disabled:opacity-60"
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
