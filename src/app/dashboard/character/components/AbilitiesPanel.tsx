"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";

interface PoderApi {
  id_power: number;
  nome: string;
  descricao: string;
  tipo_poder: "Ativo" | "Passivo";
  custo_mana: number;
  dano_base: number | null;
  cura_base: number | null;
  cooldown: number | null;
  escala_atributo: string;
  valor_escala: number;
  origem: "classe" | "raca";
  nivel_necessario: number;
  aprendido: boolean;
  ativo: boolean;
  id_character_ability: number | null;
}

const ORIGEM_LABEL: Record<PoderApi["origem"], string> = {
  classe: "Poderes de classe",
  raca: "Poderes de raça",
};

function DetalheDoPoder({ poder }: { poder: PoderApi }) {
  const detalhes: string[] = [];
  if (poder.custo_mana > 0) detalhes.push(`${poder.custo_mana} de mana`);
  if (poder.dano_base) detalhes.push(`${poder.dano_base} de dano base`);
  if (poder.cura_base) detalhes.push(`${poder.cura_base} de cura base`);
  if (poder.cooldown) detalhes.push(`${poder.cooldown}s de recarga`);
  detalhes.push(`escala com ${poder.escala_atributo} (x${poder.valor_escala})`);
  return <p className="text-xs text-white/60">{detalhes.join(" · ")}</p>;
}

export default function AbilitiesPanel({ characterId }: { characterId: number }) {
  const [poderes, setPoderes] = useState<PoderApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [processandoId, setProcessandoId] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{ data?: { poderes?: PoderApi[] } }>(
        `/characters/${characterId}/powers`,
      );
      setPoderes(resp.data?.data?.poderes ?? []);
    } catch (error) {
      console.error("Erro ao carregar habilidades:", error);
      setMensagem("Não foi possível carregar suas habilidades.");
    } finally {
      setCarregando(false);
    }
  }, [characterId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function alternar(poder: PoderApi) {
    if (!poder.id_character_ability || processandoId) return;
    setProcessandoId(poder.id_character_ability);
    setMensagem("");
    try {
      await axiosInstance.patch(
        `/character-abilities/${poder.id_character_ability}/toggle`,
        { is_active: !poder.ativo },
      );
      await carregar();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Não foi possível alternar essa habilidade.";
      setMensagem(msg);
    } finally {
      setProcessandoId(null);
    }
  }

  if (carregando) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        Carregando habilidades...
      </div>
    );
  }

  const grupos: PoderApi["origem"][] = ["classe", "raca"];

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      <p className="mb-1 text-sm uppercase tracking-widest text-[#F3B43F]">
        Habilidades
      </p>
      <p className="mb-4 text-xs text-white/50">
        Ative até as habilidades que seu nível já libera pra usá-las em combate —
        as bloqueadas aparecem só pra visualização até você subir de nível.
      </p>

      {mensagem && <p className="mb-3 text-sm text-red-400">{mensagem}</p>}

      {grupos.map((origem) => {
        const doGrupo = poderes.filter((p) => p.origem === origem);
        if (doGrupo.length === 0) return null;
        return (
          <div key={origem} className="mb-5 last:mb-0">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#F3B43F]/80">
              {ORIGEM_LABEL[origem]}
            </p>
            <div className="flex flex-col gap-2">
              {doGrupo.map((poder) => {
                const bloqueado = !poder.aprendido;
                const passivo = poder.tipo_poder === "Passivo";
                return (
                  <div
                    key={poder.id_power}
                    className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${
                      bloqueado
                        ? "border-white/10 bg-black/20 opacity-60"
                        : "border-[#F3B43F]/40 bg-[#3a2f24]"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-imFeel text-lg">{poder.nome}</span>
                        <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/60">
                          {poder.tipo_poder}
                        </span>
                        {bloqueado && (
                          <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-red-300">
                            Requer nível {poder.nivel_necessario}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-white/80">{poder.descricao}</p>
                      <DetalheDoPoder poder={poder} />
                    </div>

                    <div className="shrink-0">
                      {bloqueado ? (
                        <span className="text-xs text-white/40">Bloqueado</span>
                      ) : passivo ? (
                        <span className="rounded-lg bg-black/30 px-3 py-1 text-xs font-bold text-white/60">
                          Sempre ativo
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => alternar(poder)}
                          disabled={processandoId === poder.id_character_ability}
                          className={`rounded-lg px-3 py-1 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            poder.ativo
                              ? "bg-[#F3B43F] text-black hover:bg-[#e0a52f]"
                              : "bg-black/40 text-white/70 hover:bg-black/60"
                          }`}
                        >
                          {poder.ativo ? "Equipada" : "Equipar"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {poderes.length === 0 && (
        <p className="text-sm text-white/60">
          Sua classe e raça ainda não têm nenhuma habilidade configurada.
        </p>
      )}
    </div>
  );
}
