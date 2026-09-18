"use client";

import { useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { resolveMediaUrl } from "@/utils/media-url";

type Atributo = "Forca" | "Vitalidade" | "Inteligencia" | "Agilidade" | "Velocidade";

interface WeaponProperties {
  dano_min: number;
  dano_max: number;
  tipo_dano: "Fisico" | "Magico";
  tipo_arma: string;
  bonus_atributo: Atributo;
  valor_bonus_atributo: number;
}

interface ArmorProperties {
  slot_equipamento: string;
  defesa: number;
  bonus_forca: number;
  bonus_vitalidade: number;
  bonus_inteligencia: number;
  bonus_agilidade: number;
  bonus_velocidade: number;
}

interface ConsumableProperties {
  efeito_vida: number;
  efeito_mana: number;
}

export interface ShopItemData {
  id: number;
  nome: string;
  descricao?: string;
  valor_compra: number;
  valor_venda: number;
  imagem_url?: string | null;
  tipo_item:
    | "Arma"
    | "Capacete"
    | "Armadura"
    | "Escudo"
    | "Consumivel"
    | "Material"
    | "Acessorio1"
    | "Acessorio2"
    | "QuestItem"
    | "Currencia";
  raridade?: string;
  disponivel_loja?: boolean;
  // Alias explícito do backend (src/models/associations.js) — não é
  // mais a singularização automática do Sequelize.
  weaponProperties?: WeaponProperties | null;
  armorProperties?: ArmorProperties | null;
  consumableProperties?: ConsumableProperties | null;
}

interface PurchaseResponse {
  data?: {
    character?: {
      dinheiro?: number;
    };
    inventoryEntry?: {
      quantidade?: number;
    };
    quantidadeComprada?: number;
  };
  message?: string;
}

interface PurchaseError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
}

interface ShopItemProps {
  characterId?: number;
  initialCoins: number;
  item: ShopItemData;
  classeDoPersonagem?: string;
}

const NOME_ATRIBUTO: Record<Atributo, string> = {
  Forca: "Força",
  Vitalidade: "Vitalidade",
  Inteligencia: "Inteligência",
  Agilidade: "Agilidade",
  Velocidade: "Velocidade",
};

// Estilo por raridade — a mesma convenção usada na maioria dos RPGs
// (cinza → verde → azul → roxo → laranja → vermelho, do mais comum ao
// mais raro), pra dar reconhecimento imediato sem precisar ler o texto.
const ESTILO_RARIDADE: Record<string, { borda: string; texto: string }> = {
  comum: { borda: "border-[#9CA3AF]/70", texto: "text-[#D1D5DB]" },
  incomum: { borda: "border-[#4ADE80]/70", texto: "text-[#4ADE80]" },
  raro: { borda: "border-[#60A5FA]/70", texto: "text-[#60A5FA]" },
  epico: { borda: "border-[#C084FC]/70", texto: "text-[#C084FC]" },
  lendario: { borda: "border-[#FB923C]/70", texto: "text-[#FB923C]" },
  mitico: { borda: "border-[#F87171]/70", texto: "text-[#F87171]" },
};

const ICONE_POR_TIPO: Record<ShopItemData["tipo_item"], string> = {
  Arma: "⚔️",
  Capacete: "🪖",
  Armadura: "🛡️",
  Escudo: "🛡️",
  Consumivel: "🧪",
  Material: "⛏️",
  Acessorio1: "💍",
  Acessorio2: "📿",
  QuestItem: "📜",
  Currencia: "🪙",
};

// Classe -> atributo que ela mais aproveita. Guerreiro bate mais forte
// com Força, Mago causa mais dano/cura com Inteligência — mesma lógica
// já usada no resto do jogo (combatFormulas.js, multiplicadores de
// classe). Uma classe que não bater com nenhuma entrada aqui simplesmente
// não recebe nenhuma recomendação (comportamento seguro por padrão).
function atributoRecomendadoPorClasse(nomeClasse?: string): Atributo | null {
  if (!nomeClasse) return null;
  const normalizado = nomeClasse.toLowerCase();
  if (normalizado.includes("guerreiro")) return "Forca";
  if (normalizado.includes("mago")) return "Inteligencia";
  return null;
}

