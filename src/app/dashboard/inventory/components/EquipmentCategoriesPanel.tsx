"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { resolveMediaUrl } from "@/utils/media-url";
import { useCharacter } from "@/contexts/CharacterContext";

type Slot =
  | "Cabeca"
  | "Torso"
  | "Pes"
  | "ArmaPrincipal"
  | "ArmaSecundaria"
  | "Acessorio1"
  | "Acessorio2";

type Atributo = "Forca" | "Vitalidade" | "Inteligencia" | "Agilidade" | "Velocidade";

const NOME_ATRIBUTO: Record<Atributo, string> = {
  Forca: "Força",
  Vitalidade: "Vitalidade",
  Inteligencia: "Inteligência",
  Agilidade: "Agilidade",
  Velocidade: "Velocidade",
};

// Mesma escala de cor por raridade que a Loja e o boneco de papel já usam.
const BORDA_RARIDADE: Record<string, string> = {
  comum: "border-[#9CA3AF]/80",
  incomum: "border-[#4ADE80]/80",
  raro: "border-[#60A5FA]/80",
  epico: "border-[#C084FC]/80",
  lendario: "border-[#FB923C]/80",
  mitico: "border-[#F87171]/80",
};

function bordaPorRaridade(raridade?: string) {
  return BORDA_RARIDADE[(raridade ?? "comum").toLowerCase()] ?? BORDA_RARIDADE.comum;
}

interface WeaponPropertiesInfo {
  dano_min: number;
  dano_max: number;
  tipo_dano: "Fisico" | "Magico";
  bonus_atributo: Atributo;
  valor_bonus_atributo: number;
}

interface ArmorPropertiesInfo {
  slot_equipamento: string;
  defesa: number;
  bonus_forca: number;
  bonus_vitalidade: number;
  bonus_inteligencia: number;
  bonus_agilidade: number;
  bonus_velocidade: number;
}

interface ItemInfo {
  id: number;
  nome: string;
  tipo_item: string;
  raridade: string;
  imagem_url?: string | null;
  armorProperties?: ArmorPropertiesInfo | null;
  weaponProperties?: WeaponPropertiesInfo | null;
}

// Mesma lista compacta de atributos que a Loja e o boneco de papel (Meu
// Personagem > Equipamentos) já mostram — duplicada aqui porque cada tela
// lê de um formato de item ligeiramente diferente.
function ListaDeAtributos({ item }: { item: ItemInfo }) {
  if (item.weaponProperties) {
    const arma = item.weaponProperties;
    return (
      <ul className="space-y-0.5">
        <li>
          <span className="font-bold text-[#F3B43F]">Dano:</span> {arma.dano_min}–{arma.dano_max}{" "}
          ({arma.tipo_dano === "Fisico" ? "Físico" : "Mágico"})
        </li>
        {arma.valor_bonus_atributo > 0 && (
          <li>
            <span className="font-bold text-[#F3B43F]">+{arma.valor_bonus_atributo}</span>{" "}
            {NOME_ATRIBUTO[arma.bonus_atributo]}
          </li>
        )}
      </ul>
    );
  }

  if (item.armorProperties) {
    const armor = item.armorProperties;
    const bonus: [Atributo, number][] = [
      ["Forca", armor.bonus_forca],
      ["Vitalidade", armor.bonus_vitalidade],
      ["Inteligencia", armor.bonus_inteligencia],
      ["Agilidade", armor.bonus_agilidade],
      ["Velocidade", armor.bonus_velocidade],
    ];
    return (
      <ul className="space-y-0.5">
        {armor.defesa > 0 && (
          <li>
            <span className="font-bold text-[#F3B43F]">Defesa:</span> {armor.defesa}
          </li>
        )}
        {bonus
          .filter(([, valor]) => valor > 0)
          .map(([atributo, valor]) => (
            <li key={atributo}>
              <span className="font-bold text-[#F3B43F]">+{valor}</span> {NOME_ATRIBUTO[atributo]}
            </li>
          ))}
      </ul>
    );
  }

  return null;
}

