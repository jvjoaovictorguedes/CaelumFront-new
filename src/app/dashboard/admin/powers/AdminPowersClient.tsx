"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  adicionarStatusEffectPowerAdmin,
  atualizarPowerAdmin,
  atualizarStatusEffectPowerAdmin,
  catalogoStatusAdmin,
  criarPowerAdmin,
  desvincularClassePowerAdmin,
  desvincularRacaPowerAdmin,
  duplicarPowerAdmin,
  jogadoresAfetadosPowerAdmin,
  listarClassesPublicas,
  listarPowersAdmin,
  listarRacasPublicas,
  listarVinculosPowerAdmin,
  mensagemDeErroAdmin,
  previewEvolucaoPowerAdmin,
  previewStatusPowerAdmin,
  removerStatusEffectPowerAdmin,
  vincularClassePowerAdmin,
  vincularRacaPowerAdmin,
  type ClassAbilityApi,
  type ClassPublicaApi,
  type PayloadPowerAdmin,
  type PowerApi,
  type PreviewEvolucaoPowerApi,
  type PreviewStatusPowerApi,
  type RaceAbilityApi,
  type RacePublicaApi,
  type StatusCatalogEntryApi,
} from "@/lib/api/admin";

const TIPOS_PODER = ["Ativo", "Passivo"] as const;
const ATRIBUTOS = ["Forca", "Vitalidade", "Agilidade", "Inteligencia", "Velocidade"] as const;
const TARGETS = ["Self", "Enemy"] as const;

function formularioPowerVazio(): PayloadPowerAdmin {
  return {
    nome: "",
    descricao: "",
    tipo_poder: "Ativo",
    custo_mana: 0,
    dano_base: 0,
    cura_base: 0,
    cooldown: null,
    escala_atributo: "Forca",
    valor_escala: 0,
    imagem_url: "",
  };
}

