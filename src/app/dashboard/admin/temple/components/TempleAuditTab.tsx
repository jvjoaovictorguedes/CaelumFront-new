"use client";

import { useCallback, useEffect, useState } from "react";
import { listarAuditoriaAdmin, mensagemDeErroAdmin, type LogAuditoriaApi } from "@/lib/api/admin";
import { INPUT_XS, LABEL_XS } from "./styles";

const ENTIDADES_TEMPLO = [
  "TempleEvent",
  "TempleMission",
  "TempleRewardPool",
  "TempleRewardEntry",
  "TempleBossConfig",
  "TempleBossPhase",
  "TempleBossStatusResistance",
  "TempleBossRewardEntry",
] as const;

export default function TempleAuditTab() {
  const [entidade, setEntidade] = useState<string>(ENTIDADES_TEMPLO[0]);
  const [logs, setLogs] = useState<LogAuditoriaApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resultado = await listarAuditoriaAdmin({ entidade, porPagina: 50 });
      setLogs(resultado.itens);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar a auditoria."));
    } finally {
      setCarregando(false);
    }
  }, [entidade]);

  useEffect(() => { carregar(); }, [carregar]);

  return (
    <div className="flex flex-col gap-3">
      <label className={LABEL_XS}>
        Entidade
        <select value={entidade} onChange={(e) => setEntidade(e.target.value)} className={INPUT_XS}>
          {ENTIDADES_TEMPLO.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </label>

      {erro && <p className="text-xs text-red-400">{erro}</p>}

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-left text-xs text-white/80">
          <thead>
            <tr className="border-b border-white/10 uppercase text-white/50">
              <th className="px-2 py-1">Quando</th><th className="px-2 py-1">Admin</th><th className="px-2 py-1">Ação</th><th className="px-2 py-1">ID</th><th className="px-2 py-1">Motivo</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={5} className="px-2 py-2 text-center">Carregando...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="px-2 py-2 text-center text-white/40">Nenhuma ação registrada pra esta entidade.</td></tr>
            ) : logs.map((l) => (
              <tr key={l.id} className="border-b border-white/5">
                <td className="px-2 py-1">{new Date(l.createdAt).toLocaleString("pt-BR")}</td>
                <td className="px-2 py-1">#{l.id_admin}</td>
                <td className="px-2 py-1 font-bold">{l.acao}</td>
                <td className="px-2 py-1">{l.id_entidade ?? "—"}</td>
                <td className="px-2 py-1">{l.motivo ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
