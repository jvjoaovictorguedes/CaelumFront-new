import AnimatedSpriteSheet from "./AnimatedSpriteSheet";

interface MageSpriteProps {
  className?: string;
  animState?: string;
  stroke?: string;
  flip?: boolean;
}

// Sprite do Mago — animação 2D de verdade (folha Wanderer Magican, ver
// spriteSheets.ts). Mesma lógica do PlayerSprite: `animState` escolhe o
// frame certo, o movimento (dash/hit/dodge) continua vindo de fora via
// className, `flip` espelha o desenho pro lado direito da tela (PvP).
export default function MageSprite({
  className = "",
  animState = "idle",
  stroke = "#F3B43F",
  flip = false,
}: MageSpriteProps) {
  return (
    <AnimatedSpriteSheet
      pasta="Wanderer Magican"
      className={className}
      animState={animState}
      stroke={stroke}
      flip={flip}
    />
  );
}
