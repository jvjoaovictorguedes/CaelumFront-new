"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  atualizarLootAdmin,
  listarAparicoesAdmin,
  listarLootAdmin,
  listarMonstrosAdmin,
  listarZonasAdmin,
  mensagemDeErroAdmin,
  type AdventureMonsterApi,
  type AdventureMonsterLootApi,
  type AdventureZoneApi,
  type AdventureZoneMonsterApi,
} from "@/lib/api/admin";
import { formatarItemComId } from "@/components/admin/ItemPicker";

// Especificação "Admin de Aventura + Defesa/Poder de Monstros" v3 §4.3
// — a aba Drops é principalmente consulta/auditoria (editar
// chance/quantidade/categoria continua sendo trabalho do
// MonsterEditor). Agrupa Zona > Monstro > Itens, com busca reversa
// (por item) e alertas de configuração suspeita.
//
// Bug real reportado: "não dá pra remover drop de monstro do painel de
// admin da aventura" — a lista era 100% somente leitura (só um link
// "Editar monstro" que abre outra tela); o admin não tinha NENHUMA
// ação direta aqui, mesmo pra algo tão comum quanto desativar um drop
// que ele está vendo na auditoria. Por isso "Remover"/"Reativar" abaixo
// chama atualizarLootAdmin direto (mesma ação de ativo/inativo que o
// MonsterEditor já usa — nunca um segundo caminho de edição), com
// refresh da lista logo depois.
export function DropsAuditTab({ onEditarMonstro }: { onEditarMonstro: (idMonstro: number) => void }) {
  const [zonas, setZonas] = useState<AdventureZoneApi[]>([]);
  const [monstros, setMonstros] = useState<AdventureMonsterApi[]>([]);
  const [vinculos, setVinculos] = useState<AdventureZoneMonsterApi[]>([]);
  const [loot, setLoot] = useState<AdventureMonsterLootApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [zonaFiltro, setZonaFiltro] = useState<number | "">("");
  const [monstroFiltro, setMonstroFiltro] = useState<number | "">("");
  const [itemBusca, setItemBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<"todas" | AdventureMonsterLootApi["categoria"]>("todas");
  const [statusFiltro, setStatusFiltro] = useState<"todos" | "ativo" | "inativo">("todos");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [z, m, v, l] = await Promise.all([listarZonasAdmin(), listarMonstrosAdmin(), listarAparicoesAdmin(), listarLootAdmin()]);
      setZonas(z);
      setMonstros(m);
      setVinculos(v);
      setLoot(l);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar os drops."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function alternarAtivoDrop(entrada: AdventureMonsterLootApi) {
    setErro("");
    try {
      await atualizarLootAdmin(entrada.id, { ativo: !entrada.ativo });
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível atualizar o drop."));
    }
  }

  const lootPorMonstro = useMemo(() => {
    const mapa = new Map<number, AdventureMonsterLootApi[]>();
    for (const l of loot) {
      if (!mapa.has(l.id_monstro)) mapa.set(l.id_monstro, []);
      mapa.get(l.id_monstro)!.push(l);
    }
    return mapa;
  }, [loot]);

  // §4.3 alertas — computados aqui, sem endpoint novo (só a lista já
  // consultada).
  const alertasPorMonstro = useMemo(() => {
    const mapa = new Map<number, string[]>();
    for (const [idMonstro, entradas] of lootPorMonstro) {
      const alertas: string[] = [];
      const ativos = entradas.filter((e) => e.ativo);
      if (ativos.length === 0) alertas.push("Sem nenhum drop ativo");
      const contagemPorItem = new Map<number, number>();
      for (const e of ativos) contagemPorItem.set(e.id_item, (contagemPorItem.get(e.id_item) ?? 0) + 1);
      if ([...contagemPorItem.values()].some((c) => c > 1)) alertas.push("Item duplicado entre entradas ativas");
      if (entradas.some((e) => e.quantidade_min > e.quantidade_max)) alertas.push("quantidade_min > quantidade_max");
      mapa.set(idMonstro, alertas);
    }
    return mapa;
  }, [lootPorMonstro]);

  const zonasPorMonstro = useMemo(() => {
    const mapa = new Map<number, { id_area: number; nome: string }[]>();
    for (const v of vinculos) {
      if (!mapa.has(v.id_monstro)) mapa.set(v.id_monstro, []);
      if (v.AdventureZone) mapa.get(v.id_monstro)!.push({ id_area: v.AdventureZone.id, nome: v.AdventureZone.nome });
    }
    return mapa;
  }, [vinculos]);

  const termoItem = itemBusca.trim().toLowerCase();

  function monstroPassaFiltros(monstro: AdventureMonsterApi): boolean {
    if (monstroFiltro !== "" && monstro.id !== monstroFiltro) return false;
    if (zonaFiltro !== "" && !zonasPorMonstro.get(monstro.id)?.some((z) => z.id_area === zonaFiltro)) return false;
    const entradas = lootPorMonstro.get(monstro.id) ?? [];
    const entradasFiltradas = entradas.filter((e) => {
      if (categoriaFiltro !== "todas" && e.categoria !== categoriaFiltro) return false;
      if (statusFiltro !== "todos" && (statusFiltro === "ativo") !== e.ativo) return false;
      if (termoItem && !(e.item?.nome.toLowerCase().includes(termoItem) || String(e.id_item).includes(termoItem))) return false;
      return true;
    });
    if ((categoriaFiltro !== "todas" || statusFiltro !== "todos" || termoItem) && entradasFiltradas.length === 0) return false;
    return true;
  }

  function entradasVisiveis(idMonstro: number): AdventureMonsterLootApi[] {
    const entradas = lootPorMonstro.get(idMonstro) ?? [];
    return entradas.filter((e) => {
      if (categoriaFiltro !== "todas" && e.categoria !== categoriaFiltro) return false;
      if (statusFiltro !== "todos" && (statusFiltro === "ativo") !== e.ativo) return false;
      if (termoItem && !(e.item?.nome.toLowerCase().includes(termoItem) || String(e.id_item).includes(termoItem))) return false;
      return true;
    });
  }

  // Agrupamento Zona > Monstro (§4.3) — monstro sem NENHUM vínculo de
  // zona cai num grupo à parte, pra nunca desaparecer da auditoria.
  const grupos = useMemo(() => {
    const porZona = zonas
      .filter((z) => zonaFiltro === "" || z.id === zonaFiltro)
      .map((zona) => ({
        zona,
        monstros: monstros.filter((m) => zonasPorMonstro.get(m.id)?.some((z) => z.id_area === zona.id) && monstroPassaFiltros(m)),
      }))
      .filter((g) => g.monstros.length > 0);

    const semZona =
      zonaFiltro === ""
        ? monstros.filter((m) => !(zonasPorMonstro.get(m.id)?.length) && monstroPassaFiltros(m))
        : [];

    return { porZona, semZona };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zonas, monstros, zonaFiltro, monstroFiltro, categoriaFiltro, statusFiltro, termoItem, zonasPorMonstro, lootPorMonstro]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <select value={zonaFiltro} onChange={(e) => setZonaFiltro(e.target.value ? Number(e.target.value) : "")} className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white">
          <option value="">Todas as zonas</option>
          {zonas.map((z) => (
            <option key={z.id} value={z.id}>
              {z.nome}
            </option>
          ))}
        </select>
        <select value={monstroFiltro} onChange={(e) => setMonstroFiltro(e.target.value ? Number(e.target.value) : "")} className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white">
          <option value="">Todos os monstros</option>
          {monstros.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </select>
        <input
          value={itemBusca}
          onChange={(e) => setItemBusca(e.target.value)}
          placeholder="Busca reversa: nome/ID do item..."
          className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white"
        />
        <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value as typeof categoriaFiltro)} className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white">
          <option value="todas">Todas categorias</option>
          <option value="Principal">Principal</option>
          <option value="Secundario">Secundario</option>
          <option value="Especial">Especial</option>
        </select>
        <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value as typeof statusFiltro)} className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white">
          <option value="todos">Ativos e inativos</option>
          <option value="ativo">Só ativos</option>
          <option value="inativo">Só inativos</option>
        </select>
      </div>
      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      {carregando ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : (
        <div className="flex flex-col gap-4">
          {grupos.porZona.map(({ zona, monstros: monstrosDaZona }) => (
            <section key={zona.id} className="flex flex-col gap-2">
              <p className="font-imFeel text-lg text-[#F3B43F]">{zona.nome}</p>
              <div className="flex flex-col gap-2">
                {monstrosDaZona.map((monstro) => (
                  <GrupoMonstro key={monstro.id} monstro={monstro} entradas={entradasVisiveis(monstro.id)} alertas={alertasPorMonstro.get(monstro.id) ?? []} onEditar={() => onEditarMonstro(monstro.id)} onAlternarAtivo={alternarAtivoDrop} />
                ))}
              </div>
            </section>
          ))}
          {grupos.semZona.length > 0 && (
            <section className="flex flex-col gap-2">
              <p className="font-imFeel text-lg text-white/60">Sem zona vinculada</p>
              <div className="flex flex-col gap-2">
                {grupos.semZona.map((monstro) => (
                  <GrupoMonstro key={monstro.id} monstro={monstro} entradas={entradasVisiveis(monstro.id)} alertas={alertasPorMonstro.get(monstro.id) ?? []} onEditar={() => onEditarMonstro(monstro.id)} onAlternarAtivo={alternarAtivoDrop} />
                ))}
              </div>
            </section>
          )}
          {grupos.porZona.length === 0 && grupos.semZona.length === 0 && <p className="text-sm text-white/50">Nenhum resultado pros filtros aplicados.</p>}
        </div>
      )}
    </div>
  );
}

