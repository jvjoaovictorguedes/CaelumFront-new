import { SPRITE_SETS, SPRITE_ORIGINS, estadoSpriteDe, spriteUrl } from "./spriteSheets";

interface AnimatedSpriteSheetProps {
  pasta: string;
  className?: string;
  animState?: string;
  stroke?: string;
  flip?: boolean;
}

// Toca a animação 2D de verdade (frame a frame) das folhas de sprite reais
// em public/<pasta>/*.png, usando o truque clássico de sprite sheet em CSS:
// background-size em % do tamanho do elemento (N frames = N*100% de
// largura) + background-position animado de 0% a 100% com steps(N), sem
// precisar saber o tamanho em pixels renderizado. Nada de canvas/JS por
// frame — é só CSS.
//
// Cada frame de 128x128 tem o personagem desenhado pequeno, encostado no
// canto inferior esquerdo (bastante espaço vazio em volta pra caber o
// alcance do ataque/queda). Sem correção ficava um bonequinho minúsculo
// perdido numa caixa vazia — por isso o zoom (`transform: scale`) com
// origem perto dos pés do personagem, que não mexe na matemática da
// animação de frame (isso é só background-position).
export default function AnimatedSpriteSheet({
  pasta,
  className = "",
  animState = "idle",
  stroke = "#F3B43F",
  flip = false,
}: AnimatedSpriteSheetProps) {
  const set = SPRITE_SETS[pasta] ?? SPRITE_SETS.Knight_1;
  const origem = SPRITE_ORIGINS[pasta] ?? SPRITE_ORIGINS.Knight_1;
  const estado = estadoSpriteDe(animState);
  const frame = set[estado];
  const src = spriteUrl(pasta, frame.file);
  const duracaoSegundos = frame.frames / (frame.fps ?? 8);
  const ZOOM = 1.6;

  return (
    <div className={className}>
      <div
        className="h-full w-full overflow-hidden rounded-2xl border-2 shadow-[0_0_16px_rgba(243,180,63,0.5)]"
        style={{ borderColor: stroke }}
      >
        <div
          // key força remontar ao trocar de estado, reiniciando a animação
          // no frame 0 em vez de continuar de onde a anterior parou.
          key={`${pasta}-${estado}-${flip}`}
          className="h-full w-full"
          style={{
            backgroundImage: `url(${src})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${frame.frames * 100}% 100%`,
            imageRendering: "pixelated",
            transform: `scale(${ZOOM})${flip ? " scaleX(-1)" : ""}`,
            transformOrigin: `${origem.x} ${origem.y}`,
            animationName: "sprite-steps",
            animationDuration: `${duracaoSegundos}s`,
            animationTimingFunction: `steps(${frame.frames})`,
            animationIterationCount: frame.loop === false ? 1 : "infinite",
            animationFillMode: frame.loop === false ? "forwards" : "none",
          }}
        />
      </div>
    </div>
  );
}
