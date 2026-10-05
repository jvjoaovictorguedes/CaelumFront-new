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
  atualizarFishingBalanceAdmin,
  mensagemDeErroAdmin,
  obterFishingBalanceAdmin,
  previewFishingChancePoolAdmin,
  listarFishingRodsAdmin,
  simularFishingBalanceamentoAdmin,
  simularFishingMatrizAdmin,
  type ComportamentoEspecie,
  type FishingAffinityAdminApi,
  type FishingBaitAdminApi,
  type FishingPoolAdminApi,
  type FishingPortAdminApi,
  type FishingRodAdminApi,
  type FishingRodPropertiesApi,
  type FishingSimulacaoApi,
  type FishingMatrizLinhaApi,
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

type Aba = "Zonas" | "Especies" | "Pool" | "Portos" | "Iscas" | "Afinidades" | "Varas" | "Balanceamento" | "Embarcacoes" | "Rotas" | "Torneios";
const ABAS: Aba[] = ["Zonas", "Especies", "Pool", "Portos", "Iscas", "Afinidades", "Varas", "Balanceamento", "Embarcacoes", "Rotas", "Torneios"];
const ROTULO_ABA: Record<Aba, string> = {
  Zonas: "Zonas",
  Especies: "Espécies",
  Pool: "Pool (Zona × Espécie)",
  Portos: "Portos",
  Iscas: "Iscas",
  Afinidades: "Afinidades (Isca × Espécie)",
  Varas: "Varas",
  Balanceamento: "Balanceamento",
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
        <Link prefetch={false} href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
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
      {aba === "Varas" && <AbaVaras onErro={setErro} />}
      {aba === "Balanceamento" && <AbaBalanceamento onErro={setErro} />}
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
  const [editando, setEditando] = useState<FishingPoolAdminApi | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<PayloadFishingPoolAdmin>({ encounter_weight: 100 });
  // Chance de encontro CALCULADA pelo backend (Pesca v3 §5.1/§10.1/§12.1)
  // — nunca uma fórmula duplicada aqui: reusa a mesma
  // fishingEncounterService.calcularPesosDoPool do sorteio real, já
  // considerando nível mínimo elegível. Chave "idZone:idSpecies".
  const [chances, setChances] = useState<Map<string, number>>(new Map());

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [p, z, e] = await Promise.all([listarFishingPoolAdmin(), listarFishingZonesAdmin(), listarFishingSpeciesAdmin()]);
      setPool(p);
      setZonas(z);
      setEspecies(e);

      const idsZona = Array.from(new Set(p.map((item) => item.id_zone)));
      const porZona = await Promise.all(idsZona.map((idZone) => previewFishingChancePoolAdmin(idZone, { nivelPesca: 1 })));
      const mapa = new Map<string, number>();
      idsZona.forEach((idZone, i) => {
        for (const entrada of porZona[i]) mapa.set(`${idZone}:${entrada.id_species}`, entrada.chance);
      });
      setChances(mapa);
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
    setEditando(null);
    setForm({ id_zone: zonas[0]?.id, id_species: especies[0]?.id, encounter_weight: 100, nivel_pesca_minimo: null });
    setMostrarForm(true);
  }

  // Pesca v3 §8.1 — "editor da zona deve permitir... editar
  // encounter_weight, nível mínimo e ativo": o vínculo zona × espécie
  // precisa continuar editável depois de criado, não só criável/
  // ativável.
  function abrirEdicao(item: FishingPoolAdminApi) {
    setEditando(item);
    setForm({ encounter_weight: item.encounter_weight, nivel_pesca_minimo: item.nivel_pesca_minimo, ativo: item.ativo });
    setMostrarForm(true);
  }

  function chancePercentual(item: FishingPoolAdminApi): string | null {
    if (!item.ativo) return null;
    const chance = chances.get(`${item.id_zone}:${item.id_species}`);
    if (chance == null) return null;
    return `${(chance * 100).toFixed(1)}%`;
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      if (editando) {
        await atualizarFishingPoolAdmin(editando.id, {
          encounter_weight: form.encounter_weight,
          nivel_pesca_minimo: form.nivel_pesca_minimo,
          ativo: form.ativo,
        });
      } else {
        await criarFishingPoolAdmin(form);
      }
      setMostrarForm(false);
      setEditando(null);
      await carregar();
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, editando ? "Não foi possível salvar o vínculo." : "Não foi possível criar o vínculo."));
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
              <th className="px-3 py-2">Nv. mínimo</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-white/50">Carregando...</td></tr>
            ) : pool.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-white/50">Nenhum vínculo cadastrado.</td></tr>
            ) : (
              pool.map((item) => (
                <tr key={item.id} className="border-b border-white/5">
                  <td className="px-3 py-2 font-bold">{item.FishingZone?.nome ?? `#${item.id_zone}`}</td>
                  <td className="px-3 py-2">{item.species?.item ? formatarItemComId(item.species.item.nome, item.species.id) : `#${item.id_species}`}</td>
                  <td className="px-3 py-2">
                    {item.encounter_weight}
                    {chancePercentual(item) && (
                      <span className="ml-2 text-xs font-bold text-sky-300" title="Chance calculada pelo backend (Nível de Pesca 1, sem isca de preview) — mesma função usada no sorteio real do jogador.">
                        {chancePercentual(item)} de chance nessa zona
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">{item.nivel_pesca_minimo ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${item.ativo ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/60"}`}>
                      {item.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-3 py-2 flex gap-3">
                    <button type="button" onClick={() => abrirEdicao(item)} className="text-[#F3B43F] hover:underline">Editar</button>
                    <button type="button" onClick={() => alternarAtivo(item)} className="text-white/70 hover:underline">{item.ativo ? "Desativar" : "Ativar"}</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => { setMostrarForm(false); setEditando(null); }}>
          <form onSubmit={salvar} onClick={(e) => e.stopPropagation()} className="flex w-full max-w-md flex-col gap-3 rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-[#F3B43F]">
              {editando ? "Editar vínculo zona × espécie" : "Novo vínculo zona × espécie"}
            </p>
            {editando ? (
              <p className="text-sm text-white/70">
                {editando.FishingZone?.nome ?? `Zona #${editando.id_zone}`} ×{" "}
                {editando.species?.item ? formatarItemComId(editando.species.item.nome, editando.species.id) : `Espécie #${editando.id_species}`}
                <span className="block text-xs text-white/40">Zona e espécie não podem ser trocadas depois de criado — exclua/desative e crie um vínculo novo se precisar de outra combinação.</span>
              </p>
            ) : (
              <>
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
              </>
            )}
            <label className="flex flex-col gap-1 text-xs">Peso do encontro (relativo, {'>'} 0)
              <Input type="number" min={1} value={form.encounter_weight ?? 100} onChange={(e) => setForm((f) => ({ ...f, encounter_weight: Number(e.target.value) }))} />
            </label>
            <label className="flex flex-col gap-1 text-xs">Nível de Pesca mínimo (vazio = sem exigência própria, só a da zona)
              <Input
                type="number"
                min={1}
                value={form.nivel_pesca_minimo ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, nivel_pesca_minimo: e.target.value === "" ? null : Number(e.target.value) }))}
              />
            </label>
            {editando && (
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={form.ativo ?? true} onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))} />
                Ativo (aparece no sorteio real)
              </label>
            )}
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => { setMostrarForm(false); setEditando(null); }} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">Cancelar</button>
              <BotaoSalvar disabled={salvando} />
            </div>
          </form>
        </div>
      )}
    </Secao>
  );
}

