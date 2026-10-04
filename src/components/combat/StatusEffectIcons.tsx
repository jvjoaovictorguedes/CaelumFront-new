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

// Habilidades V2.0 (item 10) — buffs/debuffs TEMPORÁRIOS de combate
// (ConsumableEffect APPLY_COMBAT_BUFF — spec Caldeirão §13,
// combatBuffService.js no backend). Mesmas chaves de
// combatBuffService.ATRIBUTOS_BUFAVEIS; `valor` negativo é um DEBUFF
// (mesmo campo, "regra de ouro" do backend — nunca um catálogo
// separado), mostrado em vermelho em vez de verde.
export type AtributoBufavel =
  | "DANO_SAIDA_PCT"
  | "DEFESA_FLAT"
  | "REGEN_HP_FLAT"
  | "REGEN_HP_PERCENT"
  | "REGEN_MANA_FLAT"
  | "REGEN_MANA_PERCENT"
  | "STATUS_RESISTANCE_PCT";

export interface CombatBuffMinimo {
  atributo: AtributoBufavel;
  valor: number;
  remainingTurns: number;
}

const ICONE_POR_ATRIBUTO: Record<AtributoBufavel, string> = {
  DANO_SAIDA_PCT: "⚔️",
  DEFESA_FLAT: "🛡️",
  REGEN_HP_FLAT: "❤️",
  REGEN_HP_PERCENT: "❤️",
  REGEN_MANA_FLAT: "🔷",
  REGEN_MANA_PERCENT: "🔷",
  STATUS_RESISTANCE_PCT: "✨",
};

const LABEL_POR_ATRIBUTO: Record<AtributoBufavel, string> = {
  DANO_SAIDA_PCT: "Dano causado",
  DEFESA_FLAT: "Defesa",
  REGEN_HP_FLAT: "Regen. de Vida",
  REGEN_HP_PERCENT: "Regen. de Vida",
  REGEN_MANA_FLAT: "Regen. de Mana",
  REGEN_MANA_PERCENT: "Regen. de Mana",
  STATUS_RESISTANCE_PCT: "Resistência a Status",
};

function sufixoDoAtributo(atributo: AtributoBufavel) {
  return atributo.endsWith("_PCT") || atributo.endsWith("_PERCENT") ? "%" : "";
}

function tituloDoBuff(buff: CombatBuffMinimo) {
  const sinal = buff.valor > 0 ? "+" : "";
  return `${LABEL_POR_ATRIBUTO[buff.atributo]}: ${sinal}${buff.valor}${sufixoDoAtributo(buff.atributo)} — ${buff.remainingTurns} turno(s) restante(s)`;
}

// Linha de ícones de buff/debuff — mesmo visual de StatusIconsRow, mas
// cor verde (buff) ou vermelha (debuff) conforme o SINAL de `valor`
// (nunca um catálogo separado de debuffs, mesma "regra de ouro" do
// backend).
export function BuffIconsRow({ buffs }: { buffs: CombatBuffMinimo[] }) {
  if (buffs.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {buffs.map((buff) => (
        <span
          key={buff.atributo}
          title={tituloDoBuff(buff)}
          className={`pointer-events-auto flex cursor-help items-center gap-0.5 rounded-full px-1 py-0.5 text-[9px] font-bold text-white shadow ${
            buff.valor >= 0 ? "bg-emerald-900/80" : "bg-red-900/80"
          }`}
        >
          <span>{ICONE_POR_ATRIBUTO[buff.atributo] ?? "•"}</span>
          <span className="text-[#F3B43F]">{buff.remainingTurns}T</span>
        </span>
      ))}
    </div>
  );
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
