"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  atualizarFishingAffinityAdmin,
  atualizarFishingBaitAdmin,
  atualizarFishingPoolAdmin,
  atualizarFishingPortAdmin,
  atualizarFishingSpeciesAdmin,
  atualizarFishingTournamentAdmin,
  atualizarFishingZoneAdmin,
  atualizarMarineRouteAdmin,
  atualizarVesselAdmin,
  criarFishingAffinityAdmin,
  criarFishingBaitAdmin,
  criarFishingPoolAdmin,
  criarFishingPortAdmin,
  criarFishingSpeciesAdmin,
  criarFishingTournamentAdmin,
  criarFishingZoneAdmin,
  criarMarineRouteAdmin,
  criarVesselAdmin,
  listarFishingAffinitiesAdmin,
  listarFishingBaitsAdmin,
  listarFishingPoolAdmin,
  listarFishingPortsAdmin,
  listarFishingSpeciesAdmin,
  listarFishingTournamentsAdmin,
  listarFishingZonesAdmin,
  listarMarineRoutesAdmin,
  listarVesselsAdmin,
  mensagemDeErroAdmin,
  type ComportamentoEspecie,
  type FishingAffinityAdminApi,
  type FishingBaitAdminApi,
  type FishingPoolAdminApi,
  type FishingPortAdminApi,
  type FishingSpeciesAdminApi,
  type FishingTournamentAdminApi,
  type FishingZoneAdminApi,
  type MarineRouteAdminApi,
  type PayloadFishingAffinityAdmin,
  type PayloadFishingBaitAdmin,
  type PayloadFishingPoolAdmin,
  type PayloadFishingPortAdmin,
  type PayloadFishingSpeciesAdmin,
  type PayloadFishingTournamentAdmin,
  type PayloadFishingZoneAdmin,
  type PayloadMarineRouteAdmin,
  type PayloadVesselAdmin,
  type PerfilPeso,
  type VesselAdminApi,
} from "@/lib/api/admin";
import { ItemSelect, formatarItemComId, useItensParaSelecaoAdmin } from "@/components/admin/ItemPicker";

type Aba = "Zonas" | "Especies" | "Pool" | "Portos" | "Iscas" | "Afinidades" | "Embarcacoes" | "Rotas" | "Torneios";
const ABAS: Aba[] = ["Zonas", "Especies", "Pool", "Portos", "Iscas", "Afinidades", "Embarcacoes", "Rotas", "Torneios"];
const ROTULO_ABA: Record<Aba, string> = {
  Zonas: "Zonas",
  Especies: "Espécies",
  Pool: "Pool (Zona × Espécie)",
  Portos: "Portos",
  Iscas: "Iscas",
  Afinidades: "Afinidades (Isca × Espécie)",
  Embarcacoes: "Embarcações",
  Rotas: "Rotas Marítimas",
  Torneios: "Torneios",
};

const COMPORTAMENTOS: ComportamentoEspecie[] = ["CALM", "BURST", "ERRATIC", "ENDURANCE", "DEEP_DIVE"];
const PERFIS_PESO: PerfilPeso[] = ["LIGHT", "NORMAL", "HEAVY"];

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#F3B43F]/80">{titulo}</p>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm text-white ${props.className ?? ""}`} />;
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm text-white ${props.className ?? ""}`} />;
}

function BotaoSalvar({ disabled }: { disabled: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="rounded-lg bg-[#BC8418] px-4 py-1.5 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50"
    >
      {disabled ? "Salvando..." : "Salvar"}
    </button>
  );
}

export default function AdminFishingClient() {
  const [aba, setAba] = useState<Aba>("Zonas");
  const [erro, setErro] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Pesca & Navegação</h1>
        <p className="mt-1 text-sm text-white/60">Zonas, espécies, pool de encontro, portos, iscas e afinidades.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ABAS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => {
              setAba(a);
              setErro("");
            }}
            className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${
              aba === a ? "bg-[#F3B43F] text-black" : "bg-black/20 text-white/70 hover:text-white"
            }`}
          >
            {ROTULO_ABA[a]}
          </button>
        ))}
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}

      {aba === "Zonas" && <AbaZonas onErro={setErro} />}
      {aba === "Especies" && <AbaEspecies onErro={setErro} />}
      {aba === "Pool" && <AbaPool onErro={setErro} />}
      {aba === "Portos" && <AbaPortos onErro={setErro} />}
      {aba === "Iscas" && <AbaIscas onErro={setErro} />}
      {aba === "Afinidades" && <AbaAfinidades onErro={setErro} />}
      {aba === "Embarcacoes" && <AbaEmbarcacoes onErro={setErro} />}
      {aba === "Rotas" && <AbaRotas onErro={setErro} />}
      {aba === "Torneios" && <AbaTorneios onErro={setErro} />}
    </div>
  );
}

