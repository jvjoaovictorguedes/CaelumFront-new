"use client";

import { useState } from "react";
import axiosInstance from "@/utils/axiosIntance";

interface ShopItemData {
  id: number;
  nome: string;
  descricao?: string;
  valor_compra: number;
  valor_venda: number;
  imagem?: string;
  categoria?: string;
  raridade?: string;
}

interface PurchaseResponse {
  data?: {
    character?: {
      dinheiro?: number;
    };
    inventoryEntry?: {
      quantidade?: number;
    };
    quantidadeComprada?: number;
  };
  message?: string;
}

interface PurchaseError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
}

interface ShopItemProps {
  characterId?: number;
  initialCoins: number;
  item: ShopItemData;
}

export default function ShopItem({
  characterId,
  initialCoins,
  item,
}: ShopItemProps) {
  const [coins, setCoins] = useState(initialCoins);
  const [quantity, setQuantity] = useState(0);
  const [isBuying, setIsBuying] = useState(false);
  const [message, setMessage] = useState("");

  async function buyItem() {
    if (isBuying) return;

    if (!characterId) {
      setMessage("Personagem não identificado.");
      return;
    }

    if (coins < item.valor_compra) {
      setMessage("Você não tem moedas suficientes.");
      return;
    }

    setIsBuying(true);
    setMessage("");

    try {
      const response = await axiosInstance.post<PurchaseResponse>(
        "/shop/purchase",
        {
          id_personagem: characterId,
          id_item: item.id,
          quantidade: 1,
        },
      );

      const purchased =
        response.data?.data?.quantidadeComprada ?? 1;

      const updatedCoins =
        response.data?.data?.character?.dinheiro ??
        coins - item.valor_compra;

      setCoins(updatedCoins);
      setQuantity((current) => current + purchased);

      setMessage(
        `${item.nome} comprada e adicionada ao inventário.`,
      );
    } catch (error: unknown) {
      console.error("Erro ao comprar item:", error);

      const apiMessage =
        (error as PurchaseError).response?.data?.message;

      const errorMessage =
        (error as PurchaseError).message;

      setMessage(
        apiMessage ??
          errorMessage ??
          "Não foi possível concluir a compra.",
      );
    } finally {
      setIsBuying(false);
    }
  }

  return (
    <article className="flex flex-col rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-4 text-white shadow-lg">
      {/* IMAGEM */}
      <div className="mb-4 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-[#3a2f24]">
        <img
          src={item.imagem ?? "/images/primordial.webp"}
          alt={item.nome}
          className="h-full w-full object-cover opacity-80"
        />
      </div>

      {/* INFORMAÇÕES */}
      <div className="flex-1">
        <p className="text-sm font-bold uppercase tracking-widest text-[#F3B43F]">
          {item.categoria ?? "Consumível"} ·{" "}
          {item.raridade ?? "Comum"}
        </p>

        <h2 className="mt-1 font-imFeel text-3xl">
          {item.nome}
        </h2>

        <p className="mt-2 text-white/70">
          {item.descricao ?? "Item disponível para compra."}
        </p>
      </div>

      {/* PREÇO + BOTÃO */}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/15 pt-4">
        <div>
          <p className="text-xl font-bold text-[#F3B43F]">
            {item.valor_compra}{" "}
            {item.valor_compra === 1 ? "moeda" : "moedas"}
          </p>

          {quantity > 0 && (
            <p className="text-sm text-white/70">
              No inventário: x{quantity}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={buyItem}
          disabled={
            isBuying ||
            coins < item.valor_compra
          }
          className="rounded-lg bg-[#F3B43F] px-4 py-2 font-bold text-[#292018] transition hover:bg-[#ffd477] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isBuying ? "Comprando..." : "Comprar"}
        </button>
      </div>

      {/* MOEDAS */}
      <p className="mt-3 text-sm font-bold text-[#F3B43F]">
        Moedas: {coins}
      </p>

      {/* MENSAGEM */}
      {message && (
        <p className="mt-2 text-sm text-white/80">
          {message}
        </p>
      )}
    </article>
  );
}