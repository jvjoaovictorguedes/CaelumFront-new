"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { resolveMediaUrl } from "@/utils/media-url";
import { useCharacter } from "@/contexts/CharacterContext";

interface AlvoApi {
  id: number;
  nome: string;
  imagem_url: string | null;
}
interface ZonaApi {
  id: number;
  nome: string;
}
interface CacadaApi {
  id: number;
  status: "Offered" | "Active" | "Completed" | "Abandoned" | "Expired";
  title: string;
  story: string;
  target: AlvoApi | null;
  zone: ZonaApi | null;
  difficulty: string;
  difficultyLabel: string;
  hpModifierPercent: number;
  damageModifierPercent: number;
  quantityRequired: number;
  progress: number;
  goldReward: number;
  reputationReward: number;
  recommendedPower: number | null;
  rotationStart: string;
  rotationEndsAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
}

interface EstadoApi {
  serverTime: string;
  hunterReputation: { points: number; level: number; roman: string; title: string; nextLevelAt: number | null };
  stats: { total: number; dangerous: number; difficult: number; deadly: number; nightmare: number; extermination: number };
  offer: CacadaApi | null;
  activeHunt: CacadaApi | null;
}

const COR_DIFICULDADE: Record<string, string> = {
  Dangerous: "border-yellow-500/70 text-yellow-300",
  Difficult: "border-orange-500/70 text-orange-300",
  Deadly: "border-red-500/70 text-red-300",
  Nightmare: "border-purple-500/70 text-purple-300",
  Extermination: "border-fuchsia-500/70 text-fuchsia-300",
};

function formatarContagem(ms: number) {
  if (ms <= 0) return "renovando...";
  const horas = Math.floor(ms / 3_600_000);
  const minutos = Math.floor((ms % 3_600_000) / 60_000);
  const segundos = Math.floor((ms % 60_000) / 1000);
  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

function ImagemAlvo({ alvo }: { alvo: AlvoApi | null }) {
  const src = resolveMediaUrl(alvo?.imagem_url ?? null);
  if (!alvo) return null;
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alvo.nome} className="h-full w-full rounded-lg object-contain p-1" />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center rounded-lg text-lg font-bold text-[#F3B43F]/80">
      {alvo.nome.charAt(0).toUpperCase()}
    </div>
  );
}

export default function MuralDeCacadasPanel() {
  const { refreshCharacter } = useCharacter();
  const [estado, setEstado] = useState<EstadoApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const intervalo = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  const carregar = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{ data?: EstadoApi }>("/adventure-guild/hunt");
      setEstado(resp.data?.data ?? null);
    } catch (error) {
      console.error("Erro ao carregar Caçadas:", error);
      setMensagem("Não foi possível carregar as Caçadas.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function aceitar(id: number) {
    if (processando) return;
    setProcessando(true);
    setMensagem("");
    try {
      await axiosInstance.post(`/adventure-guild/hunt/${id}/accept`);
      await Promise.all([carregar(), refreshCharacter()]);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Não foi possível aceitar a Caçada.";
      setMensagem(msg);
    } finally {
      setProcessando(false);
    }
  }

  async function abandonar(id: number) {
    if (processando) return;
    if (!window.confirm("Abandonar a Caçada perde todo o progresso e não concede nenhuma recompensa. Confirmar?")) return;
    setProcessando(true);
    setMensagem("");
    try {
      await axiosInstance.post(`/adventure-guild/hunt/${id}/abandon`);
      await Promise.all([carregar(), refreshCharacter()]);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Não foi possível abandonar a Caçada.";
      setMensagem(msg);
    } finally {
      setProcessando(false);
    }
  }

  if (carregando) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        Carregando Caçadas...
      </div>
    );
  }

  const cacada = estado?.activeHunt ?? estado?.offer ?? null;
  const ativa = Boolean(estado?.activeHunt);

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      <p className="mb-1 text-sm uppercase tracking-widest text-[#F3B43F]">Mural de Caçadas</p>

      {estado && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#F3B43F]/30 bg-black/30 p-3">
          <div>
            <p className="font-imFeel text-2xl">
              {estado.hunterReputation.title} {estado.hunterReputation.roman}
            </p>
            <p className="text-xs text-white/60">
              {estado.hunterReputation.points.toLocaleString("pt-BR")}
              {estado.hunterReputation.nextLevelAt != null
                ? ` / ${estado.hunterReputation.nextLevelAt.toLocaleString("pt-BR")}`
                : " (nível máximo)"}
            </p>
          </div>
          <span className="rounded-full bg-[#F3B43F] px-3 py-1 text-xs font-bold uppercase text-black">
            Caçadas concluídas: {estado.stats.total}
          </span>
        </div>
      )}

      {mensagem && <p className="mb-3 text-sm text-red-400">{mensagem}</p>}

      {!cacada ? (
        <p className="text-sm text-white/60">Nenhuma Caçada disponível no momento.</p>
      ) : (
        <div
          className={`rounded-xl border-2 bg-[#3a2f24] p-4 ${
            COR_DIFICULDADE[cacada.difficulty] ?? "border-white/30 text-white"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
              Caçada · {cacada.difficultyLabel}
            </span>
            {!ativa && (
              <span className="text-[10px] text-white/50">
                Nova oferta em: {formatarContagem(new Date(cacada.rotationEndsAt).getTime() - agora)}
              </span>
            )}
          </div>

          <p className="mt-2 font-imFeel text-xl text-white">{cacada.title}</p>
          <p className="mt-1 text-sm text-white/70">{cacada.story}</p>

          <div className="mt-3 flex items-center gap-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-black/20">
              <ImagemAlvo alvo={cacada.target} />
            </div>
            <div className="min-w-0">
              <p className="truncate font-bold text-white">{cacada.target?.nome ?? "?"}</p>
              <p className="text-[11px] text-white/50">Região: {cacada.zone?.nome ?? "?"}</p>
              <p className="text-[11px] text-white/50">
                Objetivo: Eliminar {cacada.quantityRequired}
                {ativa ? ` (progresso: ${cacada.progress}/${cacada.quantityRequired})` : ""}
              </p>
            </div>
          </div>

          {ativa && (
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/30">
              <div
                className="h-full bg-[#F3B43F]"
                style={{ width: `${Math.min(100, (cacada.progress / cacada.quantityRequired) * 100)}%` }}
              />
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/70 sm:grid-cols-4">
            <p>Vida do alvo: +{cacada.hpModifierPercent}%</p>
            <p>Dano do alvo: +{cacada.damageModifierPercent}%</p>
            {cacada.recommendedPower != null && <p>Poder recomendado: {cacada.recommendedPower.toLocaleString("pt-BR")}</p>}
            <p className="text-[#F3B43F]">
              {cacada.goldReward.toLocaleString("pt-BR")} ouro · +{cacada.reputationReward} Reputação
            </p>
          </div>

          {!ativa && cacada.status === "Offered" && (
            <button
              type="button"
              onClick={() => aceitar(cacada.id)}
              disabled={processando}
              className="mt-4 w-full rounded-lg bg-[#F3B43F] px-4 py-2 text-sm font-bold text-black transition hover:bg-[#e0a52f] disabled:opacity-50"
            >
              {processando ? "Aceitando..." : "Aceitar Caçada"}
            </button>
          )}
          {ativa && (
            <button
              type="button"
              onClick={() => abandonar(cacada.id)}
              disabled={processando}
              className="mt-4 w-full rounded-lg border border-red-600 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-900/30 disabled:opacity-50"
            >
              {processando ? "Abandonando..." : "Abandonar Caçada"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
