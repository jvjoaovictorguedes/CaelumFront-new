"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { useCharacter } from "@/contexts/CharacterContext";

interface CaminhoEvolucao {
  id: number;
  nome: string;
  descricao: string;
  nivel_necessario: number;
  nome_item_requisito: string | null;
  quantidade_item_requisito: number;
  quantidade_no_inventario: number;
  nome_monstro_alvo: string | null;
  quantidade_monstro_necessaria: number | null;
  quantidade_monstro_atual: number;
  monstro_ok: boolean;
  bonus_forca: number;
  bonus_vitalidade: number;
  bonus_agilidade: number;
  bonus_inteligencia: number;
  bonus_velocidade: number;
  escolhido: boolean;
  pode_evoluir: boolean;
  nivel_ok: boolean;
  item_ok: boolean;
}

interface StatusEvolucaoClasse {
  disponivel: boolean;
  ja_evoluida?: boolean;
  caminho_escolhido?: string | null;
  nivel_atual?: number;
  caminhos?: CaminhoEvolucao[];
}

const LABEL_ATRIBUTO: Record<string, string> = {
  bonus_forca: "Força",
  bonus_vitalidade: "Vitalidade",
  bonus_agilidade: "Agilidade",
  bonus_inteligencia: "Inteligência",
  bonus_velocidade: "Velocidade",
};

function bonusResumo(caminho: CaminhoEvolucao) {
  return (Object.keys(LABEL_ATRIBUTO) as (keyof typeof LABEL_ATRIBUTO)[])
    .map((chave) => ({ label: LABEL_ATRIBUTO[chave], valor: caminho[chave as keyof CaminhoEvolucao] as number }))
    .filter((b) => b.valor > 0);
}

// Evolução de CLASSE — árvore de caminhos exclusivos (o personagem
// escolhe UM em definitivo). Diferente da árvore de Evolution logo
// abaixo (aquela é por natureza mágica, comprada com ouro, cumulativa
// em vários nós) — esta é nível alto + 1 Relíquia de Ascensão
// específica do caminho, um "capstone" de fim de progressão.
export default function ClassEvolutionCard({ characterId }: { characterId: number }) {
  const [status, setStatus] = useState<StatusEvolucaoClasse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [processandoId, setProcessandoId] = useState<number | null>(null);
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

  async function evoluir(caminho: CaminhoEvolucao) {
    if (processandoId) return;
    setProcessandoId(caminho.id);
    setMensagem("");
    try {
      const resp = await axiosInstance.post<{ message?: string }>(
        `/characters/${characterId}/class-evolution`,
        { id_caminho: caminho.id },
      );
      setMensagem(resp.data?.message ?? "Evolução concluída!");
      await Promise.all([carregar(), refreshCharacter()]);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Não foi possível evoluir de classe.";
      setMensagem(msg);
    } finally {
      setProcessandoId(null);
    }
  }

  if (carregando || !status?.disponivel) return null;

  const caminhos = status.caminhos ?? [];

  return (
    <div className="mb-5 rounded-xl border-2 border-purple-400/60 bg-gradient-to-b from-purple-950/40 to-[#3a2f24] p-4">
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-purple-300">
        Evolução de Classe
      </p>

      {status.ja_evoluida ? (
        <p className="mb-4 text-sm text-white/80">
          Seu personagem já evoluiu pra{" "}
          <span className="font-bold text-purple-300">{status.caminho_escolhido}</span>. Um bônus
          permanente de atributos já está ativo — não dá pra trocar de caminho depois.
        </p>
      ) : (
        <p className="mb-4 text-sm text-white/80">
          Ao alcançar nível alto o suficiente, escolha UM caminho em definitivo — cada um dá um
          perfil de atributo diferente. Depois de escolher, não dá pra trocar.
        </p>
      )}

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-center">
        {caminhos.map((caminho) => {
          const bloqueadoPorEscolhaAlheia = Boolean(status.ja_evoluida) && !caminho.escolhido;
          return (
            <div
              key={caminho.id}
              className={`flex flex-1 flex-col gap-2 rounded-xl border-2 p-3 text-center transition ${
                caminho.escolhido
                  ? "border-purple-400 bg-purple-950/50"
                  : bloqueadoPorEscolhaAlheia
                    ? "border-white/10 bg-black/20 opacity-50"
                    : "border-[#F3B43F]/50 bg-black/20"
              }`}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#F3B43F]/60 bg-[#292018] text-lg font-bold text-[#F3B43F]">
                {caminho.nome.charAt(0)}
              </div>
              <p className="font-imFeel text-base uppercase text-white">{caminho.nome}</p>
              <p className="text-[11px] text-white/60">{caminho.descricao}</p>

              <div className="flex flex-wrap justify-center gap-1.5 text-[10px]">
                {bonusResumo(caminho).map((b) => (
                  <span
                    key={b.label}
                    className="rounded bg-[#F3B43F]/15 px-1.5 py-0.5 font-bold text-[#F3B43F]"
                  >
                    +{b.valor} {b.label}
                  </span>
                ))}
              </div>

              {caminho.escolhido ? (
                <p className="mt-1 text-[11px] font-bold uppercase text-purple-300">Caminho escolhido</p>
              ) : (
                <>
                  <div className="mt-1 rounded-lg border border-white/10 bg-black/30 p-2 text-left text-[10px]">
                    <p className="mb-1 font-bold uppercase tracking-wide text-white/50">Requisitos</p>
                    <p className={caminho.nivel_ok ? "text-green-400" : "text-white/60"}>
                      {caminho.nivel_ok ? "✓" : "✗"} Nível {caminho.nivel_necessario} (atual:{" "}
                      {status.nivel_atual})
                    </p>
                    <p className={caminho.item_ok ? "text-green-400" : "text-white/60"}>
                      {caminho.item_ok ? "✓" : "✗"} {caminho.nome_item_requisito} (
                      {caminho.quantidade_no_inventario}/{caminho.quantidade_item_requisito})
                    </p>
                    {caminho.nome_monstro_alvo && (
                      <p className={caminho.monstro_ok ? "text-green-400" : "text-white/60"}>
                        {caminho.monstro_ok ? "✓" : "✗"} Derrotar {caminho.quantidade_monstro_necessaria}x{" "}
                        {caminho.nome_monstro_alvo} ({caminho.quantidade_monstro_atual}/
                        {caminho.quantidade_monstro_necessaria})
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => evoluir(caminho)}
                    disabled={!caminho.pode_evoluir || processandoId !== null || bloqueadoPorEscolhaAlheia}
                    className="mt-1 rounded-lg bg-purple-500/80 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {processandoId === caminho.id ? "Evoluindo..." : "Confirmar Evolução"}
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {mensagem && <p className="mt-3 text-xs text-purple-200">{mensagem}</p>}
    </div>
  );
}
