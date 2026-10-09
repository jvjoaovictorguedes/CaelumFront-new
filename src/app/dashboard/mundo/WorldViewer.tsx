"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { tileParaPercentual } from "@caelum/world-contracts";
import axios from "@/utils/axiosIntance";
import type { ManifestoMundo } from "@/types/contracts/world";

export default function WorldViewer({ manifesto }: { manifesto: ManifestoMundo }) {
  const posicaoPercentual = tileParaPercentual(manifesto.posicao.tile.x, manifesto.posicao.tile.y);
  const container = useRef<HTMLDivElement>(null);
  const [erro, setErro] = useState("");
  const [pronto, setPronto] = useState(false);
  const [revogado, setRevogado] = useState(false);
  const [limites, setLimites] = useState(false);
  const [ponto, setPonto] = useState("Capital de Caelum");
  const jogoRef = useRef<import("phaser").Game | null>(null);
  useEffect(() => {
    if (revogado) return;
    let cancelado = false;
    const abort = new AbortController();
    let checando = false;
    Promise.all([import("phaser"), import("@/world/WorldScene")]).then(([modulo, { WorldScene }]) => {
      if (cancelado || !container.current) return;
      const Phaser = modulo;
      const jogo = new Phaser.Game({ type: Phaser.AUTO, parent: container.current, backgroundColor: "#10262c", scale: { mode: Phaser.Scale.RESIZE, width: container.current.clientWidth, height: container.current.clientHeight }, render: { antialias: true, roundPixels: false }, scene: [new WorldScene(manifesto)] });
      jogoRef.current = jogo;
      jogo.events.on("mundo:metricas", (m: { chunks_residentes: number; chunks_carregando: number }) => {
        container.current?.setAttribute("data-chunks-residentes", String(m.chunks_residentes));
        container.current?.setAttribute("data-chunks-carregando", String(m.chunks_carregando));
      });
      jogo.events.on("mundo:pronto", () => setPronto(true));
      jogo.events.on("mundo:erro", (mensagem: string) => setErro(mensagem));
      jogo.events.on("mundo:ponto", (nome: string) => setPonto(nome));
    }).catch(() => { if (!cancelado) setErro("Não foi possível abrir o mapa. Recarregue a página."); });
    // Retirar a flag derruba o preview aberto. Falhas de rede também fecham
    // o acesso, em vez de manter indefinidamente uma autorização antiga.
    const timer = setInterval(async () => {
      if (checando) return;
      checando = true;
      try {
        const response = await axios.get<{ data: { habilitado: boolean } }>("/world/exploration/acesso", { signal: abort.signal });
        if (!cancelado && response.data.data.habilitado !== true) setRevogado(true);
      } catch { if (!cancelado) setRevogado(true); }
      finally { checando = false; }
    }, 15000);
    return () => { cancelado = true; abort.abort(); clearInterval(timer); jogoRef.current?.destroy(true); jogoRef.current = null; };
  }, [manifesto, revogado]);

  if (revogado) return <div className="rounded-xl border border-amber-300/40 bg-black/80 p-8"><h1 className="font-imFeel text-3xl text-amber-200">Acesso ao mundo encerrado</h1><p className="mt-3">Seu acesso foi retirado ou não pôde ser confirmado. Reabra a página para verificar.</p><Link href="/dashboard/map" className="mt-5 inline-block text-amber-200">Voltar ao mapa</Link></div>;
  return <section className="fixed inset-0 z-[80] bg-[#10262c] text-white" aria-label="Mundo de Caelum — fundação">
    <div ref={container} className="absolute inset-0" />
    <div className="pointer-events-none absolute left-3 top-3 max-w-[min(420px,65vw)] rounded-xl border border-amber-200/40 bg-black/80 p-3 shadow-xl">
      <h1 className="font-imFeel text-2xl text-amber-200">Caelum — O Mundo</h1>
      <p className="mt-1 text-sm">Fase 0 · Conferência do mapa</p>
      <p className="mt-2 text-xs text-white/80">Arraste ou use WASD para mover a câmera. Roda do mouse para aproximar.</p>
      <p className="mt-2 text-xs text-amber-100">A exploração jogável será liberada após a validação da Capital.</p>
      <p className="mt-2 text-sm">{ponto}</p>
      {limites && <p className="mt-2 text-xs text-amber-200">Limites cadastrados provisórios; ainda não definem colisões.</p>}
    </div>
    <div className="absolute right-20 top-3 flex flex-col items-end gap-2">
      <Link href="/dashboard/map" className="rounded-lg border border-amber-200/40 bg-black/80 px-4 py-2">Voltar ao mapa</Link>
      <button onClick={() => { const next = !limites; setLimites(next); jogoRef.current?.events.emit("mundo:limites", next); }} className="rounded-lg border border-amber-200/40 bg-black/80 px-3 py-2 text-xs">{limites ? "Ocultar" : "Conferir"} limites cadastrados</button>
    </div>
    <div className="pointer-events-none absolute bottom-3 right-20 w-60 max-w-[40vw] overflow-hidden rounded-lg border-2 border-amber-200/60 bg-black" style={{ aspectRatio: "400 / 180" }}>
      {/* A mesma conversão percentual e proporção do mundo evita deslocar pins. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={pronto ? `/world/${manifesto.assets_versao}/minimap.webp` : undefined} alt="Minimapa oficial de Caelum" className="h-full w-full" />
      {manifesto.pontos.map(p => <span key={p.id} className={`absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${p.tipo === "City" ? "bg-amber-300" : "bg-cyan-200"}`} style={{ left: `${p.percentual.x}%`, top: `${p.percentual.y}%` }} />)}
      <span className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black bg-white" style={{ left: `${posicaoPercentual.x}%`, top: `${posicaoPercentual.y}%` }} />
    </div>
    {(!pronto || erro) && <p role="status" className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/80 px-4 py-3 text-sm">{erro || "Carregando a Capital…"}</p>}
  </section>;
}