// ---------------------------------------------------------------- ZONAS
function AbaZonas({ onErro }: { onErro: (m: string) => void }) {
  const [zonas, setZonas] = useState<FishingZoneAdminApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<FishingZoneAdminApi | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<PayloadFishingZoneAdmin>({ key: "", nome: "", nivel_pesca_minimo: 1, tier_embarcacao_minimo: 1, dificuldade_ambiente: 100 });

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setZonas(await listarFishingZonesAdmin());
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível carregar as zonas de pesca."));
    } finally {
      setCarregando(false);
    }
  }, [onErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirCriacao() {
    setEditando(null);
    setForm({ key: "", nome: "", nivel_pesca_minimo: 1, tier_embarcacao_minimo: 1, dificuldade_ambiente: 100 });
    setMostrarForm(true);
  }

  function abrirEdicao(zona: FishingZoneAdminApi) {
    setEditando(zona);
    setForm({
      nome: zona.nome,
      descricao: zona.descricao ?? "",
      imagem_url: zona.imagem_url ?? "",
      id_world_node: zona.id_world_node,
      nivel_pesca_minimo: zona.nivel_pesca_minimo,
      tier_embarcacao_minimo: zona.tier_embarcacao_minimo,
      dificuldade_ambiente: zona.dificuldade_ambiente,
      ativo: zona.ativo,
    });
    setMostrarForm(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      if (editando) await atualizarFishingZoneAdmin(editando.id, form);
      else await criarFishingZoneAdmin(form);
      setMostrarForm(false);
      await carregar();
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível salvar a zona."));
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivo(zona: FishingZoneAdminApi) {
    try {
      await atualizarFishingZoneAdmin(zona.id, { nome: zona.nome, ativo: !zona.ativo });
      await carregar();
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível mudar o status."));
    }
  }

  return (
    <Secao titulo="Zonas de pesca">
      <button type="button" onClick={abrirCriacao} className="mb-3 rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
        + Nova zona
      </button>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-white/50">
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Key</th>
              <th className="px-3 py-2">Nó do mapa</th>
              <th className="px-3 py-2">Nível mín.</th>
              <th className="px-3 py-2">Dificuldade</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={7} className="px-3 py-4 text-center text-white/50">Carregando...</td></tr>
            ) : zonas.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-4 text-center text-white/50">Nenhuma zona cadastrada.</td></tr>
            ) : (
              zonas.map((z) => (
                <tr key={z.id} className="border-b border-white/5">
                  <td className="px-3 py-2 font-bold">{z.nome}</td>
                  <td className="px-3 py-2 text-white/60">{z.key}</td>
                  <td className="px-3 py-2 text-white/60">{z.WorldMapNode?.nome ?? "—"}</td>
                  <td className="px-3 py-2">{z.nivel_pesca_minimo}</td>
                  <td className="px-3 py-2">{z.dificuldade_ambiente}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${z.ativo ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/60"}`}>
                      {z.ativo ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => abrirEdicao(z)} className="text-[#F3B43F] hover:underline">Editar</button>
                      <button type="button" onClick={() => alternarAtivo(z)} className="text-white/70 hover:underline">{z.ativo ? "Desativar" : "Ativar"}</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMostrarForm(false)}>
          <form onSubmit={salvar} onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-[#F3B43F]">{editando ? "Editar zona" : "Nova zona"}</p>
            {!editando && (
              <label className="flex flex-col gap-1 text-xs">key (identificador único)
                <Input required value={form.key ?? ""} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))} />
              </label>
            )}
            <label className="flex flex-col gap-1 text-xs">Nome
              <Input required value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1 text-xs">Descrição
              <Input value={form.descricao ?? ""} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1 text-xs">id_world_node (opcional)
              <Input type="number" value={form.id_world_node ?? ""} onChange={(e) => setForm((f) => ({ ...f, id_world_node: e.target.value ? Number(e.target.value) : null }))} />
            </label>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">Nível de pesca mín.
                <Input type="number" value={form.nivel_pesca_minimo ?? 1} onChange={(e) => setForm((f) => ({ ...f, nivel_pesca_minimo: Number(e.target.value) }))} />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">Tier embarcação mín.
                <Input type="number" value={form.tier_embarcacao_minimo ?? 1} onChange={(e) => setForm((f) => ({ ...f, tier_embarcacao_minimo: Number(e.target.value) }))} />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">Dificuldade ambiente
                <Input type="number" value={form.dificuldade_ambiente ?? 100} onChange={(e) => setForm((f) => ({ ...f, dificuldade_ambiente: Number(e.target.value) }))} />
              </label>
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setMostrarForm(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">Cancelar</button>
              <BotaoSalvar disabled={salvando} />
            </div>
          </form>
        </div>
      )}
    </Secao>
  );
}

