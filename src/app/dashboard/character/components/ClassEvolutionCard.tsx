"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { useCharacter } from "@/contexts/CharacterContext";

interface StatusEvolucaoClasse {
  disponivel: boolean;
  ja_evoluida?: boolean;
  nome_evoluido?: string;
  nivel_minimo?: number;
  nivel_atual?: number;
  nome_item_requisito?: string;
  quantidade_no_inventario?: number;
}

// Evolução de CLASSE — diferente da árvore de Evolution logo abaixo
// (aquela é por natureza mágica, comprada com ouro). Esta é única,
// definitiva, e exige nível alto + uma Relíquia de Ascensão específica
// da classe (ver classEvolutionService.js no backend).
export default function ClassEvolutionCard({ characterId }: { characterId: number }) {
  const [status, setStatus] = useState<StatusEvolucaoClasse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const { refreshCharacter } = useCharacter();

  const carregar = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{ data?: StatusEvolucaoClasse }>(
        `/characters/${characterId}/class-evolution`,
      );
      setStatus(resp.data?.data ?? null);
    } catch (error) {
      console.error("Erro ao carregar evolução de classe:", error);
    } finally {
      setCarregando(false);
    }
  }, [characterId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function evoluir() {
    if (processando) return;
    setProcessando(true);
    setMensagem("");
    try {
      const resp = await axiosInstance.post<{ message?: string }>(
        `/characters/${characterId}/class-evolution`,
      );
      setMensagem(resp.data?.message ?? "Evolução concluída!");
      await Promise.all([carregar(), refreshCharacter()]);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Não foi possível evoluir de classe.";
      setMensagem(msg);
    } finally {
      setProcessando(false);
    }
  }

  if (carregando || !status?.disponivel) return null;

  const nivelOk = (status.nivel_atual ?? 0) >= (status.nivel_minimo ?? 0);
  const itemOk = (status.quantidade_no_inventario ?? 0) >= 1;
  const podeEvoluir = !status.ja_evoluida && nivelOk && itemOk;

  return (
    <div className="mb-5 rounded-xl border-2 border-purple-400/60 bg-gradient-to-b from-purple-950/40 to-[#3a2f24] p-4">
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-purple-300">
        Evolução de Classe
      </p>

      {status.ja_evoluida ? (
        <p className="text-sm text-white/80">
          Seu personagem já evoluiu para{" "}
          <span className="font-bold text-purple-300">{status.nome_evoluido}</span>. Um bônus
          permanente de combate já está ativo.
        </p>
      ) : (
        <>
          <p className="mb-2 text-sm text-white/80">
            Alcance o nível <span className="font-bold">{status.nivel_minimo}</span> e obtenha{" "}
            <span className="font-bold text-purple-300">1x {status.nome_item_requisito}</span> pra
            evoluir em definitivo pra{" "}
            <span className="font-bold text-purple-300">{status.nome_evoluido}</span> — um bônus
            permanente de combate.
          </p>
          <div className="mb-3 flex flex-wrap gap-3 text-xs">
            <span className={nivelOk ? "text-green-400" : "text-white/50"}>
              {nivelOk ? "✓" : "✗"} Nível {status.nivel_minimo} (atual: {status.nivel_atual})
            </span>
            <span className={itemOk ? "text-green-400" : "text-white/50"}>
              {itemOk ? "✓" : "✗"} {status.nome_item_requisito} ({status.quantidade_no_inventario ?? 0}
              /1)
            </span>
          </div>
          <button
            type="button"
            onClick={evoluir}
            disabled={!podeEvoluir || processando}
            className="rounded-lg bg-purple-500/80 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {processando ? "Evoluindo..." : "Evoluir de Classe"}
          </button>
        </>
      )}

      {mensagem && <p className="mt-2 text-xs text-purple-200">{mensagem}</p>}
    </div>
  );
}
