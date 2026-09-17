import AnimatedSpriteSheet from "./AnimatedSpriteSheet";

import type {
  BattleSpriteProps,
} from "./spriteSheets";

export default function PlayerSprite({
  className = "",
  animState = "idle",
  stroke = "#F3B43F",
  flip = false,
  poseOverride,
  fireTint = false,
}: BattleSpriteProps) {
  return (
    <AnimatedSpriteSheet
      pasta="Knight_1"
      className={className}
      animState={animState}
      stroke={stroke}
      flip={flip}
      poseOverride={poseOverride}
      fireTint={fireTint}
    />
  );
}