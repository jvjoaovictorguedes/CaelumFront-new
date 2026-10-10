import { redirect } from "next/navigation";
import { listarEdicoesAtivasEventPuzzle, type EventPuzzleEdicaoAtivaApi } from "@/lib/api/eventPuzzle";
import { getCurrentCharacter } from "@/utils/character-session";

// "O Coração da Máquina Celestial" — Fase 16. Ponto de entrada: lista
// as edições ativas (o jogador normalmente só vê uma); com exatamente
// uma, pula direto pra ela (mesma ergonomia de não forçar um clique
// extra num seletor que na prática nunca tem o que selecionar).
export default async function EventPuzzleEntryPage() {
  const character = await getCurrentCharacter();

  if (!character) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <h1 className="mb-4 font-imFeel text-5xl text-[#F3B43F]">O Coração da Máquina Celestial</h1>
        <p className="max-w-md text-lg text-white/70">Crie um personagem para explorar as câmaras do evento.</p>
      </div>
    );
  }

  let edicoes: EventPuzzleEdicaoAtivaApi[];
  try {
    edicoes = await listarEdicoesAtivasEventPuzzle();
  } catch {
    edicoes = [];
  }

  if (edicoes.length === 1) {
    redirect(`/dashboard/event-puzzle/${edicoes[0].id}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-2 sm:p-4">
      <div className="rounded-2xl border-2 border-[#BC8418]/60 bg-[#241a10]/90 p-5 text-white shadow-xl">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]/80">Engrenagens, feixes e válvulas</p>
        <h1 className="font-imFeel text-4xl text-[#F3B43F] sm:text-5xl">O Coração da Máquina Celestial</h1>
        <p className="mt-2 text-white/70">
          Um autômato colossal despertou. Suas câmaras mecânicas, ópticas e hidráulicas escondem enigmas que convergem
          pra um núcleo final — e, no fim de tudo, o Custódio do Meridiano aguarda.
        </p>
      </div>

      {edicoes.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-center text-white/60">
          Nenhuma edição deste evento está ativa no momento.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {edicoes.map((edicao) => (
            <a
              key={edicao.id}
              href={`/dashboard/event-puzzle/${edicao.id}`}
              className="rounded-xl border border-[#F3B43F]/40 bg-[#292018]/60 p-4 text-white transition hover:border-[#F3B43F] hover:bg-[#292018]"
            >
              <p className="font-imFeel text-xl text-[#F3B43F]">{edicao.nome}</p>
              <p className="text-sm text-white/60">{edicao.definicao.nome}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
