import AnimatedSpriteSheet from "./AnimatedSpriteSheet";
import type { EstadoSprite } from "./spriteSheets";

interface PlayerSpriteProps {
  className?: string;
  animState?: string;
  stroke?: string;
  flip?: boolean;
  poseOverride?: EstadoSprite;
  fireTint?: boolean;
}
export default function PlayerSprite({
  className = "",
  animState = "idle",
  stroke = "#F3B43F",
  flip = false,
  poseOverride,
  fireTint = false,
}: PlayerSpriteProps) {
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
