import type {
  BattleSpriteProps,
} from "./spriteSheets";
export default function EnemySprite({
  className = "",
  stroke = "#e05252",
  flip = false,
}: BattleSpriteProps) {
  return (
    <svg
      viewBox="0 0 140 140"
      className={className}
      role="img"
      aria-label="Inimigo"
      style={{
        transform:
          flip
            ? "scaleX(-1)"
            : undefined,

        transformOrigin:
          "center",
      }}
    >
      <g
        fill="none"
        stroke={stroke}
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path
          d="
            M30 100
            C20 70 30 40 70 40
            C110 40 120 70 110 100
            Z
          "
        />

        <circle
          cx="55"
          cy="65"
          r="5"
          fill={stroke}
          stroke="none"
        />

        <circle
          cx="85"
          cy="65"
          r="5"
          fill={stroke}
          stroke="none"
        />

        <path d="M45 42 L38 20" />

        <path d="M95 42 L102 20" />

        <path d="M45 100 L38 128" />

        <path d="M70 100 L70 130" />

        <path d="M95 100 L102 128" />

        <path d="M55 82 Q70 92 85 82" />
      </g>
    </svg>
  );
}