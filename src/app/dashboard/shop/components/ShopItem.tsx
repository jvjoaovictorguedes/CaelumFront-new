"use client";

import { useState } from "react";
import axiosInstance from "@/utils/axiosIntance";

interface PurchaseResponse {
  data?: {
    character?: { dinheiro?: number };
    inventoryEntry?: { quantidade?: number };
    quantidadeComprada?: number;
  };
  message?: string;
}

interface PurchaseError {
  response?: { status?: number; data?: { message?: string } };
  message?: string;
}

export default function ShopItem({
  characterId,
  initialCoins,
}: {
  characterId?: number;
  initialCoins: number;
}) {
  const [coins, setCoins] = useState(initialCoins);
  const [quantity, setQuantity] = useState(0);
  const [isBuying, setIsBuying] = useState(false);
  const [message, setMessage] = useState("");
  const price = 1; // valor_compra do item no banco; usado aqui só para desabilitar o botão

  async function buyPotion() {
    if (isBuying) return;
    if (!characterId) {
      setMessage("Personagem não identificado.");
      return;
    }
    if (coins < price) {
      setMessage("Voce nao tem moedas suficientes.");
      return;
    }

    setIsBuying(true);
    setMessage("");
    try {
      // ATENCAO: confirme se sua baseURL do axiosInstance já inclui "/api".
      // Se sim, o caminho abaixo deve ser "/shop/purchase".
      // Se a baseURL for só a raiz do servidor, use "/api/shop/purchase".
      const response = await axiosInstance.post<PurchaseResponse>(
        "/shop/purchase",
        {
          id_personagem: characterId,
          id_item: 3,
          quantidade: 1,
        },
      );

      const purchased = response.data?.data?.quantidadeComprada ?? 1;
      const updatedCoins =
        response.data?.data?.character?.dinheiro ?? coins - price;

      setCoins(updatedCoins);
      setQuantity((current) => current + purchased);
      setMessage("Pocao comprada e adicionada ao inventario.");
    } catch (error: unknown) {
      console.error("Erro ao comprar pocao:", error);
      const apiMessage = (error as PurchaseError).response?.data?.message;
      const errorMessage = (error as PurchaseError).message;
      setMessage(
        apiMessage ?? errorMessage ?? "Nao foi possivel concluir a compra.",
      );
    } finally {
      setIsBuying(false);
    }
  }

  return (
    <article className="flex flex-col rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-4 text-white shadow-lg">
      <div className="mb-4 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-[#3a2f24]">
        <img
          src="/images/primordial.webp"
          alt="Pocao de Vida"
          className="h-full w-full object-cover opacity-80"
        />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold uppercase tracking-widest text-[#F3B43F]">
          Consumivel · Comum
        </p>
        <h2 className="mt-1 font-imFeel text-3xl">Pocao de Vida</h2>
        <p className="mt-2 text-white/70">
          Regenera 30 pontos de vida durante a aventura.
        </p>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/15 pt-4">
        <div>
          <p className="text-xl font-bold text-[#F3B43F]">1 moeda</p>
          {quantity > 0 && (
            <p className="text-sm text-white/70">No inventario: x{quantity}</p>
          )}
        </div>
        <button
          type="button"
          onClick={buyPotion}
          disabled={isBuying || coins < price}
          className="rounded-lg bg-[#F3B43F] px-4 py-2 font-bold text-[#292018] transition hover:bg-[#ffd477] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isBuying ? "Comprando..." : "Comprar"}
        </button>
      </div>
      <p className="mt-3 text-sm font-bold text-[#F3B43F]">Moedas: {coins}</p>
      {message && <p className="mt-2 text-sm text-white/80">{message}</p>}
    </article>
  );
}
