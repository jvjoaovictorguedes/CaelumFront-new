import type {
  ComponentType,
} from "react";

import EnemySprite from "./EnemySprite";
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
    nome.includes("lobo") ||
    nome.includes("wolf")
  ) {
    return "Black_Werewolf"
  } if (
    nome.includes("aranha") ||
    nome.includes("spider")
  ) {
    return "Spider_1";
  } if (
    nome.includes("bandido") ||
    nome.includes("bandit")
  ) {
    return "Bandit_1";
  } if (
    nome.includes("cultista") ||
    nome.includes("cultist")
  ) {
    return "Cultist_1";
  } if (
    nome.includes("golem")
  ) {
    return "Golem_1";
  } if (
    nome.includes("orc")
  ) {
    return "Orc_1";
  } if (
    nome.includes("espectro") ||
    nome.includes("wraith") ||
    nome.includes("sussurrante")
  ) {
    return "Wraith_1";
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
  if (pasta === "Spider_1") {
    return SpiderSprite;
  }
  if (pasta === "Bandit_1") {
    return BanditSprite;
  }
  if (pasta === "Cultist_1") {
    return CultistSprite;
  }
  if (pasta === "Golem_1") {
    return GolemSprite;
  }
  if (pasta === "Orc_1") {
    return OrcSprite;
  }
  if (pasta === "Wraith_1") {
    return WraithSprite;
  }
  return EnemySprite;
}