"use client";
import { useCallback, useState } from "react";

// Tooltip de hover numa grade de itens: abre pra CIMA por padrão (não
// empurra o scroll da página quando o item está perto do fim da lista
// — bug real reportado: o último item "abre mais espaço" e obriga a
// rolar sem necessidade) e só pra BAIXO quando não há espaço suficiente
// acima (item colado no topo da aba — o bug original, tooltip cortado/
// sobreposto pelo cabeçalho). Decidido na hora do hover/toque via
// getBoundingClientRect, nunca por posição fixa na grade (ex.: "só a
// primeira linha"), porque o espaço disponível depende de quanto a
// página já rolou — e PRECISA ser por item (hook chamado de dentro de
// um componente por card), nunca um estado único compartilhado pela
// lista inteira, senão o hover de UM item muda a direção do tooltip
// de outro item que nem está sendo olhado (bug visto testando como
// jogador: a espada cobria o escudo da linha de baixo).
// 200px cobre o cabeçalho real da aba de Inventário (medido ao vivo via
// smoke test: com a página rolada até o topo, o primeiro item da grade
// de Consumíveis já começa a ~180px do topo da viewport — um limiar
// menor marcaria "tem espaço acima" justamente no pior caso real, que é
// exatamente o cenário do bug original).
const ESPACO_MINIMO_ACIMA_PX = 200;

export function useTooltipSide() {
  const [abrirParaBaixo, setAbrirParaBaixo] = useState(false);

  const medir = useCallback((elemento: HTMLElement | null) => {
    if (!elemento) return;
    setAbrirParaBaixo(elemento.getBoundingClientRect().top < ESPACO_MINIMO_ACIMA_PX);
  }, []);

  return { abrirParaBaixo, medir };
}
