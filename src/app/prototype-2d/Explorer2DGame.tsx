"use client";

// PROTÓTIPO EXPERIMENTAL — ver comentário no topo de ExplorationScene.ts.
// Client Component só porque Phaser precisa de `window`/Canvas (não
// roda em Server Component nem em SSR) — o `new Phaser.Game` só é
// criado dentro de um useEffect, depois do componente já estar
// montado no navegador.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const LARGURA = 640;
const ALTURA = 480;

export default function Explorer2DGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!containerRef.current) return;
    let jogo: import("phaser").Game | null = null;
    let cancelado = false;

    // Import dinâmico (em vez de import estático no topo do arquivo)
    // evita que o bundler tente avaliar Phaser durante qualquer
    // passo de build/SSR fora do navegador.
    Promise.all([import("phaser"), import("./ExplorationScene")])
      .then(([PhaserModule, { ExplorationScene }]) => {
        if (cancelado || !containerRef.current) return;
        const Phaser = PhaserModule;
        jogo = new Phaser.Game({
          type: Phaser.AUTO,
          parent: containerRef.current,
          width: LARGURA,
          height: ALTURA,
          pixelArt: true,
          backgroundColor: "#1a1410",
          physics: {
            default: "arcade",
            arcade: { gravity: { x: 0, y: 0 }, debug: false },
          },
          scene: [ExplorationScene],
        });

        // Locais interativos (Ferreiro -> Forja, Loja -> Loja, etc.,
        // ver LOCAIS_INTERATIVOS em ExplorationScene.ts) — a cena
        // Phaser não sabe navegar sozinha (não tem acesso ao router do
        // Next), então só emite a ROTA de destino nesse evento global
        // do próprio Phaser.Game, e quem efetivamente navega é o
        // componente React aqui fora.
        jogo.events.on("proto2d-entrar", (rota: string) => {
          router.push(rota);
        });
      })
      .catch((e) => {
        console.error("Erro ao iniciar o protótipo 2D:", e);
        if (!cancelado) setErro("Não foi possível iniciar o protótipo. Veja o console para detalhes.");
      });

    return () => {
      cancelado = true;
      jogo?.destroy(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={containerRef}
        style={{ width: LARGURA, height: ALTURA }}
        className="overflow-hidden rounded-lg border-2 border-[#F3B43F]/60 shadow-xl"
      />
      {erro && <p className="text-sm text-red-400">{erro}</p>}
    </div>
  );
}
