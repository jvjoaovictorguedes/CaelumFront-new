import AnimatedSpriteSheet from "./AnimatedSpriteSheet";

import type {
  BattleSpriteProps,
} from "./spriteSheets";

export default function WolfSprite({
  className = "",
  animState = "idle",
  flip = true,
  poseOverride,
  fireTint = false,
}: BattleSpriteProps) {
  return (
    <AnimatedSpriteSheet
      pasta="Black_Werewolf"
      className={className}
      animState={animState}
      flip={flip}
      poseOverride={poseOverride}
      fireTint={fireTint}
    />
  );
}