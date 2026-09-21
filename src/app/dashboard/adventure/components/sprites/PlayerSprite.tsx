import AnimatedSpriteSheet from "./AnimatedSpriteSheet";

import type { BattleSpriteProps } from "./spriteSheets";

export default function PlayerSprite({
  className = "",
  animState = "idle",
  flip = false,
  poseOverride,
  fireTint = false,
}: BattleSpriteProps) {
  return (
    <AnimatedSpriteSheet
      pasta="Knight_1"
      className={className}
      animState={animState}
      flip={flip}
      poseOverride={poseOverride}
      fireTint={fireTint}
    />
  );
}
