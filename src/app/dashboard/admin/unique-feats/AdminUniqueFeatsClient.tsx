"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  atualizarUniqueFeatAdmin,
  atualizarUniqueFeatLegadoAdmin,
  criarUniqueFeatAdmin,
  desativarUniqueFeatAdmin,
  duplicarUniqueFeatAdmin,
  listarPowersAdmin,
  listarUniqueFeatClaimsAdmin,
  listarUniqueFeatsAdmin,
  listarUniqueFeatTriggerSchemasAdmin,
  mensagemDeErroAdmin,
  obterUniqueFeatAdmin,
  obterUniqueFeatLegadoAdmin,
  reativarUniqueFeatAdmin,
  revogarUniqueFeatClaimAdmin,
  transferirUniqueFeatClaimAdmin,
  validarUniqueFeatTriggerConfigAdmin,
  type FiltrosUniqueFeatClaimsAdmin,
  type FiltrosUniqueFeatsAdmin,
  type PayloadNovoPowerUniqueFeatAdmin,
  type PayloadUniqueFeatAdmin,
  type PayloadUniqueFeatLegadoAdmin,
  type PowerApi,
  type UniqueFeatApi,
  type UniqueFeatClaimApi,
  type UniqueFeatLegadoApi,
  type UniqueFeatTriggerSchemaApi,
} from "@/lib/api/admin";

type Aba = "proezas" | "legados" | "triggers" | "historico";

const CARD = "rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-5";
const BTN = "rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50";
const BTN_GHOST = "rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10 disabled:opacity-40";
const INPUT = "rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm text-white";
const ATRIBUTOS_VALIDOS = ["Forca", "Vitalidade", "Agilidade", "Inteligencia", "Velocidade"] as const;

