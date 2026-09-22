// Tier de equipamento (1 = mais forte/topo, 5 = mais básico) — espelha
// src/config/equipmentTierConfig.js do backend (mesma convenção: banco/
// API usam número 1-5, frontend formata como algarismo romano — spec
// de Tier §42, "centralizar a função de exibição pra não duplicar
// lógica"). Badge própria, nunca reaproveitando só a cor de Raridade
// (§29: "Tier deve ser um badge textual próprio").
const TIER_ROMANO: Record<number, string> = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" };

export function formatarTier(tier?: number | null): string | null {
  if (tier == null) return null;
  const romano = TIER_ROMANO[tier];
  return romano ? `Tier ${romano}` : null;
}
