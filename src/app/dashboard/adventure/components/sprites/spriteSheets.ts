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

  "Fire Wizard": {
    scale: 1.55,
    originX: "50%",
    originY: "85%",
    offsetX: 0,
    offsetY: 0,

    animations: {
      idle: {
        file: "Idle.png",
        frames: 7,
        fps: 7,
      },

      attack: {
        file: "Attack_1.png",
        frames: 4,
        fps: 10,
        scale: 1.58,
        originX: "47%",
        originY: "85%",
      },

      poder: {
        file: "Fireball.png",
        frames: 8,
        fps: 10,
        scale: 1.45,
        originX: "50%",
        originY: "82%",
      },

      hurt: {
        file: "Hurt.png",
        frames: 3,
        fps: 8,
      },

      dead: {
        file: "Dead.png",
        frames: 6,
        fps: 8,
        loop: false,
        scale: 1.48,
        originX: "50%",
        originY: "88%",
        offsetY: 4,
      },

      victory: {
        file: "Idle.png",
        frames: 7,
        fps: 7,
        scale: 1.58,
      },
    },
  },

  "Lightning Mage": {
    scale: 1.55,
    originX: "50%",
    originY: "85%",
    offsetX: 0,
    offsetY: 0,

    animations: {
      idle: {
        file: "Idle.png",
        frames: 7,
        fps: 7,
      },

      attack: {
        file: "Attack_2.png",
        frames: 4,
        fps: 10,
        scale: 1.58,
        originX: "48%",
        originY: "85%",
      },

      poder: {
        file: "Light_ball.png",
        frames: 7,
        fps: 10,
        scale: 1.46,
        originX: "50%",
        originY: "82%",
      },

      hurt: {
        file: "Hurt.png",
        frames: 3,
        fps: 8,
      },

      dead: {
        file: "Dead.png",
        frames: 5,
        fps: 8,
        loop: false,
        scale: 1.48,
        originX: "50%",
        originY: "88%",
        offsetY: 4,
      },

      victory: {
        file: "Idle.png",
        frames: 7,
        fps: 7,
        scale: 1.58,
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

  "Mago Aventureiro": {
    scale: 1.6,
    originX: "50%",
    originY: "88%",
    offsetX: 0,
    offsetY: 0,

    animations: {
      idle: {
        file: "Idle.png",
        frames: 4,
        fps: 6,
      },

      attack: {
        file: "Attack_1.png",
        frames: 5,
        fps: 9,
      },

      poder: {
        file: "Magic_arrow.png",
        frames: 4,
        fps: 8,
      },

      hurt: {
        file: "Hurt.png",
        frames: 3,
        fps: 7,
      },

      dead: {
        file: "Dead.png",
        frames: 5,
        fps: 6,
        loop: false,
      },

      victory: {
        file: "Victory.png",
        frames: 1,
        fps: 1,
      },
    },
  },

  Minotaur_1: {
    scale: 1.45,
    originX: "50%",
    originY: "86%",
    offsetX: 0,
    offsetY: 0,

    animations: {
      idle: {
        file: "Idle.png",
        frames: 10,
        fps: 8,
        scale: 1.45,
      },

      attack: {
        file: "Attack.png",
        frames: 5,
        fps: 9,
        scale: 1.5,
        originX: "48%",
        originY: "86%",
        offsetX: -2,
      },

      poder: {
        file: "Attack.png",
        frames: 5,
        fps: 9,
        scale: 1.5,
        originX: "48%",
        originY: "86%",
        offsetX: -2,
      },

      hurt: {
        file: "Hurt.png",
        frames: 3,
        fps: 8,
        scale: 1.45,
      },

      dead: {
        file: "Dead.png",
        frames: 5,
        fps: 7,
        loop: false,
        scale: 1.35,
        originX: "50%",
        originY: "90%",
        offsetY: 6,
      },

      victory: {
        file: "Idle.png",
        frames: 10,
        fps: 8,
        scale: 1.48,
      },
    },
  },

  // Frames contados a partir do tamanho real de cada folha em
  // public/Black_Werewolf (128px de altura por frame, largura total /
  // 128 = quantidade de frames) — sem essa config, WolfSprite caía no
  // fallback de Knight_1 (getSpriteConfig) e fatiava a folha errada.
  Black_Werewolf: {
    scale: 1.5,
    originX: "50%",
    originY: "82%",
    offsetX: 0,
    offsetY: 0,

    animations: {
      idle: {
        file: "Idle.png",
        frames: 8,
        fps: 8,
      },

      attack: {
        file: "Attack_1.png",
        frames: 6,
        fps: 10,
      },

      poder: {
        file: "Attack_2.png",
        frames: 4,
        fps: 10,
      },

      hurt: {
        file: "Hurt.png",
        frames: 2,
        fps: 8,
      },

      dead: {
        file: "Dead.png",
        frames: 2,
        fps: 6,
        loop: false,
      },

      victory: {
        file: "Idle.png",
        frames: 8,
        fps: 8,
      },
    },
  },
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