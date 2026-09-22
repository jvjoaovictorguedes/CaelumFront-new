/**
 * Fundos de batalha compartilhados entre a Aventura e o PvP.
 *
 * A Aventura (CombatArena.tsx) escolhe o fundo pelo MONSTRO/ZONA — lá o
 * cenário faz parte da ficção do combate. No PvP não existe monstro nem
 * zona, então o fundo é sorteado de um pool (pedido explícito do usuário:
 * "a batalha em pvp deverá ser igual a aventura de hoje, com o fundo mas
 * aleatório, não precisa ser de monstro").
 *
 * O sorteio precisa ser ESTÁVEL por duelo — se fosse `Math.random()` no
 * corpo do componente, cada turno (cada re-render) trocaria o cenário no
 * meio da luta. Por isso `fundoDeBatalhaPorSemente` é determinístico a
 * partir do id do duelo: o mesmo duelo sempre cai no mesmo fundo, inclusive
 * entre os dois jogadores (os dois veem a mesma arena) e depois de um
 * reload/reconexão.
 */

/** Reaproveita a arte já existente em public/images/backgrounds/. */
export const BATTLE_BACKGROUNDS = [
  "/images/backgrounds/acampamento-orc.jpg",
  "/images/backgrounds/altar-cultos.jpg",
  "/images/backgrounds/covil-minotauro.jpg",
  "/images/backgrounds/cripta-espectral.jpg",
  "/images/backgrounds/ninho-aranhas.jpg",
  "/images/backgrounds/selva-teste.jpg",
  "/images/backgrounds/templo-ancestral-golem.jpg",
  "/images/backgrounds/terras-devastadas.jpg",
] as const;

/**
 * Hash inteiro simples (variação de djb2) — só precisa espalhar bem ids
 * sequenciais de duelo entre os fundos, nada criptográfico.
 */
function hashDeSemente(semente: string | number): number {
  const texto = String(semente);
  let hash = 5381;
  for (let i = 0; i < texto.length; i += 1) {
    hash = (hash * 33) ^ texto.charCodeAt(i);
  }
  return Math.abs(hash);
}

/**
 * Fundo determinístico a partir de uma semente (normalmente o `duelId`).
 * Sem semente, sorteia de verdade — útil pra telas de preview.
 */
export function fundoDeBatalhaPorSemente(semente?: string | number | null): string {
  if (semente === undefined || semente === null || semente === "") {
    return BATTLE_BACKGROUNDS[Math.floor(Math.random() * BATTLE_BACKGROUNDS.length)];
  }
  return BATTLE_BACKGROUNDS[hashDeSemente(semente) % BATTLE_BACKGROUNDS.length];
}
