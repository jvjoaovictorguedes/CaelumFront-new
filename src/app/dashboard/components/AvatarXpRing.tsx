"use client";

// Anel de progresso de XP em volta do avatar, com o nível em cima — visual
// de HUD de jogo moderno. Mesma convenção de "XP pro próximo nível" já
// usada no combate solo (CombatArena.tsx), já que o personagem não tem um
// campo próprio de xp_proximo_nivel vindo do backend (diferente de
// profissão, que tem).
export default function AvatarXpRing({
  nivel,
  experiencia,
}: {
  nivel: number;
  experiencia: number;
}) {
  const experienciaNivel = Math.max(100, nivel * 100);
  const percentual = Math.min(100, Math.max(0, (experiencia / experienciaNivel) * 100));

  const size = 176;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentual / 100) * circumference;

  return (
    <>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="pointer-events-none absolute -inset-2"
        role="img"
        aria-label={`Progresso de experiência: ${Math.round(percentual)}%`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.45)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F3B43F"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div
        className="absolute -top-3 left-1/2 z-10 flex h-9 min-w-9 -translate-x-1/2 items-center justify-center rounded-full border-2 border-[#F3B43F] bg-[#292018] px-2 font-imFeel text-base font-bold leading-none text-[#F3B43F] shadow-lg"
        title={`Nível ${nivel} — ${experiencia}/${experienciaNivel} XP`}
      >
        {nivel}
      </div>
    </>
  );
}
