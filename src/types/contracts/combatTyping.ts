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