interface InventarioEntry {
  id_personagem_inventario: number;
  quantidade: number;
  Item: ItemInfo;
}

interface EquipamentoApi {
  slot: Slot;
  id_item: number;
  item: ItemInfo;
}

// Cada seção bate com um slot real do backend (ver VALID_SLOTS em
// CharacterEquipmentController.js) — Tronco e Pé são os dois "Armadura"
// que só a propriedade slot_equipamento diferencia, e Mão (arma)/
// Mão (Escudo) são dois recortes visuais do mesmo slot ArmaSecundaria
// (escudo) vs ArmaPrincipal (arma).
const SECOES: {
  slot: Slot;
  titulo: string;
  filtro: (item: ItemInfo) => boolean;
}[] = [
  { slot: "Cabeca", titulo: "Cabeça", filtro: (item) => item.tipo_item === "Capacete" },
  {
    slot: "Torso",
    titulo: "Tronco",
    filtro: (item) => item.tipo_item === "Armadura" && item.armorProperties?.slot_equipamento === "Torso",
  },
  {
    slot: "Pes",
    titulo: "Pé",
    filtro: (item) => item.tipo_item === "Armadura" && item.armorProperties?.slot_equipamento === "Pes",
  },
  { slot: "ArmaPrincipal", titulo: "Mão (arma)", filtro: (item) => item.tipo_item === "Arma" },
  { slot: "ArmaSecundaria", titulo: "Mão (Escudo)", filtro: (item) => item.tipo_item === "Escudo" },
  { slot: "Acessorio1", titulo: "Anel", filtro: (item) => item.tipo_item === "Acessorio1" },
  { slot: "Acessorio2", titulo: "Colar", filtro: (item) => item.tipo_item === "Acessorio2" },
];

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

