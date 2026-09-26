"use client";

// Modo Manutenção — tela cheia mostrada pra qualquer jogador comum
// (nunca pra admin) enquanto o Modo Manutenção está ativo no painel
// admin (/dashboard/admin/maintenance). Renderizada direto no
// RootLayout, antes de qualquer outra coisa da página carregar.
export default function MaintenanceScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#151009] px-6 text-center text-white">
      <div className="text-6xl">🛠️</div>
      <h1 className="font-imFeel text-3xl text-[#F3B43F] sm:text-4xl">Em manutenção</h1>
      <p className="max-w-md text-balance text-sm text-white/70 sm:text-base">{message}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-lg bg-[#BC8418] px-5 py-2.5 text-sm font-bold text-black hover:bg-[#a5710f]"
      >
        Tentar de novo
      </button>
    </div>
  );
}
