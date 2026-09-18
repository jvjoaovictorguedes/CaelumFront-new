"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { resolveMediaUrl } from "@/utils/media-url";
import { useCharacter } from "@/contexts/CharacterContext";

interface ItemInfo {
  id: number;
  nome: string;
  tipo_item: string;
  raridade: string;
  imagem_url?: string | null;
}

interface InventarioEntry {
  id_personagem_inventario: number;
  quantidade: number;
  Item: ItemInfo;
}

function ItemThumb({ item }: { item: ItemInfo }) {
  const src = resolveMediaUrl(item.imagem_url);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={item.nome} className="h-full w-full rounded-lg object-contain p-1" />
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center rounded-lg text-lg font-bold text-[#F3B43F]/80">
      {item.nome.charAt(0).toUpperCase()}
    </div>
  );
}

export default function ConsumablesGrid({ characterId }: { characterId: number }) {
  const { atualizarCharacter } = useCharacter();
  const [itens, setItens] = useState<InventarioEntry[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [usandoId, setUsandoId] = useState<number | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [selecionado, setSelecionado] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{ data?: { inventory?: InventarioEntry[] } }>(
        "/character-inventory",
        { params: { characterId } },
      );
      setItens((resp.data?.data?.inventory ?? []).filter((e) => e.Item.tipo_item === "Consumivel"));
    } catch (error) {
      console.error("Erro ao carregar consumíveis:", error);
    } finally {
      setCarregando(false);
    }
  }, [characterId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function usar(entrada: InventarioEntry) {
    if (usandoId) return;
    setUsandoId(entrada.id_personagem_inventario);
    setMensagem("");
    try {
      const resp = await axiosInstance.post<{
        data?: { character?: { vida_atual?: number; mana_atual?: number } };
      }>("/character-items/use", {
        id_personagem: characterId,
        id_item: entrada.Item.id,
        quantidade: 1,
      });
      if (resp.data?.data?.character) atualizarCharacter(resp.data.data.character);
      await carregar();
      setSelecionado(null);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Não foi possível usar esse item.";
      setMensagem(msg);
    } finally {
      setUsandoId(null);
    }
  }

  if (carregando) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        Carregando consumíveis...
      </div>
    );
  }

  const selecionadoEntrada = itens.find((e) => e.id_personagem_inventario === selecionado);

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      <div className="mb-3 flex justify-center">
        <p className="rounded-full border border-[#F3B43F]/50 bg-black/30 px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#F3B43F]">
          Consumíveis
        </p>
      </div>

      {mensagem && <p className="mb-3 text-center text-sm text-red-400">{mensagem}</p>}

      {itens.length === 0 ? (
        <p className="text-center text-sm text-white/50">
          Você ainda não tem nenhum consumível.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {itens.map((entrada) => (
              <button
                key={entrada.id_personagem_inventario}
                type="button"
                title={entrada.Item.nome}
                onClick={() =>
                  setSelecionado((atual) =>
                    atual === entrada.id_personagem_inventario ? null : entrada.id_personagem_inventario,
                  )
                }
                className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 bg-[#3a2f24] transition ${
                  selecionado === entrada.id_personagem_inventario
                    ? "border-[#F3B43F] ring-2 ring-[#F3B43F]/70"
                    : "border-[#F3B43F]/60 hover:border-[#F3B43F]"
                }`}
              >
                <ItemThumb item={entrada.Item} />
                <span className="pointer-events-none absolute -bottom-1 -right-1 rounded bg-black/80 px-1 text-[9px] font-bold text-white">
                  x{entrada.quantidade}
                </span>
              </button>
            ))}
          </div>

          {selecionadoEntrada && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="text-sm font-bold">{selecionadoEntrada.Item.nome}</span>
              <button
                type="button"
                onClick={() => usar(selecionadoEntrada)}
                disabled={usandoId !== null}
                className="rounded-lg bg-[#BC8418] px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-black transition hover:bg-[#a5710f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {usandoId ? "Usando..." : "Usar"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