// ------------------------------------------------------------ ESPÉCIES
function AbaEspecies({ onErro }: { onErro: (m: string) => void }) {
  const [especies, setEspecies] = useState<FishingSpeciesAdminApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<FishingSpeciesAdminApi | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<PayloadFishingSpeciesAdmin>({
    key: "", id_item: undefined, comportamento_key: "CALM", dificuldade_base: 100, peso_min_g: 100, peso_max_g: 500, perfil_peso: "NORMAL",
  });
  const { itens: itensDisponiveis } = useItensParaSelecaoAdmin();

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setEspecies(await listarFishingSpeciesAdmin());
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível carregar as espécies."));
    } finally {
      setCarregando(false);
    }
  }, [onErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirCriacao() {
    setEditando(null);
    setForm({ key: "", id_item: undefined, comportamento_key: "CALM", dificuldade_base: 100, peso_min_g: 100, peso_max_g: 500, perfil_peso: "NORMAL" });
    setMostrarForm(true);
  }

  function abrirEdicao(especie: FishingSpeciesAdminApi) {
    setEditando(especie);
    setForm({
      nome_cientifico: especie.nome_cientifico ?? "",
      descricao: especie.descricao ?? "",
      comportamento_key: especie.comportamento_key,
      dificuldade_base: especie.dificuldade_base,
      peso_min_g: especie.peso_min_g,
      peso_max_g: especie.peso_max_g,
      perfil_peso: especie.perfil_peso,
      pontos_base_torneio: especie.pontos_base_torneio,
      lendario: especie.lendario,
      ativo: especie.ativo,
    });
    setMostrarForm(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      if (editando) await atualizarFishingSpeciesAdmin(editando.id, form);
      else await criarFishingSpeciesAdmin(form);
      setMostrarForm(false);
      await carregar();
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível salvar a espécie."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Secao titulo="Espécies (vinculadas a um Item existente)">
      <button type="button" onClick={abrirCriacao} className="mb-3 rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
        + Nova espécie
      </button>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-white/50">
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2">Key</th>
              <th className="px-3 py-2">Comportamento</th>
              <th className="px-3 py-2">Dificuldade</th>
              <th className="px-3 py-2">Peso (g)</th>
              <th className="px-3 py-2">Lendário</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={8} className="px-3 py-4 text-center text-white/50">Carregando...</td></tr>
            ) : especies.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-4 text-center text-white/50">Nenhuma espécie cadastrada.</td></tr>
            ) : (
              especies.map((e) => (
                <tr key={e.id} className="border-b border-white/5">
                  <td className="px-3 py-2 font-bold">{e.item ? formatarItemComId(e.item.nome, e.id_item) : `#${e.id_item}`}</td>
                  <td className="px-3 py-2 text-white/60">{e.key}</td>
                  <td className="px-3 py-2">{e.comportamento_key}</td>
                  <td className="px-3 py-2">{e.dificuldade_base}</td>
                  <td className="px-3 py-2 text-white/60">{e.peso_min_g}–{e.peso_max_g}</td>
                  <td className="px-3 py-2">{e.lendario ? "Sim" : "Não"}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${e.ativo ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/60"}`}>
                      {e.ativo ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => abrirEdicao(e)} className="text-[#F3B43F] hover:underline">Editar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMostrarForm(false)}>
          <form onSubmit={salvar} onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-[#F3B43F]">{editando ? "Editar espécie" : "Nova espécie"}</p>
            {!editando && (
              <>
                <label className="flex flex-col gap-1 text-xs">key (identificador único)
                  <Input required value={form.key ?? ""} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))} />
                </label>
                <label className="flex flex-col gap-1 text-xs">Item (já cadastrado em Itens)
                  <ItemSelect
                    itens={itensDisponiveis}
                    value={form.id_item ?? ""}
                    onChange={(id) => setForm((f) => ({ ...f, id_item: id === "" ? undefined : id }))}
                  />
                </label>
              </>
            )}
            <label className="flex flex-col gap-1 text-xs">Nome científico (opcional)
              <Input value={form.nome_cientifico ?? ""} onChange={(e) => setForm((f) => ({ ...f, nome_cientifico: e.target.value }))} />
            </label>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">Comportamento
                <Select value={form.comportamento_key} onChange={(e) => setForm((f) => ({ ...f, comportamento_key: e.target.value as ComportamentoEspecie }))}>
                  {COMPORTAMENTOS.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">Perfil de peso
                <Select value={form.perfil_peso ?? "NORMAL"} onChange={(e) => setForm((f) => ({ ...f, perfil_peso: e.target.value as PerfilPeso }))}>
                  {PERFIS_PESO.map((p) => <option key={p} value={p}>{p}</option>)}
                </Select>
              </label>
            </div>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">Dificuldade (1–1000)
                <Input type="number" min={1} max={1000} value={form.dificuldade_base} onChange={(e) => setForm((f) => ({ ...f, dificuldade_base: Number(e.target.value) }))} />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">Pontos torneio
                <Input type="number" value={form.pontos_base_torneio ?? 100} onChange={(e) => setForm((f) => ({ ...f, pontos_base_torneio: Number(e.target.value) }))} />
              </label>
            </div>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">Peso mín. (g)
                <Input type="number" value={form.peso_min_g} onChange={(e) => setForm((f) => ({ ...f, peso_min_g: Number(e.target.value) }))} />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">Peso máx. (g)
                <Input type="number" value={form.peso_max_g} onChange={(e) => setForm((f) => ({ ...f, peso_max_g: Number(e.target.value) }))} />
              </label>
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={form.lendario ?? false} onChange={(e) => setForm((f) => ({ ...f, lendario: e.target.checked }))} />
              Lendário
            </label>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setMostrarForm(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">Cancelar</button>
              <BotaoSalvar disabled={salvando} />
            </div>
          </form>
        </div>
      )}
    </Secao>
  );
}

