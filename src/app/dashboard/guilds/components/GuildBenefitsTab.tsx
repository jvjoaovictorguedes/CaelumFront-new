"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import type { Permissao } from "./types";

interface NivelBuffApi {
  bonusPercentual?: number;
  bonusPontosPercentuais?: number;
  custo: number;
  nivelGuildaMinimo: number;
}

interface BeneficioApi {
  tipo: "XP" | "GOLD" | "FORJA";
  nivel_atual: number;
  bonus_atual: NivelBuffApi | null;
  proximo_nivel: (NivelBuffApi & { nivel: number }) | null;
  guild_nivel_atual: number;
  tesouro_atual: number;
}

const LABEL_TIPO: Record<BeneficioApi["tipo"], string> = {
  XP: "Experiência",
  GOLD: "Ouro",
  FORJA: "Forja",
};

function descreverBonus(tipo: BeneficioApi["tipo"], config: NivelBuffApi | null) {
  if (!config) return "sem bônus";
  if (tipo === "FORJA") return `+${config.bonusPontosPercentuais} p.p. na chance de +1 qualidade`;
  return `+${config.bonusPercentual}%`;
}

export default function GuildBenefitsTab({
  idGuild,
  pode,
}: {
  idGuild: number;
  pode: Record<Permissao, boolean>;
}) {
  const [beneficios, setBeneficios] = useState<BeneficioApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState("");

  const carregar = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{ data?: { beneficios?: BeneficioApi[] } }>(
        `/guilds/${idGuild}/benefits`,
      );
      setBeneficios(resp.data?.data?.beneficios ?? []);
    } catch (error) {
      console.error("Erro ao carregar benefícios da guilda:", error);
      setMensagem("Não foi possível carregar os benefícios da guilda.");
    } finally {
      setCarregando(false);
    }
  }, [idGuild]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function comprar(tipo: BeneficioApi["tipo"]) {
    if (processando) return;
    setProcessando(tipo);
    setMensagem("");
    try {
      await axiosInstance.post(`/guilds/${idGuild}/benefits/${tipo}/upgrade`);
      await carregar();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Não foi possível comprar este benefício.";
      setMensagem(msg);
    } finally {
      setProcessando(null);
    }
  }

  if (carregando) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-white">
        Carregando benefícios da guilda...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-white/50">
        Benefícios pertencem à guilda — todo membro ativo (fora de carência) é elegível enquanto estiver nela.
        Comprar um nível gasta Gold do Tesouro.
      </p>
      {mensagem && <p className="text-sm text-red-400">{mensagem}</p>}

      {beneficios.map((b) => {
        const tesouroInsuficiente = b.proximo_nivel ? b.tesouro_atual < b.proximo_nivel.custo : false;
        const nivelGuildaInsuficiente = b.proximo_nivel ? b.guild_nivel_atual < b.proximo_nivel.nivelGuildaMinimo : false;
        return (
          <div key={b.tipo} className="rounded-xl border border-[#F3B43F]/30 bg-[#3a2f24] p-4 text-white">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-imFeel text-lg">{LABEL_TIPO[b.tipo]}</p>
              <span className="text-xs text-white/50">Nível {b.nivel_atual} / 5</span>
            </div>
            <p className="mt-1 text-sm text-white/70">
              Atual: {descreverBonus(b.tipo, b.bonus_atual)}
            </p>

            {b.proximo_nivel ? (
              <>
                <p className="mt-1 text-xs text-white/50">
                  Próximo: Nível {b.proximo_nivel.nivel} · {descreverBonus(b.tipo, b.proximo_nivel)} · Custo:{" "}
                  {b.proximo_nivel.custo.toLocaleString()} Gold · Requer Guilda Nível {b.proximo_nivel.nivelGuildaMinimo}
                </p>
                {pode.comprar_beneficios ? (
                  <button
                    type="button"
                    onClick={() => comprar(b.tipo)}
                    disabled={processando === b.tipo || tesouroInsuficiente || nivelGuildaInsuficiente}
                    className="mt-2 rounded-lg bg-[#F3B43F] px-4 py-1.5 text-sm font-bold text-black transition hover:bg-[#e0a52f] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {processando === b.tipo ? "Comprando..." : "Comprar nível"}
                  </button>
                ) : (
                  <p className="mt-2 text-xs text-white/40">Só o líder da guilda pode comprar benefícios.</p>
                )}
                {nivelGuildaInsuficiente && (
                  <p className="mt-1 text-xs text-red-400">Falta Nível de Guilda.</p>
                )}
                {!nivelGuildaInsuficiente && tesouroInsuficiente && (
                  <p className="mt-1 text-xs text-red-400">Falta Gold no Tesouro.</p>
                )}
              </>
            ) : (
              <p className="mt-1 text-xs text-white/40">Nível máximo atingido.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
