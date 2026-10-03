import type {
  ComponentType,
} from "react";

import EnemySprite from "./EnemySprite";

import type {
  BattleSpriteProps,
} from "./spriteSheets";

export type EnemySpriteComponent =
  ComponentType<BattleSpriteProps>;

// Pedido do jogador: nenhum monstro usa mais sprite animado fixo
// embutido aqui — os 9 que ainda tinham (Minotauro/Draconídeo/Lobo das
// Sombras/Aranha/Bandido/Cultista/Golem/Orc/Espectro, via
// COMPONENTE_POR_SPRITE_KEY) passam a usar imagem_url escolhida pelo
// Admin, igual aos outros 31 monstros do catálogo e igual a Guild
// Boss/World Boss (nenhum dos dois nunca teve sprite fixo). Sempre
// retorna "sem pasta" — CombatArena/PartyBattleArena já tratam esse
// caso caindo na foto estática (imagem_url) e, na falta dela, no
// boneco genérico (EnemySprite) abaixo.
export function spriteFolderForEnemy(
  _spriteKey?: string | null,
  _nomeInimigoFallback?: string | null,
): string | null {
  return null;
}

export function spriteForEnemy(
  _spriteKey?: string | null,
  _nomeInimigoFallback?: string | null,
): EnemySpriteComponent {
  return EnemySprite;
}
