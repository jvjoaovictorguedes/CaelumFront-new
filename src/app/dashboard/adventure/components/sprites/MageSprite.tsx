// Sprite genérico de Mago. Placeholder simples de propósito — troque
// por uma ilustração de verdade quando tiver uma (mesma assinatura de
// props, só troque o conteúdo do <svg>).
export default function MageSprite({
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
      aria-label="Personagem Mago"
    >
      <g fill="none" stroke={stroke} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
        {/* chapéu de mago */}
        <path d="M60 10 L78 40 L42 40 Z" />
        <ellipse cx="60" cy="40" rx="22" ry="6" />
        {/* cabeça */}
        <circle cx="60" cy="55" r="14" />
        {/* manto */}
        <path d="M60 69 L35 150 L85 150 Z" />
        {/* braço com cajado */}
        <path d="M60 85 L95 70" />
        <line x1="95" y1="45" x2="95" y2="90" strokeWidth="4" />
        <circle cx="95" cy="42" r="6" />
        {/* outro braço */}
        <path d="M60 85 L30 100" />
      </g>
    </svg>
  );
}