// ------------------------------------------------------------------ POOL
function AbaPool({ onErro }: { onErro: (m: string) => void }) {
  const [pool, setPool] = useState<FishingPoolAdminApi[]>([]);
  const [zonas, setZonas] = useState<FishingZoneAdminApi[]>([]);
  const [especies, setEspecies] = useState<FishingSpeciesAdminApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<PayloadFishingPoolAdmin>({ encounter_weight: 100 });

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [p, z, e] = await Promise.all([listarFishingPoolAdmin(), listarFishingZonesAdmin(), listarFishingSpeciesAdmin()]);
      setPool(p);
      setZonas(z);
      setEspecies(e);
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível carregar o pool."));
    } finally {
      setCarregando(false);
    }
  }, [onErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirCriacao() {
    setForm({ id_zone: zonas[0]?.id, id_species: especies[0]?.id, encounter_weight: 100 });
    setMostrarForm(true);
  }

  // % de chance de cada espécie DENTRO da zona — espelha exatamente a
  // fórmula de sorteio do backend (fishingEncounterService.sortearPonderado):
  // peso / soma dos pesos ATIVOS da mesma zona, sem considerar afinidade
  // de isca (isso é só um multiplicador que entra na hora da pescaria, a
  // % aqui é a base "sem isca" — ver AbaAfinidades pro efeito da isca).
  // Puramente derivado do que já foi carregado — nunca persistido.
  const totalAtivoPorZona = useMemo(() => {
    const totais = new Map<number, number>();
    for (const item of pool) {
      if (!item.ativo) continue;
      totais.set(item.id_zone, (totais.get(item.id_zone) ?? 0) + item.encounter_weight);
    }
    return totais;
  }, [pool]);

  function chancePercentual(item: FishingPoolAdminApi): string | null {
    if (!item.ativo) return null;
    const total = totalAtivoPorZona.get(item.id_zone) ?? 0;
    if (total <= 0) return null;
    return `≈${((item.encounter_weight / total) * 100).toFixed(1)}%`;
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      await criarFishingPoolAdmin(form);
      setMostrarForm(false);
      await carregar();
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível criar o vínculo."));
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivo(item: FishingPoolAdminApi) {
    try {
      await atualizarFishingPoolAdmin(item.id, { ativo: !item.ativo });
      await carregar();
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível mudar o status."));
    }
  }

  return (
    <Secao titulo="Pool de encontro (quais espécies aparecem em cada zona)">
      <button type="button" onClick={abrirCriacao} className="mb-3 rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
        + Novo vínculo
      </button>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-white/50">
              <th className="px-3 py-2">Zona</th>
              <th className="px-3 py-2">Espécie</th>
              <th className="px-3 py-2">Peso do encontro</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={5} className="px-3 py-4 text-center text-white/50">Carregando...</td></tr>
            ) : pool.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-4 text-center text-white/50">Nenhum vínculo cadastrado.</td></tr>
            ) : (
              pool.map((item) => (
                <tr key={item.id} className="border-b border-white/5">
                  <td className="px-3 py-2 font-bold">{item.FishingZone?.nome ?? `#${item.id_zone}`}</td>
                  <td className="px-3 py-2">{item.species?.item ? formatarItemComId(item.species.item.nome, item.species.id) : `#${item.id_species}`}</td>
                  <td className="px-3 py-2">
                    {item.encounter_weight}
                    {chancePercentual(item) && (
                      <span className="ml-2 text-xs font-bold text-sky-300" title="Chance aproximada de aparição dentro da zona (peso ÷ soma dos pesos ativos da zona), sem contar afinidade de isca.">
                        {chancePercentual(item)} de chance nessa zona
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${item.ativo ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/60"}`}>
                      {item.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => alternarAtivo(item)} className="text-white/70 hover:underline">{item.ativo ? "Desativar" : "Ativar"}</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMostrarForm(false)}>
          <form onSubmit={salvar} onClick={(e) => e.stopPropagation()} className="flex w-full max-w-md flex-col gap-3 rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-[#F3B43F]">Novo vínculo zona × espécie</p>
            <label className="flex flex-col gap-1 text-xs">Zona
              <Select required value={form.id_zone ?? ""} onChange={(e) => setForm((f) => ({ ...f, id_zone: Number(e.target.value) }))}>
                {zonas.map((z) => <option key={z.id} value={z.id}>{z.nome}</option>)}
              </Select>
            </label>
            <label className="flex flex-col gap-1 text-xs">Espécie
              <Select required value={form.id_species ?? ""} onChange={(e) => setForm((f) => ({ ...f, id_species: Number(e.target.value) }))}>
                {especies.map((e) => <option key={e.id} value={e.id}>{e.item ? formatarItemComId(e.item.nome, e.id) : e.key}</option>)}
              </Select>
            </label>
            <label className="flex flex-col gap-1 text-xs">Peso do encontro (relativo, {'>'} 0)
              <Input type="number" min={1} value={form.encounter_weight ?? 100} onChange={(e) => setForm((f) => ({ ...f, encounter_weight: Number(e.target.value) }))} />
            </label>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setMostrarForm(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">Cancelar</button>
              <BotaoSalvar disabled={salvando} />
            </div>
          </form>
        </div>
      )}
    </Secao>
  );
}

// ---------------------------------------------------------------- PORTOS
function AbaPortos({ onErro }: { onErro: (m: string) => void }) {
  const [portos, setPortos] = useState<FishingPortAdminApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<FishingPortAdminApi | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<PayloadFishingPortAdmin>({ key: "", nome: "" });

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setPortos(await listarFishingPortsAdmin());
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível carregar os portos."));
    } finally {
      setCarregando(false);
    }
  }, [onErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirCriacao() {
    setEditando(null);
    setForm({ key: "", nome: "" });
    setMostrarForm(true);
  }

  function abrirEdicao(porto: FishingPortAdminApi) {
    setEditando(porto);
    setForm({ nome: porto.nome, id_world_node: porto.id_world_node, descricao: porto.descricao ?? "", ativo: porto.ativo });
    setMostrarForm(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      if (editando) await atualizarFishingPortAdmin(editando.id, form);
      else await criarFishingPortAdmin(form);
      setMostrarForm(false);
      await carregar();
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível salvar o porto."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Secao titulo="Portos (pontos de partida marítima)">
      <button type="button" onClick={abrirCriacao} className="mb-3 rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
        + Novo porto
      </button>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-white/50">
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Key</th>
              <th className="px-3 py-2">Nó do mapa</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={5} className="px-3 py-4 text-center text-white/50">Carregando...</td></tr>
            ) : portos.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-4 text-center text-white/50">Nenhum porto cadastrado.</td></tr>
            ) : (
              portos.map((p) => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="px-3 py-2 font-bold">{p.nome}</td>
                  <td className="px-3 py-2 text-white/60">{p.key}</td>
                  <td className="px-3 py-2 text-white/60">{p.WorldMapNode?.nome ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${p.ativo ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/60"}`}>
                      {p.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => abrirEdicao(p)} className="text-[#F3B43F] hover:underline">Editar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMostrarForm(false)}>
          <form onSubmit={salvar} onClick={(e) => e.stopPropagation()} className="flex w-full max-w-md flex-col gap-3 rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-[#F3B43F]">{editando ? "Editar porto" : "Novo porto"}</p>
            {!editando && (
              <label className="flex flex-col gap-1 text-xs">key (identificador único)
                <Input required value={form.key ?? ""} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))} />
              </label>
            )}
            <label className="flex flex-col gap-1 text-xs">Nome
              <Input required value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1 text-xs">id_world_node (opcional)
              <Input type="number" value={form.id_world_node ?? ""} onChange={(e) => setForm((f) => ({ ...f, id_world_node: e.target.value ? Number(e.target.value) : null }))} />
            </label>
            <label className="flex flex-col gap-1 text-xs">Descrição
              <Input value={form.descricao ?? ""} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
            </label>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setMostrarForm(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">Cancelar</button>
              <BotaoSalvar disabled={salvando} />
            </div>
          </form>
        </div>
      )}
    </Secao>
  );
}

