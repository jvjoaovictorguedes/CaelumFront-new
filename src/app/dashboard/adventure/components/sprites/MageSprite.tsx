import AnimatedSpriteSheet from "./AnimatedSpriteSheet";

import type { BattleSpriteProps } from "./spriteSheets";

export default function MageSprite({
  className = "",
  animState = "idle",
  flip = false,
  poseOverride,
  fireTint = false,
}: BattleSpriteProps) {
  return (
    <AnimatedSpriteSheet
      pasta="Mago Aventureiro"
      className={className}
      animState={animState}
      flip={flip}
      poseOverride={poseOverride}
      fireTint={fireTint}
    />
  );
}
