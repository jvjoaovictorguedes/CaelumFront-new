import Image from "next/image";

interface MageSpriteProps {
  className?: string;
  stroke?: string;
  flip?: boolean;
}

// Sprite do Mago — ilustração real (public/images/mago-lutador.jpg) no lugar
// do placeholder em SVG. Mesma lógica do PlayerSprite: animação vem de fora
// via className, `flip` espelha o desenho pro lado direito da tela (PvP).
export default function MageSprite({
  className = "",
  stroke = "#F3B43F",
  flip = false,
}: MageSpriteProps) {
  return (
    <div className={className}>
      <Image
        src="/images/mago-lutador.jpg"
        alt="Mago"
        width={220}
        height={220}
        className={`h-full w-full rounded-2xl border-2 object-cover shadow-[0_0_16px_rgba(243,180,63,0.5)] select-none pointer-events-none ${flip ? "scale-x-[-1]" : ""}`}
        style={{ borderColor: stroke }}
        priority
      />
    </div>
  );
}
