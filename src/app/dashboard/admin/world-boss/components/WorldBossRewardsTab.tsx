"use client";

// Ameaça Mundial V2 §11.3/§13.6 — Recompensas: Participação/Descoberta/
// Golpe Final vivem direto no WorldBossConfig (mesmo payload do
// catálogo); "Maior Dano" e qualquer outra faixa de posição do ranking
// são WorldBossRankingReward — sub-recursos com CRUD próprio, só
// disponíveis depois que o catálogo já foi salvo pelo menos uma vez
// (precisam de um id_world_boss_config real).
import { useCallback, useEffect, useState } from "react";
import {
  atualizarRecompensaRankingWorldBossAdmin,
  criarRecompensaRankingWorldBossAdmin,
  excluirRecompensaRankingWorldBossAdmin,
  listarRecompensasRankingWorldBossAdmin,
  mensagemDeErroAdmin,
  type AdminItemSelecionavelApi,
  type PayloadWorldBossConfigAdmin,
  type PayloadWorldBossRankingRewardAdmin,
  type WorldBossRankingRewardApi,
} from "@/lib/api/admin";
import { ItemSelect } from "@/components/admin/ItemPicker";
import { BTN, BTN_DANGER, CARD, INPUT, INPUT_XS, LABEL, LABEL_XS } from "./styles";
import type { Dispatch, SetStateAction } from "react";

export default function WorldBossRewardsTab({
  form,
  setForm,
  configId,
  itensDisponiveis,
}: {
  form: PayloadWorldBossConfigAdmin;
  setForm: Dispatch<SetStateAction<PayloadWorldBossConfigAdmin>>;
  configId: number | null;
  itensDisponiveis: AdminItemSelecionavelApi[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className={CARD}>
        <p className="mb-3 font-imFeel text-lg text-[#F3B43F]">Participação</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label className={LABEL}>
            Gold por participação
            <input type="number" min={0} value={form.gold_participacao ?? 0} onChange={(e) => setForm((f) => ({ ...f, gold_participacao: Number(e.target.value) }))} className={INPUT} />
          </label>
          <label className={LABEL}>
            XP por participação
            <input type="number" min={0} value={form.xp_participacao ?? 0} onChange={(e) => setForm((f) => ({ ...f, xp_participacao: Number(e.target.value) }))} className={INPUT} />
          </label>
          <label className={LABEL}>
            Dano mínimo pra contar participação
            <input
              type="number"
              min={0}
              placeholder="Qualquer dano"
              value={form.min_dano_participacao ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, min_dano_participacao: e.target.value === "" ? null : Number(e.target.value) }))}
              className={INPUT}
            />
          </label>
        </div>
      </div>

      <div className={CARD}>
        <p className="mb-3 font-imFeel text-lg text-[#F3B43F]">Descoberta</p>
        <label className={LABEL}>
          Gold do descobridor
          <input type="number" min={0} value={form.gold_descoberta ?? 0} onChange={(e) => setForm((f) => ({ ...f, gold_descoberta: Number(e.target.value) }))} className={`${INPUT} max-w-[10rem]`} />
        </label>
      </div>

      <div className={CARD}>
        <p className="mb-3 font-imFeel text-lg text-[#F3B43F]">Golpe Final</p>
        <label className={LABEL}>
          Item concedido a quem der o golpe final
          <ItemSelect itens={itensDisponiveis} value={form.id_item_golpe_final || ""} onChange={(id) => setForm((f) => ({ ...f, id_item_golpe_final: id === "" ? 0 : id }))} permitirVazio={false} />
        </label>
      </div>

      <div className={CARD}>
        <p className="mb-1 font-imFeel text-lg text-[#F3B43F]">Maior Dano / faixas de ranking</p>
        <p className="mb-3 text-xs text-white/50">Cada linha é uma faixa de posições no ranking final (ex.: 1-1 = só o 1º lugar, &quot;Maior Dano&quot;; 2-5 = do 2º ao 5º).</p>
        {configId ? (
          <RecompensasRankingEditor configId={configId} itensDisponiveis={itensDisponiveis} />
        ) : (
          <p className="text-sm text-white/50">Salve o catálogo pelo menos uma vez pra poder cadastrar faixas de recompensa de ranking.</p>
        )}
      </div>
    </div>
  );
}

function faixaVazia(): PayloadWorldBossRankingRewardAdmin {
  return { posicao_inicio: 1, posicao_fim: 1, quantidade: 0, gold: 0, xp: 0 };
}

