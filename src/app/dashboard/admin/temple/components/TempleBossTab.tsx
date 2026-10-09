"use client";

// Templo do Véu Celestial — Guardião (Provação Final). Config + Fases +
// Resistências + Recompensas + Simulador, tudo nesta aba (sub-recursos
// exigem id_boss_config real, que só existe depois do primeiro salvar
// de "config"). Build do Guardião (Powers/ataque básico) é 100% a do
// AdventureMonster referenciado — aqui só referencia/escala/adiciona
// fases e recompensas por cima.
import { useCallback, useEffect, useState } from "react";
import {
  atualizarFaseGuardiaoTemploAdmin,
  atualizarResistenciaGuardiaoTemploAdmin,
  atualizarRecompensaGuardiaoTemploAdmin,
  catalogoStatusAdmin,
  criarFaseGuardiaoTemploAdmin,
  criarResistenciaGuardiaoTemploAdmin,
  criarRecompensaGuardiaoTemploAdmin,
  excluirFaseGuardiaoTemploAdmin,
  excluirResistenciaGuardiaoTemploAdmin,
  excluirRecompensaGuardiaoTemploAdmin,
  listarMonstrosAdmin,
  mensagemDeErroAdmin,
  obterGuardiaoTemploAdmin,
  salvarConfigGuardiaoTemploAdmin,
  simularGuardiaoTemploAdmin,
  type AdventureMonsterApi,
  type PayloadTempleBossConfigAdmin,
  type StatusCatalogEntryApi,
  type TempleBossConfigAdminApi,
  type TempleBossPhaseAdminApi,
  type TempleBossResistanceAdminApi,
  type TempleBossRewardEntryAdminApi,
  type TempleBossSimulacaoResultadoApi,
} from "@/lib/api/admin";
import { useItensParaSelecaoAdmin, formatarItemComId } from "@/components/admin/ItemPicker";
import { BTN, BTN_DANGER, BTN_GHOST, CARD, INPUT_XS, LABEL_XS } from "./styles";

