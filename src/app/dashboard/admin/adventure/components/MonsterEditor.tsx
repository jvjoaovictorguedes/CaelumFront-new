"use client";

import { useCallback, useEffect, useState } from "react";
import {
  atualizarMonstroAdmin,
  buscarDetalheMonstroAdmin,
  mensagemDeErroAdmin,
  sincronizarLootMonstroAdmin,
  type AdventureMonsterApi,
  type AdventureMonsterDetailApi,
  type LootMonstroItemPayload,
} from "@/lib/api/admin";
import { ItemSelect, formatarItemComId, useItensParaSelecaoAdmin } from "@/components/admin/ItemPicker";
import { CombatPowerCard } from "./CombatPowerCard";

const CATEGORIAS_LOOT = ["Principal", "Secundario", "Especial"] as const;

type LinhaLoot = LootMonstroItemPayload & { chaveLocal: string; nomeItem?: string };

function novaChave() {
  return `novo-${Math.random().toString(36).slice(2)}`;
}

// Especificação "Admin de Aventura + Defesa/Poder de Monstros" v3 §3 —
// editor amplo (drawer): Combate + Recompensas (form direto, sem
// estado local intermediário — cada campo já é a fonte de verdade,
// PATCH único no Salvar) + Drops (estado local, sincronização em lote,
// mesmo padrão do ZoneEditor) + Poder (só leitura, calculado pelo
// backend) + Aparições (só leitura — editar vínculo de zona é trabalho
// do ZoneEditor, nunca duplicado aqui).
export function MonsterEditor({
  idMonstro,
  onFechar,
  onSalvo,
  onSimular,
}: {
  idMonstro: number;
  onFechar: () => void;
  onSalvo: () => void;
  onSimular: (idMonstro: number) => void;
}) {
  const [detalhe, setDetalhe] = useState<AdventureMonsterDetailApi | null>(null);
  const [form, setForm] = useState<Partial<AdventureMonsterApi>>({});
  const [drops, setDrops] = useState<LinhaLoot[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [sujo, setSujo] = useState(false);
  const { itens: itensDisponiveis } = useItensParaSelecaoAdmin();

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const d = await buscarDetalheMonstroAdmin(idMonstro);
      setDetalhe(d);
      setForm(d.monstro);
      setDrops(
        d.loot.map((l) => ({
          chaveLocal: `existente-${l.id}`,
          id: l.id,
          id_item: l.id_item,
          chance_ppm: l.chance_ppm,
          quantidade_min: l.quantidade_min,
          quantidade_max: l.quantidade_max,
          categoria: l.categoria,
          ativo: l.ativo,
          nomeItem: l.item?.nome,
        })),
      );
      setSujo(false);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar o monstro."));
    } finally {
      setCarregando(false);
    }
  }, [idMonstro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function marcarSujo() {
    setSujo(true);
  }

  function atualizarCampo<K extends keyof AdventureMonsterApi>(campo: K, valor: AdventureMonsterApi[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
    marcarSujo();
  }

  function adicionarDrop() {
    const alvo = itensDisponiveis[0];
    if (!alvo) return;
    setDrops((d) => [
      ...d,
      { chaveLocal: novaChave(), id_item: alvo.id, chance_ppm: 500000, quantidade_min: 1, quantidade_max: 1, categoria: "Principal", ativo: true, nomeItem: alvo.nome },
    ]);
    marcarSujo();
  }

  function atualizarDrop(chave: string, patch: Partial<LinhaLoot>) {
    setDrops((d) => d.map((l) => (l.chaveLocal === chave ? { ...l, ...patch } : l)));
    marcarSujo();
  }

  function removerDrop(chave: string) {
    setDrops((d) => d.filter((l) => l.chaveLocal !== chave));
    marcarSujo();
  }

  function fechar() {
    if (sujo && !window.confirm("Existem alterações não salvas. Fechar mesmo assim?")) return;
    onFechar();
  }

  async function salvar() {
    setSalvando(true);
    setErro("");
    try {
      await atualizarMonstroAdmin(idMonstro, form);
      await sincronizarLootMonstroAdmin(
        idMonstro,
        drops.map(({ chaveLocal: _chaveLocal, nomeItem: _nomeItem, ...resto }) => resto),
      );
      onSalvo();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar o monstro."));
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white">Carregando monstro...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={fechar}>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[90vh] w-full max-w-4xl flex-col gap-4 overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
        <p className="font-imFeel text-2xl text-[#F3B43F]">Editar Monstro: {detalhe?.monstro.nome}</p>
        {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-4">
            <section className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-bold uppercase text-white/50">Geral</p>
              <label className="flex flex-col gap-1 text-xs">
                Nome
                <input required value={form.nome ?? ""} onChange={(e) => atualizarCampo("nome", e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Descrição
                <textarea value={form.descricao ?? ""} onChange={(e) => atualizarCampo("descricao", e.target.value)} rows={2} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1 text-xs">
                  Imagem (URL)
                  <input value={form.imagem_url ?? ""} onChange={(e) => atualizarCampo("imagem_url", e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  Sprite key
                  <input value={form.sprite_key ?? ""} onChange={(e) => atualizarCampo("sprite_key", e.target.value || null)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
                </label>
              </div>
            </section>

            <section className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-bold uppercase text-white/50">Combate</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1 text-xs">
                  Nível
                  <input type="number" min={1} value={form.nivel ?? 1} onChange={(e) => atualizarCampo("nivel", Number(e.target.value))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  Vida máxima
                  <input type="number" min={1} value={form.vida_maxima ?? 30} onChange={(e) => atualizarCampo("vida_maxima", Number(e.target.value))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  Dano mínimo
                  <input type="number" min={0} value={form.dano_min ?? 1} onChange={(e) => atualizarCampo("dano_min", Number(e.target.value))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  Dano máximo
                  <input type="number" min={0} value={form.dano_max ?? 3} onChange={(e) => atualizarCampo("dano_max", Number(e.target.value))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  Defesa
                  <input type="number" min={0} value={form.defesa ?? 0} onChange={(e) => atualizarCampo("defesa", Number(e.target.value))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
                  <span className="text-[10px] text-white/40">Mitigação aprox.: {(((form.defesa ?? 0) / ((form.defesa ?? 0) + 50)) * 100).toFixed(1)}%</span>
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  Agilidade
                  <input type="number" min={1} value={form.agilidade ?? 2} onChange={(e) => atualizarCampo("agilidade", Number(e.target.value))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  Velocidade
                  <input type="number" min={1} value={form.velocidade ?? 2} onChange={(e) => atualizarCampo("velocidade", Number(e.target.value))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
                </label>
              </div>
            </section>

            <section className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-bold uppercase text-white/50">Recompensas</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1 text-xs">
                  XP de recompensa
                  <input type="number" min={0} value={form.xp_recompensa ?? 0} onChange={(e) => atualizarCampo("xp_recompensa", Number(e.target.value))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  Ouro de recompensa
                  <input type="number" min={0} value={form.ouro_recompensa ?? 0} onChange={(e) => atualizarCampo("ouro_recompensa", Number(e.target.value))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
                </label>
              </div>
            </section>

            <section className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-bold uppercase text-white/50">Drops</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-xs">
                  <thead>
                    <tr className="text-white/50">
                      <th className="pb-1 pr-2">Item</th>
                      <th className="pb-1 pr-2">Chance</th>
                      <th className="pb-1 pr-2">Qtd.</th>
                      <th className="pb-1 pr-2">Categoria</th>
                      <th className="pb-1 pr-2">Ativo</th>
                      <th className="pb-1" />
                    </tr>
                  </thead>
                  <tbody>
                    {drops.map((linha) => (
                      <tr key={linha.chaveLocal} className={`border-t border-white/10 ${!linha.ativo ? "opacity-50" : ""}`}>
                        <td className="max-w-[160px] truncate py-1 pr-2 font-bold">{linha.nomeItem ?? formatarItemComId("Item", linha.id_item)}</td>
                        <td className="py-1 pr-2">
                          <input
                            type="number"
                            step="0.01"
                            min={0.01}
                            max={100}
                            value={linha.chance_ppm / 10000}
                            onChange={(e) => atualizarDrop(linha.chaveLocal, { chance_ppm: Math.round(Number(e.target.value) * 10000) })}
                            className="w-16 rounded border border-white/20 bg-black/30 px-1 py-0.5"
                          />
                          %
                        </td>
                        <td className="py-1 pr-2">
                          <input type="number" min={1} value={linha.quantidade_min} onChange={(e) => atualizarDrop(linha.chaveLocal, { quantidade_min: Number(e.target.value) })} className="w-12 rounded border border-white/20 bg-black/30 px-1 py-0.5" />
                          -
                          <input type="number" min={1} value={linha.quantidade_max} onChange={(e) => atualizarDrop(linha.chaveLocal, { quantidade_max: Number(e.target.value) })} className="w-12 rounded border border-white/20 bg-black/30 px-1 py-0.5" />
                        </td>
                        <td className="py-1 pr-2">
                          <select value={linha.categoria} onChange={(e) => atualizarDrop(linha.chaveLocal, { categoria: e.target.value as (typeof CATEGORIAS_LOOT)[number] })} className="rounded border border-white/20 bg-black/30 px-1 py-0.5">
                            {CATEGORIAS_LOOT.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-1 pr-2">
                          <input type="checkbox" checked={linha.ativo} onChange={(e) => atualizarDrop(linha.chaveLocal, { ativo: e.target.checked })} />
                        </td>
                        <td className="py-1">
                          <button type="button" onClick={() => removerDrop(linha.chaveLocal)} className="text-red-400 hover:underline">
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                    {drops.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-3 text-center text-white/40">
                          Nenhum drop cadastrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-2">
                <ItemSelect
                  itens={itensDisponiveis}
                  value=""
                  onChange={(id) => {
                    if (id === "") return;
                    const item = itensDisponiveis.find((i) => i.id === id);
                    setDrops((d) => [
                      ...d,
                      { chaveLocal: novaChave(), id_item: id, chance_ppm: 500000, quantidade_min: 1, quantidade_max: 1, categoria: "Principal", ativo: true, nomeItem: item?.nome },
                    ]);
                    marcarSujo();
                  }}
                />
              </div>
              <button type="button" onClick={adicionarDrop} disabled={!itensDisponiveis.length} className="self-start rounded-lg border border-[#F3B43F]/40 px-3 py-1.5 text-xs font-bold text-[#F3B43F] hover:bg-[#F3B43F]/10 disabled:opacity-40">
                + Adicionar drop
              </button>
            </section>

            {!!detalhe?.zonas.length && (
              <section className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs font-bold uppercase text-white/50">Aparições (só leitura — edite em Zonas)</p>
                <ul className="flex flex-col gap-1 text-xs text-white/70">
                  {detalhe.zonas.map((z) => (
                    <li key={z.id_area} className={!z.ativo ? "opacity-50" : ""}>
                      {z.nome_zona ?? `Zona #${z.id_area}`} · {z.tipo_aparicao} · peso {z.peso_aparicao} {!z.ativo && "(inativo)"}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {detalhe && <CombatPowerCard combatPower={detalhe.combat_power} onSimular={() => onSimular(idMonstro)} />}
        </div>

        <div className="mt-1 flex justify-end gap-2">
          <button type="button" onClick={fechar} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">
            Cancelar
          </button>
          <button type="button" onClick={salvar} disabled={salvando} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
            {salvando ? "Salvando..." : "Salvar monstro"}
          </button>
        </div>
      </div>
    </div>
  );
}