export default function AdminUniqueFeatsClient({ podeReparar }: { podeReparar: boolean }) {
  const [aba, setAba] = useState<Aba>("proezas");
  const [idPowerLegado, setIdPowerLegado] = useState<number | null>(null);
  const [idProezaParaAbrir, setIdProezaParaAbrir] = useState<number | null>(null);

  const abas: [Aba, string][] = [
    ["proezas", "Proezas"],
    ["legados", "Legados"],
    ["triggers", "Triggers"],
    ["historico", "Histórico/Reparos"],
  ];

  function abrirLegado(idPower: number) {
    setIdPowerLegado(idPower);
    setAba("legados");
  }
  function abrirProeza(idProeza: number) {
    setIdProezaParaAbrir(idProeza);
    setAba("proezas");
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Proezas Únicas</h1>
        <p className="mt-1 text-sm text-white/60">
          Easter eggs históricos de vencedor único — cada Proeza só pode ser conquistada uma vez pra sempre. Editar não
          altera o vencedor de uma Proeza já conquistada; a revogação e a transferência de claim são reparo excepcional,
          restritas a quem tem a permissão uniquefeats.repair.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {abas.map(([id, rotulo]) => (
          <button
            key={id}
            type="button"
            onClick={() => setAba(id)}
            className={`rounded-lg px-4 py-2 text-sm font-bold uppercase tracking-widest transition ${
              aba === id ? "bg-[#BC8418] text-black" : "border border-white/20 text-white/70 hover:bg-white/10"
            }`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {aba === "proezas" && (
        <AbaProezas
          onVerLegado={abrirLegado}
          idParaAbrir={idProezaParaAbrir}
          onConsumirIdParaAbrir={() => setIdProezaParaAbrir(null)}
        />
      )}
      {aba === "legados" && <AbaLegados idPowerInicial={idPowerLegado} />}
      {aba === "triggers" && <AbaTriggers />}
      {aba === "historico" && <AbaHistorico podeReparar={podeReparar} onAbrirProeza={abrirProeza} />}
    </div>
  );
}

// ---------------------------------------------------------------------
// Seletor de Power já-marcado como Legado (acquisition_scope=UNIQUE_FEAT
// e ainda não vinculado a nenhuma outra Proeza) — adaptação do combobox
// de busca de SeletorItem (AdminForgeClient.tsx)/ItemPicker.tsx pro
// catálogo de Powers, que não tem endpoint de filtro por
// acquisition_scope no backend: filtramos no cliente comparando com a
// lista de Proezas já cadastradas (id_power_reward é UNIQUE lá).
// ---------------------------------------------------------------------
function SeletorPowerLegado({
  aberto,
  onFechar,
  onSelecionar,
}: {
  aberto: boolean;
  onFechar: () => void;
  onSelecionar: (power: PowerApi) => void;
}) {
  const [busca, setBusca] = useState("");
  const [disponiveis, setDisponiveis] = useState<PowerApi[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!aberto) return;
    setCarregando(true);
    setErro("");
    Promise.all([listarPowersAdmin({ nome: busca || undefined }), listarUniqueFeatsAdmin({})])
      .then(([powers, proezas]) => {
        const jaUsados = new Set(proezas.map((p) => p.id_power_reward));
        setDisponiveis(powers.filter((p) => p.acquisition_scope === "UNIQUE_FEAT" && !jaUsados.has(p.id)));
      })
      .catch((error) => setErro(mensagemDeErroAdmin(error, "Não foi possível carregar os Powers.")))
      .finally(() => setCarregando(false));
  }, [aberto, busca]);

  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={onFechar}>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[80vh] w-full max-w-lg flex-col gap-2 overflow-hidden rounded-2xl border-2 border-[#F3B43F] bg-[#20180f] p-4">
        <p className="font-imFeel text-lg text-[#F3B43F]">Selecionar Power (Legado)</p>
        <p className="text-xs text-white/50">
          Só mostra Powers com acquisition_scope=UNIQUE_FEAT que ainda não pertencem a nenhuma outra Proeza.
        </p>
        <input autoFocus value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome..." className={INPUT} />
        <div className="flex-1 overflow-y-auto">
          {erro && <p className="p-2 text-sm text-red-400">{erro}</p>}
          {carregando ? (
            <p className="p-2 text-sm text-white/50">Carregando...</p>
          ) : disponiveis.length === 0 ? (
            <p className="p-2 text-sm text-white/50">
              Nenhum Power UNIQUE_FEAT disponível. Marque um Power existente como Legado antes (fora desta tela), ou crie um novo abaixo.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {disponiveis.map((power) => (
                <li key={power.id}>
                  <button type="button" onClick={() => { onSelecionar(power); onFechar(); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-white hover:bg-white/10">
                    <span className="flex-1">{power.nome}</span>
                    <span className="text-xs text-white/40">#{power.id} · {power.tipo_poder}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" onClick={onFechar} className={BTN_GHOST}>Cancelar</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Aba 1 — Proezas
// ---------------------------------------------------------------------
function novoPowerVazio(): PayloadNovoPowerUniqueFeatAdmin {
  return { nome: "", descricao: "", tipo_poder: "Passivo", escala_atributo: "Forca", custo_mana: 0, valor_escala: 0 };
}

function formProezaVazio(): PayloadUniqueFeatAdmin {
  return {
    nome: "",
    key: "",
    descricao_publica: "",
    descricao_secreta_admin: "",
    icone_url: "",
    categoria: "",
    trigger_key: "",
    trigger_config: {},
    id_achievement_reward: null,
    id_title_reward: null,
    visibility_before_claim: "HIDDEN",
    reveal_after_claim: "FULL",
    announce_global: true,
  };
}

function AbaProezas({
  onVerLegado,
  idParaAbrir,
  onConsumirIdParaAbrir,
}: {
  onVerLegado: (idPower: number) => void;
  idParaAbrir: number | null;
  onConsumirIdParaAbrir: () => void;
}) {
  const [itens, setItens] = useState<UniqueFeatApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [filtros, setFiltros] = useState({ nome: "", trigger_key: "", ativa: "", conquistada: "", categoria: "" });
  const [schemas, setSchemas] = useState<UniqueFeatTriggerSchemaApi[]>([]);
  const [editandoId, setEditandoId] = useState<number | null | "novo">(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const params: FiltrosUniqueFeatsAdmin = {
        nome: filtros.nome || undefined,
        trigger_key: filtros.trigger_key || undefined,
        categoria: filtros.categoria || undefined,
        ativa: filtros.ativa === "" ? undefined : filtros.ativa === "true",
        conquistada: filtros.conquistada === "" ? undefined : filtros.conquistada === "true",
      };
      setItens(await listarUniqueFeatsAdmin(params));
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar as Proezas."));
    } finally {
      setCarregando(false);
    }
  }, [filtros]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { listarUniqueFeatTriggerSchemasAdmin().then(setSchemas).catch(() => setSchemas([])); }, []);
  useEffect(() => {
    if (idParaAbrir !== null) {
      setEditandoId(idParaAbrir);
      onConsumirIdParaAbrir();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParaAbrir]);

  async function duplicar(item: UniqueFeatApi) {
    if (!window.confirm(`Duplicar a Proeza "${item.nome}"? A cópia nasce inativa, sem vencedor e com um Legado (Power) próprio.`)) return;
    try { await duplicarUniqueFeatAdmin(item.id); await carregar(); } catch (error) { setErro(mensagemDeErroAdmin(error, "Não foi possível duplicar.")); }
  }

  async function alternarAtiva(item: UniqueFeatApi) {
    try {
      if (item.ativa) {
        let motivo: string | undefined;
        if (item.claim) {
          const resposta = window.prompt(`"${item.nome}" já foi conquistada. Motivo para desativar (obrigatório):`);
          if (!resposta || !resposta.trim()) return;
          motivo = resposta.trim();
        } else if (!window.confirm(`Desativar "${item.nome}"?`)) {
          return;
        }
        await desativarUniqueFeatAdmin(item.id, motivo);
      } else {
        await reativarUniqueFeatAdmin(item.id);
      }
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível mudar o status."));
    }
  }

  if (editandoId !== null) {
    return (
      <EditorProeza
        id={editandoId === "novo" ? null : editandoId}
        schemas={schemas}
        onFechar={() => { setEditandoId(null); carregar(); }}
        onVerLegado={onVerLegado}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <input placeholder="Buscar por nome..." value={filtros.nome} onChange={(e) => setFiltros((f) => ({ ...f, nome: e.target.value }))} className={INPUT} />
          <select value={filtros.trigger_key} onChange={(e) => setFiltros((f) => ({ ...f, trigger_key: e.target.value }))} className={INPUT}>
            <option value="">Todos triggers</option>
            {schemas.map((s) => <option key={s.trigger_key} value={s.trigger_key}>{s.trigger_key}</option>)}
          </select>
          <select value={filtros.ativa} onChange={(e) => setFiltros((f) => ({ ...f, ativa: e.target.value }))} className={INPUT}>
            <option value="">Ativa/Inativa</option>
            <option value="true">Ativa</option>
            <option value="false">Inativa</option>
          </select>
          <select value={filtros.conquistada} onChange={(e) => setFiltros((f) => ({ ...f, conquistada: e.target.value }))} className={INPUT}>
            <option value="">Conquistada?</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
          <input placeholder="Categoria..." value={filtros.categoria} onChange={(e) => setFiltros((f) => ({ ...f, categoria: e.target.value }))} className={INPUT} />
        </div>
        <button type="button" onClick={() => setEditandoId("novo")} className={BTN}>+ Nova Proeza</button>
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      <p className="text-sm text-white/60">{itens.length} Proeza(s)</p>

      <div className="overflow-x-auto rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80">
        <table className="w-full text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-white/50">
              <th className="px-3 py-2">Nome</th><th className="px-3 py-2">Key</th><th className="px-3 py-2">Trigger</th>
              <th className="px-3 py-2">Status</th><th className="px-3 py-2">Conquistada</th><th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-white/50">Carregando...</td></tr>
            ) : itens.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-white/50">Nenhuma Proeza cadastrada.</td></tr>
            ) : (
              itens.map((item) => (
                <tr key={item.id} className="border-b border-white/5">
                  <td className="px-3 py-2 font-bold">{item.nome}</td>
                  <td className="px-3 py-2 text-xs text-white/60">{item.key}</td>
                  <td className="px-3 py-2 text-xs">{item.trigger_key}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${item.ativa ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/50"}`}>{item.ativa ? "Ativa" : "Inativa"}</span>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {item.claim ? (
                      <span className={item.claim.status === "REVOKED" ? "text-red-400" : "text-[#F3B43F]"}>
                        Sim — {item.claim.character_name_snapshot}{item.claim.status === "REVOKED" ? " (revogada)" : ""}
                      </span>
                    ) : (
                      <span className="text-white/50">Não</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setEditandoId(item.id)} className="text-[#F3B43F] hover:underline">Editar</button>
                      <button type="button" onClick={() => onVerLegado(item.id_power_reward)} className="text-white/70 hover:underline">Ver Legado</button>
                      <button type="button" onClick={() => duplicar(item)} className="text-white/70 hover:underline">Duplicar</button>
                      <button type="button" onClick={() => alternarAtiva(item)} className="text-white/70 hover:underline">{item.ativa ? "Desativar" : "Reativar"}</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditorProeza({
  id,
  schemas,
  onFechar,
  onVerLegado,
}: {
  id: number | null;
  schemas: UniqueFeatTriggerSchemaApi[];
  onFechar: () => void;
  onVerLegado: (idPower: number) => void;
}) {
  const [feat, setFeat] = useState<UniqueFeatApi | null>(null);
  const [form, setForm] = useState<PayloadUniqueFeatAdmin>(formProezaVazio());
  const [triggerConfigTexto, setTriggerConfigTexto] = useState("{}");
  const [origemPower, setOrigemPower] = useState<"existente" | "novo">("novo");
  const [powerExistente, setPowerExistente] = useState<PowerApi | null>(null);
  const [novoPower, setNovoPower] = useState<PayloadNovoPowerUniqueFeatAdmin>(novoPowerVazio());
  const [seletorPowerAberto, setSeletorPowerAberto] = useState(false);
  const [carregando, setCarregando] = useState(Boolean(id));
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (!id) { setCarregando(false); return; }
    setCarregando(true);
    try {
      const resultado = await obterUniqueFeatAdmin(id);
      setFeat(resultado);
      setForm({
        nome: resultado.nome,
        key: resultado.key,
        descricao_publica: resultado.descricao_publica,
        descricao_secreta_admin: resultado.descricao_secreta_admin,
        icone_url: resultado.icone_url ?? "",
        categoria: resultado.categoria ?? "",
        trigger_key: resultado.trigger_key,
        trigger_config: resultado.trigger_config,
        id_achievement_reward: resultado.id_achievement_reward,
        id_title_reward: resultado.id_title_reward,
        visibility_before_claim: resultado.visibility_before_claim,
        reveal_after_claim: resultado.reveal_after_claim,
        announce_global: resultado.announce_global,
      });
      setTriggerConfigTexto(JSON.stringify(resultado.trigger_config ?? {}, null, 2));
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar a Proeza."));
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  const schemaAtual = schemas.find((s) => s.trigger_key === form.trigger_key);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(""); setMensagem("");

    let triggerConfig: Record<string, unknown>;
    try {
      triggerConfig = JSON.parse(triggerConfigTexto || "{}");
    } catch {
      setErro("trigger_config precisa ser um JSON válido.");
      return;
    }

    if (!id) {
      if (origemPower === "existente" && !powerExistente) { setErro("Selecione um Power existente, ou troque para \"criar Power novo\"."); return; }
      if (origemPower === "novo" && !novoPower.nome) { setErro("Preencha o nome do novo Power (Legado)."); return; }
    }

    setSalvando(true);
    try {
      const base = { ...form, trigger_config: triggerConfig };
      if (id) {
        await atualizarUniqueFeatAdmin(id, {
          nome: base.nome,
          key: base.key,
          descricao_publica: base.descricao_publica,
          descricao_secreta_admin: base.descricao_secreta_admin,
          icone_url: base.icone_url || null,
          categoria: base.categoria || null,
          trigger_key: base.trigger_key,
          trigger_config: base.trigger_config,
          id_achievement_reward: base.id_achievement_reward,
          id_title_reward: base.id_title_reward,
          visibility_before_claim: base.visibility_before_claim,
          reveal_after_claim: base.reveal_after_claim,
          announce_global: base.announce_global,
        });
        setMensagem("Proeza atualizada.");
        await carregar();
      } else {
        const payload: PayloadUniqueFeatAdmin = {
          ...base,
          icone_url: base.icone_url || null,
          categoria: base.categoria || null,
          ...(origemPower === "existente" ? { id_power_reward: powerExistente!.id } : { novo_power: novoPower }),
        };
        const criada = await criarUniqueFeatAdmin(payload);
        setMensagem(`Proeza "${criada.nome}" criada (inativa). Continue editando ou ative quando estiver pronta.`);
        onFechar();
      }
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar a Proeza."));
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <p className="text-sm text-white/60">Carregando...</p>;

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onFechar} className="text-sm text-[#F3B43F]/80 hover:underline">← Voltar pra listagem</button>

      {feat?.claim && (
        <div className="rounded-2xl border-2 border-red-500/50 bg-red-950/30 p-4 text-sm text-red-200">
          Esta Proeza já foi conquistada por <strong>{feat.claim.character_name_snapshot}</strong> — editar não altera o
          vencedor, mas mude os campos com cuidado (a descrição pública, por exemplo, já foi vista pelo jogador).
        </div>
      )}
      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      {mensagem && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-[#F3B43F]">{mensagem}</p>}

      <form onSubmit={salvar} className="flex flex-col gap-4">
        <div className={CARD}>
          <p className="mb-3 font-imFeel text-xl text-[#F3B43F]">Identidade</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs">Nome<input required className={INPUT} value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} /></label>
            <label className="flex flex-col gap-1 text-xs">Key (única, sem espaços)<input required className={INPUT} value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))} /></label>
            <label className="flex flex-col gap-1 text-xs">Ícone (URL)<input className={INPUT} value={form.icone_url ?? ""} onChange={(e) => setForm((f) => ({ ...f, icone_url: e.target.value }))} /></label>
            <label className="flex flex-col gap-1 text-xs">Categoria<input className={INPUT} value={form.categoria ?? ""} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} /></label>
          </div>
          <label className="mt-3 flex flex-col gap-1 text-xs">Descrição pública (visível ao jogador conforme visibilidade)
            <textarea required rows={2} className={INPUT} value={form.descricao_publica} onChange={(e) => setForm((f) => ({ ...f, descricao_publica: e.target.value }))} />
          </label>
          <label className="mt-3 flex flex-col gap-1 text-xs">Descrição secreta (só admin — explica a condição real)
            <textarea required rows={2} className={INPUT} value={form.descricao_secreta_admin} onChange={(e) => setForm((f) => ({ ...f, descricao_secreta_admin: e.target.value }))} />
          </label>
        </div>

        <div className={CARD}>
          <p className="mb-3 font-imFeel text-xl text-[#F3B43F]">Trigger secreto</p>
          <label className="flex flex-col gap-1 text-xs">trigger_key
            <select required className={INPUT} value={form.trigger_key} onChange={(e) => setForm((f) => ({ ...f, trigger_key: e.target.value }))}>
              <option value="">Selecione...</option>
              {schemas.map((s) => <option key={s.trigger_key} value={s.trigger_key}>{s.trigger_key}</option>)}
            </select>
          </label>
          {schemaAtual && (
            <div className="mt-2 overflow-x-auto">
              <p className="mb-1 text-xs uppercase text-white/50">Campos permitidos em trigger_config (vindos do backend agora)</p>
              <table className="w-full text-left text-xs text-white/80">
                <thead><tr className="text-white/40"><th className="px-2 py-1">Campo</th><th className="px-2 py-1">Tipo</th></tr></thead>
                <tbody>
                  {Object.entries(schemaAtual.schema).map(([campo, tipo]) => (
                    <tr key={campo}><td className="px-2 py-1">{campo}</td><td className="px-2 py-1">{tipo}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <label className="mt-3 flex flex-col gap-1 text-xs">trigger_config (JSON — literal, {"{min,max}"}, {"{in:[...]}"} ou {"{contains/containsAll}"} por campo array)
            <textarea rows={5} className={`${INPUT} font-mono`} value={triggerConfigTexto} onChange={(e) => setTriggerConfigTexto(e.target.value)} />
          </label>
        </div>

        {!id && (
          <div className={CARD}>
            <p className="mb-3 font-imFeel text-xl text-[#F3B43F]">Legado (Power exclusivo)</p>
            <div className="mb-3 flex gap-2">
              <button type="button" onClick={() => setOrigemPower("novo")} className={origemPower === "novo" ? BTN : BTN_GHOST}>Criar Power novo</button>
              <button type="button" onClick={() => setOrigemPower("existente")} className={origemPower === "existente" ? BTN : BTN_GHOST}>Usar Power existente</button>
            </div>

            {origemPower === "existente" ? (
              <div>
                {powerExistente ? <p className="text-sm text-white">{powerExistente.nome} (#{powerExistente.id})</p> : <p className="text-xs text-white/50">Nenhum Power selecionado.</p>}
                <button type="button" onClick={() => setSeletorPowerAberto(true)} className="mt-1 text-xs text-[#F3B43F] hover:underline">Selecionar Power</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs">Nome<input className={INPUT} value={novoPower.nome} onChange={(e) => setNovoPower((p) => ({ ...p, nome: e.target.value }))} /></label>
                <label className="flex flex-col gap-1 text-xs">Tipo<select className={INPUT} value={novoPower.tipo_poder} onChange={(e) => setNovoPower((p) => ({ ...p, tipo_poder: e.target.value as "Ativo" | "Passivo" }))}><option value="Ativo">Ativo</option><option value="Passivo">Passivo</option></select></label>
                <label className="flex flex-col gap-1 text-xs sm:col-span-2">Descrição<textarea rows={2} className={INPUT} value={novoPower.descricao} onChange={(e) => setNovoPower((p) => ({ ...p, descricao: e.target.value }))} /></label>
                <label className="flex flex-col gap-1 text-xs">Escala de atributo<select className={INPUT} value={novoPower.escala_atributo} onChange={(e) => setNovoPower((p) => ({ ...p, escala_atributo: e.target.value as typeof novoPower.escala_atributo }))}>{ATRIBUTOS_VALIDOS.map((a) => <option key={a} value={a}>{a}</option>)}</select></label>
                <label className="flex flex-col gap-1 text-xs">Valor de escala<input type="number" step="0.01" className={INPUT} value={novoPower.valor_escala} onChange={(e) => setNovoPower((p) => ({ ...p, valor_escala: Number(e.target.value) }))} /></label>
                <label className="flex flex-col gap-1 text-xs">Custo de mana<input type="number" className={INPUT} value={novoPower.custo_mana} onChange={(e) => setNovoPower((p) => ({ ...p, custo_mana: Number(e.target.value) }))} /></label>
                <label className="flex flex-col gap-1 text-xs">Dano base<input type="number" className={INPUT} value={novoPower.dano_base ?? ""} onChange={(e) => setNovoPower((p) => ({ ...p, dano_base: e.target.value === "" ? null : Number(e.target.value) }))} /></label>
                <label className="flex flex-col gap-1 text-xs">Cura base<input type="number" className={INPUT} value={novoPower.cura_base ?? ""} onChange={(e) => setNovoPower((p) => ({ ...p, cura_base: e.target.value === "" ? null : Number(e.target.value) }))} /></label>
                <label className="flex flex-col gap-1 text-xs">Cooldown<input type="number" className={INPUT} value={novoPower.cooldown ?? ""} onChange={(e) => setNovoPower((p) => ({ ...p, cooldown: e.target.value === "" ? null : Number(e.target.value) }))} /></label>
                <label className="flex flex-col gap-1 text-xs">Imagem (URL)<input className={INPUT} value={novoPower.imagem_url ?? ""} onChange={(e) => setNovoPower((p) => ({ ...p, imagem_url: e.target.value }))} /></label>
              </div>
            )}
          </div>
        )}

        {id && feat?.powerRecompensa && (
          <div className={CARD}>
            <p className="mb-2 font-imFeel text-xl text-[#F3B43F]">Legado</p>
            <p className="text-sm text-white/80">{feat.powerRecompensa.nome} (#{feat.powerRecompensa.id})</p>
            <button type="button" onClick={() => onVerLegado(feat.powerRecompensa!.id)} className="mt-1 text-xs text-[#F3B43F] hover:underline">Editar configuração do Legado →</button>
          </div>
        )}

        <div className={CARD}>
          <p className="mb-3 font-imFeel text-xl text-[#F3B43F]">Recompensas cosméticas e visibilidade</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs">ID Achievement (opcional)<input type="number" className={INPUT} value={form.id_achievement_reward ?? ""} onChange={(e) => setForm((f) => ({ ...f, id_achievement_reward: e.target.value === "" ? null : Number(e.target.value) }))} /></label>
            <label className="flex flex-col gap-1 text-xs">ID Title (opcional)<input type="number" className={INPUT} value={form.id_title_reward ?? ""} onChange={(e) => setForm((f) => ({ ...f, id_title_reward: e.target.value === "" ? null : Number(e.target.value) }))} /></label>
            <label className="flex flex-col gap-1 text-xs">Visibilidade antes do claim<select className={INPUT} value={form.visibility_before_claim} onChange={(e) => setForm((f) => ({ ...f, visibility_before_claim: e.target.value as "HIDDEN" | "TEASER" }))}><option value="HIDDEN">HIDDEN</option><option value="TEASER">TEASER</option></select></label>
            <label className="flex flex-col gap-1 text-xs">Revelação após o claim<select className={INPUT} value={form.reveal_after_claim} onChange={(e) => setForm((f) => ({ ...f, reveal_after_claim: e.target.value as "FULL" | "FLAVOR_ONLY" | "REMAIN_SECRET" }))}><option value="FULL">FULL</option><option value="FLAVOR_ONLY">FLAVOR_ONLY</option><option value="REMAIN_SECRET">REMAIN_SECRET</option></select></label>
          </div>
          <label className="mt-3 flex items-center gap-2 text-xs">
            <input type="checkbox" checked={form.announce_global} onChange={(e) => setForm((f) => ({ ...f, announce_global: e.target.checked }))} />
            Anunciar globalmente quando alguém conquistar
          </label>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={salvando} className={BTN}>{salvando ? "Salvando..." : id ? "Salvar alterações" : "Criar Proeza (inativa)"}</button>
        </div>
      </form>

      <SeletorPowerLegado aberto={seletorPowerAberto} onFechar={() => setSeletorPowerAberto(false)} onSelecionar={setPowerExistente} />
    </div>
  );
}

// ---------------------------------------------------------------------
// Aba 2 — Legados
// ---------------------------------------------------------------------
const COLUNAS_ALLOW_LIVRES = [
  ["allow_pve", "PvE (Aventura/mundo)"],
  ["allow_party", "Grupo (Party)"],
  ["allow_guild_boss", "Chefe de Guilda"],
  ["allow_world_boss", "Ameaça Mundial (World Boss)"],
] as const;
const COLUNAS_ALLOW_TRAVADAS = [
  ["allow_pvp_casual", "PvP casual"],
  ["allow_ranked", "Ranqueado"],
  ["allow_tournament", "Torneio"],
] as const;

function AbaLegados({ idPowerInicial }: { idPowerInicial: number | null }) {
  const [idPowerTexto, setIdPowerTexto] = useState("");
  const [dados, setDados] = useState<UniqueFeatLegadoApi | null>(null);
  const [configTexto, setConfigTexto] = useState("{}");
  const [effectKey, setEffectKey] = useState("");
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [ativo, setAtivo] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const carregar = useCallback(async (idPower: number) => {
    setCarregando(true); setErro(""); setMensagem("");
    try {
      const resultado = await obterUniqueFeatLegadoAdmin(idPower);
      setDados(resultado);
      setEffectKey(resultado.efeito?.effect_key ?? "");
      setConfigTexto(JSON.stringify(resultado.efeito?.config ?? {}, null, 2));
      setAtivo(resultado.efeito?.ativo ?? true);
      setFlags({
        allow_pve: resultado.efeito?.allow_pve ?? true,
        allow_party: resultado.efeito?.allow_party ?? true,
        allow_guild_boss: resultado.efeito?.allow_guild_boss ?? true,
        allow_world_boss: resultado.efeito?.allow_world_boss ?? true,
        allow_pvp_casual: resultado.efeito?.allow_pvp_casual ?? false,
        allow_ranked: resultado.efeito?.allow_ranked ?? false,
        allow_tournament: resultado.efeito?.allow_tournament ?? false,
      });
    } catch (error) {
      setDados(null);
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar o Legado."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (idPowerInicial !== null) {
      setIdPowerTexto(String(idPowerInicial));
      carregar(idPowerInicial);
    }
  }, [idPowerInicial, carregar]);

  async function salvar() {
    if (!dados) return;
    let config: Record<string, unknown>;
    try {
      config = JSON.parse(configTexto || "{}");
    } catch {
      setErro("config precisa ser um JSON válido.");
      return;
    }
    setSalvando(true); setErro(""); setMensagem("");
    try {
      const payload: PayloadUniqueFeatLegadoAdmin = {
        effect_key: effectKey,
        config,
        ativo,
        allow_pve: flags.allow_pve,
        allow_party: flags.allow_party,
        allow_guild_boss: flags.allow_guild_boss,
        allow_world_boss: flags.allow_world_boss,
        allow_pvp_casual: flags.allow_pvp_casual,
        allow_ranked: flags.allow_ranked,
        allow_tournament: flags.allow_tournament,
      };
      await atualizarUniqueFeatLegadoAdmin(dados.power.id, payload);
      setMensagem("Legado atualizado.");
      await carregar(dados.power.id);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar o Legado."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className={CARD}>
        <p className="mb-3 font-imFeel text-xl text-[#F3B43F]">Abrir Legado por ID do Power</p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs">ID do Power
            <input className={`${INPUT} w-32`} value={idPowerTexto} onChange={(e) => setIdPowerTexto(e.target.value)} />
          </label>
          <button
            type="button"
            className={BTN}
            onClick={() => { const idPower = Number(idPowerTexto); if (Number.isInteger(idPower) && idPower > 0) carregar(idPower); else setErro("Informe um ID de Power válido."); }}
          >
            Carregar
          </button>
        </div>
        <p className="mt-2 text-xs text-white/50">Também pode ser aberto direto pelo botão &quot;Ver Legado&quot; na aba Proezas.</p>
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      {mensagem && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-[#F3B43F]">{mensagem}</p>}
      {carregando && <p className="text-sm text-white/60">Carregando...</p>}

      {dados && (
        <>
          <div className={CARD}>
            <p className="mb-2 font-imFeel text-xl text-[#F3B43F]">{dados.power.nome} (#{dados.power.id})</p>
            <p className="text-sm text-white/70">{dados.power.tipo_poder} · escala {dados.power.escala_atributo}</p>
            <p className="mt-2 text-sm text-white/80">Jogadores afetados: <strong>{dados.jogadoresAfetados}</strong> (normalmente 1 — só o vencedor da claim)</p>
          </div>

          <div className={CARD}>
            <p className="mb-3 font-imFeel text-xl text-[#F3B43F]">Efeito do Legado</p>
            <label className="flex flex-col gap-1 text-xs">effect_key (whitelist futura — Fase de Conteúdo; sem handler ainda é esperado)
              <input className={INPUT} value={effectKey} onChange={(e) => setEffectKey(e.target.value)} />
            </label>
            <label className="mt-3 flex flex-col gap-1 text-xs">config (JSON)
              <textarea rows={6} className={`${INPUT} font-mono`} value={configTexto} onChange={(e) => setConfigTexto(e.target.value)} />
            </label>
            <label className="mt-3 flex items-center gap-2 text-xs">
              <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
              Efeito ativo
            </label>
          </div>

          <div className={CARD}>
            <p className="mb-1 font-imFeel text-xl text-[#F3B43F]">Onde o Legado funciona</p>
            <p className="mb-3 text-xs text-white/50">PvE/Grupo/Chefe de Guilda/Ameaça Mundial ligados por padrão.</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {COLUNAS_ALLOW_LIVRES.map(([campo, rotulo]) => (
                <label key={campo} className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={flags[campo] ?? true} onChange={(e) => setFlags((f) => ({ ...f, [campo]: e.target.checked }))} />
                  {rotulo}
                </label>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-yellow-500/40 bg-yellow-950/20 p-3">
              <p className="text-xs font-bold uppercase text-yellow-300">Trava de V1 — mantenha desligado</p>
              <p className="mt-1 text-xs text-yellow-200/80">
                PvP casual, Ranqueado e Torneio devem continuar OFF em V1, por especificação. Ligar qualquer um destes é
                uma decisão de balanceamento competitivo fora do escopo desta tela — confirme com o time de design antes.
              </p>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {COLUNAS_ALLOW_TRAVADAS.map(([campo, rotulo]) => (
                  <label key={campo} className="flex items-center gap-2 text-xs text-yellow-200">
                    <input type="checkbox" checked={flags[campo] ?? false} onChange={(e) => setFlags((f) => ({ ...f, [campo]: e.target.checked }))} />
                    {rotulo}
                    {flags[campo] && <span className="rounded-full bg-red-500/30 px-2 py-0.5 text-[10px] font-bold text-red-200">LIGADO — fora do padrão V1</span>}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button type="button" disabled={salvando} onClick={salvar} className={BTN}>{salvando ? "Salvando..." : "Salvar Legado"}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Aba 3 — Triggers (só leitura + validador estrutural)
// ---------------------------------------------------------------------
function AbaTriggers() {
  const [schemas, setSchemas] = useState<UniqueFeatTriggerSchemaApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [triggerValidacao, setTriggerValidacao] = useState("");
  const [configValidacao, setConfigValidacao] = useState("{}");
  const [resultadoValidacao, setResultadoValidacao] = useState<{ ok: boolean; texto: string } | null>(null);
  const [validando, setValidando] = useState(false);

  useEffect(() => {
    setCarregando(true);
    listarUniqueFeatTriggerSchemasAdmin()
      .then((itens) => { setSchemas(itens); if (itens[0]) setTriggerValidacao(itens[0].trigger_key); })
      .catch((error) => setErro(mensagemDeErroAdmin(error, "Não foi possível carregar os triggers.")))
      .finally(() => setCarregando(false));
  }, []);

  async function validar() {
    setResultadoValidacao(null);
    let config: Record<string, unknown>;
    try {
      config = JSON.parse(configValidacao || "{}");
    } catch {
      setResultadoValidacao({ ok: false, texto: "O trigger_config digitado não é um JSON válido." });
      return;
    }
    setValidando(true);
    try {
      await validarUniqueFeatTriggerConfigAdmin(triggerValidacao, config);
      setResultadoValidacao({ ok: true, texto: "Configuração válida." });
    } catch (error) {
      setResultadoValidacao({ ok: false, texto: mensagemDeErroAdmin(error, "Configuração inválida.") });
    } finally {
      setValidando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-white/60">
        Só leitura — cada trigger_key vem direto do backend agora (uniqueFeatTriggerRegistry.js), então esta lista
        reflete exatamente o que o sistema aceita hoje. Nada aqui revela o quão perto qualquer jogador está de cumprir
        um trigger — é só a validação estrutural do formato de trigger_config.
      </p>
      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      {carregando ? (
        <p className="text-sm text-white/60">Carregando...</p>
      ) : (
        <div className="flex flex-col gap-3">
          {schemas.map((s) => (
            <div key={s.trigger_key} className={CARD}>
              <p className="mb-2 font-imFeel text-lg text-[#F3B43F]">{s.trigger_key}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-white/80">
                  <thead><tr className="text-white/40"><th className="px-2 py-1">Campo</th><th className="px-2 py-1">Tipo</th></tr></thead>
                  <tbody>
                    {Object.entries(s.schema).map(([campo, tipo]) => (
                      <tr key={campo}><td className="px-2 py-1">{campo}</td><td className="px-2 py-1">{tipo}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={CARD}>
        <p className="mb-3 font-imFeel text-xl text-[#F3B43F]">Validar configuração</p>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs">trigger_key
            <select className={INPUT} value={triggerValidacao} onChange={(e) => setTriggerValidacao(e.target.value)}>
              {schemas.map((s) => <option key={s.trigger_key} value={s.trigger_key}>{s.trigger_key}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">trigger_config candidato (JSON)
            <textarea rows={5} className={`${INPUT} font-mono`} value={configValidacao} onChange={(e) => setConfigValidacao(e.target.value)} />
          </label>
          <div><button type="button" disabled={validando || !triggerValidacao} onClick={validar} className={BTN}>{validando ? "Validando..." : "Validar configuração"}</button></div>
          {resultadoValidacao && (
            <p className={`text-sm ${resultadoValidacao.ok ? "text-green-300" : "text-red-400"}`}>{resultadoValidacao.texto}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Aba 4 — Histórico/Reparos
// ---------------------------------------------------------------------
function AbaHistorico({ podeReparar, onAbrirProeza }: { podeReparar: boolean; onAbrirProeza: (idProeza: number) => void }) {
  const [itens, setItens] = useState<UniqueFeatClaimApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [filtros, setFiltros] = useState({ idPersonagem: "", trigger_key: "", status: "" });

  const carregar = useCallback(async () => {
    setCarregando(true); setErro("");
    try {
      const params: FiltrosUniqueFeatClaimsAdmin = {
        idPersonagem: filtros.idPersonagem ? Number(filtros.idPersonagem) : undefined,
        trigger_key: filtros.trigger_key || undefined,
        status: filtros.status === "" ? undefined : (filtros.status as "VALID" | "REVOKED"),
      };
      setItens(await listarUniqueFeatClaimsAdmin(params));
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar o histórico."));
    } finally {
      setCarregando(false);
    }
  }, [filtros]);

  useEffect(() => { carregar(); }, [carregar]);

  async function revogar(claim: UniqueFeatClaimApi) {
    const motivo = window.prompt(`Revogar a claim de "${claim.character_name_snapshot}"? Isso remove o Legado mecânico, mas mantém o histórico. Motivo (obrigatório):`);
    if (!motivo || !motivo.trim()) return;
    try { await revogarUniqueFeatClaimAdmin(claim.id, motivo.trim()); await carregar(); } catch (error) { setErro(mensagemDeErroAdmin(error, "Não foi possível revogar a claim.")); }
  }

  async function transferir(claim: UniqueFeatClaimApi) {
    const idDestinoTexto = window.prompt("ID do personagem de destino:");
    const idDestino = Number(idDestinoTexto);
    if (!idDestinoTexto || !Number.isInteger(idDestino) || idDestino <= 0) return;
    const motivo = window.prompt(`Transferir o Legado de "${claim.character_name_snapshot}" pro personagem #${idDestino}. Motivo (obrigatório):`);
    if (!motivo || !motivo.trim()) return;
    try { await transferirUniqueFeatClaimAdmin(claim.id, idDestino, motivo.trim()); await carregar(); } catch (error) { setErro(mensagemDeErroAdmin(error, "Não foi possível transferir a claim.")); }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <input placeholder="ID do personagem..." value={filtros.idPersonagem} onChange={(e) => setFiltros((f) => ({ ...f, idPersonagem: e.target.value }))} className={`${INPUT} w-40`} />
        <input placeholder="trigger_key..." value={filtros.trigger_key} onChange={(e) => setFiltros((f) => ({ ...f, trigger_key: e.target.value }))} className={INPUT} />
        <select value={filtros.status} onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))} className={INPUT}>
          <option value="">Status</option>
          <option value="VALID">VALID</option>
          <option value="REVOKED">REVOKED</option>
        </select>
      </div>

      {!podeReparar && (
        <p className="rounded-lg bg-black/50 px-3 py-2 text-xs text-white/50">
          Revogar e Transferir exigem a permissão uniquefeats.repair (reparo excepcional, só SuperAdmin) — ocultas aqui
          porque esta conta não tem essa permissão.
        </p>
      )}
      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      <p className="text-sm text-white/60">{itens.length} claim(s)</p>

      <div className="overflow-x-auto rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80">
        <table className="w-full text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-white/50">
              <th className="px-3 py-2">Proeza</th><th className="px-3 py-2">Portador</th><th className="px-3 py-2">Trigger</th>
              <th className="px-3 py-2">Quando</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-white/50">Carregando...</td></tr>
            ) : itens.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-white/50">Nenhuma claim encontrada.</td></tr>
            ) : (
              itens.map((claim) => (
                <tr key={claim.id} className="border-b border-white/5">
                  <td className="px-3 py-2">
                    {claim.proeza ? (
                      <button type="button" onClick={() => onAbrirProeza(claim.proeza!.id)} className="font-bold text-[#F3B43F] hover:underline">{claim.proeza.nome}</button>
                    ) : (
                      <span className="text-white/40">#{claim.id_unique_feat}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {claim.character_name_snapshot}
                    {!claim.personagem && <span className="ml-1 text-[10px] uppercase text-white/40">(conta excluída)</span>}
                  </td>
                  <td className="px-3 py-2 text-xs">{claim.trigger_key}</td>
                  <td className="px-3 py-2 text-xs text-white/60">{new Date(claim.claimed_at).toLocaleString("pt-BR")}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${claim.status === "VALID" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>{claim.status}</span>
                  </td>
                  <td className="px-3 py-2">
                    {podeReparar ? (
                      <div className="flex flex-wrap gap-2">
                        {claim.status === "VALID" && <button type="button" onClick={() => revogar(claim)} className="text-red-400 hover:underline">Revogar</button>}
                        {claim.status === "VALID" && <button type="button" onClick={() => transferir(claim)} className="text-white/70 hover:underline">Transferir</button>}
                      </div>
                    ) : (
                      <span className="text-xs text-white/30">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