export default function TempleBossTab({ idEvento, editavel }: { idEvento: number; editavel: boolean }) {
  const [config, setConfig] = useState<TempleBossConfigAdminApi | null>(null);
  const [fases, setFases] = useState<TempleBossPhaseAdminApi[]>([]);
  const [resistencias, setResistencias] = useState<TempleBossResistanceAdminApi[]>([]);
  const [rewards, setRewards] = useState<TempleBossRewardEntryAdminApi[]>([]);
  const [monstros, setMonstros] = useState<AdventureMonsterApi[]>([]);
  const [statusCatalogo, setStatusCatalogo] = useState<StatusCatalogEntryApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [configForm, setConfigForm] = useState<PayloadTempleBossConfigAdmin>({ id_monstro_base: 0, nome_exibicao: "", lore: "", reward_sigils_primeira_vitoria: 0 });
  const { itens: itensDisponiveis } = useItensParaSelecaoAdmin();

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [dados, listaMonstros, cat] = await Promise.all([obterGuardiaoTemploAdmin(idEvento), listarMonstrosAdmin(), catalogoStatusAdmin()]);
      setConfig(dados.config);
      setFases(dados.fases);
      setResistencias(dados.resistencias);
      setRewards(dados.rewardEntries);
      setMonstros(listaMonstros);
      setStatusCatalogo(cat);
      if (dados.config) setConfigForm({ ...dados.config });
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar o Guardião."));
    } finally {
      setCarregando(false);
    }
  }, [idEvento]);

  useEffect(() => { carregar(); }, [carregar]);

  async function salvarConfig() {
    if (!configForm.id_monstro_base) { setErro("Escolha o monstro-base."); return; }
    try {
      await salvarConfigGuardiaoTemploAdmin(idEvento, configForm);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar a configuração do Guardião."));
    }
  }

  if (carregando) return <p className="text-sm text-white/50">Carregando...</p>;

  return (
    <div className="flex flex-col gap-4">
      {erro && <p className="text-xs text-red-400">{erro}</p>}
      {!editavel && <p className="text-xs text-red-300">Catálogo congelado — só leitura.</p>}

      <div className={CARD}>
        <p className="mb-2 font-imFeel text-lg text-[#F3B43F]">Monstro-base & identidade</p>
        <p className="mb-2 text-xs text-white/50">
          O monstro escolhido precisa ter ai_profile ELITE_BOSS e não pode estar em rotação de zona normal — ele é marcado exclusivo do Templo
          automaticamente ao salvar. Powers/passivas/ataque básico vêm 100% dele.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label className={LABEL_XS}>Monstro-base
            <select disabled={!editavel} value={configForm.id_monstro_base || ""} onChange={(e) => setConfigForm({ ...configForm, id_monstro_base: Number(e.target.value) })} className={INPUT_XS}>
              <option value="">Selecione...</option>
              {monstros.map((m) => (
                <option key={m.id} value={m.id} disabled={m.ai_profile !== "ELITE_BOSS"}>
                  {m.nome} (ID: {m.id}){m.ai_profile !== "ELITE_BOSS" ? " — precisa de ai_profile ELITE_BOSS" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className={LABEL_XS}>Nome de exibição<input disabled={!editavel} value={configForm.nome_exibicao ?? ""} onChange={(e) => setConfigForm({ ...configForm, nome_exibicao: e.target.value })} className={INPUT_XS} /></label>
          <label className={LABEL_XS}>Sigilos na 1ª vitória<input disabled={!editavel} type="number" min={0} value={configForm.reward_sigils_primeira_vitoria ?? 0} onChange={(e) => setConfigForm({ ...configForm, reward_sigils_primeira_vitoria: Number(e.target.value) })} className={INPUT_XS} /></label>
          <label className={LABEL_XS}>Turnos-alvo pra matar (opcional)<input disabled={!editavel} type="number" min={1} value={configForm.target_turns_to_kill ?? ""} onChange={(e) => setConfigForm({ ...configForm, target_turns_to_kill: e.target.value ? Number(e.target.value) : null })} className={INPUT_XS} /></label>
          <label className={LABEL_XS}>Ações-alvo que o jogador sobrevive (opcional)<input disabled={!editavel} type="number" min={1} value={configForm.target_boss_actions_survivable ?? ""} onChange={(e) => setConfigForm({ ...configForm, target_boss_actions_survivable: e.target.value ? Number(e.target.value) : null })} className={INPUT_XS} /></label>
        </div>
        <label className={`${LABEL_XS} mt-2`}>Lore<textarea disabled={!editavel} value={configForm.lore ?? ""} onChange={(e) => setConfigForm({ ...configForm, lore: e.target.value })} rows={2} className={INPUT_XS} /></label>
        {editavel && <button type="button" onClick={salvarConfig} className={`${BTN} mt-3`}>Salvar configuração</button>}
      </div>

      {config && (
        <>
          <FasesSecao idEvento={idEvento} fases={fases} editavel={editavel} onMudou={carregar} setErro={setErro} />
          <ResistenciasSecao idEvento={idEvento} resistencias={resistencias} statusCatalogo={statusCatalogo} editavel={editavel} onMudou={carregar} setErro={setErro} />
          <RecompensasSecao idEvento={idEvento} rewards={rewards} itensDisponiveis={itensDisponiveis} editavel={editavel} onMudou={carregar} setErro={setErro} />
          <SimuladorSecao idEvento={idEvento} setErro={setErro} />
        </>
      )}
    </div>
  );
}

function FasesSecao({ idEvento, fases, editavel, onMudou, setErro }: { idEvento: number; fases: TempleBossPhaseAdminApi[]; editavel: boolean; onMudou: () => Promise<void>; setErro: (s: string) => void }) {
  const [novo, setNovo] = useState({ ordem: fases.length, hp_threshold_pct: 100, nome_exibicao: "", dano_multiplicador: 1, defesa_multiplicador: 1, enrage: false });

  async function adicionar() {
    try { await criarFaseGuardiaoTemploAdmin(idEvento, novo); await onMudou(); } catch (e) { setErro(mensagemDeErroAdmin(e, "Não foi possível criar a fase.")); }
  }
  async function atualizar(id: number, patch: Partial<TempleBossPhaseAdminApi>) {
    try { await atualizarFaseGuardiaoTemploAdmin(idEvento, id, patch); await onMudou(); } catch (e) { setErro(mensagemDeErroAdmin(e, "Não foi possível atualizar a fase.")); }
  }
  async function excluir(id: number) {
    try { await excluirFaseGuardiaoTemploAdmin(idEvento, id); await onMudou(); } catch (e) { setErro(mensagemDeErroAdmin(e, "Não foi possível excluir a fase.")); }
  }

  return (
    <div className={CARD}>
      <p className="mb-2 font-imFeel text-lg text-[#F3B43F]">Fases (por %HP)</p>
      <table className="w-full text-left text-xs text-white/80">
        <thead><tr className="border-b border-white/10 uppercase text-white/50"><th className="px-2 py-1">Ordem</th><th className="px-2 py-1">Nome</th><th className="px-2 py-1">%HP limiar</th><th className="px-2 py-1">Dano x</th><th className="px-2 py-1">Defesa x</th><th className="px-2 py-1">Enrage</th><th></th></tr></thead>
        <tbody>
          {fases.map((f) => (
            <tr key={f.id} className="border-b border-white/5">
              <td className="px-2 py-1"><input disabled={!editavel} type="number" defaultValue={f.ordem} onBlur={(e) => atualizar(f.id, { ordem: Number(e.target.value) })} className={`${INPUT_XS} w-12`} /></td>
              <td className="px-2 py-1"><input disabled={!editavel} defaultValue={f.nome_exibicao ?? ""} onBlur={(e) => atualizar(f.id, { nome_exibicao: e.target.value })} className={INPUT_XS} /></td>
              <td className="px-2 py-1"><input disabled={!editavel} type="number" defaultValue={f.hp_threshold_pct} onBlur={(e) => atualizar(f.id, { hp_threshold_pct: Number(e.target.value) })} className={`${INPUT_XS} w-16`} /></td>
              <td className="px-2 py-1"><input disabled={!editavel} type="number" step="0.1" defaultValue={f.dano_multiplicador} onBlur={(e) => atualizar(f.id, { dano_multiplicador: Number(e.target.value) })} className={`${INPUT_XS} w-16`} /></td>
              <td className="px-2 py-1"><input disabled={!editavel} type="number" step="0.1" defaultValue={f.defesa_multiplicador} onBlur={(e) => atualizar(f.id, { defesa_multiplicador: Number(e.target.value) })} className={`${INPUT_XS} w-16`} /></td>
              <td className="px-2 py-1"><input disabled={!editavel} type="checkbox" defaultChecked={f.enrage} onChange={(e) => atualizar(f.id, { enrage: e.target.checked })} /></td>
              <td className="px-2 py-1">{editavel && <button type="button" onClick={() => excluir(f.id)} className={BTN_DANGER}>Excluir</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {editavel && (
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <input placeholder="Ordem" type="number" value={novo.ordem} onChange={(e) => setNovo({ ...novo, ordem: Number(e.target.value) })} className={`${INPUT_XS} w-16`} />
          <input placeholder="Nome" value={novo.nome_exibicao} onChange={(e) => setNovo({ ...novo, nome_exibicao: e.target.value })} className={INPUT_XS} />
          <input placeholder="%HP limiar" type="number" value={novo.hp_threshold_pct} onChange={(e) => setNovo({ ...novo, hp_threshold_pct: Number(e.target.value) })} className={`${INPUT_XS} w-20`} />
          <button type="button" onClick={adicionar} className={BTN}>+ Fase</button>
        </div>
      )}
    </div>
  );
}

function ResistenciasSecao({ idEvento, resistencias, statusCatalogo, editavel, onMudou, setErro }: { idEvento: number; resistencias: TempleBossResistanceAdminApi[]; statusCatalogo: StatusCatalogEntryApi[]; editavel: boolean; onMudou: () => Promise<void>; setErro: (s: string) => void }) {
  const [novoStatus, setNovoStatus] = useState("");
  const disponiveis = statusCatalogo.filter((s) => !resistencias.some((r) => r.status_key === s.status_key));

  async function adicionar() {
    if (!novoStatus) return;
    try { await criarResistenciaGuardiaoTemploAdmin(idEvento, { status_key: novoStatus, resistencia_pct: 0, imune: false }); setNovoStatus(""); await onMudou(); } catch (e) { setErro(mensagemDeErroAdmin(e, "Não foi possível adicionar.")); }
  }
  async function atualizar(id: number, patch: Partial<TempleBossResistanceAdminApi>) {
    try { await atualizarResistenciaGuardiaoTemploAdmin(idEvento, id, patch); await onMudou(); } catch (e) { setErro(mensagemDeErroAdmin(e, "Não foi possível atualizar.")); }
  }
  async function excluir(id: number) {
    try { await excluirResistenciaGuardiaoTemploAdmin(idEvento, id); await onMudou(); } catch (e) { setErro(mensagemDeErroAdmin(e, "Não foi possível excluir.")); }
  }

  return (
    <div className={CARD}>
      <p className="mb-2 font-imFeel text-lg text-[#F3B43F]">Resistências de status</p>
      <table className="w-full text-left text-xs text-white/80">
        <thead><tr className="border-b border-white/10 uppercase text-white/50"><th className="px-2 py-1">Status</th><th className="px-2 py-1">Resistência %</th><th className="px-2 py-1">Imune</th><th></th></tr></thead>
        <tbody>
          {resistencias.map((r) => (
            <tr key={r.id} className="border-b border-white/5">
              <td className="px-2 py-1 font-bold">{statusCatalogo.find((s) => s.status_key === r.status_key)?.nomeUi ?? r.status_key}</td>
              <td className="px-2 py-1"><input disabled={!editavel || r.imune} type="number" min={0} max={100} defaultValue={r.resistencia_pct} onBlur={(e) => atualizar(r.id, { resistencia_pct: Number(e.target.value) })} className={`${INPUT_XS} w-20 disabled:opacity-40`} /></td>
              <td className="px-2 py-1"><input disabled={!editavel} type="checkbox" defaultChecked={r.imune} onChange={(e) => atualizar(r.id, { imune: e.target.checked })} /></td>
              <td className="px-2 py-1">{editavel && <button type="button" onClick={() => excluir(r.id)} className={BTN_DANGER}>Excluir</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {editavel && (
        <div className="mt-2 flex items-end gap-2">
          <select value={novoStatus} onChange={(e) => setNovoStatus(e.target.value)} className={INPUT_XS}>
            <option value="">Selecione um status...</option>
            {disponiveis.map((s) => <option key={s.status_key} value={s.status_key}>{s.nomeUi}</option>)}
          </select>
          <button type="button" disabled={!novoStatus} onClick={adicionar} className={BTN}>+ Adicionar</button>
        </div>
      )}
    </div>
  );
}

function RecompensasSecao({ idEvento, rewards, itensDisponiveis, editavel, onMudou, setErro }: { idEvento: number; rewards: TempleBossRewardEntryAdminApi[]; itensDisponiveis: { id: number; nome: string }[]; editavel: boolean; onMudou: () => Promise<void>; setErro: (s: string) => void }) {
  const [novo, setNovo] = useState<{ reward_kind: "STACKABLE_ITEM" | "EQUIPMENT"; id_item: number | ""; quantidade: number; weight: number; nome_exibicao: string; garantido: boolean }>({ reward_kind: "STACKABLE_ITEM", id_item: "", quantidade: 1, weight: 1, nome_exibicao: "", garantido: false });

  async function adicionar() {
    if (!novo.id_item || !novo.nome_exibicao) { setErro("Item e nome de exibição são obrigatórios."); return; }
    try { await criarRecompensaGuardiaoTemploAdmin(idEvento, { ...novo, id_item: Number(novo.id_item) }); setNovo({ reward_kind: "STACKABLE_ITEM", id_item: "", quantidade: 1, weight: 1, nome_exibicao: "", garantido: false }); await onMudou(); } catch (e) { setErro(mensagemDeErroAdmin(e, "Não foi possível adicionar a recompensa.")); }
  }
  async function atualizar(id: number, patch: Partial<TempleBossRewardEntryAdminApi>) {
    try { await atualizarRecompensaGuardiaoTemploAdmin(idEvento, id, patch); await onMudou(); } catch (e) { setErro(mensagemDeErroAdmin(e, "Não foi possível atualizar.")); }
  }
  async function excluir(id: number) {
    try { await excluirRecompensaGuardiaoTemploAdmin(idEvento, id); await onMudou(); } catch (e) { setErro(mensagemDeErroAdmin(e, "Não foi possível excluir.")); }
  }

  return (
    <div className={CARD}>
      <p className="mb-1 font-imFeel text-lg text-[#F3B43F]">Recompensas do primeiro clear</p>
      <p className="mb-2 text-xs text-white/50">Garantido: sempre concedido. Não-garantido: concorre por um único roll ponderado pelo peso.</p>
      <table className="w-full text-left text-xs text-white/80">
        <thead><tr className="border-b border-white/10 uppercase text-white/50"><th className="px-2 py-1">Nome</th><th className="px-2 py-1">Qtd</th><th className="px-2 py-1">Peso</th><th className="px-2 py-1">Garantido</th><th></th></tr></thead>
        <tbody>
          {rewards.map((r) => (
            <tr key={r.id} className="border-b border-white/5">
              <td className="px-2 py-1 font-bold">{r.nome_exibicao}</td>
              <td className="px-2 py-1"><input disabled={!editavel} type="number" min={1} defaultValue={r.quantidade} onBlur={(e) => atualizar(r.id, { quantidade: Number(e.target.value) })} className={`${INPUT_XS} w-16`} /></td>
              <td className="px-2 py-1"><input disabled={!editavel || r.garantido} type="number" min={0} defaultValue={r.weight} onBlur={(e) => atualizar(r.id, { weight: Number(e.target.value) })} className={`${INPUT_XS} w-16 disabled:opacity-40`} /></td>
              <td className="px-2 py-1"><input disabled={!editavel} type="checkbox" defaultChecked={r.garantido} onChange={(e) => atualizar(r.id, { garantido: e.target.checked })} /></td>
              <td className="px-2 py-1">{editavel && <button type="button" onClick={() => excluir(r.id)} className={BTN_DANGER}>Excluir</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {editavel && (
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <select value={novo.id_item} onChange={(e) => setNovo({ ...novo, id_item: Number(e.target.value) })} className={INPUT_XS}>
            <option value="">Item...</option>
            {itensDisponiveis.map((i) => <option key={i.id} value={i.id}>{formatarItemComId(i.nome, i.id)}</option>)}
          </select>
          <input placeholder="Nome de exibição" value={novo.nome_exibicao} onChange={(e) => setNovo({ ...novo, nome_exibicao: e.target.value })} className={INPUT_XS} />
          <input placeholder="Qtd" type="number" min={1} value={novo.quantidade} onChange={(e) => setNovo({ ...novo, quantidade: Number(e.target.value) })} className={`${INPUT_XS} w-16`} />
          <input placeholder="Peso" type="number" min={0} value={novo.weight} onChange={(e) => setNovo({ ...novo, weight: Number(e.target.value) })} className={`${INPUT_XS} w-16`} />
          <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={novo.garantido} onChange={(e) => setNovo({ ...novo, garantido: e.target.checked })} /> Garantido</label>
          <button type="button" onClick={adicionar} className={BTN}>+ Recompensa</button>
        </div>
      )}
    </div>
  );
}

function SimuladorSecao({ idEvento, setErro }: { idEvento: number; setErro: (s: string) => void }) {
  const [dpr, setDpr] = useState(50);
  const [ehp, setEhp] = useState(500);
  const [resultado, setResultado] = useState<TempleBossSimulacaoResultadoApi | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function simular() {
    setCarregando(true);
    setErro("");
    try {
      setResultado(await simularGuardiaoTemploAdmin(idEvento, { dpr, ehp }));
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível simular."));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className={CARD}>
      <p className="mb-1 font-imFeel text-lg text-[#F3B43F]">Simulador de balanceamento</p>
      <p className="mb-3 text-xs text-white/50">
        Reaplica a MESMA fórmula de escala usada no combate real (templeBossScalingService), com um perfil hipotético de jogador
        (dano por rodada / HP efetivo) digitado aqui — nunca uma segunda fórmula.
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <label className={LABEL_XS}>DPR (dano por rodada)<input type="number" min={1} value={dpr} onChange={(e) => setDpr(Number(e.target.value))} className={INPUT_XS} /></label>
        <label className={LABEL_XS}>EHP (HP efetivo)<input type="number" min={1} value={ehp} onChange={(e) => setEhp(Number(e.target.value))} className={INPUT_XS} /></label>
        <button type="button" disabled={carregando} onClick={simular} className={BTN}>{carregando ? "Simulando..." : "Simular"}</button>
      </div>
      {resultado && (
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-white/80 sm:grid-cols-4">
          <div><p className="text-[10px] uppercase text-white/40">HP escalado</p><p>{resultado.stats_escalados.vida_maxima}</p></div>
          <div><p className="text-[10px] uppercase text-white/40">Dano escalado</p><p>{resultado.stats_escalados.dano_min}–{resultado.stats_escalados.dano_max}</p></div>
          <div><p className="text-[10px] uppercase text-white/40">Multiplicador aplicado</p><p>{resultado.stats_escalados.multiplicador_aplicado.toFixed(2)}x</p></div>
          <div><p className="text-[10px] uppercase text-white/40">Turnos estimados pra matar o Boss</p><p>{resultado.turnos_estimados_pra_matar}</p></div>
          <div><p className="text-[10px] uppercase text-white/40">Ações do Boss pra matar o jogador</p><p>{resultado.acoes_do_boss_pra_matar_jogador}</p></div>
        </div>
      )}
    </div>
  );
}