// Pra armadura (que tem vários bônus em vez de um só), o "foco" do item é
// o atributo com maior bônus — empate ou tudo zerado não sugere nada.
function atributoPrincipalDaArmadura(armor: ArmorProperties): Atributo | null {
  const bonus: [Atributo, number][] = [
    ["Forca", armor.bonus_forca],
    ["Vitalidade", armor.bonus_vitalidade],
    ["Inteligencia", armor.bonus_inteligencia],
    ["Agilidade", armor.bonus_agilidade],
    ["Velocidade", armor.bonus_velocidade],
  ];
  const maior = bonus.reduce((atual, prox) => (prox[1] > atual[1] ? prox : atual));
  const empatado = bonus.filter(([, valor]) => valor === maior[1]).length > 1;
  if (maior[1] <= 0 || empatado) return null;
  return maior[0];
}

function itemEhRecomendado(item: ShopItemData, atributoRecomendado: Atributo | null) {
  if (!atributoRecomendado) return false;
  if (item.weaponProperties) {
    return item.weaponProperties.bonus_atributo === atributoRecomendado;
  }
  if (item.armorProperties) {
    return atributoPrincipalDaArmadura(item.armorProperties) === atributoRecomendado;
  }
  return false;
}

function ListaDeAtributos({ item }: { item: ShopItemData }) {
  if (item.weaponProperties) {
    const arma = item.weaponProperties;
    return (
      <ul className="mt-3 space-y-1 text-sm">
        <li className="text-white/90">
          <span className="font-bold text-[#F3B43F]">Dano:</span>{" "}
          {arma.dano_min}–{arma.dano_max} ({arma.tipo_dano === "Fisico" ? "Físico" : "Mágico"})
        </li>
        <li className="text-white/90">
          <span className="font-bold text-[#F3B43F]">+{arma.valor_bonus_atributo}</span>{" "}
          {NOME_ATRIBUTO[arma.bonus_atributo]}
        </li>
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
      <ul className="mt-3 space-y-1 text-sm">
        <li className="text-white/90">
          <span className="font-bold text-[#F3B43F]">Defesa:</span> {armor.defesa}
        </li>
        {bonus
          .filter(([, valor]) => valor > 0)
          .map(([atributo, valor]) => (
            <li key={atributo} className="text-white/90">
              <span className="font-bold text-[#F3B43F]">+{valor}</span>{" "}
              {NOME_ATRIBUTO[atributo]}
            </li>
          ))}
      </ul>
    );
  }

  if (item.consumableProperties) {
    const consumivel = item.consumableProperties;
    return (
      <ul className="mt-3 space-y-1 text-sm">
        {consumivel.efeito_vida > 0 && (
          <li className="text-white/90">
            <span className="font-bold text-[#F3B43F]">+{consumivel.efeito_vida}%</span> Vida
          </li>
        )}
        {consumivel.efeito_mana > 0 && (
          <li className="text-white/90">
            <span className="font-bold text-[#F3B43F]">+{consumivel.efeito_mana}%</span> Mana
          </li>
        )}
      </ul>
    );
  }

  return null;
}

