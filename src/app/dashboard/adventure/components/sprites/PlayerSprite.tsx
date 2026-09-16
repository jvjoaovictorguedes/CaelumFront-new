// Sprite genérico de Guerreiro. Placeholder simples de propósito —
// troque por uma ilustração de verdade quando tiver uma (mesma
// assinatura de props, só troque o conteúdo do <svg>).
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
      className={className}
      role="img"
      aria-label="Seu personagem"
    >
      <g fill="none" stroke={stroke} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
        {/* cabeça */}
        <circle cx="60" cy="28" r="18" />
        {/* corpo */}
        <path d="M60 46 L60 100" />
        <path d="M60 55 L30 75" />
        <path d="M60 55 L90 75" />
        {/* pernas */}
        <path d="M60 100 L40 150" />
        <path d="M60 100 L80 150" />
        {/* espada */}
        <path d="M90 75 L108 55" strokeWidth="5" />
        <path d="M100 62 L116 46" strokeWidth="5" />
      </g>
    </svg>
  );
}
