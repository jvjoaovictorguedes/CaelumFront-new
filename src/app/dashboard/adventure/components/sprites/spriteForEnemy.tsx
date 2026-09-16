import EnemySprite from "./EnemySprite";
import MinotauroSprite from "./MinotauroSprite";

// Mesmo critério de spriteForClass.tsx, só que pelo nome do inimigo em
// vez da classe: a maioria ainda cai no SVG genérico, mas dá pra ir
// plugando ilustrações de verdade por tipo de monstro (como o
// Minotauro) sem mexer no resto do combate.
export function spriteForEnemy(nomeInimigo?: string) {
  const nome = (nomeInimigo ?? "").toLowerCase();
  if (nome.includes("minotauro") || nome.includes("minotaur")) {
    return MinotauroSprite;
  }
  return EnemySprite;
}
