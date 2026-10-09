"use client";
import { useCallback, useEffect, useState } from "react";
import {
  listarMissoesTemplo,
  entregarItemMissaoTemplo,
  reclamarRecompensaMissaoTemplo,
  mensagemDeErroTemplo,
  type TempleMissionApi,
} from "@/lib/api/temple";

const NOME_CATEGORIA: Record<string, string> = {
  RITO_DIARIO: "Ritos de hoje",
  PROVACAO_PRINCIPAL: "Provações Principais",
};

export default function TempleProvacoesPanel({ aberto, aoResgatar }: { aberto: boolean; aoResgatar: () => void }) {
  const [missoes, setMissoes] = useState<TempleMissionApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState("");

  const carregar = useCallback(async () => {
    try {
      const resposta = await listarMissoesTemplo();
      setMissoes(resposta.missions);
    } catch (erro) {
      setMensagem(mensagemDeErroTemplo(erro, "Não foi possível carregar as Provações."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function entregar(key: string) {
    if (processando) return;
    setProcessando(key);
    setMensagem("");
    try {
      const resposta = await entregarItemMissaoTemplo(key);
      setMissoes(resposta.missions);
    } catch (erro) {
      setMensagem(mensagemDeErroTemplo(erro, "Não foi possível entregar o item pedido."));
    } finally {
      setProcessando(null);
    }
  }

  async function resgatar(key: string) {
    if (processando) return;
    setProcessando(key);
    setMensagem("");
    try {
      await reclamarRecompensaMissaoTemplo(key);
      await carregar();
      aoResgatar();
    } catch (erro) {
      setMensagem(mensagemDeErroTemplo(erro, "Não foi possível resgatar a recompensa."));
    } finally {
      setProcessando(null);
    }
  }

  if (carregando) {
    return <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-white">Carregando Provações...</div>;
  }

  const porCategoria = new Map<string, TempleMissionApi[]>();
  for (const missao of missoes) {
    porCategoria.set(missao.categoria, [...(porCategoria.get(missao.categoria) ?? []), missao]);
  }

  return (
    <div className="flex flex-col gap-4">
      {!aberto && (
        <p className="rounded-xl border border-[#F3B43F]/30 bg-black/20 p-3 text-sm text-white/60">
          As Provações desta Convergência já foram encerradas — o progresso ficou registrado, mas nenhuma nova
          conclusão é possível agora.
        </p>
      )}
      {mensagem && <p className="text-sm text-red-400">{mensagem}</p>}

      {["PROVACAO_PRINCIPAL", "RITO_DIARIO"].map((categoria) => {
        const lista = porCategoria.get(categoria);
        if (!lista || lista.length === 0) return null;
        const concluidas = lista.filter((m) => m.completed_at).length;
        return (
          <div key={categoria} className="rounded-2xl border border-[#F3B43F]/40 bg-[#292018]/60 p-5 text-white">
            <p className="text-sm uppercase tracking-widest text-[#F3B43F]">
              {NOME_CATEGORIA[categoria] ?? categoria} {concluidas}/{lista.length}
            </p>
            <div className="mt-3 flex flex-col gap-3">
              {lista.map((missao) => (
                <TempleMissaoCard
                  key={missao.key}
                  missao={missao}
                  podeAgir={aberto && !missao.completed_at}
                  processando={processando === missao.key}
                  onEntregar={() => entregar(missao.key)}
                  onResgatar={() => resgatar(missao.key)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {missoes.length === 0 && (
        <p className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-white/60">
          Nenhuma Provação cadastrada nesta Convergência ainda.
        </p>
      )}
    </div>
  );
}

function TempleMissaoCard({
  missao,
  podeAgir,
  processando,
  onEntregar,
  onResgatar,
}: {
  missao: TempleMissionApi;
  podeAgir: boolean;
  processando: boolean;
  onEntregar: () => void;
  onResgatar: () => void;
}) {
  const percentual = missao.meta > 0 ? Math.min(100, (missao.progresso_atual / missao.meta) * 100) : 0;
  const concluida = Boolean(missao.completed_at);
  const resgatada = Boolean(missao.claimed_at);

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-bold">{missao.nome_exibicao}</p>
          <p className="text-xs text-white/60">{missao.descricao}</p>
        </div>
        <span className="shrink-0 text-xs font-bold text-[#F3B43F]">+{missao.reward_sigils} Sigilos</span>
      </div>

      <div className="mt-2">
        <div className="mb-1 flex justify-between text-[10px] text-white/50">
          <span>Progresso</span>
          <span>
            {missao.progresso_atual}/{missao.meta}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-black/40">
          <div
            className={`h-full transition-all ${concluida ? "bg-green-500" : "bg-[#F3B43F]"}`}
            style={{ width: `${percentual}%` }}
          />
        </div>
      </div>

      <div className="mt-2 flex justify-end gap-2">
        {missao.objective_type === "DELIVER_ITEM" && podeAgir && !concluida && (
          <button
            type="button"
            onClick={onEntregar}
            disabled={processando}
            className="rounded-lg border border-[#F3B43F]/50 bg-black/30 px-3 py-1 text-xs font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processando ? "Entregando..." : "Entregar"}
          </button>
        )}
        {concluida && !resgatada && (
          <button
            type="button"
            onClick={onResgatar}
            disabled={processando}
            className="rounded-lg bg-[#BC8418] px-3 py-1 text-xs font-bold text-black transition hover:bg-[#a5710f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processando ? "Resgatando..." : "Resgatar"}
          </button>
        )}
        {resgatada && <span className="text-xs text-green-400">Resgatada</span>}
      </div>
    </div>
  );
}
