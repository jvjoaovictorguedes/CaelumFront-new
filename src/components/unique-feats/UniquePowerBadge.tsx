// Sistema de Proezas Únicas §9 — selo "Legado Único" pra marcar, em
// qualquer listagem de Poderes do próprio jogador, aquele que veio de
// uma Proeza Única (acquisition_scope === "UNIQUE_FEAT" no Power).
//
// AINDA NÃO LIGADO a uma tela real: hoje `GET /characters/:id/powers`
// (AbilitiesPanel.tsx) só lista Poderes de ClassAbilities/RaceAbilities
// e nem devolve `acquisition_scope` — um Poder de Legado é concedido só
// via CharacterAbilities (uniqueFeatService.js) e por isso não aparece
// nessa listagem nenhuma hoje. Ligar isto de verdade precisa de mudança
// no backend (fora do escopo desta Fase 5 frontend); ver relatório.
export default function UniquePowerBadge({ isLegado }: { isLegado?: boolean }) {
  if (!isLegado) return null;

  return (
    <span
      title="Legado Único — concedido por uma Proeza Única, exclusivo de um único aventureiro"
      className="inline-flex items-center gap-1 rounded-full border border-purple-400/70 bg-purple-950/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-200"
    >
      ✦ Legado Único
    </span>
  );
}