function RecompensasRankingEditor({ configId, itensDisponiveis }: { configId: number; itensDisponiveis: AdminItemSelecionavelApi[] }) {
  const [faixas, setFaixas] = useState<WorldBossRankingRewardApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [nova, setNova] = useState<PayloadWorldBossRankingRewardAdmin>(faixaVazia());
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setFaixas(await listarRecompensasRankingWorldBossAdmin(configId));
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar as faixas de recompensa."));
    } finally {
      setCarregando(false);
    }
  }, [configId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function adicionar() {
    setSalvando(true);
    setErro("");
    try {
      await criarRecompensaRankingWorldBossAdmin(configId, nova);
      setNova(faixaVazia());
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível criar a faixa."));
    } finally {
      setSalvando(false);
    }
  }

  async function atualizar(id: number, patch: Partial<PayloadWorldBossRankingRewardAdmin>) {
    try {
      await atualizarRecompensaRankingWorldBossAdmin(configId, id, patch);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível atualizar a faixa."));
    }
  }

  async function excluir(id: number) {
    try {
      await excluirRecompensaRankingWorldBossAdmin(configId, id);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível excluir a faixa."));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {erro && <p className="text-xs text-red-400">{erro}</p>}
      {carregando ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white/80">
            <thead>
              <tr className="border-b border-white/10 uppercase text-white/50">
                <th className="px-2 py-1">Posições</th>
                <th className="px-2 py-1">Item</th>
                <th className="px-2 py-1">Qtd</th>
                <th className="px-2 py-1">Gold</th>
                <th className="px-2 py-1">XP</th>
                <th className="px-2 py-1">Ativo</th>
                <th className="px-2 py-1"></th>
              </tr>
            </thead>
            <tbody>
              {faixas.map((faixa) => (
                <tr key={faixa.id} className="border-b border-white/5">
                  <td className="px-2 py-1">{faixa.posicao_inicio}º–{faixa.posicao_fim}º</td>
                  <td className="px-2 py-1 min-w-[12rem]">
                    <ItemSelect itens={itensDisponiveis} value={faixa.id_item ?? ""} onChange={(id) => atualizar(faixa.id, { id_item: id === "" ? null : id })} />
                  </td>
                  <td className="px-2 py-1">
                    <input type="number" min={0} defaultValue={faixa.quantidade} onBlur={(e) => atualizar(faixa.id, { quantidade: Number(e.target.value) })} className={`${INPUT_XS} w-16`} />
                  </td>
                  <td className="px-2 py-1">
                    <input type="number" min={0} defaultValue={faixa.gold} onBlur={(e) => atualizar(faixa.id, { gold: Number(e.target.value) })} className={`${INPUT_XS} w-20`} />
                  </td>
                  <td className="px-2 py-1">
                    <input type="number" min={0} defaultValue={faixa.xp} onBlur={(e) => atualizar(faixa.id, { xp: Number(e.target.value) })} className={`${INPUT_XS} w-20`} />
                  </td>
                  <td className="px-2 py-1">
                    <input type="checkbox" checked={faixa.ativo} onChange={(e) => atualizar(faixa.id, { ativo: e.target.checked })} />
                  </td>
                  <td className="px-2 py-1">
                    <button type="button" onClick={() => excluir(faixa.id)} className={BTN_DANGER}>Excluir</button>
                  </td>
                </tr>
              ))}
              {faixas.length === 0 && (
                <tr><td colSpan={7} className="px-2 py-2 text-center text-white/40">Nenhuma faixa cadastrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-end gap-2 rounded-lg border border-white/10 p-3">
        <label className={LABEL_XS}>
          Posição inicial
          <input type="number" min={1} value={nova.posicao_inicio} onChange={(e) => setNova((n) => ({ ...n, posicao_inicio: Number(e.target.value) }))} className={`${INPUT_XS} w-20`} />
        </label>
        <label className={LABEL_XS}>
          Posição final
          <input type="number" min={1} value={nova.posicao_fim} onChange={(e) => setNova((n) => ({ ...n, posicao_fim: Number(e.target.value) }))} className={`${INPUT_XS} w-20`} />
        </label>
        <label className={LABEL_XS}>
          Item (opcional)
          <ItemSelect itens={itensDisponiveis} value={nova.id_item ?? ""} onChange={(id) => setNova((n) => ({ ...n, id_item: id === "" ? null : id }))} />
        </label>
        <label className={LABEL_XS}>
          Qtd
          <input type="number" min={0} value={nova.quantidade ?? 0} onChange={(e) => setNova((n) => ({ ...n, quantidade: Number(e.target.value) }))} className={`${INPUT_XS} w-16`} />
        </label>
        <label className={LABEL_XS}>
          Gold
          <input type="number" min={0} value={nova.gold ?? 0} onChange={(e) => setNova((n) => ({ ...n, gold: Number(e.target.value) }))} className={`${INPUT_XS} w-20`} />
        </label>
        <label className={LABEL_XS}>
          XP
          <input type="number" min={0} value={nova.xp ?? 0} onChange={(e) => setNova((n) => ({ ...n, xp: Number(e.target.value) }))} className={`${INPUT_XS} w-20`} />
        </label>
        <button type="button" disabled={salvando} onClick={adicionar} className={BTN}>+ Adicionar faixa</button>
      </div>
    </div>
  );
}
