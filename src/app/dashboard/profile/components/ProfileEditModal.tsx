"use client";

// Editar frase/título/conquistas em destaque — só no próprio perfil
// (Especificação Perfil de Jogador §28/§40/§43). Destaque de criaturas
// favoritas (§29) já funciona na API (atualizarPerfilProprio aceita
// monstros_destaque), mas o seletor visual fica pra uma v1.1 — não dá
// pra listar "criaturas já descobertas" sem um endpoint novo de
// Bestiário, que não foi criado nesta rodada (ver relatório final).
import { useState } from "react";
import {
  atualizarPerfilProprio,
  type PerfilJogador,
} from "@/lib/api/profile";

const LIMITE_FRASE = 140;

export default function ProfileEditModal({
  perfil,
  onFechar,
  onSalvo,
}: {
  perfil: PerfilJogador;
  onFechar: () => void;
  onSalvo: (perfil: PerfilJogador) => void;
}) {
  const [frase, setFrase] = useState(perfil.identity.frase ?? "");
  const [tituloSelecionado, setTituloSelecionado] = useState<number | "">(
    perfil.titulos_disponiveis?.find((t) => t.nome === perfil.identity.titulo)?.id ?? "",
  );
  const [conquistasDestaque, setConquistasDestaque] = useState<number[]>(
    perfil.highlights.conquistas.map((c) => c.id_achievement),
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  function alternarConquista(idAchievement: number) {
    setConquistasDestaque((atual) => {
      if (atual.includes(idAchievement)) return atual.filter((id) => id !== idAchievement);
      if (atual.length >= 3) return atual;
      return [...atual, idAchievement];
    });
  }

  async function salvar() {
    setSalvando(true);
    setErro("");
    try {
      const atualizado = await atualizarPerfilProprio({
        frase: frase.trim() === "" ? null : frase.trim(),
        id_titulo_selecionado: tituloSelecionado === "" ? null : tituloSelecionado,
        conquistas_destaque: conquistasDestaque,
      });
      onSalvo(atualizado);
      onFechar();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Não foi possível salvar o perfil.";
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl">
        <p className="mb-4 font-imFeel text-2xl text-[#F3B43F]">Editar Perfil</p>

        {erro && <p className="mb-3 rounded-lg bg-red-500/20 p-2 text-sm text-red-300">{erro}</p>}

        <label className="mb-1 block text-xs uppercase tracking-widest text-[#F3B43F]/80">Frase de perfil</label>
        <textarea
          value={frase}
          onChange={(e) => setFrase(e.target.value.slice(0, LIMITE_FRASE))}
          rows={2}
          className="mb-1 w-full rounded-lg border border-[#F3B43F]/40 bg-black/30 p-2 text-sm text-white"
          placeholder="Até os deuses sangram."
        />
        <p className="mb-3 text-right text-[10px] text-white/40">{frase.length} / {LIMITE_FRASE}</p>

        {perfil.titulos_disponiveis && perfil.titulos_disponiveis.length > 0 && (
          <>
            <label className="mb-1 block text-xs uppercase tracking-widest text-[#F3B43F]/80">Título</label>
            <select
              value={tituloSelecionado}
              onChange={(e) => setTituloSelecionado(e.target.value === "" ? "" : Number(e.target.value))}
              className="mb-3 w-full rounded-lg border border-[#F3B43F]/40 bg-black/30 p-2 text-sm text-white"
            >
              <option value="">Nenhum</option>
              {perfil.titulos_disponiveis.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </>
        )}

        {perfil.achievements.lista.length > 0 && (
          <>
            <label className="mb-1 block text-xs uppercase tracking-widest text-[#F3B43F]/80">
              Conquistas em destaque (até 3)
            </label>
            <div className="mb-3 flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-2">
              {perfil.achievements.lista.map((c) => (
                <label key={c.id_achievement} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={conquistasDestaque.includes(c.id_achievement)}
                    onChange={() => alternarConquista(c.id_achievement)}
                    disabled={!conquistasDestaque.includes(c.id_achievement) && conquistasDestaque.length >= 3}
                  />
                  {c.nome}
                </label>
              ))}
            </div>
          </>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg border-2 border-white/20 px-4 py-1.5 text-sm font-bold text-white/70 hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="rounded-lg bg-[#F3B43F] px-4 py-1.5 text-sm font-bold text-black hover:bg-[#e0a52f] disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
