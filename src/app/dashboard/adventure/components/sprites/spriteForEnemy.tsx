import type {
  ComponentType,
} from "react";

import EnemySprite from "./EnemySprite";
import DraconideoSprite from "./DraconideoSprite";
import MinotauroSprite from "./MinotauroSprite";
import WolfSprite from "./WolfSprite";
import SpiderSprite from "./SpiderSprite";
import BanditSprite from "./BanditSprite";
import CultistSprite from "./CultistSprite";
import GolemSprite from "./GolemSprite";
import OrcSprite from "./OrcSprite";
import WraithSprite from "./WraithSprite";

import type {
  BattleSpriteProps,
} from "./spriteSheets";

export type EnemySpriteComponent =
  ComponentType<BattleSpriteProps>;

// Expansão Aventura Beta §29: "Não adicionar novos if (nome.includes(...))
// pra cada criatura" — sprite_key (vindo do backend, AdventureMonster)
// é a ÚNICA fonte de verdade a partir de agora. sprite_key nulo ou
// desconhecido cai no EnemySprite genérico (§48 — fallback obrigatório,
// o Beta não pode depender de toda arte estar pronta). O fallback por
// NOME abaixo existe só pra não quebrar combates já em andamento no
// exato momento do deploy (encontro antigo, sem sprite_key salvo) —
// nunca ganha entradas novas pra monstro nenhum da expansão.
const COMPONENTE_POR_SPRITE_KEY: Record<string, EnemySpriteComponent> = {
  Minotaur_1: MinotauroSprite,
  Draconideo_1: DraconideoSprite,
  Black_Werewolf: WolfSprite,
  Spider_1: SpiderSprite,
  Bandit_1: BanditSprite,
  Cultist_1: CultistSprite,
  Golem_1: GolemSprite,
  Orc_1: OrcSprite,
  Wraith_1: WraithSprite,
};

function spriteFolderPorNomeLegado(
  nomeInimigo?: string,
): string | null {
  const nome =
    (
      nomeInimigo ??
      ""
    ).toLowerCase();

  if (nome.includes("minotauro") || nome.includes("minotaur")) return "Minotaur_1";
  if (nome.includes("dracon") || nome.includes("dragon")) return "Draconideo_1";
  if (nome.includes("lobo") || nome.includes("wolf")) return "Black_Werewolf";
  if (nome.includes("aranha") || nome.includes("spider")) return "Spider_1";
  if (nome.includes("bandido") || nome.includes("bandit")) return "Bandit_1";
  if (nome.includes("cultista") || nome.includes("cultist")) return "Cultist_1";
  if (nome.includes("golem")) return "Golem_1";
  if (nome.includes("orc")) return "Orc_1";
  if (nome.includes("espectro") || nome.includes("wraith") || nome.includes("sussurrante")) return "Wraith_1";

  return null;
}

// `spriteKey` é o campo novo (AdventureMonster.sprite_key, vindo do
// encontro/inimigo da API) — tem prioridade sobre `nomeInimigoFallback`,
// que só é usado quando spriteKey vier null/undefined (encontro antigo).
export function spriteFolderForEnemy(
  spriteKey?: string | null,
  nomeInimigoFallback?: string | null,
): string | null {
  if (spriteKey && COMPONENTE_POR_SPRITE_KEY[spriteKey]) return spriteKey;
  if (spriteKey) return null; // chave desconhecida — nunca adivinha por nome.
  return spriteFolderPorNomeLegado(nomeInimigoFallback ?? undefined);
}

export function spriteForEnemy(
  spriteKey?: string | null,
  nomeInimigoFallback?: string | null,
): EnemySpriteComponent {
  const pasta = spriteFolderForEnemy(spriteKey, nomeInimigoFallback);
  if (!pasta) return EnemySprite;
  return COMPONENTE_POR_SPRITE_KEY[pasta] ?? EnemySprite;
}
