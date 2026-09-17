import type {
  ComponentType,
} from "react";

import EnemySprite from "./EnemySprite";
import MinotauroSprite from "./MinotauroSprite";

import type {
  BattleSpriteProps,
} from "./spriteSheets";

export type EnemySpriteComponent =
  ComponentType<BattleSpriteProps>;

export function spriteFolderForEnemy(
  nomeInimigo?: string,
): string | null {
  const nome =
    (
      nomeInimigo ??
      ""
    ).toLowerCase();

  if (
    nome.includes("minotauro") ||
    nome.includes("minotaur")
  ) {
    return "Minotaur_1";
  }

  return null;
}

export function spriteForEnemy(
  nomeInimigo?: string,
): EnemySpriteComponent {
  return spriteFolderForEnemy(
    nomeInimigo,
  ) === "Minotaur_1"
    ? MinotauroSprite
    : EnemySprite;
}