// ----------------------------------------------------------------- ISCAS
function AbaIscas({ onErro }: { onErro: (m: string) => void }) {
  const [iscas, setIscas] = useState<FishingBaitAdminApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<FishingBaitAdminApi | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<PayloadFishingBaitAdmin>({ key: "", id_item: undefined, nivel_pesca_minimo: 1 });
  const { itens: itensDisponiveis } = useItensParaSelecaoAdmin();

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setIscas(await listarFishingBaitsAdmin());
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível carregar as iscas."));
    } finally {
      setCarregando(false);
    }
  }, [onErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirCriacao() {
    setEditando(null);
    setForm({ key: "", id_item: undefined, nivel_pesca_minimo: 1 });
    setMostrarForm(true);
  }

  function abrirEdicao(isca: FishingBaitAdminApi) {
    setEditando(isca);
    setForm({ nome_exibicao: isca.nome_exibicao ?? "", nivel_pesca_minimo: isca.nivel_pesca_minimo, ativo: isca.ativo });
    setMostrarForm(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      if (editando) await atualizarFishingBaitAdmin(editando.id_item, form);
      else await criarFishingBaitAdmin(form);
      setMostrarForm(false);
      await carregar();
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível salvar a isca."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Secao titulo="Iscas (vinculadas a um Item Material existente)">
      <button type="button" onClick={abrirCriacao} className="mb-3 rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
        + Nova isca
      </button>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-white/50">
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2">Key</th>
              <th className="px-3 py-2">Nível mín.</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={5} className="px-3 py-4 text-center text-white/50">Carregando...</td></tr>
            ) : iscas.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-4 text-center text-white/50">Nenhuma isca cadastrada.</td></tr>
            ) : (
              iscas.map((i) => (
                <tr key={i.id_item} className="border-b border-white/5">
                  <td className="px-3 py-2 font-bold">{i.item ? formatarItemComId(i.item.nome, i.id_item) : `#${i.id_item}`}</td>
                  <td className="px-3 py-2 text-white/60">{i.key}</td>
                  <td className="px-3 py-2">{i.nivel_pesca_minimo}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${i.ativo ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/60"}`}>
                      {i.ativo ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => abrirEdicao(i)} className="text-[#F3B43F] hover:underline">Editar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMostrarForm(false)}>
          <form onSubmit={salvar} onClick={(e) => e.stopPropagation()} className="flex w-full max-w-md flex-col gap-3 rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-[#F3B43F]">{editando ? "Editar isca" : "Nova isca"}</p>
            {!editando && (
              <>
                <label className="flex flex-col gap-1 text-xs">key (identificador único)
                  <Input required value={form.key ?? ""} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))} />
                </label>
                <label className="flex flex-col gap-1 text-xs">Item (já cadastrado em Itens)
                  <ItemSelect
                    itens={itensDisponiveis}
                    value={form.id_item ?? ""}
                    onChange={(id) => setForm((f) => ({ ...f, id_item: id === "" ? undefined : id }))}
                  />
                </label>
              </>
            )}
            <label className="flex flex-col gap-1 text-xs">Nome de exibição (opcional)
              <Input value={form.nome_exibicao ?? ""} onChange={(e) => setForm((f) => ({ ...f, nome_exibicao: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1 text-xs">Nível de pesca mín.
              <Input type="number" value={form.nivel_pesca_minimo ?? 1} onChange={(e) => setForm((f) => ({ ...f, nivel_pesca_minimo: Number(e.target.value) }))} />
            </label>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setMostrarForm(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">Cancelar</button>
              <BotaoSalvar disabled={salvando} />
            </div>
          </form>
        </div>
      )}
    </Secao>
  );
}

// ------------------------------------------------------------ AFINIDADES
function AbaAfinidades({ onErro }: { onErro: (m: string) => void }) {
  const [afinidades, setAfinidades] = useState<FishingAffinityAdminApi[]>([]);
  const [iscas, setIscas] = useState<FishingBaitAdminApi[]>([]);
  const [especies, setEspecies] = useState<FishingSpeciesAdminApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<FishingAffinityAdminApi | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<PayloadFishingAffinityAdmin>({ multiplicador_peso_ppm: 1_000_000 });

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [a, i, e] = await Promise.all([listarFishingAffinitiesAdmin(), listarFishingBaitsAdmin(), listarFishingSpeciesAdmin()]);
      setAfinidades(a);
      setIscas(i);
      setEspecies(e);
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível carregar as afinidades."));
    } finally {
      setCarregando(false);
    }
  }, [onErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirCriacao() {
    setEditando(null);
    setForm({ id_bait_item: iscas[0]?.id_item, id_species: especies[0]?.id, multiplicador_peso_ppm: 1_000_000 });
    setMostrarForm(true);
  }

  function abrirEdicao(afinidade: FishingAffinityAdminApi) {
    setEditando(afinidade);
    setForm({ multiplicador_peso_ppm: afinidade.multiplicador_peso_ppm });
    setMostrarForm(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      if (editando) await atualizarFishingAffinityAdmin(editando.id, form);
      else await criarFishingAffinityAdmin(form);
      setMostrarForm(false);
      await carregar();
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível salvar a afinidade."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Secao titulo="Afinidades (multiplicador de peso de encontro — 1.000.000 = neutro)">
      <button type="button" onClick={abrirCriacao} className="mb-3 rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
        + Nova afinidade
      </button>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-white/50">
              <th className="px-3 py-2">Isca</th>
              <th className="px-3 py-2">Espécie</th>
              <th className="px-3 py-2">Multiplicador (PPM)</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={4} className="px-3 py-4 text-center text-white/50">Carregando...</td></tr>
            ) : afinidades.length === 0 ? (
              <tr><td colSpan={4} className="px-3 py-4 text-center text-white/50">Nenhuma afinidade cadastrada.</td></tr>
            ) : (
              afinidades.map((a) => (
                <tr key={a.id} className="border-b border-white/5">
                  <td className="px-3 py-2 font-bold">{a.FishingBait?.item ? formatarItemComId(a.FishingBait.item.nome, a.id_bait_item) : `#${a.id_bait_item}`}</td>
                  <td className="px-3 py-2">{a.species?.item ? formatarItemComId(a.species.item.nome, a.species.id) : `#${a.id_species}`}</td>
                  <td className="px-3 py-2">{a.multiplicador_peso_ppm.toLocaleString("pt-BR")}</td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => abrirEdicao(a)} className="text-[#F3B43F] hover:underline">Editar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMostrarForm(false)}>
          <form onSubmit={salvar} onClick={(e) => e.stopPropagation()} className="flex w-full max-w-md flex-col gap-3 rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-[#F3B43F]">{editando ? "Editar afinidade" : "Nova afinidade"}</p>
            {!editando && (
              <>
                <label className="flex flex-col gap-1 text-xs">Isca
                  <Select required value={form.id_bait_item ?? ""} onChange={(e) => setForm((f) => ({ ...f, id_bait_item: Number(e.target.value) }))}>
                    {iscas.map((i) => <option key={i.id_item} value={i.id_item}>{i.item ? formatarItemComId(i.item.nome, i.id_item) : i.key}</option>)}
                  </Select>
                </label>
                <label className="flex flex-col gap-1 text-xs">Espécie
                  <Select required value={form.id_species ?? ""} onChange={(e) => setForm((f) => ({ ...f, id_species: Number(e.target.value) }))}>
                    {especies.map((e) => <option key={e.id} value={e.id}>{e.item ? formatarItemComId(e.item.nome, e.id) : e.key}</option>)}
                  </Select>
                </label>
              </>
            )}
            <label className="flex flex-col gap-1 text-xs">Multiplicador (PPM, 1.000.000 = neutro)
              <Input type="number" min={0} value={form.multiplicador_peso_ppm ?? 1_000_000} onChange={(e) => setForm((f) => ({ ...f, multiplicador_peso_ppm: Number(e.target.value) }))} />
            </label>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setMostrarForm(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">Cancelar</button>
              <BotaoSalvar disabled={salvando} />
            </div>
          </form>
        </div>
      )}
    </Secao>
  );
}

// ----------------------------------------------------------- EMBARCAÇÕES
function AbaEmbarcacoes({ onErro }: { onErro: (m: string) => void }) {
  const [vessels, setVessels] = useState<VesselAdminApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<VesselAdminApi | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<PayloadVesselAdmin>({ key: "", nome: "", tier: 1, nivel_pesca_minimo: 1, preco: 0 });

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setVessels(await listarVesselsAdmin());
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível carregar as embarcações."));
    } finally {
      setCarregando(false);
    }
  }, [onErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirCriacao() {
    setEditando(null);
    setForm({ key: "", nome: "", tier: 1, nivel_pesca_minimo: 1, preco: 0 });
    setMostrarForm(true);
  }

  function abrirEdicao(vessel: VesselAdminApi) {
    setEditando(vessel);
    setForm({
      nome: vessel.nome,
      tier: vessel.tier,
      nivel_pesca_minimo: vessel.nivel_pesca_minimo,
      preco: vessel.preco,
      descricao: vessel.descricao ?? "",
      ativo: vessel.ativo,
    });
    setMostrarForm(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      if (editando) await atualizarVesselAdmin(editando.id, form);
      else await criarVesselAdmin(form);
      setMostrarForm(false);
      await carregar();
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível salvar a embarcação."));
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivo(vessel: VesselAdminApi) {
    try {
      await atualizarVesselAdmin(vessel.id, { nome: vessel.nome, ativo: !vessel.ativo });
      await carregar();
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível mudar o status."));
    }
  }

  return (
    <Secao titulo="Embarcações (catálogo de Vessel — spec §18.2/§18.4)">
      <button type="button" onClick={abrirCriacao} className="mb-3 rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
        + Nova embarcação
      </button>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-white/50">
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Key</th>
              <th className="px-3 py-2">Tier</th>
              <th className="px-3 py-2">Nível mín.</th>
              <th className="px-3 py-2">Preço</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={7} className="px-3 py-4 text-center text-white/50">Carregando...</td></tr>
            ) : vessels.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-4 text-center text-white/50">Nenhuma embarcação cadastrada.</td></tr>
            ) : (
              vessels.map((v) => (
                <tr key={v.id} className="border-b border-white/5">
                  <td className="px-3 py-2 font-bold">{v.nome}</td>
                  <td className="px-3 py-2 text-white/60">{v.key}</td>
                  <td className="px-3 py-2">{v.tier}</td>
                  <td className="px-3 py-2">{v.nivel_pesca_minimo}</td>
                  <td className="px-3 py-2">{v.preco > 0 ? v.preco : "Grátis"}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${v.ativo ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/60"}`}>
                      {v.ativo ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => abrirEdicao(v)} className="text-[#F3B43F] hover:underline">Editar</button>
                      <button type="button" onClick={() => alternarAtivo(v)} className="text-white/70 hover:underline">{v.ativo ? "Desativar" : "Ativar"}</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMostrarForm(false)}>
          <form onSubmit={salvar} onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-[#F3B43F]">{editando ? "Editar embarcação" : "Nova embarcação"}</p>
            {!editando && (
              <label className="flex flex-col gap-1 text-xs">key (identificador único)
                <Input required value={form.key ?? ""} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))} />
              </label>
            )}
            <label className="flex flex-col gap-1 text-xs">Nome
              <Input required value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
            </label>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">Tier
                <Input type="number" min={1} value={form.tier ?? 1} onChange={(e) => setForm((f) => ({ ...f, tier: Number(e.target.value) }))} />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">Nível de pesca mín.
                <Input type="number" min={1} value={form.nivel_pesca_minimo ?? 1} onChange={(e) => setForm((f) => ({ ...f, nivel_pesca_minimo: Number(e.target.value) }))} />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">Preço (0 = grátis)
                <Input type="number" min={0} value={form.preco ?? 0} onChange={(e) => setForm((f) => ({ ...f, preco: Number(e.target.value) }))} />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-xs">Descrição
              <Input value={form.descricao ?? ""} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
            </label>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setMostrarForm(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">Cancelar</button>
              <BotaoSalvar disabled={salvando} />
            </div>
          </form>
        </div>
      )}
    </Secao>
  );
}

