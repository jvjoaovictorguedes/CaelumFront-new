import AnimatedSpriteSheet from "./AnimatedSpriteSheet";

import type {
  BattleSpriteProps,
} from "./spriteSheets";

export default function GolemSprite({
  className = "",
  animState = "idle",
  stroke = "#8b0000",
  flip = true,
  poseOverride,
  fireTint = false,
}: BattleSpriteProps) {
  return (
    <AnimatedSpriteSheet
      pasta="Golem_1"
      className={className}
      animState={animState}
      stroke={stroke}
      flip={flip}
      poseOverride={poseOverride}
      fireTint={fireTint}
    />
  );
}
