"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ToastTipo = "error" | "warning" | "success" | "info";

interface Toast {
  id: number;
  tipo: ToastTipo;
  mensagem: string;
}

interface ToastContextValue {
  mostrarErro: (mensagem: string) => void;
  mostrarAviso: (mensagem: string) => void;
  mostrarSucesso: (mensagem: string) => void;
  mostrarInfo: (mensagem: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DURACAO_MS = 4500;

// Notificação intuitiva (aparece e some sozinha) pra erros/avisos que
// hoje ficam presos num texto estático na tela até a próxima ação —
// pedido do jogador depois de um erro real de Fundição ("Fragmentos
// insuficientes") ficar parado ali sem chamar atenção nenhuma. Um só
// provider global (montado no layout do dashboard) em vez de cada tela
// reinventar o próprio banner de erro.
const ESTILO_POR_TIPO: Record<ToastTipo, { borda: string; fundo: string; icone: string }> = {
  error: { borda: "border-red-500/70", fundo: "bg-red-950/95", icone: "✕" },
  warning: { borda: "border-yellow-500/70", fundo: "bg-yellow-950/95", icone: "⚠" },
  success: { borda: "border-green-500/70", fundo: "bg-green-950/95", icone: "✓" },
  info: { borda: "border-[#F3B43F]/70", fundo: "bg-[#292018]/95", icone: "ℹ" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dispensar = useCallback((id: number) => {
    setToasts((atual) => atual.filter((t) => t.id !== id));
  }, []);

  const mostrar = useCallback(
    (tipo: ToastTipo, mensagem: string) => {
      const id = Date.now() + Math.random();
      setToasts((atual) => [...atual, { id, tipo, mensagem }]);
      setTimeout(() => dispensar(id), DURACAO_MS);
    },
    [dispensar],
  );

  const mostrarErro = useCallback((mensagem: string) => mostrar("error", mensagem), [mostrar]);
  const mostrarAviso = useCallback((mensagem: string) => mostrar("warning", mensagem), [mostrar]);
  const mostrarSucesso = useCallback((mensagem: string) => mostrar("success", mensagem), [mostrar]);
  const mostrarInfo = useCallback((mensagem: string) => mostrar("info", mensagem), [mostrar]);

  return (
    <ToastContext.Provider value={{ mostrarErro, mostrarAviso, mostrarSucesso, mostrarInfo }}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 top-4 z-[200] flex flex-col items-center gap-2 px-4 sm:items-end sm:right-4 sm:left-auto">
        {toasts.map((toast) => {
          const estilo = ESTILO_POR_TIPO[toast.tipo];
          return (
            <div
              key={toast.id}
              role="alert"
              className={`animate-toast-in pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-xl border-2 ${estilo.borda} ${estilo.fundo} p-3 text-sm text-white shadow-2xl backdrop-blur`}
            >
              <span className="mt-0.5 flex-shrink-0 font-bold">{estilo.icone}</span>
              <p className="flex-1">{toast.mensagem}</p>
              <button
                type="button"
                onClick={() => dispensar(toast.id)}
                aria-label="Fechar notificação"
                className="flex-shrink-0 text-white/50 transition hover:text-white"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        @keyframes toastIn {
          0% {
            opacity: 0;
            transform: translateY(-12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-toast-in {
          animation: toastIn 0.25s ease-out;
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast precisa ser usado dentro de ToastProvider");
  }
  return ctx;
}
