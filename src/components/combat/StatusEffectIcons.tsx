// Metadados de exibição do Motor de Status (mesmas chaves de
// src/config/statusEffectConfig.js no backend) — nome, ícone e uma
// descrição curta do que o efeito FAZ de verdade, não só o nome. Usado
// tanto na Aventura (CombatArena.tsx) quanto no Duelo ao vivo
// (LiveDuelArena.tsx), pra nunca divergir entre os dois.
export type StatusKey =
  | "BURN"
  | "BLEED"
  | "POISON"
  | "SILENCE"
  | "WEAKEN"
  | "FREEZE"
  | "STUN"
  | "PARALYZE"
  | "BLIND";

export interface StatusInstanceMinima {
  key: StatusKey;
  remainingTurns: number;
  stacks?: number;
}

export const ICONE_POR_STATUS: Record<StatusKey, string> = {
  BURN: "🔥",
  BLEED: "🩸",
  POISON: "☠️",
  SILENCE: "🔇",
  WEAKEN: "🔻",
  FREEZE: "🧊",
  STUN: "💫",
  PARALYZE: "⚡",
  BLIND: "🌫️",
};

export const NOME_POR_STATUS: Record<StatusKey, string> = {
  BURN: "Queimadura",
  BLEED: "Sangramento",
  POISON: "Veneno",
  SILENCE: "Silêncio",
  WEAKEN: "Enfraquecimento",
  FREEZE: "Congelamento",
  STUN: "Atordoamento",
  PARALYZE: "Paralisia",
  BLIND: "Cegueira",
};

// O que cada status FAZ, em uma frase — mostrado no tooltip do ícone.
export const DESCRICAO_POR_STATUS: Record<StatusKey, string> = {
  BURN: "Causa dano de fogo no início de cada turno. Reaplicar renova a duração e fica com a maior potência.",
  BLEED: "Causa dano físico no início de cada turno. Empilha (até 3x) — cada stack aumenta o dano.",
  POISON: "Causa dano no início de cada turno. Empilha (até 5x) — cada stack aumenta o dano.",
  SILENCE: "Impede o uso de habilidades. Ataque básico e itens continuam liberados.",
  WEAKEN: "Reduz o dano causado pelo afetado enquanto durar.",
  FREEZE: "Impede qualquer ação. Quebra imediatamente ao receber dano direto (não de DoT).",
  STUN: "Impede qualquer ação. Só termina quando a duração acabar — dano recebido não quebra.",
  PARALYZE: "Chance de perder a ação a cada turno, enquanto durar.",
  BLIND: "Aumenta bastante a chance de errar ataques enquanto durar.",
};

function tituloDoStatus(instancia: StatusInstanceMinima) {
  const partes = [NOME_POR_STATUS[instancia.key]];
  if ((instancia.stacks ?? 1) > 1) partes.push(`×${instancia.stacks}`);
  partes.push(`— ${instancia.remainingTurns} turno(s) restante(s)`);
  return `${partes.join(" ")}\n${DESCRICAO_POR_STATUS[instancia.key]}`;
}

// Linha de ícones de status — pequenos, com stacks e turnos restantes;
// tooltip (hover) explica o efeito de verdade. `pointer-events-auto` em
// cada badge é necessário porque o card que a envolve costuma ficar
// `pointer-events-none` (não atrapalhar cliques na arena por trás).
export function StatusIconsRow({ instancias }: { instancias: StatusInstanceMinima[] }) {
  if (instancias.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {instancias.map((instancia) => (
        <span
          key={instancia.key}
          title={tituloDoStatus(instancia)}
          className="pointer-events-auto flex cursor-help items-center gap-0.5 rounded-full bg-black/70 px-1 py-0.5 text-[9px] font-bold text-white shadow"
        >
          <span>{ICONE_POR_STATUS[instancia.key] ?? "•"}</span>
          {(instancia.stacks ?? 1) > 1 && <span>×{instancia.stacks}</span>}
          <span className="text-[#F3B43F]">{instancia.remainingTurns}T</span>
        </span>
      ))}
    </div>
  );
}
