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

type Atributo = "Forca" | "Vitalidade" | "Inteligencia" | "Agilidade" | "Velocidade";

const NOME_ATRIBUTO: Record<Atributo, string> = {
  Forca: "Força",
  Vitalidade: "Vitalidade",
  Inteligencia: "Inteligência",
  Agilidade: "Agilidade",
  Velocidade: "Velocidade",
};

// Mesma escala de cor por raridade que a Loja já usa (ShopItem) — repetida
// aqui pra dar a mesma pista visual no boneco de papel e no inventário.
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

interface PropriedadesArma {
  dano_min: number;
  dano_max: number;
  tipo_dano: "Fisico" | "Magico";
  bonus_atributo: Atributo;
  valor_bonus_atributo: number;
}

interface PropriedadesArmadura {
  defesa: number;
  bonus_forca: number;
  bonus_vitalidade: number;
  bonus_inteligencia: number;
  bonus_agilidade: number;
  bonus_velocidade: number;
}

type Propriedades = PropriedadesArma | PropriedadesArmadura | null;

function ehArma(p: Propriedades): p is PropriedadesArma {
  return !!p && "dano_min" in p;
}

// Mesma lista compacta de atributos que a Loja já mostra (ShopItem) —
// já mostra o valor EFETIVO (pós-refinamento) e, se diferente da base,
// a base riscada/entre parênteses.
function ListaDeAtributos({ base, efetivo }: { base: Propriedades; efetivo: Propriedades }) {
  if (ehArma(efetivo) && ehArma(base)) {
    return (
      <ul className="space-y-0.5">
        <li>
          <span className="font-bold text-[#F3B43F]">Dano:</span>{" "}
          {efetivo.dano_min !== base.dano_min || efetivo.dano_max !== base.dano_max ? (
            <>
              <span className="text-white/40 line-through">{base.dano_min}–{base.dano_max}</span>{" "}
              {efetivo.dano_min}–{efetivo.dano_max}
            </>
          ) : (
            `${efetivo.dano_min}–${efetivo.dano_max}`
          )}{" "}
          ({efetivo.tipo_dano === "Fisico" ? "Físico" : "Mágico"})
        </li>
        {efetivo.valor_bonus_atributo > 0 && (
          <li>
            <span className="font-bold text-[#F3B43F]">+{efetivo.valor_bonus_atributo}</span>{" "}
            {NOME_ATRIBUTO[efetivo.bonus_atributo]}
          </li>
        )}
      </ul>
    );
  }

  if (efetivo && !ehArma(efetivo) && base && !ehArma(base)) {
    const bonus: [Atributo, number][] = [
      ["Forca", efetivo.bonus_forca],
      ["Vitalidade", efetivo.bonus_vitalidade],
      ["Inteligencia", efetivo.bonus_inteligencia],
      ["Agilidade", efetivo.bonus_agilidade],
      ["Velocidade", efetivo.bonus_velocidade],
    ];
    return (
      <ul className="space-y-0.5">
        {efetivo.defesa > 0 && (
          <li>
            <span className="font-bold text-[#F3B43F]">Defesa:</span> {efetivo.defesa}
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

// Enquanto o item não tem `imagem_url` própria (a maioria, por ora — só a
// Espada de Ferro tem), mostra a inicial do nome num badge em vez de um
// ícone genérico/quebrado.
function ItemThumb({ item, className = "" }: { item: { imagem_url: string | null; nome: string }; className?: string }) {
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
  const [equipamentos, setEquipamentos] = useState<
    Record<Slot, EquipadoApi | null>
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
  const [instancias, setInstancias] = useState<InstanciaApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [itemSelecionado, setItemSelecionado] = useState<number | null>(null);
  const [processando, setProcessando] = useState(false);
  const { refreshCharacter } = useCharacter();

  const carregarTudo = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{
        data?: { equipmentInstances?: InstanciaApi[]; equipped?: EquipadoApi[] };
      }>("/inventory/v2");

      const mapaEquipado: Record<Slot, EquipadoApi | null> = {
        Cabeca: null,
        Torso: null,
        Maos: null,
        Pes: null,
        ArmaPrincipal: null,
        ArmaSecundaria: null,
        Acessorio1: null,
        Acessorio2: null,
      };
      for (const linha of resp.data?.data?.equipped ?? []) {
        mapaEquipado[linha.slot] = linha;
      }
      setEquipamentos(mapaEquipado);
      setInstancias(resp.data?.data?.equipmentInstances ?? []);
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

      <div
        className="relative mx-auto mb-5 aspect-square w-full max-w-sm rounded-2xl border border-white/10 bg-[#3a2f24] bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${getClassBackground(classe)})` }}
      >
        {SLOTS.map(({ slot, label, top, left, pequeno }) => {
          const itemNoSlot = equipamentos[slot];
          const aguardandoEscolha = itemSelecionado !== null;
          // Tooltip flutua pra cima quando o slot fica na metade de baixo do
          // boneco (senão nasceria fora da tela pra cima), e pra baixo nos
          // slots de cima — sem isso um tooltip de várias linhas (nome +
          // atributos) num slot perto da borda ficava cortado.
          const tooltipEmCima = parseFloat(top) >= 50;
          return (
            <div
              key={slot}
              onClick={() => clicarSlot()}
              style={{ top, left }}
              className={`group absolute z-10 -translate-x-1/2 -translate-y-1/2 hover:z-20 ${
                pequeno ? "h-12 w-12" : "h-16 w-16"
              } ${aguardandoEscolha ? "cursor-pointer" : ""}`}
            >
              <div
                className={`relative h-full w-full overflow-hidden rounded-lg border-2 transition-colors ${
                  aguardandoEscolha
                    ? "border-[#F3B43F] bg-[#3a2f24]"
                    : itemNoSlot
                      ? `${bordaPorRaridade(itemNoSlot.raridade)} bg-[#1c150f]`
                      : "border-dashed border-white/40 bg-black/60"
                }`}
              >
                {itemNoSlot && (
                  <ItemThumb item={itemNoSlot} className="h-full w-full p-2" />
                )}
                {itemNoSlot && itemNoSlot.refinamento > 0 && (
                  <span className="pointer-events-none absolute -bottom-1 -right-1 rounded bg-black/80 px-1 text-[9px] font-bold text-[#F3B43F]">
                    +{itemNoSlot.refinamento}
                  </span>
                )}
              </div>

              {/* Nome/atributos só aparecem no hover — o resto do tempo é só
                  a imagem (ou o box vazio), pra manter o boneco de papel
                  limpo. Flutua por cima de tudo em vez de caber dentro do
                  slot (que é pequeno demais pra várias linhas). */}
              <div
                className={`pointer-events-none absolute left-1/2 w-36 -translate-x-1/2 rounded-md bg-black/90 p-2 text-center opacity-0 shadow-lg transition-opacity group-hover:opacity-100 ${
                  tooltipEmCima ? "bottom-full mb-2" : "top-full mt-2"
                }`}
              >
                <span className="block text-[9px] uppercase tracking-wide text-white/60">
                  {label}
                </span>
                {itemNoSlot ? (
                  <>
                    <span className="block text-[10px] font-bold leading-tight text-[#F3B43F]">
                      {itemNoSlot.nome}
                      {itemNoSlot.refinamento > 0 && ` +${itemNoSlot.refinamento}`}
                    </span>
                    <div className="mt-1 text-[9px] leading-tight text-white/90">
                      <ListaDeAtributos base={itemNoSlot.propriedades_base} efetivo={itemNoSlot.propriedades_efetivas} />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        desequipar(slot);
                      }}
                      disabled={processando}
                      className="pointer-events-auto mt-1 text-[9px] text-white/60 underline hover:text-white disabled:opacity-50"
                    >
                      desequipar
                    </button>
                  </>
                ) : (
                  <span className="block text-[9px] text-white/40">Vazio</span>
                )}
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
                className={`group relative z-10 h-16 w-16 cursor-pointer select-none rounded-lg border-2 bg-[#3a2f24] transition-colors hover:z-20 ${
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
