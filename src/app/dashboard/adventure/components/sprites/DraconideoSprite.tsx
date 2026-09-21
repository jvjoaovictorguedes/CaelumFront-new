import AnimatedSpriteSheet from "./AnimatedSpriteSheet";

import type {
  BattleSpriteProps,
} from "./spriteSheets";

export default function DraconideoSprite({
  className = "",
  animState = "idle",
  stroke = "#2f6f8f",
  flip = true,
  poseOverride,
  fireTint = false,
}: BattleSpriteProps) {
  return (
    <AnimatedSpriteSheet
      pasta="Draconideo_1"
      className={className}
      animState={animState}
      stroke={stroke}
      flip={flip}
      poseOverride={poseOverride}
      fireTint={fireTint}
    />
  );
}
