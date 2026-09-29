"use client";

import { useCallback, useEffect, useState } from "react";
import {
  atualizarZonaAdmin,
  criarZonaAdmin,
  listarZonasAdmin,
  mensagemDeErroAdmin,
  type AdventureZoneApi,
} from "@/lib/api/admin";
import { ZoneEditor } from "./ZoneEditor";

// Especificação v3 §1.2/§2 — a criação simples continua no modal
// pequeno (abrirCriacaoRapida abaixo); "Editar" abre o ZoneEditor
// grande, que é o único lugar que edita o elenco de monstros da zona.
export function ZonesTab() {
  const [zonas, setZonas] = useState<AdventureZoneApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mostrarCriacaoRapida, setMostrarCriacaoRapida] = useState(false);
  const [formRapido, setFormRapido] = useState<Partial<AdventureZoneApi>>({});
  const [salvandoRapido, setSalvandoRapido] = useState(false);
  const [zonaEditando, setZonaEditando] = useState<AdventureZoneApi | null>(null);
  const [editorAberto, setEditorAberto] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setZonas(await listarZonasAdmin());
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar as zonas."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirCriacaoRapida() {
    setFormRapido({ nome: "", descricao: "", nivel_monstro_min: 1, nivel_monstro_max: 5, nivel_jogador_minimo: 1, imagem_url: "", ordem: zonas.length + 1, ativa: true });
    setMostrarCriacaoRapida(true);
  }

  async function salvarCriacaoRapida(evento: React.FormEvent) {
    evento.preventDefault();
    setSalvandoRapido(true);
    setErro("");
    try {
      await criarZonaAdmin(formRapido);
      setMostrarCriacaoRapida(false);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível criar a zona."));
    } finally {
      setSalvandoRapido(false);
    }
  }

  async function alternarAtiva(zona: AdventureZoneApi) {
    try {
      await atualizarZonaAdmin(zona.id, { ativa: !zona.ativa });
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível mudar o status da zona."));
    }
  }

  function abrirEdicao(zona: AdventureZoneApi) {
    setZonaEditando(zona);
    setEditorAberto(true);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <button type="button" onClick={abrirCriacaoRapida} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
          + Nova zona
        </button>
      </div>
      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
      {carregando ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : (
        <div className="flex flex-col gap-2">
          {zonas.map((zona) => (
            <div key={zona.id} className={`flex items-center justify-between gap-3 rounded-xl border border-[#F3B43F]/30 bg-[#292018]/80 p-3 text-white ${!zona.ativa ? "opacity-50" : ""}`}>
              <div className="min-w-0">
                <p className="font-bold">
                  {zona.ordem}. {zona.nome}{" "}
                  <span className="text-xs text-white/50">
                    (nível {zona.nivel_monstro_min}-{zona.nivel_monstro_max})
                  </span>{" "}
                  <span className="text-xs font-bold text-[#F3B43F]">Requer nível {zona.nivel_jogador_minimo}</span>
                </p>
                <p className="truncate text-xs text-white/50">{zona.descricao}</p>
              </div>
              <div className="flex shrink-0 gap-2 text-sm">
                <button type="button" onClick={() => abrirEdicao(zona)} className="text-[#F3B43F] hover:underline">
                  Editar
                </button>
                <button type="button" onClick={() => alternarAtiva(zona)} className="text-white/70 hover:underline">
                  {zona.ativa ? "Desativar" : "Ativar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mostrarCriacaoRapida && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMostrarCriacaoRapida(false)}>
          <form onSubmit={salvarCriacaoRapida} onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-[#F3B43F]">Nova zona</p>
            <p className="text-xs text-white/50">Criação rápida — o elenco de monstros se configura depois, em &quot;Editar&quot;.</p>
            <label className="flex flex-col gap-1 text-xs">
              Nome
              <input required value={formRapido.nome ?? ""} onChange={(e) => setFormRapido((f) => ({ ...f, nome: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Descrição
              <textarea value={formRapido.descricao ?? ""} onChange={(e) => setFormRapido((f) => ({ ...f, descricao: e.target.value }))} rows={2} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Nível mín. dos monstros
                <input type="number" required value={formRapido.nivel_monstro_min ?? 1} onChange={(e) => setFormRapido((f) => ({ ...f, nivel_monstro_min: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Nível máx. dos monstros
                <input type="number" required value={formRapido.nivel_monstro_max ?? 5} onChange={(e) => setFormRapido((f) => ({ ...f, nivel_monstro_max: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Ordem
                <input type="number" value={formRapido.ordem ?? 0} onChange={(e) => setFormRapido((f) => ({ ...f, ordem: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-bold text-[#F3B43F]">Nível mínimo pra ENTRAR na zona</span>
              <input
                type="number"
                min={1}
                required
                value={formRapido.nivel_jogador_minimo ?? 1}
                onChange={(e) => setFormRapido((f) => ({ ...f, nivel_jogador_minimo: Number(e.target.value) }))}
                className="rounded-lg border-2 border-[#F3B43F]/50 bg-black/30 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Imagem (URL)
              <input value={formRapido.imagem_url ?? ""} onChange={(e) => setFormRapido((f) => ({ ...f, imagem_url: e.target.value }))} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setMostrarCriacaoRapida(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">
                Cancelar
              </button>
              <button type="submit" disabled={salvandoRapido} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
                {salvandoRapido ? "Salvando..." : "Criar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {editorAberto && zonaEditando && (
        <ZoneEditor
          zona={zonaEditando}
          onFechar={() => setEditorAberto(false)}
          onSalvo={() => {
            setEditorAberto(false);
            carregar();
          }}
        />
      )}
    </div>
  );
}
