import type { Metadata } from "next";
import Link from "next/link";
import Explorer2DGame from "./Explorer2DGame";

// PROTÓTIPO EXPERIMENTAL — prova de conceito isolada de exploração 2D
// top-down (Phaser.js). NÃO integrado com o jogo de produção: sem
// link em nenhum menu, sem checagem de personagem/sessão, fora do
// matcher do middleware (src/middleware.ts só intercepta "/",
// "/login", "/register", "/dashboard/*" e "/create/*" — esta rota
// nunca passa por lá). Só existe pra validar a sensação de "andar
// pelo mapa" antes de decidir se vale integrar de verdade com a
// Aventura/zonas atuais — ver comentário completo no topo de
// ExplorationScene.ts.
export const metadata: Metadata = {
  title: "Protótipo 2D (experimental)",
  robots: { index: false, follow: false },
};

export default function Prototype2DPage() {
  return (
    <div className="fixed inset-0 overflow-hidden bg-[#0f0c09] text-white">
      {/* Tela cheia (pedido do jogador) — o jogo Phaser cobre a página
          inteira, o resto aqui é só overlay HTML por cima dele. */}
      <Explorer2DGame />

      <div className="pointer-events-none absolute left-4 top-4 max-w-sm rounded-lg border border-[#F3B43F]/40 bg-black/70 p-3 backdrop-blur-sm">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#F3B43F]">
          Protótipo experimental — não é o jogo de produção
        </p>
        <p className="mt-1 text-xs text-white/70">
          Setas ou WASD pra andar. Ande por cima de um ícone (Ferreiro/Loja/Taverna/Guilda) ou clique nele pra
          entrar. Minimapa no canto superior direito mostra o mapa inteiro.
        </p>
      </div>

      <Link
        href="/dashboard/map"
        aria-label="Fechar protótipo"
        title="Fechar protótipo"
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#F3B43F] bg-[#292018] text-[#F3B43F] shadow-lg transition hover:bg-[#3a2f24]"
      >
        ✕
      </Link>
    </div>
  );
}
