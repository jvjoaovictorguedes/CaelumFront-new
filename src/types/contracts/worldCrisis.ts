export interface CrisisSource {
  source_type: "ITEM" | "EXPEDITION_RESOURCE";
  source_id: number;
  progress_per_unit: number;
  ranking_points_per_unit: number;
  quality_weights: Record<string, number>;
}
export interface CrisisItem {
  id: number;
  nome: string;
  imagem_url?: string;
  qualidade?: string;
  progress_per_unit: number;
  ranking_points_per_unit: number;
  owned?: number;
}
export interface CrisisRequirement {
  key: string;
  nome: string;
  target_progress: number;
  mandatory: boolean;
  sources: CrisisSource[];
  resolved_items?: CrisisItem[];
  items?: CrisisItem[];
}
export interface CrisisStage {
  key: string;
  nome: string;
  completion_message?: string;
  requirements: CrisisRequirement[];
  effects: { effect_key: string; magnitude: number; contexts: string[] }[];
}
export interface CrisisStructure {
  key: string;
  nome: string;
  descricao?: string;
  start_message?: string;
  completion_message?: string;
  stages: CrisisStage[];
  restrictions: {
    target_type: string;
    target_id: number;
    nome?: string;
    unlock_after_stage_key: string;
  }[];
  guild_scoring_config: {
    minimum_contributors_for_bonus: number;
    tiers: { min_pct: number; multiplier: number }[];
  };
  rewards: {
    key: string;
    scope: string;
    min_points: number;
    rank_start?: number;
    rank_end?: number;
    payload: { type: string; quantity: number; item_id?: number; nome?: string }[];
  }[];
}
export interface CrisisStatus {
  id?: number;
  status: "NONE" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  nome?: string;
  descricao?: string;
  source_id?: number;
  source_name?: string | null;
  stage?: CrisisStage;
  current_stage_key?: string;
  stage_index?: number;
  stage_count?: number;
  effects?: { xp_pct: number; gold_pct: number };
  restrictions?: CrisisStructure["restrictions"];
  contributions_paused?: boolean;
  rewards_done?: boolean;
  progress?: {
    stage_key: string;
    stage_nome?: string;
    requirement_nome?: string;
    requirement_key: string;
    current_progress: string | number;
    target_progress: string | number;
  }[];
  pending_announcement?: {
    seq: number;
    title: string;
    message: string;
    catch_up: boolean;
  } | null;
  rewards?: CrisisStructure["rewards"];
}
export interface CrisisRankRow {
  rank: number;
  nome: string;
  character_id?: number;
  guild_id?: number;
  points?: number;
  ranking_guild_id?: number;
  score?: number;
  raw_points?: number;
  unique_contributors?: number;
  member_count_snapshot?: number;
  participation_pct?: number;
  mobilization_multiplier?: number;
}
export interface CrisisRanking {
  rows: CrisisRankRow[];
  me: CrisisRankRow | null;
  my_guild: CrisisRankRow | null;
  frozen?: boolean;
}
export interface CrisisCatalogs {
  items: { id: number; nome: string; tipo_item: string }[];
  resources: { id: number; nome: string }[];
  zones: { id: number; nome: string }[];
  configs: {
    id: number;
    nome: string;
    ativo: boolean;
    structure: CrisisStructure;
  }[];
  enabled: boolean;
}
