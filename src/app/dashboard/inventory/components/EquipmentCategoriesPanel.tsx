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

interface PropriedadesArma {
  dano_min: number;
  dano_max: number;
  tipo_dano: "Fisico" | "Magico";
  bonus_atributo: Atributo;
  valor_bonus_atributo: number;
}

interface PropriedadesArmadura {
  slot_equipamento: string;
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

// Instância de equipamento (Inventário v2) — nunca mais um stack com
// "x3": cada cópia é sua própria linha, com refinamento próprio.
interface InstanciaApi {
  id: number;
  id_item: number;
  nome: string;
  tipo_item: string;
  raridade: string;
  imagem_url: string | null;
  refinamento: number;
  estado: "Inventario" | "Equipada" | "Mercado";
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

// Compara base x efetivo pra só mostrar o "de X pra Y" quando o
// refinamento realmente muda alguma coisa (+0 não muda nada).
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
            <span className="font-bold text-[#F3B43F]">
              +{efetivo.valor_bonus_atributo}
              {efetivo.valor_bonus_atributo !== base.valor_bonus_atributo && (
                <span className="text-white/40"> (base +{base.valor_bonus_atributo})</span>
              )}
            </span>{" "}
            {NOME_ATRIBUTO[efetivo.bonus_atributo]}
          </li>
        )}
      </ul>
    );
  }

  if (efetivo && !ehArma(efetivo) && base && !ehArma(base)) {
    const bonus: [Atributo, number, number][] = [
      ["Forca", efetivo.bonus_forca, base.bonus_forca],
      ["Vitalidade", efetivo.bonus_vitalidade, base.bonus_vitalidade],
      ["Inteligencia", efetivo.bonus_inteligencia, base.bonus_inteligencia],
      ["Agilidade", efetivo.bonus_agilidade, base.bonus_agilidade],
      ["Velocidade", efetivo.bonus_velocidade, base.bonus_velocidade],
    ];
    return (
      <ul className="space-y-0.5">
        {efetivo.defesa > 0 && (
          <li>
            <span className="font-bold text-[#F3B43F]">Defesa:</span> {efetivo.defesa}
            {efetivo.defesa !== base.defesa && <span className="text-white/40"> (base {base.defesa})</span>}
          </li>
        )}
        {bonus
          .filter(([, valor]) => valor > 0)
          .map(([atributo, valor, valorBase]) => (
            <li key={atributo}>
              <span className="font-bold text-[#F3B43F]">
                +{valor}
                {valor !== valorBase && <span className="text-white/40"> (base +{valorBase})</span>}
              </span>{" "}
              {NOME_ATRIBUTO[atributo]}
            </li>
          ))}
      </ul>
    );
  }

  return null;
}

const SECOES: {
  slot: Slot;
  titulo: string;
  filtro: (instancia: InstanciaApi) => boolean;
}[] = [
  { slot: "Cabeca", titulo: "Cabeça", filtro: (i) => i.tipo_item === "Capacete" },
  {
    slot: "Torso",
    titulo: "Tronco",
    filtro: (i) => i.tipo_item === "Armadura" && !ehArma(i.propriedades_base) && i.propriedades_base?.slot_equipamento === "Torso",
  },
  {
    slot: "Pes",
    titulo: "Pé",
    filtro: (i) => i.tipo_item === "Armadura" && !ehArma(i.propriedades_base) && i.propriedades_base?.slot_equipamento === "Pes",
  },
  { slot: "ArmaPrincipal", titulo: "Mão (arma)", filtro: (i) => i.tipo_item === "Arma" },
  { slot: "ArmaSecundaria", titulo: "Mão (Escudo)", filtro: (i) => i.tipo_item === "Escudo" },
  { slot: "Acessorio1", titulo: "Anel", filtro: (i) => i.tipo_item === "Acessorio1" },
  { slot: "Acessorio2", titulo: "Colar", filtro: (i) => i.tipo_item === "Acessorio2" },
];

