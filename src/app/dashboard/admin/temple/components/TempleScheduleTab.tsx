"use client";

// §3.2/§12.1 "agendar" — define as 3 datas e publica (DRAFT/SCHEDULED
// -> SCHEDULED). O scheduler assume a partir daqui (promoverEstados):
// nunca é o Admin que força SCHEDULED->ACTIVE diretamente.
import { useState } from "react";
import { agendarEventoTemploAdmin, mensagemDeErroAdmin, type TempleEventoAdminApi } from "@/lib/api/admin";
import { BTN, CARD, INPUT, LABEL } from "./styles";

function paraInputDatetime(iso: string | null): string {
  if (!iso) return "";
  const data = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}T${pad(data.getHours())}:${pad(data.getMinutes())}`;
}

export default function TempleScheduleTab({
  evento,
  editavel,
  onAtualizado,
}: {
  evento: TempleEventoAdminApi;
  editavel: boolean;
  onAtualizado: () => Promise<void>;
}) {
  const [startsAt, setStartsAt] = useState(paraInputDatetime(evento.starts_at));
  const [missionsEndAt, setMissionsEndAt] = useState(paraInputDatetime(evento.missions_end_at));
  const [relicaryEndAt, setRelicaryEndAt] = useState(paraInputDatetime(evento.relicary_end_at));
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function agendar() {
    if (!startsAt || !missionsEndAt || !relicaryEndAt) {
      setErro("As 3 datas são obrigatórias.");
      return;
    }
    setSalvando(true);
    setMensagem("");
    setErro("");
    try {
      await agendarEventoTemploAdmin(evento.id, {
        starts_at: new Date(startsAt).toISOString(),
        missions_end_at: new Date(missionsEndAt).toISOString(),
        relicary_end_at: new Date(relicaryEndAt).toISOString(),
      });
      setMensagem("Convergência agendada — o scheduler vai ativá-la automaticamente em starts_at.");
      await onAtualizado();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível agendar."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={CARD}>
      <p className="mb-1 font-imFeel text-lg text-[#F3B43F]">Agendamento</p>
      <p className="mb-3 text-xs text-white/50">
        início &lt; fim das Provações &lt; fim do Relicário. O scheduler promove DRAFT/SCHEDULED → ACTIVE em starts_at, ACTIVE → RELICARY_ONLY em
        missions_end_at e RELICARY_ONLY → ENDED em relicary_end_at — nunca uma ação manual do Admin.
      </p>
      {!editavel && <p className="mb-3 text-xs text-red-300">Datas congeladas — esta Convergência não está mais em Rascunho/Agendada.</p>}

      {mensagem && <p className="mb-2 text-xs text-[#F3B43F]">{mensagem}</p>}
      {erro && <p className="mb-2 text-xs text-red-400">{erro}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className={LABEL}>
          Início (ativa a Convergência)
          <input type="datetime-local" disabled={!editavel} value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={`${INPUT} disabled:opacity-50`} />
        </label>
        <label className={LABEL}>
          Fim das Provações (vira Só Relicário)
          <input type="datetime-local" disabled={!editavel} value={missionsEndAt} onChange={(e) => setMissionsEndAt(e.target.value)} className={`${INPUT} disabled:opacity-50`} />
        </label>
        <label className={LABEL}>
          Fim do Relicário (encerra)
          <input type="datetime-local" disabled={!editavel} value={relicaryEndAt} onChange={(e) => setRelicaryEndAt(e.target.value)} className={`${INPUT} disabled:opacity-50`} />
        </label>
      </div>

      <button type="button" disabled={salvando || !editavel} onClick={agendar} className={`${BTN} mt-3`}>
        {salvando ? "Salvando..." : "Agendar"}
      </button>
    </div>
  );
}
