"use client";

// Ícone de atalho pra Mensagens, ao lado do sino de Atualizações — bug
// reportado: quem joga sem som nunca percebia mensagem nova, porque o
// único aviso era o badge lá embaixo na lista do menu (só visível
// rolando) e o som de notificação (useMessagesSocket toca um beep no
// "message:new", ver MessagesSocketContext.tsx), que o jogador desligou.
import { useRouter } from "next/navigation";
import { useMessagesSocket } from "@/contexts/MessagesSocketContext";

export default function MessagesBell() {
  const router = useRouter();
  const { totalNaoLidas } = useMessagesSocket();

  return (
    <button
      type="button"
      onClick={() => router.push("/dashboard/messages")}
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/30 bg-black/10 text-[#292018] transition hover:bg-black/20"
      aria-label="Mensagens"
      title="Mensagens"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm8 9.2L4.4 7.3 3.2 8.8 12 15.7l8.8-6.9-1.2-1.5L12 13.2Z" />
      </svg>
      {totalNaoLidas > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#BC8418] bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
          {totalNaoLidas > 9 ? "9+" : totalNaoLidas}
        </span>
      )}
    </button>
  );
}
