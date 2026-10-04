"use client";

import { useCallback, useEffect, useState } from "react";
import {
  atualizarAparicaoAdmin,
  atualizarMonstroAdmin,
  buscarDetalheMonstroAdmin,
  criarAparicaoAdmin,
  excluirLootAdmin,
  listarZonasAdmin,
  mensagemDeErroAdmin,
  sincronizarLootMonstroAdmin,
  sincronizarStatusEffectsMonstroAdmin,
  CHAVES_STATUS_EFFECT,
  NOME_STATUS_EFFECT,
  type AdventureMonsterApi,
  type AdventureMonsterDetailApi,
  type AdventureZoneApi,
  type LootMonstroItemPayload,
  type MonsterStatusEffectApi,
  type StatusEffectKey,
} from "@/lib/api/admin";
import { ItemSelect, formatarItemComId, useItensParaSelecaoAdmin } from "@/components/admin/ItemPicker";
import { CombatPowerCard } from "./CombatPowerCard";

const CATEGORIAS_LOOT = ["Principal", "Secundario", "Especial"] as const;

type LinhaLoot = LootMonstroItemPayload & { chaveLocal: string; nomeItem?: string };
type LinhaStatusEffect = MonsterStatusEffectApi & { chaveLocal: string };

function novaChave() {
  return `novo-${Math.random().toString(36).slice(2)}`;
}

