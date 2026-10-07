"use client";
import { useEffect, useRef, useState } from "react";

type Turnstile = {
  render: (node: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}
interface Challenge {
  required: boolean;
  challengeId?: string;
  siteKey?: string;
}
export default function AutomationVerification() {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [message, setMessage] = useState("");
  const container = useRef<HTMLDivElement>(null);
  const requested = useRef(false);
  useEffect(() => {
    const open = async () => {
      if (requested.current) return;
      requested.current = true;
      setMessage("");
      try {
        const response = await fetch("/api/backend/anti-automation/status", {
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) throw new Error();
        if (data.data.required) setChallenge(data.data);
        else setChallenge(null);
      } catch {
        setMessage("Não foi possível iniciar a verificação. Tente novamente.");
        setChallenge({ required: true });
      } finally {
        requested.current = false;
      }
    };
    window.addEventListener("caelum:verification-required", open);
    return () =>
      window.removeEventListener("caelum:verification-required", open);
  }, []);
  useEffect(() => {
    if (!challenge?.siteKey || !challenge.challengeId) return;
    let cancelled = false,
      widget: string | undefined;
    const mount = () => {
      if (cancelled || !container.current || !window.turnstile || widget)
        return;
      widget = window.turnstile.render(container.current, {
        sitekey: challenge.siteKey,
        action: "caelum-verify",
        cData: challenge.challengeId,
        callback: async (token: string) => {
          try {
            const response = await fetch(
              "/api/backend/anti-automation/verify",
              {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  challengeId: challenge.challengeId,
                  token,
                }),
              },
            );
            const data = await response.json();
            if (cancelled) return;
            if (response.ok && data.data.verified) {
              setChallenge(null);
              setMessage("");
            } else
              setMessage("Verificação não concluída. Feche e tente novamente.");
          } catch {
            if (!cancelled)
              setMessage("Falha de conexão. Feche e tente novamente.");
          }
        },
        "error-callback": () =>
          setMessage("Verificação indisponível. Tente novamente em instantes."),
        "expired-callback": () =>
          setMessage("A verificação expirou. Feche e tente novamente."),
      });
    };
    let script = document.querySelector<HTMLScriptElement>(
      "script[data-caelum-turnstile]",
    );
    if (window.turnstile) mount();
    else {
      if (!script) {
        script = document.createElement("script");
        script.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.dataset.caelumTurnstile = "true";
        document.head.appendChild(script);
      }
      script.addEventListener("load", mount);
    }
    return () => {
      cancelled = true;
      script?.removeEventListener("load", mount);
      if (widget) window.turnstile?.remove(widget);
    };
  }, [challenge]);
  if (!challenge) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="verification-title"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
    >
      <div className="max-w-md rounded bg-[#292018] p-6 text-white">
        <h2 id="verification-title" className="text-xl">
          Verificação de segurança
        </h2>
        <p className="my-3">
          Conclua a verificação para iniciar uma nova atividade.
        </p>
        <div ref={container} />
        {message && <p role="alert">{message}</p>}
        <button
          className="mt-4 rounded border px-3 py-2"
          onClick={() => setChallenge(null)}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
