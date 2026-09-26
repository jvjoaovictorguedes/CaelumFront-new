"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  TRIGGER_KEYS_PROEZA_UNICA,
  atualizarProezaUnicaAdmin,
  criarProezaUnicaAdmin,
  listarProezasUnicasAdmin,
  mensagemDeErroAdmin,
  type PayloadCriarProezaUnicaAdmin,
  type UniqueFeatApi,
} from "@/lib/api/admin";

const ESTADO_INICIAL: PayloadCriarProezaUnicaAdmin = {
  key: "",
  nome: "",
  descricao_publica: "",
  descricao_secreta_admin: "",
  trigger_key: "ADVENTURE_VICTORY",
  power: { nome: "", descricao: "", tipo_poder: "Ativo", escala_atributo: "Forca" },
};

export default function AdminUniqueFeatsClient() {
  const [feats, setFeats] = useState<UniqueFeatApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState<PayloadCriarProezaUnicaAdmin>(ESTADO_INICIAL);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setFeats(await listarProezasUnicasAdmin());
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar as Proezas Únicas."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirCriacao() {
    setForm(ESTADO_INICIAL);
    setMostrarForm(true);
  }

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      await criarProezaUnicaAdmin(form);
      setMostrarForm(false);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível criar a Proeza Única."));
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtiva(feat: UniqueFeatApi) {
    try {
      await atualizarProezaUnicaAdmin(feat.id, { ativa: !feat.ativa });
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível mudar o status da Proeza."));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Proezas Únicas</h1>
        <p className="mt-1 text-xs text-white/50">
          Cada Proeza concede uma Habilidade Única a UM único jogador do servidor inteiro. Pra conceder uma Proeza já
          cadastrada a um jogador específico, use o painel de{" "}
          <Link href="/dashboard/admin/grants" className="text-[#F3B43F] hover:underline">
            Premiações
          </Link>
          .
        </p>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={abrirCriacao} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
          + Nova Proeza Única
        </button>
      </div>
      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : (
        <div className="flex flex-col gap-2">
          {feats.map((feat) => (
            <div key={feat.id} className={`flex flex-col gap-1 rounded-xl border border-[#F3B43F]/30 bg-[#292018]/80 p-3 text-white ${!feat.ativa ? "opacity-50" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold">
                    {feat.nome} <span className="text-xs text-white/50">({feat.key})</span>
                  </p>
                  <p className="text-xs text-white/50">
                    Gatilho: {feat.trigger_key} · Habilidade: {feat.powerRecompensa?.nome ?? `Power #${feat.id_power_reward}`}
                  </p>
                </div>
                <button type="button" onClick={() => alternarAtiva(feat)} className="shrink-0 text-sm text-white/70 hover:underline">
                  {feat.ativa ? "Desativar" : "Ativar"}
                </button>
              </div>
              <p className="text-xs">
                {feat.claim ? (
                  <span className="text-[#F3B43F]">
                    Conquistada por <strong>{feat.claim.character_name_snapshot}</strong> em{" "}
                    {new Date(feat.claim.claimed_at).toLocaleDateString("pt-BR")}
                  </span>
                ) : (
                  <span className="text-white/50">Ainda não conquistada — disponível pra concessão em Premiações.</span>
                )}
              </p>
            </div>
          ))}
          {feats.length === 0 && <p className="text-sm text-white/50">Nenhuma Proeza Única cadastrada ainda.</p>}
        </div>
      )}

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMostrarForm(false)}>
          <form
            onSubmit={salvar}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl"
          >
            <p className="font-imFeel text-xl text-[#F3B43F]">Nova Proeza Única</p>

            <label className="flex flex-col gap-1 text-xs">
              Key (identificador técnico, único)
              <input required value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Nome
              <input required value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Descrição pública
              <textarea required rows={2} value={form.descricao_publica} onChange={(e) => setForm((f) => ({ ...f, descricao_publica: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Descrição secreta (só admin)
              <textarea required rows={2} value={form.descricao_secreta_admin} onChange={(e) => setForm((f) => ({ ...f, descricao_secreta_admin: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Gatilho
              <select value={form.trigger_key} onChange={(e) => setForm((f) => ({ ...f, trigger_key: e.target.value as PayloadCriarProezaUnicaAdmin["trigger_key"] }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
                {TRIGGER_KEYS_PROEZA_UNICA.map((chave) => (
                  <option key={chave} value={chave}>
                    {chave}
                  </option>
                ))}
              </select>
            </label>

            <p className="mt-2 text-xs font-bold uppercase text-[#F3B43F]/80">Habilidade Única concedida</p>
            <label className="flex flex-col gap-1 text-xs">
              Nome da habilidade
              <input required value={form.power.nome} onChange={(e) => setForm((f) => ({ ...f, power: { ...f.power, nome: e.target.value } }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Descrição da habilidade
              <textarea required rows={2} value={form.power.descricao} onChange={(e) => setForm((f) => ({ ...f, power: { ...f.power, descricao: e.target.value } }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-xs">
                Tipo
                <select value={form.power.tipo_poder} onChange={(e) => setForm((f) => ({ ...f, power: { ...f.power, tipo_poder: e.target.value as "Ativo" | "Passivo" } }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
                  <option value="Ativo">Ativo</option>
                  <option value="Passivo">Passivo</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Escala de atributo
                <select value={form.power.escala_atributo} onChange={(e) => setForm((f) => ({ ...f, power: { ...f.power, escala_atributo: e.target.value as PayloadCriarProezaUnicaAdmin["power"]["escala_atributo"] } }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm">
                  <option value="Forca">Força</option>
                  <option value="Vitalidade">Vitalidade</option>
                  <option value="Agilidade">Agilidade</option>
                  <option value="Inteligencia">Inteligência</option>
                  <option value="Velocidade">Velocidade</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Dano base
                <input type="number" min={0} value={form.power.dano_base ?? 0} onChange={(e) => setForm((f) => ({ ...f, power: { ...f.power, dano_base: Number(e.target.value) } }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Cura base
                <input type="number" min={0} value={form.power.cura_base ?? 0} onChange={(e) => setForm((f) => ({ ...f, power: { ...f.power, cura_base: Number(e.target.value) } }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Custo de mana
                <input type="number" min={0} value={form.power.custo_mana ?? 0} onChange={(e) => setForm((f) => ({ ...f, power: { ...f.power, custo_mana: Number(e.target.value) } }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Cooldown (turnos)
                <input type="number" min={0} value={form.power.cooldown ?? 0} onChange={(e) => setForm((f) => ({ ...f, power: { ...f.power, cooldown: Number(e.target.value) } }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
            </div>

            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setMostrarForm(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">
                Cancelar
              </button>
              <button type="submit" disabled={salvando} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
                {salvando ? "Salvando..." : "Criar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
