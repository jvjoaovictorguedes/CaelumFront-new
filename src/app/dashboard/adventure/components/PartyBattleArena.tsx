"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { usePvpSocket } from "@/contexts/PvpSocketContext";
import { useCharacter } from "@/contexts/CharacterContext";
import CombatActionBar from "@/components/combat/CombatActionBar";
import { spriteForClass } from "./sprites/spriteForClass";
import { spriteForEnemy } from "./sprites/spriteForEnemy";

interface FloatingText {
  id: number;
  text: string;
  color: string;
}

// Batalha em grupo (N aliados vs 1 monstro escalado) — a MESMA ideia de
// campo de batalha em tela cheia da Aventura solo (fundo cobrindo a
// tela inteira, nome+vida flutuando acima da cabeça de cada um), só que
// generalizada pra N combatentes em vez de 2. Fica montada globalmente
// (ver DashboardLayout) e só renderiza algo quando o servidor manda
// "party:batalha-iniciada" — não depende de qual página o navegador
// está tecnicamente em cima.
export default function PartyBattleArena() {
  const router = useRouter();
  const { character } = useCharacter();
  const {
    batalhaGrupo,
    turnosGrupo,
    turnoAtualGrupo,
    rodadaAtualGrupo,
    resultadoGrupo,
    agirGrupo,
    limparBatalhaGrupo,
  } = usePvpSocket();

  const [vidaInimigo, setVidaInimigo] = useState(0);
  const [vidaMaxInimigo, setVidaMaxInimigo] = useState(1);
  const [vidasAliados, setVidasAliados] = useState<Record<number, number>>({});
  const [manasAliados, setManasAliados] = useState<Record<number, number>>({});
  const [floatingInimigo, setFloatingInimigo] = useState<FloatingText[]>([]);
  const [floatingAliados, setFloatingAliados] = useState<Record<number, FloatingText[]>>({});
  const [ultimoIndexProcessado, setUltimoIndexProcessado] = useState(0);

  useEffect(() => {
    if (!batalhaGrupo) return;
    setVidaInimigo(batalhaGrupo.inimigo.vida_atual);
    setVidaMaxInimigo(batalhaGrupo.inimigo.vida_maxima);
    setVidasAliados(Object.fromEntries(batalhaGrupo.membros.map((m) => [m.id, m.vida])));
    setManasAliados(Object.fromEntries(batalhaGrupo.membros.map((m) => [m.id, m.mana])));
    setUltimoIndexProcessado(0);
  }, [batalhaGrupo]);

  useEffect(() => {
    if (turnosGrupo.length <= ultimoIndexProcessado) return;
    const novos = turnosGrupo.slice(ultimoIndexProcessado);
    setUltimoIndexProcessado(turnosGrupo.length);

    for (const turno of novos) {
      if (turno.origem === "aliado") {
        if (typeof turno.vidaInimigo === "number") setVidaInimigo(turno.vidaInimigo);
        if (turno.idAtor && typeof turno.vidaAliado === "number") {
          setVidasAliados((atual) => ({ ...atual, [Number(turno.idAtor)]: turno.vidaAliado! }));
        }
        if (turno.idAtor && typeof turno.manaAliado === "number") {
          setManasAliados((atual) => ({ ...atual, [Number(turno.idAtor)]: turno.manaAliado! }));
        }
        if (turno.dano > 0) {
          dispararFloatingInimigo(`-${turno.dano}`, "#ff3333");
        } else if (turno.esquivou) {
          dispararFloatingInimigo("Esquivou!", "#cccccc");
        }
        if (turno.cura && turno.cura > 0 && turno.idAtor) {
          dispararFloatingAliado(Number(turno.idAtor), `+${turno.cura}`, "#44ff44");
        }
      } else {
        if (turno.idAlvo && typeof turno.vidaAliado === "number") {
          setVidasAliados((atual) => ({ ...atual, [turno.idAlvo!]: turno.vidaAliado! }));
        }
        if (turno.idAlvo) {
          if (turno.dano > 0) {
            dispararFloatingAliado(turno.idAlvo, `-${turno.dano}`, "#ff3333");
          } else if (turno.esquivou) {
            dispararFloatingAliado(turno.idAlvo, "Esquivou!", "#cccccc");
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnosGrupo]);

  function dispararFloatingInimigo(text: string, color: string) {
    const id = Date.now() + Math.random();
    setFloatingInimigo((atual) => [...atual, { id, text, color }]);
    setTimeout(() => setFloatingInimigo((atual) => atual.filter((f) => f.id !== id)), 900);
  }

  function dispararFloatingAliado(idAliado: number, text: string, color: string) {
    const id = Date.now() + Math.random();
    setFloatingAliados((atual) => ({
      ...atual,
      [idAliado]: [...(atual[idAliado] ?? []), { id, text, color }],
    }));
    setTimeout(() => {
      setFloatingAliados((atual) => ({
        ...atual,
        [idAliado]: (atual[idAliado] ?? []).filter((f) => f.id !== id),
      }));
    }, 900);
  }

  const meuId = character?.id;
  const meuTurno = batalhaGrupo ? turnoAtualGrupo === String(meuId) : false;
  const meuMembro = useMemo(
    () => batalhaGrupo?.membros.find((m) => m.id === meuId),
    [batalhaGrupo, meuId],
  );

  if (!batalhaGrupo) return null;

  const EnemySprite = spriteForEnemy(batalhaGrupo.inimigo.nome);

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
        @keyframes turnoPulse {
          0%,
          100% {
            box-shadow: 0 0 0 rgba(243, 180, 63, 0.6);
          }
          50% {
            box-shadow: 0 0 22px rgba(243, 180, 63, 0.9);
          }
        }
        .turno-ativo {
          animation: turnoPulse 1.4s infinite ease-in-out;
          border-radius: 9999px;
        }
      `}</style>

      <div className="absolute inset-0 bg-gradient-to-b from-[#3a2f24] to-[#1f1813]" />
      <div className="absolute inset-0 bg-black/30" />

      <div className="absolute inset-x-0 top-0 z-20 flex flex-col items-center p-3 text-center text-white drop-shadow-lg sm:p-4">
        <p className="text-[10px] uppercase tracking-widest text-[#F3B43F] sm:text-xs">
          {batalhaGrupo.zona.nome} — Aventura em grupo
        </p>
        <h1 className="font-imFeel text-xl leading-tight sm:text-2xl">
          {batalhaGrupo.inimigo.nome} (Nv. {batalhaGrupo.inimigo.nivel}) — Rodada {rodadaAtualGrupo}
        </h1>
      </div>

      {/* Aliados: empilhados à esquerda, cada um com nome+vida+mana acima
          da cabeça — mesmo critério do combate solo, só que N vezes. O
          aliado da vez ganha um glow pulsante em volta do sprite. */}
      <div className="absolute inset-y-0 left-0 z-10 flex w-[45%] flex-col items-center justify-center gap-16 py-24 sm:w-[38%] sm:gap-20">
        {batalhaGrupo.membros.map((membro) => {
          const PlayerSprite = spriteForClass(membro.classe);
          const vida = vidasAliados[membro.id] ?? membro.vida;
          const mana = manasAliados[membro.id] ?? membro.mana;
          const vivo = vida > 0;
          const daVez = turnoAtualGrupo === String(membro.id);
          return (
            <div key={membro.id} className={`relative flex flex-col items-center ${vivo ? "" : "opacity-40 grayscale"}`}>
              <div className="pointer-events-none absolute -top-16 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center">
                {(floatingAliados[membro.id] ?? []).map((ft) => (
                  <span
                    key={ft.id}
                    className="animate-float-up absolute whitespace-nowrap text-base font-bold sm:text-lg"
                    style={{ color: ft.color }}
                  >
                    {ft.text}
                  </span>
                ))}
              </div>

              <div className="pointer-events-none absolute -top-9 left-1/2 z-10 flex w-max -translate-x-1/2 flex-col items-center gap-0.5">
                <span className="whitespace-nowrap rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                  {membro.nome}
                  {daVez && vivo ? " ⚔" : ""}
                </span>
                <div className="h-1.5 w-16 overflow-hidden rounded-full border border-black/50 bg-black/60 sm:w-20">
                  <div className="h-full bg-red-600 transition-[width] duration-300" style={{ width: `${Math.max(0, Math.min(100, (vida / membro.vidaMax) * 100))}%` }} />
                </div>
                <div className="h-1 w-16 overflow-hidden rounded-full border border-black/50 bg-black/60 sm:w-20">
                  <div className="h-full bg-blue-500 transition-[width] duration-300" style={{ width: `${Math.max(0, Math.min(100, (mana / membro.manaMax) * 100))}%` }} />
                </div>
              </div>

              <div className={daVez && vivo ? "turno-ativo" : ""}>
                <PlayerSprite className="battle-sprite h-20 w-20 sm:h-28 sm:w-28" animState="idle" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Monstro à direita */}
      <div className="absolute inset-y-0 right-0 z-10 flex w-[45%] flex-col items-center justify-center sm:w-[38%]">
        <div className="relative flex flex-col items-center">
          <div className="pointer-events-none absolute -top-16 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center">
            {floatingInimigo.map((ft) => (
              <span
                key={ft.id}
                className="animate-float-up absolute whitespace-nowrap text-lg font-bold sm:text-2xl"
                style={{ color: ft.color }}
              >
                {ft.text}
              </span>
            ))}
          </div>

          <div className="pointer-events-none absolute -top-10 left-1/2 z-10 flex w-max -translate-x-1/2 flex-col items-center gap-0.5">
            <span className="whitespace-nowrap rounded bg-black/60 px-1.5 py-0.5 text-xs font-bold text-white shadow">
              {batalhaGrupo.inimigo.nome}
            </span>
            <div className="h-1.5 w-24 overflow-hidden rounded-full border border-black/50 bg-black/60 sm:w-32">
              <div className="h-full bg-red-600 transition-[width] duration-300" style={{ width: `${Math.max(0, Math.min(100, (vidaInimigo / vidaMaxInimigo) * 100))}%` }} />
            </div>
          </div>

          <EnemySprite className="battle-sprite h-32 w-32 sm:h-48 sm:w-48" animState="idle" />
        </div>
      </div>

      {!resultadoGrupo && (
        <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-3 pb-3 pt-10 sm:px-6">
          {meuTurno ? (
            <CombatActionBar
              podeAgir={meuTurno}
              ocupado={false}
              manaAtual={manasAliados[meuId ?? -1] ?? meuMembro?.mana ?? 0}
              onAtaqueBasico={() => agirGrupo("attack")}
              poderes={(meuMembro?.poderes ?? []).map((p) => ({
                id: p.id,
                nome: p.nome,
                imagem_url: p.imagem_url,
                custo_mana: p.custo_mana,
                descricao: "",
              }))}
              onUsarPoder={(powerId) => agirGrupo("power", powerId)}
              consumiveis={meuMembro?.consumiveis ?? []}
              onUsarConsumivel={(itemId) => agirGrupo("item", itemId)}
            />
          ) : (
            <p className="pb-4 text-center text-sm text-white/70">
              Aguardando o turno de {batalhaGrupo.membros.find((m) => String(m.id) === turnoAtualGrupo)?.nome ?? "..."}
            </p>
          )}
        </div>
      )}

      {resultadoGrupo && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-6 text-center text-white shadow-2xl">
            <p className="mb-2 font-imFeel text-3xl">
              {resultadoGrupo.vitoria ? "Vitória em grupo!" : "O grupo caiu..."}
            </p>
            {resultadoGrupo.vitoria && meuId && resultadoGrupo.recompensas[meuId] && (
              <p className="mb-3">
                +{resultadoGrupo.recompensas[meuId].experiencia} de experiência
                {" · +"}
                {resultadoGrupo.recompensas[meuId].dinheiro} moedas
              </p>
            )}
            {resultadoGrupo.vitoria && meuId && resultadoGrupo.drops[meuId] && (
              <p className="mb-3 font-bold text-[#F3B43F]">
                {resultadoGrupo.drops[meuId].tipo === "item" && resultadoGrupo.drops[meuId].item
                  ? `Você encontrou: ${resultadoGrupo.drops[meuId].item!.nome}!`
                  : `+${resultadoGrupo.drops[meuId].dinheiro} moedas extras encontradas!`}
              </p>
            )}
            <button
              onClick={() => {
                limparBatalhaGrupo();
                router.push("/dashboard/adventure");
              }}
              className="rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black hover:bg-[#a5710f]"
            >
              Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
