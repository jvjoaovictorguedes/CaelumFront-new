"use client";

import { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";

import "./BattleArena.css";

type Position = {
  x: number;
  y: number;
};

type BattleUnit = {
  id: string;
  character_id?: number;
  enemy_id?: number;

  type: "player" | "enemy";
  team: "allies" | "enemies";

  name: string;
  level: number;

  hp: number;
  maxHp: number;

  mana: number;
  maxMana: number;

  position: Position;

  alive: boolean;
};

type BattleState = {
  id: string;
  status: string;
  turn_number: number;
  participants: BattleUnit[];
};

type DamagePopup = {
  id: string;
  targetId: string;
  damage: number;
};

type Props = {
  battleId: string;
  socketUrl: string;
};

export default function BattleArena({ battleId, socketUrl }: Props) {
  const [battle, setBattle] = useState<BattleState | null>(null);

  const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);

  const socket = useMemo<Socket>(() => io(socketUrl), [socketUrl]);

  useEffect(() => {
    socket.emit("battle:join", {
      battleId,
    });

    socket.on("battle:state", (state: BattleState) => {
      setBattle(state);
    });

    socket.on("battle:unit-move", ({ attackerId, to }) => {
      setBattle((current) => {
        if (!current) return current;

        return {
          ...current,

          participants: current.participants.map((unit) =>
            unit.id === attackerId
              ? {
                  ...unit,
                  position: to,
                }
              : unit,
          ),
        };
      });
    });

    socket.on("battle:damage", ({ targetId, damage, hp }) => {
      setBattle((current) => {
        if (!current) return current;

        return {
          ...current,

          participants: current.participants.map((unit) =>
            unit.id === targetId
              ? {
                  ...unit,
                  hp,
                }
              : unit,
          ),
        };
      });

      const popup = {
        id: crypto.randomUUID(),

        targetId,
        damage,
      };

      setDamagePopups((current) => [...current, popup]);

      setTimeout(() => {
        setDamagePopups((current) =>
          current.filter((item) => item.id !== popup.id),
        );
      }, 900);
    });

    return () => {
      socket.emit("battle:leave", {
        battleId,
      });

      socket.disconnect();
    };
  }, [battleId, socket]);

  if (!battle) {
    return <div className="battle-loading">Carregando batalha...</div>;
  }

  const enemies = battle.participants.filter((unit) => unit.team === "enemies");

  const allies = battle.participants.filter((unit) => unit.team === "allies");

  function atacar(targetId: string) {
    const jogador = allies.find((unit) => unit.character_id);

    if (!jogador) return;

    socket.emit("battle:attack", {
      battleId,
      attackerId: jogador.id,
      targetId,
    });
  }

  return (
    <div className="battle-arena">
      <div className="battle-field">
        {enemies.map((enemy) => (
          <BattleUnit
            key={enemy.id}
            unit={enemy}
            damagePopups={damagePopups}
            onAttack={() => atacar(enemy.id)}
          />
        ))}

        {allies.map((ally) => (
          <BattleUnit key={ally.id} unit={ally} damagePopups={damagePopups} />
        ))}
      </div>

      <div className="battle-actions">
        <button onClick={() => enemies[0] && atacar(enemies[0].id)}>
          Ataque básico
        </button>
      </div>
    </div>
  );
}

function BattleUnit({
  unit,
  damagePopups,
  onAttack,
}: {
  unit: BattleUnit;
  damagePopups: DamagePopup[];
  onAttack?: () => void;
}) {
  const hpPercent = Math.max(0, Math.min(100, (unit.hp / unit.maxHp) * 100));

  const unitPopups = damagePopups.filter((popup) => popup.targetId === unit.id);

  return (
    <div
      className={`battle-unit ${unit.team}`}
      style={{
        left: unit.position.x,
        top: unit.position.y,
      }}
      onClick={onAttack}
    >
      <div className="unit-info">
        <div className="unit-name">{unit.name}</div>

        <div className="hp-bar">
          <div
            className="hp-fill"
            style={{
              width: `${hpPercent}%`,
            }}
          />
        </div>

        <div className="hp-text">
          {unit.hp} / {unit.maxHp}
        </div>
      </div>

      <div className="unit-sprite">
        {/* Aqui entra o sprite atual */}
        <img
          src={
            unit.type === "enemy" ? "/images/enemy.png" : "/images/player.png"
          }
          alt={unit.name}
        />
      </div>

      <div className="damage-container">
        {unitPopups.map((popup) => (
          <div key={popup.id} className="damage-popup">
            -{popup.damage}
          </div>
        ))}
      </div>
    </div>
  );
}
