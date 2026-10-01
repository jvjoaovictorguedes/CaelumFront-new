"use client";

// PROTÓTIPO EXPERIMENTAL — ver comentário no topo de ExplorationScene.ts.
// Client Component só porque Phaser precisa de `window`/Canvas (não
// roda em Server Component nem em SSR) — o `new Phaser.Game` só é
// criado dentro de um useEffect, depois do componente já estar
// montado no navegador.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
          // Tela cheia de verdade (pedido do jogador: "poderia ser na
          // tela cheia") — Scale.RESIZE acompanha o tamanho do elemento
          // `parent` (o container abaixo, fixed inset-0) e já escuta
          // resize de janela sozinho; ExplorationScene.ts também escuta
          // o evento 'resize' da própria cena pra reposicionar
          // câmeras/HUD/minimapa quando isso acontece.
          scale: {
            mode: Phaser.Scale.RESIZE,
            width: window.innerWidth,
            height: window.innerHeight,
          },
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
    <div ref={containerRef} className="fixed inset-0 overflow-hidden bg-[#1a1410]">
      {erro && (
        <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-red-400">{erro}</p>
      )}
    </div>
  );
}
