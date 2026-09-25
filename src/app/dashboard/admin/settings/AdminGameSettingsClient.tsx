"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  listarGameSettingsAdmin,
  mensagemDeErroAdmin,
  salvarGameSettingAdmin,
  type GameSettingApi,
} from "@/lib/api/admin";

const TIPOS = ["number", "boolean", "string", "json"] as const;

function valorParaTexto(valor: unknown, tipo: string): string {
  if (tipo === "json") return JSON.stringify(valor, null, 2);
  return String(valor);
}

function textoParaValor(texto: string, tipo: string): unknown {
  if (tipo === "number") {
    const n = Number(texto);
    if (Number.isNaN(n)) throw new Error("Valor precisa ser um número.");
    return n;
  }
  if (tipo === "boolean") {
    if (texto !== "true" && texto !== "false") throw new Error('Valor precisa ser "true" ou "false".');
    return texto === "true";
  }
  if (tipo === "json") {
    try {
      return JSON.parse(texto);
    } catch {
      throw new Error("JSON inválido.");
    }
  }
  return texto;
}

export default function AdminGameSettingsClient() {
  const [settings, setSettings] = useState<GameSettingApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [editandoChave, setEditandoChave] = useState<string | null>(null);
  const [textoValor, setTextoValor] = useState("");
  const [tipoEditado, setTipoEditado] = useState<GameSettingApi["tipo"]>("string");
  const [descricaoEditada, setDescricaoEditada] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [novaChave, setNovaChave] = useState("");
  const [mostrarNova, setMostrarNova] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resultado = await listarGameSettingsAdmin();
      setSettings(resultado);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar as configurações."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirEdicao(setting: GameSettingApi) {
    setEditandoChave(setting.chave);
    setTextoValor(valorParaTexto(setting.valor, setting.tipo));
    setTipoEditado(setting.tipo);
    setDescricaoEditada(setting.descricao ?? "");
    setMensagem("");
  }

  function abrirCriacao() {
    setMostrarNova(true);
    setNovaChave("");
    setEditandoChave(null);
    setTextoValor("");
    setTipoEditado("string");
    setDescricaoEditada("");
    setMensagem("");
  }

  async function salvar(chave: string) {
    setSalvando(true);
    setMensagem("");
    try {
      const valor = textoParaValor(textoValor, tipoEditado);
      await salvarGameSettingAdmin(chave, { valor, tipo: tipoEditado, descricao: descricaoEditada || null });
      setMensagem(`"${chave}" salva.`);
      setEditandoChave(null);
      setMostrarNova(false);
      await carregar();
    } catch (error) {
      setMensagem(error instanceof Error && !("response" in error) ? error.message : mensagemDeErroAdmin(error, "Não foi possível salvar."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
            ← Painel Administrativo
          </Link>
          <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Configurações</h1>
          <p className="mt-1 text-xs text-white/50">
            Só parâmetros operacionais deliberadamente administráveis (taxas, limites, parâmetros econômicos) —
            nunca todas as constantes do jogo.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirCriacao}
          className="rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black hover:bg-[#a5710f]"
        >
          + Nova config
        </button>
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      {mensagem && !editandoChave && !mostrarNova && (
        <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-[#F3B43F]">{mensagem}</p>
      )}

      {mostrarNova && (
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-4 text-white">
          <p className="font-imFeel text-lg text-[#F3B43F]">Nova configuração</p>
          {mensagem && <p className="text-sm text-[#F3B43F]">{mensagem}</p>}
          <label className="flex flex-col gap-1 text-xs">
            Chave
            <input
              value={novaChave}
              onChange={(e) => setNovaChave(e.target.value)}
              placeholder="Ex: mercado.taxa_percentual"
              className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Tipo
            <select
              value={tipoEditado}
              onChange={(e) => setTipoEditado(e.target.value as GameSettingApi["tipo"])}
              className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Valor
            <textarea
              value={textoValor}
              onChange={(e) => setTextoValor(e.target.value)}
              rows={tipoEditado === "json" ? 4 : 1}
              className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm font-mono"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Descrição
            <input
              value={descricaoEditada}
              onChange={(e) => setDescricaoEditada(e.target.value)}
              className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setMostrarNova(false)}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={salvando || !novaChave.trim()}
              onClick={() => salvar(novaChave.trim())}
              className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Criar"}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {carregando ? (
          <p className="text-sm text-white/50">Carregando...</p>
        ) : settings.length === 0 ? (
          <p className="text-sm text-white/50">Nenhuma configuração cadastrada ainda.</p>
        ) : (
          settings.map((setting) => (
            <div key={setting.chave} className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4 text-white">
              {editandoChave === setting.chave ? (
                <div className="flex flex-col gap-3">
                  <p className="font-imFeel text-lg text-[#F3B43F]">{setting.chave}</p>
                  {mensagem && <p className="text-sm text-[#F3B43F]">{mensagem}</p>}
                  <label className="flex flex-col gap-1 text-xs">
                    Tipo
                    <select
                      value={tipoEditado}
                      onChange={(e) => setTipoEditado(e.target.value as GameSettingApi["tipo"])}
                      className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                    >
                      {TIPOS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    Valor
                    <textarea
                      value={textoValor}
                      onChange={(e) => setTextoValor(e.target.value)}
                      rows={tipoEditado === "json" ? 4 : 1}
                      className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm font-mono"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    Descrição
                    <input
                      value={descricaoEditada}
                      onChange={(e) => setDescricaoEditada(e.target.value)}
                      className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                    />
                  </label>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditandoChave(null)}
                      className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={salvando}
                      onClick={() => salvar(setting.chave)}
                      className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50"
                    >
                      {salvando ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-imFeel text-lg text-[#F3B43F]">{setting.chave}</p>
                    <p className="text-xs text-white/50">{setting.descricao ?? "Sem descrição."}</p>
                    <p className="mt-1 font-mono text-sm text-white">
                      {valorParaTexto(setting.valor, setting.tipo)}{" "}
                      <span className="text-white/40">({setting.tipo})</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => abrirEdicao(setting)}
                    disabled={!setting.editavel_admin}
                    className="shrink-0 text-[#F3B43F] hover:underline disabled:opacity-40"
                  >
                    {setting.editavel_admin ? "Editar" : "Bloqueada"}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
