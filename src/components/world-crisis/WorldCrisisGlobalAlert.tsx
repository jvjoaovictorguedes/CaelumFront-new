"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useWorldCrisis } from "@/contexts/WorldCrisisContext";
import api from "@/utils/axiosIntance";
export default function WorldCrisisGlobalAlert() {
  const { crisis, refresh } = useWorldCrisis();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const a = crisis?.pending_announcement;
  useEffect(() => {
    if (a) dialog.current?.showModal();
    else dialog.current?.close();
  }, [a?.seq, crisis?.id, a]);
  async function acknowledge() {
    setBusy(true);
    try {
      await api.post("/world-crisis/announcements/ack", {
        event_id: crisis?.id,
        seq: a?.seq,
      });
      refresh();
    } catch {
      setError("Não foi possível confirmar o aviso. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {crisis?.status === "ACTIVE" && (
        <Link
          prefetch={false}
          href="/dashboard/quests/reconstruction"
          className="fixed inset-x-0 top-0 z-[60] bg-gradient-to-r from-red-900 via-red-700 to-red-900 px-4 py-2 text-center text-sm font-bold text-white shadow-lg"
        >
          ⚠ Caelum precisa de ajuda — {crisis.stage?.nome} · XP −
          {crisis.effects?.xp_pct}% / Gold −{crisis.effects?.gold_pct}% · Ver
          reconstrução
        </Link>
      )}
      {a && (
        <dialog
          ref={dialog}
          aria-labelledby="crisis-announcement-title"
          onCancel={(e) => {
            e.preventDefault();
            void acknowledge();
          }}
          className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-6 text-white shadow-2xl backdrop:bg-black/75"
        >
          <h2
            id="crisis-announcement-title"
            className="font-imFeel text-3xl text-[#F3B43F]"
          >
            {a.title}
          </h2>
          <p className="my-4 text-sm text-white/80">{a.message}</p>
          {error && (
            <p role="alert" className="text-red-300">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Link
              prefetch={false}
              href="/dashboard/quests/reconstruction"
              onClick={() => void acknowledge()}
              className="rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black"
            >
              Ver reconstrução
            </Link>
            <button
              disabled={busy}
              onClick={() => void acknowledge()}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 disabled:opacity-50"
            >
              {busy ? "Confirmando…" : "Entendi"}
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}
