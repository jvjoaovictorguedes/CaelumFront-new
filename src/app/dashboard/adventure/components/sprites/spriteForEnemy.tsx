import type {
  ComponentType,
} from "react";

import EnemySprite from "./EnemySprite";
import MinotauroSprite from "./MinotauroSprite";
import WolfSprite from "./WolfSprite";

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
  } if (
    nome.includes("Lobo das Sombra")
  ) {
    return "Black_Werewolf"
  }

  return null;
}

export function spriteForEnemy(
  nomeInimigo?: string,
): EnemySpriteComponent {
  if (spriteFolderForEnemy(nomeInimigo) === "Minotaur_1") {
    return MinotauroSprite;
  }
  if (nomeInimigo === "Black_Werewolf") {
    return WolfSprite;
  }
  return EnemySprite;
}