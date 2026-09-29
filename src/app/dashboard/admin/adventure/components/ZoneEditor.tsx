"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  atualizarZonaAdmin,
  listarAparicoesAdmin,
  listarMonstrosAdmin,
  mensagemDeErroAdmin,
  sincronizarRosterZonaAdmin,
  type AdventureMonsterApi,
  type AdventureZoneApi,
  type RosterZonaItemPayload,
} from "@/lib/api/admin";

// Especificação "Admin de Aventura + Defesa/Poder de Monstros" v3 §2 —
// editor amplo (drawer): campos gerais da zona + elenco de monstros
// (Aparições, agora incorporado aqui — a aba separada foi removida).
// Toda edição de roster fica em estado LOCAL (§2.3): nada de PATCH por
// linha no onBlur; uma única sincronização vai pro backend ao clicar
// "Salvar zona".
type LinhaRoster = RosterZonaItemPayload & { chaveLocal: string };

function novaChave() {
  return `nova-${Math.random().toString(36).slice(2)}`;
}

export function ZoneEditor({ zona, onFechar, onSalvo }: { zona: AdventureZoneApi; onFechar: () => void; onSalvo: () => void }) {
  const [form, setForm] = useState<Partial<AdventureZoneApi>>(zona);
  const [monstrosCatalogo, setMonstrosCatalogo] = useState<AdventureMonsterApi[]>([]);
  const [roster, setRoster] = useState<LinhaRoster[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [sujo, setSujo] = useState(false);
  const [idMonstroNovo, setIdMonstroNovo] = useState<number | "">("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [monstros, aparicoes] = await Promise.all([listarMonstrosAdmin(), listarAparicoesAdmin(zona.id)]);
      setMonstrosCatalogo(monstros);
      setRoster(
        aparicoes.map((a) => ({
          chaveLocal: `existente-${a.id_monstro}`,
          id_monstro: a.id_monstro,
          tipo_aparicao: a.tipo_aparicao,
          peso_aparicao: a.peso_aparicao,
          nivel_jogador_minimo: a.nivel_jogador_minimo,
          ativo: a.ativo,
        })),
      );
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar o elenco da zona."));
    } finally {
      setCarregando(false);
    }
  }, [zona.id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function marcarSujo() {
    setSujo(true);
  }

  function atualizarCampoZona<K extends keyof AdventureZoneApi>(campo: K, valor: AdventureZoneApi[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
    marcarSujo();
  }

  const somaPesosAtivos = useMemo(() => roster.filter((l) => l.ativo).reduce((soma, l) => soma + (l.peso_aparicao || 0), 0), [roster]);

  function chancePercentual(linha: LinhaRoster) {
    if (!linha.ativo || somaPesosAtivos <= 0) return 0;
    return (linha.peso_aparicao / somaPesosAtivos) * 100;
  }

  const monstrosDisponiveis = useMemo(
    () => monstrosCatalogo.filter((m) => !roster.some((l) => l.id_monstro === m.id)),
    [monstrosCatalogo, roster],
  );

  function adicionarMonstro() {
    if (idMonstroNovo === "") return;
    setRoster((r) => [
      ...r,
      { chaveLocal: novaChave(), id_monstro: idMonstroNovo, tipo_aparicao: "Comum", peso_aparicao: 100, nivel_jogador_minimo: 1, ativo: true },
    ]);
    setIdMonstroNovo("");
    marcarSujo();
  }

  function atualizarLinha(chave: string, patch: Partial<LinhaRoster>) {
    setRoster((r) => r.map((l) => (l.chaveLocal === chave ? { ...l, ...patch } : l)));
    marcarSujo();
  }

  function removerLinha(chave: string) {
    setRoster((r) => r.filter((l) => l.chaveLocal !== chave));
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
      await atualizarZonaAdmin(zona.id, form);
      await sincronizarRosterZonaAdmin(
        zona.id,
        roster.map(({ chaveLocal: _chaveLocal, ...resto }) => resto),
      );
      onSalvo();
    } catch (error) {
      // §2.3 — se a sincronização falhar, mantém o formulário aberto
      // com os dados locais intactos (não fecha, não perde o que o
      // admin editou).
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar a zona."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={fechar}>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[90vh] w-full max-w-3xl flex-col gap-4 overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
        <p className="font-imFeel text-2xl text-[#F3B43F]">Editar Zona: {zona.nome}</p>
        {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}

        <section className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-xs font-bold uppercase text-white/50">Geral</p>
          <label className="flex flex-col gap-1 text-xs">
            Nome
            <input required value={form.nome ?? ""} onChange={(e) => atualizarCampoZona("nome", e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Descrição
            <textarea value={form.descricao ?? ""} onChange={(e) => atualizarCampoZona("descricao", e.target.value)} rows={2} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
          </label>
          <div className="flex gap-2">
            <label className="flex flex-1 flex-col gap-1 text-xs">
              Nível mín. dos monstros
              <input type="number" value={form.nivel_monstro_min ?? 1} onChange={(e) => atualizarCampoZona("nivel_monstro_min", Number(e.target.value))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-xs">
              Nível máx. dos monstros
              <input type="number" value={form.nivel_monstro_max ?? 5} onChange={(e) => atualizarCampoZona("nivel_monstro_max", Number(e.target.value))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-xs">
              Ordem
              <input type="number" value={form.ordem ?? 0} onChange={(e) => atualizarCampoZona("ordem", Number(e.target.value))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
          </div>
          <p className="text-[10px] text-white/40">
            Nível mín./máx. dos monstros é só indicativo (badge de perigo pro jogador) — quem de fato TRAVA a
            entrada na zona é o campo abaixo.
          </p>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-bold text-[#F3B43F]">Nível mínimo pra ENTRAR na zona</span>
            <input
              type="number"
              min={1}
              value={form.nivel_jogador_minimo ?? 1}
              onChange={(e) => atualizarCampoZona("nivel_jogador_minimo", Number(e.target.value))}
              className="rounded-lg border-2 border-[#F3B43F]/50 bg-black/30 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Imagem (URL)
            <input value={form.imagem_url ?? ""} onChange={(e) => atualizarCampoZona("imagem_url", e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={form.ativa ?? true} onChange={(e) => atualizarCampoZona("ativa", e.target.checked)} />
            Zona ativa
          </label>
        </section>

        <section className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase text-white/50">Monstros desta zona</p>
            <p className="text-[10px] text-white/40">Soma de pesos ativos: {somaPesosAtivos}</p>
          </div>
          {carregando ? (
            <p className="text-sm text-white/50">Carregando elenco...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead>
                  <tr className="text-white/50">
                    <th className="pb-1 pr-2">Monstro</th>
                    <th className="pb-1 pr-2">Tipo</th>
                    <th className="pb-1 pr-2">Peso</th>
                    <th className="pb-1 pr-2">Chance</th>
                    <th className="pb-1 pr-2">Nv. mín.</th>
                    <th className="pb-1 pr-2">Ativo</th>
                    <th className="pb-1" />
                  </tr>
                </thead>
                <tbody>
                  {roster.map((linha) => {
                    const monstro = monstrosCatalogo.find((m) => m.id === linha.id_monstro);
                    return (
                      <tr key={linha.chaveLocal} className={`border-t border-white/10 ${!linha.ativo ? "opacity-50" : ""}`}>
                        <td className="py-1 pr-2 font-bold">{monstro?.nome ?? `#${linha.id_monstro}`}</td>
                        <td className="py-1 pr-2">
                          <select value={linha.tipo_aparicao} onChange={(e) => atualizarLinha(linha.chaveLocal, { tipo_aparicao: e.target.value as "Comum" | "Raro" })} className="rounded border border-white/20 bg-black/30 px-1 py-0.5">
                            <option value="Comum">Comum</option>
                            <option value="Raro">Raro</option>
                          </select>
                        </td>
                        <td className="py-1 pr-2">
                          <input type="number" min={1} value={linha.peso_aparicao} onChange={(e) => atualizarLinha(linha.chaveLocal, { peso_aparicao: Number(e.target.value) })} className="w-16 rounded border border-white/20 bg-black/30 px-1 py-0.5" />
                        </td>
                        <td className="py-1 pr-2 text-[#F3B43F]">{chancePercentual(linha).toFixed(1)}%</td>
                        <td className="py-1 pr-2">
                          <input type="number" min={1} value={linha.nivel_jogador_minimo} onChange={(e) => atualizarLinha(linha.chaveLocal, { nivel_jogador_minimo: Number(e.target.value) })} className="w-14 rounded border border-white/20 bg-black/30 px-1 py-0.5" />
                        </td>
                        <td className="py-1 pr-2">
                          <input type="checkbox" checked={linha.ativo} onChange={(e) => atualizarLinha(linha.chaveLocal, { ativo: e.target.checked })} />
                        </td>
                        <td className="py-1">
                          <button type="button" onClick={() => removerLinha(linha.chaveLocal)} className="text-red-400 hover:underline">
                            Remover
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {roster.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-3 text-center text-white/40">
                        Nenhum monstro vinculado ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <select
              value={idMonstroNovo}
              onChange={(e) => setIdMonstroNovo(e.target.value ? Number(e.target.value) : "")}
              className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-xs"
            >
              <option value="">Escolha um monstro...</option>
              {monstrosDisponiveis.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
            <button type="button" onClick={adicionarMonstro} disabled={idMonstroNovo === ""} className="self-start rounded-lg border border-[#F3B43F]/40 px-3 py-1.5 text-xs font-bold text-[#F3B43F] hover:bg-[#F3B43F]/10 disabled:opacity-40">
              + Adicionar monstro
            </button>
            {!monstrosDisponiveis.length && <span className="text-[10px] text-white/40">Todos os monstros já estão vinculados a esta zona.</span>}
          </div>
        </section>

        <div className="mt-1 flex justify-end gap-2">
          <button type="button" onClick={fechar} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">
            Cancelar
          </button>
          <button type="button" onClick={salvar} disabled={salvando || carregando} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
            {salvando ? "Salvando..." : "Salvar zona"}
          </button>
        </div>
      </div>
    </div>
  );
}
