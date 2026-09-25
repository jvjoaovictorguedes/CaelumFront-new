"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  adicionarBonusEquipmentSetAdmin,
  adicionarPecaEquipmentSetAdmin,
  atualizarEquipmentSetAdmin,
  criarEquipmentSetAdmin,
  duplicarEquipmentSetAdmin,
  listarEfeitosEquipmentSetAdmin,
  listarEquipmentSetsAdmin,
  mensagemDeErroAdmin,
  previewEquipmentSetAdmin,
  removerBonusEquipmentSetAdmin,
  removerPecaEquipmentSetAdmin,
  type EquipmentSetApi,
} from "@/lib/api/admin";

const ATRIBUTOS_STAT = ["forca", "vitalidade", "agilidade", "inteligencia", "velocidade", "defesa"] as const;

function DetalheSet({ set, efeitos, onFechar, onMudou }: { set: EquipmentSetApi; efeitos: string[]; onFechar: () => void; onMudou: () => void }) {
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [nome, setNome] = useState(set.nome);
  const [descricao, setDescricao] = useState(set.descricao ?? "");
  const [imagemUrl, setImagemUrl] = useState(set.imagem_url ?? "");
  const [salvandoInfo, setSalvandoInfo] = useState(false);

  const [novoItemId, setNovoItemId] = useState("");
  const [novaPieceKey, setNovaPieceKey] = useState("");
  const [adicionandoPeca, setAdicionandoPeca] = useState(false);

  const [novoThreshold, setNovoThreshold] = useState(set.pecas?.length ?? 1);
  const [novosStats, setNovosStats] = useState<Record<string, string>>({});
  const [novoEffectKey, setNovoEffectKey] = useState("");
  const [novaDescricaoBonus, setNovaDescricaoBonus] = useState("");
  const [adicionandoBonus, setAdicionandoBonus] = useState(false);

  const [pecasPreview, setPecasPreview] = useState(set.pecas?.length ?? 0);
  const [previewResultado, setPreviewResultado] = useState<{ bonuses: { pieces_required: number; ativo: boolean; stats: Record<string, number>; effect_key: string | null; descricao: string | null }[] } | null>(null);

  async function salvarInfo(evento: React.FormEvent) {
    evento.preventDefault();
    setSalvandoInfo(true);
    setErro("");
    try {
      await atualizarEquipmentSetAdmin(set.id, { nome, descricao, imagem_url: imagemUrl });
      setMensagem("Informações salvas.");
      onMudou();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar."));
    } finally {
      setSalvandoInfo(false);
    }
  }

  async function alternarAtivo() {
    setErro("");
    try {
      await atualizarEquipmentSetAdmin(set.id, { ativo: !set.ativo });
      onMudou();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível mudar o status."));
    }
  }

  async function adicionarPeca(evento: React.FormEvent) {
    evento.preventDefault();
    setAdicionandoPeca(true);
    setErro("");
    try {
      await adicionarPecaEquipmentSetAdmin(set.id, { item_id: Number(novoItemId), piece_key: novaPieceKey });
      setNovoItemId("");
      setNovaPieceKey("");
      onMudou();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível adicionar a peça."));
    } finally {
      setAdicionandoPeca(false);
    }
  }

  async function removerPeca(idPeca: number) {
    setErro("");
    try {
      await removerPecaEquipmentSetAdmin(idPeca);
      onMudou();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível remover a peça."));
    }
  }

  async function adicionarBonus(evento: React.FormEvent) {
    evento.preventDefault();
    setAdicionandoBonus(true);
    setErro("");
    try {
      const stats: Record<string, number> = {};
      for (const [chave, valor] of Object.entries(novosStats)) {
        if (valor.trim() !== "") stats[chave] = Number(valor);
      }
      await adicionarBonusEquipmentSetAdmin(set.id, {
        pieces_required: novoThreshold,
        stats,
        effect_key: novoEffectKey || null,
        descricao: novaDescricaoBonus || null,
      });
      setNovosStats({});
      setNovoEffectKey("");
      setNovaDescricaoBonus("");
      onMudou();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível adicionar o bônus."));
    } finally {
      setAdicionandoBonus(false);
    }
  }

  async function removerBonus(idBonus: number) {
    setErro("");
    try {
      await removerBonusEquipmentSetAdmin(idBonus);
      onMudou();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível remover o bônus."));
    }
  }

  async function simular() {
    setErro("");
    try {
      const resultado = await previewEquipmentSetAdmin(set.id, pecasPreview);
      setPreviewResultado(resultado);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível simular."));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onFechar}>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-4 overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <p className="font-imFeel text-2xl text-[#F3B43F]">{set.nome}</p>
          <button type="button" onClick={onFechar} className="text-white/60 hover:text-white">
            ✕
          </button>
        </div>
        {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}
        {mensagem && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-[#F3B43F]">{mensagem}</p>}

        <form onSubmit={salvarInfo} className="flex flex-col gap-2 rounded-xl border border-white/10 p-3">
          <p className="text-xs font-bold uppercase text-[#F3B43F]/80">Informações</p>
          <input value={nome} onChange={(e) => setNome(e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" placeholder="Nome" />
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" placeholder="Descrição" />
          <input value={imagemUrl} onChange={(e) => setImagemUrl(e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" placeholder="Imagem (URL)" />
          <div className="flex justify-between">
            <button type="button" onClick={alternarAtivo} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${set.ativo ? "bg-red-600/80 text-white" : "bg-green-600/80 text-white"}`}>
              {set.ativo ? "Despublicar (voltar a rascunho)" : "Publicar"}
            </button>
            <button type="submit" disabled={salvandoInfo} className="rounded-lg bg-[#BC8418] px-4 py-1.5 text-xs font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
              {salvandoInfo ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-2 rounded-xl border border-white/10 p-3">
          <p className="text-xs font-bold uppercase text-[#F3B43F]/80">Peças ({set.pecas?.length ?? 0})</p>
          {(set.pecas ?? []).map((peca) => (
            <div key={peca.id} className="flex items-center justify-between rounded-lg bg-black/20 px-2 py-1 text-sm">
              <span>
                {peca.item?.nome ?? `Item #${peca.item_id}`} <span className="text-white/40">({peca.piece_key})</span>
              </span>
              <button type="button" onClick={() => removerPeca(peca.id)} className="text-xs text-red-400 hover:underline">
                Remover
              </button>
            </div>
          ))}
          <form onSubmit={adicionarPeca} className="flex flex-wrap items-end gap-2 pt-1">
            <label className="flex flex-col gap-1 text-[10px] text-white/60">
              ID do item
              <input required type="number" value={novoItemId} onChange={(e) => setNovoItemId(e.target.value)} className="w-24 rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-[10px] text-white/60">
              piece_key
              <input required value={novaPieceKey} onChange={(e) => setNovaPieceKey(e.target.value)} placeholder="ex: elmo" className="rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm" />
            </label>
            <button type="submit" disabled={adicionandoPeca} className="rounded-lg bg-[#BC8418] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
              + Peça
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-white/10 p-3">
          <p className="text-xs font-bold uppercase text-[#F3B43F]/80">Bônus por quantidade de peças</p>
          {(set.bonuses ?? [])
            .sort((a, b) => a.pieces_required - b.pieces_required)
            .map((bonus) => (
              <div key={bonus.id} className="flex items-center justify-between rounded-lg bg-black/20 px-2 py-1 text-sm">
                <span>
                  {bonus.pieces_required} peças: {Object.entries(bonus.stats).map(([k, v]) => `${k} +${v}`).join(", ") || "sem stats"}
                  {bonus.effect_key ? ` · ${bonus.effect_key}` : ""}
                </span>
                <button type="button" onClick={() => removerBonus(bonus.id)} className="text-xs text-red-400 hover:underline">
                  Remover
                </button>
              </div>
            ))}
          <form onSubmit={adicionarBonus} className="flex flex-col gap-2 pt-1">
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1 text-[10px] text-white/60">
                Nº de peças
                <input type="number" min={1} value={novoThreshold} onChange={(e) => setNovoThreshold(Number(e.target.value))} className="w-20 rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-[10px] text-white/60">
                Efeito especial
                <select value={novoEffectKey} onChange={(e) => setNovoEffectKey(e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm">
                  <option value="">Nenhum</option>
                  {efeitos.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {ATRIBUTOS_STAT.map((attr) => (
                <label key={attr} className="flex flex-col gap-1 text-[10px] text-white/60">
                  {attr}
                  <input
                    type="number"
                    value={novosStats[attr] ?? ""}
                    onChange={(e) => setNovosStats((s) => ({ ...s, [attr]: e.target.value }))}
                    className="rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm"
                  />
                </label>
              ))}
            </div>
            <input value={novaDescricaoBonus} onChange={(e) => setNovaDescricaoBonus(e.target.value)} placeholder="Descrição do bônus (opcional)" className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            <button type="submit" disabled={adicionandoBonus} className="self-start rounded-lg bg-[#BC8418] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
              + Bônus
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-white/10 p-3">
          <p className="text-xs font-bold uppercase text-[#F3B43F]/80">Simular (preview server-side)</p>
          <div className="flex items-end gap-2">
            <label className="flex flex-col gap-1 text-[10px] text-white/60">
              Peças equipadas
              <input type="number" min={0} value={pecasPreview} onChange={(e) => setPecasPreview(Number(e.target.value))} className="w-24 rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm" />
            </label>
            <button type="button" onClick={simular} className="rounded-lg border border-[#F3B43F]/50 px-3 py-1.5 text-xs font-bold text-[#F3B43F] hover:bg-[#F3B43F]/10">
              Simular
            </button>
          </div>
          {previewResultado && (
            <div className="flex flex-col gap-1 text-sm">
              {previewResultado.bonuses.map((b) => (
                <p key={b.pieces_required} className={b.ativo ? "text-green-400" : "text-white/40"}>
                  {b.pieces_required} peças: {b.ativo ? "ATIVO" : "inativo"} — {Object.entries(b.stats).map(([k, v]) => `${k} +${v}`).join(", ") || "sem stats"}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminEquipmentSetsClient() {
  const [sets, setSets] = useState<EquipmentSetApi[]>([]);
  const [efeitos, setEfeitos] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [detalheId, setDetalheId] = useState<number | null>(null);
  const [mostrarCriacao, setMostrarCriacao] = useState(false);
  const [novaKey, setNovaKey] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [criando, setCriando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [s, e] = await Promise.all([listarEquipmentSetsAdmin(), listarEfeitosEquipmentSetAdmin()]);
      setSets(s);
      setEfeitos(e);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar os conjuntos."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function criar(evento: React.FormEvent) {
    evento.preventDefault();
    setCriando(true);
    setErro("");
    try {
      const novo = await criarEquipmentSetAdmin({ key: novaKey, nome: novoNome });
      setMostrarCriacao(false);
      setNovaKey("");
      setNovoNome("");
      await carregar();
      setDetalheId(novo.id);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível criar o conjunto."));
    } finally {
      setCriando(false);
    }
  }

  async function duplicar(id: number) {
    setErro("");
    try {
      await duplicarEquipmentSetAdmin(id);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível duplicar o conjunto."));
    }
  }

  const setDetalhe = sets.find((s) => s.id === detalheId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
            ← Painel Administrativo
          </Link>
          <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Conjuntos de Equipamentos</h1>
        </div>
        <button type="button" onClick={() => setMostrarCriacao(true)} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f]">
          + Novo conjunto
        </button>
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {sets.map((set) => (
            <div key={set.id} className={`flex flex-col gap-1 rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4 text-white ${!set.ativo ? "opacity-70" : ""}`}>
              <div className="flex items-center justify-between">
                <p className="font-imFeel text-lg text-[#F3B43F]">{set.nome}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${set.ativo ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/60"}`}>
                  {set.ativo ? "Publicado" : "Rascunho"}
                </span>
              </div>
              <p className="text-xs text-white/50">
                {set.pecas?.length ?? 0} peça(s) · {set.bonuses?.length ?? 0} bônus
              </p>
              <div className="mt-2 flex gap-2 text-sm">
                <button type="button" onClick={() => setDetalheId(set.id)} className="text-[#F3B43F] hover:underline">
                  Gerenciar
                </button>
                <button type="button" onClick={() => duplicar(set.id)} className="text-white/70 hover:underline">
                  Duplicar
                </button>
              </div>
            </div>
          ))}
          {sets.length === 0 && <p className="text-sm text-white/50">Nenhum conjunto cadastrado ainda.</p>}
        </div>
      )}

      {mostrarCriacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMostrarCriacao(false)}>
          <form onSubmit={criar} onClick={(e) => e.stopPropagation()} className="flex w-full max-w-md flex-col gap-3 rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
            <p className="font-imFeel text-xl text-[#F3B43F]">Novo conjunto</p>
            <label className="flex flex-col gap-1 text-xs">
              Key (identificador único)
              <input required value={novaKey} onChange={(e) => setNovaKey(e.target.value)} placeholder="ex: manto_do_caçador" className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Nome
              <input required value={novoNome} onChange={(e) => setNovoNome(e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
            </label>
            <p className="text-[11px] text-white/50">Nasce como rascunho — adicione peças e bônus antes de publicar.</p>
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

      {setDetalhe && (
        <DetalheSet
          set={setDetalhe}
          efeitos={efeitos}
          onFechar={() => setDetalheId(null)}
          onMudou={carregar}
        />
      )}
    </div>
  );
}