export default function ShopItem({
  characterId,
  initialCoins,
  item,
  classeDoPersonagem,
}: ShopItemProps) {
  const [coins, setCoins] = useState(initialCoins);
  const [quantity, setQuantity] = useState(0);
  const [buyAmount, setBuyAmount] = useState(1);
  const [isBuying, setIsBuying] = useState(false);
  const [message, setMessage] = useState("");

  const custoTotal = item.valor_compra * buyAmount;
  const raridadeChave = (item.raridade ?? "comum").toLowerCase();
  const estiloRaridade = ESTILO_RARIDADE[raridadeChave] ?? ESTILO_RARIDADE.comum;
  const imagemResolvida = resolveMediaUrl(item.imagem_url);
  const recomendado = itemEhRecomendado(
    item,
    atributoRecomendadoPorClasse(classeDoPersonagem),
  );

  function ajustarQuantidadeDesejada(valor: number) {
    if (!Number.isFinite(valor)) return;
    setBuyAmount(Math.max(1, Math.min(999, Math.floor(valor))));
  }

  async function buyItem() {
    if (isBuying) return;

    if (!characterId) {
      setMessage("Personagem não identificado.");
      return;
    }

    if (buyAmount < 1) {
      setMessage("Escolha uma quantidade válida.");
      return;
    }

    if (coins < custoTotal) {
      setMessage("Você não tem moedas suficientes.");
      return;
    }

    setIsBuying(true);
    setMessage("");

    try {
      const response = await axiosInstance.post<PurchaseResponse>("/shop/purchase", {
        id_personagem: characterId,
        id_item: item.id,
        quantidade: buyAmount,
      });

      const purchased = response.data?.data?.quantidadeComprada ?? buyAmount;

      const updatedCoins = response.data?.data?.character?.dinheiro ?? coins - custoTotal;

      setCoins(updatedCoins);
      setQuantity((current) => current + purchased);

      setMessage(
        purchased > 1
          ? `${purchased}x ${item.nome} compradas e adicionadas ao inventário.`
          : `${item.nome} comprada e adicionada ao inventário.`,
      );
    } catch (error: unknown) {
      console.error("Erro ao comprar item:", error);

      const apiMessage = (error as PurchaseError).response?.data?.message;

      const errorMessage = (error as PurchaseError).message;

      setMessage(apiMessage ?? errorMessage ?? "Não foi possível concluir a compra.");
    } finally {
      setIsBuying(false);
    }
  }

  return (
    <article
      className={`relative flex flex-col rounded-2xl border-2 bg-[#292018]/90 p-4 text-white shadow-lg ${estiloRaridade.borda}`}
    >
      {recomendado && (
        <span className="absolute right-3 top-3 rounded-full bg-[#F3B43F] px-3 py-1 text-xs font-bold text-[#292018] shadow">
          ✨ Recomendado pra {classeDoPersonagem}
        </span>
      )}

      {/* IMAGEM */}
      <div className="mb-4 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-[#3a2f24]">
        {imagemResolvida ? (
          <img
            src={imagemResolvida}
            alt={item.nome}
            className="h-full w-full object-contain p-4 opacity-90"
          />
        ) : (
          <span className="text-6xl" aria-hidden="true">
            {ICONE_POR_TIPO[item.tipo_item] ?? "📦"}
          </span>
        )}
      </div>

      {/* INFORMAÇÕES */}
      <div className="flex-1">
        <p className={`text-sm font-bold uppercase tracking-widest ${estiloRaridade.texto}`}>
          {item.tipo_item} · {item.raridade ?? "Comum"}
        </p>

        <h2 className="mt-1 font-imFeel text-3xl">{item.nome}</h2>

        <p className="mt-2 text-white/70">
          {item.descricao ?? "Item disponível para compra."}
        </p>

        <ListaDeAtributos item={item} />
      </div>

      {/* PREÇO + QUANTIDADE + BOTÃO */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-4">
        <div>
          <p className="text-xl font-bold text-[#F3B43F]">
            {custoTotal} {custoTotal === 1 ? "moeda" : "moedas"}
            {buyAmount > 1 && (
              <span className="ml-1 text-sm font-normal text-white/60">
                ({item.valor_compra} cada)
              </span>
            )}
          </p>

          {quantity > 0 && (
            <p className="text-sm text-white/70">No inventário: x{quantity}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={999}
            value={buyAmount}
            disabled={isBuying}
            onChange={(e) => ajustarQuantidadeDesejada(Number(e.target.value))}
            className="w-16 rounded-lg border border-white/20 bg-[#3a2f24] px-2 py-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-[#F3B43F] disabled:opacity-50"
            aria-label={`Quantidade de ${item.nome} para comprar`}
          />

          <button
            type="button"
            onClick={buyItem}
            disabled={isBuying || coins < custoTotal}
            className="rounded-lg bg-[#F3B43F] px-4 py-2 font-bold text-[#292018] transition hover:bg-[#ffd477] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBuying ? "Comprando..." : "Comprar"}
          </button>
        </div>
      </div>

      {/* MOEDAS */}
      <p className="mt-3 text-sm font-bold text-[#F3B43F]">Moedas: {coins}</p>

      {/* MENSAGEM */}
      {message && <p className="mt-2 text-sm text-white/80">{message}</p>}
    </article>
  );
}
