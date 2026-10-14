"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { resolveMediaUrl } from "@/utils/media-url";
import { useCharacter } from "@/contexts/CharacterContext";
import ItemIcon from "@/components/Item/ItemIcon";
import { OPCOES_ORDENACAO, ordenarInventario, type CriterioOrdenacaoInventario } from "@/lib/inventorySort";
import { useTooltipFixo } from "@/hooks/useTooltipSide";
import TooltipFixo from "@/components/TooltipFixo";

interface ConsumablePropertiesApi {
  efeito_vida: number;
  efeito_mana: number;
  efeito_reset_atributos?: boolean;
}

interface ItemInfo {
  id: number;
  nome: string;
  tipo_item: string;
  raridade: string;
  imagem_url?: string | null;
  descricao?: string | null;
  consumableProperties?: ConsumablePropertiesApi | null;
}

interface InventarioEntry {
  id_personagem_inventario: number;
  quantidade: number;
  Item: ItemInfo;
}

// Mesmo dado/redação do card da Loja (ShopItem.tsx) — o jogador que já
// tem o consumível no inventário precisa poder ver de novo o que ele
// faz sem ter que voltar pra Loja, especialmente pra decidir QUAL usar
// (ex.: poção de vida vs. de mana) num aperto.
function StatsDoConsumivel({ item }: { item: ItemInfo }) {
  const props = item.consumableProperties;
  const temEfeitoNumerico = (props?.efeito_vida ?? 0) > 0 || (props?.efeito_mana ?? 0) > 0;
  const resetaAtributos = props?.efeito_reset_atributos ?? false;

  if (!temEfeitoNumerico && !resetaAtributos && !item.descricao) return null;

  return (
    <div className="mt-1 flex flex-col items-center gap-1 text-center">
      {temEfeitoNumerico && (
        <p className="flex flex-wrap items-center justify-center gap-x-2 text-xs">
          {props!.efeito_vida > 0 && (
            <span>
              <span className="font-bold text-[#F3B43F]">+{props!.efeito_vida}%</span> Vida
            </span>
          )}
          {props!.efeito_mana > 0 && (
            <span>
              <span className="font-bold text-[#F3B43F]">+{props!.efeito_mana}%</span> Mana
            </span>
          )}
        </p>
      )}
      {resetaAtributos && (
        <p className="text-xs">
          <span className="font-bold text-[#F3B43F]">Reseta seus atributos</span> — devolve os
          pontos livres pra redistribuir, nunca abaixo do mínimo da sua raça.
        </p>
      )}
      {item.descricao && <p className="max-w-xs text-xs text-white/60">{item.descricao}</p>}
    </div>
  );
}

