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

// 7 slots ativos (Mãos fica de fora — não existe peça de armadura pra
// esse slot no catálogo ainda). Acessório 1/2 (cinto/medalhão) ficam
// FORA da silhueta do personagem de propósito: não fazem parte do
// "boneco de papel" em si (não tem arte de cinto/colar desenhada no
// personagem), então entram como ícones flutuando nas laterais em vez
// de sobrepor o corpo, um de cada lado pra não empilhar em cima da
// arma/escudo que já ocupam os cantos na altura do meio.
//
// Posição de cada slot em cima do fundo "boneco de papel" (ver
// public/CharacterBackground/*-personagem-itens.webp): braços abertos e
// apontando um pouco pra baixo, então a arma fica mais pro canto que no
// meio da lateral.
const SLOTS: { slot: Slot; label: string; top: string; left: string; pequeno?: boolean }[] = [
  { slot: "Cabeca", label: "Cabeça", top: "8%", left: "50%" },
  { slot: "Torso", label: "Torso", top: "32%", left: "50%" },
  { slot: "ArmaPrincipal", label: "Arma Principal", top: "48%", left: "12%" },
  { slot: "ArmaSecundaria", label: "Arma Secundária", top: "48%", left: "88%" },
  { slot: "Pes", label: "Pés", top: "92%", left: "50%" },
  { slot: "Acessorio1", label: "Anel", top: "74%", left: "10%", pequeno: true },
  { slot: "Acessorio2", label: "Colar", top: "16%", left: "90%", pequeno: true },
];

// Tipos de item que fazem sentido clicar pra equipar num slot ativo —
// Consumível, Material, QuestItem e Moeda nunca foram equipáveis.
const TIPOS_EQUIPAVEIS = ["Armadura", "Capacete", "Escudo", "Arma", "Acessorio1", "Acessorio2"];

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
  const [itemSelecionado, setItemSelecionado] = useState<number | null>(null);
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
      setItemSelecionado(null);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Não foi possível equipar esse item.";
      setMensagem(msg);
      // Mantém selecionado em caso de erro (ex.: slot errado) — deixa o
      // jogador tentar outro slot sem precisar escolher o item de novo.
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

  // Clique em vez de arrastar-e-soltar: alguns navegadores (relatado no
  // Edge) travavam a aba inteira ao SEGURAR o item pra iniciar um drag
  // nativo — o clique simples nunca travava, só o gesto de arrastar em
  // si. Clicar num item do inventário "seleciona" ele (fica destacado);
  // clicar num slot depois equipa. Clicar de novo no mesmo item, ou num
  // item diferente, troca a seleção.
  function clicarSlot(slot: Slot) {
    if (processando || itemSelecionado === null) return;
    equipar(slot, itemSelecionado);
  }

  function clicarItemInventario(idItem: number) {
    if (processando) return;
    setItemSelecionado((atual) => (atual === idItem ? null : idItem));
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
        {SLOTS.map(({ slot, label, top, left, pequeno }) => {
          const itemNoSlot = equipamentos[slot];
          const aguardandoEscolha = itemSelecionado !== null;
          return (
            <div
              key={slot}
              onClick={() => clicarSlot(slot)}
              style={{ top, left }}
              className={`group absolute -translate-x-1/2 -translate-y-1/2 ${
                pequeno ? "h-12 w-12" : "h-16 w-16"
              } ${aguardandoEscolha ? "cursor-pointer" : ""}`}
            >
              <div
                className={`relative h-full w-full overflow-hidden rounded-lg border-2 transition-colors ${
                  aguardandoEscolha
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
                        onClick={(e) => {
                          e.stopPropagation();
                          desequipar(slot);
                        }}
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

      {itemSelecionado !== null && !mensagem && (
        <p className="mb-3 text-sm text-[#F3B43F]">
          Item selecionado — clique num slot acima pra equipar (ou clique nele de novo pra cancelar).
        </p>
      )}
      {mensagem && (
        <p className="mb-3 text-sm text-red-400">{mensagem}</p>
      )}

      <p className="mb-2 text-sm uppercase tracking-widest text-[#F3B43F]">
        Seu inventário (clique num item e depois num slot acima pra equipar)
      </p>
      {itensEquipaveis.length === 0 ? (
        <p className="text-sm text-white/60">
          Você não tem nenhum item equipável disponível no inventário.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {itensEquipaveis.map((entrada) => {
            const selecionado = itemSelecionado === entrada.Item.id;
            return (
              <div
                key={entrada.id_personagem_inventario}
                role="button"
                tabIndex={0}
                onClick={() => clicarItemInventario(entrada.Item.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    clicarItemInventario(entrada.Item.id);
                  }
                }}
                className={`group relative h-16 w-16 cursor-pointer select-none rounded-lg border-2 bg-[#3a2f24] transition-colors ${
                  selecionado
                    ? "border-[#F3B43F] ring-2 ring-[#F3B43F]/70"
                    : "border-[#F3B43F]/60 hover:border-[#F3B43F]"
                }`}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
