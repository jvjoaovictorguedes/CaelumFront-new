// Config das folhas de sprite reais (public/Knight_1, public/Fire Wizard,
// public/Lightning Mage, public/Wanderer Magican). Cada arquivo é uma tira
// horizontal de frames quadrados de 128x128 — `frames` é só
// largura-total/128, contado direto na imagem. Guerreiro usa sempre
// Knight_1; Mago usa sempre Wanderer Magican (as outras duas pastas de
// mago, Fire Wizard/Lightning Mage, ficam disponíveis aqui pra quando
// alguém quiser variar por elemento, mas não estão plugadas em lugar
// nenhum ainda).
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

// Cada frame de 128x128 tem bastante espaço vazio em volta do personagem
// (pra caber o alcance do golpe/queda), então o zoom crop precisa saber
// onde o "chão" dele fica dentro do frame — Knight fica encostado à
// esquerda, os magos ficam centralizados. Ver AnimatedSpriteSheet.tsx.
export interface SpriteOrigin {
  x: string;
  y: string;
}

export const SPRITE_ORIGINS: Record<string, SpriteOrigin> = {
  Knight_1: { x: "38%", y: "85%" },
  "Fire Wizard": { x: "50%", y: "85%" },
  "Lightning Mage": { x: "50%", y: "85%" },
  "Wanderer Magican": { x: "50%", y: "85%" },
};

// "dead"/"victory" usam os arquivos de Hurt/Idle em vez de Dead/Jump de
// propósito: Dead.png e Jump.png derrubam/levantam o personagem de um
// jeito que sai da área da folha ajustada pro zoom (ponto de origem em
// SPRITE_ORIGINS, calibrado pra pose parada) — o corpo ficava cortado fora
// da caixa. O efeito de "derrota" (gira, apaga) e "vitória" (pula, cresce)
// já vem de fora via anim-derrota/anim-vitoria (globals.css, aplicadas no
// wrapper), então a arte interna só precisa continuar numa pose que caiba
// bem no crop.
export const SPRITE_SETS: Record<string, SpriteSet> = {
  Knight_1: {
    idle: { file: "Idle.png", frames: 4, fps: 6 },
    attack: { file: "Attack 1.png", frames: 5, fps: 10 },
    // Guerreiro não conjura — poder ainda é um golpe físico, reaproveita
    // o mesmo frame do ataque básico.
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
    // Pose de conjuração (arremesso de energia) — usada quando o jogador
    // usa um poder em vez do ataque básico. Com fireTint vira o visual da
    // Bola de Fogo, sem precisar de um asset novo.
    poder: { file: "Magic_arrow.png", frames: 6, fps: 9 },
    hurt: { file: "Hurt.png", frames: 4, fps: 8 },
    dead: { file: "Hurt.png", frames: 4, fps: 4, loop: false },
    victory: { file: "Idle.png", frames: 8, fps: 7 },
  },
};

// Mesmo mapeamento de estado usado nas classes CSS anim-* (globals.css) —
// só que aqui decide qual frame da folha de sprite mostrar, em vez de qual
// transform aplicar. As duas coisas rodam em paralelo: o wrapper de fora
// continua com battle-sprite/anim-* (dash, hit, dodge), o sprite de dentro
// só troca de figura.
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
