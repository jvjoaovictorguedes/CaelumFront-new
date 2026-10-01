import type { Metadata } from "next";
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0f0c09] p-6 text-white">
      <div className="max-w-xl text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-[#F3B43F]">
          Protótipo experimental — não é o jogo de produção
        </p>
        <h1 className="mt-1 font-imFeel text-2xl">Exploração 2D top-down</h1>
        <p className="mt-2 text-sm text-white/60">
          Setas ou WASD pra andar. Colide com a borda do mapa e com o bloco cinza no meio — resto da grama é
          andável. Câmera segue o personagem.
        </p>
      </div>
      <Explorer2DGame />
    </div>
  );
}
