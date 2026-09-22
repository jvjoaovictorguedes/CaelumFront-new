"use client";

import { useMemo, useState } from "react";
import ShopItem, { type ShopItemData } from "./ShopItem";

type Secao = "Equipamentos" | "Consumiveis" | "Materiais";

// "Botas" é Armadura com slot_equipamento "Pes" — mesmo tipo_item das
// peças de peito, só separadas aqui como filtro pra facilitar achar.
function ehBota(item: ShopItemData) {
  return item.tipo_item === "Armadura" && item.armorProperties?.slot_equipamento === "Pes";
}

const SECOES: { chave: Secao; titulo: string; pertence: (item: ShopItemData) => boolean }[] = [
  {
    chave: "Equipamentos",
    titulo: "Equipamentos",
    pertence: (item) =>
      item.tipo_item === "Arma" ||
      item.tipo_item === "Escudo" ||
      item.tipo_item === "Capacete" ||
      item.tipo_item === "Armadura" ||
      item.tipo_item === "Acessorio1" ||
      item.tipo_item === "Acessorio2",
  },
  { chave: "Consumiveis", titulo: "Consumíveis", pertence: (item) => item.tipo_item === "Consumivel" },
  { chave: "Materiais", titulo: "Materiais", pertence: (item) => item.tipo_item === "Material" },
];

// Só "Equipamentos" ganha os filtros de subtipo (estilo loja de LoL:
// desmarcar um papel some com os itens dele na hora) — as demais seções
// já são pequenas o bastante pra não precisar disso. Acessórios e
// Botas moram aqui dentro de Equipamentos, não em seções próprias —
// cada um com seu próprio filtro pra continuar fácil de achar.
const FILTROS_EQUIPAMENTO: { chave: string; label: string; pertence: (item: ShopItemData) => boolean }[] = [
  { chave: "Arma", label: "Armas", pertence: (item) => item.tipo_item === "Arma" },
  { chave: "Escudo", label: "Escudos", pertence: (item) => item.tipo_item === "Escudo" },
  { chave: "Capacete", label: "Elmos", pertence: (item) => item.tipo_item === "Capacete" },
  { chave: "Armadura", label: "Armaduras", pertence: (item) => item.tipo_item === "Armadura" && !ehBota(item) },
  { chave: "Botas", label: "Botas", pertence: ehBota },
  {
    chave: "Acessorio",
    label: "Acessórios",
    pertence: (item) => item.tipo_item === "Acessorio1" || item.tipo_item === "Acessorio2",
  },
];

interface ShopCatalogProps {
  itens: ShopItemData[];
  characterId?: number;
  moedas: number;
  classeDoPersonagem?: string;
}

export default function ShopCatalog({
  itens,
  characterId,
  moedas,
  classeDoPersonagem,
}: ShopCatalogProps) {
  const secoesComItens = useMemo(
    () =>
      SECOES.map((secao) => ({
        ...secao,
        itens: itens.filter((item) => secao.pertence(item)),
      })).filter((secao) => secao.itens.length > 0),
    [itens],
  );

  const [secaoAtiva, setSecaoAtiva] = useState<Secao>(
    () => secoesComItens[0]?.chave ?? "Equipamentos",
  );

  // Todos marcados por padrão — igual mostrar tudo, só filtra quando o
  // jogador desmarca algum papel específico.
  const [filtrosEquipamento, setFiltrosEquipamento] = useState<Set<string>>(
    () => new Set(FILTROS_EQUIPAMENTO.map((f) => f.chave)),
  );

  function alternarFiltro(chave: string) {
    setFiltrosEquipamento((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(chave)) {
        proximo.delete(chave);
      } else {
        proximo.add(chave);
      }
      return proximo;
    });
  }

  const secaoSelecionada = secoesComItens.find((secao) => secao.chave === secaoAtiva) ?? secoesComItens[0];

  const filtrosDisponiveis = FILTROS_EQUIPAMENTO.filter((filtro) =>
    secaoSelecionada?.itens.some((item) => filtro.pertence(item)),
  );

  const itensExibidos =
    secaoSelecionada?.chave === "Equipamentos"
      ? secaoSelecionada.itens.filter((item) =>
          FILTROS_EQUIPAMENTO.some((f) => filtrosEquipamento.has(f.chave) && f.pertence(item)),
        )
      : (secaoSelecionada?.itens ?? []);

  if (secoesComItens.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#292018]/80 p-8 text-center text-white/60">
        Nenhum item disponível na loja no momento.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* SEÇÕES: Equipamentos / Consumíveis / Materiais */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {secoesComItens.map((secao) => {
          const ativa = secao.chave === secaoAtiva;
          return (
            <button
              key={secao.chave}
              type="button"
              onClick={() => setSecaoAtiva(secao.chave)}
              className={`rounded-lg px-4 py-2 font-imFeel text-xl transition ${
                ativa
                  ? "bg-[#F3B43F] text-[#292018] shadow"
                  : "bg-[#292018]/80 text-white/70 hover:bg-[#292018]"
              }`}
            >
              {secao.titulo}{" "}
              <span className={ativa ? "text-[#292018]/70" : "text-white/40"}>
                ({secao.itens.length})
              </span>
            </button>
          );
        })}
      </div>

      {/* FILTROS DE SUBTIPO — só dentro de Equipamentos */}
      {secaoSelecionada?.chave === "Equipamentos" && filtrosDisponiveis.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filtrosDisponiveis.map(({ chave, label }) => {
            const marcado = filtrosEquipamento.has(chave);
            return (
              <label
                key={chave}
                className={`flex cursor-pointer select-none items-center gap-2 rounded-full border-2 px-3 py-1.5 text-sm font-bold transition ${
                  marcado
                    ? "border-[#F3B43F] bg-[#F3B43F] text-[#292018]"
                    : "border-white/20 bg-transparent text-white/40 hover:border-white/40 hover:text-white/70"
                }`}
              >
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => alternarFiltro(chave)}
                  className="h-3.5 w-3.5 accent-[#F3B43F]"
                />
                {label}
              </label>
            );
          })}
        </div>
      )}

      {/* GRADE DE ITENS DA SEÇÃO/FILTRO ATUAL */}
      {itensExibidos.length > 0 ? (
        <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {itensExibidos.map((item) => (
            <ShopItem
              key={item.id}
              characterId={characterId}
              initialCoins={moedas}
              item={item}
              classeDoPersonagem={classeDoPersonagem}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#292018]/80 p-8 text-center text-white/60">
          {secaoSelecionada?.chave === "Equipamentos"
            ? "Nenhum filtro marcado — selecione ao menos um tipo de equipamento acima."
            : "Nenhum item nessa seção no momento."}
        </div>
      )}
    </div>
  );
}
