import axiosInstance from "@/utils/axiosIntance";
import { getCurrentCharacterId } from "@/utils/character-session";
import InventoryItemCard from "./components/InventaryItemCard";

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

interface InventoryResponse {
  data?: {
    inventory?: InventoryEntry[];
  };
  inventory?: InventoryEntry[];
}

export default async function InventoryPage() {
  const characterId = await getCurrentCharacterId();
  const characterIdNumber = characterId ? Number(characterId) : NaN;

  if (!characterId || !Number.isInteger(characterIdNumber)) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="font-imFeel text-4xl mb-4">Meu Inventário</h1>
        <p className="text-lg text-gray-700">
          Crie um personagem para começar a guardar itens.
        </p>
      </div>
    );
  }

  let itens: InventoryEntry[] = [];
  let erro = false;
  try {
    const response = await axiosInstance.get<InventoryResponse>(
      "/character-inventory",
      { params: { characterId } },
    );
    itens = response.data?.data?.inventory ?? response.data?.inventory ?? [];
  } catch (error) {
    console.error("Erro ao carregar inventário:", error);
    erro = true;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-2 sm:p-4">
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">
          Arsenal do herói
        </p>
        <h1 className="font-imFeel text-4xl sm:text-5xl">Meu Inventário</h1>
        <p className="mt-2 text-white/70">Itens carregados: {itens.length}</p>
      </div>

      {erro ? (
        <div className="rounded-xl bg-red-900/20 p-6 text-center text-red-900">
          Não foi possível carregar seu inventário. Tente novamente em
          instantes.
        </div>
      ) : itens.length === 0 ? (
        <p className="text-lg text-gray-700">
          Você ainda não tem nenhum item. Vença batalhas ou visite a loja para
          conseguir equipamentos.
        </p>
      ) : (
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {itens.map((entrada) => (
            <InventoryItemCard
              key={entrada.id_personagem_inventario}
              entrada={entrada}
              characterId={characterIdNumber}
            />
          ))}
        </div>
      )}
    </div>
  );
}
