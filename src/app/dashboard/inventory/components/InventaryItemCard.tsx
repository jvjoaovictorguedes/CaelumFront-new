"use client";

import { useState } from "react";
import axiosInstance from "@/utils/axiosIntance";

interface InventoryEntry {
  id_personagem_inventario: number;
  quantidade: number;
  equipado: boolean;
  Item: {
    id: number;
    nome: string;
    tipo_item: string;
    raridade: string;
    peso: number;
  };
}

interface UseItemResponse {
  data?: {
    character?: { vida_atual?: number; mana_atual?: number };
    quantidadeRestante?: number;
  };
  message?: string;
}

interface UseItemError {
  response?: { status?: number; data?: { message?: string } };
  message?: string;
}

const CORES_RARIDADE: Record<string, string> = {
  Comum: "text-gray-700",
  Incomum: "text-green-600",
  Raro: "text-blue-600",
  Epico: "text-purple-600",
  Lendario: "text-orange-600",
  Mitico: "text-red-600",
};

export default function InventoryItemCard({
  entrada,
  characterId,
}: {
  entrada: InventoryEntry;
  characterId: number;
}) {
  const [quantidade, setQuantidade] = useState(entrada.quantidade);
  const [isUsing, setIsUsing] = useState(false);
  const [message, setMessage] = useState("");

  const isConsumivel = entrada.Item?.tipo_item === "Consumivel";

  async function usarItem() {
    if (isUsing || quantidade <= 0) return;

    setIsUsing(true);
    setMessage("");
    try {
      const response = await axiosInstance.post<UseItemResponse>(
        "/character-inventory/use",
        {
          id_personagem: characterId,
          id_item: entrada.Item.id,
          quantidade: 1,
        },
      );

      const restante =
        response.data?.data?.quantidadeRestante ?? Math.max(0, quantidade - 1);
      setQuantidade(restante);
      setMessage("Item usado com sucesso!");
    } catch (error: unknown) {
      console.error("Erro ao usar item:", error);
      const apiMessage = (error as UseItemError).response?.data?.message;
      const errorMessage = (error as UseItemError).message;
      setMessage(apiMessage ?? errorMessage ?? "Não foi possível usar o item.");
    } finally {
      setIsUsing(false);
    }
  }

  // Item foi totalmente consumido: some da lista.
  if (quantidade <= 0) return null;

  return (
    <div className="flex flex-col rounded-xl border border-[#F3B43F]/60 bg-[#292018]/85 p-4 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-imFeel text-xl">
            {entrada.Item?.nome ?? "Item desconhecido"}
          </p>
          <p
            className={`text-sm font-bold ${
              CORES_RARIDADE[entrada.Item?.raridade] ?? "text-[#F3B43F]"
            }`}
          >
            {entrada.Item?.raridade ?? "Comum"} ·{" "}
            {entrada.Item?.tipo_item ?? "Item"}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold">x{quantidade}</p>
          {entrada.equipado && (
            <p className="text-xs font-bold text-green-700">Equipado</p>
          )}
        </div>
      </div>

      {isConsumivel && (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/15 pt-3">
          <button
            type="button"
            onClick={usarItem}
            disabled={isUsing}
            className="rounded-lg bg-[#F3B43F] px-3 py-1.5 text-sm font-bold text-[#292018] transition hover:bg-[#ffd477] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUsing ? "Usando..." : "Usar"}
          </button>
          {message && (
            <p className="text-xs text-white/70 text-right">{message}</p>
          )}
        </div>
      )}
    </div>
  );
}
