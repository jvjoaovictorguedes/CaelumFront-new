import type { CSSProperties } from "react";

import {
  estadoSpriteDe,
  getSpriteConfig,
  getSpriteFrame,
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
  const config =
    getSpriteConfig(pasta);

  const estado =
    poseOverride ??
    estadoSpriteDe(animState);

  const frame =
    getSpriteFrame(
      pasta,
      estado,
    );

  const fps = Math.max(
    1,
    frame.fps ?? 8,
  );

  const frames = Math.max(
    1,
    frame.frames,
  );

  const duracaoSegundos =
    frames / fps;

  const scale =
    frame.scale ??
    config.scale ??
    1;

  const originX =
    frame.originX ??
    config.originX ??
    "50%";

  const originY =
    frame.originY ??
    config.originY ??
    "50%";

  const offsetX =
    frame.offsetX ??
    config.offsetX ??
    0;

  const offsetY =
    frame.offsetY ??
    config.offsetY ??
    0;

  const loop =
    frame.loop !== false;
  const spriteEndPercent =
    frames <= 1
      ? 0
      : loop
        ? (
            frames /
            (frames - 1)
          ) * 100
        : 100;

  const animationSteps =
    loop
      ? frames
      : Math.max(
          1,
          frames - 1,
        );

  const src =
    spriteUrl(
      pasta,
      frame.file,
    );

  const transformParts = [
    `translate(${offsetX}px, ${offsetY}px)`,
    `scale(${scale})`,
    flip
      ? "scaleX(-1)"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <div
        className="
          relative
          h-full
          w-full
          overflow-visible
          rounded-2xl
          border-2
          shadow-[0_0_16px_rgba(243,180,63,0.5)]
        "
        style={{
          borderColor: stroke,
        }}
      >
        <div
          key={`${pasta}-${estado}-${flip}-${frame.file}`}
          className="
            absolute
            inset-0
            h-full
            w-full
          "
          style={
            {
              backgroundImage:
                `url(${src})`,

              backgroundRepeat:
                "no-repeat",

              backgroundSize:
                `${frames * 100}% 100%`,

              backgroundPosition:
                "0% 0%",

              imageRendering:
                "pixelated",

              transform:
                transformParts,

              transformOrigin:
                `${originX} ${originY}`,

              willChange:
                "background-position, transform",

              filter:
                fireTint
                  ? "sepia(1) saturate(6) hue-rotate(-15deg) brightness(1.1)"
                  : undefined,

              animationName:
                frames > 1
                  ? "sprite-steps"
                  : undefined,

              animationDuration:
                frames > 1
                  ? `${duracaoSegundos}s`
                  : undefined,

              animationTimingFunction:
                frames > 1
                  ? `steps(${animationSteps}, end)`
                  : undefined,

              animationIterationCount:
                loop
                  ? "infinite"
                  : 1,

              animationFillMode:
                loop
                  ? "none"
                  : "forwards",

              ["--sprite-end" as string]:
                `${spriteEndPercent}%`,
            } as CSSProperties
          }
        />
      </div>
    </div>
  );
}