import AnimatedSpriteSheet from "./AnimatedSpriteSheet";
import type { EstadoSprite } from "./spriteSheets";

interface MageSpriteProps {
  className?: string;
  animState?: string;
  stroke?: string;
  flip?: boolean;
  poseOverride?: EstadoSprite;
  fireTint?: boolean;
}
export default function MageSprite({
  className = "",
  animState = "idle",
  stroke = "#F3B43F",
  flip = false,
  poseOverride,
  fireTint = false,
}: MageSpriteProps) {
  return (
    <AnimatedSpriteSheet
      pasta="Wanderer Magican"
      className={className}
      animState={animState}
      stroke={stroke}
      flip={flip}
      poseOverride={poseOverride}
      fireTint={fireTint}
    />
  );
}
