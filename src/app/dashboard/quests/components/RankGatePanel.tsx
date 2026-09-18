"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import CombatArena from "@/app/dashboard/adventure/components/CombatArena";

type Dificuldade = "Facil" | "Dificil" | "MuitoDificil";

const LABEL_DIFICULDADE: Record<Dificuldade, string> = {
  Facil: "Fácil",
  Dificil: "Difícil",
  MuitoDificil: "Muito Difícil",
};

const COR_DIFICULDADE: Record<Dificuldade, string> = {
  Facil: "border-green-500/50 hover:bg-green-950/30",
  Dificil: "border-yellow-500/50 hover:bg-yellow-950/30",
  MuitoDificil: "border-red-500/50 hover:bg-red-950/30",
};

interface PortalApi {
  id: number;
  rank: string;
  nome_chefe: string;
  descricao: string;
  nivel_recomendado: number;
  vida: number;
  recompensa_dinheiro: number;
  recompensa_xp: number;
  imagem_url?: string | null;
}

interface StatusPortalApi {
  rank_atual: string;
  proximo_rank: string | null;
  portal: PortalApi | null;
  dificuldades: Dificuldade[];
  pontos_atual: number;
  pontos_necessarios: number;
  pontos_por_dificuldade: Record<Dificuldade, number>;
  pode_tentar: boolean;
  cooldown_restante_ms: number;
  encontro_ativo: { dificuldade: Dificuldade; enemy: EnemyApi } | null;
}

interface EnemyApi {
  nome: string;
  nivel: number;
  vida_atual: number;
  vida_maxima: number;
  forca: number;
  vitalidade: number;
  agilidade: number;
  velocidade: number;
  dano_base: number;
}

interface CharacterApi {
  id: number;
  nome: string;
  nivel: number;
  vitalidade: number;
  inteligencia: number;
  vida_atual: number;
  vida_maxima?: number;
  mana_atual: number;
  mana_maxima?: number;
  experiencia?: number;
  pontos_distribuir?: number;
  Class?: { nome?: string };
}

interface AbilityApi {
  id: number;
  is_active: boolean;
  Power: {
    id: number;
    nome: string;
    descricao: string;
    tipo_poder: string;
    custo_mana: number;
    dano_base: number;
    cura_base: number;
  };
}

function formatarCooldown(ms: number) {
  const totalSegundos = Math.ceil(ms / 1000);
  const min = Math.floor(totalSegundos / 60);
  const seg = totalSegundos % 60;
  return min > 0 ? `${min}min ${seg}s` : `${seg}s`;
}

