import Link from "next/link";
import { getCurrentCharacter } from "@/utils/character-session";

export default async function DashboardHomePage() {
  const character = await getCurrentCharacter();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-2 sm:p-4">
      <section className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-6 text-white shadow-xl">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">
          Refúgio do aventureiro
        </p>
        <h1 className="font-imFeel text-4xl sm:text-6xl">
          Bem-vindo{character?.nome ? `, ${character.nome}` : " a Caelum"}
        </h1>
        <p className="mt-3 max-w-2xl text-white/70">
          Prepare seu herói, confira seus recursos e escolha o próximo desafio.
        </p>
      </section>

      {character && (
        <section className="grid gap-4 sm:grid-cols-3">
          <Resumo label="Nível" valor={character.nivel} />
          <Resumo label="Experiência" valor={character.experiencia ?? 0} />
          <Resumo label="Moedas" valor={character.dinheiro ?? 0} />
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          href="/dashboard/adventure"
          className="rounded-2xl border-2 border-[#F3B43F] bg-[#BC8418] p-6 text-xl font-bold text-black shadow-lg transition hover:-translate-y-1 hover:bg-[#d69a20]"
        >
          Partir para a aventura
          <span className="mt-2 block text-sm font-normal">
            Enfrente inimigos, ganhe XP e encontre recompensas.
          </span>
        </Link>
        <Link
          href="/dashboard/inventory"
          className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-6 text-xl font-bold text-white shadow-lg transition hover:-translate-y-1"
        >
          Abrir inventário
          <span className="mt-2 block text-sm font-normal text-white/70">
            Veja seus itens e equipamentos coletados.
          </span>
        </Link>
      </section>
    </div>
  );
}

function Resumo({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white/60 p-4 text-center shadow-lg">
      <p className="text-sm uppercase tracking-widest text-black/60">{label}</p>
      <p className="font-imFeel text-3xl text-[#292018]">{valor}</p>
    </div>
  );
}
