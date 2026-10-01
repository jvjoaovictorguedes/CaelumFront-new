"use client";

// Ameaça Mundial V2 §13.2 — aba "Identidade": só o essencial de
// apresentação. Atributos de combate moraram pra WorldBossAttributesTab,
// mensagens/zonas de descoberta pra WorldBossDiscoveryTab.
import type { Dispatch, SetStateAction } from "react";
import type { PayloadWorldBossConfigAdmin } from "@/lib/api/admin";
import { INPUT, LABEL } from "./styles";

export default function WorldBossIdentityTab({
  form,
  setForm,
  editando,
}: {
  form: PayloadWorldBossConfigAdmin;
  setForm: Dispatch<SetStateAction<PayloadWorldBossConfigAdmin>>;
  editando: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className={LABEL}>
        Nome
        <input required value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className={INPUT} />
      </label>
      <label className={LABEL}>
        Descrição
        <textarea required rows={2} value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} className={INPUT} />
      </label>
      <label className={LABEL}>
        Lore (opcional)
        <textarea rows={3} value={form.lore ?? ""} onChange={(e) => setForm((f) => ({ ...f, lore: e.target.value }))} className={INPUT} />
      </label>
      <label className={LABEL}>
        URL da imagem do monstro (opcional)
        <input value={form.imagem_url ?? ""} onChange={(e) => setForm((f) => ({ ...f, imagem_url: e.target.value }))} className={INPUT} />
      </label>
      <label className={LABEL}>
        URL do fundo de batalha (opcional)
        {/* Cena de combate (WorldBossBattleScene.tsx) — sem isso, cai
            pro fallback de usar a própria imagem do monstro borrada
            como fundo. Mesmo fluxo de qualquer outra imagem do painel:
            enviar em Mídia (categoria "Monster") e colar a URL aqui. */}
        <input value={form.fundo_url ?? ""} onChange={(e) => setForm((f) => ({ ...f, fundo_url: e.target.value }))} className={INPUT} />
      </label>
      <label className={LABEL}>
        Peso de seleção (concorrência com outras Ameaças ativas no sorteio de qual Boss aparece)
        <input
          type="number"
          min={1}
          value={form.peso_selecao ?? 1}
          onChange={(e) => setForm((f) => ({ ...f, peso_selecao: Number(e.target.value) }))}
          className={`${INPUT} max-w-[10rem]`}
        />
      </label>
      {editando && (
        <label className="flex items-center gap-2 text-sm text-white/80">
          <input type="checkbox" checked={form.ativo ?? true} onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))} />
          Ativo (elegível pro sorteio de ciclo)
        </label>
      )}
    </div>
  );
}
