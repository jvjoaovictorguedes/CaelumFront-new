import type {
  ComponentType,
} from "react";

import MageSprite from "./MageSprite";
import PlayerSprite from "./PlayerSprite";

import type {
  BattleSpriteProps,
} from "./spriteSheets";

export type BattleSpriteComponent =
  ComponentType<BattleSpriteProps>;

export function spriteFolderForClass(
  nomeClasse?: string,
): string {
  const nome =
    (
      nomeClasse ??
      ""
    ).toLowerCase();

  if (
    nome.includes("mago") ||
    nome.includes("mage")
  ) {
    return "Wanderer Magican";
  }

  return "Knight_1";
}

export function spriteForClass(
  nomeClasse?: string,
): BattleSpriteComponent {
  return spriteFolderForClass(
    nomeClasse,
  ) === "Wanderer Magican"
    ? MageSprite
    : PlayerSprite;
}