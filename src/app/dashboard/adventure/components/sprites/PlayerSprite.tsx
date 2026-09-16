import Image from "next/image";

interface PlayerSpriteProps {
  className?: string;
  animState?: string; // "idle", "anim-atacando-direita", "anim-atingido", etc.
}
export default function PlayerSprite({
  className = "",
  animState = "idle",
}: PlayerSpriteProps) {
  let imagemSrc = "/public/image/guerreiro-lutador.jpg"; // Padrão parado

  if (animState.includes("atacando")) {
    imagemSrc = "/public/image/guerreiro-lutador-atacando.jpg";
  } else if (animState.includes("atingido")) {
    imagemSrc = "/public/image/guerreiro-lutador-atingido.jpg";
  } else if (animState.includes("esquivando")) {
    imagemSrc = "/public/image/guerreiro-lutador-esquivando.jpg";
  } else if (animState.includes("vitoria")) {
    imagemSrc = "/public/image/guerreiro-lutador-vitoria.jpg";
  }

  return (
    <div className={`relative transition-transform duration-300 ${className}`}>
      <style>{`
        /* Efeito de movimento (Dash) para a frente ao atacar */
        .battle-sprite.anim-atacando-direita {
          transform: translateX(35px) scale(1.05);
        }
        /* Efeito de recuo ao tomar dano */
        .battle-sprite.anim-atingido {
          filter: drop-shadow(0 0 10px rgba(255, 0, 0, 0.9));
          transform: translateX(-15px);
        }
      `}</style>

      {/* Usamos a tag Image do Next.js para alta performance */}
      <Image
        src={imagemSrc}
        alt="Personagem Jogador"
        width={140}
        height={140}
        className="object-contain drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] select-none pointer-events-none"
        priority
      />
    </div>
  );
}