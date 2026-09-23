"use client";

// Boneco de papel READ-ONLY (Especificação Perfil de Jogador §12) — só
// itens equipados, nunca o inventário. Nunca reutilizar a versão do
// Inventário que tem ações de equipar/desequipar.
import { resolveMediaUrl } from "@/utils/media-url";
import type { PerfilEquipamento } from "@/lib/api/profile";

const BORDA_RARIDADE: Record<string, string> = {
  comum: "border-[#9CA3AF]/80",
  incomum: "border-[#4ADE80]/80",
  raro: "border-[#60A5FA]/80",
  epico: "border-[#C084FC]/80",
  lendario: "border-[#FB923C]/80",
  mitico: "border-[#F87171]/80",
};

function bordaPorRaridade(raridade: string) {
  return BORDA_RARIDADE[raridade?.toLowerCase()] ?? BORDA_RARIDADE.comum;
}

export default function PublicEquipmentPanel({ equipment }: { equipment: PerfilEquipamento[] }) {
  if (equipment.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-6 text-center text-sm text-white/60">
        Nenhum equipamento equipado.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-4 text-white shadow-lg">
      <p className="mb-3 text-xs uppercase tracking-widest text-[#F3B43F]">Equipamentos</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {equipment.map((item) => {
          const src = resolveMediaUrl(item.imagem_url);
          return (
            <div
              key={item.slot}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 bg-[#3a2f24] p-2 text-center ${bordaPorRaridade(item.raridade)}`}
              title={`${item.nome} — Tier ${item.tier_equipamento ?? "?"} • ${item.raridade} • +${item.refinamento}`}
            >
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-black/30">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={item.nome} className="h-full w-full object-contain" />
                ) : (
                  <span className="text-lg font-bold text-[#F3B43F]/80">{item.nome.charAt(0)}</span>
                )}
              </div>
              <p className="w-full truncate text-[11px] font-bold">{item.nome}</p>
              <p className="text-[10px] text-white/50">
                {item.tier_equipamento ? `Tier ${item.tier_equipamento}` : item.raridade}
                {item.refinamento > 0 && ` • +${item.refinamento}`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
