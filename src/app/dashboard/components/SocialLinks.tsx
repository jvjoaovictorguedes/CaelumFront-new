// Convites da comunidade — fica no canto oposto ao sino de atualizações,
// mesmo estilo de badge circular, pra quem quiser entrar no WhatsApp/
// Discord oficial sem precisar caçar o link em outro lugar do jogo.
const LINK_WHATSAPP = "https://chat.whatsapp.com/D4agJrbrBuz9bPCygN4p9q";
const LINK_DISCORD = "https://discord.gg/CCrh3rRs8";

export default function SocialLinks() {
  return (
    <div className="absolute left-2 top-0 flex flex-col gap-2">
      <a
        href={LINK_WHATSAPP}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/30 bg-black/10 text-[#292018] transition hover:bg-black/20"
        aria-label="Entrar no WhatsApp da comunidade"
        title="WhatsApp da comunidade"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.92C21.96 6.45 17.5 2 12.04 2Zm0 18.16h-.01a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.39c0-4.54 3.7-8.24 8.26-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.42 5.83c0 4.55-3.7 8.24-8.25 8.24Zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.53.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43-.14-.01-.31-.01-.48-.01-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08 0 1.23.89 2.41 1.02 2.58.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.23-.17-.48-.29Z" />
        </svg>
      </a>
      <a
        href={LINK_DISCORD}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/30 bg-black/10 text-[#292018] transition hover:bg-black/20"
        aria-label="Entrar no Discord da comunidade"
        title="Discord da comunidade"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M20.32 5.37a17.9 17.9 0 0 0-4.43-1.37.07.07 0 0 0-.07.03c-.19.34-.4.78-.55 1.13a16.6 16.6 0 0 0-4.94 0 11.6 11.6 0 0 0-.56-1.13.07.07 0 0 0-.07-.03c-1.52.26-3 .72-4.43 1.37a.06.06 0 0 0-.03.03C2.9 9.05 2.27 12.62 2.58 16.15a.08.08 0 0 0 .03.05 18.03 18.03 0 0 0 5.43 2.74.07.07 0 0 0 .08-.03c.42-.57.79-1.17 1.11-1.8a.07.07 0 0 0-.04-.1c-.59-.22-1.15-.5-1.69-.81a.07.07 0 0 1-.01-.12c.11-.09.23-.17.34-.26a.07.07 0 0 1 .07-.01c3.55 1.62 7.39 1.62 10.9 0a.07.07 0 0 1 .07.01c.11.09.22.18.34.26a.07.07 0 0 1-.01.12c-.54.32-1.1.59-1.69.81a.07.07 0 0 0-.04.1c.33.63.7 1.23 1.11 1.8a.07.07 0 0 0 .08.03 17.97 17.97 0 0 0 5.44-2.74.07.07 0 0 0 .03-.05c.37-4.08-.62-7.62-2.63-10.75a.06.06 0 0 0-.03-.03ZM8.68 14.03c-1.07 0-1.94-.98-1.94-2.19 0-1.2.86-2.19 1.94-2.19 1.09 0 1.96 1 1.94 2.19 0 1.21-.86 2.19-1.94 2.19Zm6.65 0c-1.07 0-1.94-.98-1.94-2.19 0-1.2.86-2.19 1.94-2.19 1.09 0 1.96 1 1.94 2.19 0 1.21-.85 2.19-1.94 2.19Z" />
        </svg>
      </a>
    </div>
  );
}
