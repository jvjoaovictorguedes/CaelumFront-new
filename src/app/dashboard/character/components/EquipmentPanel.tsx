"use client";

import { useEffect, useState, useCallback } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { getClassBackground, resolveMediaUrl } from "@/utils/media-url";
import { useCharacter } from "@/contexts/CharacterContext";

type Slot =
  | "Cabeca"
  | "Torso"
  | "Maos"
  | "Pes"
  | "ArmaPrincipal"
  | "ArmaSecundaria"
  | "Acessorio1"
  | "Acessorio2";

// Só 5 slots ativos por enquanto (cabeça, dorso, arma principal, arma
// secundária, pés) — Mãos e os dois Acessórios ficam de fora da UI até
// terem arte própria, mas o tipo Slot e o objeto `equipamentos` continuam
// cobrindo os 8 pra não quebrar nada que o back já valida.
//
// Posição de cada slot em cima do fundo "boneco de papel" (ver
// public/CharacterBackground/*-personagem-itens.webp): braços abertos e
// apontando um pouco pra baixo, então a arma fica mais pro canto que no
// meio da lateral.
const SLOTS: { slot: Slot; label: string; top: string; left: string }[] = [
  { slot: "Cabeca", label: "Cabeça", top: "8%", left: "50%" },
  { slot: "Torso", label: "Torso", top: "32%", left: "50%" },
  { slot: "ArmaPrincipal", label: "Arma Principal", top: "48%", left: "12%" },
  { slot: "ArmaSecundaria", label: "Arma Secundária", top: "48%", left: "88%" },
  { slot: "Pes", label: "Pés", top: "92%", left: "50%" },
];

// Tipos de item que fazem sentido arrastar pra um slot ativo. Acessorio1/2
// ficam de fora enquanto o slot correspondente não existir na UI —
// Consumível, Material, QuestItem e Moeda nunca foram equipáveis.
const TIPOS_EQUIPAVEIS = ["Armadura", "Capacete", "Escudo", "Arma"];

interface ItemInfo {
  id: number;
  nome: string;
  tipo_item: string;
  raridade: string;
  imagem_url?: string | null;
}

// Enquanto o item não tem `imagem_url` própria (a maioria, por ora — só a
// Espada de Ferro tem), mostra a inicial do nome num badge em vez de um
// ícone genérico/quebrado.
function ItemThumb({ item, className = "" }: { item: ItemInfo; className?: string }) {
  const src = resolveMediaUrl(item.imagem_url);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={item.nome} className={`object-contain ${className}`} />;
  }
  return (
    <div
      className={`flex items-center justify-center text-lg font-bold text-[#F3B43F]/80 ${className}`}
    >
      {item.nome.charAt(0).toUpperCase()}
    </div>
  );
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
  const { refreshCharacter } = useCharacter();

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
      // Equipar/desequipar muda vida_maxima, mana_maxima e bonus_atributos —
      // atualiza o personagem compartilhado junto com o painel local, pra
      // a barra de vida/mana (em outro componente) refletir na hora.
      await Promise.all([carregarTudo(), refreshCharacter()]);
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
      await Promise.all([carregarTudo(), refreshCharacter()]);
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

      <div
        className="relative mx-auto mb-5 aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[#3a2f24] bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${getClassBackground(classe)})` }}
      >
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
              className="group absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2"
            >
              <div
                className={`relative h-full w-full overflow-hidden rounded-lg border-2 transition-colors ${
                  emFoco
                    ? "border-[#F3B43F] bg-[#3a2f24]"
                    : itemNoSlot
                      ? "border-[#F3B43F]/70 bg-[#1c150f]"
                      : "border-dashed border-white/40 bg-black/60"
                }`}
              >
                {itemNoSlot && (
                  <ItemThumb item={itemNoSlot} className="h-full w-full p-2" />
                )}

                {/* Nome/label só aparecem no hover — o resto do tempo é só a
                    imagem (ou o box vazio), pra manter o boneco de papel limpo. */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/85 p-1 text-center opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="text-[9px] uppercase tracking-wide text-white/60">
                    {label}
                  </span>
                  {itemNoSlot ? (
                    <>
                      <span className="text-[10px] font-bold leading-tight text-[#F3B43F]">
                        {itemNoSlot.nome}
                      </span>
                      <button
                        type="button"
                        onClick={() => desequipar(slot)}
                        disabled={processando}
                        className="pointer-events-auto text-[9px] text-white/60 underline hover:text-white disabled:opacity-50"
                      >
                        desequipar
                      </button>
                    </>
                  ) : (
                    <span className="text-[9px] text-white/40">Vazio</span>
                  )}
                </div>
              </div>
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
              className="group relative h-16 w-16 cursor-grab select-none rounded-lg border-2 border-[#F3B43F]/60 bg-[#3a2f24] active:cursor-grabbing"
            >
              <ItemThumb item={entrada.Item} className="h-full w-full p-2" />
              <span className="pointer-events-none absolute -bottom-1 -right-1 rounded bg-black/80 px-1 text-[9px] font-bold text-white">
                x{entrada.disponivel}
              </span>

              {/* Nome/tipo só aparecem no hover, igual aos slots. */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 rounded-lg bg-black/85 p-1 text-center opacity-0 transition-opacity group-hover:opacity-100">
                <span className="text-[10px] font-bold leading-tight text-white">
                  {entrada.Item.nome}
                </span>
                <span className="text-[9px] text-white/50">
                  {entrada.Item.tipo_item}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
