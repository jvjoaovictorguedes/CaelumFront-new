export type EstadoSprite =
  | "idle"
  | "attack"
  | "poder"
  | "hurt"
  | "dead"
  | "victory";

export interface SpriteVisualConfig {
  scale?: number;
  originX?: string;
  originY?: string;
  offsetX?: number;
  offsetY?: number;
}

export interface SpriteFrame extends SpriteVisualConfig {
  file: string;
  frames: number;
  fps?: number;
  loop?: boolean;
}

export type SpriteSet = Record<EstadoSprite, SpriteFrame>;

export interface SpriteCharacterConfig extends SpriteVisualConfig {
  animations: SpriteSet;
  // false pra arte pintada/de alta resolução (recortada de uma folha
  // custom) — usa upscale suavizado em vez de "imageRendering:
  // pixelated". Default true (mantém o visual blocado original dos
  // packs de pixel art como Knight_1).
  pixelArt?: boolean;
}

export interface BattleSpriteProps {
  className?: string;
  animState?: string;
  stroke?: string;
  flip?: boolean;
  poseOverride?: EstadoSprite;
  fireTint?: boolean;
}

export const DEFAULT_SPRITE_FOLDER = "Knight_1";

/**
 * Cada personagem pode ter um enquadramento padrão e cada animação pode
 * sobrescrever scale/origin/offset. Isso é importante porque as folhas não
 * têm o desenho na mesma posição, mesmo quando todos os frames são 128x128.
 */
export const SPRITE_CONFIGS: Record<string, SpriteCharacterConfig> = {
  Knight_1: {
    scale: 1.6,
    originX: "38%",
    originY: "85%",
    offsetX: 0,
    offsetY: 0,

    animations: {
      idle: {
        file: "Idle.png",
        frames: 4,
        fps: 6,
      },

      attack: {
        file: "Attack 1.png",
        frames: 5,
        fps: 10,
        scale: 1.62,
        originX: "36%",
        originY: "85%",
        offsetX: 3,
      },

      poder: {
        file: "Attack 1.png",
        frames: 5,
        fps: 10,
        scale: 1.62,
        originX: "36%",
        originY: "85%",
        offsetX: 3,
      },

      hurt: {
        file: "Hurt.png",
        frames: 2,
        fps: 8,
        scale: 1.6,
        originX: "38%",
        originY: "85%",
      },

      dead: {
        file: "Dead.png",
        frames: 6,
        fps: 8,
        loop: false,
        scale: 1.5,
        originX: "42%",
        originY: "88%",
        offsetY: 5,
      },

      victory: {
        file: "Idle.png",
        frames: 4,
        fps: 6,
        scale: 1.62,
      },
    },
  },

  "Wanderer Magican": {
    scale: 1.6,
    originX: "50%",
    originY: "85%",
    offsetX: 0,
    offsetY: 0,

    animations: {
      idle: {
        file: "Idle.png",
        frames: 8,
        fps: 7,
      },

      attack: {
        file: "Attack_1.png",
        frames: 7,
        fps: 11,
        scale: 1.62,
        originX: "48%",
        originY: "85%",
      },

      poder: {
        file: "Magic_arrow.png",
        frames: 6,
        fps: 9,
        scale: 1.5,
        originX: "48%",
        originY: "83%",
        offsetX: 2,
      },

      hurt: {
        file: "Hurt.png",
        frames: 4,
        fps: 8,
      },

      dead: {
        file: "Dead.png",
        frames: 4,
        fps: 7,
        loop: false,
        scale: 1.5,
        originX: "50%",
        originY: "88%",
        offsetY: 4,
      },

      victory: {
        file: "Idle.png",
        frames: 8,
        fps: 7,
        scale: 1.62,
      },
    },
  },

  // Minotaur_1/Spider_1/Bandit_1/Cultist_1/Golem_1/Orc_1/Wraith_1/
  // Draconideo_1/Black_Werewolf (os 9 monstros com sprite animado fixo)
  // foram removidos daqui junto com spriteForEnemy.tsx — esses monstros
  // agora usam imagem_url escolhida pelo Admin, igual a todo o resto do
  // catálogo. getSpriteConfig cai em DEFAULT_SPRITE_FOLDER pra qualquer
  // chave desconhecida, então nada quebra se algum encontro antigo ainda
  // tiver uma dessas chaves salva.
};

export function getSpriteConfig(
  pasta?: string | null,
): SpriteCharacterConfig {
  if (pasta && SPRITE_CONFIGS[pasta]) {
    return SPRITE_CONFIGS[pasta];
  }

  return SPRITE_CONFIGS[DEFAULT_SPRITE_FOLDER];
}

export function getSpriteFrame(
  pasta: string | null | undefined,
  estado: EstadoSprite,
): SpriteFrame {
  const config = getSpriteConfig(pasta);

  return config.animations[estado] ?? config.animations.idle;
}

export function getSpriteAnimationDurationMs(
  pasta: string | null | undefined,
  estado: EstadoSprite,
): number {
  const frame = getSpriteFrame(pasta, estado);

  const fps = Math.max(
    1,
    frame.fps ?? 8,
  );

  return Math.max(
    1,
    Math.round(
      (frame.frames / fps) * 1000,
    ),
  );
}

export function estadoSpriteDe(
  animState?: string,
): EstadoSprite {
  const estado = animState ?? "idle";

  if (estado.includes("atacando")) {
    return "attack";
  }

  if (estado.includes("atingido")) {
    return "hurt";
  }

  if (estado.includes("derrota")) {
    return "dead";
  }

  if (estado.includes("vitoria")) {
    return "victory";
  }

  return "idle";
}

export function spriteUrl(
  pasta: string,
  arquivo: string,
) {
  return encodeURI(
    `/${pasta}/${arquivo}`,
  );
}