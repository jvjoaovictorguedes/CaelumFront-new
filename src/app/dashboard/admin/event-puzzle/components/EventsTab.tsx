"use client";

import { useCallback, useEffect, useState } from "react";
import {
  criarDefinicaoEventPuzzleAdmin,
  criarEdicaoEventPuzzleAdmin,
  listarDefinicoesEventPuzzleAdmin,
  listarEdicoesEventPuzzleAdmin,
  mensagemDeErroAdmin,
  transicionarDefinicaoEventPuzzleAdmin,
  transicionarEdicaoEventPuzzleAdmin,
  type EventPuzzleDefinitionApi,
  type EventPuzzleDefinitionStatus,
  type EventPuzzleEditionApi,
  type EventPuzzleEditionStatus,
  type PayloadEventPuzzleDefinicaoAdmin,
  type PayloadEventPuzzleEdicaoAdmin,
} from "@/lib/api/admin";
import { BTN, BTN_GHOST, CARD, INPUT_XS, LABEL_XS } from "./styles";

const STATUS_DEFINICAO_LABEL: Record<EventPuzzleDefinitionStatus, string> = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicado",
  ARCHIVED: "Arquivado",
};
const PROXIMOS_STATUS_DEFINICAO: Record<EventPuzzleDefinitionStatus, EventPuzzleDefinitionStatus[]> = {
  DRAFT: ["PUBLISHED", "ARCHIVED"],
  PUBLISHED: ["ARCHIVED"],
  ARCHIVED: [],
};

const STATUS_EDICAO_LABEL: Record<EventPuzzleEditionStatus, string> = {
  DRAFT: "Rascunho",
  SCHEDULED: "Agendada",
  ACTIVE: "Ativa",
  ENDED: "Encerrada",
  CANCELLED: "Cancelada",
};
const PROXIMOS_STATUS_EDICAO: Record<EventPuzzleEditionStatus, EventPuzzleEditionStatus[]> = {
  DRAFT: ["SCHEDULED", "ACTIVE", "CANCELLED"],
  SCHEDULED: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["ENDED", "CANCELLED"],
  ENDED: [],
  CANCELLED: [],
};

function definicaoVazia(): PayloadEventPuzzleDefinicaoAdmin {
  return { key: "", nome: "", descricao: "" };
}