function GrupoMonstro({
  monstro,
  entradas,
  alertas,
  onEditar,
  onAlternarAtivo,
}: {
  monstro: AdventureMonsterApi;
  entradas: AdventureMonsterLootApi[];
  alertas: string[];
  onEditar: () => void;
  onAlternarAtivo: (entrada: AdventureMonsterLootApi) => void;
}) {
  return (
    <div className="rounded-xl border border-[#F3B43F]/30 bg-[#292018]/80 p-3 text-white">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-bold">{monstro.nome}</p>
        <button type="button" onClick={onEditar} className="text-xs text-[#F3B43F] hover:underline">
          Editar monstro
        </button>
      </div>
      {alertas.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {alertas.map((a) => (
            <span key={a} className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300">
              ⚠ {a}
            </span>
          ))}
        </div>
      )}
      {entradas.length === 0 ? (
        <p className="text-xs text-white/40">Nenhum drop nesse filtro.</p>
      ) : (
        <ul className="flex flex-col gap-1 text-xs text-white/70">
          {entradas.map((e) => (
            <li key={e.id} className={`flex items-center justify-between gap-2 ${!e.ativo ? "opacity-50" : ""}`}>
              <span>
                {e.item ? formatarItemComId(e.item.nome, e.id_item) : `Item #${e.id_item}`} · {(e.chance_ppm / 10000).toFixed(2)}% · x{e.quantidade_min}-{e.quantidade_max} · {e.categoria}
                {!e.ativo && " (inativo)"}
              </span>
              <button type="button" onClick={() => onAlternarAtivo(e)} className={e.ativo ? "text-red-400 hover:underline" : "text-[#F3B43F] hover:underline"}>
                {e.ativo ? "Remover" : "Reativar"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
