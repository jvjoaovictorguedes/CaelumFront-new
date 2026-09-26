"use client";

// Sistema de Proezas Únicas §13 — Hall das Lendas. O backend já ordena
// (conquistadas primeiro, mais recente primeiro; teasers depois, por
// nome) — esta tela só renderiza a página que chega, nunca reordena.
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { obterHallDasLendas, type UniqueFeatItem } from "@/lib/api/unique-feats";

function dataCompleta(iso?: string): string | null {
  if (!iso) return null;
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return null;
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CardConquistada({ item }: { item: UniqueFeatItem }) {
  const nome = item.nome ?? "???";
  const descricao = item.descricao_publica ?? "Uma lenda ainda não foi escrita.";

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F]/70 bg-gradient-to-br from-[#3a2c14] to-[#292018] p-4 text-white shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-imFeel text-xl text-[#F3B43F]">{nome}</p>
        {dataCompleta(item.claimed_at) && (
          <p className="shrink-0 text-xs text-white/50">{dataCompleta(item.claimed_at)}</p>
        )}
      </div>
      <p className="mt-1 text-sm text-white/80">{descricao}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-white/60">Conquistada por</span>
        <span className="rounded-full border border-[#F3B43F]/50 bg-black/30 px-3 py-0.5 font-bold text-[#F3B43F]">
          {item.portador}
        </span>
      </div>
      {item.legado?.nome && (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-purple-400/60 bg-purple-950/40 px-3 py-1 text-xs font-bold uppercase tracking-wide text-purple-200">
          ✦ Legado: {item.legado.nome}
        </div>
      )}
    </div>
  );
}

function CardTeaser({ item }: { item: UniqueFeatItem }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-white/20 bg-[#292018]/60 p-4 text-white/70 shadow">
      <p className="font-imFeel text-lg text-white/80">{item.nome ?? "???"}</p>
      <p className="mt-1 text-sm text-white/50">
        {item.descricao_publica ?? "??? Uma lenda ainda não foi escrita."}
      </p>
      <p className="mt-2 text-xs uppercase tracking-widest text-white/30">
        Ainda não conquistada
      </p>
    </div>
  );
}

export default function HallDasLendasClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pagina = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const [itens, setItens] = useState<UniqueFeatItem[]>([]);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await obterHallDasLendas(pagina);
      setItens(dados.itens);
      setTotalPaginas(dados.totalPaginas);
    } catch {
      setErro("Não foi possível carregar o Hall das Lendas agora. Tente novamente em instantes.");
      setItens([]);
    } finally {
      setCarregando(false);
    }
  }, [pagina]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function irParaPagina(novaPagina: number) {
    router.replace(`/dashboard/hall-das-lendas?page=${novaPagina}`);
  }

  if (carregando) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-8 text-center text-white/70">
        Carregando o Hall das Lendas...
      </div>
    );
  }

  if (erro) {
    return (
      <div className="rounded-2xl border-2 border-red-800/60 bg-red-950/40 p-8 text-center text-red-200">
        {erro}
      </div>
    );
  }

  if (itens.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-8 text-center text-white/70">
        Nenhuma Proeza Única visível por aqui ainda.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {itens.map((item) =>
          item.conquistada ? (
            <CardConquistada key={item.key} item={item} />
          ) : (
            <CardTeaser key={item.key} item={item} />
          ),
        )}
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3 text-white">
          <button
            type="button"
            disabled={pagina <= 1}
            onClick={() => irParaPagina(pagina - 1)}
            className="rounded-lg border border-[#F3B43F]/50 px-3 py-1 text-sm font-bold text-[#F3B43F] disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="text-sm text-white/70">
            Página {pagina} de {totalPaginas}
          </span>
          <button
            type="button"
            disabled={pagina >= totalPaginas}
            onClick={() => irParaPagina(pagina + 1)}
            className="rounded-lg border border-[#F3B43F]/50 px-3 py-1 text-sm font-bold text-[#F3B43F] disabled:opacity-40"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
