import AnimatedSpriteSheet from "./AnimatedSpriteSheet";
import type { EstadoSprite } from "./spriteSheets";

interface MinotauroSpriteProps {
  className?: string;
  animState?: string;
  stroke?: string;
  flip?: boolean;
  poseOverride?: EstadoSprite;
}
export default function MinotauroSprite({
  className = "",
  animState = "idle",
  stroke = "#F3B43F",
  flip = true,
  poseOverride,
}: MinotauroSpriteProps) {
  return (
    <AnimatedSpriteSheet
      pasta="Minotaur"
      className={className}
      animState={animState}
      stroke={stroke}
      flip={flip}
      poseOverride={poseOverride}
    />
  );
}