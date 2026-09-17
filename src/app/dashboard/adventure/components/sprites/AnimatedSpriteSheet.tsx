import type { CSSProperties } from "react";
import {
  SPRITE_SETS,
  SPRITE_ORIGINS,
  estadoSpriteDe,
  spriteUrl,
  type EstadoSprite,
} from "./spriteSheets";

interface AnimatedSpriteSheetProps {
  pasta: string;
  className?: string;
  animState?: string;
  stroke?: string;
  flip?: boolean;
  poseOverride?: EstadoSprite;
  fireTint?: boolean;
}

export default function AnimatedSpriteSheet({
  pasta,
  className = "",
  animState = "idle",
  stroke = "#F3B43F",
  flip = false,
  poseOverride,
  fireTint = false,
}: AnimatedSpriteSheetProps) {
  const set = SPRITE_SETS[pasta] ?? SPRITE_SETS.Knight_1;
  
  // Pega a origem e permite propriedades customizadas opcionais (zoom e altura do background)
  const origem = (SPRITE_ORIGINS[pasta] ?? SPRITE_ORIGINS.Knight_1) as {
    x: string;
    y: string;
    zoom?: number;
    bgHeight?: string;
  };

  const estado = poseOverride ?? estadoSpriteDe(animState);
  const frame = set[estado] ?? set.idle;
  const src = spriteUrl(pasta, frame.file);
  const duracaoSegundos = frame.frames / (frame.fps ?? 8);

  // Usa o zoom e a altura personalizada do sprite se existirem, senão usa o padrão
  const ZOOM = origem.zoom ?? 1.6;
  const bgHeight = origem.bgHeight ?? "100%";

  const spriteEndPercent =
    frame.frames > 1 ? (frame.frames / (frame.frames - 1)) * 100 : 0;

  return (
    <div className={className}>
      <div
        className="h-full w-full overflow-hidden rounded-2xl border-2 shadow-[0_0_16px_rgba(139,0,0,0.5)]"
        style={{ borderColor: stroke }}
      >
        <div
          key={`${pasta}-${estado}-${flip}`}
          className="h-full w-full"
          style={{
            backgroundImage: `url(${src})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${frame.frames * 100}% ${bgHeight}`,
            imageRendering: "pixelated",
            transform: `scale(${ZOOM})${flip ? " scaleX(-1)" : ""}`,
            transformOrigin: `${origem.x} ${origem.y}`,
            filter: fireTint
              ? "sepia(1) saturate(6) hue-rotate(-15deg) brightness(1.1)"
              : undefined,
            animationName: "sprite-steps",
            animationDuration: `${duracaoSegundos}s`,
            animationTimingFunction: `steps(${frame.frames})`,
            animationIterationCount: frame.loop === false ? 1 : "infinite",
            animationFillMode: frame.loop === false ? "forwards" : "none",
            ["--sprite-end" as string]: `${spriteEndPercent}%`,
          } as CSSProperties}
        />
      </div>
    </div>
  );
}