function DetalhePower({
  power,
  classes,
  racas,
  catalogo,
  onFechar,
  onMudou,
}: {
  power: PowerApi;
  classes: ClassPublicaApi[];
  racas: RacePublicaApi[];
  catalogo: StatusCatalogEntryApi[];
  onFechar: () => void;
  onMudou: () => void;
}) {
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [afetados, setAfetados] = useState<number | null>(null);

  const [form, setForm] = useState<PayloadPowerAdmin>({
    nome: power.nome,
    descricao: power.descricao,
    tipo_poder: power.tipo_poder,
    custo_mana: power.custo_mana,
    dano_base: power.dano_base,
    cura_base: power.cura_base,
    cooldown: power.cooldown,
    escala_atributo: power.escala_atributo,
    valor_escala: power.valor_escala,
    imagem_url: power.imagem_url ?? "",
  });
  const [salvandoInfo, setSalvandoInfo] = useState(false);

  const [vinculos, setVinculos] = useState<{ classes: ClassAbilityApi[]; racas: RaceAbilityApi[] }>({ classes: [], racas: [] });
  const [novaClasseId, setNovaClasseId] = useState("");
  const [novoNivelClasse, setNovoNivelClasse] = useState(1);
  const [novoCustoClasse, setNovoCustoClasse] = useState("");
  const [novaRacaId, setNovaRacaId] = useState("");
  const [novoNivelRaca, setNovoNivelRaca] = useState(1);
  const [novoCustoRaca, setNovoCustoRaca] = useState("");

  const [novoStatusKey, setNovoStatusKey] = useState(catalogo[0]?.status_key ?? "");
  const [novoTarget, setNovoTarget] = useState<"Self" | "Enemy">("Enemy");
  const [novaChancePct, setNovaChancePct] = useState(100);
  const [novaDuracao, setNovaDuracao] = useState(1);
  const [novaPotenciaBase, setNovaPotenciaBase] = useState(0);
  const [novoAtributoEscala, setNovoAtributoEscala] = useState("");
  const [novoValorEscala, setNovoValorEscala] = useState(0);
  const [adicionandoEfeito, setAdicionandoEfeito] = useState(false);

  const [evolucao, setEvolucao] = useState<PreviewEvolucaoPowerApi | null>(null);
  const [atributoExemplo, setAtributoExemplo] = useState(100);
  const [statusPreview, setStatusPreview] = useState<PreviewStatusPowerApi | null>(null);

  const carregarVinculos = useCallback(async () => {
    try {
      const dados = await listarVinculosPowerAdmin(power.id);
      setVinculos(dados);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar os vínculos."));
    }
  }, [power.id]);

  useEffect(() => {
    carregarVinculos();
    jogadoresAfetadosPowerAdmin(power.id)
      .then(setAfetados)
      .catch(() => setAfetados(null));
  }, [power.id, carregarVinculos]);

  async function salvarInfo(evento: React.FormEvent) {
    evento.preventDefault();
    setSalvandoInfo(true);
    setErro("");
    try {
      await atualizarPowerAdmin(power.id, form);
      setMensagem("Habilidade atualizada.");
      onMudou();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar."));
    } finally {
      setSalvandoInfo(false);
    }
  }

  async function vincularClasse(evento: React.FormEvent) {
    evento.preventDefault();
    setErro("");
    try {
      await vincularClassePowerAdmin(power.id, {
        id_classe: Number(novaClasseId),
        nivel_aprendizagem: novoNivelClasse,
        custo_ouro: novoCustoClasse ? Number(novoCustoClasse) : null,
      });
      setNovaClasseId("");
      setNovoCustoClasse("");
      await carregarVinculos();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível vincular a classe."));
    }
  }

  async function desvincularClasse(idClasse: number) {
    setErro("");
    try {
      await desvincularClassePowerAdmin(power.id, idClasse);
      await carregarVinculos();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível desvincular a classe."));
    }
  }

  async function vincularRaca(evento: React.FormEvent) {
    evento.preventDefault();
    setErro("");
    try {
      await vincularRacaPowerAdmin(power.id, {
        id_raca: Number(novaRacaId),
        nivel_aprendizado: novoNivelRaca,
        custo_ouro: novoCustoRaca ? Number(novoCustoRaca) : null,
      });
      setNovaRacaId("");
      setNovoCustoRaca("");
      await carregarVinculos();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível vincular a raça."));
    }
  }

  async function desvincularRaca(idRaca: number) {
    setErro("");
    try {
      await desvincularRacaPowerAdmin(power.id, idRaca);
      await carregarVinculos();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível desvincular a raça."));
    }
  }

  async function adicionarEfeito(evento: React.FormEvent) {
    evento.preventDefault();
    setAdicionandoEfeito(true);
    setErro("");
    try {
      await adicionarStatusEffectPowerAdmin(power.id, {
        status_key: novoStatusKey,
        target: novoTarget,
        chance_ppm: Math.round((novaChancePct / 100) * 1_000_000),
        duration_turns: novaDuracao,
        potency_base: novaPotenciaBase,
        potency_scale_attribute: (novoAtributoEscala || null) as PayloadPowerAdmin["escala_atributo"] | null,
        potency_scale_value: novoValorEscala,
      });
      setNovaPotenciaBase(0);
      setNovoValorEscala(0);
      setNovoAtributoEscala("");
      onMudou();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível adicionar o efeito."));
    } finally {
      setAdicionandoEfeito(false);
    }
  }

  async function alternarEfeitoAtivo(idEfeito: number, ativo: boolean) {
    setErro("");
    try {
      await atualizarStatusEffectPowerAdmin(idEfeito, { ativo });
      onMudou();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível atualizar o efeito."));
    }
  }

  async function removerEfeito(idEfeito: number) {
    setErro("");
    try {
      await removerStatusEffectPowerAdmin(idEfeito);
      onMudou();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível remover o efeito."));
    }
  }

  async function simularEvolucao() {
    setErro("");
    try {
      setEvolucao(await previewEvolucaoPowerAdmin(power.id));
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível simular a evolução."));
    }
  }

  async function simularStatus() {
    setErro("");
    try {
      setStatusPreview(await previewStatusPowerAdmin(power.id, atributoExemplo));
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível simular o status."));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onFechar}>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-4 overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <p className="font-imFeel text-2xl text-[#F3B43F]">{power.nome}</p>
          <button type="button" onClick={onFechar} className="text-white/60 hover:text-white">
            ✕
          </button>
        </div>
        {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
        {mensagem && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-[#F3B43F]">{mensagem}</p>}
        {afetados !== null && afetados > 0 && (
          <p className="rounded-lg bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300">
            ⚠ {afetados} jogador(es) já possuem essa habilidade — qualquer edição de balanceamento aqui vale pra eles imediatamente, sem versionamento.
          </p>
        )}

        <form onSubmit={salvarInfo} className="flex flex-col gap-2 rounded-xl border border-white/10 p-3">
          <p className="text-xs font-bold uppercase text-[#F3B43F]/80">Informações</p>
          <input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" placeholder="Nome" />
          <textarea value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} rows={2} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" placeholder="Descrição" />
          <div className="flex gap-2">
            <label className="flex flex-1 flex-col gap-1 text-[10px] text-white/60">
              Tipo
              <select value={form.tipo_poder} onChange={(e) => setForm((f) => ({ ...f, tipo_poder: e.target.value as "Ativo" | "Passivo" }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
                {TIPOS_PODER.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-1 flex-col gap-1 text-[10px] text-white/60">
              Escala (atributo)
              <select value={form.escala_atributo} onChange={(e) => setForm((f) => ({ ...f, escala_atributo: e.target.value as PayloadPowerAdmin["escala_atributo"] }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
                {ATRIBUTOS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-1 flex-col gap-1 text-[10px] text-white/60">
              Valor da escala
              <input type="number" step="0.01" value={form.valor_escala ?? 0} onChange={(e) => setForm((f) => ({ ...f, valor_escala: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
          </div>
          <div className="flex gap-2">
            <label className="flex flex-1 flex-col gap-1 text-[10px] text-white/60">
              Custo de mana
              <input type="number" min={0} value={form.custo_mana ?? 0} onChange={(e) => setForm((f) => ({ ...f, custo_mana: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-[10px] text-white/60">
              Dano base
              <input type="number" value={form.dano_base ?? 0} onChange={(e) => setForm((f) => ({ ...f, dano_base: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-[10px] text-white/60">
              Cura base
              <input type="number" value={form.cura_base ?? 0} onChange={(e) => setForm((f) => ({ ...f, cura_base: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-[10px] text-white/60">
              Cooldown (turnos)
              <input type="number" min={0} value={form.cooldown ?? ""} onChange={(e) => setForm((f) => ({ ...f, cooldown: e.target.value ? Number(e.target.value) : null }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
          </div>
          <input value={form.imagem_url ?? ""} onChange={(e) => setForm((f) => ({ ...f, imagem_url: e.target.value }))} placeholder="Imagem (URL)" className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
          <button type="submit" disabled={salvandoInfo} className="self-end rounded-lg bg-[#BC8418] px-4 py-1.5 text-xs font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
            {salvandoInfo ? "Salvando..." : "Salvar"}
          </button>
        </form>

        <div className="flex flex-col gap-2 rounded-xl border border-white/10 p-3">
          <p className="text-xs font-bold uppercase text-[#F3B43F]/80">Vínculo com Classes</p>
          {vinculos.classes.map((v) => (
            <div key={v.id_classe} className="flex items-center justify-between rounded-lg bg-black/20 px-2 py-1 text-sm">
              <span>
                {v.Class?.nome ?? `Classe #${v.id_classe}`} · nível {v.nivel_aprendizagem}
                {v.custo_ouro ? ` · ${v.custo_ouro} ouro` : ""}
              </span>
              <button type="button" onClick={() => desvincularClasse(v.id_classe)} className="text-xs text-red-400 hover:underline">
                Remover
              </button>
            </div>
          ))}
          <form onSubmit={vincularClasse} className="flex flex-wrap items-end gap-2 pt-1">
            <select required value={novaClasseId} onChange={(e) => setNovaClasseId(e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm">
              <option value="">Classe...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            <label className="flex flex-col gap-1 text-[10px] text-white/60">
              Nível
              <input type="number" min={1} max={10} value={novoNivelClasse} onChange={(e) => setNovoNivelClasse(Number(e.target.value))} className="w-16 rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-[10px] text-white/60">
              Custo (ouro)
              <input type="number" min={0} value={novoCustoClasse} onChange={(e) => setNovoCustoClasse(e.target.value)} className="w-24 rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm" />
            </label>
            <button type="submit" className="rounded-lg bg-[#BC8418] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#a5710f]">
              + Vincular
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-white/10 p-3">
          <p className="text-xs font-bold uppercase text-[#F3B43F]/80">Vínculo com Raças</p>
          {vinculos.racas.map((v) => (
            <div key={v.id_raca} className="flex items-center justify-between rounded-lg bg-black/20 px-2 py-1 text-sm">
              <span>
                {v.Race ? `${v.Race.nome_masculino} / ${v.Race.nome_feminino}` : `Raça #${v.id_raca}`} · nível {v.nivel_aprendizado}
                {v.custo_ouro ? ` · ${v.custo_ouro} ouro` : ""}
              </span>
              <button type="button" onClick={() => desvincularRaca(v.id_raca)} className="text-xs text-red-400 hover:underline">
                Remover
              </button>
            </div>
          ))}
          <form onSubmit={vincularRaca} className="flex flex-wrap items-end gap-2 pt-1">
            <select required value={novaRacaId} onChange={(e) => setNovaRacaId(e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm">
              <option value="">Raça...</option>
              {racas.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome_masculino} / {r.nome_feminino}
                </option>
              ))}
            </select>
            <label className="flex flex-col gap-1 text-[10px] text-white/60">
              Nível
              <input type="number" min={1} max={10} value={novoNivelRaca} onChange={(e) => setNovoNivelRaca(Number(e.target.value))} className="w-16 rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-[10px] text-white/60">
              Custo (ouro)
              <input type="number" min={0} value={novoCustoRaca} onChange={(e) => setNovoCustoRaca(e.target.value)} className="w-24 rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm" />
            </label>
            <button type="submit" className="rounded-lg bg-[#BC8418] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#a5710f]">
              + Vincular
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-white/10 p-3">
          <p className="text-xs font-bold uppercase text-[#F3B43F]/80">Efeitos de status aplicados</p>
          {(power.efeitosDeStatus ?? []).map((efeito) => (
            <div key={efeito.id} className="flex items-center justify-between rounded-lg bg-black/20 px-2 py-1 text-sm">
              <span className={efeito.ativo ? "" : "text-white/40"}>
                {catalogo.find((c) => c.status_key === efeito.status_key)?.nomeUi ?? efeito.status_key} · {efeito.target} · {(efeito.chance_ppm / 10000).toFixed(1)}% · {efeito.duration_turns} turno(s)
                {efeito.potency_base ? ` · potência base ${efeito.potency_base}` : ""}
                {efeito.potency_scale_attribute ? ` +${efeito.potency_scale_value} por pt de ${efeito.potency_scale_attribute}` : ""}
              </span>
              <div className="flex gap-2 text-xs">
                <button type="button" onClick={() => alternarEfeitoAtivo(efeito.id, !efeito.ativo)} className="text-white/70 hover:underline">
                  {efeito.ativo ? "Desativar" : "Ativar"}
                </button>
                <button type="button" onClick={() => removerEfeito(efeito.id)} className="text-red-400 hover:underline">
                  Remover
                </button>
              </div>
            </div>
          ))}
          <form onSubmit={adicionarEfeito} className="flex flex-col gap-2 pt-1">
            <div className="flex flex-wrap items-end gap-2">
              <select value={novoStatusKey} onChange={(e) => setNovoStatusKey(e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm">
                {catalogo.map((c) => (
                  <option key={c.status_key} value={c.status_key}>
                    {c.nomeUi}
                  </option>
                ))}
              </select>
              <select value={novoTarget} onChange={(e) => setNovoTarget(e.target.value as "Self" | "Enemy")} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm">
                {TARGETS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <label className="flex flex-col gap-1 text-[10px] text-white/60">
                Chance (%)
                <input type="number" min={0.1} max={100} step="0.1" value={novaChancePct} onChange={(e) => setNovaChancePct(Number(e.target.value))} className="w-20 rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-[10px] text-white/60">
                Duração (turnos)
                <input type="number" min={1} value={novaDuracao} onChange={(e) => setNovaDuracao(Number(e.target.value))} className="w-20 rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm" />
              </label>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1 text-[10px] text-white/60">
                Potência base
                <input type="number" step="0.1" value={novaPotenciaBase} onChange={(e) => setNovaPotenciaBase(Number(e.target.value))} className="w-24 rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-[10px] text-white/60">
                Escala por atributo
                <select value={novoAtributoEscala} onChange={(e) => setNovoAtributoEscala(e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm">
                  <option value="">Sem escala</option>
                  {ATRIBUTOS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[10px] text-white/60">
                Valor por ponto
                <input type="number" step="0.01" value={novoValorEscala} onChange={(e) => setNovoValorEscala(Number(e.target.value))} className="w-24 rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm" />
              </label>
              <button type="submit" disabled={adicionandoEfeito} className="rounded-lg bg-[#BC8418] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
                + Efeito
              </button>
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-white/10 p-3">
          <p className="text-xs font-bold uppercase text-[#F3B43F]/80">Simular evolução (nível 1-10)</p>
          <button type="button" onClick={simularEvolucao} className="self-start rounded-lg border border-[#F3B43F]/50 px-3 py-1.5 text-xs font-bold text-[#F3B43F] hover:bg-[#F3B43F]/10">
            Simular
          </button>
          {evolucao && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-white">
                <thead>
                  <tr className="text-white/50">
                    <th className="px-2 py-1">Nível</th>
                    <th className="px-2 py-1">Marco</th>
                    <th className="px-2 py-1">Dano</th>
                    <th className="px-2 py-1">Cura</th>
                    <th className="px-2 py-1">Custo mana</th>
                    <th className="px-2 py-1">Custo p/ evoluir</th>
                  </tr>
                </thead>
                <tbody>
                  {evolucao.niveis.map((n) => (
                    <tr key={n.nivel} className={n.marco ? "text-[#F3B43F]" : ""}>
                      <td className="px-2 py-1">{n.nivel}</td>
                      <td className="px-2 py-1">{n.marco ?? "—"}</td>
                      <td className="px-2 py-1">{n.dano ?? "—"}</td>
                      <td className="px-2 py-1">{n.cura ?? "—"}</td>
                      <td className="px-2 py-1">{n.custo_mana}</td>
                      <td className="px-2 py-1">
                        {n.custo_para_proximo_nivel ? `${n.custo_para_proximo_nivel.ouro} ouro + ${n.custo_para_proximo_nivel.fragmentos} fragmento(s)` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-white/10 p-3">
          <p className="text-xs font-bold uppercase text-[#F3B43F]/80">Simular potência de status</p>
          <div className="flex items-end gap-2">
            <label className="flex flex-col gap-1 text-[10px] text-white/60">
              Valor de exemplo do atributo de escala
              <input type="number" min={0} value={atributoExemplo} onChange={(e) => setAtributoExemplo(Number(e.target.value))} className="w-32 rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm" />
            </label>
            <button type="button" onClick={simularStatus} className="rounded-lg border border-[#F3B43F]/50 px-3 py-1.5 text-xs font-bold text-[#F3B43F] hover:bg-[#F3B43F]/10">
              Simular
            </button>
          </div>
          {statusPreview && (
            <div className="flex flex-col gap-1 text-sm">
              {statusPreview.efeitos.length === 0 && <p className="text-white/40">Nenhum efeito ativo.</p>}
              {statusPreview.efeitos.map((e, i) => (
                <p key={i}>
                  {e.nome_ui} ({e.target}) · {e.chance_percentual}% · {e.duration_turns} turno(s) · potência estimada: <b className="text-[#F3B43F]">{e.potencia_estimada}</b>
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPowersClient() {
  const [powers, setPowers] = useState<PowerApi[]>([]);
  const [classes, setClasses] = useState<ClassPublicaApi[]>([]);
  const [racas, setRacas] = useState<RacePublicaApi[]>([]);
  const [catalogo, setCatalogo] = useState<StatusCatalogEntryApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [filtroNome, setFiltroNome] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroEscala, setFiltroEscala] = useState("");

  const [detalheId, setDetalheId] = useState<number | null>(null);
  const [mostrarCriacao, setMostrarCriacao] = useState(false);
  const [novoForm, setNovoForm] = useState<PayloadPowerAdmin>(formularioPowerVazio());
  const [criando, setCriando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const lista = await listarPowersAdmin({
        nome: filtroNome || undefined,
        tipo_poder: filtroTipo || undefined,
        escala_atributo: filtroEscala || undefined,
      });
      setPowers(lista);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar as habilidades."));
    } finally {
      setCarregando(false);
    }
  }, [filtroNome, filtroTipo, filtroEscala]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    Promise.all([listarClassesPublicas(), listarRacasPublicas(), catalogoStatusAdmin()])
      .then(([c, r, cat]) => {
        setClasses(c);
        setRacas(r);
        setCatalogo(cat);
      })
      .catch(() => {});
  }, []);

  async function criar(evento: React.FormEvent) {
    evento.preventDefault();
    setCriando(true);
    setErro("");
    try {
      const novo = await criarPowerAdmin(novoForm);
      setMostrarCriacao(false);
      setNovoForm(formularioPowerVazio());
      await carregar();
      setDetalheId(novo.id);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível criar a habilidade."));
    } finally {
      setCriando(false);
    }
  }

  async function duplicar(id: number) {
    setErro("");
    try {
      await duplicarPowerAdmin(id);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível duplicar a habilidade."));
    }
  }

  const detalhe = powers.find((p) => p.id === detalheId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
            ← Painel Administrativo
          </Link>
          <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Habilidades</h1>
        </div>
        <button type="button" onClick={() => setMostrarCriacao(true)} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
          + Nova habilidade
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={filtroNome}
          onChange={(e) => setFiltroNome(e.target.value)}
          className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white"
        />
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white">
          <option value="">Todos os tipos</option>
          {TIPOS_PODER.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select value={filtroEscala} onChange={(e) => setFiltroEscala(e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white">
          <option value="">Toda escala</option>
          {ATRIBUTOS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {powers.map((power) => (
            <div key={power.id} className="flex flex-col gap-1 rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4 text-white">
              <div className="flex items-center justify-between">
                <p className="font-imFeel text-lg text-[#F3B43F]">{power.nome}</p>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-white/60">{power.tipo_poder}</span>
              </div>
              <p className="text-xs text-white/50">Escala: {power.escala_atributo} · {power.efeitosDeStatus?.length ?? 0} efeito(s) de status</p>
              <div className="mt-2 flex gap-2 text-sm">
                <button type="button" onClick={() => setDetalheId(power.id)} className="text-[#F3B43F] hover:underline">
                  Gerenciar
                </button>
                <button type="button" onClick={() => duplicar(power.id)} className="text-white/70 hover:underline">
                  Duplicar
                </button>
              </div>
            </div>
          ))}
          {powers.length === 0 && <p className="text-sm text-white/50">Nenhuma habilidade cadastrada ainda.</p>}
        </div>
      )}

      {mostrarCriacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMostrarCriacao(false)}>
          <form onSubmit={criar} onClick={(e) => e.stopPropagation()} className="flex w-full max-w-md flex-col gap-3 rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-[#F3B43F]">Nova habilidade</p>
            <label className="flex flex-col gap-1 text-xs">
              Nome
              <input required value={novoForm.nome} onChange={(e) => setNovoForm((f) => ({ ...f, nome: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Descrição
              <textarea required value={novoForm.descricao} onChange={(e) => setNovoForm((f) => ({ ...f, descricao: e.target.value }))} rows={2} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Tipo
                <select value={novoForm.tipo_poder} onChange={(e) => setNovoForm((f) => ({ ...f, tipo_poder: e.target.value as "Ativo" | "Passivo" }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
                  {TIPOS_PODER.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Escala
                <select value={novoForm.escala_atributo} onChange={(e) => setNovoForm((f) => ({ ...f, escala_atributo: e.target.value as PayloadPowerAdmin["escala_atributo"] }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
                  {ATRIBUTOS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="text-[11px] text-white/50">Depois de criada, use &quot;Gerenciar&quot; pra ajustar números, vincular Classe/Raça e configurar efeitos de status.</p>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setMostrarCriacao(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">
                Cancelar
              </button>
              <button type="submit" disabled={criando} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
                {criando ? "Criando..." : "Criar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {detalhe && (
        <DetalhePower
          power={detalhe}
          classes={classes}
          racas={racas}
          catalogo={catalogo}
          onFechar={() => setDetalheId(null)}
          onMudou={carregar}
        />
      )}
    </div>
  );
}