function ItemThumb({ item }: { item: { imagem_url: string | null; nome: string } }) {
  const src = resolveMediaUrl(item.imagem_url);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={item.nome} className="h-full w-full rounded-lg object-contain p-1" />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center rounded-lg text-lg font-bold text-[#F3B43F]/80">
      {item.nome.charAt(0).toUpperCase()}
    </div>
  );
}

export default function EquipmentCategoriesPanel() {
  const { refreshCharacter } = useCharacter();
  const [instancias, setInstancias] = useState<InstanciaApi[]>([]);
  const [equipados, setEquipados] = useState<Partial<Record<Slot, EquipadoApi>>>({});
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [processando, setProcessando] = useState(false);
  const [selecionado, setSelecionado] = useState<{ slot: Slot; idInstancia: number } | null>(null);

  const carregar = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{
        data?: { equipmentInstances?: InstanciaApi[]; equipped?: EquipadoApi[] };
      }>("/inventory/v2");
      setInstancias(resp.data?.data?.equipmentInstances ?? []);
      const mapa: Partial<Record<Slot, EquipadoApi>> = {};
      for (const linha of resp.data?.data?.equipped ?? []) {
        mapa[linha.slot] = linha;
      }
      setEquipados(mapa);
    } catch (error) {
      console.error("Erro ao carregar equipamentos:", error);
      setMensagem("Não foi possível carregar seus equipamentos.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function equipar(idInstancia: number) {
    if (processando) return;
    setProcessando(true);
    setMensagem("");
    try {
      await axiosInstance.post(`/equipment/instances/${idInstancia}/equip`);
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
      await axiosInstance.post(`/equipment/slots/${slot}/unequip`);
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

  return (
    <div className="flex flex-col gap-4">
      {mensagem && (
        <p className="rounded-xl bg-red-900/30 p-3 text-sm text-red-300">{mensagem}</p>
      )}

      {SECOES.map(({ slot, titulo, filtro }) => {
        const equipadoNoSlot = equipados[slot];
        const disponiveis = instancias.filter(filtro);

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

            {equipadoNoSlot && (
              <p className="mb-3 text-center text-xs text-white/60">
                Equipado:{" "}
                <span className="font-bold text-[#F3B43F]">
                  {equipadoNoSlot.nome}
                  {equipadoNoSlot.refinamento > 0 && ` +${equipadoNoSlot.refinamento}`}
                </span>{" "}
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
                {disponiveis.map((instancia) => {
                  const marcado = selecionado?.slot === slot && selecionado.idInstancia === instancia.id;
                  return (
                    <button
                      key={instancia.id}
                      type="button"
                      onClick={() =>
                        setSelecionado((atual) =>
                          atual?.idInstancia === instancia.id ? null : { slot, idInstancia: instancia.id },
                        )
                      }
                      className={`group relative z-10 h-16 w-16 overflow-visible rounded-lg border-2 bg-[#3a2f24] transition hover:z-20 ${
                        marcado
                          ? "border-[#F3B43F] ring-2 ring-[#F3B43F]/70"
                          : `${bordaPorRaridade(instancia.raridade)} hover:border-[#F3B43F]`
                      }`}
                    >
                      <div className="h-full w-full overflow-hidden rounded-lg">
                        <ItemThumb item={instancia} />
                      </div>
                      {instancia.refinamento > 0 && (
                        <span className="pointer-events-none absolute -bottom-1 -right-1 rounded bg-black/80 px-1 text-[9px] font-bold text-[#F3B43F]">
                          +{instancia.refinamento}
                        </span>
                      )}

                      {/* Nome/atributos só aparecem no hover, flutuando
                          acima do item. */}
                      <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-40 -translate-x-1/2 rounded-md bg-black/90 p-2 text-center opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                        <span className="block text-[10px] font-bold leading-tight text-white">
                          {instancia.nome}
                          {instancia.refinamento > 0 && ` +${instancia.refinamento}`}
                        </span>
                        <div className="mt-1 text-[9px] leading-tight text-white/90">
                          <ListaDeAtributos base={instancia.propriedades_base} efetivo={instancia.propriedades_efetivas} />
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
                onClick={() => selecionado && selecionado.slot === slot && equipar(selecionado.idInstancia)}
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
