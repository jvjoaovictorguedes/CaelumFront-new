"use client";

import type { PayloadTempleEventoAdmin } from "@/lib/api/admin";
import { CARD, INPUT, LABEL } from "./styles";

export default function TempleIdentityTab({
  form,
  setForm,
  editavel,
}: {
  form: PayloadTempleEventoAdmin;
  setForm: (f: PayloadTempleEventoAdmin) => void;
  editavel: boolean;
}) {
  return (
    <div className={CARD}>
      {!editavel && (
        <p className="mb-3 text-xs text-red-300">
          Esta Convergência já está Ativa ou além — o catálogo está congelado e não pode mais ser editado.
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={LABEL}>
          Key (identificador estável, minúsculas/números/underscore)
          <input
            disabled={!editavel}
            value={form.key ?? ""}
            onChange={(e) => setForm({ ...form, key: e.target.value })}
            className={`${INPUT} disabled:opacity-50`}
            placeholder="templo_veu_celestial_2026_01"
          />
        </label>
        <label className={LABEL}>
          Nome de exibição
          <input
            disabled={!editavel}
            value={form.nome ?? ""}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className={`${INPUT} disabled:opacity-50`}
          />
        </label>
      </div>
      <label className={`${LABEL} mt-3`}>
        Teaser (frase curta de anúncio)
        <input
          disabled={!editavel}
          value={form.teaser ?? ""}
          onChange={(e) => setForm({ ...form, teaser: e.target.value })}
          className={`${INPUT} disabled:opacity-50`}
        />
      </label>
      <label className={`${LABEL} mt-3`}>
        Lore
        <textarea
          disabled={!editavel}
          value={form.lore ?? ""}
          onChange={(e) => setForm({ ...form, lore: e.target.value })}
          rows={4}
          className={`${INPUT} disabled:opacity-50`}
        />
      </label>
      <label className={`${LABEL} mt-3`}>
        Imagem (URL)
        <input
          disabled={!editavel}
          value={form.imagem_url ?? ""}
          onChange={(e) => setForm({ ...form, imagem_url: e.target.value })}
          className={`${INPUT} disabled:opacity-50`}
        />
      </label>
    </div>
  );
}
