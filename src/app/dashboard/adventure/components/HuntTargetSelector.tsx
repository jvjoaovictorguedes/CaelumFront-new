"use client";

import { useRouter } from "next/navigation";

// Mesma lista de NOMES_INIMIGOS do backend (combatController.js) — não
// tem endpoint que devolva isso, é um catálogo fixo dos dois lados.
// Deixa o jogador "caçar" um monstro específico (pedido: farmar 150
// Minotauros pro Berserker sem depender só do sorteio aleatório) — só
// muda o PRÓXIMO encontro a ser gerado, nunca o que já está em
// andamento (gerarInimigoParaPersonagem sempre devolve o encontro atual
// se um já existir).
const MONSTROS = [
  "Lobo das Sombras",
  "Bandido Errante",
  "Golem de Pedra",
  "Espectro Sussurrante",
  "Orc Guerreiro",
  "Aranha Venenosa",
  "Cultista Renegado",
  "Draconídeo Jovem",
  "Minotauro",
];

export default function HuntTargetSelector({ alvoAtual }: { alvoAtual: string | null }) {
  const router = useRouter();

  function selecionar(nome: string | null) {
    router.push(nome ? `/dashboard/adventure?alvo=${encodeURIComponent(nome)}` : "/dashboard/adventure");
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#F3B43F]/30 bg-[#292018]/80 px-3 py-2 text-xs">
      <span className="mr-1 font-bold uppercase tracking-wide text-[#F3B43F]/80">Caçar:</span>
      <button
        type="button"
        onClick={() => selecionar(null)}
        className={`rounded-full px-2.5 py-1 font-bold transition ${
          !alvoAtual
            ? "bg-[#F3B43F] text-black"
            : "bg-black/30 text-white/60 hover:text-white"
        }`}
      >
        Aleatório
      </button>
      {MONSTROS.map((nome) => (
        <button
          key={nome}
          type="button"
          onClick={() => selecionar(nome)}
          className={`rounded-full px-2.5 py-1 font-bold transition ${
            alvoAtual === nome
              ? "bg-[#F3B43F] text-black"
              : "bg-black/30 text-white/60 hover:text-white"
          }`}
        >
          {nome}
        </button>
      ))}
    </div>
  );
}
