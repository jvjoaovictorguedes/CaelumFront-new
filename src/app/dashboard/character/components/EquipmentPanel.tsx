"use client";

import { useEffect, useState, useCallback } from "react";
import axiosInstance from "@/utils/axiosIntance";

type Slot =
  | "Cabeca"
  | "Torso"
  | "Maos"
  | "Pes"
  | "ArmaPrincipal"
  | "ArmaSecundaria"
  | "Acessorio1"
  | "Acessorio2";

const SLOTS: { slot: Slot; label: string }[] = [
  { slot: "Cabeca", label: "Cabeça" },
  { slot: "Torso", label: "Torso" },
  { slot: "Maos", label: "Mãos" },
  { slot: "Pes", label: "Pés" },
  { slot: "ArmaPrincipal", label: "Arma Principal" },
  { slot: "ArmaSecundaria", label: "Arma Secundária" },
  { slot: "Acessorio1", label: "Acessório 1" },
  { slot: "Acessorio2", label: "Acessório 2" },
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
}: {
  characterId: number;
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

  const itensEquipaveis = inventario.filter((entrada) =>
    TIPOS_EQUIPAVEIS.includes(entrada.Item?.tipo_item),
  );

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

      {/*
        Sem imagem de personagem por enquanto: os slots ficam num grid
        simples. Quando tiver a arte, essa div vira o fundo (bg-cover) e
        cada slot recebe posição absoluta em cima da silhueta.
      */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SLOTS.map(({ slot, label }) => {
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
              className={`flex min-h-[92px] flex-col items-center justify-center gap-1 rounded-xl border-2 p-2 text-center transition-colors ${
                emFoco
                  ? "border-[#F3B43F] bg-[#3a2f24]"
                  : itemNoSlot
                    ? "border-[#F3B43F]/70 bg-[#3a2f24]/70"
                    : "border-dashed border-white/25 bg-black/20"
              }`}
            >
              <span className="text-[10px] uppercase tracking-wide text-white/50">
                {label}
              </span>
              {itemNoSlot ? (
                <>
                  <span className="text-sm font-bold text-[#F3B43F]">
                    {itemNoSlot.nome}
                  </span>
                  <button
                    type="button"
                    onClick={() => desequipar(slot)}
                    disabled={processando}
                    className="text-[10px] text-white/60 underline hover:text-white disabled:opacity-50"
                  >
                    desequipar
                  </button>
                </>
              ) : (
                <span className="text-xs text-white/40">Vazio</span>
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
          Você não tem nenhum item equipável no inventário.
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
                {entrada.Item.tipo_item} · x{entrada.quantidade}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
