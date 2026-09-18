"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { useCharacter } from "@/contexts/CharacterContext";

interface OpcaoForja {
  tipo_item: string;
  raridade_origem: string;
  raridade_destino: string;
  quantidade_necessaria: number;
  quantidade_disponivel: number;
  custo_ouro: number;
  pode_craftar: boolean;
}

const CORES_RARIDADE: Record<string, string> = {
  Comum: "text-gray-300",
  Incomum: "text-green-400",
  Raro: "text-blue-400",
  Epico: "text-purple-400",
  Lendario: "text-orange-400",
  Mitico: "text-red-400",
};

const LABEL_CATEGORIA: Record<string, string> = {
  Arma: "Armas",
  Armadura: "Armaduras",
  Capacete: "Capacetes",
  Escudo: "Escudos",
  Material: "Materiais",
};

export default function ForgeClient() {
  const [opcoes, setOpcoes] = useState<OpcaoForja[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [forjandoChave, setForjandoChave] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState("");
  const { character, refreshCharacter } = useCharacter();

  const carregar = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{ data?: { opcoes?: OpcaoForja[] } }>(
        "/crafting/options",
      );
      setOpcoes(resp.data?.data?.opcoes ?? []);
    } catch (error) {
      console.error("Erro ao carregar opções de forja:", error);
      setMensagem("Não foi possível carregar a forja.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function forjar(opcao: OpcaoForja) {
    const chave = `${opcao.tipo_item}::${opcao.raridade_origem}`;
    if (forjandoChave) return;
    setForjandoChave(chave);
    setMensagem("");
    try {
      const resp = await axiosInstance.post<{ message?: string }>("/crafting/craft", {
        tipo_item: opcao.tipo_item,
        raridade: opcao.raridade_origem,
      });
      setMensagem(resp.data?.message ?? "Forja concluída!");
      await Promise.all([carregar(), refreshCharacter()]);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Não foi possível forjar.";
      setMensagem(msg);
    } finally {
      setForjandoChave(null);
    }
  }

  if (carregando) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        Carregando forja...
      </div>
    );
  }

  const categorias = Object.keys(LABEL_CATEGORIA).filter((cat) =>
    opcoes.some((op) => op.tipo_item === cat),
  );

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      {character && (
        <p className="mb-4 text-sm text-[#F3B43F]/80">
          Você tem <span className="font-bold">{character.dinheiro}</span> de ouro.
        </p>
      )}

      {mensagem && <p className="mb-4 text-sm text-purple-300">{mensagem}</p>}

      {opcoes.length === 0 ? (
        <p className="text-sm text-white/60">
          Você ainda não tem nenhum item que dê pra fundir na forja. Junte itens da
          mesma raridade (Comum, Incomum...) pra começar.
        </p>
      ) : (
        categorias.map((categoria) => {
          const doGrupo = opcoes.filter((op) => op.tipo_item === categoria);
          return (
            <div key={categoria} className="mb-6 last:mb-0">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#F3B43F]/80">
                {LABEL_CATEGORIA[categoria]}
              </p>
              <div className="flex flex-col gap-2">
                {doGrupo.map((opcao) => {
                  const chave = `${opcao.tipo_item}::${opcao.raridade_origem}`;
                  const percentual = Math.min(
                    100,
                    (opcao.quantidade_disponivel / opcao.quantidade_necessaria) * 100,
                  );
                  return (
                    <div
                      key={chave}
                      className="flex flex-col gap-2 rounded-xl border border-[#F3B43F]/40 bg-[#3a2f24] p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold">
                          <span className={CORES_RARIDADE[opcao.raridade_origem]}>
                            {opcao.raridade_origem}
                          </span>{" "}
                          →{" "}
                          <span className={CORES_RARIDADE[opcao.raridade_destino]}>
                            {opcao.raridade_destino}
                          </span>
                        </p>
                        <p className="text-xs text-white/60">
                          {opcao.quantidade_disponivel}/{opcao.quantidade_necessaria} itens ·{" "}
                          {opcao.custo_ouro} de ouro
                        </p>
                        <div className="mt-1 h-2 w-full max-w-xs overflow-hidden rounded-full bg-black/40">
                          <div
                            className="h-full bg-[#F3B43F] transition-all"
                            style={{ width: `${percentual}%` }}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => forjar(opcao)}
                        disabled={!opcao.pode_craftar || forjandoChave === chave}
                        className="shrink-0 rounded-lg bg-[#F3B43F] px-4 py-1.5 text-sm font-bold text-black transition hover:bg-[#e0a52f] disabled:cursor-not-allowed disabled:bg-black/40 disabled:text-white/50"
                      >
                        {forjandoChave === chave ? "Forjando..." : "Forjar"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
