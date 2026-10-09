// Templo do Véu Celestial — classes Tailwind compartilhadas entre as
// abas do editor admin, mesmo padrão de world-boss/components/styles.ts
// (mantém cada aba pequena e sem repetir a mesma string em todo arquivo).
export const INPUT = "rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm text-white";
export const INPUT_XS = "rounded border border-white/20 bg-black/30 px-1.5 py-1 text-xs text-white";
export const LABEL = "flex flex-col gap-1 text-xs text-white/70";
export const LABEL_XS = "flex flex-col gap-1 text-[10px] text-white/70";
export const CARD = "rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-5";
export const BTN = "rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50";
export const BTN_GHOST = "rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10 disabled:opacity-50";
export const BTN_DANGER = "rounded-lg border border-red-400/60 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/10 disabled:opacity-50";
export const SUBTAB_BTN = (ativo: boolean) =>
  `rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
    ativo ? "bg-[#F3B43F] text-black" : "border border-white/15 text-white/60 hover:bg-white/10"
  }`;
