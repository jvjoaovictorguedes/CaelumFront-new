// Sprite genérico do inimigo. Placeholder simples de propósito — troque
// por uma ilustração de verdade por tipo de monstro quando tiver uma
// (mesma assinatura de props, só troque o conteúdo do <svg>).
export default function EnemySprite({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 140 140"
      className={className}
      role="img"
      aria-label="Inimigo"
    >
      <g fill="none" stroke="#e05252" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
        {/* corpo */}
        <path d="M30 100 C20 70 30 40 70 40 C110 40 120 70 110 100 Z" />
        {/* olhos */}
        <circle cx="55" cy="65" r="5" fill="#e05252" stroke="none" />
        <circle cx="85" cy="65" r="5" fill="#e05252" stroke="none" />
        {/* chifres */}
        <path d="M45 42 L38 20" />
        <path d="M95 42 L102 20" />
        {/* pernas */}
        <path d="M45 100 L38 128" />
        <path d="M70 100 L70 130" />
        <path d="M95 100 L102 128" />
        {/* boca */}
        <path d="M55 82 Q70 92 85 82" />
      </g>
    </svg>
  );
}