export default function EventsTab({
  editavel,
  definicaoSelecionada,
  onSelecionarDefinicao,
}: {
  editavel: boolean;
  definicaoSelecionada: EventPuzzleDefinitionApi | null;
  onSelecionarDefinicao: (d: EventPuzzleDefinitionApi | null) => void;
}) {
  const [definicoes, setDefinicoes] = useState<EventPuzzleDefinitionApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [criando, setCriando] = useState(false);
  const [formNovo, setFormNovo] = useState<PayloadEventPuzzleDefinicaoAdmin>(definicaoVazia());

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setDefinicoes(await listarDefinicoesEventPuzzleAdmin());
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar os eventos."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function criar() {
    if (!formNovo.key.trim() || !formNovo.nome.trim()) {
      setErro("Key e nome são obrigatórios.");
      return;
    }
    try {
      const criada = await criarDefinicaoEventPuzzleAdmin(formNovo);
      setFormNovo(definicaoVazia());
      setCriando(false);
      await carregar();
      onSelecionarDefinicao(criada);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível criar o evento."));
    }
  }

  async function transicionar(definicao: EventPuzzleDefinitionApi, status: EventPuzzleDefinitionStatus) {
    try {
      const atualizada = await transicionarDefinicaoEventPuzzleAdmin(definicao.id, status);
      await carregar();
      if (definicaoSelecionada?.id === definicao.id) onSelecionarDefinicao(atualizada);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível transicionar o evento."));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}

      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60">{definicoes.length} EventDefinition(s) no catálogo</p>
        {editavel && (
          <button type="button" onClick={() => setCriando((v) => !v)} className={BTN}>
            {criando ? "Cancelar" : "+ Novo evento"}
          </button>
        )}
      </div>

      {criando && (
        <div className={CARD}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <label className={LABEL_XS}>
              Key<input value={formNovo.key} onChange={(e) => setFormNovo({ ...formNovo, key: e.target.value })} className={INPUT_XS} placeholder="coracao-maquina-celestial" />
            </label>
            <label className={LABEL_XS}>
              Nome<input value={formNovo.nome} onChange={(e) => setFormNovo({ ...formNovo, nome: e.target.value })} className={INPUT_XS} />
            </label>
          </div>
          <label className={`${LABEL_XS} mt-2`}>
            Descrição<textarea value={formNovo.descricao ?? ""} onChange={(e) => setFormNovo({ ...formNovo, descricao: e.target.value })} className={INPUT_XS} rows={2} />
          </label>
          <button type="button" onClick={criar} className={`${BTN} mt-3`}>
            Criar evento
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80">
        <table className="w-full text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-white/50">
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Key</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-white/50">
                  Carregando...
                </td>
              </tr>
            ) : definicoes.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-white/50">
                  Nenhum evento cadastrado.
                </td>
              </tr>
            ) : (
              definicoes.map((d) => (
                <tr key={d.id} className={`border-b border-white/5 align-top ${definicaoSelecionada?.id === d.id ? "bg-white/5" : ""}`}>
                  <td className="px-3 py-2 font-bold">
                    <button type="button" onClick={() => onSelecionarDefinicao(d)} className="text-left hover:underline">
                      {d.nome}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-white/60">{d.key}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#F3B43F]">
                      {STATUS_DEFINICAO_LABEL[d.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => onSelecionarDefinicao(d)} className="text-[#F3B43F] hover:underline">
                        Ver edições ↓
                      </button>
                      {editavel &&
                        PROXIMOS_STATUS_DEFINICAO[d.status].map((proximo) => (
                          <button key={proximo} type="button" onClick={() => transicionar(d, proximo)} className={BTN_GHOST}>
                            → {STATUS_DEFINICAO_LABEL[proximo]}
                          </button>
                        ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {definicaoSelecionada && (
        <EdicoesSecao
          definicao={definicaoSelecionada}
          editavel={editavel}
          statusLabel={STATUS_EDICAO_LABEL}
          proximosStatus={PROXIMOS_STATUS_EDICAO}
          setErroGlobal={setErro}
        />
      )}
    </div>
  );
}

function edicaoVazia(): PayloadEventPuzzleEdicaoAdmin {
  return { key: "", nome: "" };
}

function EdicoesSecao({
  definicao,
  editavel,
  statusLabel,
  proximosStatus,
  setErroGlobal,
}: {
  definicao: EventPuzzleDefinitionApi;
  editavel: boolean;
  statusLabel: Record<EventPuzzleEditionStatus, string>;
  proximosStatus: Record<EventPuzzleEditionStatus, EventPuzzleEditionStatus[]>;
  setErroGlobal: (s: string) => void;
}) {
  const [edicoes, setEdicoes] = useState<EventPuzzleEditionApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [criando, setCriando] = useState(false);
  const [formNovo, setFormNovo] = useState<PayloadEventPuzzleEdicaoAdmin>(edicaoVazia());

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setEdicoes(await listarEdicoesEventPuzzleAdmin(definicao.id));
    } catch (error) {
      setErroGlobal(mensagemDeErroAdmin(error, "Não foi possível carregar as edições."));
    } finally {
      setCarregando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definicao.id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function criar() {
    if (!formNovo.key.trim() || !formNovo.nome.trim()) {
      setErroGlobal("Key e nome da edição são obrigatórios.");
      return;
    }
    try {
      await criarEdicaoEventPuzzleAdmin(definicao.id, formNovo);
      setFormNovo(edicaoVazia());
      setCriando(false);
      await carregar();
    } catch (error) {
      setErroGlobal(mensagemDeErroAdmin(error, "Não foi possível criar a edição."));
    }
  }

  async function transicionar(edicao: EventPuzzleEditionApi, status: EventPuzzleEditionStatus) {
    try {
      await transicionarEdicaoEventPuzzleAdmin(edicao.id, status);
      await carregar();
    } catch (error) {
      setErroGlobal(mensagemDeErroAdmin(error, "Não foi possível transicionar a edição."));
    }
  }

  return (
    <div className={CARD}>
      <div className="mb-2 flex items-center justify-between">
        <p className="font-imFeel text-lg text-[#F3B43F]">Edições de &quot;{definicao.nome}&quot;</p>
        {editavel && (
          <button type="button" onClick={() => setCriando((v) => !v)} className={BTN}>
            {criando ? "Cancelar" : "+ Nova edição"}
          </button>
        )}
      </div>
      <p className="mb-2 text-xs text-white/50">
        Edição = uma temporada concreta do evento (ex.: &quot;Edição de Outubro/2026&quot;). Só é possível ativar uma edição se o evento estiver
        Publicado.
      </p>

      {criando && (
        <div className="mb-3 rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className={LABEL_XS}>
              Key<input value={formNovo.key} onChange={(e) => setFormNovo({ ...formNovo, key: e.target.value })} className={INPUT_XS} />
            </label>
            <label className={LABEL_XS}>
              Nome<input value={formNovo.nome} onChange={(e) => setFormNovo({ ...formNovo, nome: e.target.value })} className={INPUT_XS} />
            </label>
            <label className={LABEL_XS}>
              Início<input type="datetime-local" value={formNovo.starts_at ?? ""} onChange={(e) => setFormNovo({ ...formNovo, starts_at: e.target.value || null })} className={INPUT_XS} />
            </label>
            <label className={LABEL_XS}>
              Fim<input type="datetime-local" value={formNovo.ends_at ?? ""} onChange={(e) => setFormNovo({ ...formNovo, ends_at: e.target.value || null })} className={INPUT_XS} />
            </label>
          </div>
          <button type="button" onClick={criar} className={`${BTN} mt-3`}>
            Criar edição
          </button>
        </div>
      )}

      <table className="w-full text-left text-xs text-white/80">
        <thead>
          <tr className="border-b border-white/10 uppercase text-white/50">
            <th className="px-2 py-1">Nome</th>
            <th className="px-2 py-1">Key</th>
            <th className="px-2 py-1">Status</th>
            <th className="px-2 py-1">Início</th>
            <th className="px-2 py-1">Fim</th>
            <th className="px-2 py-1"></th>
          </tr>
        </thead>
        <tbody>
          {carregando ? (
            <tr>
              <td colSpan={6} className="px-2 py-2 text-center">
                Carregando...
              </td>
            </tr>
          ) : edicoes.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-2 py-2 text-center text-white/40">
                Nenhuma edição cadastrada.
              </td>
            </tr>
          ) : (
            edicoes.map((e) => (
              <tr key={e.id} className="border-b border-white/5">
                <td className="px-2 py-1 font-bold">{e.nome}</td>
                <td className="px-2 py-1">{e.key}</td>
                <td className="px-2 py-1">{statusLabel[e.status]}</td>
                <td className="px-2 py-1">{e.starts_at ? new Date(e.starts_at).toLocaleString("pt-BR") : "—"}</td>
                <td className="px-2 py-1">{e.ends_at ? new Date(e.ends_at).toLocaleString("pt-BR") : "—"}</td>
                <td className="px-2 py-1">
                  <div className="flex flex-wrap gap-2">
                    {editavel &&
                      proximosStatus[e.status].map((proximo) => (
                        <button key={proximo} type="button" onClick={() => transicionar(e, proximo)} className="text-[#F3B43F] hover:underline">
                          → {statusLabel[proximo]}
                        </button>
                      ))}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