export default function RankGatePanel({ characterId }: { characterId: number }) {
  const [status, setStatus] = useState<StatusPortalApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [entrando, setEntrando] = useState<Dificuldade | null>(null);
  const [mensagem, setMensagem] = useState("");

  // Só carregados quando o combate de verdade começa — a Aventura já
  // faz o mesmo (busca isso uma vez, não em todo carregamento da tela).
  const [combate, setCombate] = useState<{
    character: CharacterApi;
    abilities: AbilityApi[];
    enemy: EnemyApi;
    dificuldade: Dificuldade;
  } | null>(null);

  const carregarStatus = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{ data?: StatusPortalApi }>(
        `/characters/${characterId}/rank-gate`,
      );
      setStatus(resp.data?.data ?? null);
    } catch (error) {
      console.error("Erro ao carregar portal de ranque:", error);
      setMensagem("Não foi possível carregar o portal.");
    } finally {
      setCarregando(false);
    }
  }, [characterId]);

  useEffect(() => {
    carregarStatus();
  }, [carregarStatus]);

  // Recontagem local do cooldown pra não precisar recarregar a página
  // pra ver o botão liberar de novo.
  useEffect(() => {
    if (!status || status.cooldown_restante_ms <= 0) return;
    const timer = setInterval(() => {
      setStatus((atual) => {
        if (!atual) return atual;
        const restante = atual.cooldown_restante_ms - 1000;
        return { ...atual, cooldown_restante_ms: Math.max(0, restante), pode_tentar: restante <= 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  const buscarCharacterEAbilities = useCallback(async () => {
    const [respCharacter, respAbilities] = await Promise.all([
      axiosInstance.get<{ data?: { character?: CharacterApi } }>(`/characters/${characterId}`),
      axiosInstance.get<{ data?: { characterAbilities?: AbilityApi[] } }>("/character-abilities", {
        params: { characterId },
      }),
    ]);
    const character = respCharacter.data?.data?.character;
    if (!character) throw new Error("Não foi possível carregar o personagem.");
    const abilities = (respAbilities.data?.data?.characterAbilities ?? []).filter(
      (a) => a.is_active && a.Power?.tipo_poder === "Ativo",
    );
    return { character, abilities };
  }, [characterId]);

  const entrarNoPortal = useCallback(
    async (dificuldade: Dificuldade) => {
      if (entrando) return;
      setEntrando(dificuldade);
      setMensagem("");
      try {
        // Precisa ser em sequência, não em paralelo: /start cura a vida/
        // mana antes de entrar no portal — buscar o personagem ANTES
        // dessa cura commitar mostrava vida/mana desatualizada (do
        // estado de antes de entrar) na primeira renderização do combate.
        const respStart = await axiosInstance.post<{
          data?: { enemy?: EnemyApi; character?: { vida_atual: number; mana_atual: number } };
        }>(`/characters/${characterId}/rank-gate/start`, { dificuldade });
        const enemy = respStart.data?.data?.enemy;
        const characterCurado = respStart.data?.data?.character;
        if (!enemy) throw new Error("Não foi possível gerar o chefe do portal.");

        const { character, abilities } = await buscarCharacterEAbilities();
        setCombate({
          character: characterCurado ? { ...character, ...characterCurado } : character,
          abilities,
          enemy,
          dificuldade,
        });
      } catch (error: unknown) {
        const msg =
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Não foi possível entrar no portal.";
        setMensagem(msg);
      } finally {
        setEntrando(null);
      }
    },
    [characterId, entrando, buscarCharacterEAbilities],
  );

  // Combate em andamento retomado (troca de aba/reload não perde o chefe).
  useEffect(() => {
    if (!status?.encontro_ativo || combate) return;
    buscarCharacterEAbilities()
      .then(({ character, abilities }) => {
        setCombate({
          character,
          abilities,
          enemy: status.encontro_ativo!.enemy,
          dificuldade: status.encontro_ativo!.dificuldade,
        });
      })
      .catch((error) => console.error("Erro ao retomar combate do portal:", error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.encontro_ativo]);

  if (combate) {
    return (
      <CombatArena
        key={`${combate.dificuldade}-${combate.enemy.vida_atual}-${combate.enemy.nome}`}
        character={combate.character}
        abilities={combate.abilities}
        initialEnemy={combate.enemy}
        actionEndpoint={`/characters/${characterId}/rank-gate/action`}
        labelBotaoVitoria="Enfrentar de novo"
        tituloZona="Portal de Ranque"
        tituloArena={LABEL_DIFICULDADE[combate.dificuldade]}
        onVitoria={() => {
          setCombate(null);
          entrarNoPortal(combate.dificuldade);
        }}
        onDerrota={() => {
          setCombate(null);
          carregarStatus();
        }}
      />
    );
  }

  if (carregando) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        Carregando portal...
      </div>
    );
  }

  if (!status) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        {mensagem || "Não foi possível carregar o portal de ranque."}
      </div>
    );
  }

  const percentualPontos = Math.min(100, (status.pontos_atual / status.pontos_necessarios) * 100);

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm uppercase tracking-widest text-[#F3B43F]">Portal de Ranque</p>
          <p className="text-xs text-white/50">
            Seu ranque atual: <span className="font-bold text-white">{status.rank_atual}</span>
            {status.proximo_rank && (
              <> — vença o portal pra subir pra <span className="font-bold text-white">{status.proximo_rank}</span></>
            )}
          </p>
        </div>
      </div>

      {!status.portal ? (
        <p className="text-sm text-white/60">
          {status.proximo_rank
            ? "Nenhum portal cadastrado para o seu ranque ainda."
            : "Você já está no ranque máximo (S++). Não há mais portais a vencer."}
        </p>
      ) : (
        <div className="rounded-xl border border-[#F3B43F]/40 bg-[#3a2f24] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-imFeel text-xl">{status.portal.nome_chefe}</span>
            <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/60">
              Nível recomendado {status.portal.nivel_recomendado}
            </span>
          </div>
          <p className="mt-2 text-sm text-white/80">{status.portal.descricao}</p>

          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-white/60">
              <span>Progresso pro próximo ranque</span>
              <span>
                {status.pontos_atual}/{status.pontos_necessarios} pontos
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/40">
              <div className="h-full bg-[#F3B43F]" style={{ width: `${percentualPontos}%` }} />
            </div>
          </div>

          <p className="mt-3 text-xs uppercase tracking-widest text-white/50">Escolha a dificuldade</p>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {status.dificuldades.map((dificuldade) => (
              <button
                key={dificuldade}
                type="button"
                onClick={() => entrarNoPortal(dificuldade)}
                disabled={Boolean(entrando) || !status.pode_tentar}
                className={`rounded-xl border-2 bg-black/20 p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${COR_DIFICULDADE[dificuldade]}`}
              >
                <p className="font-bold">{LABEL_DIFICULDADE[dificuldade]}</p>
                <p className="text-xs text-white/60">
                  +{status.pontos_por_dificuldade[dificuldade]} pontos por vitória
                </p>
                <p className="mt-1 text-[10px] text-white/40">
                  {entrando === dificuldade ? "Entrando..." : "Toque pra entrar"}
                </p>
              </button>
            ))}
          </div>

          {!status.pode_tentar && status.cooldown_restante_ms > 0 && (
            <p className="mt-3 text-xs text-white/50">
              Disponível em {formatarCooldown(status.cooldown_restante_ms)}
            </p>
          )}
        </div>
      )}

      {mensagem && <p className="mt-3 text-sm text-red-400">{mensagem}</p>}
    </div>
  );
}
