import Image from "next/image";

interface PlayerSpriteProps {
  className?: string;
  stroke?: string;
  flip?: boolean;
}

// Sprite do Guerreiro — ilustração real (public/images/guerreiro-lutador.jpg)
// no lugar do placeholder em SVG. Ataque, dano, esquiva, vitória/derrota já
// chegam prontos via className (battle-sprite + anim-* de globals.css), este
// componente só cuida da arte. `flip` espelha o desenho pra quando o
// personagem fica do lado direito da tela (ex.: PvP), já que a ilustração
// foi desenhada de frente/virada pra direita.
export default function PlayerSprite({
  className = "",
  stroke = "#F3B43F",
  flip = false,
}: PlayerSpriteProps) {
  return (
    <div className={className}>
      <Image
        src="/images/guerreiro-lutador.jpg"
        alt="Guerreiro"
        width={220}
        height={220}
        className={`h-full w-full rounded-2xl border-2 object-cover shadow-[0_0_16px_rgba(243,180,63,0.5)] select-none pointer-events-none ${flip ? "scale-x-[-1]" : ""}`}
        style={{ borderColor: stroke }}
        priority
      />
    </div>
  );
}
