"use client";

// Boneco de papel compartilhado entre "Meu Personagem > Equipamentos"
// (com ações de equipar/desequipar) e o Perfil de Jogador (só leitura).
import { getClassBackground, resolveMediaUrl } from "@/utils/media-url";

export type Slot =
  | "Cabeca"
  | "Torso"
  | "Pes"
  | "ArmaPrincipal"
  | "ArmaSecundaria"
  | "Acessorio1"
  | "Acessorio2";

// Acessórios ficam fora da silhueta (não há arte de cinto/colar no
// personagem), flutuando nas laterais sem sobrepor arma/escudo.
export const SLOTS: { slot: Slot; label: string; top: string; left: string; pequeno?: boolean }[] = [
  { slot: "Cabeca", label: "Cabeça", top: "8%", left: "50%" },
  { slot: "Torso", label: "Torso", top: "32%", left: "50%" },
  { slot: "ArmaPrincipal", label: "Arma Principal", top: "48%", left: "12%" },
  { slot: "ArmaSecundaria", label: "Arma Secundária", top: "48%", left: "88%" },
  { slot: "Pes", label: "Pés", top: "92%", left: "50%" },
  { slot: "Acessorio1", label: "Anel", top: "74%", left: "10%", pequeno: true },
  { slot: "Acessorio2", label: "Colar", top: "16%", left: "90%", pequeno: true },
];

export function mapaVazioDeSlots<T>(): Record<Slot, T | null> {
  return {
    Cabeca: null,
    Torso: null,
    Pes: null,
    ArmaPrincipal: null,
    ArmaSecundaria: null,
    Acessorio1: null,
    Acessorio2: null,
  };
}

type Atributo = "Forca" | "Vitalidade" | "Inteligencia" | "Agilidade" | "Velocidade";

const NOME_ATRIBUTO: Record<Atributo, string> = {
  Forca: "Força",
  Vitalidade: "Vitalidade",
  Inteligencia: "Inteligência",
  Agilidade: "Agilidade",
  Velocidade: "Velocidade",
};

const BORDA_RARIDADE: Record<string, string> = {
  comum: "border-[#9CA3AF]/80",
  incomum: "border-[#4ADE80]/80",
  raro: "border-[#60A5FA]/80",
  epico: "border-[#C084FC]/80",
  lendario: "border-[#FB923C]/80",
  mitico: "border-[#F87171]/80",
};

export function bordaPorRaridade(raridade?: string) {
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

export type Propriedades = PropriedadesArma | PropriedadesArmadura | null;

function ehArma(p: Propriedades): p is PropriedadesArma {
  return !!p && "dano_min" in p;
}

// Valor EFETIVO (pós-refinamento) e, se diferente, a base riscada.
export function ListaDeAtributos({ base, efetivo }: { base: Propriedades; efetivo: Propriedades }) {
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

// Sem imagem própria, mostra a inicial do nome em vez de um ícone quebrado.
export function ItemThumb({ item, className = "" }: { item: { imagem_url: string | null; nome: string }; className?: string }) {
  const src = resolveMediaUrl(item.imagem_url);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={item.nome} className={`object-contain ${className}`} />;
  }
  return (
    <div className={`flex items-center justify-center text-lg font-bold text-[#F3B43F]/80 ${className}`}>
      {item.nome.charAt(0).toUpperCase()}
    </div>
  );
}

export interface ItemEquipado {
  slot: Slot;
  nome: string;
  raridade: string;
  imagem_url: string | null;
  refinamento: number;
  tier_equipamento?: number | null;
  propriedades_base: Propriedades;
  propriedades_efetivas: Propriedades;
}

export default function BonecoDePapel({
  classe,
  equipados,
  aguardandoEscolha = false,
  processando = false,
  onClicarSlot,
  onDesequipar,
}: {
  classe?: string | null;
  equipados: Record<Slot, ItemEquipado | null>;
  aguardandoEscolha?: boolean;
  processando?: boolean;
  onClicarSlot?: (slot: Slot) => void;
  // Ausente = modo só leitura (sem link "desequipar" no tooltip).
  onDesequipar?: (slot: Slot) => void;
}) {
  return (
    <div
      className="relative mx-auto mb-5 aspect-square w-full max-w-sm rounded-2xl border border-white/10 bg-[#3a2f24] bg-contain bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${getClassBackground(classe ?? undefined)})` }}
    >
      {SLOTS.map(({ slot, label, top, left, pequeno }) => {
        const itemNoSlot = equipados[slot];
        // Tooltip abre pra cima na metade de baixo do boneco, senão ficaria cortado.
        const tooltipEmCima = parseFloat(top) >= 50;
        return (
          <div
            key={slot}
            onClick={() => onClicarSlot?.(slot)}
            style={{ top, left }}
            className={`group absolute z-10 -translate-x-1/2 -translate-y-1/2 hover:z-20 ${
              pequeno ? "h-12 w-12" : "h-16 w-16"
            } ${aguardandoEscolha ? "cursor-pointer" : ""}`}
          >
            <div
              className={`relative h-full w-full overflow-hidden rounded-lg border-2 transition duration-150 ${
                aguardandoEscolha
                  ? "border-[#F3B43F] bg-[#3a2f24]"
                  : itemNoSlot
                    ? `${bordaPorRaridade(itemNoSlot.raridade)} bg-[#1c150f]`
                    : "border-dashed border-white/40 bg-black/60"
              } ${itemNoSlot ? "hover:scale-110" : ""}`}
            >
              {itemNoSlot && <ItemThumb item={itemNoSlot} className="h-full w-full p-2" />}
              {itemNoSlot && itemNoSlot.refinamento > 0 && (
                <span className="pointer-events-none absolute -bottom-1 -right-1 rounded bg-black/80 px-1 text-[9px] font-bold text-[#F3B43F]">
                  +{itemNoSlot.refinamento}
                </span>
              )}
            </div>

            <div
              className={`pointer-events-none absolute left-1/2 w-36 -translate-x-1/2 rounded-md bg-black/90 p-2 text-center opacity-0 shadow-lg transition-opacity group-hover:opacity-100 ${
                tooltipEmCima ? "bottom-full mb-2" : "top-full mt-2"
              }`}
            >
              <span className="block text-[9px] uppercase tracking-wide text-white/60">{label}</span>
              {itemNoSlot ? (
                <>
                  <span className="block text-[10px] font-bold leading-tight text-[#F3B43F]">
                    {itemNoSlot.nome}
                    {itemNoSlot.refinamento > 0 && ` +${itemNoSlot.refinamento}`}
                  </span>
                  {itemNoSlot.tier_equipamento ? (
                    <span className="block text-[9px] text-white/50">
                      Tier {itemNoSlot.tier_equipamento} • {itemNoSlot.raridade}
                    </span>
                  ) : null}
                  <div className="mt-1 text-[9px] leading-tight text-white/90">
                    <ListaDeAtributos base={itemNoSlot.propriedades_base} efetivo={itemNoSlot.propriedades_efetivas} />
                  </div>
                  {onDesequipar && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDesequipar(slot);
                      }}
                      disabled={processando}
                      className="pointer-events-auto mt-1 text-[9px] text-white/60 underline hover:text-white disabled:opacity-50"
                    >
                      desequipar
                    </button>
                  )}
                </>
              ) : (
                <span className="block text-[9px] text-white/40">Vazio</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
