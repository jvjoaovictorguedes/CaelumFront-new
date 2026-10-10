"use client";
import { useEffect, useRef, useState } from "react";
import { usePvpSocket } from "@/contexts/PvpSocketContext";
import CombatActionBar from "@/components/combat/CombatActionBar";
import { StatusIconsRow, BuffIconsRow } from "@/components/combat/StatusEffectIcons";
import { resolveMediaUrl } from "@/utils/media-url";

interface FloatingText {
  id: number;
  text: string;
  color: string;
}

// "O Coração da Máquina Celestial" — Custódio do Meridiano (Fase 13/16).
// Clone estrutural de TempleGuardianLiveArena.tsx (mesmo raciocínio: a
// luta é solo e cada ação do jogador já resolve o turno INTEIRO numa
// única resposta — nunca "de quem é o turno"). Diferença visível: a
// recompensa de vitória é só ouro/xp fixo (eventPuzzleBossAttemptService.
// finalizarVitoria), nunca sigilos/itens sorteáveis.
export default function EventPuzzleCustodioLiveArena() {
  const {
    estadoCustodio,
    logCustodio,
    castCustodio,
    faseAlteradaCustodio,
    resultadoCustodio,
    erroCustodio,
    agirCustodio,
    limparBatalhaCustodio,
    limparErroCustodio,
  } = usePvpSocket();

  const [floatingBoss, setFloatingBoss] = useState<FloatingText[]>([]);
  const [floatingJogador, setFloatingJogador] = useState<FloatingText[]>([]);
  const [flashBoss, setFlashBoss] = useState(false);
  const [flashJogador, setFlashJogador] = useState(false);
  const [aguardandoResposta, setAguardandoResposta] = useState(false);
  const [faseToast, setFaseToast] = useState<string | null>(null);
  const attemptIdRef = useRef<number | null>(null);
  const vidaBossRef = useRef(0);
  const vidaJogadorRef = useRef(0);

  useEffect(() => {
    if (!estadoCustodio) return;
    const lutaNova = attemptIdRef.current !== estadoCustodio.attemptId;

    if (lutaNova) {
      attemptIdRef.current = estadoCustodio.attemptId;
      vidaBossRef.current = estadoCustodio.vidaBoss;
      vidaJogadorRef.current = estadoCustodio.vidaJogador;
      setFloatingBoss([]);
      setFloatingJogador([]);
      setAguardandoResposta(false);
      return;
    }

    const danoNoBoss = vidaBossRef.current - estadoCustodio.vidaBoss;
    if (danoNoBoss > 0) {
      dispararFloating(setFloatingBoss, `-${danoNoBoss}`, "#ff3333");
      piscar(setFlashBoss);
    } else if (danoNoBoss < 0) {
      dispararFloating(setFloatingBoss, `+${-danoNoBoss}`, "#44ff44");
    }
    const danoNoJogador = vidaJogadorRef.current - estadoCustodio.vidaJogador;
    if (danoNoJogador > 0) {
      dispararFloating(setFloatingJogador, `-${danoNoJogador}`, "#ff3333");
      piscar(setFlashJogador);
    } else if (danoNoJogador < 0) {
      dispararFloating(setFloatingJogador, `+${-danoNoJogador}`, "#44ff44");
    }
    vidaBossRef.current = estadoCustodio.vidaBoss;
    vidaJogadorRef.current = estadoCustodio.vidaJogador;
    setAguardandoResposta(false);
  }, [estadoCustodio]);

  useEffect(() => {
    if (erroCustodio) setAguardandoResposta(false);
  }, [erroCustodio]);

  useEffect(() => {
    if (!faseAlteradaCustodio?.fase) return;
    setFaseToast(faseAlteradaCustodio.fase);
    const timeout = setTimeout(() => setFaseToast(null), 4000);
    return () => clearTimeout(timeout);
  }, [faseAlteradaCustodio]);

  function piscar(setter: (v: boolean) => void) {
    setter(true);
    setTimeout(() => setter(false), 300);
  }

  function dispararFloating(setter: React.Dispatch<React.SetStateAction<FloatingText[]>>, text: string, color: string) {
    const id = Date.now() + Math.random();
    setter((atual) => [...atual, { id, text, color }]);
    setTimeout(() => setter((atual) => atual.filter((f) => f.id !== id)), 900);
  }

  if (!estadoCustodio) return null;

  const percentualBoss = Math.max(0, Math.min(100, (estadoCustodio.vidaBoss / Math.max(1, estadoCustodio.vidaMaxBoss)) * 100));
  const percentualVidaJogador = Math.max(0, Math.min(100, (estadoCustodio.vidaJogador / Math.max(1, estadoCustodio.vidaMaxJogador)) * 100));
  const percentualManaJogador = Math.max(0, Math.min(100, (estadoCustodio.manaJogador / Math.max(1, estadoCustodio.manaMaxJogador)) * 100));

  const cooldownsPorPoder: Record<number, number> = {};
  for (const [chave, turnos] of Object.entries(estadoCustodio.cooldownsJogador ?? {})) {
    const id = Number(chave.split(":")[1]);
    if (!Number.isNaN(id)) cooldownsPorPoder[id] = turnos;
  }

  const imagemBoss = resolveMediaUrl(estadoCustodio.imagemBoss);

  return (
    <div className="fixed inset-0 z-[90] overflow-hidden bg-[#1a1410]">
      <style jsx>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-25px) scale(1.15);
          }
          100% {
            opacity: 0;
            transform: translateY(-50px) scale(1);
          }
        }
        .animate-float-up {
          animation: floatUp 0.9s ease-out forwards;
        }
      `}</style>

      <div className="absolute inset-0 bg-gradient-to-b from-[#3a2f24] to-[#1f1813]" />
      <div className="absolute inset-0 bg-black/30" />
      {imagemBoss && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imagemBoss} alt={estadoCustodio.nomeBoss} className="absolute inset-0 h-full w-full object-cover opacity-30 blur-sm" />
      )}

      {faseToast && (
        <div className="absolute inset-x-0 top-24 z-30 flex justify-center">
          <p className="rounded-lg bg-black/70 px-4 py-2 font-imFeel text-lg text-[#F3B43F] shadow-lg">O Custódio entrou em {faseToast}!</p>
        </div>
      )}

      <div className="absolute inset-x-0 top-0 z-20 flex flex-col items-center p-3 text-center text-white drop-shadow-lg sm:p-4">
        <p className="text-[10px] uppercase tracking-widest text-[#F3B43F] sm:text-xs">
          Provação Final — Turno {estadoCustodio.turno}
          {estadoCustodio.faseAtual ? ` · ${estadoCustodio.faseAtual}` : ""}
        </p>
        <h1 className="font-imFeel text-xl leading-tight sm:text-2xl">{estadoCustodio.nomeBoss}</h1>

        <div className="pointer-events-none absolute -top-1 left-1/2 z-10 mt-14 flex -translate-x-1/2 gap-1">
          <StatusIconsRow instancias={estadoCustodio.statusBoss} />
          <BuffIconsRow buffs={estadoCustodio.buffsBoss} />
        </div>

        <div className="relative mt-8 w-56 sm:w-72">
          <div
            className={`h-3 w-full overflow-hidden rounded-full border-2 bg-black/60 transition-colors ${
              flashBoss ? "border-white" : "border-[#F3B43F]/60"
            }`}
          >
            <div className="h-full bg-red-600 transition-[width] duration-300" style={{ width: `${percentualBoss}%` }} />
          </div>
          <div className="pointer-events-none absolute -top-6 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center">
            {floatingBoss.map((ft) => (
              <span key={ft.id} className="animate-float-up absolute whitespace-nowrap text-lg font-bold" style={{ color: ft.color }}>
                {ft.text}
              </span>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-white/60">
            {estadoCustodio.vidaBoss.toLocaleString()} / {estadoCustodio.vidaMaxBoss.toLocaleString()}
          </p>
        </div>

        {castCustodio && (
          <p className="mt-2 animate-pulse text-sm font-bold text-[#F3B43F]">
            {estadoCustodio.nomeBoss} se prepara{castCustodio.nomePoder ? ` para usar ${castCustodio.nomePoder}` : " para atacar"}...
          </p>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-36 z-10 flex flex-col items-center px-4 sm:bottom-44">
        <div className="pointer-events-none relative mb-1 flex gap-1">
          <StatusIconsRow instancias={estadoCustodio.statusJogador} />
          <BuffIconsRow buffs={estadoCustodio.buffsJogador} />
        </div>
        <div
          className={`relative flex h-20 w-20 items-center justify-center rounded-xl border-2 bg-[#292018] transition-colors sm:h-24 sm:w-24 ${
            flashJogador ? "border-white" : "border-[#F3B43F]/60"
          }`}
        >
          <div className="pointer-events-none absolute -top-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center">
            {floatingJogador.map((ft) => (
              <span key={ft.id} className="animate-float-up absolute whitespace-nowrap text-base font-bold" style={{ color: ft.color }}>
                {ft.text}
              </span>
            ))}
          </div>
          <span className="text-2xl font-bold text-[#F3B43F]">Você</span>
        </div>
        <div className="mt-1 h-2 w-24 overflow-hidden rounded-full border border-black/50 bg-black/60 sm:w-28">
          <div className="h-full bg-red-600 transition-[width] duration-300" style={{ width: `${percentualVidaJogador}%` }} />
        </div>
        <div className="h-1.5 w-24 overflow-hidden rounded-full border border-black/50 bg-black/60 sm:w-28">
          <div className="h-full bg-blue-500 transition-[width] duration-300" style={{ width: `${percentualManaJogador}%` }} />
        </div>
        <p className="mt-1 text-[10px] text-white/60">
          {estadoCustodio.vidaJogador.toLocaleString()} / {estadoCustodio.vidaMaxJogador.toLocaleString()}
        </p>
      </div>

      {logCustodio.length > 0 && (
        <div className="absolute right-2 top-20 z-10 hidden max-h-40 w-56 overflow-y-auto rounded-lg bg-black/50 p-2 text-[11px] text-white/70 sm:block">
          {logCustodio.slice(-8).map((linha, indice) => (
            <p key={indice} className="leading-snug">
              {linha}
            </p>
          ))}
        </div>
      )}

      {!resultadoCustodio && (
        <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-3 pb-3 pt-10 sm:px-6">
          {erroCustodio && (
            <p className="mb-2 rounded-lg bg-black/60 px-3 py-1.5 text-center text-xs text-red-400">
              {erroCustodio}{" "}
              <button type="button" onClick={limparErroCustodio} className="underline">
                ok
              </button>
            </p>
          )}
          <CombatActionBar
            podeAgir={!aguardandoResposta}
            ocupado={aguardandoResposta}
            manaAtual={estadoCustodio.manaJogador}
            onAtaqueBasico={() => {
              if (aguardandoResposta) return;
              setAguardandoResposta(true);
              agirCustodio("attack");
            }}
            poderes={estadoCustodio.poderes.map((p) => ({
              id: p.id,
              combat_slot: p.combat_slot,
              nome: p.nome,
              imagem_url: p.imagem_url,
              custo_mana: p.custo_mana,
              escala_atributo: p.escala_atributo,
              valor_escala: p.valor_escala,
            }))}
            onUsarPoder={(powerId) => {
              if (aguardandoResposta) return;
              setAguardandoResposta(true);
              agirCustodio("power", powerId);
            }}
            consumiveis={[]}
            onUsarConsumivel={() => {}}
            cooldownsPorPoder={cooldownsPorPoder}
          />
        </div>
      )}

      {resultadoCustodio && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-6 text-center text-white shadow-2xl">
            <p className="mb-2 font-imFeel text-3xl">{resultadoCustodio.vitoria ? "O Custódio caiu!" : "Você foi derrotado..."}</p>

            {resultadoCustodio.vitoria && resultadoCustodio.recompensa && (
              <>
                {resultadoCustodio.recompensa.idempotente ? (
                  <p className="mb-2 text-sm text-white/60">Você já havia recebido a recompensa da primeira vitória.</p>
                ) : (
                  <p className="mb-2 text-[#F3B43F]">
                    +{resultadoCustodio.recompensa.ouroGanho} Ouro · +{resultadoCustodio.recompensa.xpGanho} XP
                  </p>
                )}
              </>
            )}

            {!resultadoCustodio.vitoria && (
              <p className="mb-3 text-sm text-white/60">O Custódio guarda sua forma — uma nova tentativa reinicia a luta do início.</p>
            )}

            <button onClick={limparBatalhaCustodio} className="mt-2 rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black hover:bg-[#a5710f]">
              Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
