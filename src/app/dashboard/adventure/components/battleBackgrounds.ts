// Fundo de tela da batalha de Aventura (solo e em grupo) — extraído de
// CombatArena.tsx pra não duplicar as duas tabelas em cada arena que
// precisa da mesma prioridade monstro > zona.imagem_url > zona pelo nome.
export const FUNDO_POR_ZONA: Record<string, string> = {
  "Bosque de Sussurros": "/images/backgrounds/selva-teste.jpg",
  "Terras Devastadas": "/images/backgrounds/terras-devastadas.jpg",
};

export const FUNDO_POR_MONSTRO: Record<string, string> = {
  "Espectro Sussurrante": "/images/backgrounds/cripta-espectral.jpg",
  "Bandido Errante": "/images/backgrounds/terras-devastadas.jpg",
  "Golem de Pedra": "/images/backgrounds/templo-ancestral-golem.jpg",
  Minotauro: "/images/backgrounds/covil-minotauro.jpg",
  "Aranha Venenosa": "/images/backgrounds/ninho-aranhas.jpg",
  "Cultista Renegado": "/images/backgrounds/altar-cultos.jpg",
  "Orc Guerreiro": "/images/backgrounds/acampamento-orc.jpg",
};

// Prioridade: fundo específico do monstro atual > imagem_url vinda do
// servidor > fundo padrão da zona pelo nome > null (gradiente padrão).
export function fundoDeBatalha({
  nomeMonstro,
  nomeZona,
  imagemUrlZona,
}: {
  nomeMonstro?: string | null;
  nomeZona?: string | null;
  imagemUrlZona?: string | null;
}): string | null {
  return (
    (nomeMonstro ? FUNDO_POR_MONSTRO[nomeMonstro] : undefined) ||
    imagemUrlZona ||
    (nomeZona ? FUNDO_POR_ZONA[nomeZona] : undefined) ||
    null
  );
}
