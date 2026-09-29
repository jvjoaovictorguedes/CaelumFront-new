"use client";

// Ferraria — 3 slots profissionais independentes do equipamento de
// combate (Profissão de Ferreiro spec §6/§13.2). Fole melhora Fundição,
// Martelo melhora Fabricação, Tenaz melhora Refinamento.
import { useCallback, useEffect, useState } from "react";
import { getTools, equipTool, unequipTool, type FerramentaApi, type SlotFerraria } from "@/lib/api/forge";
import { resolveMediaUrl } from "@/utils/media-url";
import { useToast } from "@/contexts/ToastContext";
import ItemIcon from "@/components/Item/ItemIcon";

const NOME_SLOT: Record<SlotFerraria, string> = {
  Fole: "Fole — Fundição",
  Martelo: "Martelo — Fabricação",
  Tenaz: "Tenaz — Refinamento",
};

const EFFECT_LABEL: Record<string, string> = {
  SMELTING_BONUS_BAR_PPM: "chance de barra bônus",
  CRAFTING_QUALITY_BONUS_PPM: "chance de qualidade superior",
  REFINEMENT_SUCCESS_BONUS_PPM: "chance de sucesso no refino",
};

function descreverEfeitos(ferramenta: FerramentaApi) {
  if (ferramenta.efeitos.length === 0) return "Sem bônus configurado.";
  return ferramenta.efeitos
    .map((e) => `+${(e.valor_ppm / 10_000).toFixed(1)} p.p. de ${EFFECT_LABEL[e.effect_key] ?? e.effect_key}`)
    .join(", ");
}

function mensagemDeErro(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "response" in error) {
    const resp = (error as { response?: { data?: { message?: string } } }).response;
    if (resp?.data?.message) return resp.data.message;
  }
  return fallback;
}

export default function BlacksmithingPanel({ onProgressoMudou }: { nivelForja: number; onProgressoMudou: () => void }) {
  const [ferramentas, setFerramentas] = useState<FerramentaApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState<number | null>(null);
  const { mostrarErro, mostrarSucesso } = useToast();

  const carregar = useCallback(async () => {
    try {
      setFerramentas(await getTools());
    } catch {
      mostrarErro("Não foi possível carregar as ferramentas de Ferraria.");
    } finally {
      setCarregando(false);
    }
  }, [mostrarErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleEquipar(idInstancia: number) {
    setProcessando(idInstancia);
    try {
      await equipTool(idInstancia);
      mostrarSucesso("Ferramenta equipada.");
      await carregar();
      onProgressoMudou();
    } catch (error) {
      mostrarErro(mensagemDeErro(error, "Não foi possível equipar essa ferramenta."));
    } finally {
      setProcessando(null);
    }
  }

  async function handleDesequipar(slot: SlotFerraria) {
    setProcessando(-1);
    try {
      await unequipTool(slot);
      mostrarSucesso("Ferramenta desequipada.");
      await carregar();
    } catch (error) {
      mostrarErro(mensagemDeErro(error, "Não foi possível desequipar essa ferramenta."));
    } finally {
      setProcessando(null);
    }
  }

  if (carregando) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        Carregando Ferraria...
      </div>
    );
  }

  const porSlot: Record<SlotFerraria, FerramentaApi[]> = { Fole: [], Martelo: [], Tenaz: [] };
  for (const ferramenta of ferramentas) porSlot[ferramenta.slot].push(ferramenta);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">Ferraria</p>
        <p className="mt-1 text-xs text-white/60">
          Ferramentas profissionais — melhoram Fundição, Fabricação e Refinamento. Nunca desbloqueiam conteúdo acima
          do seu Nível de Ferreiro real.
        </p>
      </div>

      {(["Fole", "Martelo", "Tenaz"] as SlotFerraria[]).map((slot) => {
        const equipada = porSlot[slot].find((f) => f.equipada);
        const disponiveis = porSlot[slot].filter((f) => !f.equipada);
        return (
          <div key={slot} className="rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-4 text-white shadow-lg">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#F3B43F]">{NOME_SLOT[slot]}</p>

            {equipada ? (
              <div className="flex items-center gap-3 rounded-lg border-2 border-[#F3B43F] bg-[#3a2c14] p-3">
                <div className="h-12 w-12 shrink-0">
                  <ItemIcon imagemUrl={resolveMediaUrl(equipada.imagem_url)} nome={equipada.nome} fallback={<span>🔧</span>} />
                </div>
                <div className="flex-1">
                  <p className="font-bold">
                    {equipada.nome} <span className="text-xs font-normal text-white/50">Tier {equipada.tier_equipamento ?? "—"} · +{equipada.refinamento}</span>
                  </p>
                  <p className="text-xs text-[#F3B43F]">{descreverEfeitos(equipada)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDesequipar(slot)}
                  disabled={processando !== null}
                  className="shrink-0 rounded-lg border-2 border-red-400/60 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-400/10 disabled:opacity-40"
                >
                  Desequipar
                </button>
              </div>
            ) : (
              <p className="text-xs text-white/50">Nenhuma ferramenta equipada nesse slot.</p>
            )}

            {disponiveis.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                <p className="text-[10px] uppercase tracking-wide text-white/40">Disponíveis no inventário</p>
                {disponiveis.map((ferramenta) => (
                  <div key={ferramenta.id_instancia} className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-2">
                    <div className="h-10 w-10 shrink-0">
                      <ItemIcon imagemUrl={resolveMediaUrl(ferramenta.imagem_url)} nome={ferramenta.nome} fallback={<span>🔧</span>} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{ferramenta.nome}</p>
                      <p className="text-xs text-white/50">
                        {descreverEfeitos(ferramenta)} — requer Nv. {ferramenta.nivel_ferreiro_minimo}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEquipar(ferramenta.id_instancia)}
                      disabled={!ferramenta.nivel_suficiente || processando !== null}
                      className="shrink-0 rounded-lg border-2 border-[#F3B43F]/60 px-3 py-1.5 text-xs font-bold text-[#F3B43F] hover:bg-[#F3B43F]/10 disabled:opacity-40"
                    >
                      {ferramenta.nivel_suficiente ? "Equipar" : `Requer Nv. ${ferramenta.nivel_ferreiro_minimo}`}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