// ----------------------------------------------------------------- VARAS
// Read-only (Pesca v3 §8.3) — a fonte de verdade continua no Admin de
// Itens (FishingRodProperties fica junto do Item tipo "Ferramenta");
// isto é só uma visão de comparação pro contexto de balanceamento da
// Pesca, sem duplicar o CRUD.
function AbaVaras({ onErro }: { onErro: (m: string) => void }) {
  const [varas, setVaras] = useState<FishingRodAdminApi[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      setCarregando(true);
      try {
        setVaras(await listarFishingRodsAdmin());
      } catch (error) {
        onErro(mensagemDeErroAdmin(error, "Não foi possível carregar as varas."));
      } finally {
        setCarregando(false);
      }
    })();
  }, [onErro]);

  return (
    <Secao titulo="Varas de Pesca (comparação — editar em Painel Administrativo → Itens)">
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-white/50">
              <th className="px-3 py-2">Vara</th>
              <th className="px-3 py-2">Força da linha</th>
              <th className="px-3 py-2">Controle</th>
              <th className="px-3 py-2">Recolhimento</th>
              <th className="px-3 py-2">Precisão</th>
              <th className="px-3 py-2">Estabilidade</th>
              <th className="px-3 py-2">Nv. mínimo</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={7} className="px-3 py-4 text-center text-white/50">Carregando...</td></tr>
            ) : varas.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-4 text-center text-white/50">Nenhuma vara cadastrada (crie um Item tipo Ferramenta com propriedades de vara).</td></tr>
            ) : (
              varas.map((v) => (
                <tr key={v.id_item} className="border-b border-white/5">
                  <td className="px-3 py-2 font-bold">{formatarItemComId(v.nome, v.id_item)}</td>
                  <td className="px-3 py-2">{v.propriedades_base.forca_linha}</td>
                  <td className="px-3 py-2">{v.propriedades_base.controle}</td>
                  <td className="px-3 py-2">{v.propriedades_base.recolhimento}</td>
                  <td className="px-3 py-2">{v.propriedades_base.precisao}</td>
                  <td className="px-3 py-2">{v.propriedades_base.estabilidade}</td>
                  <td className="px-3 py-2">{v.propriedades_base.nivel_pesca_minimo}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Secao>
  );
}

// -------------------------------------------------------- BALANCEAMENTO
// Simulador/Balanceador (Pesca v3 §9/§10/§13.4) — chama o backend, que
// reutiliza o fishingEngine real; esta tela NUNCA calcula chance de
// captura sozinha.
function AbaBalanceamento({ onErro }: { onErro: (m: string) => void }) {
  const [especies, setEspecies] = useState<FishingSpeciesAdminApi[]>([]);
  const [varas, setVaras] = useState<FishingRodAdminApi[]>([]);
  const [carregandoCatalogo, setCarregandoCatalogo] = useState(true);

  const [idSpecies, setIdSpecies] = useState<number | "">("");
  const [idRodItem, setIdRodItem] = useState<number | "">("");
  const [refinamentoVara, setRefinamentoVara] = useState(0);
  const [nivelPesca, setNivelPesca] = useState(1);
  const [numSimulacoes, setNumSimulacoes] = useState(1000);
  const [simulando, setSimulando] = useState(false);
  const [resultado, setResultado] = useState<FishingSimulacaoApi | null>(null);

  const [matriz, setMatriz] = useState<FishingMatrizLinhaApi[] | null>(null);
  const [carregandoMatriz, setCarregandoMatriz] = useState(false);

  // Trocar o teto de nível regera a curva de XP do zero no backend — esse
  // contador força SecaoXpPorNivel a remontar (via key) e recarregar do
  // servidor, senão ela ficaria mostrando a curva antiga depois de salvar.
  const [versaoCurva, setVersaoCurva] = useState(0);

  useEffect(() => {
    (async () => {
      setCarregandoCatalogo(true);
      try {
        const [e, v] = await Promise.all([listarFishingSpeciesAdmin(), listarFishingRodsAdmin()]);
        setEspecies(e);
        setVaras(v);
        if (e[0]) setIdSpecies(e[0].id);
        if (v[0]) setIdRodItem(v[0].id_item);
      } catch (error) {
        onErro(mensagemDeErroAdmin(error, "Não foi possível carregar espécies/varas pro simulador."));
      } finally {
        setCarregandoCatalogo(false);
      }
    })();
  }, [onErro]);

  async function simular(e: React.FormEvent) {
    e.preventDefault();
    if (!idSpecies || !idRodItem) return;
    setSimulando(true);
    setResultado(null);
    try {
      const r = await simularFishingBalanceamentoAdmin({
        idSpecies: Number(idSpecies),
        idRodItem: Number(idRodItem),
        refinamentoVara,
        nivelPesca,
        numSimulacoes,
      });
      setResultado(r);
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível simular essa combinação."));
    } finally {
      setSimulando(false);
    }
  }

  async function carregarMatriz() {
    if (!idRodItem) return;
    setCarregandoMatriz(true);
    setMatriz(null);
    try {
      const m = await simularFishingMatrizAdmin({ idRodItem: Number(idRodItem), refinamentoVara, nivelPesca, numSimulacoes: 300 });
      setMatriz(m.sort((a, b) => b.taxa_captura - a.taxa_captura));
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível calcular a matriz dessa vara."));
    } finally {
      setCarregandoMatriz(false);
    }
  }

  const linhasBreakdown: { rotulo: string; campo: keyof FishingRodPropertiesApi }[] = [
    { rotulo: "Força da linha", campo: "forca_linha" },
    { rotulo: "Controle", campo: "controle" },
    { rotulo: "Recolhimento", campo: "recolhimento" },
    { rotulo: "Precisão", campo: "precisao" },
    { rotulo: "Estabilidade", campo: "estabilidade" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Secao titulo="Simulador de captura (vara × espécie × Nível de Pesca)">
        {carregandoCatalogo ? (
          <p className="text-sm text-white/50">Carregando catálogo...</p>
        ) : (
          <form onSubmit={simular} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="flex flex-col gap-1 text-xs">Espécie
              <Select required value={idSpecies} onChange={(e) => setIdSpecies(Number(e.target.value))}>
                {especies.map((e) => <option key={e.id} value={e.id}>{e.item ? formatarItemComId(e.item.nome, e.id) : e.key}</option>)}
              </Select>
            </label>
            <label className="flex flex-col gap-1 text-xs">Vara
              <Select required value={idRodItem} onChange={(e) => setIdRodItem(Number(e.target.value))}>
                {varas.map((v) => <option key={v.id_item} value={v.id_item}>{formatarItemComId(v.nome, v.id_item)}</option>)}
              </Select>
            </label>
            <label className="flex flex-col gap-1 text-xs">Refinamento
              <Input type="number" min={0} max={15} value={refinamentoVara} onChange={(e) => setRefinamentoVara(Number(e.target.value))} />
            </label>
            <label className="flex flex-col gap-1 text-xs">Nível de Pesca (preview)
              <Input type="number" min={1} max={25} value={nivelPesca} onChange={(e) => setNivelPesca(Number(e.target.value))} />
            </label>
            <label className="flex flex-col gap-1 text-xs">Simulações
              <Select value={numSimulacoes} onChange={(e) => setNumSimulacoes(Number(e.target.value))}>
                <option value={1000}>1.000</option>
                <option value={5000}>5.000</option>
                <option value={10000}>10.000</option>
              </Select>
            </label>
            <div className="col-span-full">
              <BotaoSalvar disabled={simulando} />
              {simulando && <span className="ml-2 text-xs text-white/50">Simulando (reusa o motor real, pode levar alguns segundos)...</span>}
            </div>
          </form>
        )}

        {resultado && (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="mb-2 text-xs font-bold uppercase text-white/50">Resultado ({resultado.resultado.simulacoes} simulações)</p>
              <p className="text-2xl font-imFeel text-emerald-400">{(resultado.resultado.taxa_captura * 100).toFixed(1)}% de captura</p>
              <p className="text-xs text-white/60">Linha arrebentada: {(resultado.resultado.taxa_broken_line * 100).toFixed(1)}% · Sem resolver no teto de segurança: {(resultado.resultado.taxa_timeout * 100).toFixed(1)}%</p>
              {resultado.resultado.passos_medio_captura != null && (
                <p className="mt-1 text-xs text-white/60">Passos médios até capturar: {resultado.resultado.passos_medio_captura}</p>
              )}
              <p className="text-xs text-white/60">Tensão máxima média atingida: {resultado.resultado.tensao_maxima_media}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="mb-2 text-xs font-bold uppercase text-white/50">Breakdown de atributos (base → refinamento → proficiência)</p>
              <table className="w-full text-left text-xs text-white/80">
                <tbody>
                  {linhasBreakdown.map(({ rotulo, campo }) => (
                    <tr key={campo} className="border-b border-white/5">
                      <td className="py-1 pr-2 font-bold">{rotulo}</td>
                      <td className="py-1 pr-2">{resultado.breakdown_stats.base[campo]}</td>
                      <td className="py-1 pr-2 text-white/50">→</td>
                      <td className="py-1 pr-2">{resultado.breakdown_stats.com_refinamento[campo]}</td>
                      <td className="py-1 pr-2 text-white/50">→</td>
                      <td className="py-1 font-bold text-[#F3B43F]">{resultado.breakdown_stats.com_proficiencia[campo]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Secao>

      <Secao titulo="Matriz rápida (essa vara contra todas as espécies ativas)">
        <button type="button" onClick={carregarMatriz} disabled={carregandoMatriz || !idRodItem} className="mb-3 rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
          {carregandoMatriz ? "Calculando..." : "Calcular matriz pra essa vara"}
        </button>
        {matriz && (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-sm text-white">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase text-white/50">
                  <th className="px-3 py-2">Espécie</th>
                  <th className="px-3 py-2">Taxa de captura</th>
                  <th className="px-3 py-2">Passos médios</th>
                </tr>
              </thead>
              <tbody>
                {matriz.length === 0 ? (
                  <tr><td colSpan={3} className="px-3 py-4 text-center text-white/50">Nenhuma espécie ativa cadastrada.</td></tr>
                ) : (
                  matriz.map((linha) => (
                    <tr key={linha.id_species} className="border-b border-white/5">
                      <td className="px-3 py-2">{linha.nome}</td>
                      <td className="px-3 py-2 font-bold text-emerald-400">{(linha.taxa_captura * 100).toFixed(1)}%</td>
                      <td className="px-3 py-2">{linha.passos_medio_captura ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Secao>

      <SecaoNivelMaximo onErro={onErro} onAlterado={() => setVersaoCurva((v) => v + 1)} />
      <SecaoXpPorNivel key={versaoCurva} onErro={onErro} />
      <SecaoProficiencia onErro={onErro} />
    </div>
  );
}

// Teto de nível de Pesca (pedido do jogador). Trocar o teto regera a
// curva de XP do zero pro novo teto (mesma confirmação explícita que
// a curva de XP já exige) — por isso onAlterado força SecaoXpPorNivel a
// recarregar do servidor depois de salvar, senão ela mostraria a curva
// antiga até a página ser recarregada manualmente.
function SecaoNivelMaximo({ onErro, onAlterado }: { onErro: (m: string) => void; onAlterado: () => void }) {
  const [nivelMaximo, setNivelMaximo] = useState(25);
  const [carregando, setCarregando] = useState(true);
  const [confirmar, setConfirmar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const dados = await obterFishingBalanceAdmin();
      setNivelMaximo(dados["fishing.levelCap"].atual.NIVEL_MAXIMO_PESCA);
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível carregar o teto de nível de Pesca."));
    } finally {
      setCarregando(false);
    }
  }, [onErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function salvar() {
    setSalvando(true);
    setMensagem("");
    try {
      await atualizarFishingBalanceAdmin("fishing.levelCap", { NIVEL_MAXIMO_PESCA: nivelMaximo, confirmado: true });
      setMensagem("Teto de nível salvo — a curva de XP por nível foi resetada pro padrão do novo teto.");
      setConfirmar(false);
      await carregar();
      onAlterado();
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível salvar o teto de nível."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Secao titulo="Teto de nível de Pesca">
      {carregando ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : (
        <>
          <p className="mb-2 text-xs text-white/50">
            Nível máximo que um personagem pode alcançar na Pesca. Mudar o teto RESETA a curva de XP por nível pro
            padrão (mesma curva suave de sempre) — ajuste a curva de novo depois, se precisar, na seção abaixo.
          </p>
          <label className="flex flex-col gap-1 text-xs">
            Nível máximo
            <Input type="number" min={2} max={200} className="w-24" value={nivelMaximo} onChange={(e) => setNivelMaximo(Number(e.target.value))} />
          </label>
          <label className="mt-3 flex items-center gap-2 text-xs text-white/70">
            <input type="checkbox" checked={confirmar} onChange={(e) => setConfirmar(e.target.checked)} />
            Confirmo a mudança do teto de nível (reseta a curva de XP por nível de Pesca).
          </label>
          {mensagem && <p className="mt-2 text-sm text-[#F3B43F]">{mensagem}</p>}
          <button
            type="button"
            disabled={!confirmar || salvando}
            onClick={salvar}
            className="mt-2 rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar teto de nível"}
          </button>
        </>
      )}
    </Secao>
  );
}

// XP necessário por nível de Pesca (pedido do jogador) — mesmo padrão de
// PainelProgressao em AdminForgeClient.tsx (grupo "*.progression",
// confirmação explícita antes de salvar). O teto de nível agora é
// editável (SecaoNivelMaximo acima) — mudar o teto reseta esta curva
// pro padrão, então ela sempre reflete o teto atual.
function SecaoXpPorNivel({ onErro }: { onErro: (m: string) => void }) {
  const [etapas, setEtapas] = useState<Record<string, number>>({});
  const [carregando, setCarregando] = useState(true);
  const [confirmar, setConfirmar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const dados = await obterFishingBalanceAdmin();
      setEtapas(dados["fishing.progression"].atual.XP_NECESSARIO_POR_ETAPA_PESCA);
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível carregar o XP por nível de Pesca."));
    } finally {
      setCarregando(false);
    }
  }, [onErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function salvar() {
    setSalvando(true);
    setMensagem("");
    try {
      await atualizarFishingBalanceAdmin("fishing.progression", { XP_NECESSARIO_POR_ETAPA_PESCA: etapas, confirmado: true });
      setMensagem("Curva de XP de Pesca salva.");
      setConfirmar(false);
      await carregar();
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível salvar a curva de XP."));
    } finally {
      setSalvando(false);
    }
  }

  const nivelMaximoAtual = Object.keys(etapas).length + 1;

  return (
    <Secao titulo={`XP necessário por nível de Pesca (1 → ${nivelMaximoAtual})`}>
      {carregando ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : (
        <>
          <p className="mb-2 text-xs text-white/50">
            Quanto XP cada nível exige pra subir pro próximo. Pra mudar o teto de {nivelMaximoAtual} níveis, use a
            seção &quot;Teto de nível de Pesca&quot; acima.
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(etapas).map(([etapa, xp]) => (
              <label key={etapa} className="flex flex-col gap-1 text-xs">
                Nv.{etapa}→{Number(etapa) + 1}
                <Input type="number" min={1} className="w-24" value={xp} onChange={(e) => setEtapas((t) => ({ ...t, [etapa]: Number(e.target.value) }))} />
              </label>
            ))}
          </div>
          <label className="mt-3 flex items-center gap-2 text-xs text-white/70">
            <input type="checkbox" checked={confirmar} onChange={(e) => setConfirmar(e.target.checked)} />
            Confirmo a mudança da curva de XP de Pesca (afeta todos os personagens em progressão).
          </label>
          {mensagem && <p className="mt-2 text-sm text-[#F3B43F]">{mensagem}</p>}
          <button
            type="button"
            disabled={!confirmar || salvando}
            onClick={salvar}
            className="mt-2 rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar curva de XP"}
          </button>
        </>
      )}
    </Secao>
  );
}

// Buff de Proficiência por nível de Pesca (pedido do jogador) — taxa
// percentual POR NÍVEL acima do 1, aplicada em fishingConfig.
// aplicarProficienciaPesca. NÃO é uma tabela por nível individual (é uma
// taxa fixa multiplicada pelos níveis acima de 1), então o editor mostra
// os 5 campos (um por atributo da vara), não uma linha por nível.
const CAMPOS_PROFICIENCIA: { campo: string; rotulo: string }[] = [
  { campo: "controle", rotulo: "Controle" },
  { campo: "precisao", rotulo: "Precisão" },
  { campo: "estabilidade", rotulo: "Estabilidade" },
  { campo: "forca_linha", rotulo: "Força da linha" },
  { campo: "recolhimento", rotulo: "Recolhimento" },
];

function SecaoProficiencia({ onErro }: { onErro: (m: string) => void }) {
  const [pct, setPct] = useState<Record<string, number>>({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const dados = await obterFishingBalanceAdmin();
      setPct(dados["fishing.proficiency"].atual.PROFICIENCIA_PCT_POR_NIVEL);
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível carregar o buff de Proficiência."));
    } finally {
      setCarregando(false);
    }
  }, [onErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function salvar() {
    setSalvando(true);
    setMensagem("");
    try {
      await atualizarFishingBalanceAdmin("fishing.proficiency", { PROFICIENCIA_PCT_POR_NIVEL: pct });
      setMensagem("Buff de Proficiência salvo.");
      await carregar();
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, "Não foi possível salvar o buff de Proficiência."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Secao titulo="Buff de Proficiência por nível de Pesca">
      {carregando ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : (
        <>
          <p className="mb-2 text-xs text-white/50">% aplicado por nível ACIMA do 1 em cada atributo efetivo da vara (ex.: 0,75% × 24 níveis acima do 1 = +18% no nível 25).</p>
          <div className="flex flex-wrap gap-3">
            {CAMPOS_PROFICIENCIA.map(({ campo, rotulo }) => (
              <label key={campo} className="flex flex-col gap-1 text-xs">
                {rotulo}
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    step={0.01}
                    className="w-20"
                    value={pct[campo] != null ? Number((pct[campo] * 100).toFixed(4)) : 0}
                    onChange={(e) => setPct((p) => ({ ...p, [campo]: Number(e.target.value) / 100 }))}
                  />
                  <span className="text-white/50">%/nível</span>
                </div>
              </label>
            ))}
          </div>
          {mensagem && <p className="mt-2 text-sm text-[#F3B43F]">{mensagem}</p>}
          <button
            type="button"
            disabled={salvando}
            onClick={salvar}
            className="mt-2 rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar buff de Proficiência"}
          </button>
        </>
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
  const [editando, setEditando] = useState<MarineRouteAdminApi | null>(null);
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
    setEditando(null);
    setForm({ id_port_origem: portos[0]?.id, id_zone_destino: zonas[0]?.id, min_vessel_tier: 1, distance: 1 });
    setMostrarForm(true);
  }

  function abrirEdicao(rota: MarineRouteAdminApi) {
    setEditando(rota);
    setForm({ id_port_origem: rota.id_port_origem, id_zone_destino: rota.id_zone_destino, min_vessel_tier: rota.min_vessel_tier, distance: rota.distance });
    setMostrarForm(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      if (editando) {
        await atualizarMarineRouteAdmin(editando.id, form);
      } else {
        await criarMarineRouteAdmin(form);
      }
      setMostrarForm(false);
      setEditando(null);
      await carregar();
    } catch (error) {
      onErro(mensagemDeErroAdmin(error, editando ? "Não foi possível editar a rota marítima." : "Não foi possível criar a rota marítima."));
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
        Escolha um porto de origem, uma zona de destino e o tier mínimo de embarcação — a conexão técnica no Mapa Mundial
        é criada e mantida automaticamente, você não precisa lidar com ela.
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
                    <div className="flex gap-3">
                      <button type="button" onClick={() => abrirEdicao(r)} className="text-white/70 hover:underline">Editar</button>
                      <button type="button" onClick={() => alternarAtivo(r)} className="text-white/70 hover:underline">{r.ativo ? "Desativar" : "Ativar"}</button>
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
            <p className="font-imFeel text-xl text-[#F3B43F]">{editando ? "Editar rota marítima" : "Nova rota marítima"}</p>
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
              <button type="button" onClick={() => { setMostrarForm(false); setEditando(null); }} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">Cancelar</button>
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

  // `<input type="datetime-local">` mostra/recebe hora LOCAL do navegador,
  // sem timezone — toISOString() sempre devolve UTC, então usá-lo aqui
  // fazia o campo mostrar a hora errada (deslocada pelo fuso, ex.: 3h a
  // mais no Brasil) toda vez que o admin abria pra editar, e cada save
  // reaplicava esse deslocamento. Monta a string a partir dos getters
  // locais (getHours/getMinutes, não getUTCHours/getUTCMinutes).
  function paraInputLocal(iso?: string) {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
                    {t.finalizado_em ? (
                      <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-300">
                        Finalizado{t.vencedor_nome ? ` — venceu: ${t.vencedor_nome}` : " — ninguém pontuou"}
                      </span>
                    ) : (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${t.ativo ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/60"}`}>
                        {t.ativo ? "Ativo" : "Inativo (desativado manualmente)"}
                      </span>
                    )}
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