export default function EquipmentCategoriesPanel({ characterId }: { characterId: number }) {
  const { refreshCharacter } = useCharacter();
  const [inventario, setInventario] = useState<InventarioEntry[]>([]);
  const [equipados, setEquipados] = useState<Partial<Record<Slot, ItemInfo>>>({});
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [processando, setProcessando] = useState(false);
  const [selecionado, setSelecionado] = useState<{ slot: Slot; idItem: number } | null>(null);

  const carregar = useCallback(async () => {
    try {
      const [respInv, respEquip] = await Promise.all([
        axiosInstance.get<{ data?: { inventory?: InventarioEntry[] } }>(
          "/character-inventory",
          { params: { characterId } },
        ),
        axiosInstance.get<{ data?: { equipamentos?: EquipamentoApi[] } }>(
          `/character-equipment/${characterId}`,
        ),
      ]);
      setInventario(respInv.data?.data?.inventory ?? []);
      const mapa: Partial<Record<Slot, ItemInfo>> = {};
      for (const linha of respEquip.data?.data?.equipamentos ?? []) {
        mapa[linha.slot] = linha.item;
      }
      setEquipados(mapa);
    } catch (error) {
      console.error("Erro ao carregar equipamentos:", error);
      setMensagem("Não foi possível carregar seus equipamentos.");
    } finally {
      setCarregando(false);
    }
  }, [characterId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function equipar(slot: Slot, idItem: number) {
    if (processando) return;
    setProcessando(true);
    setMensagem("");
    try {
      await axiosInstance.post("/character-equipment/equip", {
        id_personagem: characterId,
        slot,
        id_item: idItem,
      });
      await Promise.all([carregar(), refreshCharacter()]);
      setSelecionado(null);
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
    if (processando) return;
    setProcessando(true);
    setMensagem("");
    try {
      await axiosInstance.delete("/character-equipment/unequip", {
        data: { id_personagem: characterId, slot },
      });
      await Promise.all([carregar(), refreshCharacter()]);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Não foi possível desequipar esse item.";
      setMensagem(msg);
    } finally {
      setProcessando(false);
    }
  }

  if (carregando) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        Carregando equipamentos...
      </div>
    );
  }

  // Quantas cópias de cada item já estão presas em algum slot — mesmo
  // raciocínio do EquipmentPanel do personagem, pra não mostrar como
  // "livre" uma unidade que já está equipada em outro lugar.
  const equipadoPorItem = new Map<number, number>();
  for (const item of Object.values(equipados)) {
    if (item) equipadoPorItem.set(item.id, (equipadoPorItem.get(item.id) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      {mensagem && (
        <p className="rounded-xl bg-red-900/30 p-3 text-sm text-red-300">{mensagem}</p>
      )}

      {SECOES.map(({ slot, titulo, filtro }) => {
        const itemEquipado = equipados[slot];
        const disponiveis = inventario
          .filter((entrada) => filtro(entrada.Item))
          .map((entrada) => ({
            ...entrada,
            disponivel: entrada.quantidade - (equipadoPorItem.get(entrada.Item.id) ?? 0),
          }))
          .filter((entrada) => entrada.disponivel > 0 || entrada.Item.id === itemEquipado?.id);

        return (
          <div
            key={slot}
            className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl"
          >
            <div className="mb-3 flex justify-center">
              <p className="rounded-full border border-[#F3B43F]/50 bg-black/30 px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#F3B43F]">
                {titulo}
              </p>
            </div>

            {itemEquipado && (
              <p className="mb-3 text-center text-xs text-white/60">
                Equipado: <span className="font-bold text-[#F3B43F]">{itemEquipado.nome}</span>{" "}
                <button
                  type="button"
                  onClick={() => desequipar(slot)}
                  disabled={processando}
                  className="ml-1 underline hover:text-white disabled:opacity-50"
                >
                  desequipar
                </button>
              </p>
            )}

            {disponiveis.length === 0 ? (
              <p className="text-center text-sm text-white/50">
                Você não tem nenhum item pra esse slot.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {disponiveis.map((entrada) => {
                  const jaEquipadoAqui = itemEquipado?.id === entrada.Item.id;
                  const marcado = selecionado?.slot === slot && selecionado.idItem === entrada.Item.id;
                  return (
                    <button
                      key={entrada.id_personagem_inventario}
                      type="button"
                      onClick={() =>
                        setSelecionado((atual) =>
                          atual?.slot === slot && atual.idItem === entrada.Item.id
                            ? null
                            : { slot, idItem: entrada.Item.id },
                        )
                      }
                      className={`group relative z-10 h-16 w-16 overflow-visible rounded-lg border-2 bg-[#3a2f24] transition hover:z-20 ${
                        jaEquipadoAqui
                          ? "border-green-500/70"
                          : marcado
                            ? "border-[#F3B43F] ring-2 ring-[#F3B43F]/70"
                            : `${bordaPorRaridade(entrada.Item.raridade)} hover:border-[#F3B43F]`
                      }`}
                    >
                      <div className="h-full w-full overflow-hidden rounded-lg">
                        <ItemThumb item={entrada.Item} />
                      </div>
                      {entrada.disponivel > 1 && (
                        <span className="pointer-events-none absolute -bottom-1 -right-1 rounded bg-black/80 px-1 text-[9px] font-bold text-white">
                          x{entrada.disponivel}
                        </span>
                      )}

                      {/* Nome/atributos só aparecem no hover, flutuando
                          acima do item. */}
                      <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-36 -translate-x-1/2 rounded-md bg-black/90 p-2 text-center opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                        <span className="block text-[10px] font-bold leading-tight text-white">
                          {entrada.Item.nome}
                        </span>
                        <div className="mt-1 text-[9px] leading-tight text-white/90">
                          <ListaDeAtributos item={entrada.Item} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => selecionado && selecionado.slot === slot && equipar(slot, selecionado.idItem)}
                disabled={processando || selecionado?.slot !== slot}
                className="rounded-lg bg-[#BC8418] px-6 py-1.5 text-xs font-bold uppercase tracking-wide text-black transition hover:bg-[#a5710f] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Equipar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
