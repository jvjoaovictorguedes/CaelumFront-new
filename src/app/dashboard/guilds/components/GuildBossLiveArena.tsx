"use client";

import { useEffect, useRef, useState } from "react";
import { usePvpSocket, type TurnoBossGuildaPayload } from "@/contexts/PvpSocketContext";
import { useCharacter } from "@/contexts/CharacterContext";
import CombatActionBar from "@/components/combat/CombatActionBar";

interface FloatingText {
  id: number;
  text: string;
  color: string;
}

// Batalha ao vivo do Boss da Guilda (V2.0) — mesma ideia de tela cheia
// global da Aventura em grupo (PartyBattleArena.tsx), montada uma vez
// em DashboardLayout e só renderizando algo quando o servidor manda
// "guildboss:batalha-iniciada". Sem sprites/animação de movimento de
// propósito (o Boss da Guilda não tem arte própria cadastrada ainda,
// só nome/descrição/ícone genérico) — HP/mana em tempo real e um flash
// na borda a cada golpe já cobrem o essencial de "sentir" a luta.
export default function GuildBossLiveArena() {
  const { character } = useCharacter();
  const {
    batalhaBossGuilda,
    turnosBossGuilda,
    turnoAtualBossGuilda,
    rodadaAtualBossGuilda,
    resultadoBossGuilda,
    agirBossGuilda,
    limparBatalhaBossGuilda,
  } = usePvpSocket();

  const [vidaChefe, setVidaChefe] = useState(0);
  const [vidasAliados, setVidasAliados] = useState<Record<number, number>>({});
  const [manasAliados, setManasAliados] = useState<Record<number, number>>({});
  const [floatingChefe, setFloatingChefe] = useState<FloatingText[]>([]);
  const [floatingAliados, setFloatingAliados] = useState<Record<number, FloatingText[]>>({});
  const [flashChefe, setFlashChefe] = useState(false);
  const [flashAliados, setFlashAliados] = useState<Record<number, boolean>>({});
  const ultimoIndexRef = useRef(0);

  useEffect(() => {
    if (!batalhaBossGuilda) return;
    setVidaChefe(batalhaBossGuilda.vidaAtual);
    setVidasAliados(Object.fromEntries(batalhaBossGuilda.membros.map((m) => [m.id, m.vida])));
    setManasAliados(Object.fromEntries(batalhaBossGuilda.membros.map((m) => [m.id, m.mana])));
    setFloatingChefe([]);
    setFloatingAliados({});
    ultimoIndexRef.current = 0;
  }, [batalhaBossGuilda]);

  useEffect(() => {
    if (turnosBossGuilda.length <= ultimoIndexRef.current) return;
    const novos = turnosBossGuilda.slice(ultimoIndexRef.current);
    ultimoIndexRef.current = turnosBossGuilda.length;

    for (const turno of novos) processarTurno(turno);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnosBossGuilda]);

  function processarTurno(turno: TurnoBossGuildaPayload) {
    if (typeof turno.vidaChefe === "number") setVidaChefe(turno.vidaChefe);

    if (turno.origem === "aliado") {
      const idAtor = turno.idAtor ? Number(turno.idAtor) : undefined;
      if (turno.dano > 0) {
        dispararFloatingChefe(`-${turno.dano}`, "#ff3333");
        piscarChefe();
      } else if (turno.esquivou) {
        dispararFloatingChefe("Esquivou!", "#cccccc");
      }
      if (idAtor && typeof turno.vidaAliado === "number") {
        setVidasAliados((atual) => ({ ...atual, [idAtor]: turno.vidaAliado! }));
      }
      if (idAtor && typeof turno.manaAliado === "number") {
        setManasAliados((atual) => ({ ...atual, [idAtor]: turno.manaAliado! }));
      }
      if (idAtor && turno.cura && turno.cura > 0) {
        dispararFloatingAliado(idAtor, `+${turno.cura}`, "#44ff44");
      }
    } else {
      const idAlvo = turno.idAlvo;
      if (idAlvo) {
        if (turno.dano > 0) {
          dispararFloatingAliado(idAlvo, `-${turno.dano}`, "#ff3333");
          piscarAliado(idAlvo);
        } else if (turno.esquivou) {
          dispararFloatingAliado(idAlvo, "Esquivou!", "#cccccc");
        }
        if (typeof turno.vidaAliado === "number") {
          setVidasAliados((atual) => ({ ...atual, [idAlvo]: turno.vidaAliado! }));
        }
      }
    }
  }

  function piscarChefe() {
    setFlashChefe(true);
    setTimeout(() => setFlashChefe(false), 300);
  }

  function piscarAliado(id: number) {
    setFlashAliados((atual) => ({ ...atual, [id]: true }));
    setTimeout(() => setFlashAliados((atual) => ({ ...atual, [id]: false })), 300);
  }

  function dispararFloatingChefe(text: string, color: string) {
    const id = Date.now() + Math.random();
    setFloatingChefe((atual) => [...atual, { id, text, color }]);
    setTimeout(() => setFloatingChefe((atual) => atual.filter((f) => f.id !== id)), 900);
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
  const meuTurno = batalhaBossGuilda ? turnoAtualBossGuilda === String(meuId) : false;
  const meuMembro = batalhaBossGuilda?.membros.find((m) => m.id === meuId);

  if (!batalhaBossGuilda) return null;

  const vidaTotalChefe = batalhaBossGuilda.vidaTotal || 1;
  const percentualChefe = Math.max(0, Math.min(100, (vidaChefe / vidaTotalChefe) * 100));

  const premioMaiorDano = resultadoBossGuilda?.recompensas?.premioMaiorDano ?? null;
  const meuPremio = premioMaiorDano?.idPersonagem === meuId ? premioMaiorDano : null;
  const minhaRecompensa = resultadoBossGuilda?.recompensas?.participantes.find((p) => p.idPersonagem === meuId);

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
          border-radius: 1rem;
        }
      `}</style>

      <div className="absolute inset-0 bg-gradient-to-b from-[#3a2f24] to-[#1f1813]" />
      <div className="absolute inset-0 bg-black/30" />

      <div className="absolute inset-x-0 top-0 z-20 flex flex-col items-center p-3 text-center text-white drop-shadow-lg sm:p-4">
        <p className="text-[10px] uppercase tracking-widest text-[#F3B43F] sm:text-xs">
          Boss da Guilda — Rodada {rodadaAtualBossGuilda}
        </p>
        <h1 className="font-imFeel text-xl leading-tight sm:text-2xl">{batalhaBossGuilda.nomeChefe}</h1>

        <div className="relative mt-1 w-56 sm:w-72">
          <div
            className={`h-3 w-full overflow-hidden rounded-full border-2 bg-black/60 transition-colors ${
              flashChefe ? "border-white" : "border-[#F3B43F]/60"
            }`}
          >
            <div
              className="h-full bg-red-600 transition-[width] duration-300"
              style={{ width: `${percentualChefe}%` }}
            />
          </div>
          <div className="pointer-events-none absolute -top-6 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center">
            {floatingChefe.map((ft) => (
              <span
                key={ft.id}
                className="animate-float-up absolute whitespace-nowrap text-lg font-bold"
                style={{ color: ft.color }}
              >
                {ft.text}
              </span>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-white/60">
            {vidaChefe.toLocaleString()} / {vidaTotalChefe.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Aliados — mesma lista que a Aventura em grupo, sem sprite
          próprio (só nome/classe + barras). */}
      <div className="absolute inset-0 z-10 flex flex-wrap items-center justify-center gap-4 px-4 pt-28 pb-40 sm:gap-6">
        {batalhaBossGuilda.membros.map((membro) => {
          const vida = vidasAliados[membro.id] ?? membro.vida;
          const mana = manasAliados[membro.id] ?? membro.mana;
          const vivo = vida > 0;
          const daVez = turnoAtualBossGuilda === String(membro.id);
          const piscando = flashAliados[membro.id];
          return (
            <div
              key={membro.id}
              className={`relative flex flex-col items-center ${vivo ? "" : "opacity-40 grayscale"}`}
            >
              <div className="pointer-events-none absolute -top-10 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center">
                {(floatingAliados[membro.id] ?? []).map((ft) => (
                  <span
                    key={ft.id}
                    className="animate-float-up absolute whitespace-nowrap text-base font-bold"
                    style={{ color: ft.color }}
                  >
                    {ft.text}
                  </span>
                ))}
              </div>

              <div
                className={`flex h-16 w-16 items-center justify-center rounded-xl border-2 bg-[#292018] text-2xl font-bold text-[#F3B43F] transition-colors sm:h-20 sm:w-20 ${
                  piscando ? "border-white" : "border-[#F3B43F]/60"
                } ${daVez && vivo ? "turno-ativo" : ""}`}
              >
                {membro.nome.charAt(0).toUpperCase()}
              </div>

              <span className="mt-1 max-w-[6rem] truncate whitespace-nowrap rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                {membro.nome}
                {daVez && vivo ? " ⚔" : ""}
              </span>
              <div className="mt-0.5 h-1.5 w-16 overflow-hidden rounded-full border border-black/50 bg-black/60 sm:w-20">
                <div
                  className="h-full bg-red-600 transition-[width] duration-300"
                  style={{ width: `${Math.max(0, Math.min(100, (vida / membro.vidaMax) * 100))}%` }}
                />
              </div>
              <div className="h-1 w-16 overflow-hidden rounded-full border border-black/50 bg-black/60 sm:w-20">
                <div
                  className="h-full bg-blue-500 transition-[width] duration-300"
                  style={{ width: `${Math.max(0, Math.min(100, (mana / membro.manaMax) * 100))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {!resultadoBossGuilda && (
        <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-3 pb-3 pt-10 sm:px-6">
          {meuTurno ? (
            <CombatActionBar
              podeAgir={meuTurno}
              ocupado={false}
              manaAtual={manasAliados[meuId ?? -1] ?? meuMembro?.mana ?? 0}
              onAtaqueBasico={() => agirBossGuilda("attack")}
              poderes={(meuMembro?.poderes ?? []).map((p) => ({
                id: p.id,
                nome: p.nome,
                imagem_url: p.imagem_url,
                custo_mana: p.custo_mana,
                descricao: "",
              }))}
              onUsarPoder={(powerId) => agirBossGuilda("power", powerId)}
              consumiveis={[]}
              onUsarConsumivel={() => {}}
            />
          ) : (
            <p className="pb-4 text-center text-sm text-white/70">
              Aguardando o turno de{" "}
              {batalhaBossGuilda.membros.find((m) => String(m.id) === turnoAtualBossGuilda)?.nome ?? "..."}
            </p>
          )}
        </div>
      )}

      {resultadoBossGuilda && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-6 text-center text-white shadow-2xl">
            <p className="mb-2 font-imFeel text-3xl">
              {resultadoBossGuilda.vitoria ? "Boss derrotado!" : "O grupo caiu..."}
            </p>

            {resultadoBossGuilda.vitoria && minhaRecompensa && (
              <p className="mb-2">
                +{minhaRecompensa.xp} de experiência{" · +"}
                {minhaRecompensa.dinheiro} moedas
              </p>
            )}

            {resultadoBossGuilda.vitoria && (
              <p className="mb-2 text-sm text-white/70">
                +{resultadoBossGuilda.recompensas?.xpGuilda} XP de Guilda
              </p>
            )}

            {meuPremio && (
              <p className="mb-3 font-bold text-[#F3B43F]">
                🏆 Maior dano da luta: +{meuPremio.ouro} moedas de prêmio!
              </p>
            )}

            {!resultadoBossGuilda.vitoria && (
              <p className="mb-3 text-sm text-white/60">
                {resultadoBossGuilda.motivo === "abandono"
                  ? "Todo mundo se desconectou."
                  : resultadoBossGuilda.motivo === "tempo_esgotado"
                    ? "O tempo da luta acabou."
                    : "O grupo foi derrotado — o boss guarda o dano já causado pra próxima tentativa."}
              </p>
            )}

            <button
              onClick={limparBatalhaBossGuilda}
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
