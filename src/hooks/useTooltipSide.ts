"use client";
import { useCallback, useRef, useState } from "react";

// Terceira rodada do mesmo bug — as duas primeiras tentativas tratavam
// isso como "tem espaço entre o item e o TOPO DA VIEWPORT?", mas numa
// página com várias seções empilhadas (Mão, Anel, Colar, Varas de
// Pesca...) esse espaço quase sempre existe E já está OCUPADO por outra
// seção — abrir "pra cima" nesse caso cobria o card anterior (bug real
// reportado: tooltip da Vara de Bambu cortando o card "Colar" acima).
// A pergunta certa nunca foi "tem espaço até o topo da PÁGINA", é
// "cabe entre o item e a BORDA DA TELA" — e só dá pra responder isso
// de verdade com um tooltip fora do fluxo normal (position:fixed,
// renderizado num portal pra `document.body`, nunca como filho do
// grupo/card — um ancestral com `transform` no hover, como o próprio
// botão do item, quebraria um `position:fixed` comum porque viraria o
// container de referência dele).
const MARGEM_PX = 8;

export function useTooltipFixo<Gatilho extends HTMLElement = HTMLElement>() {
  const gatilhoRef = useRef<Gatilho | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [posicao, setPosicao] = useState<{ top: number; left: number } | null>(null);
  const [hover, setHover] = useState(false);

  // Mede o espaço de verdade (viewport inteira, não a seção) e escolhe
  // o lado com mais espaço — nunca um limiar fixo que ignora o que já
  // está desenhado ali. Precisa do tooltip já no DOM (mesmo invisível
  // via opacity, nunca display:none) pra medir a altura/largura reais
  // dele antes de posicionar.
  const medir = useCallback(() => {
    const gatilho = gatilhoRef.current;
    const tooltip = tooltipRef.current;
    if (!gatilho || !tooltip) return;
    const retanguloGatilho = gatilho.getBoundingClientRect();
    const altura = tooltip.offsetHeight;
    const largura = tooltip.offsetWidth;
    const espacoAcima = retanguloGatilho.top;
    const espacoAbaixo = window.innerHeight - retanguloGatilho.bottom;
    const abrirParaBaixo = espacoAbaixo >= altura + MARGEM_PX || espacoAbaixo >= espacoAcima;
    let top = abrirParaBaixo
      ? retanguloGatilho.bottom + MARGEM_PX
      : retanguloGatilho.top - altura - MARGEM_PX;
    // Clamp final: garante que NUNCA fica cortado pela borda da tela,
    // mesmo em casos extremos (viewport baixa, tooltip grande).
    top = Math.max(MARGEM_PX, Math.min(top, window.innerHeight - altura - MARGEM_PX));
    let left = retanguloGatilho.left + retanguloGatilho.width / 2 - largura / 2;
    left = Math.max(MARGEM_PX, Math.min(left, window.innerWidth - largura - MARGEM_PX));
    setPosicao({ top, left });
  }, []);

  const aoEntrar = useCallback(() => {
    medir();
    setHover(true);
  }, [medir]);
  const aoSair = useCallback(() => setHover(false), []);

  return { gatilhoRef, tooltipRef, posicao, hover, aoEntrar, aoSair, medir };
}
