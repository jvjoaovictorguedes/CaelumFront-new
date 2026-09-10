import axiosInstance from "@/utils/axiosIntance";
import { getCurrentCharacterId } from "@/utils/character-session";

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

const CORES_RARIDADE: Record<string, string> = {
  Comum: "text-gray-700",
  Incomum: "text-green-600",
  Raro: "text-blue-600",
  Epico: "text-purple-600",
  Lendario: "text-orange-600",
  Mitico: "text-red-600",
};

export default async function InventoryPage() {
  const characterId = await getCurrentCharacterId();

  if (!characterId) {
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
  try {
    const response = await axiosInstance.get("/character-inventory", {
      params: { characterId },
    });
    itens = response.data?.data?.inventory ?? [];
  } catch (error) {
    console.error("Erro ao carregar inventário:", error);
  }

  return (
    <div className="flex flex-col items-center h-full p-4">
      <h1 className="font-imFeel text-5xl mb-6">Meu Inventário</h1>

      {itens.length === 0 ? (
        <p className="text-lg text-gray-700">
          Você ainda não tem nenhum item. Vença batalhas ou visite a loja para
          conseguir equipamentos.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
          {itens.map((entrada) => (
            <div
              key={entrada.id_personagem_inventario}
              className="bg-[#F3B43F]/30 rounded-lg p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-imFeel text-xl">{entrada.Item.nome}</p>
                <p
                  className={`text-sm font-bold ${
                    CORES_RARIDADE[entrada.Item.raridade] ?? "text-gray-700"
                  }`}
                >
                  {entrada.Item.raridade} · {entrada.Item.tipo_item}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">x{entrada.quantidade}</p>
                {entrada.equipado && (
                  <p className="text-xs font-bold text-green-700">Equipado</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