// --------------------------------------------------------- ROTAS MARÍTIMAS
function AbaRotas({ onErro }: { onErro: (m: string) => void }) {
  const [rotas, setRotas] = useState<MarineRouteAdminApi[]>([]);
  const [zonas, setZonas] = useState<FishingZoneAdminApi[]>([]);
  const [portos, setPortos] = useState<FishingPortAdminApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<PayloadMarineRouteAdmin>({ min_vessel_tier: 1, distance: 1 });

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [r, z, p] = await Promise.all([listarMarineRoutesAdmin(), listarFishingZonesAdmin(), listarFishingPortsAdmin()]);
      setRotas(r);
      setZonas(z);
      setPortos(p);
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível carregar as rotas marítimas."));
    } finally {
      setCarregando(false);
    }
  }, [onErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirCriacao() {
    setForm({ id_port_origem: portos[0]?.id, id_zone_destino: zonas[0]?.id, min_vessel_tier: 1, distance: 1 });
    setMostrarForm(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      await criarMarineRouteAdmin(form);
      setMostrarForm(false);
      await carregar();
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível criar a rota marítima."));
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivo(rota: MarineRouteAdminApi) {
    try {
      await atualizarMarineRouteAdmin(rota.id, { ativo: !rota.ativo });
      await carregar();
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível mudar o status."));
    }
  }

  return (
    <Secao titulo="Rotas marítimas (Porto de origem → Zona de destino)">
      <p className="mb-3 text-xs text-white/50">
        id_world_connection precisa de uma conexão já criada no Mapa Mundial (WorldMapConnection) — crie a estrada/rota
        visual no schema do mapa primeiro e informe o id dela aqui.
      </p>
      <button type="button" onClick={abrirCriacao} className="mb-3 rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
        + Nova rota
      </button>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-white/50">
              <th className="px-3 py-2">Origem</th>
              <th className="px-3 py-2">Destino</th>
              <th className="px-3 py-2">Tier mín.</th>
              <th className="px-3 py-2">Distância</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-white/50">Carregando...</td></tr>
            ) : rotas.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-white/50">Nenhuma rota cadastrada.</td></tr>
            ) : (
              rotas.map((r) => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="px-3 py-2 font-bold">{r.portoOrigem?.nome ?? `#${r.id_port_origem}`}</td>
                  <td className="px-3 py-2">{r.zonaDestino?.nome ?? `#${r.id_zone_destino}`}</td>
                  <td className="px-3 py-2">{r.min_vessel_tier}</td>
                  <td className="px-3 py-2">{r.distance}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${r.ativo ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/60"}`}>
                      {r.ativo ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => alternarAtivo(r)} className="text-white/70 hover:underline">{r.ativo ? "Desativar" : "Ativar"}</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMostrarForm(false)}>
          <form onSubmit={salvar} onClick={(e) => e.stopPropagation()} className="flex w-full max-w-md flex-col gap-3 rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-[#F3B43F]">Nova rota marítima</p>
            <label className="flex flex-col gap-1 text-xs">id_world_connection
              <Input required type="number" value={form.id_world_connection ?? ""} onChange={(e) => setForm((f) => ({ ...f, id_world_connection: Number(e.target.value) }))} />
            </label>
            <label className="flex flex-col gap-1 text-xs">Porto de origem
              <Select required value={form.id_port_origem ?? ""} onChange={(e) => setForm((f) => ({ ...f, id_port_origem: Number(e.target.value) }))}>
                {portos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </Select>
            </label>
            <label className="flex flex-col gap-1 text-xs">Zona de destino
              <Select required value={form.id_zone_destino ?? ""} onChange={(e) => setForm((f) => ({ ...f, id_zone_destino: Number(e.target.value) }))}>
                {zonas.map((z) => <option key={z.id} value={z.id}>{z.nome}</option>)}
              </Select>
            </label>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">Tier mín. da embarcação
                <Input type="number" min={1} value={form.min_vessel_tier ?? 1} onChange={(e) => setForm((f) => ({ ...f, min_vessel_tier: Number(e.target.value) }))} />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">Distância
                <Input type="number" min={1} value={form.distance ?? 1} onChange={(e) => setForm((f) => ({ ...f, distance: Number(e.target.value) }))} />
              </label>
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setMostrarForm(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">Cancelar</button>
              <BotaoSalvar disabled={salvando} />
            </div>
          </form>
        </div>
      )}
    </Secao>
  );
}

// ------------------------------------------------------------- TORNEIOS
function AbaTorneios({ onErro }: { onErro: (m: string) => void }) {
  const [torneios, setTorneios] = useState<FishingTournamentAdminApi[]>([]);
  const [zonas, setZonas] = useState<FishingZoneAdminApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<FishingTournamentAdminApi | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<PayloadFishingTournamentAdmin>({ nome: "" });

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [t, z] = await Promise.all([listarFishingTournamentsAdmin(), listarFishingZonesAdmin()]);
      setTorneios(t);
      setZonas(z);
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível carregar os torneios."));
    } finally {
      setCarregando(false);
    }
  }, [onErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function paraInputLocal(iso?: string) {
    if (!iso) return "";
    return new Date(iso).toISOString().slice(0, 16);
  }

  function abrirCriacao() {
    setEditando(null);
    const agora = new Date();
    const amanha = new Date(Date.now() + 86_400_000);
    setForm({ nome: "", inicia_em: agora.toISOString(), termina_em: amanha.toISOString() });
    setMostrarForm(true);
  }

  function abrirEdicao(torneio: FishingTournamentAdminApi) {
    setEditando(torneio);
    setForm({
      nome: torneio.nome,
      id_zone: torneio.id_zone,
      inicia_em: torneio.inicia_em,
      termina_em: torneio.termina_em,
      ativo: torneio.ativo,
    });
    setMostrarForm(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      if (editando) await atualizarFishingTournamentAdmin(editando.id, form);
      else await criarFishingTournamentAdmin(form);
      setMostrarForm(false);
      await carregar();
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível salvar o torneio."));
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivo(torneio: FishingTournamentAdminApi) {
    try {
      await atualizarFishingTournamentAdmin(torneio.id, { nome: torneio.nome, ativo: !torneio.ativo });
      await carregar();
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível mudar o status."));
    }
  }

  return (
    <Secao titulo="Torneios da Pesca (janela de tempo + escopo de zona opcional — pontuação sempre calculada na leitura)">
      <button type="button" onClick={abrirCriacao} className="mb-3 rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
        + Novo torneio
      </button>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-white/50">
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Zona</th>
              <th className="px-3 py-2">Início</th>
              <th className="px-3 py-2">Fim</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-white/50">Carregando...</td></tr>
            ) : torneios.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-white/50">Nenhum torneio cadastrado.</td></tr>
            ) : (
              torneios.map((t) => (
                <tr key={t.id} className="border-b border-white/5">
                  <td className="px-3 py-2 font-bold">{t.nome}</td>
                  <td className="px-3 py-2 text-white/60">{t.zona?.nome ?? "Global (todas as zonas)"}</td>
                  <td className="px-3 py-2 text-white/60">{new Date(t.inicia_em).toLocaleString("pt-BR")}</td>
                  <td className="px-3 py-2 text-white/60">{new Date(t.termina_em).toLocaleString("pt-BR")}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${t.ativo ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/60"}`}>
                      {t.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => abrirEdicao(t)} className="text-[#F3B43F] hover:underline">Editar</button>
                      <button type="button" onClick={() => alternarAtivo(t)} className="text-white/70 hover:underline">{t.ativo ? "Desativar" : "Ativar"}</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMostrarForm(false)}>
          <form onSubmit={salvar} onClick={(e) => e.stopPropagation()} className="flex w-full max-w-md flex-col gap-3 rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-[#F3B43F]">{editando ? "Editar torneio" : "Novo torneio"}</p>
            <label className="flex flex-col gap-1 text-xs">Nome
              <Input required value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1 text-xs">Zona (vazio = torneio global, todas as zonas)
              <Select
                value={form.id_zone ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, id_zone: e.target.value ? Number(e.target.value) : null }))}
              >
                <option value="">Global (todas as zonas)</option>
                {zonas.map((z) => <option key={z.id} value={z.id}>{z.nome}</option>)}
              </Select>
            </label>
            <label className="flex flex-col gap-1 text-xs">Início
              <Input
                required
                type="datetime-local"
                value={paraInputLocal(form.inicia_em)}
                onChange={(e) => setForm((f) => ({ ...f, inicia_em: new Date(e.target.value).toISOString() }))}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">Fim
              <Input
                required
                type="datetime-local"
                value={paraInputLocal(form.termina_em)}
                onChange={(e) => setForm((f) => ({ ...f, termina_em: new Date(e.target.value).toISOString() }))}
              />
            </label>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setMostrarForm(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">Cancelar</button>
              <BotaoSalvar disabled={salvando} />
            </div>
          </form>
        </div>
      )}
    </Secao>
  );
}
