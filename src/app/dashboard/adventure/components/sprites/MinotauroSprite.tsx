import AnimatedSpriteSheet from "./AnimatedSpriteSheet";

import type {
  BattleSpriteProps,
} from "./spriteSheets";

export default function MinotauroSprite({
  className = "",
  animState = "idle",
  flip = true,
  poseOverride,
  fireTint = false,
}: BattleSpriteProps) {
  return (
    <AnimatedSpriteSheet
      pasta="Minotaur_1"
      className={className}
      animState={animState}
      flip={flip}
      poseOverride={poseOverride}
      fireTint={fireTint}
    />
  );
}