// Especificação "Admin de Aventura + Defesa/Poder de Monstros" v3 §3 —
// editor amplo (drawer): Combate + Recompensas (form direto, sem
// estado local intermediário — cada campo já é a fonte de verdade,
// PATCH único no Salvar) + Drops (estado local, sincronização em lote,
// mesmo padrão do ZoneEditor) + Poder (só leitura, calculado pelo
// backend) + Aparições.
//
// Pedido do jogador: monstro não pode ficar "preso" às zonas que já
// tinha — o admin precisa poder vincular qualquer monstro (novo ou
// antigo) a qualquer zona (nova ou antiga) sem precisar sair daqui e
// abrir o ZoneEditor. Por isso Aparições deixou de ser só leitura: cada
// vínculo já existente é editável/desativável na hora (chamada direta,
// sem esperar o "Salvar monstro" geral) e há um "+ Adicionar zona" que
// lista TODAS as zonas ainda não vinculadas a este monstro — inclusive
// zonas recém-criadas, que antes só apareciam pelo lado do ZoneEditor.
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
  const [efeitosStatus, setEfeitosStatus] = useState<LinhaStatusEffect[]>([]);
  const [zonasCatalogo, setZonasCatalogo] = useState<AdventureZoneApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [sujo, setSujo] = useState(false);
  const [idZonaNova, setIdZonaNova] = useState<number | "">("");
  const [salvandoZona, setSalvandoZona] = useState(false);
  const { itens: itensDisponiveis } = useItensParaSelecaoAdmin();

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [d, zonas] = await Promise.all([buscarDetalheMonstroAdmin(idMonstro), listarZonasAdmin()]);
      setDetalhe(d);
      setZonasCatalogo(zonas);
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
      setEfeitosStatus(
        d.efeitosDeStatus.map((e) => ({
          chaveLocal: `existente-${e.id}`,
          id: e.id,
          status_key: e.status_key,
          chance_ppm: e.chance_ppm,
          duration_turns: e.duration_turns,
          potency_base: e.potency_base,
          ativo: e.ativo,
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

  // Um drop já salvo (tem `id`) é excluído de verdade na hora — diferente
  // de desmarcar a caixa "Ativo" (que só pausa, mantendo a configuração
  // pra reativar depois). Um drop recém-adicionado nesta sessão (ainda
  // sem `id`, nunca foi salvo) só precisa sumir do estado local.
  async function removerDrop(chave: string) {
    const linha = drops.find((l) => l.chaveLocal === chave);
    if (!linha) return;

    if (linha.id != null) {
      if (!window.confirm(`Excluir o drop de "${linha.nomeItem ?? "este item"}" permanentemente?`)) return;
      setErro("");
      try {
        await excluirLootAdmin(linha.id);
      } catch (error) {
        setErro(mensagemDeErroAdmin(error, "Não foi possível excluir o drop."));
        return;
      }
    }

    setDrops((d) => d.filter((l) => l.chaveLocal !== chave));
    marcarSujo();
  }

  // Ideia #3 da fila de melhorias — mesmo padrão de array-diff dos Drops,
  // mas sincronizado inteiro só no "Salvar monstro" (sem exclusão
  // imediata por linha: o backend não tem um DELETE avulso pra um único
  // efeito, só o PUT de sincronização da lista inteira).
  const chavesStatusJaUsadas = new Set(efeitosStatus.map((e) => e.status_key));
  const chavesStatusDisponiveis = CHAVES_STATUS_EFFECT.filter((k) => !chavesStatusJaUsadas.has(k));

  function adicionarEfeitoStatus() {
    const chave = chavesStatusDisponiveis[0];
    if (!chave) return;
    setEfeitosStatus((lista) => [
      ...lista,
      { chaveLocal: novaChave(), status_key: chave, chance_ppm: 300000, duration_turns: 2, potency_base: 0, ativo: true },
    ]);
    marcarSujo();
  }

  function atualizarEfeitoStatus(chave: string, patch: Partial<LinhaStatusEffect>) {
    setEfeitosStatus((lista) => lista.map((e) => (e.chaveLocal === chave ? { ...e, ...patch } : e)));
    marcarSujo();
  }

  function removerEfeitoStatus(chave: string) {
    setEfeitosStatus((lista) => lista.filter((e) => e.chaveLocal !== chave));
    marcarSujo();
  }

  const zonasDisponiveis = (zonasCatalogo ?? []).filter((z) => !detalhe?.zonas.some((v) => v.id_area === z.id));

  // Só atualiza `detalhe.zonas` (nunca form/drops/sujo) — recarregar o
  // detalhe inteiro aqui apagaria edições ainda não salvas nas outras
  // seções (Geral/Combate/Recompensas/Drops), já que elas só persistem
  // no "Salvar monstro". Vínculo de zona, por sua vez, é persistido na
  // hora (mesma decisão do PainelDropDoItem em Classes: são registros
  // independentes id_area+id_monstro, não um formulário só).
  async function recarregarZonas() {
    const d = await buscarDetalheMonstroAdmin(idMonstro);
    setDetalhe((atual) => (atual ? { ...atual, zonas: d.zonas } : atual));
  }

  async function adicionarZona() {
    if (idZonaNova === "") return;
    setSalvandoZona(true);
    setErro("");
    try {
      await criarAparicaoAdmin({ id_area: idZonaNova, id_monstro: idMonstro, tipo_aparicao: "Comum", peso_aparicao: 100, nivel_jogador_minimo: 1, ativo: true });
      setIdZonaNova("");
      await recarregarZonas();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível vincular o monstro a essa zona."));
    } finally {
      setSalvandoZona(false);
    }
  }

  async function atualizarVinculoZona(idVinculo: number, patch: Partial<{ tipo_aparicao: "Comum" | "Raro"; peso_aparicao: number; nivel_jogador_minimo: number; ativo: boolean }>) {
    setErro("");
    try {
      await atualizarAparicaoAdmin(idVinculo, patch);
      await recarregarZonas();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível atualizar o vínculo com a zona."));
    }
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
      await sincronizarStatusEffectsMonstroAdmin(
        idMonstro,
        efeitosStatus.map(({ chaveLocal: _chaveLocal, ...resto }) => resto),
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
              <label className="flex flex-col gap-1 text-xs">
                Imagem (URL)
                <input value={form.imagem_url ?? ""} onChange={(e) => atualizarCampo("imagem_url", e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
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
              <label className="mt-1 flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={form.disponivel_emboscada ?? true}
                  onChange={(e) => atualizarCampo("disponivel_emboscada", e.target.checked)}
                />
                Pode aparecer na Emboscada da Expedição (Mineração/Silvicultura/Exploração)
              </label>
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
                            Excluir
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

            <section className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-bold uppercase text-white/50">Status effects do ataque básico</p>
              <p className="text-[10px] text-white/40">
                Opt-in: sem nenhuma linha aqui, o monstro ataca normal (sem aplicar status nenhum). Cada chance é
                sorteada de novo a cada acerto do ataque básico contra o jogador.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-xs">
                  <thead>
                    <tr className="text-white/50">
                      <th className="pb-1 pr-2">Status</th>
                      <th className="pb-1 pr-2">Chance</th>
                      <th className="pb-1 pr-2">Duração (turnos)</th>
                      <th className="pb-1 pr-2">Potência</th>
                      <th className="pb-1 pr-2">Ativo</th>
                      <th className="pb-1" />
                    </tr>
                  </thead>
                  <tbody>
                    {efeitosStatus.map((linha) => (
                      <tr key={linha.chaveLocal} className={`border-t border-white/10 ${!linha.ativo ? "opacity-50" : ""}`}>
                        <td className="py-1 pr-2">
                          <select
                            value={linha.status_key}
                            onChange={(e) => atualizarEfeitoStatus(linha.chaveLocal, { status_key: e.target.value as StatusEffectKey })}
                            className="rounded border border-white/20 bg-black/30 px-1 py-0.5"
                          >
                            {CHAVES_STATUS_EFFECT.filter((k) => k === linha.status_key || !chavesStatusJaUsadas.has(k)).map((k) => (
                              <option key={k} value={k}>
                                {NOME_STATUS_EFFECT[k]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-1 pr-2">
                          <input
                            type="number"
                            step="0.01"
                            min={0.01}
                            max={100}
                            value={linha.chance_ppm / 10000}
                            onChange={(e) => atualizarEfeitoStatus(linha.chaveLocal, { chance_ppm: Math.round(Number(e.target.value) * 10000) })}
                            className="w-16 rounded border border-white/20 bg-black/30 px-1 py-0.5"
                          />
                          %
                        </td>
                        <td className="py-1 pr-2">
                          <input
                            type="number"
                            min={1}
                            value={linha.duration_turns}
                            onChange={(e) => atualizarEfeitoStatus(linha.chaveLocal, { duration_turns: Number(e.target.value) })}
                            className="w-16 rounded border border-white/20 bg-black/30 px-1 py-0.5"
                          />
                        </td>
                        <td className="py-1 pr-2">
                          <input
                            type="number"
                            step="0.1"
                            value={linha.potency_base}
                            onChange={(e) => atualizarEfeitoStatus(linha.chaveLocal, { potency_base: Number(e.target.value) })}
                            className="w-16 rounded border border-white/20 bg-black/30 px-1 py-0.5"
                          />
                        </td>
                        <td className="py-1 pr-2">
                          <input type="checkbox" checked={linha.ativo} onChange={(e) => atualizarEfeitoStatus(linha.chaveLocal, { ativo: e.target.checked })} />
                        </td>
                        <td className="py-1">
                          <button type="button" onClick={() => removerEfeitoStatus(linha.chaveLocal)} className="text-red-400 hover:underline">
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                    {efeitosStatus.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-3 text-center text-white/40">
                          Nenhum status configurado — ataque básico normal.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={adicionarEfeitoStatus}
                disabled={!chavesStatusDisponiveis.length}
                className="self-start rounded-lg border border-[#F3B43F]/40 px-3 py-1.5 text-xs font-bold text-[#F3B43F] hover:bg-[#F3B43F]/10 disabled:opacity-40"
              >
                + Adicionar status
              </button>
              {!chavesStatusDisponiveis.length && (
                <span className="text-[10px] text-white/40">Já configurado com todos os status existentes.</span>
              )}
            </section>

            <section className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-bold uppercase text-white/50">Aparições (zonas onde este monstro aparece)</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-xs">
                  <thead>
                    <tr className="text-white/50">
                      <th className="pb-1 pr-2">Zona</th>
                      <th className="pb-1 pr-2">Tipo</th>
                      <th className="pb-1 pr-2">Peso</th>
                      <th className="pb-1 pr-2">Nv. mín.</th>
                      <th className="pb-1 pr-2">Ativo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detalhe?.zonas ?? []).map((z) => (
                      <tr key={z.id} className={`border-t border-white/10 ${!z.ativo ? "opacity-50" : ""}`}>
                        <td className="py-1 pr-2 font-bold">{z.nome_zona ?? `Zona #${z.id_area}`}</td>
                        <td className="py-1 pr-2">
                          <select
                            value={z.tipo_aparicao}
                            onChange={(e) => atualizarVinculoZona(z.id, { tipo_aparicao: e.target.value as "Comum" | "Raro" })}
                            className="rounded border border-white/20 bg-black/30 px-1 py-0.5"
                          >
                            <option value="Comum">Comum</option>
                            <option value="Raro">Raro</option>
                          </select>
                        </td>
                        <td className="py-1 pr-2">
                          <input
                            type="number"
                            min={1}
                            defaultValue={z.peso_aparicao}
                            onBlur={(e) => atualizarVinculoZona(z.id, { peso_aparicao: Number(e.target.value) })}
                            className="w-16 rounded border border-white/20 bg-black/30 px-1 py-0.5"
                          />
                        </td>
                        <td className="py-1 pr-2">
                          <input
                            type="number"
                            min={1}
                            defaultValue={z.nivel_jogador_minimo}
                            onBlur={(e) => atualizarVinculoZona(z.id, { nivel_jogador_minimo: Number(e.target.value) })}
                            className="w-14 rounded border border-white/20 bg-black/30 px-1 py-0.5"
                          />
                        </td>
                        <td className="py-1 pr-2">
                          <input type="checkbox" checked={z.ativo} onChange={(e) => atualizarVinculoZona(z.id, { ativo: e.target.checked })} />
                        </td>
                      </tr>
                    ))}
                    {!detalhe?.zonas.length && (
                      <tr>
                        <td colSpan={5} className="py-3 text-center text-white/40">
                          Nenhuma zona vinculada ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={idZonaNova}
                  onChange={(e) => setIdZonaNova(e.target.value ? Number(e.target.value) : "")}
                  className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-xs"
                >
                  <option value="">Escolha uma zona...</option>
                  {zonasDisponiveis.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.nome}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={adicionarZona}
                  disabled={salvandoZona || idZonaNova === ""}
                  className="rounded-lg border border-[#F3B43F]/40 px-3 py-1.5 text-xs font-bold text-[#F3B43F] hover:bg-[#F3B43F]/10 disabled:opacity-40"
                >
                  {salvandoZona ? "Vinculando..." : "+ Adicionar zona"}
                </button>
                {!zonasDisponiveis.length && <span className="text-[10px] text-white/40">Já vinculado a todas as zonas existentes.</span>}
              </div>
            </section>
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
