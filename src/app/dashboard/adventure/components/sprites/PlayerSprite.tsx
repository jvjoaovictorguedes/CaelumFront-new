import AnimatedSpriteSheet from "./AnimatedSpriteSheet";

interface PlayerSpriteProps {
  className?: string;
  animState?: string;
  stroke?: string;
  flip?: boolean;
}

// Sprite do Guerreiro — animação 2D de verdade (folha Knight_1, ver
// spriteSheets.ts). `animState` decide qual frame mostrar (idle/ataque/
// dano/derrota/vitória); o dash/hit/dodge continuam vindo de fora via
// className (battle-sprite + anim-* de globals.css), aplicados no wrapper.
// `flip` espelha o desenho pra quando o personagem fica do lado direito da
// tela (ex.: PvP), já que a folha foi desenhada virada pra direita.
export default function PlayerSprite({
  className = "",
  animState = "idle",
  stroke = "#F3B43F",
  flip = false,
}: PlayerSpriteProps) {
  return (
    <AnimatedSpriteSheet
      pasta="Knight_1"
      className={className}
      animState={animState}
      stroke={stroke}
      flip={flip}
    />
  );
}
