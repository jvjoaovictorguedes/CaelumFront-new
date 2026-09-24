"use client";

import { useEffect, useState, useCallback } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { useCharacter } from "@/contexts/CharacterContext";
import BonecoDePapel, {
  ItemThumb,
  ListaDeAtributos,
  bordaPorRaridade,
  mapaVazioDeSlots,
  type Propriedades,
  type Slot,
} from "@/components/equipment/BonecoDePapel";
import EquipmentSetSummary from "@/components/equipment/EquipmentSetSummary";
import type { EquipmentSetSummary as EquipmentSetSummaryType } from "@/types/equipmentSets";

// Instância de equipamento (Inventário v2) — solta no inventário, ainda
// não equipada nem anunciada.
interface InstanciaApi {
  id: number;
  id_item: number;
  nome: string;
  tipo_item: string;
  raridade: string;
  imagem_url: string | null;
  refinamento: number;
  propriedades_base: Propriedades;
  propriedades_efetivas: Propriedades;
}

interface EquipadoApi {
  slot: Slot;
  id_instancia: number | null;
  id_item: number;
  nome: string;
  tipo_item: string;
  raridade: string;
  imagem_url: string | null;
  refinamento: number;
  propriedades_base: Propriedades;
  propriedades_efetivas: Propriedades;
}

export default function EquipmentPanel({ classe }: { classe?: string }) {
  const [equipamentos, setEquipamentos] = useState<Record<Slot, EquipadoApi | null>>(
    mapaVazioDeSlots<EquipadoApi>(),
  );
  const [instancias, setInstancias] = useState<InstanciaApi[]>([]);
  const [equipmentSets, setEquipmentSets] = useState<EquipmentSetSummaryType[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [itemSelecionado, setItemSelecionado] = useState<number | null>(null);
  const [processando, setProcessando] = useState(false);
  const { refreshCharacter } = useCharacter();

  const carregarTudo = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{
        data?: {
          equipmentInstances?: InstanciaApi[];
          equipped?: EquipadoApi[];
          equipmentSets?: EquipmentSetSummaryType[];
        };
      }>("/inventory/v2");

      const mapaEquipado = mapaVazioDeSlots<EquipadoApi>();
      for (const linha of resp.data?.data?.equipped ?? []) {
        mapaEquipado[linha.slot] = linha;
      }
      setEquipamentos(mapaEquipado);
      setInstancias(resp.data?.data?.equipmentInstances ?? []);
      setEquipmentSets(resp.data?.data?.equipmentSets ?? []);
    } catch (error) {
      console.error("Erro ao carregar equipamento/inventário:", error);
      setMensagem("Não foi possível carregar seu equipamento.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  async function equipar(idInstancia: number) {
    setProcessando(true);
    setMensagem("");
    try {
      await axiosInstance.post(`/equipment/instances/${idInstancia}/equip`);
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
      await axiosInstance.post(`/equipment/slots/${slot}/unequip`);
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
  // O slot clicado é só um gatilho visual — o slot de destino de
  // verdade é sempre resolvido no backend a partir do próprio item
  // (equipmentInstanceService.resolverSlot, Inventário v2), nunca do
  // que foi clicado aqui.
  function clicarSlot() {
    if (processando || itemSelecionado === null) return;
    equipar(itemSelecionado);
  }

  function clicarItemInventario(idInstancia: number) {
    if (processando) return;
    setItemSelecionado((atual) => (atual === idInstancia ? null : idInstancia));
  }

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

      <BonecoDePapel
        classe={classe}
        equipados={equipamentos}
        aguardandoEscolha={itemSelecionado !== null}
        processando={processando}
        onClicarSlot={() => clicarSlot()}
        onDesequipar={desequipar}
      />

      <EquipmentSetSummary sets={equipmentSets} />

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
      {instancias.length === 0 ? (
        <p className="text-sm text-white/60">
          Você não tem nenhum item equipável disponível no inventário.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {instancias.map((instancia) => {
            const selecionado = itemSelecionado === instancia.id;
            return (
              <div
                key={instancia.id}
                role="button"
                tabIndex={0}
                onClick={() => clicarItemInventario(instancia.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    clicarItemInventario(instancia.id);
                  }
                }}
                className={`group relative z-10 h-16 w-16 cursor-pointer select-none rounded-lg border-2 bg-[#3a2f24] transition hover:z-20 hover:scale-110 ${
                  selecionado
                    ? "border-[#F3B43F] ring-2 ring-[#F3B43F]/70"
                    : `${bordaPorRaridade(instancia.raridade)} hover:border-[#F3B43F]`
                }`}
              >
                <ItemThumb item={instancia} className="h-full w-full p-2" />
                {instancia.refinamento > 0 && (
                  <span className="pointer-events-none absolute -bottom-1 -right-1 rounded bg-black/80 px-1 text-[9px] font-bold text-[#F3B43F]">
                    +{instancia.refinamento}
                  </span>
                )}

                {/* Nome/atributos só aparecem no hover, flutuando acima do
                    item em vez de caber dentro da caixinha 16x16. */}
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-36 -translate-x-1/2 rounded-md bg-black/90 p-2 text-center opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  <span className="block text-[10px] font-bold leading-tight text-white">
                    {instancia.nome}
                    {instancia.refinamento > 0 && ` +${instancia.refinamento}`}
                  </span>
                  <span className="block text-[9px] text-white/50">
                    {instancia.tipo_item}
                  </span>
                  <div className="mt-1 text-[9px] leading-tight text-white/90">
                    <ListaDeAtributos base={instancia.propriedades_base} efetivo={instancia.propriedades_efetivas} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