// Componente próprio por item (não inline no .map()) porque a direção
// do tooltip precisa de estado/medição POR CARD — um hook não pode
// viver dentro de um callback de .map() sem virar hook-em-loop.
function ConsumivelCard({
  entrada,
  selecionado,
  aoSelecionar,
}: {
  entrada: InventarioEntry;
  selecionado: boolean;
  aoSelecionar: () => void;
}) {
  const { gatilhoRef, tooltipRef, posicao, hover, aoEntrar, aoSair } = useTooltipFixo<HTMLButtonElement>();

  return (
    <button
      ref={gatilhoRef}
      type="button"
      onClick={aoSelecionar}
      onMouseEnter={aoEntrar}
      onMouseLeave={aoSair}
      className={`group relative z-10 h-16 w-16 overflow-visible rounded-lg border-2 bg-[#3a2f24] transition duration-150 hover:z-20 hover:scale-110 ${
        selecionado
          ? "border-[#F3B43F] ring-2 ring-[#F3B43F]/70"
          : "border-[#F3B43F]/60 hover:border-[#F3B43F]"
      }`}
    >
      <ItemIcon
        imagemUrl={resolveMediaUrl(entrada.Item.imagem_url)}
        nome={entrada.Item.nome}
        permiteClique={false}
        fallback={
          <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[#F3B43F]/80">
            {entrada.Item.nome.charAt(0).toUpperCase()}
          </div>
        }
      />
      {/* Badge fora do wrapper com overflow-hidden acima — senão
          o offset negativo fica cortado pelo quadrado do item. */}
      <span className="pointer-events-none absolute -bottom-1 -right-1 rounded bg-black/80 px-1 text-[9px] font-bold text-white">
        x{entrada.quantidade}
      </span>
      {/* Tooltip de hover com nome + descrição — o `title` nativo
          (removido) só mostrava o nome e não suporta texto rico; clicar
          continua abrindo o painel "Usar" embaixo, que reaproveita o
          mesmo StatsDoConsumivel. Terceira versão deste tooltip: as
          duas primeiras (sempre pra baixo, depois "pra baixo só perto
          do topo da VIEWPORT") ainda cortavam ou cobriam outras seções
          numa página com várias cards empilhados — ver useTooltipSide.ts
          pro motivo de agora ser position:fixed + portal, medido de
          verdade, nunca um limiar fixo. */}
      <TooltipFixo tooltipRef={tooltipRef} posicao={posicao} visivel={hover}>
        <span className="block text-[10px] font-bold leading-tight text-white">{entrada.Item.nome}</span>
        {entrada.Item.descricao && (
          <span className="mt-1 block text-[9px] font-normal leading-tight text-white/60">
            {entrada.Item.descricao}
          </span>
        )}
      </TooltipFixo>
    </button>
  );
}

export default function ConsumablesGrid({ characterId }: { characterId: number }) {
  const { atualizarCharacter } = useCharacter();
  const [itens, setItens] = useState<InventarioEntry[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [usandoId, setUsandoId] = useState<number | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [selecionado, setSelecionado] = useState<number | null>(null);
  const [criterio, setCriterio] = useState<CriterioOrdenacaoInventario>("raridade");
  const detalheRef = useRef<HTMLDivElement | null>(null);

  // Com muitos consumíveis a grade cresce bastante — sem isso, tocar num
  // item lá em cima não rolava a tela até o painel "Usar" que aparece
  // embaixo de tudo.
  useEffect(() => {
    if (selecionado !== null) {
      detalheRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selecionado]);

  const carregar = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{ data?: { inventory?: InventarioEntry[] } }>(
        "/character-inventory",
        { params: { characterId } },
      );
      setItens((resp.data?.data?.inventory ?? []).filter((e) => e.Item.tipo_item === "Consumivel"));
    } catch (error) {
      console.error("Erro ao carregar consumíveis:", error);
    } finally {
      setCarregando(false);
    }
  }, [characterId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function usar(entrada: InventarioEntry) {
    if (usandoId) return;
    setUsandoId(entrada.id_personagem_inventario);
    setMensagem("");
    setSucesso("");
    try {
      const resp = await axiosInstance.post<{
        data?: {
          character?: {
            vida_atual?: number;
            mana_atual?: number;
            forca?: number;
            vitalidade?: number;
            agilidade?: number;
            inteligencia?: number;
            velocidade?: number;
            pontos_distribuir?: number;
          };
          pontosRecuperadosNoReset?: number;
        };
      }>("/character-items/use", {
        id_personagem: characterId,
        id_item: entrada.Item.id,
        quantidade: 1,
      });
      if (resp.data?.data?.character) atualizarCharacter(resp.data.data.character);
      const pontos = resp.data?.data?.pontosRecuperadosNoReset ?? 0;
      setSucesso(
        pontos > 0 ? `Atributos resetados! ${pontos} ponto(s) liberado(s) pra redistribuir.` : "",
      );
      await carregar();
      setSelecionado(null);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Não foi possível usar esse item.";
      setMensagem(msg);
    } finally {
      setUsandoId(null);
    }
  }

  if (carregando) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        Carregando consumíveis...
      </div>
    );
  }

  const selecionadoEntrada = itens.find((e) => e.id_personagem_inventario === selecionado);

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
        <p className="rounded-full border border-[#F3B43F]/50 bg-black/30 px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#F3B43F]">
          Consumíveis
        </p>
        {itens.length > 0 && (
          <label className="flex items-center gap-1 text-[11px] text-white/60">
            Ordenar por:
            <select
              value={criterio}
              onChange={(e) => setCriterio(e.target.value as CriterioOrdenacaoInventario)}
              className="rounded-lg border border-white/20 bg-black/40 px-2 py-1 text-[11px] text-white"
            >
              {OPCOES_ORDENACAO.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.rotulo}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {mensagem && <p className="mb-3 text-center text-sm text-red-400">{mensagem}</p>}
      {sucesso && <p className="mb-3 text-center text-sm text-green-400">{sucesso}</p>}

      {itens.length === 0 ? (
        <p className="text-center text-sm text-white/50">
          Você ainda não tem nenhum consumível.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {ordenarInventario(itens, criterio).map((entrada) => (
              <ConsumivelCard
                key={entrada.id_personagem_inventario}
                entrada={entrada}
                selecionado={selecionado === entrada.id_personagem_inventario}
                aoSelecionar={() =>
                  setSelecionado((atual) =>
                    atual === entrada.id_personagem_inventario ? null : entrada.id_personagem_inventario,
                  )
                }
              />
            ))}
          </div>

          {selecionadoEntrada && (
            <div
              ref={detalheRef}
              className="mt-4 flex flex-col items-center gap-2 border-t border-white/10 pt-3"
            >
              <span className="text-sm font-bold">{selecionadoEntrada.Item.nome}</span>
              <StatsDoConsumivel item={selecionadoEntrada.Item} />
              <button
                type="button"
                onClick={() => usar(selecionadoEntrada)}
                disabled={usandoId !== null}
                className="mt-1 rounded-lg bg-[#BC8418] px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-black transition hover:bg-[#a5710f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {usandoId ? "Usando..." : "Usar"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
