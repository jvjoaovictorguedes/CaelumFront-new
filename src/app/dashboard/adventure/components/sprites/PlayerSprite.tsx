export default function PlayerSprite({
  className = "",
  stroke = "#F3B43F",
}: {
  className?: string;
  stroke?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 160"
      className={`${className} transition-transform duration-300`}
      role="img"
      aria-label="Seu personagem"
    >
      <style>{`
        .battle-sprite.anim-atacando-direita {
          transform: translateX(35px) scale(1.05);
        }
        .battle-sprite.anim-atacando-direita .sword-arm {
          transform: rotate(45deg);
          transform-origin: 75px 75px;
        }
        .battle-sprite.anim-atingido {
          filter: drop-shadow(0 0 8px rgba(255, 0, 0, 0.8));
          transform: translateX(-10px) skewX(-10deg);
        }
        .battle-sprite.anim-esquivando-direita {
          transform: translateX(-20px);
        }
        .battle-sprite.anim-vitoria {
          transform: translateY(-10px);
        }
        .sword-arm {
          transition: transform 0.2s ease-in-out;
        }
      `}</style>

      <g fill="none" stroke={stroke} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
        <path d="M45 65 L75 65 L70 105 L50 105 Z" fill="#2a2018" strokeWidth="3" />
        <circle cx="60" cy="28" r="16" fill="#2a2018" />
        <path d="M50 25 L70 25" strokeWidth="2" stroke="#ff4444" /> {/* Detalhe do capacete */}
        <path d="M55 105 L45 145" />
        <path d="M65 105 L75 145" />
        <path d="M45 70 L25 90" strokeWidth="4" />
        <circle cx="22" cy="95" r="8" fill="#1f1813" />
        <g className="sword-arm">
          <path d="M75 70 L95 75" strokeWidth="4" />
          <path d="M95 75 L115 50" strokeWidth="6" stroke="#ffffff" />
          <path d="M90 80 L100 70" strokeWidth="3" />
        </g>
      </g>
    </svg>
  );
}