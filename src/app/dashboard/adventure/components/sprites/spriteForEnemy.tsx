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
  // Compara contra a PASTA resolvida por spriteFolderForEnemy (que já
  // sabe achar "lobo"/"wolf" dentro do nome do inimigo), não contra o
  // nome do inimigo em si — nenhum inimigo se chama literalmente
  // "Black_Werewolf" (ex.: "Lobo das Sombras"), então comparar
  // `nomeInimigo === "Black_Werewolf"` nunca era verdadeiro e o lobo
  // nunca aparecia, caindo sempre no EnemySprite genérico.
  const pasta = spriteFolderForEnemy(nomeInimigo);
  if (pasta === "Minotaur_1") {
    return MinotauroSprite;
  }
  if (pasta === "Black_Werewolf") {
    return WolfSprite;
  }
  return EnemySprite;
}