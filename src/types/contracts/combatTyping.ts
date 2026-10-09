// Rebalanceamento de Powers §3/§30 — "nature" aqui é SEMPRE tipo_dano/
// damage_nature_override/basic_attack_nature (Fisico/Magico/Verdadeiro/
// Nenhum: define multiplicador de Classe e mitigação de Defesa) — NUNCA
// Natureza Mágica (Fogo/Água/Terra/Ar/Luz/Escuridão/Raio/Yin&Yang, a
// identidade/Evolution de personagem, que não aparece nesta API). Os
// dois nomes se parecem em português só por coincidência; nunca troque
// um pelo outro. Sem isso, cada tela mostrava o ENUM crú ("Fisico") —
// nunca "Físico" — pro jogador.
export const DAMAGE_NATURE_LABEL: Record<string, string> = {
  Fisico: "Físico",
  Magico: "Mágico",
  Verdadeiro: "Verdadeiro",
  Nenhum: "Nenhum",
};
export function damageNatureLabel(nature?: string | null): string | null {
  if (!nature) return null;
  return DAMAGE_NATURE_LABEL[nature] ?? nature;
}

export interface Affinity {
  id: number;
  key: string;
  nome: string;
  categoria: string;
  ativo?: boolean;
}
export interface DefensiveAffinity extends Affinity {
  multiplier: number;
  effectivenessLabel: string;
}
export interface DamageResolution {
  totalDamage: number;
  defenderFamily: { id: number; nome: string } | null;
  components: {
    nature: string;
    affinity: Affinity | null;
    affinityMultiplier: number;
    effectivenessLabel: string | null;
    familyBonusPct: number;
    finalDamage: number;
  }[];
}
export interface CatalogRow {
  id: number;
  key: string;
  nome: string;
  ativo: boolean;
  [key: string]: string | number | boolean | null;
}
export interface Catalogs {
  DamageAffinityType: CatalogRow[];
  WeaponType: CatalogRow[];
  MonsterFamily: CatalogRow[];
  CombatAffinityProfile: CatalogRow[];
  CombatAffinityProfileEntry: CatalogRow[];
  WeaponTypeFamilyBonus: CatalogRow[];
}
export interface TypingPreview {
  family?: { nome: string } | null;
  basicNature?: string;
  basicAffinityId?: number | null;
  inherited?: Record<string, number>;
  overrides?: Record<string, number>;
  multipliers?: Record<string, number>;
  nature?: string;
  affinityId?: number | null;
  type?: { nome: string } | null;
  nativeElementId?: number | null;
  elementalPct?: number;
}
