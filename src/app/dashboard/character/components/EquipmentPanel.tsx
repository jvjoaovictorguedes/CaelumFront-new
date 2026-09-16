"use client";

import { useEffect, useState, useCallback } from "react";
import axiosInstance from "@/utils/axiosIntance";
import ClassSilhouette from "./ClassSilhouette";

type Slot =
  | "Cabeca"
  | "Torso"
  | "Maos"
  | "Pes"
  | "ArmaPrincipal"
  | "ArmaSecundaria"
  | "Acessorio1"
  | "Acessorio2";

// Posição de cada slot em cima do retrato do personagem (% do box da
// imagem), calibrada pelas duas ilustrações reais (guerreiro-lutador.jpg/
// mago-lutador.jpg): cabeça no topo, mão da arma sempre do lado esquerdo
// de quem olha (onde as duas artes seguram espada/cajado), a outra mão
// (escudo/orbe) do lado direito, pés embaixo. Não é um encaixe pixel a
// pixel — é o mesmo tipo de "boneco de papel" do mockup do Figma, só que
// com badge + nome em vez de peça de armadura recortada.
const SLOTS: { slot: Slot; label: string; top: string; left: string }[] = [
  { slot: "Cabeca", label: "Cabeça", top: "8%", left: "50%" },
  { slot: "Acessorio1", label: "Acessório 1", top: "20%", left: "28%" },
  { slot: "Acessorio2", label: "Acessório 2", top: "20%", left: "72%" },
  { slot: "Torso", label: "Torso", top: "34%", left: "50%" },
  { slot: "ArmaPrincipal", label: "Arma Principal", top: "52%", left: "20%" },
  { slot: "ArmaSecundaria", label: "Arma Secundária", top: "48%", left: "80%" },
  { slot: "Maos", label: "Mãos", top: "63%", left: "50%" },
  { slot: "Pes", label: "Pés", top: "92%", left: "50%" },
];

// Tipos de item que fazem sentido arrastar pra um slot. Consumível,
// Material, QuestItem e Moeda não são equipáveis.
const TIPOS_EQUIPAVEIS = [
  "Armadura",
  "Capacete",
  "Escudo",
  "Arma",
  "Acessorio1",
  "Acessorio2",
];

interface ItemInfo {
  id: number;
  nome: string;
  tipo_item: string;
  raridade: string;
}

interface EquipamentoApi {
  id_personagem: number;
  slot: Slot;
  id_item: number;
  item: ItemInfo;
}

interface InventarioEntry {
  id_personagem_inventario: number;
  quantidade: number;
  Item: ItemInfo;
}

