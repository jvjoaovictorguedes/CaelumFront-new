"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { resolveMediaUrl } from "@/utils/media-url";

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

const CORES_RARIDADE: Record<string, string> = {
  Comum: "border-white/20",
  Incomum: "border-green-500/60",
  Raro: "border-blue-500/60",
  Epico: "border-purple-500/60",
  Lendario: "border-orange-500/60",
  Mitico: "border-red-500/60",
};

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

export default function MaterialsGrid({ characterId }: { characterId: number }) {
  const [itens, setItens] = useState<InventarioEntry[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    axiosInstance
      .get<{ data?: { inventory?: InventarioEntry[] } }>("/character-inventory", {
        params: { characterId },
      })
      .then((resp) => {
        if (cancelado) return;
        // "Espolio" é o drop de monstro da Aventura (ver AdventureMonsterLoot)
        // — sem essa categoria aqui, o item ficava só no banco: comprado no
        // Mercado ou ganho em combate, mas invisível pro jogador no
        // Inventário, já que só existe a aba "Materiais" pra tudo que é
        // stackável e não-consumível.
        const materiais = (resp.data?.data?.inventory ?? []).filter(
          (entrada) => entrada.Item.tipo_item === "Material" || entrada.Item.tipo_item === "Espolio",
        );
        setItens(materiais);
      })
      .catch((error) => console.error("Erro ao carregar materiais:", error))
      .finally(() => !cancelado && setCarregando(false));
    return () => {
      cancelado = true;
    };
  }, [characterId]);

  if (carregando) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        Carregando materiais...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      <div className="mb-3 flex justify-center">
        <p className="rounded-full border border-[#F3B43F]/50 bg-black/30 px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#F3B43F]">
          Materiais e Espólios
        </p>
      </div>

      {itens.length === 0 ? (
        <p className="text-center text-sm text-white/50">
          Você ainda não tem nenhum material ou espólio — vença batalhas pra conseguir.
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {itens.map((entrada) => (
            <MaterialCard key={entrada.id_personagem_inventario} entrada={entrada} />
          ))}
        </div>
      )}
    </div>
  );
}

// Sem :hover no mobile o nome do material nunca aparecia por toque —
// agora tocar no item também alterna ele (mesma ideia do tooltip de
// atributos de equipamento, ver BonecoDePapel.tsx).
function MaterialCard({ entrada }: { entrada: InventarioEntry }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div
      onClick={() => setAberto((atual) => !atual)}
      title={entrada.Item.nome}
      className={`group relative z-10 h-16 w-16 cursor-pointer rounded-lg border-2 bg-[#3a2f24] transition duration-150 hover:z-20 hover:scale-110 ${
        CORES_RARIDADE[entrada.Item.raridade] ?? "border-white/20"
      }`}
    >
      <div className="h-full w-full overflow-hidden rounded-lg">
        <ItemThumb item={entrada.Item} />
      </div>
      {/* Badge fora do wrapper com overflow-hidden acima — senão o
          offset negativo (-bottom-1/-right-1) fica cortado pelo
          próprio quadrado do item. */}
      <span className="pointer-events-none absolute -bottom-1 -right-1 rounded bg-black/80 px-1 text-[9px] font-bold text-white">
        x{entrada.quantidade}
      </span>
      <div
        className={`pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-black/85 p-1 text-center text-[10px] font-bold leading-tight transition-opacity group-hover:opacity-100 ${
          aberto ? "opacity-100" : "opacity-0"
        }`}
      >
        {entrada.Item.nome}
      </div>
    </div>
  );
}
