"use client";

// Ameaça Mundial V2 §7.1/§13.2 — Resistências a status do Boss.
// status_key vem do catálogo compartilhado do motor de status
// (catalogoStatusAdmin, mesmo catálogo usado no painel de Powers) —
// nunca uma lista redigitada aqui.
import { useCallback, useEffect, useState } from "react";
import {
  atualizarResistenciaWorldBossAdmin,
  catalogoStatusAdmin,
  criarResistenciaWorldBossAdmin,
  excluirResistenciaWorldBossAdmin,
  listarResistenciasWorldBossAdmin,
  mensagemDeErroAdmin,
  type StatusCatalogEntryApi,
  type WorldBossStatusResistanceApi,
} from "@/lib/api/admin";
import { BTN, BTN_DANGER, INPUT_XS, LABEL_XS } from "./styles";

export default function WorldBossResistancesTab({ configId }: { configId: number }) {
  const [resistencias, setResistencias] = useState<WorldBossStatusResistanceApi[]>([]);
  const [catalogo, setCatalogo] = useState<StatusCatalogEntryApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [novoStatusKey, setNovoStatusKey] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [lista, cat] = await Promise.all([listarResistenciasWorldBossAdmin(configId), catalogoStatusAdmin()]);
      setResistencias(lista);
      setCatalogo(cat);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar as resistências."));
    } finally {
      setCarregando(false);
    }
  }, [configId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const statusDisponiveis = catalogo.filter((s) => !resistencias.some((r) => r.status_key === s.status_key));

  async function adicionar() {
    if (!novoStatusKey) return;
    setSalvando(true);
    setErro("");
    try {
      await criarResistenciaWorldBossAdmin(configId, { status_key: novoStatusKey, resistencia_pct: 0, imune: false });
      setNovoStatusKey("");
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível adicionar a resistência."));
    } finally {
      setSalvando(false);
    }
  }

  async function atualizar(id: number, patch: { resistencia_pct?: number; imune?: boolean; ativo?: boolean }) {
    try {
      await atualizarResistenciaWorldBossAdmin(configId, id, patch);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível atualizar a resistência."));
    }
  }

  async function excluir(id: number) {
    try {
      await excluirResistenciaWorldBossAdmin(configId, id);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível excluir a resistência."));
    }
  }

  function nomeDoStatus(key: string): string {
    return catalogo.find((s) => s.status_key === key)?.nomeUi ?? key;
  }

  return (
    <div className="flex flex-col gap-3">
      {erro && <p className="text-xs text-red-400">{erro}</p>}
      {carregando ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white/80">
            <thead>
              <tr className="border-b border-white/10 uppercase text-white/50">
                <th className="px-2 py-1">Status</th>
                <th className="px-2 py-1">Resistência %</th>
                <th className="px-2 py-1">Imune</th>
                <th className="px-2 py-1">Ativo</th>
                <th className="px-2 py-1"></th>
              </tr>
            </thead>
            <tbody>
              {resistencias.map((r) => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="px-2 py-1 font-bold">{nomeDoStatus(r.status_key)}</td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      disabled={r.imune}
                      defaultValue={r.resistencia_pct}
                      onBlur={(e) => atualizar(r.id, { resistencia_pct: Number(e.target.value) })}
                      className={`${INPUT_XS} w-20 disabled:opacity-40`}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input type="checkbox" checked={r.imune} onChange={(e) => atualizar(r.id, { imune: e.target.checked })} />
                  </td>
                  <td className="px-2 py-1">
                    <input type="checkbox" checked={r.ativo} onChange={(e) => atualizar(r.id, { ativo: e.target.checked })} />
                  </td>
                  <td className="px-2 py-1">
                    <button type="button" onClick={() => excluir(r.id)} className={BTN_DANGER}>Excluir</button>
                  </td>
                </tr>
              ))}
              {resistencias.length === 0 && <tr><td colSpan={5} className="px-2 py-2 text-center text-white/40">Nenhuma resistência cadastrada — o Boss sofre normalmente qualquer status.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-2 flex items-end gap-2 rounded-lg border border-white/10 p-3">
        <label className={LABEL_XS}>
          Adicionar resistência a
          <select value={novoStatusKey} onChange={(e) => setNovoStatusKey(e.target.value)} className={INPUT_XS}>
            <option value="">Selecione um status...</option>
            {statusDisponiveis.map((s) => (
              <option key={s.status_key} value={s.status_key}>{s.nomeUi}</option>
            ))}
          </select>
        </label>
        <button type="button" disabled={salvando || !novoStatusKey} onClick={adicionar} className={BTN}>+ Adicionar</button>
      </div>
    </div>
  );
}
