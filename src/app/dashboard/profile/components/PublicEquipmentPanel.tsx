"use client";

// Mesmo boneco de papel de "Meu Personagem > Equipamentos", só leitura:
// só itens equipados, sem ações de equipar/desequipar.
import BonecoDePapel, { mapaVazioDeSlots, type ItemEquipado } from "@/components/equipment/BonecoDePapel";
import type { PerfilEquipamento } from "@/lib/api/profile";

export default function PublicEquipmentPanel({
  equipment,
  classe,
  oculto,
}: {
  equipment: PerfilEquipamento[];
  classe: string | null;
  oculto: boolean;
}) {
  if (oculto) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-6 text-center text-sm text-white/60">
        Este aventureiro preferiu manter os equipamentos em segredo.
      </div>
    );
  }

  const equipados = mapaVazioDeSlots<ItemEquipado>();
  for (const item of equipment) equipados[item.slot] = item;

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      <p className="mb-4 text-sm uppercase tracking-widest text-[#F3B43F]">Equipamentos</p>
      <BonecoDePapel classe={classe} equipados={equipados} />
      {equipment.length === 0 && (
        <p className="text-center text-sm text-white/60">Nenhum equipamento equipado.</p>
      )}
    </div>
  );
}