export default function EquipmentPanel({
  characterId,
  classe,
}: {
  characterId: number;
  classe?: string;
}) {
  const [equipamentos, setEquipamentos] = useState<
    Record<Slot, ItemInfo | null>
  >({
    Cabeca: null,
    Torso: null,
    Maos: null,
    Pes: null,
    ArmaPrincipal: null,
    ArmaSecundaria: null,
    Acessorio1: null,
    Acessorio2: null,
  });
  const [inventario, setInventario] = useState<InventarioEntry[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [slotSobre, setSlotSobre] = useState<Slot | null>(null);
  const [processando, setProcessando] = useState(false);

  const carregarTudo = useCallback(async () => {
    try {
      const [respEquip, respInv] = await Promise.all([
        axiosInstance.get<{ data?: { equipamentos?: EquipamentoApi[] } }>(
          `/character-equipment/${characterId}`,
        ),
        axiosInstance.get<{ data?: { inventory?: InventarioEntry[] } }>(
          "/character-inventory",
          { params: { characterId } },
        ),
      ]);

      const mapaEquipado: Record<Slot, ItemInfo | null> = {
        Cabeca: null,
        Torso: null,
        Maos: null,
        Pes: null,
        ArmaPrincipal: null,
        ArmaSecundaria: null,
        Acessorio1: null,
        Acessorio2: null,
      };
      for (const linha of respEquip.data?.data?.equipamentos ?? []) {
        mapaEquipado[linha.slot] = linha.item;
      }
      setEquipamentos(mapaEquipado);
      setInventario(respInv.data?.data?.inventory ?? []);
    } catch (error) {
      console.error("Erro ao carregar equipamento/inventário:", error);
      setMensagem("Não foi possível carregar seu equipamento.");
    } finally {
      setCarregando(false);
    }
  }, [characterId]);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  async function equipar(slot: Slot, idItem: number) {
    setProcessando(true);
    setMensagem("");
    try {
      await axiosInstance.post("/character-equipment/equip", {
        id_personagem: characterId,
        slot,
        id_item: idItem,
      });
      await carregarTudo();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Não foi possível equipar esse item.";
      setMensagem(msg);
    } finally {
      setProcessando(false);
    }
  }

  async function desequipar(slot: Slot) {
    setProcessando(true);
    setMensagem("");
    try {
      await axiosInstance.delete("/character-equipment/unequip", {
        data: { id_personagem: characterId, slot },
      });
      await carregarTudo();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Não foi possível desequipar esse item.";
      setMensagem(msg);
    } finally {
      setProcessando(false);
    }
  }

  function handleDrop(slot: Slot, event: React.DragEvent) {
    event.preventDefault();
    setSlotSobre(null);
    const idItem = Number(event.dataTransfer.getData("text/id-item"));
    if (!idItem || processando) return;
    equipar(slot, idItem);
  }

  // Quantas cópias de cada item já estão presas em algum slot — pra tirar
  // da lista de arrastar exatamente a quantidade já em uso. Sem isso dava
  // pra arrastar a mesma espada de novo pra outro slot mesmo já estando
  // equipada (o back agora bloqueia, mas a lista continuava mostrando o
  // item como "livre" do mesmo jeito).
  const equipadoPorItem = new Map<number, number>();
  for (const item of Object.values(equipamentos)) {
    if (item) equipadoPorItem.set(item.id, (equipadoPorItem.get(item.id) ?? 0) + 1);
  }

  const itensEquipaveis = inventario
    .filter((entrada) => TIPOS_EQUIPAVEIS.includes(entrada.Item?.tipo_item))
    .map((entrada) => ({
      ...entrada,
      disponivel: entrada.quantidade - (equipadoPorItem.get(entrada.Item.id) ?? 0),
    }))
    .filter((entrada) => entrada.disponivel > 0);

  if (carregando) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        Carregando equipamento...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      <p className="mb-4 text-sm uppercase tracking-widest text-[#F3B43F]">
        Equipamentos
      </p>

      <div className="relative mx-auto mb-5 aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[#3a2f24]">
        <ClassSilhouette classe={classe} />
        {SLOTS.map(({ slot, label, top, left }) => {
          const itemNoSlot = equipamentos[slot];
          const emFoco = slotSobre === slot;
          return (
            <div
              key={slot}
              onDragOver={(e) => {
                e.preventDefault();
                setSlotSobre(slot);
              }}
              onDragLeave={() => setSlotSobre((atual) => (atual === slot ? null : atual))}
              onDrop={(e) => handleDrop(slot, e)}
              style={{ top, left }}
              className={`absolute flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 rounded-lg border-2 px-1.5 py-1 text-center backdrop-blur-sm transition-colors ${
                emFoco
                  ? "border-[#F3B43F] bg-[#3a2f24]/90"
                  : itemNoSlot
                    ? "border-[#F3B43F]/70 bg-[#1c150f]/80"
                    : "border-dashed border-white/40 bg-black/40"
              }`}
            >
              <span className="text-[9px] uppercase tracking-wide text-white/60">
                {label}
              </span>
              {itemNoSlot ? (
                <>
                  <span className="text-xs font-bold leading-tight text-[#F3B43F]">
                    {itemNoSlot.nome}
                  </span>
                  <button
                    type="button"
                    onClick={() => desequipar(slot)}
                    disabled={processando}
                    className="text-[9px] text-white/60 underline hover:text-white disabled:opacity-50"
                  >
                    desequipar
                  </button>
                </>
              ) : (
                <span className="text-[10px] text-white/40">Vazio</span>
              )}
            </div>
          );
        })}
      </div>

      {mensagem && (
        <p className="mb-3 text-sm text-red-400">{mensagem}</p>
      )}

      <p className="mb-2 text-sm uppercase tracking-widest text-[#F3B43F]">
        Seu inventário (arraste pra um slot acima)
      </p>
      {itensEquipaveis.length === 0 ? (
        <p className="text-sm text-white/60">
          Você não tem nenhum item equipável disponível no inventário.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {itensEquipaveis.map((entrada) => (
            <div
              key={entrada.id_personagem_inventario}
              draggable
              onDragStart={(e) =>
                e.dataTransfer.setData(
                  "text/id-item",
                  String(entrada.Item.id),
                )
              }
              className="cursor-grab select-none rounded-lg border-2 border-[#F3B43F]/60 bg-[#3a2f24] px-3 py-2 text-center active:cursor-grabbing"
              title={`${entrada.Item.nome} (${entrada.Item.tipo_item})`}
            >
              <p className="text-sm font-bold text-white">
                {entrada.Item.nome}
              </p>
              <p className="text-[10px] text-white/50">
                {entrada.Item.tipo_item} · x{entrada.disponivel}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
