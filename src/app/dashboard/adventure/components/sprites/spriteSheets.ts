export interface SpriteFrame {
  file: string;
  frames: number;
  fps?: number;
  loop?: boolean;
}

export type EstadoSprite =
  | "idle"
  | "attack"
  | "poder"
  | "hurt"
  | "dead"
  | "victory";

export type SpriteSet = Record<EstadoSprite, SpriteFrame>;

export interface SpriteOrigin {
  x: string;
  y: string;
  zoom?: number;
  bgHeight?: string;
}

export const SPRITE_ORIGINS: Record<string, SpriteOrigin> = {
  Knight_1: { x: "38%", y: "85%" },
  "Fire Wizard": { x: "50%", y: "85%" },
  "Lightning Mage": { x: "50%", y: "85%" },
  "Wanderer Magican": { x: "50%", y: "85%" },
  Minotaur: { x: "27%", y: "40%", zoom: 2, bgHeight: "73%" },
};

export const SPRITE_SETS: Record<string, SpriteSet> = {
  Knight_1: {
    idle: { file: "Idle.png", frames: 4, fps: 6 },
    attack: { file: "Attack 1.png", frames: 5, fps: 10 },
    poder: { file: "Attack 1.png", frames: 5, fps: 10 },
    hurt: { file: "Hurt.png", frames: 2, fps: 8 },
    dead: { file: "Hurt.png", frames: 2, fps: 4, loop: false },
    victory: { file: "Idle.png", frames: 4, fps: 6 },
  },
  "Fire Wizard": {
    idle: { file: "Idle.png", frames: 7, fps: 7 },
    attack: { file: "Attack_1.png", frames: 4, fps: 10 },
    poder: { file: "Fireball.png", frames: 8, fps: 10 },
    hurt: { file: "Hurt.png", frames: 3, fps: 8 },
    dead: { file: "Hurt.png", frames: 3, fps: 4, loop: false },
    victory: { file: "Idle.png", frames: 7, fps: 7 },
  },
  "Lightning Mage": {
    idle: { file: "Idle.png", frames: 7, fps: 7 },
    attack: { file: "Attack_2.png", frames: 4, fps: 10 },
    poder: { file: "Light_ball.png", frames: 7, fps: 10 },
    hurt: { file: "Hurt.png", frames: 3, fps: 8 },
    dead: { file: "Hurt.png", frames: 3, fps: 4, loop: false },
    victory: { file: "Idle.png", frames: 7, fps: 7 },
  },
  "Wanderer Magican": {
    idle: { file: "Idle.png", frames: 8, fps: 7 },
    attack: { file: "Attack_1.png", frames: 7, fps: 11 },
    poder: { file: "Magic_arrow.png", frames: 6, fps: 9 },
    hurt: { file: "Hurt.png", frames: 4, fps: 8 },
    dead: { file: "Hurt.png", frames: 4, fps: 4, loop: false },
    victory: { file: "Idle.png", frames: 8, fps: 7 },
  },
  Minotaur: {
    idle: { file: "Idle.png", frames: 10, fps: 7 },
    attack: { file: "Attack.png", frames: 5, fps: 10 },
    poder: { file: "Attack.png", frames: 5, fps: 10 },
    hurt: { file: "Hurt.png", frames: 3, fps: 8 },
    dead: { file: "Dead.png", frames: 5, fps: 4, loop: false },
    victory: { file: "Idle.png", frames: 10, fps: 7 },
  },
};

export function estadoSpriteDe(animState?: string): EstadoSprite {
  const s = animState ?? "idle";
  if (s.includes("atacando")) return "attack";
  if (s.includes("atingido")) return "hurt";
  if (s.includes("derrota")) return "dead";
  if (s.includes("vitoria")) return "victory";
  return "idle";
}

export function spriteUrl(pasta: string, arquivo: string) {
  return encodeURI(`/${pasta}/${arquivo}`);
}